# گزارش اصلاحات پروژه کدگر (Codgar AI)

**تاریخ:** ۲۰۲۶-۱۰-۰۳ · **مبنا:** گزارش تست و بررسی `petros-os` (کامیت `299c1768`)
**وضعیت پس از اصلاح:** `npm run lint` ✅ بدون خطا · `npm run build` ✅ · `npm test` ✅ ۲۴/۲۴ تست

> هدف این پاس اصلاح، رفع باگ‌های بحرانی و «صادق‌سازی» رفتار سرور بوده است، **بدون تغییر معماری**:
> همان Express + Vite، همان `InfiniteTokenPool`، همان کلاس‌های Laya، همان روترها و همان قراردادهای
> API برای فرانت‌اند حفظ شده‌اند. هیچ اندپوینتی حذف نشد و شکلی از پاسخ‌ها که UI به آن وابسته است تغییر نکرده
> (فقط فیلدهای `demo`/`simulated`/`virtual` اضافه شده‌اند).

---

## ۱) خلاصه مدیریتی

| # | موضوع گزارش | شدت | وضعیت در این پاس |
|---|-------------|-----|------------------|
| C1 | کرش کل سرور با ۳ بار `/api/pool/cascade` (spawn ENOENT بدون error handler) | 🔴 | ✅ **رفع شد** + تست رگرسیون |
| C2 | لو رفتن کلید API در کد | 🔴 | ✅ کلید و اسکریپت‌های حاوی آن حذف شدند + CI اسکنر |
| C3 | اجرای فرمان شل بدون احراز هویت + نصب خودکار از اینترنت | 🔴 | ✅ گیت توکن/هم‌مبدأ + غیرفعال‌سازی پیش‌فرض نصب خودکار |
| C4 | پاسخ‌ها و متریک‌های جعلی/قالبی | 🔴 | ✅ مسیر واقعی (Gemini/Anthropic/روتر محلی) + خطای صادقانه ۵۰۱ |
| H1 | پورت هاردکد ۳۰۰۰ و `.env` بی‌اثر | 🟠 | ✅ `PORT`/`BIND_HOST` از env + هندل `EADDRINUSE` |
| H2 | `node_modules` در تاریخچه Git | 🟠 | ⚠️ در working tree نیست؛ پاک‌سازی تاریخچه دستور دارد (بخش ۴) |
| H3 | ایمیل شخصی هاردکد در اینباکس جعلی | 🟠 | ✅ همه ارجاع‌ها به `operator@example.com` / `GMAIL_USER` تغییر کرد |
| H4 | افکت جانبی `GET /api/router/topology` روی `~/AudioVido` | 🟠 | ✅ کل بلوک حذف شد؛ اندپوینت فقط خواندنی شد |
| H5 | اندپوینت‌های گمشده + مانت اشتباه yadow روی `/api/api/...` | 🟠 | ✅ هر ۵ مسیر اضافه/اصلاح شد |
| H6 | اسکریپت‌های inline در `index.html` | 🟠 | 🟡 «خفه‌کردن خطاها» حذف شد؛ پورت کامل به React به‌عنوان گام بعدی مستند شد |
| H7 | بدون CORS/CSRF، بدنه ۵۰MB | 🟠 | ✅ CORS کنترل‌شده + گارد Origin/CSRF + کاهش محدودیت بدنه |
| M1 | `curl … \| sudo bash` در نصب‌کننده | 🟡 | ✅ نیازمند رضایت صریح (`CODGAR_INSTALL_CONSENT=1` یا تأیید تعاملی) |
| M2 | پیش‌فرض ضعیف PIN و افشای آن | 🟡 | ✅ PIN از `CODGAR_PIN`، دیگر در هیچ پاسخی برنمی‌گردد |
| M3 | بلاک شدن دامنه مهمان در Vite | 🟡 | ✅ `allowedHosts` برای `.local`/`.e2b.app`/تانل‌ها |
| M4 | وابستگی به CDNهای بیرونی | 🟡 | ⏳ نیازمند تصمیم محصولی (بخش ۵) |
| M5 | ۱۵ اسکریپت پچ‌کننده در ریشه | 🟡 | ✅ همه حذف شدند (به همراه فایل‌های `.bak`) |
| M6 | صفر تست واقعی | 🟡 | ✅ ۲۴ تست یکپارچه + workflow گیت‌هاب |
| L* | عدم LICENSE، برند باقی‌مانده، آشغال‌ریزی ریشه | ⚪ | ✅ بخشی (آشغال‌ها حذف شد) · ⏳ LICENSE (بخش ۵) |

---

## ۲) جزئیات فنی تغییرات

### C1 — کرش سرور (مهم‌ترین اصلاح)

**ریشه:** `spawn('9router' | 'omniroute' | '/usr/local/bin/vansrouter')` بدون listener خطا. نبودن باینری
⇒ رویداد `error` بدون شنونده ⇒ `uncaughtException` ⇒ مرگ پروسه (`node:events:502`).
`infiniteTokenPool.cascadeToNextRouter()` هم Promise را بدون `await`/`catch` صدا می‌زد.

**تغییرات:**
- ماژول جدید `server/routerBinary.ts`:
  `resolveRouterBinary()` باینری را در `~/.local/bin`, `/usr/local/bin`, `/opt/homebrew/bin`, … و `which`
  جست‌وجو می‌کند و `spawnRouterDetached()` همیشه `proc.on('error', …)` را ثبت می‌کند.
- هر چهار نقطه‌ی spawn اصلاح شد: `layaProcessController`, `layaSupervisor`, `layaAutonomousEngine`,
  `routerDaemonManager` (وضعیت `not-installed` جای «Mock/emulated mode»).
- `cleanPort()` دیگر به `lsof` وابسته نیست (fallback به `fuser`، و در نبود هر دو فقط لاگ می‌کند).
- در `infiniteTokenPool.cascadeToNextRouter()`:
  `void this.restartAndRefreshRouters().catch(err => console.warn(...))`.
- تور سراسری در ابتدای `server.ts`: `installProcessGuards()` روی `uncaughtException` و
  `unhandledRejection` لاگ می‌گیرد و پروسه را زنده نگه می‌دارد.

**تست:** `tests/api.test.mjs` ⇒ ۵ بار `/api/pool/cascade` و سپس `/api/health` → همیشه `200`.

### C2 — کلید لو رفته

- کلید از `server.ts` (دو نقطه)، `server/layaAutonomousEngine.ts` و اسکریپت‌های `scripts/*.cjs` حذف شد.
  جای آن‌ها: `NINEROUTER_API_KEY` / `LAYA_ROUTER_API_KEY` از محیط.
- فایل‌های آلوده و پچ‌کننده حذف شدند: `scripts/wire_real_voice.cjs`, `scripts/add_voice_endpoints.cjs`,
  `scripts/*_patch*.cjs`, `scripts/clean_image.py`, ۱۳ اسکریپت `.py` ریشه، `server.ts.bak`,
  `server.ts.laya_bak`, `server/infiniteTokenPool.ts.bak`, `server/routersRegistry.ts.laya_bak`.
- `tests/repo-hygiene.test.mjs` هر push را برای این کلید و هر رشته `sk-...` هاردکد در سرور اسکن می‌کند.
- ⚠️ **کاری که فقط شما می‌توانید انجام دهید:** کلید `sk-1b85c23a…` را در سمت ارائه‌دهنده revoke/rotate کنید و
  تاریخچه Git را پاک کنید (بخش ۴). حذف از کد، کلید را بی‌اعتبار نمی‌کند.

### C3 — اجرای فرمان و نصب خودکار

- ماژول جدید `server/httpSecurity.ts` با middlewareهای:
  `corsMiddleware` → `originGuard` → `requireJsonBody` → `execRouteGuard`.
- فهرست «مسیرهای خطرناک» (اجرای کد/نوشتن فایل): `mcp/shell|action`, `terminal/*`, `sandbox/*`,
  `compiler/execute|install-tool`, `local-bridge/*`, `router/install-package`, `fs/write|delete|move`,
  `files/content`, `git/commit|push`, `claude/terminal`, `projects/create-test`, `keys/*`.
- دسترسی به این مسیرها فقط برای: (الف) درخواست هم‌مبدأ مرورگر، (ب) کلاینت loopback،
  (ج) هدر معتبر `X-Admin-Token` (یا `Authorization: Bearer`). `CODGAR_STRICT_EXEC_TOKEN=1`
  توکن را حتی برای لوکال الزامی می‌کند.
- درخواست‌های `Sec-Fetch-Site: cross-site` و Originهای ناشناس در همه‌ی متدهای تغییردهنده با **403** رد می‌شوند.
- بدنه‌ی JSON از `50mb` به `10mb` (و صوت به `25mb`) کاهش یافت؛ روی مسیرهای خطرناک فقط
  `application/json` (یا صوت/multipart) پذیرفته می‌شود.
- نصب خودکار ابزار (`curl … | bash`) در `server/universalCompiler.ts` پیش‌فرض **خاموش** شد و فقط با
  `ALLOW_AUTO_INSTALL=1` کار می‌کند.
- لاگ هشدار در استارت‌آپ وقتی روی `0.0.0.0` بایند می‌شود و `ADMIN_TOKEN` ندارد.

### C4 — پایان دادن به پاسخ‌ها و متریک‌های جعلی

- ماژول جدید `server/aiProviders.ts`: زنجیره‌ی واقعی Gemini (کلید `GEMINI_API_KEY`) →
  Anthropic (`ANTHROPIC_API_KEY`) → روترهای محلی با probe واقعی `/v1/models` روی پورت‌های
  20128/20130/20132. هیچ‌جا متن ساختگی تولید نمی‌شود؛ نتیجه یا از مدل است یا `ok:false`.
- middleware کلیدواژه‌ای `server.ts` (پاسخ‌های از پیش نوشته‌شده برای «سایت/کامپوننت/…») فقط در
  `CODGAR_DEMO_MODE=1` فعال است و پاسخ‌ها فیلد `demo: true` دارند.
- `infineTokenPool.executeWithInfiniteCascade`:
  بلوک مرده‌ی `if (false) { … }` و ~۳۳۰۰ خط مولد پاسخ ساختگی حذف شد (فایل از ۳۸۱۰ به ~۵۶۰ خط رسید).
  حالا: مسیر واقعی `KeyManager` (Gemini) → `aiProviders` → و در نهایت `text: ''` و `simulated: true`.
- `handleAgentChat`: ترتیب واقعی ⇒ مدل واقعی → Claude CLI (در صورت وجود) → **در نبود ارائه‌دهنده:
  `501 { error: 'NO_PROVIDER_CONFIGURED' }`** به‌جای پاسخ قالبی. هدر `X-Codgar-Mode: real|demo|none`
  روی همه‌ی پاسخ‌ها ست می‌شود.
- متریک‌های ثابت حذف شدند: `compressionSavings` جعلی (۳۸٪/۴۲٪/۸۹٪) و `tokensSavedEstimate: 420`
  جای خود را به «اندازه‌گیری‌نشده/۰» دادند.
- `comprehensiveTestRunner`: پاسخ فیلد `simulated: true` و `overallStatus` واقعی دارد؛
  `Math.random()` حذف شد و زمان‌ها واقعی‌اند؛ متن verdict صریحاً می‌گوید «تست کامپایل محلی است و هیچ
  درخواستی به مدل ارسال نشده».
- `gaifRouter.installPackageSuite()` دیگر «نصب موفق» جعلی نمی‌سازد؛ فقط وجود باینری‌ها را probe می‌کند و
  `installedPackages`/`missingPackages` واقعی برمی‌گرداند.
- `/api/keys/*`: کلیدهای مجازی با `virtual: true` علامت‌گذاری شدند، دیگر PIN در پاسخ‌ها/لاگ‌ها نیست و
  مقدار PIN از `CODGAR_PIN` می‌آید.
- `/api/router/topology`: کاتالوگ ایستا دیگر «active» گزارش نمی‌شود؛ `status: 'unverified'` +
  `declaredStatus` + `providers` حاصل probe واقعی.
- `/api/mcp/ping`: تأخیر واقعی اندازه‌گیری می‌شود (`measured: true`)؛ مسیرهای ناشناخته‌ی MCP به‌جای
  «100% OPERATIONAL» پاسخ **501 MCP_ROUTE_NOT_IMPLEMENTED** می‌دهند.

### H1 / H4 / H5 / H7

- `PORT` و `BIND_HOST` از env خوانده می‌شوند؛ خطای `EADDRINUSE` پیام راهنما می‌دهد.
- بلوک ~۲۸۰ خطی «AudioVido Synthesizer» داخل `GET /api/router/topology` که در `~/AudioVido` فایل و
  مخزن Git می‌ساخت، کامل حذف شد.
- اندپوینت‌های اضافه‌شده: `/api/terminal/execute` (alias), `/api/transcribe` (واقعی: 9Router‑Whisper یا
  Gemini inline-audio، در نبود سرویس ⇒ 501 صادقانه), `/api/files/content`,
  `/api/project/timeline/decompose`, `/api/project/timeline/execute` (task واقعی در `AgentRuntime` ثبت می‌کند).
- `createYadowRouter()` که خودش مسیرهای `/api/...` را تعریف می‌کند از روی `/api` برداشته و روی ریشه
  mount شد؛ `/api/api/status` دیگر وجود ندارد.
- هندلر تکراری و غیرقابل‌دسترس `/api/chat` در انتهای `server.ts` (که کلید هاردکد داشت) حذف شد.

### M1 / M2 / M3 / M5 / M6

- `install.sh` قبل از هر `curl | sudo bash` رضایت صریح می‌گیرد (`CODGAR_INSTALL_CONSENT=1` برای حالت
  خودکار).
- `.env.example` بازنویسی شد: `GEMINI_API_KEY`, `ANTHROPIC_API_KEY`, `ADMIN_TOKEN`, `ALLOWED_ORIGINS`,
  `CODGAR_DEMO_MODE`, `ALLOW_AUTO_INSTALL`, `CODGAR_PIN`, `PORT`, `BIND_HOST`, …
- `vite.config.ts` ⇒ `allowedHosts` برای `localhost`, `.local`, `.e2b.app`, تانل‌ها و `ALLOWED_HOSTS`.
- همه‌ی اسکریپت‌های پچ‌کننده و فایل‌های پشتیبان حذف شدند (بخش C2).
- تست و CI: `tests/api.test.mjs` (۱۹ تست یکپارچه روی سرور واقعی) + `tests/repo-hygiene.test.mjs`
  (۵ تست امنیتی/بهداشتی) + `.github/workflows/ci.yml` با مراحل
  `npm ci → npm run lint → npm run build → npm test`.

### H6 (جزئی)

- در `index.html` بلوکی که با `stopImmediatePropagation()` تمام خطاها و rejectionها را می‌خورد حذف و به
  یک لاگر ساده تبدیل شد (خطاها دیگر پنهان نمی‌شوند). سایر اسکریپت‌های inline (هندل کلیک دکمه‌ها با
  متن، `setInterval(renderAIImages, 500)`، `innerHTML` بدون escape در خطوط ۵۶۷/۵۹۲/۸۵۶/۹۰۴/۹۰۶)
  دست‌نخورده ماندند تا رفتار UI تغییر نکند؛ پیشنهاد مشخص برای گام بعدی در بخش ۵ آمده است.

---

## ۳) صحت‌سنجی (تست‌های انجام‌شده)

```bash
npm run lint      # tsc --noEmit  → بدون خطا (۶۰ خطای تایپ موجود هم رفع شد)
npm run build     # vite build + esbuild → موفق
npm test          # 24/24 pass (19 یکپارچه + 5 بهداشتی)
```

بازتولید دستی روی سرور در حال اجرا (`PORT=3000`):

```bash
# ۱) کرش سابق (سرور می‌مرد)
for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{http_code} " -XPOST localhost:3000/api/pool/cascade \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' -d '{}'; done
curl -s -o /dev/null -w "\nhealth: %{http_code}\n" localhost:3000/api/health      # → 200 200 200 200 200، health: 200

# ۲) اجرای فرمان از سایت دیگر (CSRF/RCE)
curl -s -XPOST localhost:3000/api/mcp/shell -H 'Content-Type: application/json' \
  -H 'Origin: https://evil.example.com' -H 'Sec-Fetch-Site: cross-site' -d '{"command":"id"}'
# → {"success":false,"error":"ORIGIN_NOT_ALLOWED", ...}

# ۳) همان درخواست از مبدأ خود سرور (UI) هنوز کار می‌کند
curl -s -XPOST localhost:3000/api/mcp/shell -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:3000' -d '{"command":"id"}'
# → {"status":"ok","success":true,"output":"[local_pc] $ id\nuid=..."}

# ۴) پاسخ جعلی هوش مصنوعی (قبلاً در ۱.۵ms پاسخ ثابت می‌داد)
curl -s -XPOST localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"message":"build a todo app in react"}'
# → 501 {"error":"NO_PROVIDER_CONFIGURED", ...}

# ۵) گزارش تست ساختگی
curl -s -XPOST localhost:3000/api/router/comprehensive-test -H 'Content-Type: application/json' -d '{}'
# → {"report":{"simulated":true, ...}}

# ۶) کلید لو رفته
grep -rn "sk-1b85c23a61dee238" . --exclude-dir=node_modules --exclude-dir=.git   # → خروجی خالی
```

---

## ۴) کارهایی که باید خودتان انجام دهید

1. **Rotate کلید:** کلید `sk-1b85c23a…4bc8de92` را در پنل ارائه‌دهنده باطل کنید
   (حذف از کد، فاش‌شدن را جبران نمی‌کند). سپس در `.env` مقدار جدید را در `NINEROUTER_API_KEY` بگذارید.
2. **پاک‌سازی تاریخچه Git** (چون کلید در کامیت‌های قبلی هم وجود دارد):

   ```bash
   # روش پیشنهادی: افشای متن + پاک‌سازی
   pip install git-filter-repo
   git filter-repo --replace-text <(echo 'sk-1b85c23a…4bc8de92==>REMOVED')
   git push --force --all && git push --force --tags
   ```
   یا اگر تاریخچه ارزشی ندارد، مخزن را با یک کامیت تازه بسازید (همزمان مشکل `node_modules` در
   تاریخچه/حجم مخزن هم حل می‌شود). روی GitHub هم **Secret scanning / push protection** را فعال کنید.
3. **تنظیم `ADMIN_TOKEN`** اگر سرور را روی شبکه/تانل اجرا می‌کنید و **`CODGAR_PIN`** برای کلیدهای مجازی.
4. برای پاسخ واقعی هوش مصنوعی: `GEMINI_API_KEY` یا `ANTHROPIC_API_KEY` را در `.env` بگذارید.

---

## ۵) گام‌های پیشنهادی بعدی (خارج از این پاس)

1. **H6 کامل:** انتقال منطق inlineهای `index.html` به کامپوننت‌های React:
   - حذف هندل «متن دکمه» (خطوط ۴۵-۱۰۰ و ۲۰۰-۲۳۰) و استفاده از `onClick` کامپوننت‌ها.
   - حذف `setInterval(renderAIImages, 500)` و رندر داده‌محور در React.
   - جایگزینی `innerHTML` با `textContent`/`createElement` (خطوط ۵۶۷، ۵۹۲، ۸۵۶، ۹۰۴، ۹۰۶).
2. **M4:** حذف وابستگی به CDNها (`cdn.tailwindcss.com`, `fonts.googleapis.com`, `cdnjs`) با بسته‌بندی
   محلی (Tailwind از قبل در پروژه هست) تا UI آفلاین هم درست باشد.
3. **متادیتا:** افزودن `LICENSE`، حذف `ios/`, `mac-app/`, `apps/`, `test-project/`, `projects/` اگر
   باقی‌مانده‌های پروژه‌های دیگر هستند، و به‌روزرسانی لینک قدیمی در `bin/codgar.js`.
4. **افزودن تست‌های بیشتر** برای `AgentRuntime`، `KeyManager` و مسیر استریم/SSE تسک‌ها.
5. **پاک‌سازی کاتالوگ ایستای روترها** (`gaifRouter.ts`) و جایگزینی آن با probe زنده در UI.
