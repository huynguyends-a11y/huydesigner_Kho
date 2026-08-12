import React, { useState } from "react";
import { PYTHON_ARCH_DATA } from "../data/pythonArchitecture";
import { PythonModuleInfo } from "../types";
import { Folder, FileCode, Copy, Check, ArrowRight, Terminal, Cpu, Layers } from "lucide-react";

export const PythonArchDoc: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<PythonModuleInfo>(
    PYTHON_ARCH_DATA.modules[0]
  );
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const handleCopyCode = (code: string, path: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">{PYTHON_ARCH_DATA.title}</h2>
            <p className="text-xs text-amber-400 font-mono mt-0.5">
              Windows 10/11 • Python 3.11+ • PySide6 GUI • OpenCV • NumPy • Trimesh / Open3D
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-800 pt-4">
          {PYTHON_ARCH_DATA.architectureOverview}
        </p>

        {/* Quick Setup Commands */}
        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 font-mono text-xs space-y-2">
          <div className="flex items-center gap-2 text-slate-400 font-semibold">
            <Terminal className="w-4 h-4 text-amber-400" />
            <span>Hướng dẫn cài đặt & Chạy dự án Windows:</span>
          </div>
          <div className="space-y-1 text-slate-300 pl-2 border-l-2 border-amber-500/50">
            {PYTHON_ARCH_DATA.setupInstructions.map((step, idx) => (
              <p key={idx}>{step}</p>
            ))}
          </div>
        </div>
      </div>

      {/* Inter-Module Processing Pipeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>Luồng Giao Tiếp Giữa Các Module (Pipeline Workflow)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {PYTHON_ARCH_DATA.pipelineFlow.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-1"
            >
              <div className="font-semibold text-amber-300">{step.split(":")[0]}</div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {step.split(":")[1] || step}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Directory Tree & Module Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Directory Tree */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider px-2 flex items-center gap-1.5">
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Cấu Trúc Thư Mục (`app/`)</span>
          </div>

          <div className="space-y-1">
            {PYTHON_ARCH_DATA.modules.map((mod) => {
              const isSelected = selectedModule.path === mod.path;
              return (
                <button
                  key={mod.path}
                  onClick={() => setSelectedModule(mod)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md"
                      : "bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-slate-100 border border-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-4 h-4 shrink-0 ${isSelected ? "text-slate-950" : "text-amber-400"}`} />
                    <span className="truncate">{mod.path}</span>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Module Details & Code Boilerplate */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs text-amber-400 font-mono font-semibold">
                {selectedModule.path}
              </span>
              <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                {selectedModule.name}
              </h3>
            </div>

            <button
              onClick={() => handleCopyCode(selectedModule.codeSnippet, selectedModule.path)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer"
            >
              {copiedPath === selectedModule.path ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép Code!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép Code Template</span>
                </>
              )}
            </button>
          </div>

          {/* Purpose & Communication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-300 font-semibold">Chức năng chính:</span>
              <p className="text-slate-300 leading-relaxed">{selectedModule.purpose}</p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-amber-300 font-semibold">Vai trò giao tiếp trong Pipeline:</span>
              <p className="text-slate-300 leading-relaxed">{selectedModule.communicationRole}</p>
            </div>
          </div>

          {/* Dependencies & Classes */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-medium">Thư viện sử dụng:</span>
            {selectedModule.dependencies.map((dep, idx) => (
              <span key={idx} className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded text-amber-300 font-mono">
                {dep}
              </span>
            ))}
          </div>

          {/* Code Viewer */}
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-300">Code mẫu triển khai ({selectedModule.path}):</span>
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-[380px]">
              <pre><code>{selectedModule.codeSnippet}</code></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
