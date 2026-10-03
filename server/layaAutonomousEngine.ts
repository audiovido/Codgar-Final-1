import { exec } from 'child_process';
import { spawnRouterDetached } from './routerBinary';
import path from 'path';
import fs from 'fs';
import os from 'os';

export class LayaAutonomousEngine {
  private static instance: LayaAutonomousEngine;
  private homeDir = os.homedir();
  private routerPort = 20128;
  private routerBaseUrl = 'http://127.0.0.1:20128';
  private get apiKey(): string {
    return String(process.env.NINEROUTER_API_KEY || process.env.LAYA_ROUTER_API_KEY || '').trim();
  }

  // Real, tested models available on the local custom router
  private activeModels: string[] = [
    'ped',
    'ag/claude-sonnet-4-6',
    'ag/gemini-3.7-flash-medium',
    'ag/gemini-3-flash',
    'kimchi/kimi-k2.7',
    'ollama/qwen3.5'
  ];

  private constructor() {}

  public static getInstance(): LayaAutonomousEngine {
    if (!LayaAutonomousEngine.instance) {
      LayaAutonomousEngine.instance = new LayaAutonomousEngine();
    }
    return LayaAutonomousEngine.instance;
  }

  /**
   * 1. Silent Background Router Daemon (Auto-Start if down)
   */
  public async ensureRouterOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${this.routerBaseUrl}/v1/models`, {
        signal: AbortSignal.timeout(1000)
      });
      if (res.ok) return true;
    } catch {}

    try {
      const { proc, reason } = spawnRouterDetached('9router', ['-p', String(this.routerPort), '-n', '-t']);
      if (!proc) {
        console.warn(`[LayaAutonomousEngine] ⏭️ 9Router is not installed (${reason}).`);
        return false;
      }

      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 400));
        try {
          const check = await fetch(`${this.routerBaseUrl}/v1/models`, { signal: AbortSignal.timeout(800) });
          if (check.ok) return true;
        } catch {}
      }
    } catch {}
    return false;
  }

  /**
   * 2. Intelligent Prompt & Intent Classifier
   */
  public classifyIntent(prompt: string): { isCoding: boolean; systemPrompt: string } {
    const trimmed = (prompt || '').trim();

    const isConversational =
      /^(سلام|درود|چخبر|چه خبر|خوبی|چطوری|حالت چطوره|صبح بخیر|عصر بخیر|شب بخیر|مرسی|ممنون|تشکر|دستت درد نکنه|دمت گرم|ایول|hi|hello|hey|how are you|what's up|sup|thanks)[\s!؟?.,،]*$/i.test(trimmed) ||
      /^(چخبر|چه خبر|حالت چطوره|چیکار میکنی|تو کی هستی|خودتو معرفی کن|اسمت چیه|وظیفت چیه)/i.test(trimmed);

    const hasCodingAction = /\b(بنویس|بساز|ایجاد کن|طراحی کن|پیاده‌سازی کن|پیاده سازی کن|توسعه بده|درست کن|کد بزن|دیباگ کن|رفع باگ|کد بنویس|build|create|write|code|develop|implement|generate|refactor)\b/i.test(trimmed);
    const hasCodeTarget = /(سایت|وبسایت|وب‌سایت|اپلیکیشن|برنامه|کامپوننت|اسکریپت|الگوریتم|تابع|ماشین حساب|فرم|داشبورد|ریاکت|react|html|css|python|javascript|typescript|api|ui|button|modal)/i.test(trimmed);

    const isCoding = !isConversational && (hasCodingAction && hasCodeTarget);

    if (!isCoding) {
      return {
        isCoding: false,
        systemPrompt: 'You are CODGAR: An elite, warm, highly intelligent AI co-founder and software engineering partner. Converse naturally in the user language without generating unrequested code blocks or fake website announcements.'
      };
    }

    return {
      isCoding: true,
      systemPrompt: 'You are CODGAR: Principal Software Architect and Autonomous Full-Stack Engineer. Produce clean, complete, modern, production-grade code.'
    };
  }

  /**
   * 3. Autonomous Backend Execution
   * Injects Custom Provider Base URLs (No official login required)
   */
  public async executeAutonomous(prompt: string, history: any[] = []): Promise<{ text: string; modelUsed: string; isCoding: boolean }> {
    await this.ensureRouterOnline();

    const { isCoding, systemPrompt } = this.classifyIntent(prompt);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content || m.text || ''
      })),
      { role: 'user', content: prompt }
    ];

    // Priority cascade: try custom provider models seamlessly in background
    for (const model of this.activeModels) {
      try {
        const response = await fetch(`${this.routerBaseUrl}/v1/chat/completions`, {
          method: 'POST',
          signal: AbortSignal.timeout(25000),
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: isCoding ? 4096 : 1024,
            temperature: isCoding ? 0.2 : 0.7
          })
        });

        const data: any = await response.json();
        if (response.ok && data.choices?.[0]?.message?.content) {
          return {
            text: data.choices[0].message.content,
            modelUsed: model,
            isCoding
          };
        }
      } catch {
        // Transparent failover to next model in the background
      }
    }

    // No local router available: return an empty result so the caller can fall
    // back to a real cloud provider instead of receiving an invented answer.
    return {
      text: '',
      modelUsed: 'unavailable',
      isCoding
    };
  }
}
