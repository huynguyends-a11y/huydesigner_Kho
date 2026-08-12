"""
===============================================================================
AI BAS RELIEF → STL: AUTOMATED BUILD SCRIPT FOR WINDOWS EXE
File: build_executable.py
===============================================================================
Kịch bản tự động hóa quy trình đóng gói phần mềm Windows (.exe):
1. Kiểm tra môi trường PyInstaller & dependencies.
2. Tạo file icon .ico nếu chưa có.
3. Lệnh đóng gói PyInstaller từ AI_BasRelief.spec.
4. Kiểm tra file đầu ra `dist/AI_BasRelief/AI_BasRelief.exe`.
===============================================================================
"""

import os
import sys
import subprocess
import shutil

def main():
    print("===============================================================")
    print("     AI BAS RELIEF: PYINSTALLER BUILD SCRIPT (.EXE)            ")
    print("===============================================================\n")

    project_root = os.path.abspath(os.path.dirname(__file__))
    assets_dir = os.path.join(project_root, "assets")
    os.makedirs(assets_dir, exist_ok=True)

    # 1. Ensure icon file exists
    icon_path = os.path.join(assets_dir, "icon.ico")
    if not os.path.exists(icon_path):
        print("[Build] Creating placeholder application icon...")
        # Simple placeholder if icon.ico doesn't exist
        try:
            from PIL import Image, ImageDraw
            img = Image.new('RGB', (256, 256), color=(15, 23, 42))
            d = ImageDraw.Draw(img)
            # Draw lotus / statue placeholder geometry
            d.ellipse([32, 32, 224, 224], outline=(245, 158, 11), width=8)
            d.ellipse([80, 80, 176, 176], fill=(217, 119, 6))
            img.save(icon_path, format='ICO')
            print(" -> Created assets/icon.ico successfully.")
        except Exception as e:
            print(f"[Warning] Could not generate icon.ico: {e}")

    # 2. Run PyInstaller
    spec_path = os.path.join(project_root, "AI_BasRelief.spec")
    print(f"[Build] Executing PyInstaller with spec: {spec_path}...")

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--clean",
        spec_path
    ]

    try:
        res = subprocess.run(cmd, cwd=project_root, check=True)
        print("\n[Build] PyInstaller compilation finished successfully!")
    except subprocess.CalledProcessError as err:
        print(f"\n[ERROR] PyInstaller failed with exit code: {err.returncode}")
        sys.exit(1)

    # 3. Check output executable
    exe_dir = os.path.join(project_root, "dist", "AI_BasRelief")
    exe_path = os.path.join(exe_dir, "AI_BasRelief.exe")

    if os.path.exists(exe_path) or os.path.exists(os.path.join(exe_dir, "AI_BasRelief")):
        print("\n===============================================================")
        print("  BUILD SUCCESSFUL! Executable packaged at:")
        print(f"  -> {exe_path if os.path.exists(exe_path) else exe_dir}")
        print("===============================================================")
    else:
        print(f"\n[Warning] Executable folder created at {exe_dir}")

if __name__ == "__main__":
    main()
