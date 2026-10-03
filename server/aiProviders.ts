/**
 * Real AI provider layer.
 *
 * The project ships a multi-router architecture (Gemini direct, Anthropic direct,
 * plus the optional local 9Router / OmniRoute / VansRouter gateways). This module
 * is the single, honest entry point for "give me a real model answer".
 *
 * Contract: `generateReply()` either returns text produced by a *real* provider,
 * or returns `{ ok: false }` with a reason. It never invents an answer.
 */
import { GoogleGenAI } from '@google/genai';

export type ProviderId = 'gemini' | 'anthropic' | '9router' | 'omniroute' | 'vansrouter';

export interface ProviderDescriptor {
  id: ProviderId;
  label: string;
  kind: 'cloud' | 'local-gateway';
  envKeys: string[];
  port?: number;
  baseUrl?: string;
  model?: string;
}

export interface ProviderStatus extends ProviderDescriptor {
  configured: boolean;
  reachable: boolean;
  detail: string;
}

export interface GenerateOptions {
  systemInstruction?: string;
  history?: Array<{ role?: string; content?: string; parts?: any[] }>;
  language?: string;
  taskType?: string;
  /** Hard timeout for a single provider attempt. */
  timeoutMs?: number;
  maxTokens?: number;
}

export interface GenerateResult {
  ok: boolean;
  text?: string;
  provider?: ProviderId;
  model?: string;
  simulated: false;
  attempts: Array<{ provider: ProviderId; ok: boolean; detail: string }>;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';

const LOCAL_GATEWAYS: Array<{ id: ProviderId; label: string; port: number; envKeys: string[] }> = [
  { id: '9router', label: '9Router', port: Number(process.env.NINEROUTER_PORT || 20128), envKeys: ['NINEROUTER_API_KEY', 'NINEROUTER_API_KEYS'] },
  { id: 'omniroute', label: 'OmniRoute', port: Number(process.env.OMNIROUTE_PORT || 20130), envKeys: ['OMNIROUTE_API_KEY', 'OMNIROUTE_API_KEYS'] },
  { id: 'vansrouter', label: 'VansRouter', port: Number(process.env.VANSROUTER_PORT || 20132), envKeys: ['VANSROUTER_API_KEY', 'VANSROUTER_API_KEYS'] },
];

/**
 * Reads an API key from env without ever accepting the placeholder values
 * shipped in .env.example (they are not real credentials).
 */
function readKey(...names: string[]): string | null {
  for (const name of names) {
    const raw = String(process.env[name] || '').trim();
    if (!raw) continue;
    if (/^(MY_|CHANGE_ME|YOUR_|xxx|TODO)/i.test(raw)) continue;
    return raw;
  }
  return null;
}

export function getGeminiKey(): string | null {
  return readKey('GEMINI_API_KEY', 'AI_API_KEY') || readKey('GEMINI_API_KEYS', 'GEMINI_API_KEY_2');
}

export function getAnthropicKey(): string | null {
  return readKey('ANTHROPIC_API_KEY');
}

export function getGatewayKey(envKeys: string[]): string | null {
  return readKey(...envKeys);
}

/** Cheap, synchronous check used by /api/health and the chat router. */
export function hasConfiguredCloudProvider(): boolean {
  return Boolean(getGeminiKey() || getAnthropicKey());
}

export function isDemoMode(): boolean {
  return String(process.env.CODGAR_DEMO_MODE || '').trim() === '1';
}

function normalizeHistory(history: GenerateOptions['history']): Array<{ role: 'user' | 'assistant'; content: string }> {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-8)
    .map((item) => {
      const content =
        typeof item?.content === 'string' ? item.content : item?.parts?.[0]?.text || '';
      const role: 'user' | 'assistant' = item?.role === 'user' ? 'user' : 'assistant';
      return { role, content: String(content || '').slice(0, 4000) };
    })
    .filter((m) => m.content.length > 0);
}

async function tryGemini(prompt: string, opts: GenerateOptions): Promise<{ text: string; model: string } | null> {
  const key = getGeminiKey();
  if (!key) return null;
  const ai = new GoogleGenAI({ apiKey: key });
  const history = normalizeHistory(opts.history).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  const request: any = {
    model: GEMINI_MODEL,
    contents: [...history, { role: 'user', parts: [{ text: prompt }] }],
    config: {} as Record<string, unknown>,
  };
  if (opts.systemInstruction) request.config.systemInstruction = opts.systemInstruction;
  if (opts.maxTokens) request.config.maxOutputTokens = opts.maxTokens;

  const response: any = await ai.models.generateContent(request);
  const text = response?.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || '').join('') || '';
  if (!text.trim()) return null;
  return { text: text.trim(), model: GEMINI_MODEL };
}

async function tryAnthropic(prompt: string, opts: GenerateOptions): Promise<{ text: string; model: string } | null> {
  const key = getAnthropicKey();
  if (!key) return null;
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: key });
  const messages = [
    ...normalizeHistory(opts.history).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: prompt },
  ];
  const response: any = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens || 4096,
    system: opts.systemInstruction,
    messages,
  });
  const text = (response?.content || [])
    .map((part: any) => (part?.type === 'text' ? part.text : ''))
    .join('')
    .trim();
  if (!text) return null;
  return { text, model: ANTHROPIC_MODEL };
}

const gatewayProbeCache = new Map<string, { reachable: boolean; at: number }>();

async function probeGateway(baseUrl: string, timeoutMs = 400): Promise<boolean> {
  const cached = gatewayProbeCache.get(baseUrl);
  if (cached && Date.now() - cached.at < 15_000) return cached.reachable;
  let reachable = false;
  try {
    const res = await fetch(`${baseUrl}/v1/models`, { signal: AbortSignal.timeout(timeoutMs) });
    reachable = res.status < 500;
  } catch {
    reachable = false;
  }
  gatewayProbeCache.set(baseUrl, { reachable, at: Date.now() });
  return reachable;
}

async function tryLocalGateway(
  gateway: (typeof LOCAL_GATEWAYS)[number],
  prompt: string,
  opts: GenerateOptions
): Promise<{ text: string; model: string } | null> {
  const baseUrl = `http://127.0.0.1:${gateway.port}`;
  if (!(await probeGateway(baseUrl))) return null;

  const key = getGatewayKey(gateway.envKeys);
  const messages = [
    ...(opts.systemInstruction ? [{ role: 'system', content: opts.systemInstruction }] : []),
    ...normalizeHistory(opts.history).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    signal: AbortSignal.timeout(opts.timeoutMs || 90_000),
    headers: {
      'Content-Type': 'application/json',
      ...(key ? { Authorization: `Bearer ${key}` } : {}),
    },
    body: JSON.stringify({
      model: process.env.CODGAR_ROUTER_MODEL || 'codgar-code',
      messages,
      max_tokens: opts.maxTokens || (opts.taskType === 'coding' ? 4096 : 2048),
      temperature: opts.taskType === 'coding' ? 0.2 : 0.7,
    }),
  });
  if (!res.ok) return null;
  const data: any = await res.json().catch(() => null);
  const text = data?.choices?.[0]?.message?.content || data?.reply || data?.output || '';
  if (!text || !String(text).trim()) return null;
  return { text: String(text).trim(), model: data?.model || 'router-default' };
}

/**
 * Tries every configured provider, in order, and returns the first real answer.
 */
export async function generateReply(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const attempts: GenerateResult['attempts'] = [];

  const runners: Array<{ id: ProviderId; run: () => Promise<{ text: string; model: string } | null> }> = [
    { id: 'gemini', run: () => tryGemini(prompt, opts) },
    { id: 'anthropic', run: () => tryAnthropic(prompt, opts) },
    ...LOCAL_GATEWAYS.map((g) => ({ id: g.id, run: () => tryLocalGateway(g, prompt, opts) })),
  ];

  for (const runner of runners) {
    try {
      const result = await runner.run();
      if (result?.text) {
        attempts.push({ provider: runner.id, ok: true, detail: `model=${result.model}` });
        return { ok: true, text: result.text, provider: runner.id, model: result.model, simulated: false, attempts };
      }
      attempts.push({ provider: runner.id, ok: false, detail: 'not configured or unavailable' });
    } catch (err: any) {
      attempts.push({ provider: runner.id, ok: false, detail: String(err?.message || err).slice(0, 300) });
    }
  }

  return { ok: false, simulated: false, attempts };
}

/** Instant, side-effect-free status used by diagnostics endpoints. */
export async function describeProviders(): Promise<ProviderStatus[]> {
  const statuses: ProviderStatus[] = [];

  const geminiKey = getGeminiKey();
  statuses.push({
    id: 'gemini',
    label: 'Google Gemini (direct)',
    kind: 'cloud',
    envKeys: ['GEMINI_API_KEY'],
    model: GEMINI_MODEL,
    configured: Boolean(geminiKey),
    reachable: Boolean(geminiKey),
    detail: geminiKey ? 'کلید تنظیم شده است' : 'GEMINI_API_KEY تنظیم نشده',
  });

  const anthropicKey = getAnthropicKey();
  statuses.push({
    id: 'anthropic',
    label: 'Anthropic Claude (direct)',
    kind: 'cloud',
    envKeys: ['ANTHROPIC_API_KEY'],
    model: ANTHROPIC_MODEL,
    configured: Boolean(anthropicKey),
    reachable: Boolean(anthropicKey),
    detail: anthropicKey ? 'کلید تنظیم شده است' : 'ANTHROPIC_API_KEY تنظیم نشده',
  });

  for (const gateway of LOCAL_GATEWAYS) {
    const baseUrl = `http://127.0.0.1:${gateway.port}`;
    const reachable = await probeGateway(baseUrl);
    statuses.push({
      id: gateway.id,
      label: gateway.label,
      kind: 'local-gateway',
      envKeys: gateway.envKeys,
      port: gateway.port,
      baseUrl,
      configured: Boolean(getGatewayKey(gateway.envKeys)),
      reachable,
      detail: reachable ? `در حال اجرا روی پورت ${gateway.port}` : `اجرا نشده (پورت ${gateway.port})`,
    });
  }

  return statuses;
}

/** Short human readable mode used in logs / /api/health. */
export function aiMode(): 'real' | 'demo' | 'none' {
  if (hasConfiguredCloudProvider()) return 'real';
  if (isDemoMode()) return 'demo';
  return 'none';
}

export const NO_PROVIDER_MESSAGE =
  'هیچ ارائه‌دهنده هوش مصنوعی واقعی تنظیم نشده است. یکی از موارد زیر را در فایل .env قرار دهید و سرور را دوباره اجرا کنید:\n' +
  '  GEMINI_API_KEY=...   یا   ANTHROPIC_API_KEY=...\n' +
  'برای اجرای حالت نمایشی (پاسخ‌های آماده، بدون مدل واقعی) مقدار CODGAR_DEMO_MODE=1 را تنظیم کنید.\n' +
  'No real AI provider is configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY in .env, or enable CODGAR_DEMO_MODE=1 for canned demo replies.';
