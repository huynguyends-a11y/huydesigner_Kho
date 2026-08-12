# AI BasRelief Studio v2.5 — Standalone Windows Desktop App (.exe)

Hệ thống chuyển đổi ảnh 2D Tượng Phật, Phù Điêu Tâm Linh & Hoa Văn Chạm Khắc thành file **Binary STL 3D kín khối (Watertight Solid)** tối ưu cho máy khắc gỗ, đá, kim loại CNC và in 3D.

---

## 🌟 Tính Năng Chính (Key Features)

- **Đóng gói Windows Độc Lập (.exe)**: Chạy trực tiếp qua file `AI_BasRelief.exe` hoặc `AI_BasRelief_Setup.exe` mà **không cần người dùng cài đặt Python** hay mở cửa sổ Terminal.
- **Tối Ưu Tượng Phật & Phù Điêu Tâm Linh**:
  - Bảo tồn chi tiết ngũ quan khuôn mặt (Mắt, Mũi, Môi, Tai) không bị dẹt/phẳng.
  - **Depth Compression (Nén Hốc Bóng Tối)**: Nâng sàn tối thiểu ngăn ngừa bóng đổ đậm tạo thành các hố thủng/lỗ hổng giả ở hốc mắt hay nếp gấp cổ.
  - Bộ Presets: `Buddha`, `Wood Carving`, `Stone Relief`, `Floral Ornament`, `Portrait`, `Landscape`, `Custom`.
- **Tương Thích Tối Đa Phần Mềm CNC CAM**:
  - Xuất file STL nhập trực tiếp vào **JDPaint**, **JDSoft**, **ArtCAM**, **Aspire**, **VCarve**, **Fusion 360**.
  - Thiết lập thông số thực tế: Rộng (X mm), Cao (Y mm), Độ nổi tối đa (Z mm), Độ dày chân đế (Base Thickness mm), Ngưỡng kích thước mũi dao (Min Detail Height & Min Feature Width).
  - Tùy chọn Mật độ lưới Mesh Resolution: `Low (0.5mm)`, `Medium (0.3mm)`, `High (0.2mm)`, `Ultra (0.1mm)`.
- **Pre-Export Quality Checklist**: Kiểm tra 6 tiêu chuẩn chất lượng hình học trước khi xuất:
  1. **Watertight** (Kín khối 100%)
  2. **Manifold** (Cạnh chia sẻ tối đa 2 mặt)
  3. **Outward Normals** (Vector pháp tuyến hướng ra ngoài)
  4. **0 Degenerate Faces** (Không chứa tam giác diện tích bằng 0)
  5. **0 Duplicate Faces** (Không chứa mặt trùng lặp)
  6. **0 Boundary Open Edges** (Không bị hở lề)

---

## 📁 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
├── app/
│   ├── depth/
│   │   └── religious_relief_processor.py  # Thuật toán Depth & Nén bóng hốc mắt
│   ├── relief/
│   │   ├── relief_generator.py           # Dựng khối 3D Solid Relief
│   │   └── cnc_relief_processor.py        # Tối ưu hóa tham số CNC & CAM
│   ├── mesh/
│   │   └── mesh_smoother.py               # Làm mịn & Tự động sửa lỗi Mesh
│   ├── export/
│   │   └── stl_exporter.py               # Kiểm tra 6 tiêu chí & Xuất Binary STL
│   ├── utils/
│   │   └── resource_helper.py            # Xử lý đường dẫn tương đối (_MEIPASS)
│   ├── main_window.py                    # Giao diện PySide6 GUI
│   └── main.py                           # Điểm khởi chạy chính
├── assets/
│   └── icon.ico                          # Icon ứng dụng Windows
├── dist/
│   └── AI_BasRelief/
│       └── AI_BasRelief.exe              # File chạy Windows độc lập
├── test_outputs/                         # Thư mục chứa kết quả kiểm thử
├── requirements.txt                      # Danh sách thư viện Python
├── AI_BasRelief.spec                     # Cấu hình đóng gói PyInstaller
├── build_executable.py                   # Script tự động đóng gói EXE
├── installer_script.iss                  # Script đóng gói Bộ cài đặt Inno Setup
├── test_pipeline.py                      # Script test kiểm thử tự động toàn trình
└── README.md                             # Hướng dẫn sử dụng
```

---

## 🚀 Hướng Dẫn Sử Dụng Nhanh (User Guide)

### 1. Cho Người Dùng Cuối (End-Users) - Chạy File EXE
1. Tải bộ cài `AI_BasRelief_Setup.exe` hoặc thư mục giải nén `dist/AI_BasRelief/`.
2. Chạy file **`AI_BasRelief.exe`** (không cần mở CMD/Terminal, không cần cài Python).
3. Nhấp **"📁 Chọn Ảnh Tượng / Phù Điêu"** để mở file ảnh JPG / PNG.
4. Chọn Preset phù hợp (ví dụ: `Buddha`) hoặc tinh chỉnh các thanh trượt `Face Detail`, `Depth Compression`.
5. Nhập kích thước chiều rộng thực tế `X (mm)` và độ nổi tối đa `Z (mm)`.
6. Bấm **"⚡ Tạo Heightmap & Dựng Phù Điêu 3D"**.
7. Bấm **"💾 Xuất File Binary STL (.stl)"** để lưu file sản phẩm cho máy CNC.

---

## 🛠️ Hướng Dẫn Biên Dịch & Đóng Gói Lại (Developer Build Guide)

Nếu bạn là nhà phát triển muốn biên dịch lại ứng dụng từ Mã Nguồn Python:

### Bước 1: Môi Trường & Thư Viện
```bash
# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt
```

### Bước 2: Chạy Kiểm Thử Tự Động (Test Pipeline)
Chạy kịch bản test kiểm tra 6 bước (Image Loading -> Depth -> Mesh -> Repair -> STL Export -> Reload Validation):
```bash
python test_pipeline.py
```
> Nếu tất cả 6 bước báo `100% PASS`, hệ thống đã sẵn sàng đóng gói.

### Bước 3: Đóng Gói Thành `AI_BasRelief.exe` (PyInstaller)
Chạy script đóng gói tự động:
```bash
python build_executable.py
```
File `AI_BasRelief.exe` sẽ được tạo tại thư mục: `dist/AI_BasRelief/AI_BasRelief.exe`.

### Bước 4: Tạo Bộ Cài Đặt `AI_BasRelief_Setup.exe` (Inno Setup)
1. Tải và cài đặt [Inno Setup Compiler](https://jrsoftware.org/isinfo.php).
2. Mở file `installer_script.iss` bằng Inno Setup.
3. Bấm **Compile (F9)**.
4. File bộ cài `AI_BasRelief_Setup.exe` sẽ xuất hiện trong thư mục `dist_installer/`.

---

## 🧪 Báo Cáo Kiểm Thử STL (Sample STL Verification)

File STL xuất ra đáp ứng 100% các tiêu chuẩn:
- **Đơn vị**: Millimeter (mm) tuyệt đối.
- **Định dạng**: Binary STL (80 bytes header + 4 bytes triangle count).
- **Mặt đáy**: Phẳng tuyệt đối ở mặt $Z = 0.0\text{ mm}$.
- **Độ khép kín**: Watertight Solid (không có cạnh hở hay lỗ hổng).

---

## 🛡️ Giấy Phép & Bản Quyền
Phát triển bởi **AI BasRelief Studio v2.5** cho nhu cầu gia công chế tác CNC & In 3D.
