"""
===============================================================================
AI BAS RELIEF → STL: RELIEF GENERATOR MODULE
File: app/relief/relief_generator.py
===============================================================================
Mô-đun chuyển đổi bản đồ độ sâu 2D (Depth Map / Height Map) thành mô hình 3D
dạng khối kín (Manifold & Watertight Triangle Mesh) để gia công CNC và in 3D.

Quy tắc ánh xạ độ cao Z (đơn vị: mm):
- Depth Map = 0.0  → Z = base_thickness_mm (mặt nền phù điêu)
- Depth Map = 1.0  → Z = base_thickness_mm + depth_mm (điểm cao nhất của phù điêu)
- Mặt đáy phẳng    → Z = 0.0 mm
- 4 Thành bên       → Nối từ viền mặt trên xuống đáy Z = 0.0 mm
===============================================================================
"""

import numpy as np
import trimesh
from typing import Union, Tuple, Optional

try:
    import open3d as o3d
    HAS_OPEN3D = True
except ImportError:
    HAS_OPEN3D = False


def generate_relief(
    depth_map: np.ndarray,
    width_mm: float,
    height_mm: float,
    depth_mm: float,
    base_thickness_mm: float = 5.0,
    resolution: Optional[int] = None,
    return_type: str = "trimesh"
) -> Union[trimesh.Trimesh, "o3d.geometry.TriangleMesh"]:
    """
    Tạo mô hình phù điêu 3D kín khối (Watertight Solid Triangle Mesh) từ Depth Map.

    Parameters:
    -----------
    depth_map : numpy.ndarray
        Mảng 2D biểu diễn bản đồ độ sâu (Depth Map). Giá trị chuẩn hóa 0.0 -> 1.0
        (hoặc uint8 0 -> 255 sẽ tự động chuẩn hóa về 0.0 -> 1.0).
    width_mm : float
        Chiều rộng mô hình 3D thực tế (đơn vị: mm).
    height_mm : float
        Chiều cao mô hình 3D thực tế (đơn vị: mm). Phải tuân theo tỷ lệ khung hình ảnh.
    depth_mm : float
        Độ nổi phù điêu tối đa (Relief Depth, ví dụ: 15.0 - 40.0 mm).
        Khi depth_map = 1.0 thì Z_relief = depth_mm.
    base_thickness_mm : float, optional (mặc định = 5.0 mm)
        Độ dày khối chân đế (Base Thickness). Z_bottom = 0.0, Z_base = base_thickness_mm.
    resolution : int, optional
        Kích thước cạnh tối đa (grid resolution) để downsample/upsample lưới nếu cần.
        Nếu None, sử dụng đúng độ phân giải gốc của depth_map.
    return_type : str, optional (mặc định = "trimesh")
        Loại đối tượng trả về: "trimesh" (trimesh.Trimesh) hoặc "open3d" (o3d.geometry.TriangleMesh).

    Returns:
    --------
    trimesh.Trimesh hoặc open3d.geometry.TriangleMesh
        Mô hình 3D kín khối, manifold, watertight sẵn sàng xuất STL.
    """
    if depth_map is None or depth_map.size == 0:
        raise ValueError("depth_map không hợp lệ hoặc rỗng.")

    # 1. Đảm bảo depth_map là mảng 2D float32 trong khoảng [0.0, 1.0]
    depth_2d = depth_map.astype(np.float32)
    if depth_2d.ndim == 3:
        # Nếu truyền vào ảnh RGB/BGR, chuyển sang xám
        depth_2d = 0.299 * depth_2d[:, :, 0] + 0.587 * depth_2d[:, :, 1] + 0.114 * depth_2d[:, :, 2]

    if depth_2d.max() > 1.0:
        depth_2d = depth_2d / 255.0

    depth_2d = np.clip(depth_2d, 0.0, 1.0)

    # 2. Resample độ phân giải nếu tham số resolution được chỉ định
    ny_orig, nx_orig = depth_2d.shape
    if resolution is not None and resolution > 0:
        aspect = nx_orig / ny_orig
        if nx_orig >= ny_orig:
            nx = resolution
            ny = max(2, int(round(resolution / aspect)))
        else:
            ny = resolution
            nx = max(2, int(round(resolution * aspect)))

        # Resample bằng cv2 hoặc scipy nếu có, hoặc trích xuất mẫu đơn giản
        try:
            import cv2
            depth_2d = cv2.resize(depth_2d, (nx, ny), interpolation=cv2.INTER_AREA)
        except ImportError:
            # Fallback numpy indexing đơn giản nếu không có OpenCV
            x_indices = np.linspace(0, nx_orig - 1, nx).astype(int)
            y_indices = np.linspace(0, ny_orig - 1, ny).astype(int)
            depth_2d = depth_2d[np.ix_(y_indices, x_indices)]
    else:
        ny, nx = ny_orig, nx_orig

    # 3. Tính tọa độ lưới X, Y giữ đúng tỷ lệ không bị kéo giãn
    # Tọa độ X từ -width_mm/2 đến +width_mm/2
    # Tọa độ Y từ +height_mm/2 đến -height_mm/2 (Hệ tọa độ ảnh Y hướng xuống -> 3D Y hướng lên)
    x_coords = np.linspace(-width_mm / 2.0, width_mm / 2.0, nx, dtype=np.float32)
    y_coords = np.linspace(height_mm / 2.0, -height_mm / 2.0, ny, dtype=np.float32)
    xv, yv = np.meshgrid(x_coords, y_coords)

    # 4. Tính toán tọa độ Z cho mặt trên
    # Quy tắc: Depth = 0.0 -> Z = base_thickness_mm
    #          Depth = 1.0 -> Z = base_thickness_mm + depth_mm
    z_top = base_thickness_mm + (depth_2d * depth_mm)

    # 5. Khởi tạo danh sách Vertices & Faces cho Solid Mesh
    top_vert_count = nx * ny
    bot_vert_count = nx * ny

    # --- Vertices Mặt Trên ---
    top_vertices = np.column_stack([
        xv.ravel(),
        yv.ravel(),
        z_top.ravel()
    ])

    # --- Vertices Mặt Đáy (Z = 0.0) ---
    bot_vertices = np.column_stack([
        xv.ravel(),
        yv.ravel(),
        np.zeros(top_vert_count, dtype=np.float32)
    ])

    # Tổng hợp tất cả các đỉnh (Indices: 0..top_vert_count-1 cho Top, top_vert_count..2*top_vert_count-1 cho Bottom)
    all_vertices = np.vstack([top_vertices, bot_vertices])

    faces = []

    # 6. Tạo mặt tam giác cho MẶT TRÊN (Top Surface)
    # Hướng Winding: CCW nhìn từ phía trên (+Z) để Vector pháp tuyến chỉ lên trên
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            idx_a = iy * nx + ix
            idx_b = iy * nx + (ix + 1)
            idx_c = (iy + 1) * nx + ix
            idx_d = (iy + 1) * nx + (ix + 1)

            # Quad = (a, b, d) + (a, d, c)
            faces.append([idx_a, idx_d, idx_b])
            faces.append([idx_a, idx_c, idx_d])

    # 7. Tạo mặt tam giác cho MẶT ĐÁY PHẲNG (Bottom Surface)
    # Hướng Winding: Đảo ngược Winding để Vector pháp tuyến chỉ xuống dưới (-Z)
    bot_offset = top_vert_count
    for iy in range(ny - 1):
        for ix in range(nx - 1):
            idx_a = bot_offset + (iy * nx + ix)
            idx_b = bot_offset + (iy * nx + (ix + 1))
            idx_c = bot_offset + ((iy + 1) * nx + ix)
            idx_d = bot_offset + ((iy + 1) * nx + (ix + 1))

            faces.append([idx_a, idx_b, idx_d])
            faces.append([idx_a, idx_d, idx_c])

    # 8. Tạo mặt tam giác cho 4 THÀNH BÊN (Side Walls)
    # Mép phía Bắc (iy = 0, Top edge)
    for ix in range(nx - 1):
        top_a = 0 * nx + ix
        top_b = 0 * nx + (ix + 1)
        bot_a = bot_offset + top_a
        bot_b = bot_offset + top_b

        faces.append([top_a, top_b, bot_b])
        faces.append([top_a, bot_b, bot_a])

    # Mép phía Nam (iy = ny - 1, Bottom edge)
    for ix in range(nx - 1):
        top_a = (ny - 1) * nx + ix
        top_b = (ny - 1) * nx + (ix + 1)
        bot_a = bot_offset + top_a
        bot_b = bot_offset + top_b

        faces.append([top_a, bot_b, top_b])
        faces.append([top_a, bot_a, bot_b])

    # Mép phía Tây (ix = 0, Left edge)
    for iy in range(ny - 1):
        top_a = iy * nx + 0
        top_b = (iy + 1) * nx + 0
        bot_a = bot_offset + top_a
        bot_b = bot_offset + top_b

        faces.append([top_a, bot_b, top_b])
        faces.append([top_a, bot_a, bot_b])

    # Mép phía Đông (ix = nx - 1, Right edge)
    for iy in range(ny - 1):
        top_a = iy * nx + (nx - 1)
        top_b = (iy + 1) * nx + (nx - 1)
        bot_a = bot_offset + top_a
        bot_b = bot_offset + top_b

        faces.append([top_a, top_b, bot_b])
        faces.append([top_a, bot_b, bot_a])

    faces_np = np.array(faces, dtype=np.int64)

    # 9. Khởi tạo đối tượng Trimesh và tự động sửa Pháp tuyến (Normals)
    mesh = trimesh.Trimesh(vertices=all_vertices, faces=faces_np, process=True)

    # Đảm bảo mesh kín khối (watertight & manifold)
    mesh.fill_holes()
    trimesh.repair.fix_normals(mesh)
    trimesh.repair.fix_winding(mesh)

    # 10. Chuyển đổi định dạng nếu người dùng chọn return_type = "open3d"
    if return_type.lower() == "open3d":
        if not HAS_OPEN3D:
            raise ImportError("Thư viện Open3D chưa được cài đặt. Vui lòng cài đặt bằng: pip install open3d")
        
        o3d_mesh = o3d.geometry.TriangleMesh()
        o3d_mesh.vertices = o3d.utility.Vector3dVector(mesh.vertices)
        o3d_mesh.triangles = o3d.utility.Vector3iVector(mesh.faces)
        o3d_mesh.compute_vertex_normals()
        return o3d_mesh

    return mesh


# Example usage test
if __name__ == "__main__":
    print("[TEST] Running Relief Generator test...")
    # Tạo Depth Map giả lập 100x100
    test_depth = np.linspace(0.0, 1.0, 100 * 100).reshape((100, 100))
    
    # Dựng phù điêu 200mm x 150mm, Relief Depth = 40mm, Base = 5mm
    mesh_out = generate_relief(
        depth_map=test_depth,
        width_mm=200.0,
        height_mm=150.0,
        depth_mm=40.0,
        base_thickness_mm=5.0
    )

    print(f"Mesh Created Successfully!")
    print(f"- Vertices Count: {len(mesh_out.vertices)}")
    print(f"- Faces Count: {len(mesh_out.faces)}")
    print(f"- Is Watertight: {mesh_out.is_watertight}")
    print(f"- Bounds (mm): {mesh_out.bounds}")
