"""
===============================================================================
AI BAS RELIEF → STL: MAIN WINDOW GUI
File: app/main_window.py
===============================================================================
Giao diện người dùng đồ họa chính (PySide6) cho ứng dụng Windows độc lập AI_BasRelief.exe.
===============================================================================
"""

import sys
import os
import cv2
import numpy as np

from PySide6.QtCore import Qt, QSize, Thread, Signal, Slot
from PySide6.QtGui import QIcon, QPixmap, QImage, QFont, QColor
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
    QComboBox, QSlider, QSpinBox, QDoubleSpinBox, QCheckBox, QGroupBox,
    QFileDialog, QMessageBox, QFrame, QSplitter, QProgressBar, QTextEdit
)

from app.utils.resource_helper import resource_path
from app.depth.religious_relief_processor import process_religious_relief_depth, PRESETS
from app.relief.relief_generator import generate_relief
from app.mesh.mesh_smoother import smooth_mesh
from app.export.stl_exporter import validate_mesh, export_stl, STLExportError


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI BasRelief v2.5 - CNC & Religious Relief 3D Generator (.exe)")
        self.resize(1280, 800)
        self.setMinimumSize(1000, 650)

        # Set Window Icon using resource_path
        icon_file = resource_path("assets/icon.ico")
        if os.path.exists(icon_file):
            self.setWindowIcon(QIcon(icon_file))

        # State Variables
        self.input_image = None
        self.depth_map = None
        self.current_mesh = None

        self.init_ui()

    def init_ui(self):
        # Central Widget & Main Layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)

        # Main Splitter: Left Sidebar (Controls) & Right Workspace (Previews)
        splitter = QSplitter(Qt.Horizontal)
        main_layout.addWidget(splitter)

        # ---------------------------------------------------------------------
        # LEFT CONTROL PANEL (Scrollable / Fixed width)
        # ---------------------------------------------------------------------
        control_panel = QWidget()
        control_panel.setMinimumWidth(380)
        control_panel.setMaximumWidth(450)
        control_layout = QVBoxLayout(control_panel)
        control_layout.setContentsMargins(5, 5, 5, 5)
        control_layout.setSpacing(10)

        # 1. FILE INPUT GROUP
        file_group = QGroupBox("1. Nguồn Ảnh Đầu Vào (Input Image)")
        file_layout = QVBoxLayout(file_group)

        self.btn_open = QPushButton("📁 Chọn Ảnh Tượng / Phù Điêu (JPG, PNG)...")
        self.btn_open.setStyleSheet("""
            QPushButton {
                background-color: #2563eb; color: white; font-weight: bold;
                padding: 8px; border-radius: 6px; font-size: 12px;
            }
            QPushButton:hover { background-color: #1d4ed8; }
        """)
        self.btn_open.clicked.connect(self.open_image_dialog)
        file_layout.addWidget(self.btn_open)

        self.lbl_img_info = QLabel("Chưa chọn ảnh nào.")
        self.lbl_img_info.setStyleSheet("color: #94a3b8; font-size: 11px;")
        file_layout.addWidget(self.lbl_img_info)

        control_layout.addWidget(file_group)

        # 2. RELIGIOUS PRESETS GROUP
        preset_group = QGroupBox("2. Chế Độ Tượng Phật & Phù Điêu Tâm Linh")
        preset_layout = QVBoxLayout(preset_group)

        preset_layout.addWidget(QLabel("Preset Chuyên Biệt:"))
        self.combo_presets = QComboBox()
        for key, info in PRESETS.items():
            self.combo_presets.addItem(info["name"], key)
        self.combo_presets.currentIndexChanged.connect(self.on_preset_changed)
        preset_layout.addWidget(self.combo_presets)

        # Sliders: Face Detail, Ornament Detail, Edge Preservation, Depth Compression
        self.slider_face = self.create_slider(preset_layout, "Face Detail (Bảo tồn ngũ quan mặt):", 0, 100, 90)
        self.slider_ornament = self.create_slider(preset_layout, "Ornament Detail (Nổi hoa văn & y phục):", 0, 100, 85)
        self.slider_edge = self.create_slider(preset_layout, "Edge Preservation (Sắc nét đường viền):", 0, 100, 80)
        self.slider_depth_comp = self.create_slider(preset_layout, "Depth Compression (Nén bóng hốc mắt):", 0, 100, 70)

        control_layout.addWidget(preset_group)

        # 3. CNC RELIEF & CAM OPTIMIZATION GROUP
        cnc_group = QGroupBox("3. Chế Độ CNC RELIEF (JDPaint, ArtCAM, Aspire)")
        cnc_layout = QVBoxLayout(cnc_group)

        # Physical Dimensions & Depth
        dim_layout = QHBoxLayout()
        dim_layout.addWidget(QLabel("Rộng (X mm):"))
        self.spin_width_mm = QDoubleSpinBox()
        self.spin_width_mm.setRange(10, 5000)
        self.spin_width_mm.setValue(300)
        dim_layout.addWidget(self.spin_width_mm)

        dim_layout.addWidget(QLabel("Nổi Max (Z mm):"))
        self.spin_depth_mm = QDoubleSpinBox()
        self.spin_depth_mm.setRange(1, 200)
        self.spin_depth_mm.setValue(25)
        dim_layout.addWidget(self.spin_depth_mm)
        cnc_layout.addLayout(dim_layout)

        # Base thickness & Min Detail Height
        base_layout = QHBoxLayout()
        base_layout.addWidget(QLabel("Đáy Phẳng (mm):"))
        self.spin_base_mm = QDoubleSpinBox()
        self.spin_base_mm.setRange(1, 100)
        self.spin_base_mm.setValue(5)
        base_layout.addWidget(self.spin_base_mm)

        base_layout.addWidget(QLabel("Ngưỡng Dao (mm):"))
        self.spin_min_detail = QDoubleSpinBox()
        self.spin_min_detail.setRange(0.01, 2.0)
        self.spin_min_detail.setValue(0.1)
        base_layout.addWidget(self.spin_min_detail)
        cnc_layout.addLayout(base_layout)

        # Mesh Resolution Presets (Low, Medium, High, Ultra)
        cnc_layout.addWidget(QLabel("Độ Phân Giải Mật Độ Lưới (Resolution):"))
        self.combo_res = QComboBox()
        self.combo_res.addItems(["Low (Step 0.5mm)", "Medium (Step 0.3mm)", "High (Step 0.2mm)", "Ultra (Step 0.1mm)"])
        self.combo_res.setCurrentIndex(2) # High default
        self.combo_res.currentIndexChanged.connect(self.update_estimations)
        cnc_layout.addWidget(self.combo_res)

        # Realtime Estimations Display
        self.lbl_estimations = QLabel("Số Tam Giác: - | STL: - MB | Thời gian: -")
        self.lbl_estimations.setStyleSheet("""
            background-color: #0f172a; color: #38bdf8; font-family: monospace;
            padding: 6px; border-radius: 4px; font-size: 11px; font-weight: bold;
        """)
        cnc_layout.addWidget(self.lbl_estimations)

        control_layout.addWidget(cnc_group)

        # 4. PROCESS & EXPORT BUTTONS
        action_layout = QVBoxLayout()
        self.btn_process = QPushButton("⚡ Tạo Heightmap & Dựng Phù Điêu 3D")
        self.btn_process.setStyleSheet("""
            QPushButton {
                background-color: #059669; color: white; font-weight: bold;
                padding: 10px; border-radius: 6px; font-size: 13px;
            }
            QPushButton:hover { background-color: #047857; }
        """)
        self.btn_process.clicked.connect(self.process_pipeline)
        action_layout.addWidget(self.btn_process)

        self.btn_export = QPushButton("💾 Xuất File Binary STL (.stl)")
        self.btn_export.setEnabled(False)
        self.btn_export.setStyleSheet("""
            QPushButton {
                background-color: #d97706; color: white; font-weight: bold;
                padding: 10px; border-radius: 6px; font-size: 13px;
            }
            QPushButton:hover { background-color: #b45309; }
            QPushButton:disabled { background-color: #475569; color: #94a3b8; }
        """)
        self.btn_export.clicked.connect(self.export_stl_dialog)
        action_layout.addWidget(self.btn_export)

        control_layout.addLayout(action_layout)
        control_layout.addStretch()

        splitter.addWidget(control_panel)

        # ---------------------------------------------------------------------
        # RIGHT WORKSPACE PANEL (Previews & Validation Console)
        # ---------------------------------------------------------------------
        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(5, 5, 5, 5)

        # Previews Horizontal Layout (Image Input & Depth Map Preview)
        preview_layout = QHBoxLayout()

        # Input Image Box
        box_input = QGroupBox("Ảnh Gốc")
        box_input_layout = QVBoxLayout(box_input)
        self.lbl_view_input = QLabel("Kéo thả hoặc mở ảnh...")
        self.lbl_view_input.setAlignment(Qt.AlignCenter)
        self.lbl_view_input.setStyleSheet("background-color: #1e293b; border: 1px dashed #475569; border-radius: 6px;")
        box_input_layout.addWidget(self.lbl_view_input)
        preview_layout.addWidget(box_input)

        # Depth Map Box
        box_depth = QGroupBox("Heightmap / Depth Map")
        box_depth_layout = QVBoxLayout(box_depth)
        self.lbl_view_depth = QLabel("Bản đồ độ sâu...")
        self.lbl_view_depth.setAlignment(Qt.AlignCenter)
        self.lbl_view_depth.setStyleSheet("background-color: #1e293b; border: 1px dashed #475569; border-radius: 6px;")
        box_depth_layout.addWidget(self.lbl_view_depth)
        preview_layout.addWidget(box_depth)

        right_layout.addLayout(preview_layout, stretch=2)

        # Console Log & Pre-Export Quality Checklist
        box_log = QGroupBox("Báo Cáo Kiểm Trực Tiếp & Quality Checklist (CNC Pre-Export)")
        box_log_layout = QVBoxLayout(box_log)

        self.txt_log = QTextEdit()
        self.txt_log.setReadOnly(True)
        self.txt_log.setStyleSheet("background-color: #020617; color: #22c55e; font-family: monospace; font-size: 11px;")
        self.log_msg("AI BasRelief Studio v2.5 sẵn sàng.")
        box_log_layout.addWidget(self.txt_log)

        right_layout.addWidget(box_log, stretch=1)

        splitter.addWidget(right_panel)
        splitter.setSizes([400, 880])

        self.update_estimations()

    def create_slider(self, layout, label_text, min_v, max_v, default_v):
        lbl = QLabel(f"{label_text} {default_v}%")
        layout.addWidget(lbl)

        slider = QSlider(Qt.Horizontal)
        slider.setRange(min_v, max_v)
        slider.setValue(default_v)
        slider.valueChanged.connect(lambda v: lbl.setText(f"{label_text} {v}%"))
        layout.addWidget(slider)
        return slider

    def log_msg(self, text):
        self.txt_log.append(f"> {text}")

    def on_preset_changed(self):
        preset_key = self.combo_presets.currentData()
        if preset_key in PRESETS and preset_key != "custom":
            p = PRESETS[preset_key]
            self.slider_face.setValue(int(p["face_detail"] * 100))
            self.slider_ornament.setValue(int(p["ornament_detail"] * 100))
            self.slider_edge.setValue(int(p["edge_preservation"] * 100))
            self.slider_depth_comp.setValue(int(p["depth_compression"] * 100))

    def update_estimations(self):
        w_mm = self.spin_width_mm.value()
        # Assume square/4:3 ratio for estimation
        h_mm = w_mm * 0.75
        res_idx = self.combo_res.currentIndex()
        steps = [0.5, 0.3, 0.2, 0.1]
        step_mm = steps[res_idx] if res_idx < len(steps) else 0.2

        nx = int(np.round(w_mm / step_mm)) + 1
        ny = int(np.round(h_mm / step_mm)) + 1
        triangles = (nx - 1) * (ny - 1) * 4 + 4 * (nx + ny - 2)
        bytes_size = 84 + (50 * triangles)
        mb_size = round(bytes_size / (1024 * 1024), 2)
        proc_time = round(triangles / 2500000.0, 1)

        self.lbl_estimations.setText(
            f"Số Tam Giác: {triangles:,} | STL: ~{mb_size} MB | Xử lý: ~{proc_time}s"
        )

    def open_image_dialog(self):
        filepath, _ = QFileDialog.getOpenFileName(
            self, "Chọn ảnh phù điêu / tượng Phật", "", "Image Files (*.jpg *.png *.bmp *.webp)"
        )
        if filepath:
            img = cv2.imread(filepath)
            if img is not None:
                self.input_image = img
                h, w = img.shape[:2]
                self.lbl_img_info.setText(f"Đã mở: {os.path.basename(filepath)} ({w}x{h} px)")
                
                # Show Preview
                qimg = QImage(cv2.cvtColor(img, cv2.COLOR_BGR2RGB).data, w, h, w * 3, QImage.Format_RGB888)
                pixmap = QPixmap.fromImage(qimg).scaled(300, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
                self.lbl_view_input.setPixmap(pixmap)
                self.log_msg(f"Đã tải ảnh đầu vào thành công: {w}x{h} px.")
            else:
                QMessageBox.warning(self, "Lỗi", "Không thể đọc định dạng ảnh đã chọn.")

    def process_pipeline(self):
        if self.input_image is None:
            QMessageBox.information(self, "Thông báo", "Vui lòng chọn ảnh đầu vào trước khi xử lý.")
            return

        self.log_msg("Đang trích xuất Depth Map chuyên biệt cho Phù Điêu Tâm Linh...")
        
        # 1. Depth Processing
        face_d = self.slider_face.value() / 100.0
        ornament_d = self.slider_ornament.value() / 100.0
        edge_p = self.slider_edge.value() / 100.0
        depth_c = self.slider_depth_comp.value() / 100.0
        preset_k = self.combo_presets.currentData()

        self.depth_map = process_religious_relief_depth(
            image_np=self.input_image,
            preset_key=preset_k,
            face_detail=face_d,
            ornament_detail=ornament_d,
            edge_preservation=edge_p,
            depth_compression=depth_c
        )

        # Show Depth Preview
        depth_uint8 = (self.depth_map * 255.0).astype(np.uint8)
        dh, dw = depth_uint8.shape
        qimg_depth = QImage(depth_uint8.data, dw, dh, dw, QImage.Format_Grayscale8)
        pixmap_d = QPixmap.fromImage(qimg_depth).scaled(300, 300, Qt.KeepAspectRatio, Qt.SmoothTransformation)
        self.lbl_view_depth.setPixmap(pixmap_d)

        self.log_msg("Đang dựng khối 3D Solid Relief (Watertight)...")

        # 2. 3D Relief Mesh Generation
        w_mm = self.spin_width_mm.value()
        aspect = dw / dh
        h_mm = w_mm / aspect
        d_mm = self.spin_depth_mm.value()
        base_mm = self.spin_base_mm.value()

        res_idx = self.combo_res.currentIndex()
        resolutions = [200, 300, 400, 600]
        res_grid = resolutions[res_idx] if res_idx < len(resolutions) else 300

        mesh_raw = generate_relief(
            depth_map=self.depth_map,
            width_mm=w_mm,
            height_mm=h_mm,
            depth_mm=d_mm,
            base_thickness_mm=base_mm,
            resolution=res_grid
        )

        # 3. Smooth & Repair Mesh
        self.current_mesh = smooth_mesh(mesh_raw, strength="medium", detail_preservation=0.8)

        # 4. Pre-Export Quality Validation
        is_valid, issues = validate_mesh(self.current_mesh)
        self.log_msg("--------------------------------------------------")
        self.log_msg("   KẾT QUẢ KIỂM TRA CHẤT LƯỢNG MESH (PRE-EXPORT): ")
        self.log_msg(f" • Watertight (Kín khối 100%): {'✓ CHUẨN' if self.current_mesh.is_watertight else '❌ LỖI'}")
        self.log_msg(f" • Tỷ lệ Manifold: {'✓ CHUẨN' if is_valid else '❌ LỖI'}")
        self.log_msg(f" • Số đỉnh / Số mặt: {len(self.current_mesh.vertices):,} / {len(self.current_mesh.faces):,}")
        self.log_msg("--------------------------------------------------")

        self.btn_export.setEnabled(True)
        QMessageBox.information(self, "Hoàn thành", "Đã dựng khối 3D Phù Điêu thành công và kiểm tra chất lượng!")

    def export_stl_dialog(self):
        if self.current_mesh is None:
            return

        filepath, _ = QFileDialog.getSaveFileName(
            self, "Xuất File Binary STL cho Máy CNC", "PhuDieuPhat.stl", "STL Files (*.stl)"
        )
        if filepath:
            try:
                report = export_stl(self.current_mesh, filepath)
                self.log_msg("==================================================")
                self.log_msg("   ĐÃ XUẤT THÀNH CÔNG FILE STL BINARY CHO CNC     ")
                for k, v in report.items():
                    self.log_msg(f" • {k}: {v}")
                self.log_msg("==================================================")
                QMessageBox.information(self, "Thành công", f"Đã xuất file STL thành công:\n{filepath}")
            except STLExportError as err:
                QMessageBox.critical(self, "Lỗi Xuất File", str(err))


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    from PySide6.QtWidgets import QApplication
    main()
