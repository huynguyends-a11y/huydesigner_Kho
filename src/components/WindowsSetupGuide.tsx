import React from "react";
import { Download, Monitor, FileCode, CheckCircle2, Terminal, FolderArchive, Sparkles, Cpu, Layers } from "lucide-react";

export const WindowsSetupGuide: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-slate-200">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Monitor className="w-64 h-64 text-cyan-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-3 py-1 rounded-full text-xs font-mono font-bold">
            <Monitor className="w-3.5 h-3.5" /> HƯỚNG DẪN TẢI & ĐÓNG GÓI AI_BasRelief.exe
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Hướng Dẫn Lấy File Cài Đặt AI_BasRelief.exe & AI_BasRelief_Setup.exe
          </h2>
          <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
            Ứng dụng hỗ trợ cả **Giao diện Web Trực Tuyến** (dùng ngay không cần cài đặt) và **File Executable Windows Độc Lập** (`.exe`) cho máy chạm khắc gỗ, đá, kim loại CNC.
          </p>
        </div>
      </div>

      {/* 2 Main Paths Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option 1: Web Studio Direct Use */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Cách 1: Sử Dụng Web Studio Trực Tiếp</h3>
                <p className="text-xs text-slate-400">Không cần cài đặt Python, không cần tải file .exe</p>
              </div>
            </div>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Nạp ảnh tượng Phật, phù điêu tâm linh trực tiếp trên trình duyệt.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Chỉnh sửa thông số CNC: kích thước (mm), độ nổi (Z mm), độ phân giải lưới.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Bấm nút <strong className="text-amber-400">"Xuất STL (Binary)"</strong> để tải file 3D kín khối Watertight về máy nhập vào JDPaint, ArtCAM, Aspire.</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1.5 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50">
              ✓ Khuyên dùng cho công việc xử lý nhanh hàng ngày.
            </span>
          </div>
        </div>

        {/* Option 2: Export Source Code & Compile EXE */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
                <FolderArchive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Cách 2: Tải Mã Nguồn & Tạo AI_BasRelief.exe</h3>
                <p className="text-xs text-slate-400">Đóng gói phần mềm Windows độc lập chạy Offline</p>
              </div>
            </div>

            <ol className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B1</span>
                <span>Trên góc phải màn hình AI Studio, bấm menu <strong>Settings (⚙️)</strong> → chọn <strong>Export to ZIP</strong>.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B2</span>
                <span>Giải nén thư mục ZIP trên máy tính Windows của bạn.</span>
              </li>
              <li className="flex items-start gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0">B3</span>
                <span>Mở Command Prompt (CMD) tại thư mục giải nén và chạy lệnh:</span>
              </li>
            </ol>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 space-y-1">
            <div className="text-[10px] text-slate-500 font-sans">Lệnh cài đặt & biên dịch tự động:</div>
            <div className="text-amber-300 font-bold">pip install -r requirements.txt</div>
            <div className="text-emerald-400 font-bold">python build_executable.py</div>
          </div>
        </div>
      </div>

      {/* Executable Package Structure Overview */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <FileCode className="w-5 h-5 text-amber-400" /> Các File Đã Được Tạo Sẵn Trong Dự Án
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-cyan-300 font-bold">AI_BasRelief.spec</div>
            <p className="text-[11px] text-slate-400 font-sans">
              File cấu hình PyInstaller đóng gói GUI PySide6 + OpenCV + Trimesh thành 1 file .exe.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-emerald-300 font-bold">build_executable.py</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Script tự động tạo icon, gọi PyInstaller và kiểm tra file đầu ra `dist/AI_BasRelief/AI_BasRelief.exe`.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-amber-300 font-bold">installer_script.iss</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Kịch bản Inno Setup để tạo file bộ cài đặt `AI_BasRelief_Setup.exe` chuyên nghiệp.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-sky-300 font-bold">test_pipeline.py</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Script kiểm thử tự động 6 bước từ nạp ảnh, dựng khối đến kiểm định 100% Watertight.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-indigo-300 font-bold">app/utils/resource_helper.py</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Hỗ trợ đường dẫn tương đối `_MEIPASS` giúp file EXE chạy mà không phụ thuộc đường dẫn cố định.
            </p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <div className="text-rose-300 font-bold">requirements.txt</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Danh sách đầy đủ các thư viện Python: PySide6, OpenCV, NumPy, Trimesh, SciPy, PyInstaller.
            </p>
          </div>
        </div>
      </div>

      {/* Pre-export Quality Standards */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-base text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Cam Kết Chất Lượng File STL Cho Máy CNC CAM
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Mỗi file STL được tạo từ phần mềm (dù chạy trên Web hay bản Executable Windows Offline) đều được tự động sửa lỗi và kiểm định nghiêm ngặt qua 6 tiêu chuẩn:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-300 pt-1">
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Watertight (Kín khối)
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Manifold (Chuẩn 2 mặt)
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Outward Normals
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> 0 Degenerate Faces
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> 0 Duplicate Faces
          </div>
          <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> 0 Boundary Edges
          </div>
        </div>
      </div>
    </div>
  );
};
