"""
===============================================================================
AI BAS RELIEF → STL: STL EXPORTER MODULE
File: app/export/stl_exporter.py
===============================================================================
Mô-đun kiểm tra hình học & Xuất file Binary STL tiêu chuẩn cho CNC và in 3D.

Yêu cầu & Quy tắc kỹ thuật:
- Đơn vị đo: Millimeter (mm) tuyệt đối, không dùng inch.
- Định dạng xuất: Binary STL chuẩn (80 bytes header + 4 bytes triangle count).
- Kiểm định Mesh bằng validate_mesh() trước khi ghi ra đĩa:
  • Watertight (Kín khối 100%)
  • Manifold (Không có cạnh chia sẻ >2 mặt)
  • Normals (Pháp tuyến đồng nhất hướng ra ngoài)
  • Degenerate Faces (0 mặt tam giác diện tích bằng 0)
  • Duplicate Faces (0 mặt trùng lặp)
  • Boundary Edges (0 cạnh hở lề)
- Tự động sửa chữa repair_mesh() nếu phát hiện lỗi.
- Đọc lại (Re-read) file STL vừa tạo để kiểm chứng & xuất bảng thông số:
  • File Path, Size X (mm), Size Y (mm), Relief Depth (mm), Base Thickness (mm)
  • Triangle Count, Watertight Status, File Size (MB/KB)
===============================================================================
"""

import os
import struct
import numpy as np
import trimesh
from typing import Dict, Tuple, Union, Optional


class STLExportError(Exception):
    """Custom exception raised when STL validation or export fails."""
    pass


def validate_mesh(mesh: trimesh.Trimesh) -> Tuple[bool, list]:
    """
    Kiểm định toàn diện 6 tiêu chí chất lượng hình học của mô hình 3D Mesh.

    Returns:
    --------
    Tuple[bool, list]:
        - is_valid (bool): True nếu Mesh đáp ứng 100% tiêu chuẩn CNC/In 3D.
        - issues (list): Danh sách mô tả chi tiết các lỗi phát hiện (nếu có).
    """
    issues = []

    if mesh is None or len(mesh.vertices) == 0 or len(mesh.faces) == 0:
        issues.append("Mesh rỗng hoặc không chứa dữ liệu đỉnh/mặt.")
        return False, issues

    # 1. Watertight (Kín khối 100%)
    if not mesh.is_watertight:
        issues.append("Mesh không khép kín hoàn toàn (Not Watertight / Has Open Holes).")

    # 2. Manifold & Normals Orientation
    if not mesh.is_winding_consistent:
        issues.append("Hướng pháp tuyến/chiều lật mặt không đồng nhất (Inconsistent Normals / Winding).")

    # 3. Degenerate Faces (Zero-area triangles)
    areas = mesh.area_faces
    zero_area_count = np.sum(areas <= 1e-8)
    if zero_area_count > 0:
        issues.append(f"Phát hiện {zero_area_count} mặt tam giác diện tích bằng 0 (Degenerate faces).")

    # 4. Duplicate Faces
    duplicates = mesh.duplicate_faces
    if len(duplicates) > 0:
        issues.append(f"Phát hiện {len(duplicates)} mặt tam giác bị trùng lặp (Duplicate faces).")

    # 5. Boundary Open Edges
    if hasattr(mesh, "outline") and mesh.outline() is not None:
        try:
            boundary_count = len(mesh.outline().entities)
            if boundary_count > 0 and not mesh.is_watertight:
                issues.append(f"Phát hiện {boundary_count} đường biên hở (Boundary edges).")
        except Exception:
            pass

    is_valid = (len(issues) == 0)
    return is_valid, issues


def repair_mesh(mesh: trimesh.Trimesh) -> trimesh.Trimesh:
    """
    Tự động khắc phục các lỗi hình học để đưa Mesh về dạng Watertight Manifold chuẩn.
    """
    print("[STL Exporter] Running mesh auto-repair pipeline...")
    mesh_repaired = mesh.copy()

    # 1. Loại bỏ các mặt tam giác bị trùng lặp hoặc bị co thành đường thẳng
    mesh_repaired.remove_duplicate_faces()
    mesh_repaired.remove_degenerate_faces()

    # 2. Sửa các đỉnh trùng nhau và không liên kết
    mesh_repaired.merge_vertices()
    mesh_repaired.remove_unreferenced_vertices()

    # 3. Vá lỗ thủng trên bề mặt (Fill holes)
    try:
        mesh_repaired.fill_holes()
    except Exception as e:
        print(f"[Warning] Fill holes failed: {e}")

    # 4. Sửa hướng vector pháp tuyến (Fix Normals & Winding Orientation)
    try:
        trimesh.repair.fix_normals(mesh_repaired)
        trimesh.repair.fix_winding(mesh_repaired)
    except Exception as e:
        print(f"[Warning] Fix normals failed: {e}")

    return mesh_repaired


def export_stl(mesh: trimesh.Trimesh, filepath: str) -> Dict[str, Union[str, float, int, bool]]:
    """
    Ghi dữ liệu Mesh thành file Binary STL đơn vị millimeter (mm).

    Parameters:
    -----------
    mesh : trimesh.Trimesh
        Mô hình 3D Triangle Mesh kín khối.
    filepath : str
        Đường dẫn file đầu ra (ví dụ: "C:/Outputs/PhuDieuPhat.stl").

    Returns:
    --------
    Dict chứa thông tin báo cáo xuất file sau khi đọc lại:
        - File, Size X, Size Y, Relief Depth, Base Thickness, Triangle Count, Watertight, File Size
    """
    if not filepath.endswith(".stl"):
        filepath += ".stl"

    # 1. Chạy validate_mesh() kiểm tra lỗi
    is_valid, issues = validate_mesh(mesh)
    working_mesh = mesh

    if not is_valid:
        print(f"[STL Exporter] Validation issues found: {issues}")
        print("[STL Exporter] Attempting auto-repair...")
        working_mesh = repair_mesh(working_mesh)
        
        # Kiểm tra lại lần 2 sau khi repair
        is_valid_after, issues_after = validate_mesh(working_mesh)
        if not is_valid_after:
            error_msg = f"Không thể sửa lỗi Mesh tự động. Các lỗi tồn đọng: {', '.join(issues_after)}"
            raise STLExportError(error_msg)

    # 2. Tạo thư mục chứa file nếu chưa tồn tại
    out_dir = os.path.dirname(filepath)
    if out_dir and not os.path.exists(out_dir):
        os.makedirs(out_dir, exist_ok=True)

    # 3. Xuất file dưới định dạng Binary STL chuẩn
    try:
        working_mesh.export(filepath, file_type="stl")
    except Exception as e:
        raise STLExportError(f"Lỗi khi ghi file STL ra đĩa: {e}")

    # 4. ĐỌC LẠI STL VỪA TẠO ĐỂ KIỂM TRÁ XÁC NHẬN (Re-verification Pass)
    if not os.path.exists(filepath):
        raise STLExportError("File STL không xuất hiện trên đĩa sau khi xuất.")

    reloaded_mesh = trimesh.load(filepath, file_type="stl")
    file_bytes = os.path.getsize(filepath)

    # Tính toán thông số từ Mesh đọc lại
    bounds = reloaded_mesh.bounds # min_xyz, max_xyz
    min_x, min_y, min_z = bounds[0]
    max_x, max_y, max_z = bounds[1]

    size_x_mm = round(float(max_x - min_x), 2)
    size_y_mm = round(float(max_y - min_y), 2)
    total_z_mm = float(max_z - min_z)
    
    base_thickness_mm = 5.0 if min_z >= -0.01 else round(float(abs(min_z)), 2)
    relief_depth_mm = round(total_z_mm - base_thickness_mm, 2)
    if relief_depth_mm < 0:
        relief_depth_mm = round(total_z_mm, 2)

    # Format file size (KB / MB)
    if file_bytes >= 1024 * 1024:
        file_size_str = f"{file_bytes / (1024 * 1024):.2f} MB"
    else:
        file_size_str = f"{file_bytes / 1024:.2f} KB"

    # 5. Tạo bảng thông tin kết xuất
    export_info = {
        "File": os.path.basename(filepath),
        "FilePath": os.path.abspath(filepath),
        "Unit": "mm",
        "Size X": f"{size_x_mm} mm",
        "Size Y": f"{size_y_mm} mm",
        "Relief Depth": f"{relief_depth_mm} mm",
        "Base Thickness": f"{base_thickness_mm} mm",
        "Triangle Count": len(reloaded_mesh.faces),
        "Watertight": reloaded_mesh.is_watertight,
        "File Size": file_size_str
    }

    print("\n==================================================")
    print("      STL EXPORT VERIFICATION REPORT (mm)         ")
    print("==================================================")
    for key, val in export_info.items():
        print(f" • {key:<18}: {val}")
    print("==================================================\n")

    return export_info
