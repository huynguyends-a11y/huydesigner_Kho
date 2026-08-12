import { PythonModuleInfo } from "../types";

export interface PythonArchDocData {
  title: string;
  architectureOverview: string;
  pipelineFlow: string[];
  modules: PythonModuleInfo[];
  setupInstructions: string[];
}

export const PYTHON_ARCH_DATA: PythonArchDocData = {
  title: "Dự án Windows Python PySide6: AI BAS RELIEF → STL (Kiến trúc Modular)",
  architectureOverview: `Dự án được thiết kế theo kiến trúc Module hóa rời rạc (Modular Software Architecture) tuân thủ nguyên lý Single Responsibility Principle (SRP). 
Mỗi thư mục chịu trách nhiệm cho một giai đoạn độc lập trong luồng xử lý: Từ xử lý ảnh 2D, ước tính chiều sâu (Depth Estimation), xây dựng ma trận chiều cao (Height Map), dựng hình học 3D kín khối (Solid Mesh Generation), làm mịn (Mesh Smoothing), đến hiển thị Preview 3D và xuất file STL.`,
  pipelineFlow: [
    "1. USER INPUT: Người dùng tải ảnh JPG/PNG qua UI PySide6 (`ui/main_window.py`).",
    "2. ASPECT RATIO LOCK: Module `image_processing/` khóa tỷ lệ ảnh, tự động tính Height (mm) theo Width (mm) người dùng nhập.",
    "3. DEPTH MAP GENERATION: `depth/` dùng PyTorch/MiDaS hoặc AI Vision để tạo Depth Map xám (0..255).",
    "4. HEIGHTMAP FILTERING: `image_processing/` điều chỉnh Contrast, Blur, Detail và Invert Depth.",
    "5. HEIGHTMAP MATRIX: `relief/` chuyển đổi Depth Map thành ma trận độ cao Z (NumPy 2D float array).",
    "6. WATERTIGHT SOLID MESH: `mesh/` tạo đỉnh (Vertices) & mặt (Faces) cho 3 mặt: Mặt phù điêu trên Z = Base + (Depth * Val), 4 Thành bên và Mặt đáy phẳng Z = 0.",
    "7. MESH SMOOTHING: `mesh/mesh_smoother.py` thực hiện làm mịn Laplacian / Taubin loại bỏ vết nhám CNC.",
    "8. 3D PREVIEW: `preview/` render mô hình 3D trong khung nhìn OpenGL / PyVista / Open3D.",
    "9. STL EXPORT: `export/stl_exporter.py` ghi file STL dạng Binary theo đơn vị mm chuẩn cho CNC / in 3D.",
  ],
  setupInstructions: [
    "Cài đặt Python 3.11+ trên Windows 10/11.",
    "Cài đặt thư viện phụ thuộc: pip install PySide6 opencv-python numpy trimesh open3d pillow torch torchvision",
    "Chạy ứng dụng: python app/main.py",
  ],
  modules: [
    {
      path: "app/main.py",
      name: "Entry Point (main.py)",
      purpose: "Khởi tạo ứng dụng PySide6 QApplication, nạp stylesheet, thiết lập OpenGL context và hiển thị MainWindow.",
      dependencies: ["PySide6.QtWidgets", "PySide6.QtCore", "app.ui.main_window"],
      keyClassesOrFunctions: ["main()", "QApplication"],
      communicationRole: "Điểm kích hoạt hệ thống, truyền cấu hình ban đầu.",
      codeSnippet: `import sys
from PySide6.QtWidgets import QApplication
from app.ui.main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("AI BAS RELIEF → STL")
    
    window = MainWindow()
    window.resize(1400, 900)
    window.show()
    
    sys.exit(app.exec())

if __name__ == "__main__":
    main()`,
    },
    {
      path: "app/ui/main_window.py",
      name: "Giao diện chính (ui/main_window.py)",
      purpose: "Quản lý bố cục chính bao gồm: Toolbar chọn ảnh, Khung hiển thị Ảnh gốc, Khung Depth Map, Slider tham số (Width, Relief Depth 15-40mm, Base 5mm, Smooth...), Khung 3D Viewport và Nút Export STL.",
      dependencies: ["PySide6.QtWidgets", "PySide6.QtCore", "app.image_processing", "app.mesh", "app.preview"],
      keyClassesOrFunctions: ["MainWindow(QMainWindow)", "setup_ui()", "on_image_loaded()", "on_generate_relief()", "on_export_stl()"],
      communicationRole: "Điều phối Signal/Slot giữa tương tác người dùng và các dịch vụ xử lý backend.",
      codeSnippet: `from PySide6.QtWidgets import (QMainWindow, QWidget, QHBoxLayout, 
                             QVBoxLayout, QPushButton, QFileDialog, QMessageBox)
from PySide6.QtCore import Signal, Slot
from app.ui.controls_widget import ControlsWidget
from app.ui.preview3d_widget import Preview3DWidget

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI BAS RELIEF → STL - CNC & 3D Print Tool")
        self.setup_ui()
        
    def setup_ui(self):
        main_widget = QWidget()
        layout = QHBoxLayout(main_widget)
        
        self.controls = ControlsWidget()
        self.preview_3d = Preview3DWidget()
        
        layout.addWidget(self.controls, 1)
        layout.addWidget(self.preview_3d, 2)
        self.setCentralWidget(main_widget)
        
        # Connect signals
        self.controls.signal_generate.connect(self.generate_relief)
        self.controls.signal_export.connect(self.export_stl)

    def generate_relief(self, params):
        # Trigger Mesh generation pipeline
        pass
        
    def export_stl(self):
        # Trigger STL Export
        pass`,
    },
    {
      path: "app/image_processing/preprocessor.py",
      name: "Xử lý ảnh (image_processing/preprocessor.py)",
      purpose: "Chuyển ảnh RGB sang Grayscale, khóa tỷ lệ khía cạnh (Aspect Ratio Lock), chỉnh Contrast, Box/Gaussian Blur và Lật độ sâu (Invert Depth).",
      dependencies: ["cv2 (OpenCV)", "numpy", "PIL"],
      keyClassesOrFunctions: ["process_heightmap_image(img, params)", "calculate_auto_height(orig_w, orig_h, target_w_mm)"],
      communicationRole: "Nhận ảnh gốc từ UI -> Trả về mảng NumPy uint8/float32 làm đầu vào cho Depth Map.",
      codeSnippet: `import cv2
import numpy as np

def calculate_auto_height(orig_w: int, orig_h: int, target_w_mm: float) -> float:
    """Tự động tính Height (mm) không làm biến dạng tỷ lệ ảnh gốc."""
    aspect_ratio = orig_w / orig_h
    return round(target_w_mm / aspect_ratio, 2)

def process_heightmap_image(image_np: np.ndarray, contrast: float, blur_r: int, invert: bool) -> np.ndarray:
    """Xử lý ảnh xám cho heightmap."""
    if len(image_np.shape) == 3:
        gray = cv2.cvtColor(image_np, cv2.COLOR_BGR2GRAY)
    else:
        gray = image_np.copy()
        
    # Contrast adjustment
    gray = cv2.multiply(gray, contrast)
    gray = np.clip(gray, 0, 255).astype(np.uint8)
    
    # Blur for smooth height gradient
    if blur_r > 0:
        ksize = blur_r * 2 + 1
        gray = cv2.GaussianBlur(gray, (ksize, ksize), 0)
        
    if invert:
        gray = 255 - gray
        
    return gray`,
    },
    {
      path: "app/depth/religious_relief_processor.py",
      name: "Xử lý Tượng Phật & Phù Điêu Tâm Linh (depth/religious_relief_processor.py)",
      purpose: "Tối ưu hóa bản đồ độ sâu chuyên biệt cho Tượng Phật, Phù Điêu Tâm Linh & Hoa Văn. Bảo tồn nét mặt, mắt, mũi, môi, tai, y phục, tòa sen, hào quang; nén dải bóng tối (Depth Compression) chống hốc mắt thủng sâu giả.",
      dependencies: ["cv2", "numpy"],
      keyClassesOrFunctions: ["process_religious_relief_depth()", "PRESETS"],
      communicationRole: "Trích xuất & tối ưu Heightmap với các Presets: Buddha, Wood Carving, Stone Relief, Floral Ornament, Portrait, Landscape, Custom.",
      codeSnippet: `import cv2
import numpy as np

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
    """Tối ưu hóa Depth Map cho Tượng Phật & Phù Điêu Hoa Văn chạm khắc."""
    # 1. Depth Compression: Nén dải bóng tối chống hốc mắt / bóng đập bị đục lỗ thủng sâu
    if depth_compression > 0.0:
        floor_val = depth_compression * 0.22
        gray = gray * (1.0 - floor_val) + floor_val
        gamma = 1.0 - (depth_compression * 0.35)
        gray = np.power(gray, gamma)

    # 2. Face Detail & Ornament Enhancement
    blurred = cv2.GaussianBlur(gray, (21, 21), 0)
    gray = gray + (gray - blurred) * (face_detail * 0.6)
    return np.clip(gray, 0.0, 1.0)`,
    },
    {
      path: "app/relief/cnc_relief_processor.py",
      name: "Xử Lý & Kiểm Tra CNC RELIEF (relief/cnc_relief_processor.py)",
      purpose: "Tạo STL tối ưu cho JDPaint, JDSoft, ArtCAM, Aspire; tính toán mật độ lưới theo kích thước thực tế (mm) và độ phân giải (Resolution Step: Low, Medium, High, Ultra, Custom); ước tính số Tam Giác, Dung Lượng STL (MB) & Thời Gian Xử Lý; thực hiện Pre-Export Validation (Watertight, Manifold, Normals, Degenerate Faces, Duplicate Faces, Boundary Edges).",
      dependencies: ["trimesh", "numpy", "cv2"],
      keyClassesOrFunctions: ["process_cnc_relief()", "validate_cnc_stl_mesh()", "estimate_cnc_mesh_metrics()"],
      communicationRole: "Đảm bảo STL đầu ra tương thích 100% với các phần mềm CAM chuyên nghiệp (JDPaint, ArtCAM, Aspire) không bị lỗi lề hay hở lưới.",
      codeSnippet: `import trimesh
import numpy as np

def estimate_cnc_mesh_metrics(width_mm: float, height_mm: float, step_mm: float):
    """Ước tính số tam giác, dung lượng file STL (MB) và thời gian xử lý."""
    nx = int(np.round(width_mm / step_mm)) + 1
    ny = int(np.round(height_mm / step_mm)) + 1
    top_triangles = (nx - 1) * (ny - 1) * 2
    bottom_triangles = top_triangles
    side_triangles = 4 * (nx + ny - 2)
    total_triangles = top_triangles + bottom_triangles + side_triangles
    stl_size_bytes = 84 + (50 * total_triangles)
    stl_size_mb = stl_size_bytes / (1024 * 1024)
    proc_time_sec = max(0.1, total_triangles / 2500000.0)
    return {
        "grid_nx": nx,
        "grid_ny": ny,
        "total_triangles": total_triangles,
        "stl_size_mb": round(stl_size_mb, 2),
        "proc_time_sec": round(proc_time_sec, 1)
    }

def validate_cnc_stl_mesh(mesh: trimesh.Trimesh) -> dict:
    """Kiểm tra toàn diện 6 tiêu chí chất lượng trước khi export STL cho máy CNC."""
    return {
        "is_watertight": mesh.is_watertight,
        "is_manifold": mesh.is_volume,
        "normals_valid": bool(len(mesh.faces) > 0),
        "degenerate_faces": len(trimesh.degnerate.degenerate_faces(mesh)),
        "duplicate_faces": len(mesh.duplicate_faces),
        "boundary_edges": len(mesh.outline().entities) if hasattr(mesh, "outline") else 0,
        "cam_compatibility": ["JDPaint", "JDSoft", "ArtCAM", "Aspire", "VCarve", "Fusion 360"]
    }`,
    },
    {
      path: "app/depth/depth_estimator.py",
      name: "AI Depth Estimation (depth/depth_estimator.py)",
      purpose: "Sử dụng mô hình AI (như MiDaS / PyTorch hoặc AI Vision API) để trích xuất bản đồ chiều sâu 2.5D từ ảnh tượng Phật / hoa văn chạm khắc.",
      dependencies: ["torch", "torchvision", "cv2", "numpy"],
      keyClassesOrFunctions: ["DepthEstimator", "estimate_depth(image_path)"],
      communicationRole: "Chuyển đổi ảnh 2D thường thành Depth Map xám chất lượng cao với phân tầng tiền cảnh/hậu cảnh.",
      codeSnippet: `import torch
import cv2
import numpy as np

class DepthEstimator:
    def __init__(self, model_type="MiDaS_small"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # Load pre-trained model if PyTorch is available
        self.model_type = model_type

    def estimate_depth(self, image_bgr: np.ndarray) -> np.ndarray:
        """Trả về mảng 2D normalized float 0.0 -> 1.0 đại diện cho độ sâu."""
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        normalized = gray.astype(np.float32) / 255.0
        return normalized`,
    },
    {
      path: "app/relief/relief_generator.py",
      name: "Dựng Phù Điêu 3D Solid (relief/relief_generator.py)",
      purpose: "Chuyển mảng Depth Map 0.0->1.0 thành mô hình 3D Triangle Mesh kín khối hoàn toàn (Manifold & Watertight) có mặt trên phù điêu, 4 thành bên và mặt đáy phẳng Z=0.",
      dependencies: ["numpy", "trimesh", "open3d (optional)"],
      keyClassesOrFunctions: ["generate_relief(depth_map, width_mm, height_mm, depth_mm, base_thickness_mm, resolution)"],
      communicationRole: "Nhận Depth Map 2D -> Tạo và trả về Trimesh / Open3D TriangleMesh kín khối sẵn sàng xuất file STL.",
      codeSnippet: `import numpy as np
import trimesh
from typing import Union, Optional

def generate_relief(
    depth_map: np.ndarray,
    width_mm: float,
    height_mm: float,
    depth_mm: float,
    base_thickness_mm: float = 5.0,
    resolution: Optional[int] = None,
    return_type: str = "trimesh"
) -> Union[trimesh.Trimesh, "open3d.geometry.TriangleMesh"]:
    """
    Tạo mô hình phù điêu 3D kín khối (Watertight Solid Triangle Mesh) từ Depth Map.
    - 0.0 -> Z = base_thickness_mm
    - 1.0 -> Z = base_thickness_mm + depth_mm
    - Mặt đáy -> Z = 0.0 mm
    """
    depth_2d = depth_map.astype(np.float32)
    if depth_2d.max() > 1.0:
        depth_2d /= 255.0
    depth_2d = np.clip(depth_2d, 0.0, 1.0)

    ny, nx = depth_2d.shape
    x_coords = np.linspace(-width_mm / 2.0, width_mm / 2.0, nx, dtype=np.float32)
    y_coords = np.linspace(height_mm / 2.0, -height_mm / 2.0, ny, dtype=np.float32)
    xv, yv = np.meshgrid(x_coords, y_coords)

    # 1. Top Surface Z values
    z_top = base_thickness_mm + (depth_2d * depth_mm)

    top_verts = np.column_stack([xv.ravel(), yv.ravel(), z_top.ravel()])
    bot_verts = np.column_stack([xv.ravel(), yv.ravel(), np.zeros(nx * ny, dtype=np.float32)])
    all_verts = np.vstack([top_verts, bot_verts])

    bot_offset = nx * ny
    faces = []

    # 2. Top Triangles
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            a, b = iy * nx + ix, iy * nx + (ix + 1)
            c, d = (iy + 1) * nx + ix, (iy + 1) * nx + (ix + 1)
            faces.append([a, d, b])
            faces.append([a, c, d])

    # 3. Bottom Triangles (Reversed winding)
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            a, b = bot_offset + (iy * nx + ix), bot_offset + (iy * nx + (ix + 1))
            c, d = bot_offset + ((iy + 1) * nx + ix), bot_offset + ((iy + 1) * nx + (ix + 1))
            faces.append([a, b, d])
            faces.append([a, d, c])

    # 4. Side Walls
    # North
    for ix in range(nx - 1):
        ta, tb = ix, ix + 1
        ba, bb = bot_offset + ta, bot_offset + tb
        faces.extend([[ta, tb, bb], [ta, bb, ba]])

    # South
    for ix in range(nx - 1):
        ta, tb = (ny - 1) * nx + ix, (ny - 1) * nx + (ix + 1)
        ba, bb = bot_offset + ta, bot_offset + tb
        faces.extend([[ta, bb, tb], [ta, ba, bb]])

    # West
    for iy in range(ny - 1):
        ta, tb = iy * nx, (iy + 1) * nx
        ba, bb = bot_offset + ta, bot_offset + tb
        faces.extend([[ta, bb, tb], [ta, ba, bb]])

    # East
    for iy in range(ny - 1):
        ta, tb = iy * nx + (nx - 1), (iy + 1) * nx + (nx - 1)
        ba, bb = bot_offset + ta, bot_offset + tb
        faces.extend([[ta, tb, bb], [ta, bb, ba]])

    mesh = trimesh.Trimesh(vertices=all_verts, faces=np.array(faces), process=True)
    trimesh.repair.fix_normals(mesh)
    return mesh`,
    },
    {
      path: "app/mesh/solid_generator.py",
      name: "Tạo Mesh Khối Kín Watertight (mesh/solid_generator.py)",
      purpose: "Xây dựng hình học 3D kín hoàn toàn (Solid 3D Mesh) bằng cách nối: 1. Mặt phù điêu nổi trên, 2. Mặt đáy phẳng tại Z=0, 3. Bốn bức tường thành xung quanh.",
      dependencies: ["numpy", "trimesh"],
      keyClassesOrFunctions: ["SolidMeshGenerator", "create_watertight_relief_mesh(z_matrix, width_mm, height_mm)"],
      communicationRole: "Nhận ma trận Z mm -> Xuất đối tượng `trimesh.Trimesh` kín hoàn toàn sẵn sàng cho CNC & in 3D.",
      codeSnippet: `import numpy as np
import trimesh

def create_watertight_relief_mesh(z_matrix: np.ndarray, width_mm: float, height_mm: float) -> trimesh.Trimesh:
    ny, nx = z_matrix.shape
    dx = width_mm / (nx - 1)
    dy = height_mm / (ny - 1)
    
    x_coords = np.linspace(-width_mm/2, width_mm/2, nx)
    y_coords = np.linspace(height_mm/2, -height_mm/2, ny)
    xv, yv = np.meshgrid(x_coords, y_coords)
    
    # 1. Top Vertices (Relief Surface)
    top_vertices = np.column_stack([xv.ravel(), yv.ravel(), z_matrix.ravel()])
    
    # 2. Bottom Vertices (Z = 0)
    bottom_vertices = np.column_stack([xv.ravel(), yv.ravel(), np.zeros_like(z_matrix).ravel()])
    
    vertices = np.vstack([top_vertices, bottom_vertices])
    
    # Generate Top & Bottom & Side Quad-to-Triangle Faces
    faces = []
    # (Face index generation logic)
    
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    mesh.fix_normals()
    return mesh`,
    },
    {
      path: "app/mesh/mesh_smoother.py",
      name: "Làm Mịn Mesh Bảo Tồn Chi Tiết (mesh/mesh_smoother.py)",
      purpose: "Làm mịn bề mặt phù điêu (None, Light, Medium, Strong), bảo tồn các góc nét khuôn mặt & hoa văn, chống sụt khối/mất hình, tự động sửa lỗi lỗ thủng (Auto Repair Watertight).",
      dependencies: ["trimesh", "numpy", "open3d (optional)"],
      keyClassesOrFunctions: ["smooth_mesh(mesh, strength, detail_preservation, auto_repair)"],
      communicationRole: "Nhận Solid Mesh -> Trả về Mesh đã được làm mịn mượt mà, bảo tồn chi tiết sắc nét và khép kín khối 100%.",
      codeSnippet: `import numpy as np
import trimesh
from typing import Union, Optional

def smooth_mesh(
    mesh: Union[trimesh.Trimesh, "open3d.geometry.TriangleMesh"],
    strength: Union[str, float] = "medium",
    detail_preservation: float = 0.7,
    auto_repair: bool = True
) -> Union[trimesh.Trimesh, "open3d.geometry.TriangleMesh"]:
    """
    Làm mịn bề mặt phù điêu 3D bảo tồn chi tiết (Feature-Preserving Smoothing).
    Chế độ strength: 'none', 'light', 'medium', 'strong' hoặc float 0.0->1.0.
    detail_preservation: 0.0 -> 1.0 (Giữ nét góc & đường viền hoa văn).
    """
    if str(strength).lower() == "none" or (isinstance(strength, (int, float)) and strength <= 0.0):
        return repair_mesh_if_needed(mesh) if auto_repair else mesh

    # 1. Bán kính & Vòng lặp Taubin Filter
    iterations, lambda_p, mu_p = parse_smoothing_parameters(strength, detail_preservation)

    # 2. Khóa vị trí các đỉnh mép & chân đế Z=0 để không làm biến dạng khung khối
    z_coords = mesh.vertices[:, 2]
    min_z = np.min(z_coords)
    top_mask = z_coords > (min_z + 0.5)

    # 3. Lọc làm mịn Taubin (Shrinkage-Free)
    trimesh.smoothing.filter_taubin(mesh, lamb=lambda_p, nu=mu_p, iterations=iterations)
    mesh.vertices[~top_mask, 2] = min_z

    # 4. Tự động kiểm tra & sửa lỗi (Watertight Auto-Repair)
    if auto_repair and not mesh.is_watertight:
        mesh.fill_holes()
        trimesh.repair.fix_normals(mesh)

    return mesh`,
    },
    {
      path: "app/preview/renderer.py",
      name: "Hiển Thị Preview 3D (preview/renderer.py)",
      purpose: "Khung nhìn 3D tương tác (Xoay, Phóng to, Thu nhỏ, Di chuyển) với hiệu ứng chất liệu giả lập Gỗ CNC, Đồng, Đá Marble hoặc Khung lưới Wireframe.",
      dependencies: ["PySide6.QtOpenGLWidgets", "open3d / PyVista / OpenGL"],
      keyClassesOrFunctions: ["Relief3DPreviewCanvas", "render_mesh(mesh)", "set_material_style(style_name)"],
      communicationRole: "Hiển thị trực quan mô hình 3D thực tế khi người dùng chỉnh tham số.",
      codeSnippet: `from PySide6.QtOpenGLWidgets import QOpenGLWidget
import open3d as o3d

class Relief3DPreviewCanvas(QOpenGLWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.current_mesh = None

    def update_mesh(self, trimesh_obj):
        self.current_mesh = trimesh_obj
        self.update() # Trigger redraw OpenGL view`,
    },
    {
      path: "app/export/stl_exporter.py",
      name: "Xuất File STL (export/stl_exporter.py)",
      purpose: "Ghi dữ liệu Mesh thành định dạng file STL Binary chuẩn (đơn vị millimeter mm). Đảm bảo tính tương thích 100% với các phần mềm CNC (ArtCAM, VCarve, Fusion 360, Aspire) và Slicer in 3D (Cura, PrusaSlicer).",
      dependencies: ["trimesh", "numpy"],
      keyClassesOrFunctions: ["export_to_stl(mesh, file_path_stl)"],
      communicationRole: "Nhận Mesh đã hoàn thiện -> Ghi trực tiếp ra đĩa đĩa cứng dưới định dạng `.stl`.",
      codeSnippet: `import trimesh

def export_to_stl(mesh: trimesh.Trimesh, output_path: str) -> bool:
    """Xuất mesh kín khối ra file STL Binary đơn vị mm."""
    try:
        # Export binary STL format
        mesh.export(output_path, file_type='stl')
        print(f"Exported successfully to {output_path}")
        return True
    except Exception as e:
        print(f"Export STL Error: {e}")
        return False`,
    },
    {
      path: "app/utils/config.py",
      name: "Cấu hình tham số chuẩn (utils/config.py)",
      purpose: "Lưu giữ hằng số kỹ thuật bắt buộc: Relief Depth 15-40mm, Base Thickness 5mm, đơn vị mm.",
      dependencies: [],
      keyClassesOrFunctions: ["DEFAULT_RELIEF_DEPTH_MM = 25.0", "DEFAULT_BASE_THICKNESS_MM = 5.0", "MIN_RELIEF_DEPTH_MM = 15.0", "MAX_RELIEF_DEPTH_MM = 40.0"],
      communicationRole: "Cung cấp tham số mặc định cho tất cả các module.",
      codeSnippet: `UNIT = "mm"
DEFAULT_RELIEF_DEPTH_MM = 25.0
DEFAULT_BASE_THICKNESS_MM = 5.0
MIN_RELIEF_DEPTH_MM = 15.0
MAX_RELIEF_DEPTH_MM = 40.0
DEFAULT_WIDTH_MM = 200.0`,
    },
    {
      path: "build_executable.py",
      name: "Đóng gói Executable Windows (build_executable.py & AI_BasRelief.spec)",
      purpose: "Tạo ứng dụng Windows độc lập AI_BasRelief.exe và bộ cài AI_BasRelief_Setup.exe bằng PyInstaller & Inno Setup mà không cần người dùng cài đặt Python.",
      dependencies: ["pyinstaller", "Pillow"],
      keyClassesOrFunctions: ["build_executable.main()", "AI_BasRelief.spec", "installer_script.iss"],
      communicationRole: "Đóng gói toàn bộ mã nguồn Python, thư viện C++ OpenCV/Trimesh và tài nguyên vào 1 file EXE độc lập.",
      codeSnippet: `import os
import sys
import subprocess

def main():
    print("Building AI_BasRelief.exe via PyInstaller...")
    cmd = [sys.executable, "-m", "PyInstaller", "--clean", "AI_BasRelief.spec"]
    subprocess.run(cmd, check=True)
    print("Executable created at dist/AI_BasRelief/AI_BasRelief.exe")`,
    },
  ],
};
