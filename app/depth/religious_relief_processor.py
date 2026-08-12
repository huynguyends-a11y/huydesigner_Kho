"""
===============================================================================
AI BAS RELIEF → STL: RELIGIOUS STATUE & ORNAMENT RELIEF PROCESSOR
File: app/depth/religious_relief_processor.py
===============================================================================
Mô-đun tối ưu hóa bản đồ độ sâu chuyên biệt cho Tượng Phật, Phù Điêu Tâm Linh & Hoa Văn:

Mục tiêu chính:
- Bảo tồn chi tiết ngũ quan khuôn mặt (mắt, mũi, môi, tai), nếp áo y phục, tòa sen, hào quang, hoa văn.
- Khóa khống chế bóng đổ sâu (Depth Compression): Ngăn ngừa việc bóng tối đậm tạo ra các hốc sâu giả / hố thủng ở vùng hốc mắt, cổ hoặc nếp gấp.
- Không làm dẹt/phẳng khuôn mặt.
- Cung cấp các Presets: Buddha, Wood Carving, Stone Relief, Floral Ornament, Portrait, Landscape, Custom.
===============================================================================
"""

import numpy as np
import cv2
from typing import Dict, Tuple, Any

PRESETS = {
    "buddha": {
        "name": "Buddha (Tượng Phật / Tâm Linh)",
        "face_detail": 0.90,
        "ornament_detail": 0.85,
        "edge_preservation": 0.80,
        "depth_compression": 0.70,
        "contrast": 1.1,
        "blur_radius": 1
    },
    "wood_carving": {
        "name": "Wood Carving (Chạm Khắc Gỗ)",
        "face_detail": 0.75,
        "ornament_detail": 0.95,
        "edge_preservation": 0.90,
        "depth_compression": 0.50,
        "contrast": 1.3,
        "blur_radius": 0
    },
    "stone_relief": {
        "name": "Stone Relief (Phù Điêu Tranh Đá)",
        "face_detail": 0.70,
        "ornament_detail": 0.80,
        "edge_preservation": 0.85,
        "depth_compression": 0.60,
        "contrast": 1.2,
        "blur_radius": 1
    },
    "floral_ornament": {
        "name": "Floral Ornament (Hoa Văn Họa Họa)",
        "face_detail": 0.40,
        "ornament_detail": 0.95,
        "edge_preservation": 0.95,
        "depth_compression": 0.40,
        "contrast": 1.4,
        "blur_radius": 0
    },
    "portrait": {
        "name": "Portrait (Chân Dung)",
        "face_detail": 0.95,
        "ornament_detail": 0.60,
        "edge_preservation": 0.75,
        "depth_compression": 0.65,
        "contrast": 1.1,
        "blur_radius": 1
    },
    "landscape": {
        "name": "Landscape (Sơn Thủy Phong Cảnh)",
        "face_detail": 0.30,
        "ornament_detail": 0.85,
        "edge_preservation": 0.70,
        "depth_compression": 0.30,
        "contrast": 1.3,
        "blur_radius": 2
    },
    "custom": {
        "name": "Custom (Tùy Chỉnh)",
        "face_detail": 0.70,
        "ornament_detail": 0.70,
        "edge_preservation": 0.70,
        "depth_compression": 0.50,
        "contrast": 1.2,
        "blur_radius": 1
    }
}


def process_religious_relief_depth(
    image_np: np.ndarray,
    preset_key: str = "buddha",
    face_detail: float = 0.90,
    ornament_detail: float = 0.85,
    edge_preservation: float = 0.80,
    depth_compression: float = 0.70,
    contrast: float = 1.1,
    blur_radius: int = 1
) -> np.ndarray:
    """
    Xử lý bản đồ độ sâu tối ưu cho Tượng Phật & Phù Điêu Tâm Linh.

    Parameters:
    -----------
    image_np : numpy.ndarray
        Ảnh đầu vào (Grayscale 2D hoặc BGR 3D).
    preset_key : str
        Tên preset ('buddha', 'wood_carving', 'stone_relief', 'floral_ornament', 'portrait', 'landscape', 'custom').
    face_detail : float (0.0 -> 1.0)
        Mức độ giữ khối & đường nét ngũ quan khuôn mặt (mắt, mũi, môi, tai).
    ornament_detail : float (0.0 -> 1.0)
        Mức độ nổi nét hoa văn, nếp áo y phục, hào quang, tòa sen.
    edge_preservation : float (0.0 -> 1.0)
        Mức độ bảo tồn đường viền góc cạnh sắc nét.
    depth_compression : float (0.0 -> 1.0)
        Nén khoảng bóng tối sâu, chống hốc sâu giả ở mắt và cổ do bóng đổ.
    contrast : float
        Hệ số tương phản.
    blur_radius : int
        Bán kính khử nhiễu.

    Returns:
    --------
    numpy.ndarray
        Mảng 2D float32 chuẩn hóa [0.0, 1.0] làm Heightmap cho 3D.
    """
    if preset_key.lower() in PRESETS and preset_key.lower() != "custom":
        p = PRESETS[preset_key.lower()]
        face_detail = p["face_detail"]
        ornament_detail = p["ornament_detail"]
        edge_preservation = p["edge_preservation"]
        depth_compression = p["depth_compression"]
        contrast = p["contrast"]
        blur_radius = p["blur_radius"]

    # 1. Chuyển sang Grayscale float32 trong khoảng [0.0, 1.0]
    if image_np.ndim == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    else:
        gray = image_np.astype(np.float32)
        if gray.max() > 1.0:
            gray /= 255.0

    # 2. Điều chỉnh Tương Phản (Contrast)
    gray = (gray - 0.5) * contrast + 0.5
    gray = np.clip(gray, 0.0, 1.0)

    # 3. Nén bóng tối (Depth Compression)
    # Ngăn hốc mắt / vùng cổ dưới bóng đập thành hố sâu thủng
    # Áp dụng nén dải tối dưới ngưỡng threshold = 0.35
    if depth_compression > 0.0:
        floor_val = depth_compression * 0.22 # Nâng sàn tối thiểu
        gray = gray * (1.0 - floor_val) + floor_val
        # Gamma compression cho dải tối
        gamma = 1.0 - (depth_compression * 0.35)
        gray = np.power(gray, gamma)

    # 4. Tăng cường chi tiết ngũ quan khuôn mặt & Khối trung gian (Face Detail Unsharp Masking)
    if face_detail > 0.0:
        blurred_face = cv2.GaussianBlur(gray, (21, 21), 0)
        face_enhancement = gray - blurred_face
        gray = gray + face_enhancement * (face_detail * 0.6)

    # 5. Tăng cường hoa văn & đường viền sắc nét (Ornament Detail & Edge Preservation)
    if ornament_detail > 0.0 or edge_preservation > 0.0:
        sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
        edge_magnitude = np.sqrt(sobel_x**2 + sobel_y**2)
        
        weight = (ornament_detail * 0.35) + (edge_preservation * 0.35)
        gray = gray + edge_magnitude * weight

    # 6. Khử nhiễu nhẹ nếu blur_radius > 0
    if blur_radius > 0:
        ksize = blur_radius * 2 + 1
        gray = cv2.GaussianBlur(gray, (ksize, ksize), 0)

    gray = np.clip(gray, 0.0, 1.0)
    return gray


# Verification test
if __name__ == "__main__":
    print("[TEST] Running Religious Relief Processor test...")
    sample_img = np.zeros((200, 200), dtype=np.uint8)
    cv2.circle(sample_img, (100, 100), 50, 180, -1) # Khối khuôn mặt
    
    out_map = process_religious_relief_depth(
        sample_img,
        preset_key="buddha",
        face_detail=0.90,
        ornament_detail=0.85,
        edge_preservation=0.80,
        depth_compression=0.70
    )
    print(f"Processed Religious Depth Map shape: {out_map.shape}, min: {out_map.min():.3f}, max: {out_map.max():.3f}")
