/**
 * اثبات معماری: پاسخ‌ها از سه روتر پس‌زمینه می‌آیند، نه از کلید ابری.
 *
 * یک روتر سازگار با OpenAI (نقش 9Router) روی یک پورت آزاد بالا می‌آوریم،
 * آدرسش را با NINEROUTER_URL به سرور می‌دهیم و بدون هیچ GEMINI/ANTHROPIC key
 * انتظار داریم /api/chat دقیقاً پاسخ همان روتر را برگرداند.
 *
 * Run with:  npm test
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 34100 + Math.floor(Math.random() * 90);
const ROUTER_PORT = 34300 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTER_ANSWER = 'پاسخ از 9Router محلی (بدون هیچ کلید ابری).';

let server;
let router;
let routerCalls = 0;
let lastAuthHeader = null;

function startStubRouter() {
  return new Promise((resolve) => {
    router = http.createServer((req, res) => {
      if (req.url?.startsWith('/v1/models')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ object: 'list', data: [{ id: 'codgar-code' }] }));
        return;
      }
      if (req.url?.startsWith('/v1/chat/completions')) {
        routerCalls++;
        lastAuthHeader = req.headers.authorization || null;
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: 'stub-1',
            model: 'codgar-code',
            choices: [{ index: 0, message: { role: 'assistant', content: ROUTER_ANSWER }, finish_reason: 'stop' }],
            usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
          }));
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
    router.listen(ROUTER_PORT, '127.0.0.1', resolve);
  });
}

async function waitForHealth(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return await res.json();
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('server did not become healthy in time');
}

before(async () => {
  await startStubRouter();
  const tsxBin = path.join(ROOT, 'node_modules', '.bin', 'tsx');
  server = spawn(tsxBin, ['server.ts'], {
    cwd: ROOT,
    detached: true,
    env: {
      ...process.env,
      PORT: String(PORT),
      BIND_HOST: '127.0.0.1',
      DISABLE_HMR: 'true',
      CODGAR_DEMO_MODE: '',
      // هیچ کلید ابری‌ای تنظیم نشده است - عمداً
      GEMINI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      AI_API_KEY: '',
      NINEROUTER_URL: `http://127.0.0.1:${ROUTER_PORT}`,
      NINEROUTER_API_KEY: 'test-router-key',
      CODGAR_AUTOSTART_ROUTERS: '0',
      CODGAR_PIN: '864209',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await waitForHealth();
});

after(async () => {
  if (server) {
    try {
      process.kill(-server.pid, 'SIGKILL');
    } catch {
      try { server.kill('SIGKILL'); } catch { /* already gone */ }
    }
    await new Promise((resolve) => {
      if (server.exitCode !== null || server.signalCode) return resolve();
      const timer = setTimeout(resolve, 3000);
      server.once('exit', () => { clearTimeout(timer); resolve(); });
    });
    server.stdout?.destroy();
    server.stderr?.destroy();
  }
  if (router) await new Promise((resolve) => router.close(resolve));
});

test('health reports the background router as online without any cloud key', async () => {
  const body = await waitForHealth();
  assert.equal(body.engine, 'local-routers-first');
  assert.equal(body.routersOnline, true);
  assert.equal(body.cloudFallbackConfigured, false);
  assert.equal(body.aiMode, 'real');
});

test('/api/chat is answered by the local router, not by a cloud key', async () => {
  const before = routerCalls;
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'سلام، یک تست کوتاه' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  const text = JSON.stringify(body);
  assert.ok(routerCalls > before, 'the local router was never called');
  assert.ok(text.includes(ROUTER_ANSWER), 'the answer did not come from the local router');
  assert.equal(lastAuthHeader, 'Bearer test-router-key', 'router key header was not forwarded');
  assert.equal(res.headers.get('x-codgar-provider'), 'local-routers');
});

test('topology reports the live router as active', async () => {
  const res = await fetch(`${BASE}/api/router/topology`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'active');
  const nine = body.providers.find((p) => p.id === '9router');
  assert.ok(nine, '9router missing from providers');
  assert.equal(nine.reachable, true);
});
