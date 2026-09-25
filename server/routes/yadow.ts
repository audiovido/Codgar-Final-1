import { Router, Request, Response } from "express";

export function createYadowRouter(keyManager?: any, agentRuntime?: any) {
  const router = Router();

  router.get("/status", (req: Request, res: Response) => {
    res.json({
      status: "online",
      batteryLevel: 98,
      voltage: "4.1V",
      temperature: "34°C",
      mode: "ACTIVE_COMPANION",
      timestamp: new Date().toISOString()
    });
  });

  router.get("/capabilities", (req: Request, res: Response) => {
    res.json([
      { id: "code_gen", name: "Code Generation", status: "ready" },
      { id: "terminal_bridge", name: "Terminal Execution", status: "ready" },
      { id: "audio_stream", name: "Voice Feedback", status: "idle" },
      { id: "mcp_tools", name: "MCP Connector Hub", status: "ready" }
    ]);
  });

  router.get("/modes", (req: Request, res: Response) => {
    res.json({
      current: "ARCHITECT",
      available: ["ARCHITECT", "PAIR_PROGRAMMER", "DEBUGGER", "COMPANION"]
    });
  });

  router.get("/suggestions", (req: Request, res: Response) => {
    res.json([
      "بررسی خطاهای کامپایل پروژه",
      "بهینه‌سازی توابع روتینگ مدل‌ها",
      "تست اندپوینت‌های MCP"
    ]);
  });

  router.post("/chat", async (req: Request, res: Response) => {
    const { message, sessionId, mode } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message content is required" });
    }

    try {
      if (agentRuntime && typeof agentRuntime.executePrompt === "function") {
        const aiResponse = await agentRuntime.executePrompt({
          prompt: message,
          context: { sessionId, mode }
        });
        return res.json({ reply: aiResponse, source: "omni_router" });
      }

      res.json({
        reply: `پیام در مود ${mode || "ARCHITECT"} دریافت شد: ${message}`,
        source: "companion_echo"
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Error processing chat" });
    }
  });

  return router;
}
