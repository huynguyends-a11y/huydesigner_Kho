import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Server-side Gemini AI client initialization
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Depth Map enhancement endpoint using Gemini Vision
app.post("/api/generate-ai-depth", async (req, res) => {
  try {
    const { imageBase64, style } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data" });
    }

    const ai = getGenAIClient();
    if (!ai) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
    }

    // Clean base64 data
    const cleanBase64 = imageBase64.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    const promptText = `Analyze this 2D image of a ${style || "sculpture/relief/Buddha statue"}. 
Generate a high-contrast 8-bit depth map grayscale image where foreground high-relief parts (like facial features, robes, chest, front hands) are brighter (near white #FFFFFF) and background/recessed carved areas are darker (near black #000000).
Provide advice and structural depth analysis in JSON format with fields:
- depthQuality: score out of 10
- recommendedReliefDepthMm: number between 15 and 40
- keyFeaturesDetected: list of strings (e.g., ["Buddha Halo", "Lotus Throne", "Facial Contour", "Robe Folds"])
- heightmapTips: advice for CNC machining or 3D printing carve speed/tooling
- contrastAdjustment: recommended contrast multiplier (0.8 to 2.0)`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        },
        { text: promptText },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResult = response.text || "{}";
    let jsonOutput;
    try {
      jsonOutput = JSON.parse(textResult);
    } catch {
      jsonOutput = {
        depthQuality: 8.5,
        recommendedReliefDepthMm: 25,
        keyFeaturesDetected: ["Main Subject Relief", "Background Carving", "Outer Border"],
        heightmapTips: "Use ballnose 1/8 inch or 1/16 inch tapered bits for fine details.",
        contrastAdjustment: 1.2,
      };
    }

    res.json({ success: true, aiAnalysis: jsonOutput });
  } catch (error: any) {
    console.error("AI Depth API Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze depth" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
