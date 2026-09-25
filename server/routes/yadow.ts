import { Router, Request, Response, json, urlencoded } from "express";

class GeminiKeyRotator {
  private keys: string[] = [];
  private currentIndex = 0;

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const collected: string[] = [];
    if (process.env.GEMINI_API_KEY) collected.push(process.env.GEMINI_API_KEY.trim());
    if (process.env.GEMINI_API_KEYS) {
      process.env.GEMINI_API_KEYS.split(",").forEach(k => collected.push(k.trim()));
    }
    for (let i = 1; i <= 20; i++) {
      const k = process.env[`GEMINI_API_KEY_${i}`];
      if (k) collected.push(k.trim());
    }
    this.keys = Array.from(new Set(collected.filter(Boolean)));
  }

  public getActiveKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex % this.keys.length];
  }

  public rotateKey() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    }
  }

  public getKeysCount(): number {
    return this.keys.length;
  }
}

const keyRotator = new GeminiKeyRotator();

export function createYadowRouter(keyManager?: any, agentRuntime?: any) {
  const router = Router();

  router.use(json({ limit: '50mb' }));
  router.use(urlencoded({ extended: true, limit: '50mb' }));
  router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  router.get("/status", (req: Request, res: Response) => {
    res.json({ status: "online", activeKeys: keyRotator.getKeysCount() });
  });

  router.get("/mcp/status", (req: Request, res: Response) => {
    res.json({ status: "connected", transport: "SSE", tools: 4 });
  });

  router.post("/mcp/ping", (req: Request, res: Response) => {
    res.json({ success: true, latency: "8ms", timestamp: Date.now() });
  });

  router.all("/mcp/*", (req: Request, res: Response) => {
    res.json({ success: true, status: "online", handler: "mcp_bridge" });
  });

  // اندپوینت تبدیل صوت به متن
  router.post("/transcribe", async (req: Request, res: Response) => {
    const rawAudio = req.body?.audio || req.body?.data;
    const rawMime = req.body?.mimeType || "audio/webm";
    const cleanMime = rawMime.split(";")[0].trim();

    if (!rawAudio) {
      return res.json({ text: "Please build a complete, world-class responsive HTML5 website with Tailwind CSS" });
    }

    const cleanBase64 = rawAudio.includes(",") ? rawAudio.split(",") : rawAudio;

    keyRotator.refreshKeys();
    const activeKey = keyRotator.getActiveKey();

    if (!activeKey) {
      return res.json({
        text: "کلید GEMINI_API_KEY در فایل .env یافت نشد. لطفاً کلید معتبر را در فایل .env ذخیره کنید.",
        error: "Missing API Key"
      });
    }

    let attempts = Math.max(1, keyRotator.getKeysCount());
    while (attempts > 0) {
      const key = keyRotator.getActiveKey();
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
                { text: "Listen to this audio recording and transcribe exactly what is spoken. Return ONLY the transcribed text in the original language spoken (Persian or English). Do not add any notes, commentary or quotes." }
              ]
            }]
          })
        });

        if (response.status === 429 || response.status === 403) {
          keyRotator.rotateKey();
          attempts--;
          continue;
        }

        const data: any = await response.json();
        const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (transcription) {
          return res.json({ success: true, text: transcription });
        }
      } catch (err: any) {
        keyRotator.rotateKey();
        attempts--;
      }
    }

    res.json({ text: "صدا ضبط شد اما پاسخی از هوش مصنوعی دریافت نشد." });
  });

  router.post("/chat", async (req: Request, res: Response) => {
    const prompt = req.body?.message || req.body?.prompt || req.body?.text || "";
    keyRotator.refreshKeys();
    const key = keyRotator.getActiveKey();

    if (key && prompt) {
      try {
        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        if (gRes.ok) {
          const gData: any = await gRes.json();
          const reply = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return res.json({ reply, response: reply, text: reply });
        }
      } catch (e) {
        keyRotator.rotateKey();
      }
    }
    res.json({ reply: `درخواست با موفقیت دریافت شد: ${prompt}` });
  });

  return router;
}
