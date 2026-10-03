# 🏃 اجرای Codgar روی سیستم خودتان (تست دستی)

> نسخه‌ی اصلاح‌شده روی برنچ `arena/01a10351-codgar-final-1` است (PR #1).
> موتور اصلی = **سه روتر پس‌زمینه**. هیچ کلید Gemini/Anthropic لازم نیست.

---

## ۱) گرفتن کد

اگر مخزن را دارید:

```bash
cd ~/مسیر/Codgar-Final-1
git fetch origin
git checkout arena/01a10351-codgar-final-1
git pull origin arena/01a10351-codgar-final-1
```

اگر از صفر می‌خواهید:

```bash
git clone https://github.com/audiovido/Codgar-Final-1.git
cd Codgar-Final-1
git checkout arena/01a10351-codgar-final-1
```

---

## ۲) نصب پکیج‌ها

```bash
npm install --legacy-peer-deps
```

اگر مثل سندباکس به خطای گواهی `sharp` / `libvips` خوردید:

```bash
npm install --legacy-peer-deps --ignore-scripts
```

(پکیج `sharp` فقط برای `@xenova/transformers` است و مسیر چت/روترها به آن کاری ندارد.)

---

## ۳) تنظیم `.env`

```bash
cp .env.example .env
```

**اگر روترها را خودتان با همان پورت‌های پیش‌فرض اجرا می‌کنید، لازم نیست چیزی بنویسید.**
فقط اگر پورت/هاست فرق دارد:

```env
NINEROUTER_URL=http://127.0.0.1:20128
OMNIROUTE_URL=http://127.0.0.1:20130
VANSROUTER_URL=http://127.0.0.1:20132
# یا فقط پورت:   NINEROUTER_PORT=20128 ...
# اگر روترها احراز هویت می‌خواهند:
NINEROUTER_API_KEY=...
# مدلی که به روتر فرستاده می‌شود (پیش‌فرض codgar-code)
CODGAR_ROUTER_MODEL=codgar-code
# اگر نمی‌خواهید سرور خودش روترها را استارت کند:
CODGAR_AUTOSTART_ROUTERS=0
```

امنیت (اگر روی شبکه/تانل بالا می‌آورید):

```env
BIND_HOST=127.0.0.1          # یا 0.0.0.0 + ADMIN_TOKEN
ADMIN_TOKEN=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
CODGAR_PIN=یک‌پین‌دلخواه
```

---

## ۴) اجرای روترها (اگر خودتان جدا اجرا می‌کنید)

```bash
9router    -p 20128 -H 127.0.0.1 -n --skip-update
omniroute  --port 20130 -H 127.0.0.1
vansrouter -p 20132 -H 127.0.0.1 -n --skip-update
```

اگر باینری‌ها در PATH نصب باشند، **سرور خودش هنگام بوت استارتشان می‌کند** و این مرحله لازم نیست.

---

## ۵) بالا آوردن سرور

```bash
npm run dev          # tsx server.ts  (پورت 3000)
# یا روی پورت دیگر:
PORT=3100 npm run dev
```

لاگ موفق باید این باشد:

```
CODGAR Server running on http://0.0.0.0:3000
[ai] mode=real | engine=local-routers-first | routers=online | cloud-fallback=off
```

اگر نوشت `routers=offline` یعنی هیچ‌کدام از سه روتر جواب نداده‌اند → مرحله ۴ یا `*_URL` در `.env`.

---

## ۶) چک‌لیست تست دستی

```bash
# وضعیت موتور
curl -s localhost:3000/api/health | jq '{engine, routersOnline, aiMode, cloudFallbackConfigured}'
# انتظار: engine=local-routers-first, routersOnline=true, aiMode=real

# چت واقعی از روتر
curl -s -i -XPOST localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"یک تابع پایتون برای فیبوناچی بنویس"}' | head -30
# انتظار: HTTP 200 + هدر  X-Codgar-Provider: local-routers

# توپولوژی روترها (probe واقعی، نه کاتالوگ ثابت)
curl -s localhost:3000/api/router/topology | jq '.status, [.providers[] | {id, reachable, baseUrl}]'

# کاسکید (باگ C1: قبلاً سرور را می‌کشت)
for i in 1 2 3 4 5; do curl -s -o /dev/null -w "%{http_code} " -XPOST localhost:3000/api/pool/cascade \
  -H 'Content-Type: application/json' -d '{}'; done; echo
curl -s -o /dev/null -w "health=%{http_code}\n" localhost:3000/api/health
# انتظار: 200 200 200 200 200  health=200  (سرور زنده)

# امنیت: اجرای فرمان از مبدأ بیگانه باید رد شود
curl -s -XPOST localhost:3000/api/mcp/shell -H 'Content-Type: application/json' \
  -H 'Origin: http://evil.example' -d '{"command":"id"}'
# انتظار: 403 ORIGIN_NOT_ALLOWED

# حالت خاموش بودن روترها (روترها را ببندید و دوباره بزنید)
curl -s -XPOST localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"message":"سلام"}' | jq .error
# انتظار: "NO_ROUTER_AVAILABLE"  (نه پاسخ جعلی)
```

رابط کاربری: مرورگر → <http://localhost:3000>

---

## ۷) تست‌های خودکار و بیلد

```bash
npm run lint    # tsc --noEmit  → بدون خطا
npm test        # 27 تست → همه سبز (حدود ۵ ثانیه)
npm run build   # dist/index.html + dist/server.cjs
npm start       # اجرای نسخه build شده
```

`tests/routers.test.mjs` دقیقاً همین قرارداد را اثبات می‌کند: یک روتر محلی بالا می‌آید،
**هیچ کلید ابری تنظیم نمی‌شود** و پاسخ `/api/chat` عیناً از همان روتر می‌آید.

---

## ۸) اگر مشکلی دید

| نشانه | علت / راه‌حل |
|-------|---------------|
| `routers=offline` در لاگ | روترها بالا نیستند یا پورتشان فرق دارد → `*_URL` در `.env` |
| `503 NO_ROUTER_AVAILABLE` | همان مورد بالا؛ پیام خطا خودش دستور اجرای روترها را می‌دهد |
| `EADDRINUSE` روی ۳۰۰۰ | `PORT=3100 npm run dev` |
| `403 Blocked request` در Vite | دامنه‌تان را به `ALLOWED_HOSTS` در `.env` اضافه کنید |
| `403 ORIGIN_NOT_ALLOWED` از کلاینت خودتان | `ALLOWED_ORIGINS=https://my-ui.example` یا هدر `X-Admin-Token` |
| خطای نصب `sharp` | `npm install --legacy-peer-deps --ignore-scripts` |
| جواب چت «جعلی» به نظر رسید | هدر `X-Codgar-Provider` را ببینید؛ باید `local-routers` باشد. `demo:true` یعنی `CODGAR_DEMO_MODE=1` روشن است |

---

## ۹) یادآوری امنیتی (هنوز کار شماست)

کلید `sk-1b85c23a…4bc8de92` که در کد لو رفته بود حذف شد، ولی **باید در پنل ارائه‌دهنده باطل (rotate) شود**
و اگر در تاریخچه‌ی Git ریموت هست، با `git filter-repo` پاک شود. جزئیات در `FIXES_FA.md` بخش ۴.
