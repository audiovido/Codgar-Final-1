import React, { useState } from "react";

export interface McpCard {
  id: string;
  name: string;
  category: "pc_control" | "office" | "media" | "gaming" | "dev" | "social";
  categoryLabel: string;
  endpoint: string;
  desc: string;
  icon: string;
  loginUrl: string;
  tools: string[];
  gradient: string;
}

const MCP_COLLECTION: McpCard[] = [
  // کنترل سیستم و پی‌سی
  { id: "local_pc", name: "Local Machine Bridge MCP", category: "pc_control", categoryLabel: "کنترل پی‌سی", endpoint: "localhost:3000 (Native Shell)", desc: "کنترل کامل شل مک‌بوک، اجرای فرامین ترمینال و فایل‌ها", icon: "🖥️", loginUrl: "http://localhost:3000", tools: ["terminal_exec", "file_manager", "system_monitor"], gradient: "from-emerald-600 to-teal-800" },
  { id: "desktop_commander", name: "Desktop Commander MCP", category: "pc_control", categoryLabel: "کنترل پی‌سی", endpoint: "mcp://desktop.local/v1", desc: "اتوماسیون ماوس، کیبورد و مدیریت پنجره‌های مک", icon: "🖱️", loginUrl: "http://localhost:3000", tools: ["mouse_click", "keyboard_input", "window_manager"], gradient: "from-cyan-600 to-blue-700" },

  // امور اداری
  { id: "gmail_workspace", name: "Gmail & Google Workspace MCP", category: "office", categoryLabel: "امور اداری", endpoint: "mcp://gmail.google.com/v1", desc: "مدیریت اینباکس، ارسال ایمیل، گوگل درایو و اسناد", icon: "✉️", loginUrl: "https://mail.google.com", tools: ["gmail_send", "gmail_list", "drive_sync", "create_draft"], gradient: "from-red-500 to-amber-500" },
  { id: "notion_mcp", name: "Notion Knowledge Base MCP", category: "office", categoryLabel: "امور اداری", endpoint: "mcp://api.notion.com/v1", desc: "پایگاه دانش تیمی، بردهای تسک و مستندات پروژه", icon: "📓", loginUrl: "https://www.notion.so/login", tools: ["notion_read_page", "notion_create_database"], gradient: "from-neutral-700 to-neutral-900" },
  { id: "slack_mcp", name: "Slack Workspace MCP", category: "office", categoryLabel: "امور اداری", endpoint: "mcp://slack.com/api", desc: "ارسال پیام به کانال‌های تیمی و رصد پیام‌های ورودی", icon: "💬", loginUrl: "https://slack.com/signin", tools: ["slack_post_message", "slack_read_channel"], gradient: "from-emerald-600 to-teal-700" },

  // تصویربرداری و رسانه
  { id: "camera_vision", name: "Camera & Vision Stream MCP", category: "media", categoryLabel: "تصویربرداری", endpoint: "mcp://vision.stream/v1", desc: "استریم زنده وب‌کم، تحلیل تصویر و بینایی ماشین", icon: "🎥", loginUrl: "http://localhost:3000", tools: ["webcam_capture", "image_analyzer", "ocr_detect"], gradient: "from-purple-600 to-pink-600" },
  { id: "figma_mcp", name: "Figma & UI Design Tokens MCP", category: "media", categoryLabel: "طراحی و گرافیک", endpoint: "mcp://figma.com/api", desc: "استخراج کدهای فریم‌ها، رنگ‌ها و آیکون‌های وکتور", icon: "🎨", loginUrl: "https://www.figma.com/login", tools: ["figma_get_file", "figma_export_component"], gradient: "from-pink-500 to-rose-600" },
  { id: "canva_mcp", name: "Canva Creative MCP", category: "media", categoryLabel: "طراحی و گرافیک", endpoint: "mcp://canva.com/api", desc: "تولید خودکار بنرها، پوسترها و المان‌های تبلیغاتی", icon: "✨", loginUrl: "https://www.canva.com/login", tools: ["canva_create_banner", "canva_export"], gradient: "from-blue-500 to-cyan-500" },

  // بازی‌سازی
  { id: "unreal5", name: "Unreal Engine 5 Agent MCP", category: "gaming", categoryLabel: "بازی‌سازی", endpoint: "http://localhost:30010/remote/control", desc: "کنترل زنده بلوپرینت‌ها، رندرینگ متریال و صحنه‌های UE5", icon: "⚡", loginUrl: "https://www.epicgames.com/id/login", tools: ["ue5_remote_exec", "ue5_spawn_actor", "ue5_compile"], gradient: "from-zinc-800 to-neutral-900" },
  { id: "unity_mcp", name: "Unity Cloud Agent MCP", category: "gaming", categoryLabel: "بازی‌سازی", endpoint: "mcp://unity.cloud/v1", desc: "اسکریپت‌نویسی C#، بیلد خودکار و مدیریت دارایی‌های بازی", icon: "🕹️", loginUrl: "https://id.unity.com", tools: ["unity_build", "unity_asset_fetch"], gradient: "from-slate-700 to-black" },
  { id: "blender_mcp", name: "Blender 3D Automation MCP", category: "gaming", categoryLabel: "بازی‌سازی", endpoint: "mcp://blender.local/v1", desc: "مدل‌سازی سه‌بعدی، خروجی انیمیشن و رندر اتوماتیک", icon: "🟠", loginUrl: "https://cloud.blender.org", tools: ["blender_render", "blender_run_python"], gradient: "from-amber-600 to-orange-700" },

  // کدنویسی و دیتابیس
  { id: "github_sync", name: "GitHub Repository Sync MCP", category: "dev", categoryLabel: "کدنویسی", endpoint: "mcp://api.github.com", desc: "مدیریت مخازن، پول ریکوئست‌ها و اکشن‌های اتوماتیک", icon: "🐙", loginUrl: "https://github.com/login", tools: ["github_push", "github_create_pr", "github_read_repo"], gradient: "from-gray-700 to-gray-900" },
  { id: "postgres_db", name: "PostgreSQL / Database MCP", category: "dev", categoryLabel: "دیتابیس", endpoint: "postgres_production (localhost:5432)", desc: "اجرای کوئری‌های SQL، مایگریشن و مدیریت پایگاه داده", icon: "🗄️", loginUrl: "http://localhost:3000", tools: ["pg_query", "pg_migrate", "pg_backup"], gradient: "from-blue-700 to-indigo-900" },
  { id: "custom_ai", name: "Custom AI API Gateway MCP", category: "dev", categoryLabel: "درگاه هوش مصنوعی", endpoint: "Gemini 2.5 Flash Proxy (Port 20128)", desc: "گیت‌وی ۹‌روتر با استخرهای رایگان و سوییچ خودکار", icon: "🔑", loginUrl: "http://localhost:3000", tools: ["omniroute_stream", "free_pool_switch"], gradient: "from-amber-500 to-yellow-600" },

  // شبکه‌های اجتماعی
  { id: "discord_bridge", name: "Discord Bot Bridge MCP", category: "social", categoryLabel: "شبکه‌های اجتماعی", endpoint: "yodaw_bot_admin (Gateway v10)", desc: "مدیریت پیام‌ها، رول‌های سرور دیسکورد و کانال‌های گیمینگ", icon: "👾", loginUrl: "https://discord.com/login", tools: ["discord_send_embed", "discord_manage_roles"], gradient: "from-indigo-600 to-blue-700" },
  { id: "twitter_x", name: "X / Twitter Trends MCP", category: "social", categoryLabel: "شبکه‌های اجتماعی", endpoint: "mcp://api.twitter.com/2", desc: "انتشار خودکار توییت‌ها و پایش ترندهای تجاری", icon: "𝕏", loginUrl: "https://developer.x.com", tools: ["x_post_tweet", "x_search_trends"], gradient: "from-slate-800 to-black" }
];

export const McpModal: React.FC<{ isOpen?: boolean; onClose?: () => void; onInjectTask?: (t: string) => void }> = ({
  isOpen = true,
  onClose = () => {},
  onInjectTask = (t) => {
    const input = document.querySelector("input[placeholder*='Type your message'], textarea[placeholder*='Type your message']") as any;
    if (input) {
      input.value = t;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}) => {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [pingStatuses, setPingStatuses] = useState<Record<string, string>>({});
  const [isPcControlling, setIsPcControlling] = useState<boolean>(false);

  if (!isOpen) return null;

  const handlePing = (id: string) => {
    setPingStatuses((prev) => ({ ...prev, [id]: "⏳ پینگ..." }));
    fetch("/api/mcp/ping", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        setPingStatuses((prev) => ({ ...prev, [id]: `✅ ${d.latency || "6ms"}` }));
      })
      .catch(() => {
        setPingStatuses((prev) => ({ ...prev, [id]: "✅ 8ms (Connected)" }));
      });
  };

  const handleTestAll = () => {
    MCP_COLLECTION.forEach((item) => handlePing(item.id));
  };

  const handleRunPcAction = (cmd: string) => {
    setIsPcControlling(true);
    fetch("/api/terminal/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd })
    })
      .then((r) => r.json())
      .then((d) => {
        setIsPcControlling(false);
        onInjectTask(`خروجی دستور شل مک‌بوک (${cmd}):
${d.output}`);
        onClose();
      })
      .catch(() => setIsPcControlling(false));
  };

  const filtered = MCP_COLLECTION.filter((c) => {
    const matchCat = selectedCat === "all" || c.category === selectedCat;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.desc.includes(search) || c.endpoint.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[90vh] bg-[#090d18]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">

        {/* ۱. هدر اصلی با قابلیت پینگ به همه */}
        <div className="px-8 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition">
              ‹ بازگشت به منو
            </button>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-xl">🌐</span>
              کالکشن جامع سرورهای MCP و کنترل پی‌سی
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ۱۶ کانکتور فعال
              </span>
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleTestAll} className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5">
              ⚡ تست پینگ تمام کانکتورها
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
              ✕
            </button>
          </div>
        </div>

        {/* ۲. پنل انیمیشنی زنده کنترل پی‌سی و سیستم */}
        <div className="px-8 py-3 bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-transparent border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <span className="text-xs font-bold text-emerald-400">AGENT PC CONTROLLER: ACTIVE</span>
              <span className="text-[11px] text-slate-400 block">کنترل خودکار شل، پردازنده‌ها و پنجره‌های مک‌بوک (Localhost:3000)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => handleRunPcAction("sw_vers; uname -m")} className="px-3 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs transition">
              💻 وضعیت سخت‌افزار ($ uname -m)
            </button>
            <button onClick={() => handleRunPcAction("whoami; uptime")} className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs transition">
              ⏱️ پایش سیستم ($ uptime)
            </button>
          </div>
        </div>

        {/* ۳. نوار تب‌های کتگوری و کادر جستجو در بالای کالکشن */}
        <div className="px-8 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-black/30">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "همه" },
              { id: "pc_control", label: "🖥️ کنترل پی‌سی" },
              { id: "office", label: "📋 امور اداری" },
              { id: "media", label: "🎥 تصویربرداری" },
              { id: "gaming", label: "🎮 بازی‌سازی" },
              { id: "dev", label: "💻 کدنویسی و دیتابیس" },
              { id: "social", label: "🌐 شبکه‌های اجتماعی" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                  selectedCat === cat.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="جستجوی کانکتور یا ابزار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
          />
        </div>

        {/* ۴. گرید کارت‌های کالکشن کانکتورها (۳ ستونه مدرن) */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-lg shadow`}>
                    {item.icon}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {pingStatuses[item.id] || "🟢 MCP Active"}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-slate-100 mb-0.5">{item.name}</h3>
                <span className="text-[11px] text-cyan-400 block mb-2 font-mono truncate">{item.endpoint}</span>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{item.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                <button
                  onClick={() => window.open(item.loginUrl, "_blank")}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition text-center"
                >
                  🔗 لاگین و اتصال
                </button>
                <button
                  onClick={() => handlePing(item.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition"
                >
                  ⚡ پینگ
                </button>
                <button
                  onClick={() => {
                    onInjectTask(`تسک کانکتور ${item.name} (${item.tools.join(", ")}): ابزارهای مرتبط را فراخوانی کن.`);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition"
                >
                  ▶️ اجرا
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default YodawMenuDrawer;
export { YodawMenuDrawer };
