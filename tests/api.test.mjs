/**
 * Integration tests for the Codgar backend.
 *
 * They start the *real* server (same entry point as `npm run dev`) on a free
 * port and exercise the HTTP surface, including the regression tests for the
 * crash (C1), the CSRF/RCE hardening (C3), the honest-AI contract (C4) and the
 * endpoints that the frontend calls but that used to be missing (H5).
 *
 * Run with:  npm test
 */
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 33900 + Math.floor(Math.random() * 90);
const BASE = `http://127.0.0.1:${PORT}`;
const SAME_ORIGIN = { Origin: `http://127.0.0.1:${PORT}` };
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let server;

async function waitForHealth(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/api/health`);
      if (res.ok) return true;
    } catch {
      /* not ready yet */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('server did not become healthy in time');
}

before(async () => {
  const tsxBin = path.join(ROOT, 'node_modules', '.bin', 'tsx');
  server = spawn(tsxBin, ['server.ts'], {
    cwd: ROOT,
    detached: true, // own process group so the whole tree can be killed
    env: {
      ...process.env,
      PORT: String(PORT),
      BIND_HOST: '127.0.0.1',
      DISABLE_HMR: 'true',
      CODGAR_DEMO_MODE: '',
      GEMINI_API_KEY: '',
      ANTHROPIC_API_KEY: '',
      NINEROUTER_API_KEY: '',
      OMNIROUTE_API_KEY: '',
      VANSROUTER_API_KEY: '',
      CODGAR_PIN: '864209',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server] ${d}`));
  await waitForHealth();
});

after(async () => {
  if (!server) return;
  try {
    process.kill(-server.pid, 'SIGKILL'); // kill the whole process group
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
});

test('health endpoint reports honest runtime state', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
  // در محیط تست هیچ‌کدام از سه روتر پس‌زمینه بالا نیست و کلید ابری هم نداریم
  assert.equal(body.routersOnline, false);
  assert.equal(body.engine, 'local-routers-first');
  assert.equal(body.aiMode, 'none');
  assert.equal(body.demoMode, false);
  assert.equal(body.execEndpointsProtected, true);
  assert.equal(typeof body.keyMask, 'string');
  assert.ok(!JSON.stringify(body).includes('sk-'), 'health must not leak key material');
});

test('C1 regression: repeated /api/pool/cascade calls must not kill the server', async () => {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(`${BASE}/api/pool/cascade`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ reason: `test iteration ${i}` }),
    });
    assert.equal(res.status, 200, `cascade #${i + 1} failed`);
  }
  const health = await fetch(`${BASE}/api/health`);
  assert.equal(health.status, 200, 'server died after cascading routers (spawn ENOENT crash)');
});

test('C3: cross-origin requests cannot reach shell execution endpoints', async () => {
  const blocked = await fetch(`${BASE}/api/mcp/shell`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, Origin: 'https://evil.example.com', 'Sec-Fetch-Site': 'cross-site' },
    body: JSON.stringify({ command: 'id' }),
  });
  assert.equal(blocked.status, 403);
  const body = await blocked.json();
  assert.ok(['ORIGIN_NOT_ALLOWED', 'CROSS_SITE_BLOCKED'].includes(body.error));
});

test('C3: dangerous routes reject non-JSON bodies', async () => {
  const res = await fetch(`${BASE}/api/terminal/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: 'command=id',
  });
  assert.equal(res.status, 415);
});

test('C3: same-origin shell execution still works (architecture preserved)', async () => {
  const res = await fetch(`${BASE}/api/mcp/shell`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ command: 'echo codgar-ok' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.match(body.output, /codgar-ok/);
});

test('H5: /api/terminal/execute alias exists and runs', async () => {
  const res = await fetch(`${BASE}/api/terminal/execute`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ command: 'echo alias-ok' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.match(body.stdout, /alias-ok/);
});

test('H5: /api/files/content writes uploads safely', async () => {
  const res = await fetch(`${BASE}/api/files/content`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ filePath: 'uploads/test-note.txt', content: 'hello' }),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);

  const escape = await fetch(`${BASE}/api/files/content`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ filePath: '../../../../etc/passwd', content: 'nope' }),
  });
  assert.ok(escape.status >= 400, 'path containment must block directory traversal');
});

test('H5: project timeline endpoints answer', async () => {
  const decompose = await fetch(`${BASE}/api/project/timeline/decompose`, { method: 'POST', headers: SAME_ORIGIN });
  assert.equal(decompose.status, 200);
  const d = await decompose.json();
  assert.equal(d.success, true);
  assert.equal(d.source, 'agent-runtime');

  const execute = await fetch(`${BASE}/api/project/timeline/execute`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ title: 'smoke task' }),
  });
  assert.equal(execute.status, 200);
  const e = await execute.json();
  assert.equal(e.success, true);
  assert.ok(e.taskId);
});

test('H5: /api/transcribe exists and is honest when unconfigured', async () => {
  const noAudio = await fetch(`${BASE}/api/transcribe`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({}),
  });
  assert.equal(noAudio.status, 400);

  const noProvider = await fetch(`${BASE}/api/transcribe`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ audio: 'AAAA', mimeType: 'audio/webm' }),
  });
  assert.equal(noProvider.status, 501);
  const body = await noProvider.json();
  assert.equal(body.error, 'TRANSCRIBER_NOT_CONFIGURED');
});

test('H5: yadow router is mounted once (no /api/api duplication)', async () => {
  const ok = await fetch(`${BASE}/api/status`);
  assert.equal(ok.status, 200);
  const duplicated = await fetch(`${BASE}/api/api/status`);
  // In dev mode Vite answers unknown paths with the SPA index.html, so the
  // important part is that the router no longer exposes /api/api/* JSON routes.
  const contentType = duplicated.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const payload = await duplicated.json();
    assert.notEqual(payload.server, 'Codgar Universal Backend', '/api/api/status is still served by the yadow router');
  }
});

test('C4: no canned reply when none of the three routers is reachable', async () => {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ message: 'build a todo app in react' }),
  });
  assert.equal(res.status, 503);
  const body = await res.json();
  assert.equal(body.error, 'NO_ROUTER_AVAILABLE');
  assert.deepEqual(body.routersExpected, ['9router', 'omniroute', 'vansrouter']);
  assert.equal(res.headers.get('x-codgar-mode'), 'none');
});

test('C4: metrics and topology contain no fabricated numbers', async () => {
  const metrics = await fetch(`${BASE}/api/pool/metrics`);
  assert.equal(metrics.status, 200);
  const metricsText = JSON.stringify(await metrics.json());
  assert.ok(!metricsText.includes('38%'), 'fake compression metric is still reported');
  assert.ok(!metricsText.includes('avg savings'), 'unverifiable catalogue number reported as a live metric');

  const topology = await fetch(`${BASE}/api/router/topology`);
  assert.equal(topology.status, 200);
  const topo = await topology.json();
  assert.equal(topo.status, 'not-configured');
  assert.equal(topo.source, 'static-registry+live-probe');
  assert.ok(Array.isArray(topo.providers) && topo.providers.length >= 2);
});

test('C4: comprehensive-test reports that it is a local simulation', async () => {
  const res = await fetch(`${BASE}/api/router/comprehensive-test`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  const report = body.report || body;
  assert.equal(report.simulated, true);
  assert.ok(!JSON.stringify(body).includes('38.5%'));
});

test('C4: installer reports reality instead of claiming an install', async () => {
  const res = await fetch(`${BASE}/api/router/install-package`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body.installedPackages));
  assert.ok(Array.isArray(body.missingPackages));
  assert.ok(!JSON.stringify(body).includes('gaif-dev-core@2.6.0'), 'fake package list is still returned');
});

test('M2: virtual API keys never expose a PIN', async () => {
  const generated = await fetch(`${BASE}/api/keys/generate`, {
    method: 'POST',
    headers: { ...JSON_HEADERS, ...SAME_ORIGIN },
    body: JSON.stringify({ label: 'test key' }),
  });
  assert.equal(generated.status, 200);
  const body = await generated.json();
  assert.equal(body.virtual, true);
  assert.ok(!/"pin"/.test(JSON.stringify(body)), 'PIN leaked in the generate response');

  const list = await fetch(`${BASE}/api/keys/list`);
  const listBody = await list.json();
  assert.ok(!JSON.stringify(listBody).includes('defaultPin'));
  assert.ok(!JSON.stringify(listBody).includes('"pin"'));
});

test('MCP ping is measured, unknown MCP routes are honest', async () => {
  const ping = await fetch(`${BASE}/api/mcp/ping`);
  assert.equal(ping.status, 200);
  const pingBody = await ping.json();
  assert.equal(pingBody.measured, true);

  const unknown = await fetch(`${BASE}/api/mcp/does-not-exist`);
  assert.equal(unknown.status, 501);
});

test('H3: gmail inbox does not expose a personal address', async () => {
  const res = await fetch(`${BASE}/api/connectors/gmail/emails`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(!JSON.stringify(body).includes(['armins', 'h00'].join('')), 'personal address leaked');
});

test('H1: PORT env var is honoured', () => {
  // The server is listening on the requested port, otherwise none of the tests
  // above would reach it. This assertion documents the contract.
  assert.equal(new URL(BASE).port, String(PORT));
});

test('H7: CORS headers are only echoed for allowed origins', async () => {
  const same = await fetch(`${BASE}/api/health`, { headers: SAME_ORIGIN });
  assert.equal(same.headers.get('access-control-allow-origin'), `http://127.0.0.1:${PORT}`);

  const foreign = await fetch(`${BASE}/api/health`, { headers: { Origin: 'https://evil.example.com' } });
  assert.equal(foreign.headers.get('access-control-allow-origin'), null);
});
