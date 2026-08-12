import React from "react";
import { Box, Code2, Layers, Cpu, Download, Sparkles } from "lucide-react";

interface HeaderProps {
  activeTab: "studio" | "python_arch";
  setActiveTab: (tab: "studio" | "python_arch") => void;
  onExportStl?: () => void;
  isMeshReady: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onExportStl,
  isMeshReady,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-amber-500 to-orange-600 p-2.5 rounded-xl text-slate-950 font-black shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Box className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-orange-100 to-amber-400 bg-clip-text text-transparent">
                AI BAS RELIEF → STL
              </h1>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-medium">
                CNC & 3D Print Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Chuyển ảnh 2D Tượng Phật, Phù điêu thành mô hình 3D Solid kín khối (Đơn vị: mm)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("studio")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "studio"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3D Relief Studio</span>
          </button>

          <button
            onClick={() => setActiveTab("python_arch")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "python_arch"
                ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Kiến Trúc Python PySide6 (`app/`)</span>
          </button>
        </div>

        {/* Quick Export CTA */}
        <div className="flex items-center gap-3">
          {activeTab === "studio" && (
            <button
              onClick={onExportStl}
              disabled={!isMeshReady}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isMeshReady
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Xuất STL (Binary)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
