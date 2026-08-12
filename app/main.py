"""
===============================================================================
AI BAS RELIEF → STL: MAIN ENTRY POINT
File: app/main.py
===============================================================================
Điểm khởi chạy ứng dụng Windows AI_BasRelief.exe.
===============================================================================
"""

import sys
import os

# Thêm thư mục gốc vào sys.path để PyInstaller tìm thấy các mô-đun nội bộ
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from PySide6.QtWidgets import QApplication
from app.main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    app.setApplicationName("AI BasRelief Studio")
    app.setOrganizationName("AI Studio")

    window = MainWindow()
    window.show()

    sys.exit(app.exec())

if __name__ == "__main__":
    main()
