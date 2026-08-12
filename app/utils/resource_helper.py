"""
===============================================================================
AI BAS RELIEF → STL: RESOURCE HELPER MODULE
File: app/utils/resource_helper.py
===============================================================================
Hàm hỗ trợ xử lý đường dẫn tương đối tài nguyên (Icons, Presets, Assets)
tương thích hoàn toàn khi ứng dụng được đóng gói bằng PyInstaller (.exe).
===============================================================================
"""

import sys
import os

def resource_path(relative_path: str) -> str:
    """
    Lấy đường dẫn tuyệt đối chuẩn tới tài nguyên (Asset/Icon/Config).
    Hỗ trợ cả môi trường Development và môi trường đóng gói PyInstaller (_MEIPASS).
    """
    try:
        # Khi chạy ứng dụng đã đóng gói PyInstaller EXE
        base_path = sys._MEIPASS
    except AttributeError:
        # Khi chạy ở môi trường mã nguồn Python thông thường
        base_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

    return os.path.normpath(os.path.join(base_path, relative_path))
