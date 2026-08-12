export type ReliefPresetKey =
  | "buddha"
  | "wood_carving"
  | "stone_relief"
  | "floral_ornament"
  | "portrait"
  | "landscape"
  | "custom";

export type CncResolutionPreset = "low" | "medium" | "high" | "ultra" | "custom";

export interface ReliefSettings {
  widthMm: number; // Width in mm
  heightMm: number; // Height in mm (auto-calculated to preserve aspect ratio)
  reliefDepthMm: number; // 15mm to 40mm
  baseThicknessMm: number; // default 5mm
  smoothLevel: number; // 0 to 10
  detailLevel: number; // Grid resolution scale: 64 to 256
  contrast: number; // 0.5 to 2.5
  blurRadius: number; // 0 to 10px
  invertDepth: boolean; // boolean
  materialPreset: "cnc_wood" | "bronze" | "marble" | "clay" | "wireframe" | "normals";
  
  // Religious Statue / Ornament Relief Specialized Settings
  reliefPreset: ReliefPresetKey;
  faceDetail: number; // 0 to 100
  ornamentDetail: number; // 0 to 100
  edgePreservation: number; // 0 to 100
  depthCompression: number; // 0 to 100 (Compresses dark shadows to prevent false deep holes in eye sockets)

  // CNC RELIEF CAM Mode Settings (JDPaint, JDSoft, ArtCAM, Aspire)
  cncReliefEnabled: boolean;
  maxReliefDepthMm: number; // Maximum Relief Depth (mm)
  minDetailHeightMm: number; // Minimum Detail Height (mm)
  minFeatureWidthMm: number; // Minimum Feature Width (mm)
  cncResolutionPreset: CncResolutionPreset; // Low, Medium, High, Ultra, Custom
  meshResolutionStepMm: number; // Step size in mm (e.g., 0.5, 0.3, 0.2, 0.1)
}

export interface CncEstimations {
  gridNx: number;
  gridNy: number;
  stepMm: number;
  totalTriangles: number;
  estimatedStlMb: number;
  estimatedTimeSec: number;
}

export interface ImageDimensions {
  originalWidth: number;
  originalHeight: number;
  aspectRatio: number;
}

export interface AiDepthAnalysis {
  depthQuality?: number;
  recommendedReliefDepthMm?: number;
  keyFeaturesDetected?: string[];
  heightmapTips?: string;
  contrastAdjustment?: number;
}

export interface PythonModuleInfo {
  path: string;
  name: string;
  purpose: string;
  dependencies: string[];
  keyClassesOrFunctions: string[];
  communicationRole: string;
  codeSnippet: string;
}
