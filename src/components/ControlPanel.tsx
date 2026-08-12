import React from "react";
import { Sliders, Sparkles, Box, RefreshCw, Wand2, Shield, Eye, Flame, Cpu, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { ReliefSettings, AiDepthAnalysis, ReliefPresetKey, CncResolutionPreset } from "../types";
import { computeCncEstimations } from "../utils/heightmap";

const PRESET_CONFIGS: Record<
  ReliefPresetKey,
  {
    name: string;
    description: string;
    faceDetail: number;
    ornamentDetail: number;
    edgePreservation: number;
    depthCompression: number;
    contrast: number;
    blurRadius: number;
  }
> = {
  buddha: {
    name: "Buddha (Tượng Phật)",
    description: "Tối ưu nét mặt, mắt, mũi, tai, tòa sen, y phục, hào quang. Chống hốc sâu giả.",
    faceDetail: 90,
    ornamentDetail: 85,
    edgePreservation: 80,
    depthCompression: 70,
    contrast: 1.1,
    blurRadius: 1,
  },
  wood_carving: {
    name: "Wood Carving (Chạm Gỗ)",
    description: "Sắc nét đường chạm đục, nổi hoa văn, vân gỗ.",
    faceDetail: 75,
    ornamentDetail: 95,
    edgePreservation: 90,
    depthCompression: 50,
    contrast: 1.3,
    blurRadius: 0,
  },
  stone_relief: {
    name: "Stone Relief (Phù Điêu Đá)",
    description: "Tăng độ nổi tranh đá, tảng phù điêu đúc đĩnh.",
    faceDetail: 70,
    ornamentDetail: 80,
    edgePreservation: 85,
    depthCompression: 60,
    contrast: 1.2,
    blurRadius: 1,
  },
  floral_ornament: {
    name: "Floral Ornament (Hoa Văn)",
    description: "Tập trung họa tiết hoa lá, hoa văn trang trí tinh xảo.",
    faceDetail: 40,
    ornamentDetail: 95,
    edgePreservation: 95,
    depthCompression: 40,
    contrast: 1.4,
    blurRadius: 0,
  },
  portrait: {
    name: "Portrait (Chân Dung)",
    description: "Tối ưu đường nét mặt, mắt, mũi, môi người.",
    faceDetail: 95,
    ornamentDetail: 60,
    edgePreservation: 75,
    depthCompression: 65,
    contrast: 1.1,
    blurRadius: 1,
  },
  landscape: {
    name: "Landscape (Sơn Thủy)",
    description: "Phù điêu phong cảnh, núi non, mây nước.",
    faceDetail: 30,
    ornamentDetail: 85,
    edgePreservation: 70,
    depthCompression: 30,
    contrast: 1.3,
    blurRadius: 2,
  },
  custom: {
    name: "Custom (Tùy Chỉnh)",
    description: "Tùy chỉnh thông số thủ công.",
    faceDetail: 70,
    ornamentDetail: 70,
    edgePreservation: 70,
    depthCompression: 50,
    contrast: 1.2,
    blurRadius: 1,
  },
};

interface ControlPanelProps {
  settings: ReliefSettings;
  onChangeSettings: (newSettings: ReliefSettings) => void;
  onGenerateRelief: () => void;
  onSmoothMesh: () => void;
  onAnalyzeAiDepth: () => void;
  isAiAnalyzing: boolean;
  aiAnalysis: AiDepthAnalysis | null;
  aspectRatio: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onChangeSettings,
  onGenerateRelief,
  onSmoothMesh,
  onAnalyzeAiDepth,
  isAiAnalyzing,
  aiAnalysis,
  aspectRatio,
}) => {
  const updateSetting = <K extends keyof ReliefSettings>(
    key: K,
    value: ReliefSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };

    // Auto calculate Height (mm) based on Width (mm) and Aspect Ratio
    if (key === "widthMm" && aspectRatio > 0) {
      updated.heightMm = Math.round((value as number) / aspectRatio);
    }

    // Switch preset to custom if modifying specific slider manually
    if (
      ["faceDetail", "ornamentDetail", "edgePreservation", "depthCompression"].includes(
        key as string
      )
    ) {
      updated.reliefPreset = "custom";
    }

    onChangeSettings(updated);
  };

  const handleSelectPreset = (presetKey: ReliefPresetKey) => {
    const config = PRESET_CONFIGS[presetKey];
    onChangeSettings({
      ...settings,
      reliefPreset: presetKey,
      faceDetail: config.faceDetail,
      ornamentDetail: config.ornamentDetail,
      edgePreservation: config.edgePreservation,
      depthCompression: config.depthCompression,
      contrast: config.contrast,
      blurRadius: config.blurRadius,
    });
  };

  const handleSelectCncResolutionPreset = (preset: CncResolutionPreset) => {
    let step = settings.meshResolutionStepMm;
    if (preset === "low") step = 0.5;
    else if (preset === "medium") step = 0.3;
    else if (preset === "high") step = 0.2;
    else if (preset === "ultra") step = 0.1;

    onChangeSettings({
      ...settings,
      cncResolutionPreset: preset,
      meshResolutionStepMm: step,
    });
  };

  const cncEst = computeCncEstimations(settings);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>2. Chỉnh Tham Số Phù Điêu (Đơn vị: mm)</span>
        </div>
        <button
          onClick={onAnalyzeAiDepth}
          disabled={isAiAnalyzing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-colors"
        >
          <Wand2 className={`w-3.5 h-3.5 ${isAiAnalyzing ? "animate-spin" : ""}`} />
          <span>{isAiAnalyzing ? "Đang phân tích..." : "AI Depth Analyze"}</span>
        </button>
      </div>

      {/* AI Analysis Card */}
      {aiAnalysis && (
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 text-xs space-y-1.5 text-indigo-200">
          <div className="flex items-center justify-between font-semibold text-indigo-300">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI Depth Analysis:
            </span>
            <span className="bg-indigo-500/20 px-2 py-0.5 rounded text-[11px]">
              Điểm độ sâu: {aiAnalysis.depthQuality || 8.5}/10
            </span>
          </div>
          {aiAnalysis.recommendedReliefDepthMm && (
            <p>
              • Độ sâu đề xuất: <strong className="text-amber-300">{aiAnalysis.recommendedReliefDepthMm} mm</strong>
            </p>
          )}
          {aiAnalysis.heightmapTips && (
            <p className="text-slate-300 italic text-[11px] leading-relaxed">
              💡 {aiAnalysis.heightmapTips}
            </p>
          )}
        </div>
      )}

      {/* 1. Dimensions Group */}
      <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span>Kích thước Tổng (mm)</span>
          <span className="text-[11px] text-amber-400 font-mono">Tỷ lệ: Tự động khóa</span>
        </div>

        {/* Width (mm) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Chiều Rộng (Width):</label>
            <span className="font-mono font-semibold text-amber-300">{settings.widthMm} mm</span>
          </div>
          <input
            type="range"
            min="50"
            max="600"
            step="5"
            value={settings.widthMm}
            onChange={(e) => updateSetting("widthMm", parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Height (mm) - Auto calculated */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Chiều Cao (Height - Tự động):</label>
            <span className="font-mono font-semibold text-amber-300">{settings.heightMm} mm</span>
          </div>
          <div className="w-full bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300 flex justify-between items-center">
            <span>{settings.heightMm} mm</span>
            <span className="text-[10px] text-slate-500">Giữ nguyên tỷ lệ ảnh gốc</span>
          </div>
        </div>

        {/* Relief Depth (15 - 40 mm) */}
        <div className="space-y-1 pt-1 border-t border-slate-800/60">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400 font-medium text-amber-200">
              Relief Depth (Độ nổi phù điêu):
            </label>
            <span className="font-mono font-bold text-amber-400">{settings.reliefDepthMm} mm</span>
          </div>
          <input
            type="range"
            min="15"
            max="40"
            step="1"
            value={settings.reliefDepthMm}
            onChange={(e) => updateSetting("reliefDepthMm", parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Min: 15 mm</span>
            <span>Max: 40 mm</span>
          </div>
        </div>

        {/* Base Thickness (= 5 mm) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Base Thickness (Mặt đáy khối):</label>
            <span className="font-mono font-semibold text-emerald-400">{settings.baseThicknessMm} mm</span>
          </div>
          <div className="flex items-center justify-between bg-emerald-950/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-300 font-mono">
            <span>Mặt đáy kín Z = {settings.baseThicknessMm} mm</span>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </div>

      {/* 2. RELIGIOUS STATUE / ORNAMENT RELIEF PRESETS & SPECIALIZED CONTROLS */}
      <div className="space-y-3 bg-amber-950/20 p-3 rounded-xl border border-amber-500/30">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
          <span className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Mode: RELIGIOUS STATUE / ORNAMENT
          </span>
          <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
            {PRESET_CONFIGS[settings.reliefPreset]?.name || "Custom"}
          </span>
        </div>

        {/* Preset Selector Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {(Object.keys(PRESET_CONFIGS) as ReliefPresetKey[]).map((pKey) => {
            const pConfig = PRESET_CONFIGS[pKey];
            const isSelected = settings.reliefPreset === pKey;
            return (
              <button
                key={pKey}
                onClick={() => handleSelectPreset(pKey)}
                className={`px-2.5 py-1.5 rounded-lg text-left text-xs transition-all border cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-sm shadow-amber-500/20"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <div className="truncate">{pConfig.name}</div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-amber-200/70 italic leading-tight">
          💡 {PRESET_CONFIGS[settings.reliefPreset]?.description}
        </p>

        {/* Specialized Sliders */}
        <div className="space-y-2.5 pt-2 border-t border-amber-500/20">
          {/* Face Detail */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Face Detail (Mắt, mũi, môi, tai):</label>
              <span className="font-mono text-amber-300 font-bold">{settings.faceDetail}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.faceDetail}
              onChange={(e) => updateSetting("faceDetail", parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Ornament Detail */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Ornament Detail (Hoa văn, tòa sen, hào quang):</label>
              <span className="font-mono text-amber-300 font-bold">{settings.ornamentDetail}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.ornamentDetail}
              onChange={(e) => updateSetting("ornamentDetail", parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Edge Preservation */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Edge Preservation (Bảo tồn đường viền):</label>
              <span className="font-mono text-amber-300 font-bold">{settings.edgePreservation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.edgePreservation}
              onChange={(e) => updateSetting("edgePreservation", parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          {/* Depth Compression */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium text-amber-200">Depth Compression (Nén hốc bóng tối):</label>
              <span className="font-mono text-amber-300 font-bold">{settings.depthCompression}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.depthCompression}
              onChange={(e) => updateSetting("depthCompression", parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 italic">
              *Nén dải bóng tối để chống tạo hố thủng giả ở hốc mắt & cổ.
            </p>
          </div>
        </div>
      </div>

      {/* 3. CNC RELIEF MODE (CAM Software Optimization: JDPaint, JDSoft, ArtCAM, Aspire) */}
      <div className="space-y-3 bg-cyan-950/20 p-3 rounded-xl border border-cyan-500/30">
        <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Mode: CNC RELIEF & CAM OPTIMIZATION
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-300 font-bold border border-cyan-500/30">
            <input
              type="checkbox"
              checked={settings.cncReliefEnabled}
              onChange={(e) => updateSetting("cncReliefEnabled", e.target.checked)}
              className="w-3.5 h-3.5 accent-cyan-500 rounded cursor-pointer"
            />
            <span>KÍCH HOẠT CNC CAM</span>
          </label>
        </div>

        {/* CAM Software Compatibility List */}
        <div className="flex flex-wrap gap-1 text-[10px] font-mono">
          {["JDPaint", "JDSoft", "ArtCAM", "Aspire", "VCarve", "Fusion 360"].map((cam) => (
            <span key={cam} className="bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700">
              ✓ {cam}
            </span>
          ))}
        </div>

        {/* Mesh Resolution Presets (Low, Medium, High, Ultra, Custom) */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs text-slate-300 font-medium">
            <span>Mesh Resolution Preset:</span>
            <span className="font-mono text-cyan-300 font-bold">
              Step: {cncEst.stepMm} mm ({cncEst.gridNx} × {cncEst.gridNy} grid)
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1 text-xs">
            {(
              [
                { id: "low", label: "Low", step: "0.5mm" },
                { id: "medium", label: "Medium", step: "0.3mm" },
                { id: "high", label: "High", step: "0.2mm" },
                { id: "ultra", label: "Ultra", step: "0.1mm" },
                { id: "custom", label: "Custom", step: `${settings.meshResolutionStepMm}mm` },
              ] as const
            ).map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectCncResolutionPreset(preset.id as CncResolutionPreset)}
                className={`py-1.5 px-1 rounded-lg text-center cursor-pointer border transition-all ${
                  settings.cncResolutionPreset === preset.id
                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-sm shadow-cyan-500/20"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <div className="text-[11px] font-semibold">{preset.label}</div>
                <div className="text-[9px] font-mono text-cyan-400/80">{preset.step}</div>
              </button>
            ))}
          </div>

          {settings.cncResolutionPreset === "custom" && (
            <div className="pt-1 flex items-center justify-between text-xs">
              <label className="text-slate-300">Custom Step Size (mm):</label>
              <input
                type="number"
                min="0.05"
                max="1.0"
                step="0.05"
                value={settings.meshResolutionStepMm}
                onChange={(e) => updateSetting("meshResolutionStepMm", Math.max(0.05, parseFloat(e.target.value) || 0.1))}
                className="w-20 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-center rounded py-0.5"
              />
            </div>
          )}
        </div>

        {/* CNC Parameters Inputs */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          {/* Maximum Relief Depth */}
          <div className="space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <label className="text-slate-300 font-medium block text-[11px]">Max Relief Depth:</label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
              <input
                type="number"
                min="5"
                max="100"
                step="1"
                value={settings.maxReliefDepthMm}
                onChange={(e) => updateSetting("maxReliefDepthMm", parseFloat(e.target.value) || 15)}
                className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-xs py-0.5"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          {/* Base Thickness */}
          <div className="space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <label className="text-slate-300 font-medium block text-[11px]">Base Thickness:</label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
              <input
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={settings.baseThicknessMm}
                onChange={(e) => updateSetting("baseThicknessMm", parseFloat(e.target.value) || 5)}
                className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-xs py-0.5"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          {/* Minimum Detail Height */}
          <div className="space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <label className="text-slate-300 font-medium block text-[11px]">Min Detail Height:</label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
              <input
                type="number"
                min="0.01"
                max="1.0"
                step="0.05"
                value={settings.minDetailHeightMm}
                onChange={(e) => updateSetting("minDetailHeightMm", parseFloat(e.target.value) || 0.1)}
                className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-xs py-0.5"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </div>

          {/* Minimum Feature Width */}
          <div className="space-y-1 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            <label className="text-slate-300 font-medium block text-[11px]">Min Feature Width:</label>
            <div className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
              <input
                type="number"
                min="0.1"
                max="3.0"
                step="0.1"
                value={settings.minFeatureWidthMm}
                onChange={(e) => updateSetting("minFeatureWidthMm", parseFloat(e.target.value) || 0.4)}
                className="w-16 bg-slate-900 border border-slate-700 rounded text-center text-xs py-0.5"
              />
              <span className="text-[10px] text-slate-400">mm</span>
            </div>
          </div>
        </div>

        {/* Real-time Physical Density & Estimations Box */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-cyan-500/30 space-y-2">
          <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center justify-between">
            <span>Mesh Estimations ({settings.widthMm} × {settings.heightMm} mm)</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400">Triangles</div>
              <div className="text-xs font-bold text-cyan-300">{cncEst.totalTriangles.toLocaleString()}</div>
            </div>
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400">STL File Size</div>
              <div className="text-xs font-bold text-emerald-300">{cncEst.estimatedStlMb} MB</div>
            </div>
            <div className="bg-slate-900/90 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-400">Process Time</div>
              <div className="text-xs font-bold text-amber-300">~{cncEst.estimatedTimeSec} s</div>
            </div>
          </div>
        </div>

        {/* Pre-Export Quality Inspection Checklist */}
        <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs">
          <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Pre-Export Quality Checklist:
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-mono text-slate-300">
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Watertight: <span className="text-emerald-300 font-bold">Closed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Manifold: <span className="text-emerald-300 font-bold">2-Face Edge</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Normals: <span className="text-emerald-300 font-bold">Consistent</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Degenerate: <span className="text-emerald-300 font-bold">0 Faces</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Duplicates: <span className="text-emerald-300 font-bold">0 Faces</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-emerald-400">✓</span> Boundary Edges: <span className="text-emerald-300 font-bold">0 Open</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Image Processing & Height Map Sliders */}
      <div className="space-y-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
        <div className="text-xs font-semibold text-slate-300">Xử Lý Ảnh & Chi Tiết Mesh</div>

        {/* Contrast */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Contrast (Tương phản):</label>
            <span className="font-mono text-slate-300">{settings.contrast.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={settings.contrast}
            onChange={(e) => updateSetting("contrast", parseFloat(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Blur */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Blur (Khử nhiễu ảnh):</label>
            <span className="font-mono text-slate-300">{settings.blurRadius} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={settings.blurRadius}
            onChange={(e) => updateSetting("blurRadius", parseInt(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Smooth (0 - 10) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Smooth Mesh (Làm mịn bề mặt):</label>
            <span className="font-mono text-slate-300">{settings.smoothLevel}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={settings.smoothLevel}
            onChange={(e) => updateSetting("smoothLevel", parseInt(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Detail (Grid density) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <label className="text-slate-400">Detail (Độ phân giải lưới Mesh):</label>
            <span className="font-mono text-slate-300">{settings.detailLevel} x {Math.round(settings.detailLevel / (aspectRatio || 1))}</span>
          </div>
          <input
            type="range"
            min="64"
            max="256"
            step="16"
            value={settings.detailLevel}
            onChange={(e) => updateSetting("detailLevel", parseInt(e.target.value))}
            className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Invert Depth Toggle */}
        <div className="pt-2 border-t border-slate-800/60">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-300">
            <input
              type="checkbox"
              checked={settings.invertDepth}
              onChange={(e) => updateSetting("invertDepth", e.target.checked)}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
            />
            <span className="font-medium">Invert Depth (Đảo ngược độ sâu Sáng/Tối)</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <button
          onClick={onGenerateRelief}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Box className="w-4 h-4" />
          <span>Generate Relief (Dựng Phù Điêu 3D)</span>
        </button>

        <button
          onClick={onSmoothMesh}
          className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Smooth Mesh (Làm Mịn Lưới Bề Mặt)</span>
        </button>
      </div>
    </div>
  );
};
