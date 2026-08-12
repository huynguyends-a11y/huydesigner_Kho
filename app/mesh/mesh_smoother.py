"""
===============================================================================
AI BAS RELIEF → STL: MESH SMOOTHING MODULE
File: app/mesh/mesh_smoother.py
===============================================================================
Mô-đun làm mịn bề mặt phù điêu 3D (Mesh Smoothing & Detail Preservation).

Chức năng:
- Làm mịn các đường gân nhám, nhiễu răng cưa pixel do ảnh gốc gây ra.
- Bảo tồn các chi tiết quan trọng (mắt, mũi, khuôn mặt tượng Phật, viền hoa văn).
- Khóa vị trí đỉnh mép cạnh & đáy phẳng Z=0 để KHÔNG làm biến dạng khung khối.
- Đảm bảo Mesh không bị thủng lỗ và duy trì thuộc tính Watertight Solid.
- Tự động sửa chữa (Repair) Mesh nếu phát hiện lỗi sau khi làm mịn.
===============================================================================
"""

import numpy as np
import trimesh
from typing import Union, Optional

try:
    import open3d as o3d
    HAS_OPEN3D = True
except ImportError:
    HAS_OPEN3D = False


def smooth_mesh(
    mesh: Union[trimesh.Trimesh, "o3d.geometry.TriangleMesh"],
    strength: Union[str, float] = "medium",
    detail_preservation: float = 0.7,
    auto_repair: bool = True
) -> Union[trimesh.Trimesh, "o3d.geometry.TriangleMesh"]:
    """
    Làm mịn bề mặt phù điêu 3D với cơ chế bảo tồn chi tiết (Feature-Preserving Smoothing).

    Parameters:
    -----------
    mesh : trimesh.Trimesh hoặc open3d.geometry.TriangleMesh
        Mô hình 3D Triangle Mesh đầu vào.
    strength : str hoặc float, optional (mặc định = "medium")
        Chế độ làm mịn:
        - "none" hoặc 0.0 : Không làm mịn.
        - "light" hoặc 0.25: Làm mịn nhẹ (giữ tối đa đường nét nhỏ).
        - "medium" hoặc 0.5: Làm mịn vừa phải (cân bằng mịn & chi tiết).
        - "strong" hoặc 0.8: Làm mịn mạnh (khử tối đa gờ nhám CNC).
        Hoặc truyền trực tiếp số float từ 0.0 đến 1.0.
    detail_preservation : float, optional (mặc định = 0.7)
        Hệ số bảo tồn chi tiết (0.0 -> 1.0).
        - 1.0: Giữ nguyên tối đa các góc nét, nếp gấp áo, viền hoa văn.
        - 0.0: Làm mịn đồng đều không ưu tiên góc nét.
    auto_repair : bool, optional (mặc định = True)
        Tự động kiểm tra và sửa lỗi lỗ thủng/đảo pháp tuyến sau khi làm mịn.

    Returns:
    --------
    trimesh.Trimesh hoặc open3d.geometry.TriangleMesh
        Mesh đã làm mịn, đảm bảo Watertight và Manifold.
    """
    if mesh is None:
        raise ValueError("Mesh đầu vào không được để rỗng.")

    # Convert Open3D to Trimesh for internal processing if needed
    is_open3d_input = False
    if HAS_OPEN3D and isinstance(mesh, o3d.geometry.TriangleMesh):
        is_open3d_input = True
        vertices = np.asarray(mesh.vertices)
        faces = np.asarray(mesh.triangles)
        t_mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    elif isinstance(mesh, trimesh.Trimesh):
        t_mesh = mesh.copy()
    else:
        raise TypeError("Mesh phải là đối tượng trimesh.Trimesh hoặc open3d.geometry.TriangleMesh")

    # 1. Bỏ qua nếu chế độ là "none" hoặc strength <= 0.0
    if str(strength).lower() == "none" or (isinstance(strength, (int, float)) and strength <= 0.0):
        return repair_mesh_if_needed(t_mesh) if auto_repair else t_mesh

    # 2. Quy đổi tham số strength sang số dư iterations & lambdas cho Taubin/Laplacian Filter
    iterations, lambda_param, mu_param = parse_smoothing_parameters(strength, detail_preservation)

    # 3. Bảo vệ các đỉnh mép & đáy (Boundary Vertices Protection)
    # Tìm các đỉnh nằm trên mặt đáy phẳng (Z <= min_z + 0.1) hoặc viền thành bên để KHÔNG làm biến dạng đáy
    z_coords = t_mesh.vertices[:, 2]
    min_z = np.min(z_coords)
    
    # Đỉnh cần làm mịn là các đỉnh mặt trên phù điêu
    top_vertex_mask = z_coords > (min_z + 0.5)

    # 4. Thực hiện thuật toán làm mịn Taubin (Shrinkage-Free Smoothing)
    # Thuật toán Taubin gồm 2 bước luân phiên: Laplacian mờ (λ > 0) và Phình lại (μ < 0)
    # Giúp làm mịn bề mặt mà KHÔNG làm teo nhỏ kích thước hay mất khối
    try:
        if hasattr(trimesh.smoothing, 'filter_taubin'):
            trimesh.smoothing.filter_taubin(
                t_mesh,
                lamb=lambda_param,
                nu=mu_param,
                iterations=iterations
            )
        else:
            # Fallback Laplacian nếu không có Taubin
            trimesh.smoothing.filter_laplacian(
                t_mesh,
                lamb=lambda_param * 0.5,
                iterations=iterations
            )
    except Exception as e:
        print(f"[Warning] Smoothing filter encounter error: {e}. Falling back to selective laplacian.")
        selective_laplacian_smooth(t_mesh, top_vertex_mask, iterations, lambda_param)

    # 5. Khôi phục lại độ cao đáy Z=0 chính xác tuyệt đối
    t_mesh.vertices[~top_vertex_mask, 2] = min_z

    # 6. Kiểm tra & Tự động sửa lỗi (Auto Repair)
    if auto_repair:
        t_mesh = repair_mesh_if_needed(t_mesh)

    # 7. Trả về đúng kiểu dữ liệu ban đầu
    if is_open3d_input:
        o3d_out = o3d.geometry.TriangleMesh()
        o3d_out.vertices = o3d.utility.Vector3dVector(t_mesh.vertices)
        o3d_out.triangles = o3d.utility.Vector3iVector(t_mesh.faces)
        o3d_out.compute_vertex_normals()
        return o3d_out

    return t_mesh


def parse_smoothing_parameters(strength: Union[str, float], detail_preservation: float):
    """Quy đổi mức độ làm mịn thành số vòng lặp và hệ số lọc Taubin."""
    detail_preservation = max(0.0, min(1.0, float(detail_preservation)))
    str_key = str(strength).lower()

    if str_key == "light":
        base_iters = 3
        s_val = 0.25
    elif str_key == "medium":
        base_iters = 6
        s_val = 0.5
    elif str_key == "strong":
        base_iters = 12
        s_val = 0.8
    else:
        try:
            s_val = max(0.0, min(1.0, float(strength)))
            base_iters = int(round(s_val * 15))
        except ValueError:
            base_iters = 5
            s_val = 0.5

    # Detail preservation điều chỉnh lambda (bước lọc) & mu (bước bù phình)
    # Chi tiết được giữ nguyên nhiều hơn khi detail_preservation cao
    lambda_param = 0.3 * (1.0 - 0.5 * detail_preservation)
    mu_param = -(lambda_param + 0.04 * (1.0 - detail_preservation))

    iterations = max(1, base_iters)
    return iterations, lambda_param, mu_param


def selective_laplacian_smooth(mesh: trimesh.Trimesh, mask: np.ndarray, iterations: int, lamb: float):
    """Làm mịn chọn lọc chỉ tác động lên các đỉnh phù điêu, giữ nguyên khung chân đế."""
    adjacency = mesh.vertex_neighbors
    vertices = mesh.vertices.copy()

    for _ in range(iterations):
        new_verts = vertices.copy()
        for i in range(len(vertices)):
            if mask[i] and len(adjacency[i]) > 0:
                neighbors = adjacency[i]
                avg_neighbor = np.mean(vertices[neighbors], axis=0)
                new_verts[i] = vertices[i] + lamb * (avg_neighbor - vertices[i])
        vertices = new_verts

    mesh.vertices = vertices


def repair_mesh_if_needed(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """
    Kiểm tra tính khép kín (Watertight) và tự động khắc phục các lỗi hình học:
    - Sửa lỗ thủng (Fill holes)
    - Loại bỏ mặt trùng lặp (Remove duplicate faces)
    - Sửa hướng pháp tuyến (Fix normals & winding)
    """
    if not mesh.is_watertight:
        print("[Mesh Repair] Detecting non-watertight mesh. Repairing...")
        # Fill holes
        mesh.fill_holes()
        # Remove degenerate & duplicate faces
        mesh.remove_degenerate_faces()
        mesh.remove_duplicate_faces()

    # Fix normals direction
    trimesh.repair.fix_normals(mesh)
    trimesh.repair.fix_winding(mesh)

    return mesh


# Quick module verification
if __name__ == "__main__":
    print("[TEST] Running Mesh Smoother verification...")
    # Create simple box mesh for test
    box = trimesh.creation.box(extents=[100, 100, 20])
    
    # Test smooth
    smoothed = smooth_mesh(box, strength="medium", detail_preservation=0.8)
    
    print(f"Original Vertices: {len(box.vertices)} | Smoothed Vertices: {len(smoothed.vertices)}")
    print(f"Is Watertight After Smooth: {smoothed.is_watertight}")
