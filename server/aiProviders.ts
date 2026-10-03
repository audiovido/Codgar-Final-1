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

/**
 * ⚠️ معماری اصلی پروژه: سه روتر محلی در پس‌زمینه.
 *
 * منبع اصلی پاسخ‌ها، همین سه روتر هستند (9Router → OmniRoute → VansRouter) و
 * هیچ کلید ابری‌ای برای کار کردن سیستم لازم نیست. Gemini/Anthropic فقط یک
 * فال‌بک اختیاری‌اند که اگر کاربر کلید گذاشته باشد استفاده می‌شوند.
 */
interface RouterDef {
  id: ProviderId;
  label: string;
  /** پورت‌های کاندید (اولین پورتِ پاسخ‌ده انتخاب می‌شود). */
  ports: number[];
  envKeys: string[];
  urlEnv: string;
  portEnv: string;
}

const ROUTER_DEFS: RouterDef[] = [
  {
    id: '9router',
    label: '9Router',
    ports: [20128],
    envKeys: ['NINEROUTER_API_KEY', 'NINEROUTER_API_KEYS'],
    urlEnv: 'NINEROUTER_URL',
    portEnv: 'NINEROUTER_PORT',
  },
  {
    id: 'omniroute',
    label: 'OmniRoute',
    ports: [20130, 20129],
    envKeys: ['OMNIROUTE_API_KEY', 'OMNIROUTE_API_KEYS'],
    urlEnv: 'OMNIROUTE_URL',
    portEnv: 'OMNIROUTE_PORT',
  },
  {
    id: 'vansrouter',
    label: 'VansRouter',
    ports: [20132, 20130],
    envKeys: ['VANSROUTER_API_KEY', 'VANSROUTER_API_KEYS'],
    urlEnv: 'VANSROUTER_URL',
    portEnv: 'VANSROUTER_PORT',
  },
];

const ROUTER_HOST = process.env.CODGAR_ROUTER_HOST || '127.0.0.1';

/** همه‌ی URLهای کاندید یک روتر (env > پورت صریح > پورت‌های پیش‌فرض). */
function candidateUrls(def: RouterDef): string[] {
  const explicitUrl = String(process.env[def.urlEnv] || '').trim();
  if (explicitUrl) return [explicitUrl.replace(/\/+$/, '')];
  const explicitPort = Number(process.env[def.portEnv] || 0);
  const ports = explicitPort ? [explicitPort, ...def.ports.filter((p) => p !== explicitPort)] : def.ports;
  return ports.map((p) => `http://${ROUTER_HOST}:${p}`);
}

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

/**
 * فال‌بک ابری اختیاری است: این تابع فقط می‌گوید کلید ابری هست یا نه.
 * نبودِ آن به‌هیچ‌وجه یعنی سیستم کار نمی‌کند — منبع اصلی، سه روتر محلی است.
 */
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
let lastRouterOnline = false;
let lastRouterOnlineAt = 0;

async function probeGateway(baseUrl: string, timeoutMs = 600): Promise<boolean> {
  const cached = gatewayProbeCache.get(baseUrl);
  if (cached && Date.now() - cached.at < 10_000) return cached.reachable;
  let reachable = false;
  for (const probePath of ['/v1/models', '/health', '/']) {
    try {
      const res = await fetch(`${baseUrl}${probePath}`, { signal: AbortSignal.timeout(timeoutMs) });
      if (res.status < 500) {
        reachable = true;
        break;
      }
    } catch {
      /* try next path */
    }
  }
  gatewayProbeCache.set(baseUrl, { reachable, at: Date.now() });
  if (reachable) {
    lastRouterOnline = true;
    lastRouterOnlineAt = Date.now();
  }
  return reachable;
}

/** اولین URL زنده‌ی یک روتر را برمی‌گرداند (یا null اگر بالا نباشد). */
async function resolveRouterUrl(def: RouterDef): Promise<string | null> {
  for (const url of candidateUrls(def)) {
    if (await probeGateway(url)) return url;
  }
  return null;
}

/** آیا دست‌کم یکی از سه روتر پس‌زمینه بالا است؟ (واقعی، با probe) */
export async function anyRouterOnline(): Promise<boolean> {
  for (const def of ROUTER_DEFS) {
    if (await resolveRouterUrl(def)) {
      lastRouterOnline = true;
      lastRouterOnlineAt = Date.now();
      return true;
    }
  }
  lastRouterOnline = false;
  lastRouterOnlineAt = Date.now();
  return false;
}

/** نسخه‌ی همگام (از کشِ آخرین probe) برای مسیرهای داغ مثل هدرها و /api/health. */
export function routersOnlineCached(): boolean {
  return lastRouterOnline;
}

/** probe سبک پس‌زمینه تا کش همیشه تازه بماند. */
let backgroundProbe: NodeJS.Timeout | null = null;
export function startRouterWatch(intervalMs = 20_000): void {
  if (backgroundProbe) return;
  void anyRouterOnline().catch(() => {});
  backgroundProbe = setInterval(() => {
    void anyRouterOnline().catch(() => {});
  }, intervalMs);
  if (typeof backgroundProbe.unref === 'function') backgroundProbe.unref();
}

async function tryRouter(
  def: RouterDef,
  prompt: string,
  opts: GenerateOptions
): Promise<{ text: string; model: string } | null> {
  const baseUrl = await resolveRouterUrl(def);
  if (!baseUrl) return null;

  const key = getGatewayKey(def.envKeys);
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
  // یک روتر شبیه‌سازی‌شده هرگز به‌جای پاسخ واقعی قبول نمی‌شود (مگر حالت دمو).
  if (res.headers.get('x-codgar-simulated') === '1' && !isDemoMode()) return null;
  const data: any = await res.json().catch(() => null);
  if (data?.simulated === true && !isDemoMode()) return null;
  const text = data?.choices?.[0]?.message?.content || data?.reply || data?.output || '';
  if (!text || !String(text).trim()) return null;
  return { text: String(text).trim(), model: data?.model || `${def.id}-default` };
}

/**
 * ترتیب اجرا: سه روتر پس‌زمینه (معماری اصلی) و تنها در صورت در دسترس نبودن
 * آن‌ها، فال‌بک اختیاری ابری.
 */
export async function generateReply(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  const attempts: GenerateResult['attempts'] = [];

  const runners: Array<{ id: ProviderId; run: () => Promise<{ text: string; model: string } | null> }> = [
    ...ROUTER_DEFS.map((def) => ({ id: def.id, run: () => tryRouter(def, prompt, opts) })),
    { id: 'gemini' as ProviderId, run: () => tryGemini(prompt, opts) },
    { id: 'anthropic' as ProviderId, run: () => tryAnthropic(prompt, opts) },
  ];

  for (const runner of runners) {
    try {
      const result = await runner.run();
      if (result?.text) {
        attempts.push({ provider: runner.id, ok: true, detail: `model=${result.model}` });
        return { ok: true, text: result.text, provider: runner.id, model: result.model, simulated: false, attempts };
      }
      attempts.push({ provider: runner.id, ok: false, detail: 'در دسترس نیست / تنظیم نشده' });
    } catch (err: any) {
      attempts.push({ provider: runner.id, ok: false, detail: String(err?.message || err).slice(0, 300) });
    }
  }

  return { ok: false, simulated: false, attempts };
}

/** وضعیت واقعی همه‌ی مسیرها (سه روتر + فال‌بک ابری). */
export async function describeProviders(): Promise<ProviderStatus[]> {
  const statuses: ProviderStatus[] = [];

  for (const def of ROUTER_DEFS) {
    const urls = candidateUrls(def);
    const liveUrl = await resolveRouterUrl(def);
    statuses.push({
      id: def.id,
      label: `${def.label} (local router)`,
      kind: 'local-gateway',
      envKeys: def.envKeys,
      port: liveUrl ? Number(liveUrl.split(':').pop()) || undefined : def.ports[0],
      baseUrl: liveUrl || urls[0],
      configured: true, // روتر محلی به کلید نیاز ندارد
      reachable: Boolean(liveUrl),
      detail: liveUrl
        ? `در حال اجرا روی ${liveUrl}`
        : `اجرا نشده (کاندیدها: ${urls.join(', ')})`,
    });
  }

  const geminiKey = getGeminiKey();
  statuses.push({
    id: 'gemini',
    label: 'Google Gemini (فال‌بک اختیاری)',
    kind: 'cloud',
    envKeys: ['GEMINI_API_KEY'],
    model: GEMINI_MODEL,
    configured: Boolean(geminiKey),
    reachable: Boolean(geminiKey),
    detail: geminiKey ? 'کلید تنظیم شده است' : 'اختیاری است؛ تنظیم نشده',
  });

  const anthropicKey = getAnthropicKey();
  statuses.push({
    id: 'anthropic',
    label: 'Anthropic Claude (فال‌بک اختیاری)',
    kind: 'cloud',
    envKeys: ['ANTHROPIC_API_KEY'],
    model: ANTHROPIC_MODEL,
    configured: Boolean(anthropicKey),
    reachable: Boolean(anthropicKey),
    detail: anthropicKey ? 'کلید تنظیم شده است' : 'اختیاری است؛ تنظیم نشده',
  });

  return statuses;
}

/** حالت فعلی موتور: روتر محلی زنده یا کلید ابری ⇒ real. */
export function aiMode(): 'real' | 'demo' | 'none' {
  if (routersOnlineCached() || hasConfiguredCloudProvider()) return 'real';
  if (isDemoMode()) return 'demo';
  return 'none';
}

/** نسخه‌ی دقیق (probe زنده) برای /api/health و لاگ استارتاپ. */
export async function aiModeLive(): Promise<'real' | 'demo' | 'none'> {
  if (await anyRouterOnline()) return 'real';
  if (hasConfiguredCloudProvider()) return 'real';
  if (isDemoMode()) return 'demo';
  return 'none';
}

export function routerProbeAgeMs(): number {
  return lastRouterOnlineAt ? Date.now() - lastRouterOnlineAt : -1;
}

export const NO_PROVIDER_MESSAGE =
  'هیچ‌کدام از سه روتر پس‌زمینه (9Router / OmniRoute / VansRouter) در دسترس نیستند.\n' +
  'این پروژه با همین سه روتر کار می‌کند و به کلید ابری نیاز ندارد؛ کافی است روترها بالا باشند:\n' +
  '  9router -p 20128 -H 127.0.0.1 -n --skip-update\n' +
  '  omniroute --port 20130\n' +
  '  vansrouter -p 20132 -H 127.0.0.1 -n --skip-update\n' +
  'اگر روترها روی پورت/هاست دیگری اجرا می‌شوند، در .env مقادیر NINEROUTER_URL / OMNIROUTE_URL / VANSROUTER_URL (یا *_PORT و CODGAR_ROUTER_HOST) را تنظیم کنید.\n' +
  'فال‌بک ابری (GEMINI_API_KEY یا ANTHROPIC_API_KEY) کاملاً اختیاری است.\n' +
  'None of the three background routers are reachable. Start them, or set NINEROUTER_URL / OMNIROUTE_URL / VANSROUTER_URL in .env.';
