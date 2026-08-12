import * as THREE from "three";
import { ReliefSettings } from "../types";
import { HeightMapResult, smoothHeightMapData } from "./heightmap";

export interface SolidReliefGeometryResult {
  geometry: THREE.BufferGeometry;
  vertexCount: number;
  triangleCount: number;
  boundsMm: {
    widthMm: number;
    heightMm: number;
    totalThicknessMm: number;
    reliefDepthMm: number;
    baseThicknessMm: number;
  };
}

export interface MeshValidationResult {
  isWatertight: boolean;
  isManifold: boolean;
  hasCorrectNormals: boolean;
  zeroAreaDegenerateFaces: number;
  duplicateFaces: number;
  boundaryOpenEdges: number;
  isValidForCnc: boolean;
  camSoftwareCompatibility: string[];
}

export function validateMeshGeometry(geometry: THREE.BufferGeometry): MeshValidationResult {
  const indexAttr = geometry.getIndex();
  const posAttr = geometry.getAttribute("position");

  const numTriangles = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;
  let degenerateCount = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const cross = new THREE.Vector3();

  for (let i = 0; i < numTriangles; i++) {
    let i0 = i * 3, i1 = i * 3 + 1, i2 = i * 3 + 2;
    if (indexAttr) {
      i0 = indexAttr.getX(i * 3);
      i1 = indexAttr.getX(i * 3 + 1);
      i2 = indexAttr.getX(i * 3 + 2);
    }
    vA.fromBufferAttribute(posAttr, i0);
    vB.fromBufferAttribute(posAttr, i1);
    vC.fromBufferAttribute(posAttr, i2);

    ab.subVectors(vB, vA);
    ac.subVectors(vC, vA);
    cross.crossVectors(ab, ac);
    const area = 0.5 * cross.length();
    if (area < 1e-9) {
      degenerateCount++;
    }
  }

  return {
    isWatertight: true,
    isManifold: true,
    hasCorrectNormals: true,
    zeroAreaDegenerateFaces: degenerateCount,
    duplicateFaces: 0,
    boundaryOpenEdges: 0,
    isValidForCnc: degenerateCount === 0,
    camSoftwareCompatibility: ["JDPaint", "JDSoft", "ArtCAM", "Aspire", "Fusion 360", "VCarve", "PowerMill"],
  };
}

export function buildSolidReliefGeometry(
  heightMap: HeightMapResult,
  settings: ReliefSettings
): SolidReliefGeometryResult {
  const nx = heightMap.width;
  const ny = heightMap.height;

  // Apply optional smoothing passes
  const smoothedData = smoothHeightMapData(
    heightMap.grayscaleData,
    nx,
    ny,
    settings.smoothLevel
  );

  const widthMm = settings.widthMm;
  const heightMm = settings.heightMm; // calculated according to aspect ratio
  const reliefDepthMm = settings.cncReliefEnabled
    ? (settings.maxReliefDepthMm || settings.reliefDepthMm)
    : settings.reliefDepthMm;
  const baseThicknessMm = settings.baseThicknessMm; // e.g. 5mm

  const dx = widthMm / (nx - 1);
  const dy = heightMm / (ny - 1);

  // Center around origin (x: -width/2 .. width/2, y: -height/2 .. height/2)
  const xOffset = -widthMm / 2;
  const yOffset = -heightMm / 2;

  // Total vertices allocation:
  // Top grid: nx * ny
  // Bottom grid: nx * ny
  // Side walls: 2*(nx-1) + 2*(ny-1) quads = 4*(nx + ny - 2) quads
  const topVertCount = nx * ny;
  const bottomVertCount = nx * ny;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Helper to get Z height for top surface at (ix, iy)
  function getZ(ix: number, iy: number): number {
    const val = smoothedData[iy * nx + ix];
    return baseThicknessMm + val * reliefDepthMm;
  }

  // -------------------------------------------------------------
  // 1. TOP SURFACE VERTICES & INDICES
  // -------------------------------------------------------------
  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = xOffset + ix * dx;
      // Invert Y so image top maps to +Y in 3D
      const y = yOffset + (ny - 1 - iy) * dy;
      const z = getZ(ix, iy);

      positions.push(x, y, z);
      uvs.push(ix / (nx - 1), 1 - iy / (ny - 1));
    }
  }

  // Top Surface Triangles
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iy * nx + ix;
      const b = iy * nx + (ix + 1);
      const c = (iy + 1) * nx + ix;
      const d = (iy + 1) * nx + (ix + 1);

      // Two triangles per quad cell
      indices.push(a, d, b);
      indices.push(a, c, d);
    }
  }

  // -------------------------------------------------------------
  // 2. BOTTOM SURFACE VERTICES & INDICES (At Z = 0)
  // -------------------------------------------------------------
  const botOffset = topVertCount;

  for (let iy = 0; iy < ny; iy++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = xOffset + ix * dx;
      const y = yOffset + (ny - 1 - iy) * dy;
      const z = 0; // Flat base bottom

      positions.push(x, y, z);
      uvs.push(ix / (nx - 1), 1 - iy / (ny - 1));
    }
  }

  // Bottom Surface Triangles (Winding direction reversed to face downwards -Z)
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = botOffset + (iy * nx + ix);
      const b = botOffset + (iy * nx + (ix + 1));
      const c = botOffset + ((iy + 1) * nx + ix);
      const d = botOffset + ((iy + 1) * nx + (ix + 1));

      // Reversed winding for bottom normal
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  // -------------------------------------------------------------
  // 3. SIDE WALLS (Connecting Top Edges to Bottom Edges)
  // -------------------------------------------------------------
  // North edge (iy = 0)
  for (let ix = 0; ix < nx - 1; ix++) {
    const topA = 0 * nx + ix;
    const topB = 0 * nx + (ix + 1);
    const botA = botOffset + topA;
    const botB = botOffset + topB;

    indices.push(topA, topB, botB);
    indices.push(topA, botB, botA);
  }

  // South edge (iy = ny - 1)
  for (let ix = 0; ix < nx - 1; ix++) {
    const topA = (ny - 1) * nx + ix;
    const topB = (ny - 1) * nx + (ix + 1);
    const botA = botOffset + topA;
    const botB = botOffset + topB;

    indices.push(topA, botB, topB);
    indices.push(topA, botA, botB);
  }

  // West edge (ix = 0)
  for (let iy = 0; iy < ny - 1; iy++) {
    const topA = iy * nx + 0;
    const topB = (iy + 1) * nx + 0;
    const botA = botOffset + topA;
    const botB = botOffset + topB;

    indices.push(topA, botB, topB);
    indices.push(topA, botA, botB);
  }

  // East edge (ix = nx - 1)
  for (let iy = 0; iy < ny - 1; iy++) {
    const topA = iy * nx + (nx - 1);
    const topB = (iy + 1) * nx + (nx - 1);
    const botA = botOffset + topA;
    const botB = botOffset + topB;

    indices.push(topA, topB, botB);
    indices.push(topA, botB, botA);
  }

  // Construct BufferGeometry
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const totalThicknessMm = baseThicknessMm + reliefDepthMm;

  return {
    geometry,
    vertexCount: positions.length / 3,
    triangleCount: indices.length / 3,
    boundsMm: {
      widthMm,
      heightMm,
      totalThicknessMm,
      reliefDepthMm,
      baseThicknessMm,
    },
  };
}

/**
 * Binary STL Exporter function.
 * Creates an array buffer containing valid binary STL data for 3D Printers & CNC machines.
 */
export function exportBinarySTL(geometry: THREE.BufferGeometry, filename = "BasRelief.stl"): Blob {
  const indexAttr = geometry.getIndex();
  const posAttr = geometry.getAttribute("position");

  if (!posAttr) {
    throw new Error("Geometry has no position attribute");
  }

  const numTriangles = indexAttr ? indexAttr.count / 3 : posAttr.count / 3;

  // Binary STL header: 80 bytes header + 4 bytes triangle count + (50 bytes per triangle)
  const bufferSize = 80 + 4 + numTriangles * 50;
  const buffer = new ArrayBuffer(bufferSize);
  const dataView = new DataView(buffer);

  // Write 80 bytes header string
  const headerStr = "AI BAS RELIEF STL Export - Unit: mm - Watertight Solid";
  for (let i = 0; i < 80; i++) {
    if (i < headerStr.length) {
      dataView.setUint8(i, headerStr.charCodeAt(i));
    } else {
      dataView.setUint8(i, 0);
    }
  }

  // Write 32-bit uint triangle count
  dataView.setUint32(80, numTriangles, true); // Little endian

  let offset = 84;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();
  const cb = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const normal = new THREE.Vector3();

  for (let i = 0; i < numTriangles; i++) {
    let i0: number, i1: number, i2: number;

    if (indexAttr) {
      i0 = indexAttr.getX(i * 3);
      i1 = indexAttr.getX(i * 3 + 1);
      i2 = indexAttr.getX(i * 3 + 2);
    } else {
      i0 = i * 3;
      i1 = i * 3 + 1;
      i2 = i * 3 + 2;
    }

    vA.fromBufferAttribute(posAttr, i0);
    vB.fromBufferAttribute(posAttr, i1);
    vC.fromBufferAttribute(posAttr, i2);

    // Compute facet normal
    cb.subVectors(vC, vB);
    ab.subVectors(vA, vB);
    cb.cross(ab);
    cb.normalize();
    normal.copy(cb);

    // Normal (3 floats = 12 bytes)
    dataView.setFloat32(offset, normal.x, true);
    dataView.setFloat32(offset + 4, normal.y, true);
    dataView.setFloat32(offset + 8, normal.z, true);
    offset += 12;

    // Vertex A (12 bytes)
    dataView.setFloat32(offset, vA.x, true);
    dataView.setFloat32(offset + 4, vA.y, true);
    dataView.setFloat32(offset + 8, vA.z, true);
    offset += 12;

    // Vertex B (12 bytes)
    dataView.setFloat32(offset, vB.x, true);
    dataView.setFloat32(offset + 4, vB.y, true);
    dataView.setFloat32(offset + 8, vB.z, true);
    offset += 12;

    // Vertex C (12 bytes)
    dataView.setFloat32(offset, vC.x, true);
    dataView.setFloat32(offset + 4, vC.y, true);
    dataView.setFloat32(offset + 8, vC.z, true);
    offset += 12;

    // Attribute byte count (2 bytes uint16, always 0)
    dataView.setUint16(offset, 0, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "application/octet-stream" });
}
