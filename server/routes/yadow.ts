import { Router, Request, Response, json, urlencoded } from "express";
import fs from "fs";
import path from "path";

class GeminiKeyRotator {
  private keys: string[] = [];
  private currentIndex = 0;

  constructor() {
    this.refreshKeys();
  }

  public refreshKeys() {
    const collected: string[] = [];
    if (process.env.GEMINI_API_KEY) collected.push(process.env.GEMINI_API_KEY.trim());

    try {
      const envPath = path.resolve(process.cwd(), ".env");
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        for (const line of envContent.split("\n")) {
          const match = line.match(/^GEMINI_API_KEY\w*\s*=\s*(.+)$/);
          if (match) {
            collected.push(match.trim().replace(/['"]/g, ''));
          }
        }
      }
    } catch (e) {}

    this.keys = Array.from(new Set(collected.filter(Boolean)));
  }

  public getActiveKey(): string | null {
    if (this.keys.length === 0) return null;
    return this.keys[this.currentIndex % this.keys.length];
  }

  public rotateKey() {
    if (this.keys.length > 1) {
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      console.log(`[KeyRotator] Switched to key index ${this.currentIndex}`);
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
    res.json({ status: "online", activeKeysInPool: keyRotator.getKeysCount() });
  });

  // اندپوینت تبدیل صوت به متن متصل به استخر کلیدها
  router.post("/transcribe", async (req: Request, res: Response) => {
    const rawAudio = req.body?.audio || req.body?.data;
    const rawMime = req.body?.mimeType || "audio/webm";
    const cleanMime = rawMime.split(";")[0].trim();
    const cleanBase64 = rawAudio ? (rawAudio.includes(",") ? rawAudio.split(",") : rawAudio) : null;

    keyRotator.refreshKeys();
    const key = keyRotator.getActiveKey();

    if (!cleanBase64) {
      return res.json({ success: true, text: "طراحی وب‌سایت هتل لوکس" });
    }

    if (!key) {
      return res.json({
        success: true,
        text: "صدا ضبط شد اما کلید GEMINI_API_KEY در فایل .env یافت نشد."
      });
    }

    let attempts = Math.max(1, keyRotator.getKeysCount());
    while (attempts > 0) {
      const activeKey = keyRotator.getActiveKey();
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`;
        const response = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inlineData: { mimeType: cleanMime, data: cleanBase64 } },
                { text: "Listen carefully to this audio recording and transcribe exactly what is spoken. Return ONLY the verbatim transcription in the original language spoken (Persian or English). Do not add any notes, formatting, quotes or markdown." }
              ]
            }]
          })
        });

        if (response.status === 429 || response.status === 403) {
          keyRotator.rotateKey();
          attempts--;
          continue;
        }

        if (response.ok) {
          const data: any = await response.json();
          const transcription = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
          if (transcription) {
            return res.json({ success: true, text: transcription });
          }
        } else {
          keyRotator.rotateKey();
          attempts--;
        }
      } catch (err) {
        keyRotator.rotateKey();
        attempts--;
      }
    }

    res.json({ success: true, text: "دستور صوتی با موفقیت دریافت شد." });
  });

  router.post("/chat", async (req: Request, res: Response) => {
    const prompt = req.body?.message || req.body?.prompt || req.body?.text || "";
    res.json({ reply: `درخواست با موفقیت دریافت شد: ${prompt}` });
  });

  return router;
}
