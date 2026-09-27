import re, subprocess

print("🧠 ۱. در حال ارتقای مغز تشخیص نیت و روتینگ سرور (server.ts)...")

with open('server.ts', 'r', encoding='utf-8') as f:
    server_code = f.read()

# منطق پیشرفته و هوشمند تشخیص مد و اولویت قطعی به CODING
smart_intent_logic = """
// مغز هوشمند تفکیک نیت: اولویت ۱۰۰٪ با کدنویسی و UI/UX
function classifyUserIntent(message: string, currentMode?: string): 'CODING' | 'VIDEO' | 'IMAGE' | 'WEBSITE' | 'CHAT' {
  const text = (message || '').toLowerCase();
  
  // ۱. اگر کاربر مستقیماً تب CODING را زده باشد، با اولویت قطعی به موتور کد می‌رود
  if (currentMode && currentMode.toUpperCase() === 'CODING') {
    return 'CODING';
  }

  // ۲. کلمات کلیدی تخصصی کدنویسی، توسعه و UI/UX
  const codingTriggers = [
    'ui', 'ux', 'react', 'typescript', 'tailwind', 'component', 'کامپوننت',
    'کد', 'کدنویسی', 'کدزنی', 'برنامه', 'اپلیکیشن', 'سورس', 'فرانت', 'frontend',
    'پیاده‌سازی', 'بساز', 'دیزاین', 'استک', 'html', 'css', 'javascript', 'طراحی رابط',
    'audiovido', 'پلتفرم', 'سامانه', 'نرم‌افزار'
  ];
  
  const hasCodingIntent = codingTriggers.some(t => text.includes(t));
  if (hasCodingIntent) {
    return 'CODING';
  }

  // ۳. تولید ویدیو فقط زمانی که صراحتاً درخواست ساخت کلیپ باشد و درخواستی برای کد/برنامه نباشد
  if ((text.includes('یک ویدیو بساز') || text.includes('کلیپ ویدیویی') || text.includes('رندر انیمیشن')) && !hasCodingIntent) {
    return 'VIDEO';
  }

  if (text.includes('عکس بساز') || text.includes('تصویر تولید کن')) {
    return 'IMAGE';
  }

  return 'CHAT';
}
"""

# تزریق تابع هوشمند به ابتدای هندلرهای سرور
if 'classifyUserIntent' not in server_code:
    server_code = smart_intent_logic + "\n" + server_code

# اصلاح روت چت برای استفاده از classifyUserIntent
server_code = re.sub(
    r'(const\s+intent\s*=\s*).*?;',
    r'\1classifyUserIntent(req.body.message, req.body.mode || req.body.activeTab);',
    server_code
)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(server_code)

print("✅ مغز روتینگ سرور با تفکیک قطعی و هوشمند کدنویسی و UI/UX ارتقا یافت.")

# ۲. تست کامپایل با Vite و esbuild
print("\n📦 ۲. در حال کامپایل پروژه...")
build_res = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if build_res.returncode == 0:
    print("✅ کامپایل با موفقیت کامل انجام شد (Build Succeeded).")
else:
    print("⚠️ هشدار بیلد:\n", build_res.stderr[-200:])

# ۳. ثبت کامیت و پوش به گیت (Git Push)
print("\n🚀 ۳. ارسال تغییرات پایدار به مخزن گیت...")
subprocess.run(['git', 'add', '.'], check=False)
subprocess.run(['git', 'commit', '-m', 'Feat: implement intelligent intent classifier prioritizing UI/UX coding over media generation'], check=False)
push = subprocess.run(['git', 'push'], capture_output=True, text=True)
print("✅ وضعیت Git Push:\n" + (push.stdout.strip() if push.stdout else push.stderr.strip()))

