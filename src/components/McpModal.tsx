import React, { useState } from 'react';

export interface HistorySession {
  id: string;
  title: string;
  date?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface YodawMenuDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  sessions?: HistorySession[];
  historySessions?: HistorySession[];
  onSelectSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  onNewSession?: () => void;
  [key: string]: any;
}

export const YodawMenuDrawer: React.FC<YodawMenuDrawerProps> = (props) => {
  const isOpen = props.isOpen ?? false;
  const onClose = props.onClose ?? (() => {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl p-5 text-white">
        
        {/* هدر پنجره کانکتورها */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-base font-bold text-slate-100">مدیریت کانکتورهای سراسری MCP</h2>
          </div>
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
          >
            بستن ✕
          </button>
        </div>

        {/* کالکشن جامع ۱۲ سرور MCP به صورت ۲ ستونه */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto max-h-[500px] p-1">
          {[
            { id: "local_pc", name: "Local Machine Bridge MCP", category: "🖥️ کنترل پی‌سی و سیستم", endpoint: "localhost:3000", icon: "🖥️", status: "🟢 متصل و فعال", action: "تست شل" },
            { id: "gmail", name: "Gmail & Google Workspace MCP", category: "📋 امور اداری و اسناد", endpoint: "arminsh00@gmail.com", icon: "✉️", status: "🟡 نیاز به لاگین", action: "🔗 لاگین گوگل", authUrl: "https://mail.google.com" },
            { id: "ue5", name: "Unreal Engine 5 Agent MCP", category: "🎮 بازی‌سازی و ۳D", endpoint: "localhost:30010/remote/control", icon: "⚡", status: "🔴 غیرفعال (UE5 باز نیست)", action: "تست پورت ۳۰۰۱۰" },
            { id: "gateway", name: "Custom AI API Gateway", category: "🔑 درگاه هوش مصنوعی", endpoint: "Gemini 2.5 Flash Proxy", icon: "🔑", status: "🟢 فعال (OmniRoute)", action: "پینگ روتور" },
            { id: "github", name: "GitHub Repository Sync MCP", category: "💻 کدنویسی و مخازن", endpoint: "arminsh00 (GitHub)", icon: "🐙", status: "⚪ توکن ست نشده", action: "🔗 تنظیم گیت‌هاب", authUrl: "https://github.com" },
            { id: "postgres", name: "PostgreSQL / Database MCP", category: "🗄️ پایگاه داده", endpoint: "postgres_production (5432)", icon: "🗄️", status: "🔴 آفلاین (پورت ۵۴۳۲)", action: "تست سوکت DB" },
            { id: "discord", name: "Discord Bot Bridge MCP", category: "👾 شبکه‌های اجتماعی و بات", endpoint: "yodaw_bot_admin", icon: "👾", status: "⚪ نیاز به توکن ربات", action: "🔗 اتصال دیسکورد", authUrl: "https://discord.com" },
            { id: "notion", name: "Notion Knowledge Base MCP", category: "📓 پایگاه دانش و یادداشت", endpoint: "api.notion.com/v1", icon: "📓", status: "🟡 نیاز به لاگین", action: "🔗 اتصال نوشن", authUrl: "https://notion.so" },
            { id: "slack", name: "Slack Workspace MCP", category: "💬 پیام‌رسان تیمی", endpoint: "slack.com/api", icon: "💬", status: "🟡 نیاز به لاگین", action: "🔗 اتصال اسلک", authUrl: "https://slack.com" },
            { id: "figma", name: "Figma UI Tokens MCP", category: "🎨 طراحی و گرافیک", endpoint: "figma.com/api", icon: "🎨", status: "⚪ نیاز به توکن فیگما", action: "🔗 اتصال فیگما", authUrl: "https://figma.com" },
            { id: "unity", name: "Unity Cloud Agent MCP", category: "🕹️ موتور بازی‌سازی", endpoint: "unity.cloud/v1", icon: "🕹️", status: "🔴 ادیتور بسته است", action: "تست کلاینت" },
            { id: "camera", name: "Camera & Vision Stream MCP", category: "🎥 استریم و بینایی", endpoint: "vision.stream/v1", icon: "🎥", status: "🟢 وب‌کم آماده", action: "تست تصویر" }
          ].map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/60 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-700/40">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {item.status}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white leading-tight">{item.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[170px]">
                      {item.endpoint}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    if (item.authUrl) {
                      window.open(item.authUrl, "_blank");
                    } else {
                      alert("درخواست تست به " + item.name + " ارسال شد.");
                    }
                  }}
                  className="flex-1 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition text-center shadow-sm"
                >
                  {item.action}
                </button>
                <button
                  onClick={() => {
                    fetch("/api/mcp/ping", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ target: item.id })
                    }).then(() => alert("پینگ به " + item.name + " ارسال شد."));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 transition"
                >
                  ⚡ پینگ
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export const McpModal = YodawMenuDrawer;
export default YodawMenuDrawer;
