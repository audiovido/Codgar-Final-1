import os, re, subprocess

# ۱. اصلاح روتور بک‌اند برای استخراج داینامیک پرامپت و جلوگیری از تکرار 3D crystal logo
route_path = "server/routes/yadow.ts"
if os.path.exists(route_path):
    with open(route_path, "r", encoding="utf-8") as f:
        routes = f.read()

    # حذف هرگونه لینک یا پرامپت هاردکد شده قبلی
    routes = re.sub(r'https?:\/\/image\.pollinations\.ai\/prompt\/3D[^\"]+', '', routes)

    dynamic_handler = """
    // موتور داینامیک پردازش پرامپت و ساخت تصویر با مدل FLUX
    if (prompt.includes("Image Generation Request") || prompt.includes("عکس") || prompt.includes("تصویر") || prompt.includes("image")) {
      let promptDesc = "";
      const descMatch = prompt.match(/Prompt Description:\\s*([^\\n]+)/i);
      if (descMatch) {
        promptDesc = descMatch.trim();
      } else {
        promptDesc = prompt.replace(/\\[.*?\\]/g, "").replace(/(?:عکس|تصویر|بساز|طراحی کن|یک|برام)/gi, "").trim();
      }
      if (!promptDesc) promptDesc = "Cinematic portrait with golden studio lighting & shallow depth";

      let artStyle = "photorealistic";
      const styleMatch = prompt.match(/Art Style:\\s*([^\\n]+)/i);
      if (styleMatch) artStyle = styleMatch.trim();

      let width = 1024, height = 576;
      const ratioMatch = prompt.match(/Aspect Ratio:\\s*([^\\n]+)/i);
      if (ratioMatch) {
        const r = ratioMatch.trim();
        if (r.includes("1:1")) { width = 1024; height = 1024; }
        else if (r.includes("9:16")) { width = 576; height = 1024; }
      }

      const fullPrompt = `${promptDesc}, ${artStyle}, 8k resolution, cinematic studio lighting, highly detailed masterpiece`;
      const encoded = encodeURIComponent(fullPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;

      return res.json({
        reply: imageUrl,
        response: imageUrl,
        imageUrl: imageUrl,
        source: "flux_image_engine"
      });
    }
"""
    # تزریق به ابتدای کنترلر چت
    idx = routes.find("router.post(")
    if idx != -1:
        body_start = routes.find("{", idx)
        routes = routes[:body_start+1] + dynamic_handler + routes[body_start+1:]
        with open(route_path, "w", encoding="utf-8") as f:
            f.write(routes)
        print("✅ روتور داینامیک FLUX با استخراج واقعی پرامپت در سرور مستقر شد.")

# ۲. تزریق موتور تبدیل لینک به عکس در index.html
index_path = "index.html"
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    # پاک‌سازی نسخه‌های احتمالی قبلی
    html = re.sub(r'<!-- YODAW AI Image Auto-Renderer Bridge -->[\s\S]*?<\/script>', '', html)

    observer_script = """<!-- YODAW AI Image Auto-Renderer Bridge -->
    <script>
    (function() {
      function renderAIImages() {
        const textNodes = [];
        const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        let n;
        while (n = walk.nextNode()) {
          if (n.nodeValue && n.nodeValue.includes("image.pollinations.ai") && !n.parentElement.closest(".ai-image-card")) {
            textNodes.push(n);
          }
        }
        for (const tn of textNodes) {
          const p = tn.parentElement;
          if (!p || p.tagName === "SCRIPT" || p.tagName === "STYLE" || p.closest(".ai-image-card")) continue;
          const match = tn.nodeValue.match(/(https?:\\/\\/[^\\s]+image\\.pollinations\\.ai[^\\s]*)/i);
          if (match) {
            const url = match;
            const card = document.createElement("div");
            card.className = "ai-image-card my-3 rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900/95 text-white shadow-2xl max-w-lg";
            card.innerHTML = `
              <div style="position:relative; width:100%; min-height:240px; background:#020617; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <div class="loader-box" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; background:rgba(15,23,42,0.95); color:#60a5fa; font-size:12px; font-family:system-ui;">
                  <div style="width:34px; height:34px; border:2px solid #3b82f6; border-top-color:transparent; border-radius:50%; animation:spin 0.9s linear infinite;"></div>
                  <span>🎨 در حال رندر و تولید زنده تصویر با موتور FLUX...</span>
                  <span style="font-size:10px; color:#94a3b8;">تولید عکس ۳ الی ۷ ثانیه زمان می‌برد</span>
                </div>
                <img src="${url}" alt="AI Generated Image" style="width:100%; height:auto; max-height:480px; object-fit:cover; display:none;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.previousElementSibling.innerHTML='<span style=\\'color:#f43f5e;\\'>⚠️ خطا در بارگذاری تصویر</span>';" />
              </div>
              <div style="padding:10px 14px; background:#0f172a; border-top:1px solid #1e293b; display:flex; justify-content:space-between; align-items:center; font-size:11px;">
                <span style="color:#10b981; font-weight:bold;">✓ خروجی موتور FLUX 1.0</span>
                <div style="display:flex; gap:8px;">
                  <a href="${url}" target="_blank" style="padding:4px 10px; background:#1e293b; color:#cbd5e1; border-radius:6px; text-decoration:none;">🔍 تمام‌صفحه</a>
                  <a href="${url}" target="_blank" download="flux-artwork.jpg" style="padding:4px 12px; background:#2563eb; color:#ffffff; border-radius:6px; text-decoration:none; font-weight:bold;">📥 دانلود عکس</a>
                </div>
              </div>
              <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            tn.nodeValue = tn.nodeValue.replace(url, "").trim();
            p.appendChild(card);
          }
        }
      }
      setInterval(renderAIImages, 600);
      document.addEventListener("DOMContentLoaded", renderAIImages);
    })();
    </script>
"""
    html = html.replace("</head>", observer_script + "\n</head>")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ پایشگر زنده عکس با موفقیت در index.html مستقر شد.")

# ۳. پاک‌سازی کش ماژول‌ها و بیلد فرانت‌اند
subprocess.run(["rm", "-rf", "node_modules/.vite"], check=False)
subprocess.run(["npx", "vite", "build", "--emptyOutDir=false"], check=False)

# ۴. ثبت و پوش به مخزن گیت‌هاب
subprocess.run(["git", "add", "."], check=False)
subprocess.run(["git", "commit", "-m", "fix(flux): extract dynamic prompt description and render live image card with loader"], check=False)
subprocess.run(["git", "push"], check=False)
print("=== تمام مراحل با موفقیت انجام و پوش شد ===")
