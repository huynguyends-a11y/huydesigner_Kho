import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { ControlPanel } from "./components/ControlPanel";
import { DepthMapViewer } from "./components/DepthMapViewer";
import { ThreeDPreview } from "./components/ThreeDPreview";
import { PythonArchDoc } from "./components/PythonArchDoc";
import { WindowsSetupGuide } from "./components/WindowsSetupGuide";

import { SAMPLE_IMAGES } from "./data/samples";
import { ReliefSettings, ImageDimensions, AiDepthAnalysis } from "./types";
import { processImageToHeightMap, HeightMapResult } from "./utils/heightmap";
import { buildSolidReliefGeometry, SolidReliefGeometryResult, exportBinarySTL } from "./utils/reliefMesh";

export default function App() {
  const [activeTab, setActiveTab] = useState<"studio" | "python_arch" | "windows_exe">("studio");

  // Image & Sample selection
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(SAMPLE_IMAGES[0].dataUrl);
  const [imageName, setImageName] = useState<string>(SAMPLE_IMAGES[0].name);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(SAMPLE_IMAGES[0].id);

  // Image Dimensions
  const [dimensions, setDimensions] = useState<ImageDimensions>({
    originalWidth: 600,
    originalHeight: 800,
    aspectRatio: 600 / 800,
  });

  // Relief Settings (Units: mm)
  const [settings, setSettings] = useState<ReliefSettings>({
    widthMm: 200,
    heightMm: Math.round(200 / (600 / 800)), // 267mm
    reliefDepthMm: 25, // 15mm to 40mm
    baseThicknessMm: 5, // 5mm base
    smoothLevel: 2,
    detailLevel: 144, // Resolution grid
    contrast: 1.2,
    blurRadius: 1,
    invertDepth: false,
    materialPreset: "cnc_wood",

    // Religious Statue / Ornament Relief Settings
    reliefPreset: "buddha",
    faceDetail: 90,
    ornamentDetail: 85,
    edgePreservation: 80,
    depthCompression: 70,

    // CNC RELIEF CAM Settings
    cncReliefEnabled: true,
    maxReliefDepthMm: 25,
    minDetailHeightMm: 0.1,
    minFeatureWidthMm: 0.4,
    cncResolutionPreset: "high",
    meshResolutionStepMm: 0.2,
  });

  // Processed Data States
  const [heightMap, setHeightMap] = useState<HeightMapResult | null>(null);
  const [meshData, setMeshData] = useState<SolidReliefGeometryResult | null>(null);

  // AI Depth States
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiDepthAnalysis | null>(null);

  // Re-generate Heightmap and 3D Solid Mesh
  const regenerateRelief = useCallback(
    (imgSrc = currentImageSrc, currentSettings = settings) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const origW = img.naturalWidth || img.width || 600;
        const origH = img.naturalHeight || img.height || 800;
        const aspect = origW / origH;

        setDimensions({
          originalWidth: origW,
          originalHeight: origH,
          aspectRatio: aspect,
        });

        // Ensure heightMm is updated in settings to maintain exact aspect ratio
        const updatedHeightMm = Math.round(currentSettings.widthMm / aspect);
        const finalSettings = {
          ...currentSettings,
          heightMm: updatedHeightMm,
        };

        // 1. Generate Grayscale Height Map
        const processedHM = processImageToHeightMap(img, finalSettings);
        setHeightMap(processedHM);

        // 2. Generate Watertight 3D Solid Geometry
        const solidMesh = buildSolidReliefGeometry(processedHM, finalSettings);
        setMeshData(solidMesh);
      };
      img.src = imgSrc;
    },
    [currentImageSrc, settings]
  );

  // Initial load and settings change effect
  useEffect(() => {
    regenerateRelief(currentImageSrc, settings);
  }, [
    currentImageSrc,
    settings.widthMm,
    settings.reliefDepthMm,
    settings.baseThicknessMm,
    settings.contrast,
    settings.blurRadius,
    settings.detailLevel,
    settings.invertDepth,
    settings.reliefPreset,
    settings.faceDetail,
    settings.ornamentDetail,
    settings.edgePreservation,
    settings.depthCompression,
    settings.cncReliefEnabled,
    settings.maxReliefDepthMm,
    settings.minDetailHeightMm,
    settings.minFeatureWidthMm,
    settings.cncResolutionPreset,
    settings.meshResolutionStepMm,
  ]);

  // Handle Image Selection
  const handleImageSelected = (src: string, name: string) => {
    setCurrentImageSrc(src);
    setImageName(name);

    // Check if matching sample ID
    const foundSample = SAMPLE_IMAGES.find((s) => s.name === name || s.dataUrl === src);
    if (foundSample) {
      setSelectedSampleId(foundSample.id);
    } else {
      setSelectedSampleId("custom");
    }

    regenerateRelief(src, settings);
  };

  // Smooth Mesh Pass
  const handleSmoothMesh = () => {
    const nextSmooth = Math.min(10, settings.smoothLevel + 2);
    const updatedSettings = { ...settings, smoothLevel: nextSmooth };
    setSettings(updatedSettings);
    regenerateRelief(currentImageSrc, updatedSettings);
  };

  // Export STL File Download
  const handleExportStl = () => {
    if (!meshData) return;

    const blob = exportBinarySTL(
      meshData.geometry,
      `${imageName.replace(/[^a-zA-Z0-9]/g, "_")}_${settings.widthMm}x${settings.heightMm}x${settings.reliefDepthMm}mm.stl`
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BasRelief_${settings.widthMm}x${settings.heightMm}x${settings.reliefDepthMm}mm.stl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Gemini AI Vision Depth Analysis
  const handleAnalyzeAiDepth = async () => {
    setIsAiAnalyzing(true);
    try {
      const response = await fetch("/api/generate-ai-depth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: currentImageSrc,
          style: imageName,
        }),
      });

      const data = await response.json();
      if (data.success && data.aiAnalysis) {
        setAiAnalysis(data.aiAnalysis);

        // Apply recommended depth if provided
        if (data.aiAnalysis.recommendedReliefDepthMm) {
          const recDepth = Math.max(15, Math.min(40, data.aiAnalysis.recommendedReliefDepthMm));
          const updated = {
            ...settings,
            reliefDepthMm: recDepth,
            contrast: data.aiAnalysis.contrastAdjustment || settings.contrast,
          };
          setSettings(updated);
          regenerateRelief(currentImageSrc, updated);
        }
      }
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onExportStl={handleExportStl}
        isMeshReady={!!meshData}
      />

      {/* Main Content View */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] mx-auto w-full">
        {activeTab === "studio" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Control Column (Inputs & Sliders) */}
            <div className="lg:col-span-4 space-y-6">
              <ImageUploader
                currentImageSrc={currentImageSrc}
                onImageSelected={handleImageSelected}
                dimensions={dimensions}
                selectedSampleId={selectedSampleId}
              />

              <ControlPanel
                settings={settings}
                onChangeSettings={setSettings}
                onGenerateRelief={() => regenerateRelief(currentImageSrc, settings)}
                onSmoothMesh={handleSmoothMesh}
                onAnalyzeAiDepth={handleAnalyzeAiDepth}
                isAiAnalyzing={isAiAnalyzing}
                aiAnalysis={aiAnalysis}
                aspectRatio={dimensions.aspectRatio}
              />
            </div>

            {/* Right Display Column (Depth Map & 3D Preview) */}
            <div className="lg:col-span-8 space-y-6 flex flex-col">
              <DepthMapViewer
                originalImageSrc={currentImageSrc}
                heightMap={heightMap}
                imageName={imageName}
              />

              <div className="flex-1 min-h-[460px]">
                <ThreeDPreview
                  meshData={meshData}
                  settings={settings}
                  onExportStl={handleExportStl}
                  onChangeMaterial={(mat) => setSettings({ ...settings, materialPreset: mat })}
                />
              </div>
            </div>
          </div>
        ) : activeTab === "windows_exe" ? (
          <WindowsSetupGuide />
        ) : (
          <PythonArchDoc />
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-3 px-6 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4">
          <span>AI BAS RELIEF → STL Studio</span>
          <span>•</span>
          <span className="text-amber-400 font-mono">Đơn vị đo: millimeter (mm)</span>
          <span>•</span>
          <span>Solid Watertight Mesh for CNC & 3D Print</span>
        </div>
        <div className="font-mono text-slate-500 text-[11px]">
          Relief Depth: {settings.reliefDepthMm}mm | Base: {settings.baseThicknessMm}mm | Size: {settings.widthMm}x{settings.heightMm}mm
        </div>
      </footer>
    </div>
  );
}
