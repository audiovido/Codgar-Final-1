import { ChildProcess } from 'child_process';
import { spawnRouterDetached } from './routerBinary';
import http from 'http';
import fs from 'fs';
import path from 'path';

export interface RouterDaemonStatus {
  id: '9router' | 'omniroute' | 'vansrouter';
  name: string;
  port: number;
  baseUrl: string;
  pid: number | null;
  status: 'running' | 'stopped' | 'restarting' | 'error' | 'not-installed';
  lastStartedAt: number;
  restartsCount: number;
  requestsRouted: number;
  tokensProcessed: number;
  failoversCount: number;
  activeProvider: string;
  sourceRepo: string;
  command: string;
  description: string;
}

export class RouterDaemonManager {
  private static instance: RouterDaemonManager;

  private processes: Map<string, ChildProcess> = new Map();
  private omniServer: http.Server | null = null;
  private activeRouterIndex: number = 0;
  private readonly cycleSequence: Array<'9router' | 'omniroute' | 'vansrouter'> = [
    '9router',
    'omniroute',
    'vansrouter',
  ];

  private daemons: Record<'9router' | 'omniroute' | 'vansrouter', RouterDaemonStatus> = {
    '9router': {
      id: '9router',
      name: '9Router (NymRouter)',
      port: Number(process.env.NINEROUTER_PORT || 20128),
      baseUrl: `http://127.0.0.1:${Number(process.env.NINEROUTER_PORT || 20128)}/v1`,
      pid: null,
      status: 'stopped',
      lastStartedAt: 0,
      restartsCount: 0,
      requestsRouted: 0,
      tokensProcessed: 0,
      failoversCount: 0,
      activeProvider: 'Tier 1 Subscription + Tier 3 Free (40+ Providers)',
      sourceRepo: 'https://github.com/decolua/9router',
      command: '9router -p 20128 -H 127.0.0.1 -n --skip-update',
      description: 'Smart AI Router & RTK Token Saver (cut tool_result tokens by 20-40%)',
    },
    omniroute: {
      id: 'omniroute',
      name: 'OmniRoute Gateway',
      port: Number(process.env.OMNIROUTE_PORT || 20130),
      baseUrl: `http://127.0.0.1:${Number(process.env.OMNIROUTE_PORT || 20130)}/v1`,
      pid: null,
      status: 'stopped',
      lastStartedAt: 0,
      restartsCount: 0,
      requestsRouted: 0,
      tokensProcessed: 0,
      failoversCount: 0,
      activeProvider: '~1.62B Free Tokens Pool (359 Providers, 150+ Free Tiers)',
      sourceRepo: 'https://github.com/diegosouzapw/OmniRoute',
      command: 'omniroute --port 20130 -H 127.0.0.1',
      description: 'Universal AI Gateway with 359 providers, ~1.62B tokens/mo, RTK+Caveman compression',
    },
    vansrouter: {
      id: 'vansrouter',
      name: 'VansRouter Overdrive',
      port: Number(process.env.VANSROUTER_PORT || 20132),
      baseUrl: `http://127.0.0.1:${Number(process.env.VANSROUTER_PORT || 20132)}/v1`,
      pid: null,
      status: 'stopped',
      lastStartedAt: 0,
      restartsCount: 0,
      requestsRouted: 0,
      tokensProcessed: 0,
      failoversCount: 0,
      activeProvider: 'In-Memory Circuit Breaker & High-TPS Zero-Downtime Shield',
      sourceRepo: 'https://github.com/Vanszs/VansRouter',
      command: 'vansrouter -p 20132 -H 127.0.0.1 -n --skip-update',
      description: 'High-Concurrency Zero-Downtime Failover Router with In-Memory Circuit Breaker',
    },
  };

  private constructor() {
    this.startAllDaemons();
  }

  public static getInstance(): RouterDaemonManager {
    if (!RouterDaemonManager.instance) {
      RouterDaemonManager.instance = new RouterDaemonManager();
    }
    return RouterDaemonManager.instance;
  }

  /**
   * Spawns 9Router binary in the background on port 20128
   */
  private start9Router(): void {
    const d = this.daemons['9router'];
    try {
      if (this.processes.has('9router')) {
        try {
          this.processes.get('9router')?.kill('SIGKILL');
        } catch {}
      }

      // Spawn 9router with arguments (safe spawn: binary may not be installed)
      const ninePort = Number(process.env.NINEROUTER_PORT || d.port);
      const { proc: child, reason } = spawnRouterDetached('9router', ['-p', String(ninePort), '-H', '127.0.0.1', '-n', '--skip-update'], {
        onError: () => { d.status = 'error'; },
      });
      if (!child) {
        console.log(`[RouterDaemonManager] ℹ️ 9Router not installed (${reason}); continuing without it.`);
        d.status = 'not-installed';
        return;
      }

      child.on('exit', (code: number | null) => {
        console.log(`[RouterDaemonManager] 9Router exited with code ${code}`);
        if (d.status === 'running') {
          d.status = 'stopped';
        }
      });

      d.pid = child.pid || null;
      d.status = 'running';
      d.lastStartedAt = Date.now();
      this.processes.set('9router', child);
      d.port = ninePort;
      d.baseUrl = `http://127.0.0.1:${ninePort}/v1`;
      console.log(`[RouterDaemonManager] 🚀 9Router started on port ${ninePort} (PID: ${d.pid})`);
    } catch (err: any) {
      console.warn('[RouterDaemonManager] 9Router could not be spawned:', err.message);
      d.status = 'error';
    }
  }

  /**
   * Starts OmniRoute Engine on port 20129
   */
  private startOmniRoute(): void {
    const d = this.daemons['omniroute'];
    const port = Number(process.env.OMNIROUTE_PORT || d.port);

    // 1) حالت واقعی: باینری omniroute را اجرا کن (معماری اصلی = روتر واقعی).
    const { proc: child, reason } = spawnRouterDetached(
      'omniroute',
      ['--port', String(port), '-H', '127.0.0.1'],
      { onError: () => { d.status = 'error'; } }
    );
    if (child) {
      child.on('exit', (code: number | null) => {
        console.log(`[RouterDaemonManager] OmniRoute exited with code ${code}`);
        if (d.status === 'running') d.status = 'stopped';
      });
      d.pid = child.pid || null;
      d.port = port;
      d.baseUrl = `http://127.0.0.1:${port}/v1`;
      d.status = 'running';
      d.lastStartedAt = Date.now();
      this.processes.set('omniroute', child);
      console.log(`[RouterDaemonManager] 🚀 OmniRoute started on port ${port} (PID: ${d.pid})`);
      return;
    }

    // 2) بدون باینری: هیچ موتور قلابی‌ای به‌صورت پیش‌فرض بالا نمی‌آید.
    if (process.env.CODGAR_MOCK_OMNIROUTE !== '1') {
      console.log(`[RouterDaemonManager] ℹ️ OmniRoute not installed (${reason}); continuing without it.`);
      d.status = 'not-installed';
      return;
    }

    // 3) فقط با CODGAR_MOCK_OMNIROUTE=1: یک موتور شبیه‌سازی‌شده‌ی صراحتاً برچسب‌خورده
    //    برای تست‌های محلی. پاسخ‌هایش هدر X-Codgar-Simulated دارند و لایه‌ی
    //    aiProviders آن‌ها را به‌عنوان پاسخ واقعی قبول نمی‌کند.
    try {
      if (this.omniServer) {
        try { this.omniServer.close(); } catch {}
      }
      this.omniServer = http.createServer((req, res) => {
        d.requestsRouted++;
        const simulatedHeaders = { 'Content-Type': 'application/json', 'X-Codgar-Simulated': '1' };
        if (req.url === '/health' || req.url === '/api/health' || req.url === '/v1/models') {
          res.writeHead(200, simulatedHeaders);
          res.end(JSON.stringify({ status: 'ok', gateway: 'omniroute-mock', simulated: true }));
          return;
        }
        if (req.url?.includes('/v1/chat/completions') || req.url?.includes('/v1/messages')) {
          res.writeHead(200, simulatedHeaders);
          res.end(JSON.stringify({
            id: `omni-mock-${Date.now()}`,
            object: 'chat.completion',
            created: Math.floor(Date.now() / 1000),
            model: 'omniroute-mock',
            simulated: true,
            choices: [{ index: 0, message: { role: 'assistant', content: '[simulated omniroute mock]' }, finish_reason: 'stop' }],
          }));
          return;
        }
        res.writeHead(200, simulatedHeaders);
        res.end(JSON.stringify({ status: 'active', engine: 'omniroute-mock', simulated: true }));
      });
      this.omniServer.listen(port, '127.0.0.1', () => {
        d.pid = process.pid;
        d.port = port;
        d.baseUrl = `http://127.0.0.1:${port}/v1`;
        d.status = 'running';
        d.lastStartedAt = Date.now();
        console.warn(`[RouterDaemonManager] ⚠️ OmniRoute MOCK (simulated) listening on port ${port} — CODGAR_MOCK_OMNIROUTE=1`);
      });
    } catch (err: any) {
      console.warn('[RouterDaemonManager] OmniRoute mock start notice:', err.message);
      d.status = 'error';
    }
  }

  /**
   * Spawns VansRouter binary in the background on port 20130
   */
  private startVansRouter(): void {
    const d = this.daemons['vansrouter'];
    try {
      if (this.processes.has('vansrouter')) {
        try {
          this.processes.get('vansrouter')?.kill('SIGKILL');
        } catch {}
      }

      // Spawn vansrouter with arguments (safe spawn: binary may not be installed)
      const vansPort = Number(process.env.VANSROUTER_PORT || d.port);
      const { proc: child, reason } = spawnRouterDetached('vansrouter', ['-p', String(vansPort), '-H', '127.0.0.1', '-n', '--skip-update'], {
        onError: () => { d.status = 'error'; },
      });
      if (!child) {
        console.log(`[RouterDaemonManager] ℹ️ VansRouter not installed (${reason}); continuing without it.`);
        d.status = 'not-installed';
        return;
      }

      child.on('exit', (code: number | null) => {
        console.log(`[RouterDaemonManager] VansRouter exited with code ${code}`);
        if (d.status === 'running') {
          d.status = 'stopped';
        }
      });

      d.pid = child.pid || null;
      d.status = 'running';
      d.lastStartedAt = Date.now();
      this.processes.set('vansrouter', child);
      d.port = vansPort;
      d.baseUrl = `http://127.0.0.1:${vansPort}/v1`;
      console.log(`[RouterDaemonManager] 🚀 VansRouter started on port ${vansPort} (PID: ${d.pid})`);
    } catch (err: any) {
      console.warn('[RouterDaemonManager] VansRouter could not be spawned:', err.message);
      d.status = 'error';
    }
  }

  /**
   * Starts all 3 router services
   */
  public startAllDaemons(): void {
    this.start9Router();
    this.startOmniRoute();
    this.startVansRouter();
  }

  /**
   * Stops all 3 router processes
   */
  public stopAllDaemons(): void {
    for (const [key, proc] of this.processes.entries()) {
      try {
        proc.kill('SIGTERM');
      } catch {}
    }
    this.processes.clear();

    if (this.omniServer) {
      try { this.omniServer.close(); } catch {}
      this.omniServer = null;
    }

    for (const key of Object.keys(this.daemons) as Array<'9router' | 'omniroute' | 'vansrouter'>) {
      this.daemons[key].status = 'stopped';
      this.daemons[key].pid = null;
    }
    console.log('[RouterDaemonManager] ⏹️ Stopped all 3 router daemons (9Router, OmniRoute, VansRouter).');
  }

  /**
   * Infinite Loop Cycle with Process Restart:
   * "اگر هم دوباره به خط اول رسیدش ناینروتر یا امنیروتر یا ونسروتر استاپ و دوباره اجرا بشن"
   */
  public cycleToNextRouter(reason: string = 'token_exhaustion'): {
    previousRouter: RouterDaemonStatus;
    activeRouter: RouterDaemonStatus;
    didLoopRestart: boolean;
  } {
    const prevKey = this.cycleSequence[this.activeRouterIndex];
    const prevDaemon = this.daemons[prevKey];
    prevDaemon.failoversCount++;

    let didLoopRestart = false;
    this.activeRouterIndex = (this.activeRouterIndex + 1) % this.cycleSequence.length;

    // When the cycle wraps back to 0 (9router), trigger stop & restart:
    if (this.activeRouterIndex === 0) {
      didLoopRestart = true;
      console.log('[RouterDaemonManager] 🔄 Reached start of cascade chain! Stopping and restarting all 3 daemons...');
      this.stopAllDaemons();
      
      // Increment restart counters
      for (const key of Object.keys(this.daemons) as Array<'9router' | 'omniroute' | 'vansrouter'>) {
        this.daemons[key].restartsCount++;
      }

      // Re-launch all 3 routers fresh
      this.startAllDaemons();
    }

    const nextKey = this.cycleSequence[this.activeRouterIndex];
    const activeDaemon = this.daemons[nextKey];

    console.log(
      `[RouterDaemonManager] ⚡ Switched active router from [${prevKey}] to [${nextKey}] | Reason: ${reason} | Loop restarted: ${didLoopRestart}`
    );

    return {
      previousRouter: prevDaemon,
      activeRouter: activeDaemon,
      didLoopRestart,
    };
  }

  public getActiveRouter(): RouterDaemonStatus {
    const currentKey = this.cycleSequence[this.activeRouterIndex];
    return this.daemons[currentKey];
  }

  public getAllStatuses(): RouterDaemonStatus[] {
    return Object.values(this.daemons);
  }

  public getSequence(): Array<'9router' | 'omniroute' | 'vansrouter'> {
    return this.cycleSequence;
  }

  public getActiveIndex(): number {
    return this.activeRouterIndex;
  }
}
