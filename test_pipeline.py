"""
===============================================================================
AI BAS RELIEF → STL: TEST PIPELINE
File: test_pipeline.py
===============================================================================
Kịch bản kiểm thử toàn trình tự động cho ứng dụng AI Bas Relief:
1. Image loading: Tạo / tải ảnh kiểm thử tượng Phật / hoa văn.
2. Depth generation: Chạy thuật toán Depth Compression & Facial Preservation.
3. Relief generation: Dựng khối Solid Relief 3D kín đáy & thành.
4. Mesh repair: Kiểm tra và sửa lỗi Mesh tự động.
5. STL export: Xuất file STL Binary.
6. STL validation: Đọc lại file STL và kiểm tra 6 tiêu chuẩn chất lượng CNC.
===============================================================================
"""

import os
import sys
import numpy as np
import cv2
import trimesh

# Thêm đường dẫn ứng dụng vào PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.depth.religious_relief_processor import process_religious_relief_depth
from app.relief.relief_generator import generate_relief
from app.export.stl_exporter import validate_mesh, repair_mesh, export_stl, STLExportError


def run_pipeline_test():
    print("===============================================================")
    print("   AI BAS RELIEF: COMPLETE PIPELINE VERIFICATION TEST   ")
    print("===============================================================\n")

    output_dir = os.path.join(os.path.dirname(__file__), "test_outputs")
    os.makedirs(output_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # STEP 1: IMAGE LOADING TEST
    # -------------------------------------------------------------------------
    print("[TEST 1/6] Testing Image Loading...")
    test_image_path = os.path.join(output_dir, "test_buddha_input.png")
    
    # Tạo ảnh mẫu tổng hợp (Khuôn mặt tròn, vầng hào quang, hoa văn)
    h, w = 300, 300
    img = np.zeros((h, w, 3), dtype=np.uint8)
    # Background
    cv2.rectangle(img, (0, 0), (w, h), (30, 30, 30), -1)
    # Hào quang (Halo circle)
    cv2.circle(img, (150, 150), 120, (200, 200, 200), -1)
    # Khuôn mặt tượng Phật (Face circle)
    cv2.circle(img, (150, 150), 75, (255, 255, 255), -1)
    # Mắt, Mũi, Môi (Eyes, Nose, Mouth details)
    cv2.ellipse(img, (125, 135), (15, 6), 0, 0, 360, (50, 50, 50), -1) # Left Eye
    cv2.ellipse(img, (175, 135), (15, 6), 0, 0, 360, (50, 50, 50), -1) # Right Eye
    cv2.ellipse(img, (150, 160), (8, 18), 0, 0, 360, (180, 180, 180), -1) # Nose
    cv2.ellipse(img, (150, 190), (22, 8), 0, 0, 360, (100, 100, 100), -1) # Mouth
    # Tòa sen (Lotus petals)
    for cx in range(60, 250, 30):
        cv2.circle(img, (cx, 250), 20, (220, 220, 220), -1)

    cv2.imwrite(test_image_path, img)

    # Verify image loading
    loaded_img = cv2.imread(test_image_path)
    assert loaded_img is not None, "PASSED: Image load failed!"
    print(f" -> Image loaded successfully: {loaded_img.shape[1]}x{loaded_img.shape[0]} px\n")

    # -------------------------------------------------------------------------
    # STEP 2: DEPTH GENERATION TEST
    # -------------------------------------------------------------------------
    print("[TEST 2/6] Testing Depth Generation (Religious Relief & Depth Compression)...")
    depth_map = process_religious_relief_depth(
        image_np=loaded_img,
        preset_key="buddha",
        face_detail=0.90,
        ornament_detail=0.85,
        edge_preservation=0.80,
        depth_compression=0.70,
        contrast=1.1,
        blur_radius=1
    )
    assert depth_map is not None, "PASSED: Depth generation returned None!"
    assert depth_map.shape == (h, w), f"PASSED: Shape mismatch! Expected {(h, w)}, got {depth_map.shape}"
    assert np.min(depth_map) >= 0.0 and np.max(depth_map) <= 1.0, "PASSED: Depth values out of bounds [0, 1]!"
    print(f" -> Depth Map generated successfully (Range: min={np.min(depth_map):.3f}, max={np.max(depth_map):.3f})\n")

    # -------------------------------------------------------------------------
    # STEP 3: RELIEF GENERATION TEST
    # -------------------------------------------------------------------------
    print("[TEST 3/6] Testing 3D Relief Mesh Generation...")
    width_mm = 200.0
    height_mm = 200.0
    relief_depth_mm = 25.0
    base_thickness_mm = 5.0

    mesh = generate_relief(
        depth_map=depth_map,
        width_mm=width_mm,
        height_mm=height_mm,
        relief_depth_mm=relief_depth_mm,
        base_thickness_mm=base_thickness_mm,
        invert_depth=False,
        smooth_iterations=1
    )
    assert mesh is not None, "PASSED: Relief mesh generation failed!"
    assert len(mesh.vertices) > 0 and len(mesh.faces) > 0, "PASSED: Mesh contains no vertices or faces!"
    print(f" -> 3D Mesh created: {len(mesh.vertices)} vertices, {len(mesh.faces)} faces\n")

    # -------------------------------------------------------------------------
    # STEP 4: MESH REPAIR TEST
    # -------------------------------------------------------------------------
    print("[TEST 4/6] Testing Mesh Validation & Repair...")
    is_valid, issues = validate_mesh(mesh)
    print(f" -> Initial Mesh Validation: Valid={is_valid}, Issues={issues}")
    
    repaired_mesh = repair_mesh(mesh)
    is_valid_after, issues_after = validate_mesh(repaired_mesh)
    assert is_valid_after, f"PASSED: Mesh repair failed! Issues remaining: {issues_after}"
    print(" -> Mesh auto-repair pass completed successfully.\n")

    # -------------------------------------------------------------------------
    # STEP 5: STL EXPORT TEST
    # -------------------------------------------------------------------------
    print("[TEST 5/6] Testing STL Export...")
    stl_filepath = os.path.join(output_dir, "PhuDieuPhat_Test.stl")
    report = export_stl(repaired_mesh, stl_filepath)
    
    assert os.path.exists(stl_filepath), "PASSED: STL file not written to disk!"
    assert os.path.getsize(stl_filepath) > 100, "PASSED: STL file is too small or corrupt!"
    print(f" -> STL file exported to: {stl_filepath}\n")

    # -------------------------------------------------------------------------
    # STEP 6: STL VALIDATION & RE-READ TEST
    # -------------------------------------------------------------------------
    print("[TEST 6/6] Testing Re-read Verification of Exported STL...")
    reloaded_mesh = trimesh.load(stl_filepath, file_type="stl")
    assert reloaded_mesh.is_watertight, "PASSED: Exported STL is not watertight when reloaded!"
    assert len(reloaded_mesh.faces) == len(repaired_mesh.faces), "PASSED: Reloaded face count mismatch!"
    
    print("\n===============================================================")
    print("   ALL 6 PIPELINE TESTS COMPLETED SUCCESSFULLY! (100% PASS)    ")
    print("===============================================================")


if __name__ == "__main__":
    try:
        run_pipeline_test()
    except Exception as e:
        print(f"\n[ERROR] Test Pipeline Failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
