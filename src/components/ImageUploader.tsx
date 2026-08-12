import React, { useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, Check } from "lucide-react";
import { SAMPLE_IMAGES, SampleImage } from "../data/samples";
import { ImageDimensions } from "../types";

interface ImageUploaderProps {
  currentImageSrc: string;
  onImageSelected: (src: string, name: string) => void;
  dimensions: ImageDimensions;
  selectedSampleId: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageSrc,
  onImageSelected,
  dimensions,
  selectedSampleId,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onImageSelected(event.target.result as string, file.name);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          <span>1. Mở Ảnh Đầu Vào (JPG / PNG)</span>
        </div>
        {dimensions.originalWidth > 0 && (
          <span className="text-xs bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-md font-mono">
            {dimensions.originalWidth} × {dimensions.originalHeight} px (Tỷ lệ: {dimensions.aspectRatio.toFixed(2)})
          </span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="group relative border-2 border-dashed border-slate-700 hover:border-amber-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="p-2.5 rounded-full bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-400 transition-colors">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-200 group-hover:text-amber-300">
            Kéo thả ảnh vào đây hoặc nhấp để mở tệp
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hỗ trợ JPG, PNG, WEBP (Tự động giữ nguyên tỷ lệ, không kéo giãn)
          </p>
        </div>
      </div>

      {/* Preset Sample Images */}
      <div>
        <label className="text-xs text-slate-400 font-medium mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Hoặc chọn mẫu tượng / hoa văn có sẵn:</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_IMAGES.map((sample) => {
            const isSelected = selectedSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => onImageSelected(sample.dataUrl, sample.name)}
                className={`relative rounded-xl border p-2 text-left transition-all flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/10 text-amber-200"
                    : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300"
                }`}
              >
                <div className="w-full h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative">
                  <img
                    src={sample.dataUrl}
                    alt={sample.name}
                    className="w-full h-full object-contain p-1"
                  />
                  {isSelected && (
                    <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-medium leading-tight text-center line-clamp-1">
                  {sample.name.split("(")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
