/**
 * Safe helper for spawning the optional local router binaries
 * (9router / omniroute / vansrouter).
 *
 * Why this exists: `spawn('9router', ...)` on a machine where the binary is not
 * installed emits an `error` event (ENOENT). Without an `error` listener Node
 * turns that into an uncaught exception and kills the whole server. Every spawn
 * in this project must go through this helper.
 */
import { spawn, spawnSync, type ChildProcess } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const EXTRA_BIN_DIRS = [
  path.join(os.homedir(), '.local', 'bin'),
  path.join(os.homedir(), '.npm-global', 'bin'),
  '/usr/local/bin',
  '/opt/homebrew/bin',
  '/usr/bin',
];

/** Returns the absolute path of a router binary, or null when it is not installed. */
export function resolveRouterBinary(name: string): string | null {
  if (process.env[`CODGAR_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_BIN`]) {
    const candidate = String(process.env[`CODGAR_${name.toUpperCase().replace(/[^A-Z0-9]/g, '_')}_BIN`]);
    return fs.existsSync(candidate) ? candidate : null;
  }

  for (const dir of EXTRA_BIN_DIRS) {
    const candidate = path.join(dir, name);
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }

  try {
    const which = spawnSync('which', [name], { encoding: 'utf8', timeout: 2000 });
    if (which.status === 0 && which.stdout.trim()) return which.stdout.trim();
  } catch {
    /* ignore */
  }

  return null;
}

export interface DetachedSpawnResult {
  proc: ChildProcess | null;
  reason: string;
}

/**
 * Spawns a router binary detached, with a mandatory `error` handler.
 * Never throws and never lets an ENOENT escape to the process level.
 */
export function spawnRouterDetached(
  name: string,
  args: string[],
  options: { onError?: (err: Error) => void; stdio?: 'ignore' | 'inherit' } = {}
): DetachedSpawnResult {
  const bin = resolveRouterBinary(name);
  if (!bin) {
    return {
      proc: null,
      reason: `binary '${name}' is not installed (looked in ${EXTRA_BIN_DIRS.join(', ')} and $PATH)`,
    };
  }

  try {
    const proc = spawn(bin, args, {
      detached: true,
      stdio: options.stdio || 'ignore',
      env: {
        ...process.env,
        PATH: `${process.env.PATH || ''}:${EXTRA_BIN_DIRS.join(':')}`,
      },
    });

    // CRITICAL: without this listener an ENOENT/EACCES error crashes the server.
    proc.on('error', (err) => {
      console.warn(`[routerBinary] '${name}' spawn failed:`, err.message);
      options.onError?.(err);
    });

    proc.unref();
    return { proc, reason: 'spawned' };
  } catch (err: any) {
    options.onError?.(err);
    return { proc: null, reason: `spawn threw: ${err?.message || err}` };
  }
}
