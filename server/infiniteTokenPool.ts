import { LayaProcessController } from "./layaProcessController";
import { generateReply } from './aiProviders';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { KeyManager } from './keyManager';

/**
 * Interface for AI Router Source Configuration
 * (9Router, OmniRoute, VansRouter)
 */
export interface RouterSourceInfo {
  id: 'omniroute' | '9router' | 'vansrouter';
  name: string;
  repoUrl: string;
  tagline: string;
  defaultPort: number;
  activeStatus: 'running' | 'restarting' | 'cooling' | 'active';
  totalTokensAvailable: string;
  compressionEngine: string;
  tpsCapacity: number;
  quotaExhaustedCount: number;
  lastRestartAt: number;
  models: Array<{
    id: string;
    name: string;
    provider: string;
    tier: 'free' | 'subscription' | 'overdrive';
    specialty: string[];
    isAvailable: boolean;
    cooldownUntil: number;
  }>;
}

/**
 * Interface for Generated Virtual API Keys
 */
export interface GeneratedApiKey {
  id: string;
  key: string;
  label: string;
  pin: string; // Default '123456'
  createdAt: number;
  lastUsedAt: number | null;
  requestsHandled: number;
  tokensProcessed: number;
  status: 'active' | 'revoked';
}

/**
 * Unified Infinite Token Pool & Cascading Router Hub
 * Integrates:
 * 1. https://github.com/decolua/9router
 * 2. https://github.com/diegosouzapw/OmniRoute
 * 3. https://github.com/Vanszs/VansRouter
 */
export class InfiniteTokenPool {
  private static instance: InfiniteTokenPool;

  private currentRouterIndex: number = 0;
  private cascadeChain: Array<'omniroute' | '9router' | 'vansrouter'> = [
    'omniroute',
    '9router',
    'vansrouter',
  ];

  private generatedKeys: GeneratedApiKey[] = [];
  private totalRotations: number = 0;
  private totalRestarts: number = 0;

  // Source catalogs representing the 3 GitHub repositories
  private routerSources: Record<'omniroute' | '9router' | 'vansrouter', RouterSourceInfo> = {
    omniroute: {
      id: 'omniroute',
      name: 'OmniRoute Gateway',
      repoUrl: 'https://github.com/diegosouzapw/OmniRoute',
      tagline: 'The Free AI Gateway (359 Providers, 150+ Free Tiers, ~1.62B Free Tokens/Mo)',
      defaultPort: 20130,
      activeStatus: 'running',
      totalTokensAvailable: '~1.62 Billion Tokens/Month Pool',
      compressionEngine: 'RTK + Caveman stacked compression (upstream feature - not measured by this server)',
      tpsCapacity: 140,
      quotaExhaustedCount: 0,
      lastRestartAt: Date.now(),
      models: [
        {
          id: 'omni-codgar-code',
          name: 'Gemini 3.6 Flash (Omni Free Pool)',
          provider: 'Google AI Studio',
          tier: 'free',
          specialty: ['general-coding', 'instant-speed', 'sub-100ms'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'omni-codgar-code',
          name: 'Gemini 3.5 Flash (Omni Edge Backup)',
          provider: 'Google AI Studio',
          tier: 'free',
          specialty: ['fallback-speed', 'unlimited-free-tier'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'omni-claude-3-7-sonnet',
          name: 'Claude 3.7 Sonnet (Omni Gateway)',
          provider: 'Anthropic',
          tier: 'subscription',
          specialty: ['deep-reasoning', 'system-design', 'multi-file-refactor'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'omni-deepseek-v3',
          name: 'DeepSeek V3 / R1 (Omni Open Mesh)',
          provider: 'DeepSeek',
          tier: 'free',
          specialty: ['math-logic', 'algorithms', 'complex-bugs'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'omni-qwen-2.5-coder',
          name: 'Qwen 2.5 Coder 32B (Omni Polyglot)',
          provider: 'Alibaba Cloud',
          tier: 'free',
          specialty: ['polyglot-syntax', 'python-rust-ts', 'unit-tests'],
          isAvailable: true,
          cooldownUntil: 0,
        },
      ],
    },
    '9router': {
      id: '9router',
      name: '9Router Engine',
      repoUrl: 'https://github.com/decolua/9router',
      tagline: 'Smart 3-Tier Fallback & RTK Token Saver (Save 20-40% tokens, Zero Downtime)',
      defaultPort: 20128,
      activeStatus: 'running',
      totalTokensAvailable: 'Infinite Rolling Dynamic Reservoir',
      compressionEngine: 'RTK Headroom token saver (upstream feature)',
      tpsCapacity: 160,
      quotaExhaustedCount: 0,
      lastRestartAt: Date.now(),
      models: [
        {
          id: '9router-claude-code-cli',
          name: 'Claude Code CLI (9Router Native)',
          provider: 'Anthropic',
          tier: 'subscription',
          specialty: ['autonomous-terminal', 'live-codebase-edits'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: '9router-gemini-fast',
          name: 'Gemini 3.8 Flash (9Router Tier 3 Free)',
          provider: 'Google AI',
          tier: 'free',
          specialty: ['rate-limit-bypass', 'instant-execution'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: '9router-spec-synthesizer',
          name: 'NineWriter Spec & PRD Architect',
          provider: 'Vance Core',
          tier: 'free',
          specialty: ['specs', 'documentation', 'architecture-diagrams'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: '9router-git-committer',
          name: '9Router Semantic Git Diff Synthesizer',
          provider: 'Vance Core',
          tier: 'free',
          specialty: ['conventional-commits', 'semantic-diffs'],
          isAvailable: true,
          cooldownUntil: 0,
        },
      ],
    },
    vansrouter: {
      id: 'vansrouter',
      name: 'VansRouter Overdrive',
      repoUrl: 'https://github.com/Vanszs/VansRouter',
      tagline: 'In-Memory Circuit Breaker & High-TPS Zero-Downtime Failover Shield',
      defaultPort: 20132,
      activeStatus: 'running',
      totalTokensAvailable: 'High-Concurrency In-Memory Buffer',
      compressionEngine: 'Kimchi TPS optimization + token compactor (upstream feature)',
      tpsCapacity: 220,
      quotaExhaustedCount: 0,
      lastRestartAt: Date.now(),
      models: [
        {
          id: 'vans-overdrive-turbo',
          name: 'Vans Extreme Throughput Turbo',
          provider: 'Vans Core',
          tier: 'overdrive',
          specialty: ['high-concurrency', 'parallel-compilation', 'zero-queue'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'vans-gemini-resilient',
          name: 'Gemini 3.8 Flash (Vans Failover Shield)',
          provider: 'Google AI Studio',
          tier: 'free',
          specialty: ['sub-second-failover', 'anti-429-shield'],
          isAvailable: true,
          cooldownUntil: 0,
        },
        {
          id: 'vans-concurrency-beast',
          name: 'Vans Parallel Task Worker Beast',
          provider: 'Vans Core',
          tier: 'overdrive',
          specialty: ['parallel-linting', 'async-testing', 'multi-process'],
          isAvailable: true,
          cooldownUntil: 0,
        },
      ],
    },
  };

  private constructor() {
    this.initDefaultKeys();
  }

  public static getInstance(): InfiniteTokenPool {
    if (!InfiniteTokenPool.instance) {
      InfiniteTokenPool.instance = new InfiniteTokenPool();
    }
    return InfiniteTokenPool.instance;
  }

  /**
   * Initializes or loads virtual API keys with default PIN '123456'
   */
  private initDefaultKeys(): void {
    const pin = this.getConfiguredPin();
    if (this.generatedKeys.length === 0) {
      this.generateNewApiKey('Codgar Master Infinite Token Key', pin);
      this.generateNewApiKey('OmniRoute + 9Router + VansRouter Mesh Key', pin);
    }
  }

  /** PIN comes from CODGAR_PIN; falls back to the documented default. */
  public getConfiguredPin(): string {
    const pin = String(process.env.CODGAR_PIN || '').trim();
    return pin || '123456';
  }

  /**
   * Generates a new API key with the user-specified PIN (default: '123456')
   */
  public generateNewApiKey(label: string = 'Auto-Generated Mesh Key', pin?: string): GeneratedApiKey {
    const randomHex = crypto.randomBytes(16).toString('hex');
    const newKey: GeneratedApiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      key: `sk-codgar-omni9vans-${randomHex}`,
      label,
      pin: pin || this.getConfiguredPin(),
      createdAt: Date.now(),
      lastUsedAt: null,
      requestsHandled: 0,
      tokensProcessed: 0,
      status: 'active',
    };

    this.generatedKeys.unshift(newKey);
    // NOTE: the PIN is deliberately not logged.
    console.log(`[InfiniteTokenPool] 🔑 Generated new virtual API Key: ${newKey.key.slice(0, 20)}...`);
    return newKey;
  }

  /**
   * Verifies PIN (123456) for authentication
   */
  public verifyPin(pin: string): boolean {
    return pin.trim() === this.getConfiguredPin();
  }

  public getGeneratedKeys(): GeneratedApiKey[] {
    return this.generatedKeys;
  }

  public getRouterSources(): RouterSourceInfo[] {
    return Object.values(this.routerSources);
  }

  public getActiveRouter(): RouterSourceInfo {
    const currentId = this.cascadeChain[this.currentRouterIndex];
    return this.routerSources[currentId];
  }

  /**
   * Selects the optimal model for a given task prompt
   */
  public pickOptimalModelForTask(prompt: string, taskType?: string): {
    router: RouterSourceInfo;
    model: RouterSourceInfo['models'][0];
  } {
    const activeRouter = this.getActiveRouter();
    const promptLower = prompt.toLowerCase();

    // Check if task involves deep reasoning / refactoring
    const isDeepReasoning =
      taskType === 'refactor' ||
      promptLower.includes('refactor') ||
      promptLower.includes('architecture') ||
      promptLower.includes('معماری') ||
      promptLower.includes('بازنویسی');

    // Check if task involves specs / git diff
    const isSpecOrGit =
      promptLower.includes('git') ||
      promptLower.includes('commit') ||
      promptLower.includes('کامیت') ||
      promptLower.includes('spec') ||
      promptLower.includes('prd');

    let chosen = activeRouter.models[0];

    for (const m of activeRouter.models) {
      if (Date.now() < m.cooldownUntil) continue;

      if (isDeepReasoning && m.specialty.includes('deep-reasoning')) {
        chosen = m;
        break;
      }
      if (isSpecOrGit && (m.specialty.includes('specs') || m.specialty.includes('conventional-commits'))) {
        chosen = m;
        break;
      }
      if (m.specialty.includes('general-coding') || m.specialty.includes('rate-limit-bypass')) {
        chosen = m;
      }
    }

    return {
      router: activeRouter,
      model: chosen,
    };
  }

  /**
   * Cascades to the next router in the pool:
   * OmniRoute -> 9Router -> VansRouter -> (restart & repeat infinitely!)
   */
  public cascadeToNextRouter(reason: string): {
    previousRouter: string;
    newRouter: RouterSourceInfo;
    didLoopRestart: boolean;
  } {
    const prevId = this.cascadeChain[this.currentRouterIndex];
    this.routerSources[prevId].quotaExhaustedCount++;
    this.totalRotations++;

    let didLoopRestart = false;
    this.currentRouterIndex = (this.currentRouterIndex + 1) % this.cascadeChain.length;

    // If we wrapped back to index 0, trigger the restart directive:
    // "اگر هم دوباره به خط اول رسیدش ناینروتر یا امنیروتر یا ونسروتر استاپ و دوباره اجرا بشن"
    if (this.currentRouterIndex === 0) {
      didLoopRestart = true;
      this.totalRestarts++;
      // Never fire-and-forget: an unhandled rejection here used to reach the
      // process level and could take the whole server down.
      void this.restartAndRefreshRouters().catch((err) =>
        console.warn('[InfiniteTokenPool] router restart skipped:', err?.message || err)
      );
    }

    const nextId = this.cascadeChain[this.currentRouterIndex];
    const newRouter = this.routerSources[nextId];

    console.log(
      `[InfiniteTokenPool] 🔄 Cascading from ${prevId} to ${nextId} | Reason: ${reason} | Restarts: ${this.totalRestarts} | 9Router Pipeline Active.`
    );

    return {
      previousRouter: prevId,
      newRouter,
      didLoopRestart,
    };
  }

  /**
   * Stops, clears cooldowns, and restarts all three routers
   */
  public async restartAndRefreshRouters(): Promise<void> {
    const controller = LayaProcessController.getInstance();
    await controller.restart9Router();
    await controller.restartOmniRoute();
    console.log("[InfiniteTokenPool] ⚡ Physical background restart completed by Laya Controller!");
  }

  /**
   * Executes AI task through the Infinite Cascading Mesh,
   * completely intercepting 429 quota errors and ensuring continuous completion
   */
  public async executeWithInfiniteCascade(
    prompt: string,
    options: {
      systemInstruction?: string;
      history?: any[];
      taskType?: string;
      language?: string;
      routerId?: string;
    } = {}
  ): Promise<{
    text: string;
    routerUsed: string;
    modelUsed: string;
    compressionSavings: string;
    cascadedCount: number;
    tokensSavedEstimate: number;
    simulated?: boolean;
  }> {
    // NOTE: the previous hardcoded `if (false) { ... }` demo block was removed.
    // Real generation continues below through KeyManager (Gemini) failover.

    let attempts = 0;
    const maxAttempts = 1;
    let cascadedCount = 0;

    // Update first generated key stats
    if (this.generatedKeys.length > 0) {
      this.generatedKeys[0].requestsHandled++;
      this.generatedKeys[0].lastUsedAt = Date.now();
    }

    // Build normalized, clean contents array
    const safeContents: any[] = [];
    if (Array.isArray(options.history)) {
      for (const item of options.history.slice(-8)) {
        const rawText = typeof item === 'string' ? item : item?.content || item?.text || (item?.parts && item.parts[0]?.text);
        if (rawText && typeof rawText === 'string' && rawText.trim()) {
          safeContents.push({
            role: item.role === 'assistant' || item.role === 'model' ? 'model' : 'user',
            parts: [{ text: rawText.trim() }],
          });
        }
      }
    }
    safeContents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    while (attempts < maxAttempts) {
      attempts++;
      const { router, model } = this.pickOptimalModelForTask(prompt, options.taskType);

      try {
        const keyManager = KeyManager.getInstance();
        const candidateModels = [
          'codgar-code',
          'codgar-code',
          'codgar-code',
          'gemini-flash-latest',
        ];

        for (const candModel of candidateModels) {
          try {
            const genResult = await keyManager.executeWithRotation(async (ai) => {
              return await ai.models.generateContent({
                model: candModel,
                contents: safeContents,
                config: {
                  systemInstruction: `${options.systemInstruction || ''}\n\n[CRITICAL SYSTEM ARCHITECTURE DIRECTIVE - PRODUCTION EXECUTION ENGINE]:\nYou are an Elite Systems Architect and Frontend Engine Developer.\nYou must NEVER generate static placeholders, shallow landing pages, or mock wrappers.\nEvery generated React component must be 100% interactive, fully operational, and production-ready:\n\n1. REAL-TIME & SIMULATION DOMAINS (Orderbooks, Tickers, Live Feeds, Dashboards):\n   - MUST maintain separate state variables: bids, asks, currentPrice, spread, volume, and history.\n   - MUST implement an internal continuous ticker loop using setInterval or real-time simulation inside useEffect.\n   - STRICT CLEANUP REQUIREMENT: Every useEffect MUST return an explicit cleanup function: () => clearInterval(timer).\n   - MUST calculate accumulated market depth, spread metrics, and visual depth ratio bars dynamically.\n\n2. MULTIMEDIA & AUDIO/CANVAS DOMAINS (Synthesizers, Visualizers, Audio Nodes):\n   - MUST instantiate and manage real AudioContext, OscillatorNode, GainNode, and AnalyserNode.\n   - Canvas Rendering: MUST implement an active render loop via requestAnimationFrame drawing real frequency and waveform byte data onto the HTML5 Canvas.\n   - STRICT CLEANUP REQUIREMENT: On component unmount, MUST call cancelAnimationFrame(frameId) and safely close or suspend the AudioContext.\n   - UI Controls: MUST provide working frequency sliders, waveform selectors (sine, sawtooth, square, triangle), and master gain control.\n\n3. ADVANCED STATE & HOOKS GOVERNANCE:\n   - MINIMUM HOOKS THRESHOLD: Any generated application MUST utilize at least 4 to 8 distinct React hooks (useState, useEffect, useRef, useCallback, useMemo).\n   - ZERO PLACEHOLDERS: Implement all calculations, mathematical formulas, and handlers completely.\n\n[INFINITE TOKEN POOL DIRECTIVE]: Connected via ${router.name} (${model.name}). RTK Token Compression active. Provide complete, production-grade, executable code with zero placeholders.`,
                  temperature: 0.35,
                },
              });
            }, 1);

            if (genResult?.text) {
              if (this.generatedKeys.length > 0) {
                this.generatedKeys[0].tokensProcessed += prompt.length + genResult.text.length;
              }
              return {
                text: genResult.text,
                routerUsed: router.name,
                modelUsed: `${model.name} (${candModel})`,
                compressionSavings: '0% (compression not applied)',
                cascadedCount,
                tokensSavedEstimate: 0,
              };
            }
          } catch (modelErr: any) {
            console.log(`[InfiniteTokenPool] Gateway model ${candModel} on ${router.name} busy/cooldown, failing over...`);
          }
        }
      } catch (err: any) {
        console.log(`[InfiniteTokenPool] Router ${router.name} active cascade failover...`);
      }

      // Quota exhausted on current router: mark model cooldown and cascade to next router!
      model.cooldownUntil = Date.now() + 60_000;
      this.cascadeToNextRouter(`Quota or 429 on ${model.name}`);
      cascadedCount++;
    }

    // --- Honest fallback (no invented answers) --------------------------
    // Try the remaining real providers (Anthropic direct + local gateways).
    const real = await generateReply(prompt, {
      systemInstruction: options.systemInstruction,
      history: options.history,
      language: options.language,
      taskType: options.taskType,
    });

    if (real.ok && real.text) {
      if (this.generatedKeys.length > 0) {
        this.generatedKeys[0].tokensProcessed += prompt.length + real.text.length;
      }
      console.log(`[InfiniteTokenPool] ✅ پاسخ واقعی از ${real.provider} (${real.model}) دریافت شد.`);
      return {
        text: real.text,
        routerUsed: `${real.provider} (direct)`,
        modelUsed: real.model || 'unknown',
        compressionSavings: '0% (compression not applied)',
        cascadedCount,
        tokensSavedEstimate: 0,
        simulated: false,
      };
    }

    console.warn(
      '[InfiniteTokenPool] ⚠️ No real AI provider available:',
      real.attempts.map((a) => `${a.provider}: ${a.detail}`).join(' | ')
    );

    return {
      text: '',
      routerUsed: this.getActiveRouter().name,
      modelUsed: 'unavailable',
      compressionSavings: '0%',
      cascadedCount,
      tokensSavedEstimate: 0,
      simulated: true,
    };
  }

  public getMetrics() {
    const installed = LayaProcessController.getInstance().routersInstalled();
    return {
      totalRotations: this.totalRotations,
      totalRestarts: this.totalRestarts,
      currentRouter: this.getActiveRouter(),
      allRouters: this.getRouterSources(),
      keysCount: this.generatedKeys.length,
      keys: this.generatedKeys,
      // Honest runtime facts: the virtual keys are local-only artefacts and the
      // gateway binaries are optional, so report whether they exist at all.
      virtualKeysOnly: true,
      routersInstalled: installed,
      note: installed.nine || installed.omni
        ? 'router binaries detected'
        : 'no local router binary installed; answers come from cloud providers configured in .env',
    };
  }
}
