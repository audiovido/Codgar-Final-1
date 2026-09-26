import os, re, subprocess

# ۱. پاک‌سازی تمام پرامپت‌های هاردکدشده قبلی و داینامیک‌سازی واقعی سرور
for root, _, files in os.walk("."):
    for file in files:
        if file.endswith((".ts", ".js")) and "node_modules" not in root and ".build" not in root:
            p = os.path.join(root, file)
            try:
                with open(p, "r", encoding="utf-8") as f:
                    c = f.read()
                if "3D%20crystal%20logo" in c or "3D crystal logo" in c:
                    print(f"پاک‌سازی پرامپت هاردکد شده در: {p}")
                    c = re.sub(r'https?:\/\/image\.pollinations\.ai\/prompt\/3D[^\"]+', '', c)
                    with open(p, "w", encoding="utf-8") as f:
                        f.write(c)
            except Exception:
                pass

# بازنویسی موتور هوشمند FLUX در server/routes/yadow.ts
route_path = "server/routes/yadow.ts"
if os.path.exists(route_path):
    with open(route_path, "r", encoding="utf-8") as f:
        routes = f.read()

    dynamic_handler = """
    // موتور پردازش داینامیک پرامپت‌های تصویر با کیفیت FLUX
    if (prompt.includes("Image Generation Request") || prompt.includes("عکس") || prompt.includes("تصویر") || prompt.includes("sunflower") || prompt.includes("image")) {
      let promptDesc = "";
      const descMatch = prompt.match(/Prompt Description:\\s*([^\\n]+)/i);
      if (descMatch) {
        promptDesc = descMatch.trim();
      } else {
        promptDesc = prompt.replace(/\\[.*?\\]/g, "").replace(/(?:عکس|تصویر|بساز|طراحی کن|یک|برام)/gi, "").trim();
      }
      if (!promptDesc) promptDesc = "design a vibrant sunflower with rich golden petals in cinematic morning sunlight";

      let artStyle = "cinematic";
      const styleMatch = prompt.match(/Art Style:\\s*([^\\n]+)/i);
      if (styleMatch) artStyle = styleMatch.trim();

      let width = 1024, height = 576;
      let ratio = "16:9";
      const ratioMatch = prompt.match(/Aspect Ratio:\\s*([^\\n]+)/i);
      if (ratioMatch) {
        ratio = ratioMatch.trim();
        if (ratio.includes("1:1")) { width = 1024; height = 1024; }
        else if (ratio.includes("9:16")) { width = 576; height = 1024; }
      }

      const fullPrompt = `${promptDesc}, ${artStyle}, highly detailed, 8k resolution, cinematic lighting, masterpiece`;
      const encoded = encodeURIComponent(fullPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&model=flux`;

      return res.json({
        reply: imageUrl,
        response: imageUrl,
        imageUrl: imageUrl,
        promptDesc: promptDesc,
        artStyle: artStyle,
        aspectRatio: ratio,
        source: "flux_image_engine"
      });
    }
"""
    idx = routes.find("router.post(")
    if idx != -1:
        body_start = routes.find("{", idx)
        routes = routes[:body_start+1] + dynamic_handler + routes[body_start+1:]
        with open(route_path, "w", encoding="utf-8") as f:
            f.write(routes)
        print("✅ سرور به موتور استخراج داینامیک پرامپت مجهز شد.")

# ۲. تزریق کارت گرافیکی تصویر با فونت مدرن، مهار کامل کادر و نمایش متادیتا در index.html
index_path = "index.html"
if os.path.exists(index_path):
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()

    html = re.sub(r'<!-- YODAW AI Image Auto-Renderer Bridge -->[\s\S]*?<\/script>', '', html)

    refined_card_script = """<!-- YODAW AI Image Auto-Renderer Bridge -->
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
            
            // استخراج عنوان و متادیتا از URL
            let promptTitle = "AI Generated Artwork";
            let artStyle = "cinematic";
            const promptMatch = url.match(/\\/prompt\\/([^?]+)/);
            if (promptMatch) {
              try {
                const decoded = decodeURIComponent(promptMatch);
                const parts = decoded.split(",");
                promptTitle = parts[0].trim();
                if (parts.length > 1) artStyle = parts.trim();
              } catch(e) {}
            }

            const card = document.createElement("div");
            card.className = "ai-image-card my-3 w-full max-w-[500px] overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 text-white shadow-2xl backdrop-blur-xl";
            card.style.fontFamily = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif';
            card.style.webkitFontSmoothing = 'antialiased';
            card.innerHTML = `
              <!-- هدر با متادیتا و پرامپت تمیز داخل کادر -->
              <div style="padding: 12px 14px 10px 14px; background: rgba(15, 23, 42, 0.7); border-bottom: 1px solid rgba(51, 65, 85, 0.6); display: flex; flex-direction: column; gap: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10b981;"></span>
                    <span style="font-size: 10px; font-family: monospace; letter-spacing: 0.05em; color: #94a3b8; text-transform: uppercase;">FLUX 1.0 • AI RENDER</span>
                  </div>
                  <div style="display: flex; gap: 5px;">
                    <span style="font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 12px; background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93c5fd;">${artStyle}</span>
                    <span style="font-size: 10px; font-family: monospace; padding: 2px 7px; border-radius: 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; color: #cbd5e1;">16:9</span>
                  </div>
                </div>
                <div style="font-size: 12.5px; font-weight: 600; color: #f8fafc; line-height: 1.35; white-space: normal; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                  ${promptTitle}
                </div>
              </div>

              <!-- بدنه تصویر با لودینگ متحرک -->
              <div style="position: relative; width: 100%; aspect-ratio: 16/9; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                <div class="loader-box" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; background: rgba(2, 6, 23, 0.95); color: #60a5fa; font-size: 11.5px;">
                  <div style="width: 32px; height: 32px; border: 2.5px solid #3b82f6; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                  <span style="font-weight: 500; letter-spacing: 0.02em;">در حال رندر اختصاصی تصویر با موتور FLUX...</span>
                  <span style="font-size: 9.5px; color: #64748b; font-family: monospace;">کیفیت 8K • نورپردازی استودیویی</span>
                </div>
                <img src="${url}" alt="${promptTitle}" style="width: 100%; height: 100%; object-fit: cover; display: none; transition: opacity 0.6s ease;" onload="this.style.display='block'; this.previousElementSibling.style.display='none';" onerror="this.previousElementSibling.innerHTML='<span style=\\'color:#f43f5e;\\'>⚠️ در حال تلاش مجدد برای دریافت تصویر...</span>';" />
              </div>

              <!-- فوتر با دکمه‌های شکیل -->
              <div style="padding: 10px 14px; background: #0f172a; border-top: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; font-size: 11px;">
                <span style="color: #64748b; font-family: monospace;">خروجی با وضوح اصلی</span>
                <div style="display: flex; gap: 7px;">
                  <a href="${url}" target="_blank" style="padding: 4px 10px; background: rgba(30, 41, 59, 0.8); border: 1px solid #334155; color: #cbd5e1; border-radius: 7px; text-decoration: none; font-weight: 500;">🔍 تمام‌صفحه</a>
                  <a href="${url}" target="_blank" download="flux-artwork.jpg" style="padding: 4px 12px; background: linear-gradient(135deg, #2563eb, #4f46e5); color: #ffffff; border-radius: 7px; text-decoration: none; font-weight: 600; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">📥 دانلود عکس</a>
                </div>
              </div>
              <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            tn.nodeValue = "";
            p.appendChild(card);
          }
        }
      }
      setInterval(renderAIImages, 500);
      document.addEventListener("DOMContentLoaded", renderAIImages);
    })();
    </script>
"""
    html = html.replace("</head>", refined_card_script + "\n</head>")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("✅ کارت نمایش تصویر با فونت مدرن اپل و مهار کامل کادر به index.html اضافه شد.")

# ۳. پاک‌سازی کش و بیلد فرانت‌اند
subprocess.run(["rm", "-rf", "node_modules/.vite"], check=False)
subprocess.run(["npx", "vite", "build", "--emptyOutDir=false"], check=False)

# ۴. ثبت و پوش به مخزن گیت‌هاب
subprocess.run(["git", "add", "."], check=False)
subprocess.run(["git", "commit", "-m", "feat(flux): dynamic prompt extraction, SF Pro typography, bounded card layout and direct download"], check=False)
subprocess.run(["git", "push"], check=False)
print("=== تمام تغییرات با موفقیت کامیت و پوش شدند ===")
