import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.post("/api/ai/coach", async (req, res) => {
  const { scenario } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a peer support specialist coach. A peer specialist is preparing for a meeting with someone and says: "${scenario}". 
      Provide open-ended questions, reflective statements, strength-focused prompts, and follow-up ideas. 
      Align with recovery-oriented practice and trauma-informed care. 
      Return the response in a clear structured format.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate coaching suggestions" });
  }
});

app.post("/api/ai/reflection", async (req, res) => {
  const { input } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Generate recovery-oriented validation and reflective listening statements for this input: "${input}". 
      Focus on empathy, lived experience, and empowerment.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate reflections" });
  }
});

app.post("/api/ai/document", async (req, res) => {
  const { notes } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Convert these rough peer support meeting notes into a professional, person-centered, and strength-based interaction summary: "${notes}". 
      RULES:
      1. Use recovery-oriented language.
      2. Do NOT diagnose or label.
      3. Identify strengths.
      4. Highlight action items.
      5. Keep it concise.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process documentation" });
  }
});

app.post("/api/ai/language-check", async (req, res) => {
  const { text } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Review the following text for peer support documentation best practices: "${text}".
      Identify any deficit-focused, judgmental, or clinical/clinical-labeling language. 
      Suggest strength-based, person-first, and recovery-oriented alternatives.
      Return the analysis in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isProfessional: { type: Type.BOOLEAN },
            flags: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  suggestion: { type: Type.STRING }
                }
              }
            },
            overallFeedback: { type: Type.STRING }
          }
        }
      }
    });
    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check language" });
  }
});

app.post("/api/ai/wellness-support", async (req, res) => {
  const { mood, energy, stress, notes } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are a wellness coach for peer support specialists. 
      The specialist has shared their daily check-in:
      - Mood: ${mood}/10
      - Energy: ${energy}/10
      - Stress: ${stress}/10
      - Reflections: "${notes}"

      Provide compassionate, strength-based feedback. 
      Suggest 2-3 specific, actionable self-care or recharge activities tailored to their current state. 
      Focus on avoiding burnout and compassion fatigue. 
      Maintain a warm, supportive peer-to-peer tone.`,
    });
    res.json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate wellness support" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
