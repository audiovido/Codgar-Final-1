import { execSync, spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { resolveRouterBinary, spawnRouterDetached } from './routerBinary';

export class LayaProcessController {
  private static instance: LayaProcessController;
  private homeDir = os.homedir();

  private constructor() {}

  public static getInstance(): LayaProcessController {
    if (!LayaProcessController.instance) {
      LayaProcessController.instance = new LayaProcessController();
    }
    return LayaProcessController.instance;
  }

  /** True when a `lsof`-like tool exists on this platform. */
  private hasBinary(name: string): boolean {
    try {
      return spawnSync('which', [name], { encoding: 'utf8', timeout: 1500 }).status === 0;
    } catch {
      return false;
    }
  }

  /**
   * Gracefully clears any process listening on a port.
   * Uses `lsof` when available and falls back to `fuser`/`ss` on minimal Linux
   * images (the previous implementation logged `lsof: not found` and did nothing).
   */
  public cleanPort(port: number): void {
    try {
      if (this.hasBinary('lsof')) {
        execSync(`lsof -ti tcp:${port} | xargs kill -15 2>/dev/null || true`, { stdio: 'ignore' });
        execSync('sleep 0.5', { stdio: 'ignore' });
        execSync(`lsof -ti tcp:${port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
      } else if (this.hasBinary('fuser')) {
        execSync(`fuser -k -TERM ${port}/tcp 2>/dev/null || true`, { stdio: 'ignore' });
      } else {
        console.warn(`[Laya Controller] ℹ️ no lsof/fuser available; skipping port ${port} cleanup.`);
        return;
      }
      console.log(`[Laya Controller] 🧹 Cleaned port ${port}`);
    } catch {
      /* port cleanup is best-effort */
    }
  }

  /**
   * Restarts 9Router (Port 20128) when the binary is actually installed.
   * Returns false (instead of crashing) when it is not available.
   */
  public async restart9Router(): Promise<boolean> {
    console.log('[Laya Controller] 🔄 Performing clean restart of 9Router (Port 20128)...');
    this.cleanPort(20128);

    // Clean up any stale sqlite locks if present
    const dbDir = path.join(this.homeDir, '.9router', 'db');
    try {
      if (fs.existsSync(path.join(dbDir, 'data.sqlite-wal'))) {
        fs.unlinkSync(path.join(dbDir, 'data.sqlite-wal'));
      }
    } catch {}

    const { proc, reason } = spawnRouterDetached('9router', ['-p', '20128', '-n', '-t']);
    if (!proc) {
      console.warn(`[Laya Controller] ⏭️ Skipping 9Router auto-start: ${reason}`);
      return false;
    }

    // Poll up to 10 seconds for service readiness
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try {
        const res = await fetch('http://127.0.0.1:20128/v1/models', { signal: AbortSignal.timeout(800) });
        if (res.ok) {
          console.log('[Laya Controller] ✅ 9Router online and healthy on port 20128!');
          return true;
        }
      } catch {}
    }
    return false;
  }

  /**
   * Restarts OmniRoute (Port 20130 / Default) when installed.
   */
  public async restartOmniRoute(): Promise<boolean> {
    console.log('[Laya Controller] 🔄 Executing OmniRoute restart/serve...');
    this.cleanPort(20130);

    const { proc, reason } = spawnRouterDetached('omniroute', ['serve']);
    if (!proc) {
      console.warn(`[Laya Controller] ⏭️ Skipping OmniRoute auto-start: ${reason}`);
      return false;
    }
    console.log('[Laya Controller] ✅ OmniRoute daemon refreshed.');
    return true;
  }

  /** True when at least one router binary exists on this machine. */
  public routersInstalled(): { nine: boolean; omni: boolean } {
    return {
      nine: Boolean(resolveRouterBinary('9router')),
      omni: Boolean(resolveRouterBinary('omniroute')),
    };
  }

  public async rotateAndHeal(failedRouter: 'omniroute' | '9router' | 'vansrouter'): Promise<void> {
    console.log(`[Laya Controller] ⚡ Self-healing invoked for ${failedRouter}...`);
    if (failedRouter === '9router') {
      await this.restart9Router();
    } else if (failedRouter === 'omniroute') {
      await this.restartOmniRoute();
    }
  }
}
