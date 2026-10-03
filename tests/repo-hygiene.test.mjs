/**
 * Repository hygiene checks: leaked secrets, leftover patcher scripts and the
 * removed personal data must not come back.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'public']);
const TEXT_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css|sh|bat|py|yml|yaml|example|env|lock)$/i;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

const files = walk(ROOT);

// Needles are assembled at runtime so this file itself never contains them.
const LEAKED_KEY = ['sk-1b85c23a', '61dee238-k2vequ-4bc8de92'].join('');
const PERSONAL_EMAIL = ['armins', 'h00'].join('');
const PERSONAL_NAME = ['armins', 'hokri'].join('');

test('no leaked provider key in the working tree', () => {
  const offenders = [];
  for (const file of files) {
    if (!TEXT_EXT.test(file)) continue;
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    if (content.includes(LEAKED_KEY)) offenders.push(path.relative(ROOT, file));
  }
  assert.deepEqual(offenders, [], `leaked key found in: ${offenders.join(', ')}`);
});

test('no generic hardcoded sk- secrets in server sources', () => {
  const offenders = [];
  for (const file of files.filter((f) => f.startsWith(path.join(ROOT, 'server')) || f.endsWith('server.ts'))) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(/['"`]sk-[A-Za-z0-9-]{16,}['"`]/g)) {
      // allow clearly-fake placeholders
      if (/sk-(codgar|example|test)/i.test(match[0])) continue;
      offenders.push(`${path.relative(ROOT, file)}: ${match[0].slice(0, 24)}...`);
    }
  }
  assert.deepEqual(offenders, []);
});

test('personal identifiers were removed from the repository', () => {
  const offenders = [];
  for (const file of files) {
    if (!TEXT_EXT.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(PERSONAL_EMAIL) || content.includes(PERSONAL_NAME)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
  assert.deepEqual(offenders, [], `personal data found in: ${offenders.join(', ')}`);
});

test('one-shot patcher scripts are gone', () => {
  const banned = [
    'fix_all.py',
    'fix_followup.py',
    'deep_repair.py',
    'radical_brain_overhaul.py',
    'autonomous_patch.py',
    'overnight_daemon.py',
    'server.ts.bak',
    'server/infiniteTokenPool.ts.bak',
    'scripts/wire_real_voice.cjs',
    'scripts/add_voice_endpoints.cjs',
  ];
  const present = banned.filter((rel) => fs.existsSync(path.join(ROOT, rel)));
  assert.deepEqual(present, [], `these files must not exist: ${present.join(', ')}`);
});

test('dangerous code-execution routes are covered by the security gate', () => {
  const source = fs.readFileSync(path.join(ROOT, 'server', 'httpSecurity.ts'), 'utf8');
  for (const route of ['(shell|action)', '(exec|execute|cancel)', '(execute|install-tool', '(execute|organize-desktop', '(write|delete|move)']) {
    assert.ok(source.includes(route), `security gate is missing pattern for ${route}`);
  }
});
