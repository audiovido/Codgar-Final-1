import React, { useState } from 'react';

export interface AppConnector {
  id: string;
  name: string;
  category: 'coding' | 'marketing' | 'design' | 'gaming' | 'office';
  categoryLabel: string;
  desc: string;
  icon: string;
  gradient: string;
  loginUrl: string;
  toolsCount: number;
}

const CONNECTORS_DATA: AppConnector[] = [
  // کدها
  { id: 'github', name: 'GitHub', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'مدیریت مخازن، کامیت‌ها و پول‌ریکوئست‌ها', icon: '🐙', gradient: 'from-gray-700 to-gray-900', loginUrl: 'https://github.com/login', toolsCount: 8 },
  { id: 'gitlab', name: 'GitLab', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'پایپ‌لاین‌های اتوماتیک CI/CD و مستندات', icon: '🦊', gradient: 'from-orange-600 to-amber-600', loginUrl: 'https://gitlab.com/users/sign_in', toolsCount: 5 },
  { id: 'vercel', name: 'Vercel', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'دیپلوی و انتشار آنی دامنه‌های پروژه', icon: '▲', gradient: 'from-black to-slate-800', loginUrl: 'https://vercel.com/login', toolsCount: 4 },
  { id: 'supabase', name: 'Supabase', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'دیتابیس PostgreSQL و جداول Realtime', icon: '⚡', gradient: 'from-emerald-600 to-teal-800', loginUrl: 'https://supabase.com/dashboard', toolsCount: 6 },
  { id: 'docker', name: 'Docker Hub', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'مدیریت ایمیج‌ها و کانتینرهای توسعه', icon: '🐳', gradient: 'from-blue-600 to-cyan-700', loginUrl: 'https://hub.docker.com', toolsCount: 4 },
  { id: 'linear', name: 'Linear', category: 'coding', categoryLabel: 'کدها و توسعه', desc: 'پیگیری اسپرینت‌ها و ایشیوهای فنی', icon: '📐', gradient: 'from-indigo-600 to-purple-800', loginUrl: 'https://linear.app/login', toolsCount: 5 },

  // مارکتینگ
  { id: 'ga4', name: 'Google Analytics 4', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'رصد ترافیک زنده و تحلیل رفتار کاربران', icon: '📊', gradient: 'from-amber-500 to-orange-600', loginUrl: 'https://analytics.google.com', toolsCount: 6 },
  { id: 'google_ads', name: 'Google Ads', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'مدیریت کمپین‌ها و نرخ تبدیل تبلیغات', icon: '🎯', gradient: 'from-blue-500 to-emerald-500', loginUrl: 'https://ads.google.com', toolsCount: 5 },
  { id: 'meta_ads', name: 'Meta Ads Manager', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'تبلیغات اینستاگرام و پرسونای مخاطبان', icon: '♾️', gradient: 'from-blue-600 to-indigo-700', loginUrl: 'https://adsmanager.facebook.com', toolsCount: 4 },
  { id: 'hubspot', name: 'HubSpot CRM', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'اتوماسیون لیدها و تعامل با مشتریان', icon: '🧡', gradient: 'from-orange-500 to-red-600', loginUrl: 'https://app.hubspot.com/login', toolsCount: 7 },
  { id: 'mailchimp', name: 'Mailchimp', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'ارسال خودکار ایمیل‌ها و کمپین‌های خبری', icon: '🐵', gradient: 'from-yellow-500 to-amber-600', loginUrl: 'https://login.mailchimp.com', toolsCount: 4 },
  { id: 'twitter_x', name: 'X / Twitter Dev', category: 'marketing', categoryLabel: 'مارکتینگ', desc: 'پایش ترندهای تجاری و انتشار اتوماتیک', icon: '𝕏', gradient: 'from-slate-800 to-black', loginUrl: 'https://developer.x.com', toolsCount: 4 },

  // طراح‌ها
  { id: 'figma', name: 'Figma', category: 'design', categoryLabel: 'طراحی و خلاقیت', desc: 'استخراج کدهای UI و دیزاین توکن‌ها', icon: '🎨', gradient: 'from-purple-600 to-pink-600', loginUrl: 'https://www.figma.com/login', toolsCount: 9 },
  { id: 'canva', name: 'Canva', category: 'design', categoryLabel: 'طراحی و خلاقیت', desc: 'تولید بنرها و قالب‌های آماده بصری', icon: '✨', gradient: 'from-cyan-500 to-blue-600', loginUrl: 'https://www.canva.com/login', toolsCount: 5 },
  { id: 'adobe', name: 'Adobe Creative Cloud', category: 'design', categoryLabel: 'طراحی و خلاقیت', desc: 'ادغام فایل‌های گرافیکی PSD و Illustrator', icon: '🔴', gradient: 'from-red-600 to-rose-800', loginUrl: 'https://creativecloud.adobe.com', toolsCount: 6 },
  { id: 'framer', name: 'Framer', category: 'design', categoryLabel: 'طراحی و خلاقیت', desc: 'تبدیل طراحی تعاملی به وب‌سایت واقعی', icon: '🔷', gradient: 'from-blue-600 to-purple-600', loginUrl: 'https://framer.com', toolsCount: 4 },

  // بازی‌سازها
  { id: 'unity', name: 'Unity Cloud', category: 'gaming', categoryLabel: 'بازی‌سازی', desc: 'اسکریپت‌نویسی گیم، رندرینگ و Asset Store', icon: '🕹️', gradient: 'from-slate-700 to-black', loginUrl: 'https://id.unity.com', toolsCount: 7 },
  { id: 'unreal', name: 'Unreal Engine', category: 'gaming', categoryLabel: 'بازی‌سازی', desc: 'کنترل بلوپرینت‌ها، شیدرها و گرافیک 3D', icon: '⚡', gradient: 'from-zinc-800 to-neutral-900', loginUrl: 'https://www.epicgames.com/id/login', toolsCount: 6 },
  { id: 'blender', name: 'Blender Cloud', category: 'gaming', categoryLabel: 'بازی‌سازی', desc: 'مدل‌سازی سه‌بعدی و اتوماسیون انیمیشن', icon: '🟠', gradient: 'from-amber-600 to-orange-700', loginUrl: 'https://cloud.blender.org', toolsCount: 5 },
  { id: 'discord', name: 'Discord Developers', category: 'gaming', categoryLabel: 'بازی‌سازی', desc: 'مدیریت ربات‌ها و کامیونیتی گیمرها', icon: '👾', gradient: 'from-indigo-600 to-blue-700', loginUrl: 'https://discord.com/login', toolsCount: 5 },

  // کارهای اداری
  { id: 'google_workspace', name: 'Google Workspace', category: 'office', categoryLabel: 'کارهای اداری', desc: 'مدیریت هوشمند جیمیل، درایو و اسناد', icon: '✉️', gradient: 'from-red-500 to-amber-500', loginUrl: 'https://mail.google.com', toolsCount: 6 },
  { id: 'notion', name: 'Notion', category: 'office', categoryLabel: 'کارهای اداری', desc: 'پایگاه دانش تیمی و مدیریت مستندات', icon: '📓', gradient: 'from-neutral-700 to-neutral-900', loginUrl: 'https://www.notion.so/login', toolsCount: 7 },
  { id: 'slack', name: 'Slack', category: 'office', categoryLabel: 'کارهای اداری', desc: 'چت‌های سازمانی و ارسال نوتیفیکیشن', icon: '💬', gradient: 'from-emerald-600 to-teal-700', loginUrl: 'https://slack.com/signin', toolsCount: 5 },
  { id: 'microsoft365', name: 'Microsoft 365', category: 'office', categoryLabel: 'کارهای اداری', desc: 'ورد، اکسل سازمانی و اوت‌لوک اداری', icon: '💼', gradient: 'from-blue-700 to-cyan-800', loginUrl: 'https://login.microsoftonline.com', toolsCount: 6 },
  { id: 'trello', name: 'Trello', category: 'office', categoryLabel: 'کارهای اداری', desc: 'بردهای کانبان و مدیریت کارهای پرسنلی', icon: '📋', gradient: 'from-sky-600 to-blue-700', loginUrl: 'https://trello.com/login', toolsCount: 4 }
];

export const ConnectorsHub: React.FC<{ isOpen: boolean; onClose: () => void; onInjectTask: (t: string) => void }> = ({ isOpen, onClose, onInjectTask }) => {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  if (!isOpen) return null;

  const filtered = CONNECTORS_DATA.filter(item => {
    const matchCat = selectedCat === 'all' || item.category === selectedCat;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.desc.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c1222]/95 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* هدر بالایی با دکمه بستن */}
        <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white">🔌</span>
              کالکشن جامع کانکتورها و ادغام‌ها (CODGAR Cowork Hub)
            </h2>
            <p className="text-xs text-slate-400 mt-1">اتصال خودکار به ابزارهای تخصصی کد، مارکتینگ، طراحی، بازی‌سازی و امور اداری</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition">
            ✕
          </button>
        </div>

        {/* فیلترها و کادر جستجو در بالای کالکشن */}
        <div className="px-8 py-4 border-b border-white/10 flex flex-wrap gap-4 items-center justify-between bg-black/20">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'همه (All)' },
              { id: 'coding', label: '💻 کدها و توسعه' },
              { id: 'marketing', label: '📈 مارکتینگ' },
              { id: 'design', label: '🎨 طراح‌ها' },
              { id: 'gaming', label: '🎮 بازی‌سازها' },
              { id: 'office', label: '📋 امور اداری' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCat(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  selectedCat === cat.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="جستجوی ابزار یا نرم‌افزار..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
          />
        </div>

        {/* گرید کالکشن کارت‌ها */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(app => (
            <div key={app.id} className="relative p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${app.gradient} flex items-center justify-center text-xl shadow-md`}>
                    {app.icon}
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-cyan-300">
                    {app.categoryLabel}
                  </span>
                </div>
                <h3 className="font-semibold text-base mb-1 text-slate-100">{app.name}</h3>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">{app.desc}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                <button
                  onClick={() => window.open(app.loginUrl, '_blank')}
                  className="flex-1 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-medium transition text-center"
                >
                  🔗 لاگین و اتصال
                </button>
                <button
                  onClick={() => {
                    onInjectTask(`ارتباط با سرویس ${app.name} را بررسی و ابزارهای مرتبط را فراخوانی کن.`);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs transition"
                >
                  ⚡ اجرای ابزار
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
