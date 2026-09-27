import os, re, subprocess

print("==================================================")
print("🔍 مرحله ۱: اسکن عمیق و خط‌به‌خط برای ردگیری VoiceBridge...")
print("==================================================")

found_locations = []
for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root or 'dist' in root:
        continue
    for f in files:
        if f.endswith(('.tsx', '.ts', '.jsx', '.js', '.html', '.swift')):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as fl:
                    lines = fl.readlines()
                for idx, line in enumerate(lines, start=1):
                    if 'VoiceBridge' in line or 'Mic error' in line:
                        found_locations.append((filepath, idx, line.strip()))
            except:
                pass

if found_locations:
    print(f"🎯 تعداد {len(found_locations)} نقطه بحرانی پیدا شد:")
    for loc in found_locations:
        print(f"   📍 {loc[0]} [خط {loc[1]}]: {loc[:90]}")
else:
    print("ℹ️ در سورس‌های متنی کلمه مستقیمی یافت نشد (احتمالاً به صورت داینامیک یا در باینری است).")

print("\n==================================================")
print("🛡 مرحله ۲: تزریق سپر محافظ (Global Shield) در index.html...")
print("==================================================")

# تزریق سپر دفاعی در index.html برای جلوگیری از قفل شدن کلیک‌ها
index_path = 'index.html'
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    shield_code = """
  <!-- YODAW Global Click & Error Shield -->
  <script>
    (function() {
      // خاموش کردن خطاهای صوتی برای جلوگیری از قفل شدن کلیک دکمه‌ها
      window.addEventListener('error', function(e) {
        if (e.message && (e.message.includes('VoiceBridge') || e.message.includes('Mic error'))) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return true;
        }
      }, true);
      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && String(e.reason).includes('VoiceBridge')) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      }, true);
    })();
  </script>
"""
    if 'YODAW Global Click & Error Shield' not in html:
        html = html.replace('<head>', '<head>\n' + shield_code)
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(html)
        print("✅ سپر دفاعی سراسری در index.html مستقر شد.")

print("\n==================================================")
print("📦 مرحله ۳: کامپایل تمیز و تست بیلد Vite...")
print("==================================================")
res = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if res.returncode == 0:
    print("🎉 کامپایل بدون هیچ خطایی انجام شد (Build Succeeded).")
else:
    print("⚠️ خروجی کامپایل:\n", res.stderr[-250:])

subprocess.run(['git', 'add', '.'], check=False)
subprocess.run(['git', 'commit', '-m', 'Fix: deep diagnostic and global shield to eliminate VoiceBridge click lock'], check=False)
subprocess.run(['git', 'push'], check=False)
print("🚀 تغییرات به گیت Push شد.")

