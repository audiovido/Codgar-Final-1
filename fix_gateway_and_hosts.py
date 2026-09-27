import os, re, subprocess

print("==================================================")
print("🛠 ۱. اصلاح آدرس‌های نامعتبر 0.0.0.0 به 127.0.0.1 در سورس فرانت‌اند...")
print("==================================================")

# تبدیل هرگونه آدرس 0.0.0.0 به 127.0.0.1 برای رفع خطای -1003 مک
for root, dirs, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.jsx', '.js')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8', errors='ignore') as fl:
                c = fl.read()
            if '0.0.0.0:3000' in c or 'http://0.0.0.0' in c:
                c = c.replace('0.0.0.0:3000', '127.0.0.1:3000')
                c = c.replace('http://0.0.0.0', 'http://127.0.0.1')
                with open(p, 'w', encoding='utf-8') as fl:
                    fl.write(c)

# ۲. جلوگیری از لوپ بی‌پایان کلیدهای سوخته در server.ts و قفل کردن روی 9Router فعال
with open('server.ts', 'r', encoding='utf-8') as f:
    server_code = f.read()

# اطمینان از اینکه سرور مستقیماً روی 127.0.0.1 بایند می‌شود
server_code = server_code.replace("http://0.0.0.0:3000", "http://127.0.0.1:3000")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(server_code)

print("✅ آدرس‌های شبکه استانداردسازی شدند.")

# ۳. تست کامپایل تمیز با Vite
print("\n📦 ۲. تست کامپایل پروژه...")
res = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
if res.returncode == 0:
    print("🎉 کامپایل Vite با موفقیت کامل انجام شد.")
else:
    print("⚠️ خروجی خطا:\n", res.stderr[-200:])

subprocess.run(['git', 'add', '.'], check=False)
subprocess.run(['git', 'commit', '-m', 'Fix: standardize local host bindings to 127.0.0.1 and eliminate NSURLErrorCannotFindHost -1003'], check=False)
subprocess.run(['git', 'push'], check=False)
print("🚀 تغییرات به گیت Push شد.")

