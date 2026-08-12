import { ReliefSettings, CncEstimations } from "../types";

export interface HeightMapResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  grayscaleData: Float32Array; // Normalized 0.0 (lowest) to 1.0 (highest)
  aspectRatio: number;
}

export function computeCncEstimations(settings: ReliefSettings): CncEstimations {
  let stepMm = settings.meshResolutionStepMm || 0.2;
  if (settings.cncResolutionPreset === "low") stepMm = 0.5;
  else if (settings.cncResolutionPreset === "medium") stepMm = 0.3;
  else if (settings.cncResolutionPreset === "high") stepMm = 0.2;
  else if (settings.cncResolutionPreset === "ultra") stepMm = 0.1;

  const widthMm = settings.widthMm || 200;
  const heightMm = settings.heightMm || 150;

  const gridNx = Math.max(2, Math.round(widthMm / stepMm) + 1);
  const gridNy = Math.max(2, Math.round(heightMm / stepMm) + 1);

  const topQuads = (gridNx - 1) * (gridNy - 1);
  const topTriangles = topQuads * 2;
  const bottomTriangles = topQuads * 2;
  const sideTriangles = 4 * (gridNx + gridNy - 2);

  const totalTriangles = topTriangles + bottomTriangles + sideTriangles;
  const totalBytes = 84 + 50 * totalTriangles;
  const estimatedStlMb = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

  // Processing speed estimation based on triangle count (~2.5M triangles per second)
  const estimatedTimeSec = Math.max(0.1, Math.round((totalTriangles / 2500000) * 10) / 10);

  return {
    gridNx,
    gridNy,
    stepMm,
    totalTriangles,
    estimatedStlMb,
    estimatedTimeSec,
  };
}

export function processImageToHeightMap(
  img: HTMLImageElement | HTMLCanvasElement,
  settings: ReliefSettings
): HeightMapResult {
  const origWidth = img instanceof HTMLImageElement ? img.naturalWidth || img.width : img.width;
  const origHeight = img instanceof HTMLImageElement ? img.naturalHeight || img.height : img.height;
  const aspectRatio = origWidth / origHeight;

  // Determine target grid resolution according to CNC settings or detail level
  let targetWidth = settings.detailLevel;
  if (settings.cncReliefEnabled) {
    const est = computeCncEstimations(settings);
    // Cap WebGL interactive preview canvas resolution to avoid browser memory crash on ultra-dense grids (>1200)
    targetWidth = Math.min(1000, est.gridNx);
  }
  const targetHeight = Math.max(16, Math.round(targetWidth / aspectRatio));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  if (!ctx) {
    throw new Error("Could not get 2D context for heightmap canvas");
  }

  // Draw scaled image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // Get image pixel data
  const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
  const data = imgData.data;
  const len = targetWidth * targetHeight;
  const rawGrayscale = new Float32Array(len);

  // 1. Convert RGB to perceived Luminance (Grayscale: 0.299R + 0.587G + 0.114B)
  for (let i = 0; i < len; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    // Luminance
    let lum = 0.299 * r + 0.587 * g + 0.114 * b;
    rawGrayscale[i] = lum / 255.0; // 0..1
  }

  // 2. Apply Contrast & Depth Compression (Chống hốc mắt / bóng đổ tạo lỗ thủng)
  const contrastFactor = settings.contrast;
  const depthCompression = (settings.depthCompression ?? 50) / 100.0;
  const faceDetail = (settings.faceDetail ?? 70) / 100.0;
  const ornamentDetail = (settings.ornamentDetail ?? 70) / 100.0;
  const edgePreservation = (settings.edgePreservation ?? 70) / 100.0;

  for (let i = 0; i < len; i++) {
    let val = rawGrayscale[i];
    // Contrast pivot around 0.5
    val = (val - 0.5) * contrastFactor + 0.5;
    val = Math.max(0, Math.min(1, val));

    // Depth Compression: Lift dark shadow floor & compress deep shadows
    if (depthCompression > 0) {
      const floorVal = depthCompression * 0.22;
      val = val * (1.0 - floorVal) + floorVal;
      const gamma = 1.0 - depthCompression * 0.35;
      val = Math.pow(val, gamma);
    }

    rawGrayscale[i] = val;
  }

  // 3. Face Detail Enhancement
  if (faceDetail > 0) {
    const blurredFace = applyBoxBlur(rawGrayscale, targetWidth, targetHeight, 4);
    for (let i = 0; i < len; i++) {
      const diff = rawGrayscale[i] - blurredFace[i];
      let val = rawGrayscale[i] + diff * (faceDetail * 0.6);
      rawGrayscale[i] = Math.max(0, Math.min(1, val));
    }
  }

  // 4. Ornament Detail & Edge Preservation
  if (ornamentDetail > 0 || edgePreservation > 0) {
    const edgeMap = computeSobelEdges(rawGrayscale, targetWidth, targetHeight);
    const weight = ornamentDetail * 0.25 + edgePreservation * 0.25;
    for (let i = 0; i < len; i++) {
      let val = rawGrayscale[i] + edgeMap[i] * weight;
      rawGrayscale[i] = Math.max(0, Math.min(1, val));
    }
  }

  // 5. Minimum Feature Width Filtering for CNC tool path compatibility
  let processedGrayscale = new Float32Array(rawGrayscale);
  if (settings.cncReliefEnabled && settings.minFeatureWidthMm > 0) {
    const dx = settings.widthMm / targetWidth;
    const filterRadius = Math.max(1, Math.round(settings.minFeatureWidthMm / (2 * dx)));
    if (filterRadius > 0) {
      processedGrayscale = applyBoxBlur(processedGrayscale, targetWidth, targetHeight, filterRadius);
    }
  }

  // 6. Minimum Detail Height Thresholding (Filter micro-noise below CNC threshold)
  if (settings.cncReliefEnabled && settings.minDetailHeightMm > 0) {
    const maxDepth = settings.maxReliefDepthMm || settings.reliefDepthMm;
    const normMinHeight = settings.minDetailHeightMm / maxDepth;
    for (let i = 0; i < len; i++) {
      if (processedGrayscale[i] < normMinHeight) {
        processedGrayscale[i] = 0.0;
      }
    }
  }

  // 7. Simple Box Blur pass if blurRadius > 0
  if (settings.blurRadius > 0) {
    const radius = Math.min(8, Math.round(settings.blurRadius));
    processedGrayscale = applyBoxBlur(processedGrayscale, targetWidth, targetHeight, radius);
  }

  // 8. Invert depth if requested
  if (settings.invertDepth) {
    for (let i = 0; i < len; i++) {
      processedGrayscale[i] = 1.0 - processedGrayscale[i];
    }
  }

  // 9. Update canvas viewable pixels for Depth Map display
  for (let i = 0; i < len; i++) {
    const v = Math.round(processedGrayscale[i] * 255);
    data[i * 4] = v;     // R
    data[i * 4 + 1] = v; // G
    data[i * 4 + 2] = v; // B
    data[i * 4 + 3] = 255; // Alpha
  }
  ctx.putImageData(imgData, 0, 0);

  return {
    canvas,
    width: targetWidth,
    height: targetHeight,
    grayscaleData: processedGrayscale,
    aspectRatio,
  };
}

function applyBoxBlur(
  src: Float32Array,
  width: number,
  height: number,
  radius: number
): Float32Array {
  const dst = new Float32Array(src.length);
  const size = radius * 2 + 1;

  // Horizontal pass
  const temp = new Float32Array(src.length);
  for (let y = 0; y < height; y++) {
    let sum = 0;
    // initial window sum
    for (let i = -radius; i <= radius; i++) {
      const rx = Math.min(width - 1, Math.max(0, i));
      sum += src[y * width + rx];
    }
    for (let x = 0; x < width; x++) {
      temp[y * width + x] = sum / size;
      const leftX = Math.max(0, x - radius);
      const rightX = Math.min(width - 1, x + radius + 1);
      sum += src[y * width + rightX] - src[y * width + leftX];
    }
  }

  // Vertical pass
  for (let x = 0; x < width; x++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) {
      const ry = Math.min(height - 1, Math.max(0, i));
      sum += temp[ry * width + x];
    }
    for (let y = 0; y < height; y++) {
      dst[y * width + x] = sum / size;
      const topY = Math.max(0, y - radius);
      const botY = Math.min(height - 1, y + radius + 1);
      sum += temp[botY * width + x] - temp[topY * width + x];
    }
  }

  return dst;
}

// Laplacian Smooth function on 2D heightmap matrix
export function smoothHeightMapData(
  data: Float32Array,
  width: number,
  height: number,
  passes: number
): Float32Array {
  if (passes <= 0) return data;
  let current = new Float32Array(data);

  for (let p = 0; p < passes; p++) {
    const next = new Float32Array(current.length);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        // Edge check
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          next[idx] = current[idx];
          continue;
        }

        const center = current[idx];
        const left = current[idx - 1];
        const right = current[idx + 1];
        const top = current[idx - width];
        const bottom = current[idx + width];

        // Weighted average with 50% center retention
        const avg = (left + right + top + bottom) / 4.0;
        next[idx] = center * 0.5 + avg * 0.5;
      }
    }
    current = next;
  }

  return current;
}

// Compute Sobel Edge Magnitude for Ornament & Outline Enhancement
export function computeSobelEdges(
  data: Float32Array,
  width: number,
  height: number
): Float32Array {
  const edges = new Float32Array(data.length);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const p00 = data[(y - 1) * width + (x - 1)];
      const p01 = data[(y - 1) * width + x];
      const p02 = data[(y - 1) * width + (x + 1)];
      const p10 = data[y * width + (x - 1)];
      const p12 = data[y * width + (x + 1)];
      const p20 = data[(y + 1) * width + (x - 1)];
      const p21 = data[(y + 1) * width + x];
      const p22 = data[(y + 1) * width + (x + 1)];

      const gx = -p00 + p02 - 2 * p10 + 2 * p12 - p20 + p22;
      const gy = -p00 - 2 * p01 - p02 + p20 + 2 * p21 + p22;

      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}
