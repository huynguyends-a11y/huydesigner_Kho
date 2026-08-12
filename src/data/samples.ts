export interface SampleImage {
  id: string;
  name: string;
  category: string;
  description: string;
  dataUrl: string;
}

// Generate high quality sample SVG images as Data URLs for instant preview
function createBuddhaSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <radialGradient id="halo" cx="50%" cy="30%" r="40%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="40%" stop-color="#cccccc"/>
        <stop offset="100%" stop-color="#333333"/>
      </radialGradient>
      <radialGradient id="head" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="70%" stop-color="#888888"/>
        <stop offset="100%" stop-color="#222222"/>
      </radialGradient>
      <linearGradient id="robe" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#dddddd"/>
        <stop offset="50%" stop-color="#888888"/>
        <stop offset="100%" stop-color="#222222"/>
      </linearGradient>
      <radialGradient id="lotus" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="80%" stop-color="#666666"/>
        <stop offset="100%" stop-color="#111111"/>
      </radialGradient>
    </defs>
    <rect width="600" height="800" fill="#181818"/>
    <!-- Outer Arch -->
    <path d="M 50 700 L 50 350 A 250 250 0 0 1 550 350 L 550 700 Z" fill="#2d2d2d" stroke="#666666" stroke-width="12"/>
    <!-- Halo -->
    <circle cx="300" cy="280" r="180" fill="url(#halo)"/>
    <!-- Lotus Throne Base -->
    <ellipse cx="300" cy="680" rx="220" ry="60" fill="url(#lotus)"/>
    <path d="M 120 680 C 180 620, 240 600, 300 680 C 360 600, 420 620, 480 680" fill="none" stroke="#ffffff" stroke-width="8"/>
    <!-- Seated Body/Robes -->
    <path d="M 140 670 C 180 500, 220 440, 300 440 C 380 440, 420 500, 460 670 Z" fill="url(#robe)"/>
    <!-- Robe Fold Waves -->
    <path d="M 200 480 Q 300 560 400 480 M 180 530 Q 300 610 420 530 M 160 580 Q 300 660 440 580" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.8"/>
    <!-- Buddha Head & Ushnisha -->
    <circle cx="300" cy="280" r="75" fill="url(#head)"/>
    <!-- Ushnisha bump -->
    <circle cx="300" cy="185" r="30" fill="#ffffff"/>
    <circle cx="300" cy="160" r="12" fill="#ffffff"/>
    <!-- Face Features -->
    <!-- Eyes -->
    <path d="M 260 275 Q 275 285 290 275 M 310 275 Q 325 285 340 275" stroke="#111111" stroke-width="4" fill="none"/>
    <!-- Nose -->
    <path d="M 300 270 L 297 300 L 306 302" stroke="#ffffff" stroke-width="3" fill="none"/>
    <!-- Lips -->
    <path d="M 285 320 Q 300 330 315 320" stroke="#ffffff" stroke-width="4" fill="none"/>
    <!-- Hands / Mudra -->
    <ellipse cx="300" cy="540" rx="45" ry="30" fill="#eeeeee"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

function createLotusReliefSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
    <rect width="600" height="600" fill="#111111"/>
    <!-- Concentric relief rings -->
    <circle cx="300" cy="300" r="270" fill="#222" stroke="#888" stroke-width="8"/>
    <circle cx="300" cy="300" r="230" fill="#333" stroke="#aaa" stroke-width="6"/>
    <circle cx="300" cy="300" r="80" fill="#ffffff"/>
    <!-- Lotus Petals Layer 1 -->
    <g fill="#cccccc" stroke="#000000" stroke-width="3">
      <path d="M 300 70 Q 340 180 300 220 Q 260 180 300 70 Z"/>
      <path d="M 300 530 Q 340 420 300 380 Q 260 420 300 530 Z"/>
      <path d="M 70 300 Q 180 340 220 300 Q 180 260 70 300 Z"/>
      <path d="M 530 300 Q 420 340 380 300 Q 420 260 530 300 Z"/>
    </g>
    <!-- Lotus Petals Layer 2 (Diagonal) -->
    <g fill="#ffffff" stroke="#111111" stroke-width="3">
      <path d="M 137 137 Q 220 220 230 250 Q 200 230 137 137 Z"/>
      <path d="M 463 137 Q 380 220 370 250 Q 400 230 463 137 Z"/>
      <path d="M 137 463 Q 220 380 230 350 Q 200 370 137 463 Z"/>
      <path d="M 463 463 Q 380 380 370 350 Q 400 370 463 463 Z"/>
    </g>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

function createDragonSculptureSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#1a1a1a"/>
    <!-- Border carving -->
    <rect x="30" y="30" width="740" height="540" fill="#2d2d2d" stroke="#aaaaaa" stroke-width="10" rx="20"/>
    <!-- Swirling Dragon Body -->
    <path d="M 100 300 C 150 100, 350 100, 400 300 C 450 500, 650 500, 700 300" fill="none" stroke="#ffffff" stroke-width="45" stroke-linecap="round"/>
    <path d="M 100 300 C 150 100, 350 100, 400 300 C 450 500, 650 500, 700 300" fill="none" stroke="#777777" stroke-width="25" stroke-linecap="round"/>
    <!-- Dragon Head -->
    <path d="M 700 300 L 760 260 L 740 320 L 770 350 Z" fill="#ffffff" stroke="#000" stroke-width="4"/>
    <circle cx="730" cy="285" r="8" fill="#000"/>
    <!-- Pearl of Wisdom -->
    <circle cx="400" cy="180" r="45" fill="#ffffff" stroke="#888" stroke-width="8"/>
  </svg>`;
  return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: "buddha-statue",
    name: "Tượng Phật Thiền Định (Buddha Statue)",
    category: "Tượng / Tâm Linh",
    description: "Mẫu tượng Phật tọa thiền trên tòa sen, viền phướn với độ sâu relief cao.",
    dataUrl: createBuddhaSvgDataUrl(),
  },
  {
    id: "lotus-relief",
    name: "Hoa Văn Hoa Sen (Lotus Relief Tile)",
    category: "Hoa văn / Chạm khắc",
    description: "Tranh hoa sen đối xứng 8 cánh, thích hợp chạm CNC đĩa hoặc gạch ốp tường.",
    dataUrl: createLotusReliefSvgDataUrl(),
  },
  {
    id: "dragon-carving",
    name: "Phù Điêu Rồng Cuộn (Dragon Relief)",
    category: "Linh vật / Phong thủy",
    description: "Chạm khắc rồng vờn ngọc với thân rồng uốn lượn có chiều sâu rõ rệt.",
    dataUrl: createDragonSculptureSvgDataUrl(),
  },
];
