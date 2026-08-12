import React, { useEffect, useRef } from "react";
import { HeightMapResult } from "../utils/heightmap";
import { Eye, Layers, Maximize2 } from "lucide-react";

interface DepthMapViewerProps {
  originalImageSrc: string;
  heightMap: HeightMapResult | null;
  imageName: string;
}

export const DepthMapViewer: React.FC<DepthMapViewerProps> = ({
  originalImageSrc,
  heightMap,
  imageName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>3. Khung Xem Ảnh Gốc & Depth Map</span>
        </div>
        <span className="text-xs text-slate-400 font-mono">{imageName}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Original 2D Image */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>2. Ảnh Gốc (Original Image)</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">2D RGB</span>
          </div>
          <div className="h-56 rounded-lg bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center p-2">
            {originalImageSrc ? (
              <img
                src={originalImageSrc}
                alt="Original input"
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <p className="text-xs text-slate-500">Chưa mở ảnh</p>
            )}
          </div>
        </div>

        {/* Generated Height / Depth Map */}
        <div className="bg-slate-950 rounded-xl border border-slate-800 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>3. Depth Map (Bản Đồ Độ Sâu Grayscale)</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono">
              Height Map 8-bit
            </span>
          </div>
          <div className="h-56 rounded-lg bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center p-2 relative">
            {heightMap?.canvas ? (
              <img
                src={heightMap.canvas.toDataURL()}
                alt="Depth Map Heightmap"
                className="max-h-full max-w-full object-contain rounded image-rendering-pixelated"
              />
            ) : (
              <p className="text-xs text-slate-500">Đang tạo Depth Map...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
