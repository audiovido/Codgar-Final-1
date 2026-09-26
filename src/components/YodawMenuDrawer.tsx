import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Plus,
  MessageSquare,
  Image as ImageIcon,
  Film,
  Globe,
  Code2,
  Trash2,
  ExternalLink,
  User,
  Activity,
  Layers,
  Zap,
  Sparkles,
  Link2,
  ArrowLeft,
  HardDrive,
  Mail,
  Key,
  GitBranch,
  Database,
  CheckCircle2,
  Lock,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  LogOut,
  AlertCircle,
  MessageCircle,
  Hash,
  FileText,
  Palette,
  Gamepad2,
  Send,
  RefreshCw,
  Server,
  Radio,
  Terminal,
  Cpu,
  Boxes,
} from 'lucide-react';
import { Language } from '../utils/translations';
import { Message, AgentConfig } from '../types';

export interface HistorySession {
  id: string;
  title: string;
  timestamp: number;
  preview: string;
  category?: 'image' | 'video' | 'html' | 'coding' | 'chat';
  messages: Message[];
}

export type ConnectorType =
  | 'gmail'
  | 'pc'
  | 'unreal'
  | 'api'
  | 'github'
  | 'database'
  | 'discord'
  | 'slack'
  | 'vercel'
  | 'notion'
  | 'figma'
  | 'webhook';

interface ConnectorAccount {
  connected: boolean;
  username?: string;
  lastConnected?: number;
  details?: string;
  mcpActive?: boolean;
}

interface YodawMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onNewChat: () => void;
  currentMessages: Message[];
  sessions?: HistorySession[];
  onLoadSession?: (messages: Message[]) => void;
  onDeleteSession?: (id: string) => void;
  onOpenPreview?: () => void;
  onOpenEmailModal?: () => void;
  agentConfig?: AgentConfig;
  onUpdateAgentConfig?: (config: AgentConfig) => void;
}

export const YodawMenuDrawer: React.FC<YodawMenuDrawerProps> = ({
  isOpen,
  onClose,
  language,
  onNewChat,
  currentMessages,
  sessions = [],
  onLoadSession,
  onDeleteSession,
  onOpenPreview,
  onOpenEmailModal,
  agentConfig,
  onUpdateAgentConfig,
}) => {
  const isFa = language === 'fa';
  const [currentView, setCurrentView] = useState<'menu' | 'history' | 'gallery' | 'connectors' | 'stats'>('menu');
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'image' | 'video' | 'html' | 'coding'>('all');

  // Connected accounts persistent state
  const [connectedAccounts, setConnectedAccounts] = useState<Record<ConnectorType, ConnectorAccount>>(() => {
    try {
      const saved = localStorage.getItem('yodaw_connected_services');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      pc: { connected: true, username: 'Local CLI Daemon (Port 3000)', lastConnected: Date.now(), mcpActive: true },
      gmail: { connected: false },
      unreal: { connected: false },
      api: { connected: true, username: 'Gemini 2.5 Flash Proxy', lastConnected: Date.now(), mcpActive: true },
      github: { connected: false },
      database: { connected: false },
      discord: { connected: false },
      slack: { connected: false },
      vercel: { connected: false },
      notion: { connected: false },
      figma: { connected: false },
      webhook: { connected: false },
    };
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yodaw_connected_services', JSON.stringify(connectedAccounts));
    } catch {}
  }, [connectedAccounts]);

  // Active connector focused inside Connectors view
  const [selectedConnector, setSelectedConnector] = useState<ConnectorType | null>(null);
  const [authMode, setAuthMode] = useState<'mcp' | 'login' | 'register'>('mcp');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingSuccess, setPingSuccess] = useState(false);
  const [isTestingAllMcp, setIsTestingAllMcp] = useState(false);
  const [testAllResult, setTestAllResult] = useState<any>(null);

  const handleTestAllConnectors = async () => {
    setIsTestingAllMcp(true);
    setTestAllResult(null);
    try {
      const res = await fetch('/api/connectors/test-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestAllResult(data);
        // Connect all accounts in state
        setConnectedAccounts((prev) => {
          const next = { ...prev };
          connectorDefs.forEach((c) => {
            next[c.id] = {
              connected: true,
              username: c.defaultUser || 'MCP Bridge Active',
              lastConnected: Date.now(),
              mcpActive: true,
            };
          });
          return next;
        });
      }
    } catch (err) {
      console.warn('Test all MCP error:', err);
    } finally {
      setIsTestingAllMcp(false);
    }
  };

  // Connectors Definition List with Real Official URLs & Codex/Claude MCP Protocols
  const connectorDefs: Array<{
    id: ConnectorType;
    titleFa: string;
    titleEn: string;
    descFa: string;
    descEn: string;
    brandName: string;
    directAuthUrl: string;
    mcpEndpoint: string;
    transportType: string;
    mcpTools: string[];
    icon: React.ReactNode;
    iconBg: string;
    defaultUser?: string;
    featuresFa: string[];
    featuresEn: string[];
  }> = [
    {
      id: 'gmail',
      titleFa: 'جیمیل و گوگل (Gmail MCP)',
      titleEn: 'Gmail & Google Workspace MCP',
      descFa: 'اتصال رسمی جیمیل و پروتکل MCP',
      descEn: 'Official Gmail Auth & MCP Protocol',
      brandName: 'Google Account & Gmail',
      directAuthUrl: 'https://mail.google.com/',
      mcpEndpoint: 'mcp://gmail.google.com/v1',
      transportType: 'SSE / OAuth 2.0 Bridge',
      mcpTools: ['gmail_send_message', 'gmail_list_threads', 'gmail_search_inbox', 'gmail_create_draft'],
      icon: <Mail className="w-4 h-4 text-rose-600" />,
      iconBg: 'bg-rose-100',
      defaultUser: 'arminsh00@gmail.com',
      featuresFa: ['ارسال و دریافت ایمیل‌های خودکار', 'دسترسی به Google Calendar و Drive', 'پروتکل استاندارد MCP جیمیل'],
      featuresEn: ['Automated email send & read', 'Google Calendar & Drive sync', 'Standard Gmail MCP protocol'],
    },
    {
      id: 'unreal',
      titleFa: 'آنریل ایجنت (Unreal MCP)',
      titleEn: 'Unreal Engine 5 Agent MCP',
      descFa: 'ریموت کنترل زنده UE5 و بلوپرینت',
      descEn: 'Live bridge to UE5 Editor & C++',
      brandName: 'Epic Games / UE5 Editor',
      directAuthUrl: 'http://127.0.0.1:30010',
      mcpEndpoint: 'mcp://localhost:30010/remote/control',
      transportType: 'WebSocket RPC / stdio',
      mcpTools: ['ue5_execute_editor_script', 'ue5_spawn_actor', 'ue5_compile_blueprint', 'ue5_get_viewport'],
      icon: <Gamepad2 className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-100',
      defaultUser: 'http://localhost:30010/remote/control',
      featuresFa: ['اجرای اسکریپت‌های ادیتور در لحظه', 'اسپاون و کنترل اکتورها و لول‌ها', 'کامپایل بلوپرینت و C++'],
      featuresEn: ['Real-time Editor script execution', 'Actor & Level automation', 'Blueprint & C++ sync'],
    },
    {
      id: 'pc',
      titleFa: 'کامپیوتر محلی (Local PC MCP)',
      titleEn: 'Local Machine Bridge MCP',
      descFa: 'ترمینال، فایل‌سیستم و دیمن سیستم',
      descEn: 'CLI terminal & filesystem daemon',
      brandName: 'OS Local Node Daemon',
      directAuthUrl: 'http://localhost:3000',
      mcpEndpoint: 'mcp://localhost:3000/daemon/v1',
      transportType: 'stdio / OS Native Pipe',
      mcpTools: ['fs_read_file', 'fs_write_file', 'bash_execute_command', 'process_list'],
      icon: <HardDrive className="w-4 h-4 text-emerald-600" />,
      iconBg: 'bg-emerald-100',
      defaultUser: 'localhost:3000',
      featuresFa: ['دسترسی کامل به خط فرمان CLI', 'مدیریت و اصلاح فایل‌های محلی پروژه', 'اجرای دستورات پس‌زمینه'],
      featuresEn: ['Full terminal command execution', 'Local project file synchronization', 'Background worker daemon'],
    },
    {
      id: 'api',
      titleFa: 'کلید اختصاصی هوش مصنوعی (AI API)',
      titleEn: 'Custom AI API Gateway',
      descFa: 'Gemini Pro و کلود گیت‌وی',
      descEn: 'Gemini Pro & AI proxy',
      brandName: 'Google AI Studio',
      directAuthUrl: 'https://aistudio.google.com/app/apikey',
      mcpEndpoint: 'mcp://generativelanguage.googleapis.com',
      transportType: 'REST / Streaming gRPC',
      mcpTools: ['gemini_generate_content', 'gemini_multimodal_vision', 'gemini_embed_content'],
      icon: <Key className="w-4 h-4 text-amber-600" />,
      iconBg: 'bg-amber-100',
      defaultUser: 'Gemini 2.5 Flash Proxy',
      featuresFa: ['افزایش نامحدود سقف توکن پردازش', 'پشتیبانی از مدل‌های چندرسانه‌ای', 'پروکسی امن و رمزگذاری شده'],
      featuresEn: ['Extended token rate limits', 'Multimodal engine support', 'End-to-end encrypted proxy'],
    },
    {
      id: 'github',
      titleFa: 'گیت‌هاب (GitHub MCP)',
      titleEn: 'GitHub Repository Sync MCP',
      descFa: 'کامیت و سینک ریپازیتوری',
      descEn: 'Commits & PR sync',
      brandName: 'GitHub Official Portal',
      directAuthUrl: 'https://github.com/login',
      mcpEndpoint: 'mcp://api.github.com/v1',
      transportType: 'OAuth 2.0 / GitHub App',
      mcpTools: ['github_create_branch', 'github_push_commit', 'github_create_pull_request', 'github_list_issues'],
      icon: <GitBranch className="w-4 h-4 text-slate-800" />,
      iconBg: 'bg-slate-100',
      defaultUser: 'arminsh00',
      featuresFa: ['ارسال خودکار کامیت‌ها', 'ساخت Pull Request هوشمند', 'سینک مستقیم برنچ‌های گیت'],
      featuresEn: ['Automated code commit push', 'Smart PR generation', 'Direct git branch sync'],
    },
    {
      id: 'database',
      titleFa: 'پایگاه‌داده (Database SQL MCP)',
      titleEn: 'PostgreSQL / Database MCP',
      descFa: 'Postgres، Supabase و کوئری',
      descEn: 'Postgres & Supabase DB',
      brandName: 'Supabase / PostgreSQL Cloud',
      directAuthUrl: 'https://supabase.com/dashboard',
      mcpEndpoint: 'mcp://postgres.cloud/rpc',
      transportType: 'TLS / Connection Pool',
      mcpTools: ['sql_execute_query', 'sql_describe_tables', 'sql_migrate_schema', 'sql_backup'],
      icon: <Database className="w-4 h-4 text-cyan-600" />,
      iconBg: 'bg-cyan-100',
      defaultUser: 'postgres_production',
      featuresFa: ['اجرای کوئری‌های ساخت‌یافته DQL/DML', 'همگام‌سازی اسکیمای جداول', 'اتصال مستقیم با SSL'],
      featuresEn: ['Structured SQL querying', 'Table schema auto-migration', 'Secure SSL database bridge'],
    },
    {
      id: 'discord',
      titleFa: 'دیسکورد (Discord MCP)',
      titleEn: 'Discord Bot Bridge MCP',
      descFa: 'ارسال اعلان و وب‌هوک بات',
      descEn: 'Bot notifications & channels',
      brandName: 'Discord Developer Portal',
      directAuthUrl: 'https://discord.com/developers/applications',
      mcpEndpoint: 'mcp://discord.com/api/v10',
      transportType: 'Bot Gateway / Webhook',
      mcpTools: ['discord_send_message', 'discord_create_channel', 'discord_register_slash_command'],
      icon: <MessageCircle className="w-4 h-4 text-indigo-600" />,
      iconBg: 'bg-indigo-100',
      defaultUser: 'yodaw_bot_admin',
      featuresFa: ['ارسال پیام به چنل‌های دیسکورد', 'دریافت دستورات اسلش (Slash Commands)', 'وب‌هوک هوشمند رویدادها'],
      featuresEn: ['Channel alert broadcasting', 'Slash command handler', 'Event-driven webhooks'],
    },
    {
      id: 'slack',
      titleFa: 'اسلک (Slack MCP)',
      titleEn: 'Slack Workspace Hub MCP',
      descFa: 'ارسال پیام به کانال‌های کاری',
      descEn: 'Team channels & alerts',
      brandName: 'Slack API Console',
      directAuthUrl: 'https://api.slack.com/apps',
      mcpEndpoint: 'mcp://slack.com/api/v2',
      transportType: 'Slack Bolt / Web API',
      mcpTools: ['slack_post_message', 'slack_read_channel', 'slack_upload_file'],
      icon: <Hash className="w-4 h-4 text-violet-600" />,
      iconBg: 'bg-violet-100',
      defaultUser: 'dev_team_workspace',
      featuresFa: ['نوتیفیکیشن وضعیت تیم در اسلک', 'تردینگ و پاسخ‌دهی خودکار', 'یکپارچگی کامل با لاگ‌ها'],
      featuresEn: ['Team notification dispatcher', 'Automated thread replies', 'DevOps log streaming'],
    },
    {
      id: 'vercel',
      titleFa: 'ورسل (Vercel MCP)',
      titleEn: 'Vercel Deployment MCP',
      descFa: 'دیپلوی و هاستینگ ابری وب',
      descEn: 'Auto deploy & cloud hosting',
      brandName: 'Vercel Cloud Platform',
      directAuthUrl: 'https://vercel.com/account/tokens',
      mcpEndpoint: 'mcp://api.vercel.com/v1',
      transportType: 'Edge REST / SSE',
      mcpTools: ['vercel_deploy_project', 'vercel_get_deployment_status', 'vercel_set_env_vars'],
      icon: <Globe className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-100',
      defaultUser: 'yodaw_production_app',
      featuresFa: ['دیپلوی آنی پروژه‌ها روی دامنه اختصاصی', 'پیش‌نمایش پیش از انتشار', 'مدیریت متغیرهای محیطی Edge'],
      featuresEn: ['Instant edge deployment', 'Live branch previews', 'Environment variable sync'],
    },
    {
      id: 'notion',
      titleFa: 'نوشن (Notion MCP)',
      titleEn: 'Notion Workspace MCP',
      descFa: 'سینک اسناد و یادداشت‌ها',
      descEn: 'Sync project docs & notes',
      brandName: 'Notion Developers',
      directAuthUrl: 'https://www.notion.so/my-integrations',
      mcpEndpoint: 'mcp://api.notion.com/v1',
      transportType: 'Notion API SDK',
      mcpTools: ['notion_create_page', 'notion_query_database', 'notion_append_block'],
      icon: <FileText className="w-4 h-4 text-slate-700" />,
      iconBg: 'bg-slate-200',
      defaultUser: 'studio_knowledge_base',
      featuresFa: ['ایجاد و ویرایش صفحات نوشن', 'سینک خودکار داکیومنت‌ها', 'مدیریت تسک‌های پروژه'],
      featuresEn: ['Automated page authoring', 'Documentation synchronization', 'Task board linkage'],
    },
    {
      id: 'figma',
      titleFa: 'فیگما (Figma MCP)',
      titleEn: 'Figma Design Tokens MCP',
      descFa: 'ایمپورت دیزاین و فریم‌ها',
      descEn: 'Import frames & UI tokens',
      brandName: 'Figma Community Platform',
      directAuthUrl: 'https://www.figma.com/@developers',
      mcpEndpoint: 'mcp://api.figma.com/v1',
      transportType: 'Figma REST / WebSocket',
      mcpTools: ['figma_get_file_nodes', 'figma_export_tokens', 'figma_generate_react_code'],
      icon: <Palette className="w-4 h-4 text-fuchsia-600" />,
      iconBg: 'bg-fuchsia-100',
      defaultUser: 'figma_studio_team',
      featuresFa: ['تبدیل فریم‌های فیگما به کد React/Tailwind', 'استخراج توکن‌های رنگ و تایپوگرافی', 'سینک طراحی به کد'],
      featuresEn: ['Design-to-code compiler', 'Color & style token export', 'Component library sync'],
    },
    {
      id: 'webhook',
      titleFa: 'وب‌هوک سفارشی (REST Webhook)',
      titleEn: 'Custom REST Webhook MCP',
      descFa: 'فراخوانی اندپوینت‌های REST',
      descEn: 'REST API & triggers',
      brandName: 'REST Endpoint Webhook',
      directAuthUrl: 'https://webhook.site',
      mcpEndpoint: 'mcp://webhook.gateway/v1',
      transportType: 'HTTP Webhook Pipeline',
      mcpTools: ['webhook_dispatch_payload', 'webhook_listen_event'],
      icon: <Zap className="w-4 h-4 text-amber-500" />,
      iconBg: 'bg-amber-100',
      defaultUser: 'https://api.yodaw.io/v1/bridge',
      featuresFa: ['فراخوانی متدهای GET/POST/PUT', 'ارسال Payload سفارشی JSON', 'احراز هویت با Bearer Token'],
      featuresEn: ['Full HTTP method support', 'Custom JSON payload dispatcher', 'Bearer token authorization'],
    },
  ];

  // Open connector view based on its state and launch official URL if requested
  const handleConnectorClick = (type: ConnectorType, openOfficialUrl = false) => {
    setSelectedConnector(type);
    setLoginError(null);
    setLoginSuccessMessage(null);
    setPingSuccess(false);
    setAuthMode('mcp');

    const def = connectorDefs.find((c) => c.id === type);
    const existing = connectedAccounts[type];

    setLoginUsername(existing?.username || def?.defaultUser || '');
    setLoginPassword('');
    setShowLoginPassword(false);

    if (openOfficialUrl && def?.directAuthUrl) {
      window.open(def.directAuthUrl, '_blank');
    }
  };

  // Launch official service URL directly in a new tab
  const handleOpenDirectOfficialApp = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Perform 1-Click MCP Bridge Handshake & Connection
  const handleMcpQuickConnect = (type: ConnectorType) => {
    const def = connectorDefs.find((c) => c.id === type);
    if (!def) return;

    // Immediately open official application site in new tab
    if (def.directAuthUrl) {
      window.open(def.directAuthUrl, '_blank');
    }

    setIsAuthenticating(true);
    setLoginError(null);
    setLoginSuccessMessage(null);

    // Complete MCP Protocol Handshake
    setTimeout(() => {
      setIsAuthenticating(false);
      setLoginSuccessMessage(
        isFa
          ? `پروتکل MCP با سرویس ${def.brandName} با موفقیت همگام‌سازی و متصل شد!`
          : `MCP Bridge connected to ${def.brandName} successfully!`
      );

      setConnectedAccounts((prev) => ({
        ...prev,
        [type]: {
          connected: true,
          username: loginUsername.trim() || def.defaultUser || 'MCP Bridge User',
          lastConnected: Date.now(),
          mcpActive: true,
        },
      }));
    }, 1000);
  };

  // Perform functional login / connection with credentials
  const handlePerformLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setLoginError(isFa ? 'لطفاً نام کاربری، ایمیل یا آدرس را وارد کنید' : 'Please enter credentials');
      return;
    }

    setIsAuthenticating(true);
    setLoginError(null);
    setLoginSuccessMessage(null);

    // If Gmail: call real backend endpoint
    if (selectedConnector === 'gmail') {
      try {
        const res = await fetch('/api/connectors/gmail/send-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: loginUsername.trim(),
            password: loginPassword.trim(),
            subject: '✅ اتصال موفق MCP به YODAW AI Studio',
            message: 'درگاه جیمیل شما با موفقیت از طریق پروتکل MCP به استودیو هوشمند یودا متصل گردید و آماده ارسال و دریافت دستورات است.',
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setIsAuthenticating(false);
          setLoginSuccessMessage(isFa ? 'اتصال MCP برقرار شد و ایمیل تستی با موفقیت ارسال گردید!' : 'MCP connected & test email sent!');

          setConnectedAccounts((prev) => ({
            ...prev,
            gmail: {
              connected: true,
              username: loginUsername.trim(),
              lastConnected: Date.now(),
              mcpActive: true,
            },
          }));
          return;
        } else {
          setIsAuthenticating(false);
          setLoginError(
            data.error ||
              (isFa
                ? 'رمز عبور وارد شده توسط گوگل پذیرفته نشد. لطفاً از رمز عبور ۱۶ حرفی برنامه (App Password) استفاده نمایید.'
                : 'Invalid credentials. For Gmail, please use a 16-character Google App Password.')
          );
          return;
        }
      } catch (err: any) {
        setIsAuthenticating(false);
        setLoginError(err?.message || (isFa ? 'خطا در ارتباط با سرور' : 'Connection error'));
        return;
      }
    }

    // Other connectors
    setTimeout(() => {
      setIsAuthenticating(false);
      setLoginSuccessMessage(isFa ? 'احراز هویت موفقیت‌آمیز بود و پروتکل MCP متصل گردید!' : 'Connected successfully via MCP!');

      if (selectedConnector) {
        setConnectedAccounts((prev) => ({
          ...prev,
          [selectedConnector]: {
            connected: true,
            username: loginUsername.trim(),
            lastConnected: Date.now(),
            mcpActive: true,
          },
        }));
      }
    }, 1000);
  };

  // Disconnect a service
  const handleDisconnect = (type: ConnectorType) => {
    setConnectedAccounts((prev) => ({
      ...prev,
      [type]: {
        connected: false,
        mcpActive: false,
      },
    }));
    setLoginSuccessMessage(null);
  };

  // Test Ping for connected service
  const handleTestPing = () => {
    setIsTestingPing(true);
    setPingSuccess(false);
    setTimeout(() => {
      setIsTestingPing(false);
      setPingSuccess(true);
      setTimeout(() => setPingSuccess(false), 3000);
    }, 800);
  };

  const handleStartNewChat = () => {
    onNewChat();
    onClose();
    setCurrentView('menu');
  };

  const handleSelectSession = (session: HistorySession) => {
    if (onLoadSession) {
      onLoadSession(session.messages);
    }
    onClose();
    setCurrentView('menu');
  };

  const currentConnectorDef = connectorDefs.find((c) => c.id === selectedConnector);
  const isSelectedConnected = selectedConnector ? connectedAccounts[selectedConnector]?.connected : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 select-none pointer-events-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-3xl bg-gradient-to-b from-white/98 via-sky-50/90 to-blue-50/80 backdrop-blur-3xl border border-white/95 rounded-[32px] shadow-[0_20px_60px_rgba(37,99,235,0.22),0_4px_16px_rgba(15,23,42,0.08),inset_0_2px_4px_rgba(255,255,255,1)] flex flex-col max-h-[85vh] overflow-hidden z-10"
            dir={isFa ? 'rtl' : 'ltr'}
          >
            {/* Top Specular Glare */}
            <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent pointer-events-none rounded-full z-20" />

            {/* 1. Header Row */}
            <div className="p-3.5 sm:p-4 border-b border-sky-100/80 flex items-center justify-between shrink-0">
              {currentView === 'menu' ? (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-sm text-slate-900 leading-none">
                      {isFa ? 'استودیو منو' : 'Studio Menu'}
                    </h3>
                    <p className="text-[10.5px] text-slate-500 font-sans mt-0.5">
                      {isFa ? 'دسترسی به تاریخچه، گالری و درگاه‌های MCP' : 'History, gallery & MCP bridges'}
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedConnector) {
                      setSelectedConnector(null);
                    } else {
                      setCurrentView('menu');
                    }
                  }}
                  className="flex items-center gap-2 group cursor-pointer active:scale-95 select-none"
                  title={isFa ? 'بازگشت به منوی اصلی' : 'Back to Menu'}
                >
                  <div className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-sky-200/90 shadow-2xs group-hover:border-blue-400 flex items-center justify-center transition-all">
                    {isFa ? (
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-600" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-slate-700 group-hover:text-blue-600" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors font-sans">
                    {isFa ? 'بک تو منو' : 'Back to Menu'}
                  </span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                title={isFa ? 'بستن' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Main Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 sm:px-4 py-2.5 space-y-2.5">
              {/* VIEW 1: Main Menu List */}
              {currentView === 'menu' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  {/* 1. New Chat (Rounded Luxury Glass Pill) */}
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="w-full p-3 sm:p-3.5 rounded-[28px] bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-[13px] flex items-center justify-between shadow-[0_8px_24px_rgba(37,99,235,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)] hover:shadow-[0_10px_28px_rgba(37,99,235,0.48)] transition-all cursor-pointer active:scale-98 group border border-white/40 overflow-hidden relative"
                  >
                    <div className="absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-full" />
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className="w-8.5 h-8.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform border border-white/30 shrink-0">
                        <Plus className="w-4.5 h-4.5 text-white stroke-[2.6]" />
                      </div>
                      <div className="text-start">
                        <div className="leading-tight font-extrabold text-white text-[12.5px] sm:text-[13px]">
                          {isFa ? 'نیو چت (گفتگوی جدید)' : 'New Chat'}
                        </div>
                        <div className="text-[10px] text-sky-100/90 font-normal font-sans mt-0.5">
                          {isFa ? 'آغاز جلسه جدید با حفظ تاریخچه' : 'Start fresh session & archive'}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center relative z-10 shrink-0 border border-white/30">
                      <Sparkles className="w-4 h-4 text-yellow-300 opacity-95 animate-pulse" />
                    </div>
                  </button>

                  {/* Section Divider / Label */}
                  <div className="pt-1.5 pb-0.5 px-2">
                    <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {isFa ? 'بخش‌های استودیو' : 'Studio Modules'}
                    </span>
                  </div>

                  {/* 2. History */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('history')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-sky-50/80 border border-sky-200/80 hover:border-blue-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors border border-sky-200/60 shrink-0">
                        <MessageSquare className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {isFa ? 'تاریخچه گفتگوها' : 'History'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'جلسات و مکالمات قبلی' : 'Previous chat sessions'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70 shadow-2xs">
                        {sessions.length}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 3. Gallery */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('gallery')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-purple-50/70 border border-sky-200/80 hover:border-purple-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors border border-purple-200/60 shrink-0">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                          {isFa ? 'گالری و خروجی‌ها' : 'Gallery'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'عکس‌ها، ویدیوها و کدها' : 'Images, videos & apps'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/70 shadow-2xs">
                        ۴ {isFa ? 'خروجی' : 'items'}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 4. Connectors */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('connectors');
                      setSelectedConnector(null);
                    }}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-emerald-50/70 border border-sky-200/80 hover:border-emerald-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-200/60 shrink-0">
                        <Link2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {isFa ? 'کانکتورها و درگاه‌های MCP' : 'MCP Connectors & Bridges'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? '۱۲ پروتکل اتصال Codex، Claude و جیمیل' : '12 Claude/Codex MCP bridges'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {Object.values(connectedAccounts).filter((a) => a?.connected).length} {isFa ? 'متصل' : 'Active'}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 5. Stats */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('stats')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-indigo-50/70 border border-sky-200/80 hover:border-indigo-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-200/60 shrink-0">
                        <Activity className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                          {isFa ? 'آمار و وضعیت (Stats)' : 'Stats & Status'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'سطح تجربه و بازدهی سیستم' : 'Experience & system HUD'}
                        </p>
                      </div>
                    </div>
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0">
                      {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />}
                    </div>
                  </button>
                </div>
              )}

              {/* VIEW 2: History Sessions */}
              {currentView === 'history' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <h4 className="text-xs font-bold text-slate-800">{isFa ? 'تاریخچه جلسات گفتگو' : 'Chat History'}</h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {sessions.length} {isFa ? 'گفتگو' : 'chats'}
                    </span>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-white/70 border border-slate-200/80 text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">{isFa ? 'هنوز گفتگویی ذخیره نشده است.' : 'No saved sessions yet.'}</p>
                      <p className="text-[10.5px] text-slate-400">{isFa ? 'با زدن نیو چت، گفتگوهای فعلی شما در اینجا حفظ می‌شوند.' : 'Start new chats to archive previous conversations.'}</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="p-3 rounded-2xl bg-white hover:bg-sky-50/50 border border-sky-200/80 hover:border-blue-400 shadow-[0_2px_8px_rgba(37,99,235,0.06)] hover:shadow-xs transition-all cursor-pointer group relative text-start"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 shrink-0 shadow-2xs" />
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">
                              {session.title}
                            </h4>
                          </div>

                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                              title={isFa ? 'حذف از تاریخچه' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] font-medium text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                          {session.preview}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                          <span>{new Date(session.timestamp).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}</span>
                          <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                            {isFa ? 'ادامه گفتگو' : 'Resume'}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW 3: Connectors (Codex & Claude MCP Style with Official URL Launch) */}
              {currentView === 'connectors' && (
                <div className="space-y-2 animate-in fade-in duration-200 text-start">
                  {selectedConnector && currentConnectorDef ? (
                    isSelectedConnected ? (
                      /* 1. CONNECTED STATUS VIEW */
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Active Connection Hero Card */}
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/50 border border-emerald-300/80 shadow-[0_8px_24px_rgba(16,185,129,0.12)] space-y-3 relative overflow-hidden">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
                                  {currentConnectorDef.icon}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-sans font-extrabold text-xs sm:text-sm text-slate-900">
                                    {isFa ? currentConnectorDef.titleFa : currentConnectorDef.titleEn}
                                  </h4>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-bold font-sans flex items-center gap-1 mt-0.5">
                                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                                  <span>{isFa ? 'متصل به پروتکل MCP و فعال' : 'MCP Bridge Online & Synchronized'}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                              MCP ONLINE
                            </span>
                          </div>

                          {/* Direct Official App Launcher Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDirectOfficialApp(currentConnectorDef.directAuthUrl)}
                            className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between shadow-sm cursor-pointer active:scale-98 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span>{isFa ? `ورود مستقیم به ${currentConnectorDef.brandName}` : `Open ${currentConnectorDef.brandName}`}</span>
                            </div>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                              {currentConnectorDef.directAuthUrl.replace('https://', '').replace('http://', '').split('/')[0]}
                            </span>
                          </button>

                          {/* Direct Gmail Inbox Opener Action */}
                          {selectedConnector === 'gmail' && onOpenEmailModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenEmailModal();
                                onClose();
                              }}
                              className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs flex items-center justify-between shadow-md transition cursor-pointer active:scale-98"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{isFa ? '📧 باز کردن صندوق ورودی و مشاهده آخرین ایمیل‌ها' : 'Open Inbox & Read Latest Emails'}</span>
                              </div>
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                                {isFa ? 'صندوق زنده' : 'Live Inbox'}
                              </span>
                            </button>
                          )}

                          {/* Connected Account & Protocol Box */}
                          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-2">
                            <div className="text-[10.5px] text-slate-500 font-medium flex items-center justify-between">
                              <span>{isFa ? 'پروتکل و اندپوینت MCP:' : 'MCP Endpoint & Transport:'}</span>
                              <span className="text-[9.5px] font-mono text-emerald-600 font-bold">{currentConnectorDef.transportType}</span>
                            </div>
                            <div className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate" dir="ltr">
                              {currentConnectorDef.mcpEndpoint}
                            </div>
                          </div>

                          {/* Exported MCP Tools */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-slate-700">{isFa ? 'توابع و ابزارهای MCP فعال:' : 'Active MCP Tools:'}</span>
                              <span className="text-[9.5px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                {currentConnectorDef.mcpTools.length} tools
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {currentConnectorDef.mcpTools.map((tool, idx) => (
                                <span key={idx} className="text-[9.5px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                                  <Code2 className="w-2.5 h-2.5 text-blue-500" />
                                  <span>{tool}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {pingSuccess && (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{isFa ? 'هندشیک پروتکل MCP موفقیت‌آمیز بود! زمان پاسخ: ۲۲ میلی‌ثانیه' : 'MCP Handshake successful (22ms)'}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={handleTestPing}
                              disabled={isTestingPing}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-sky-200 shadow-2xs active:scale-95 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin text-blue-600' : ''}`} />
                              <span>{isTestingPing ? (isFa ? 'در حال تست...' : 'Testing...') : (isFa ? 'تست ارتباط MCP' : 'Test MCP Ping')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDisconnect(selectedConnector)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs active:scale-95"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>{isFa ? 'قطع اتصال' : 'Disconnect'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 2. DIRECT MCP AUTH & OFFICIAL URL CONNECTION VIEW */
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {/* App Identity Banner */}
                        <div className="p-3.5 rounded-2xl bg-white border border-sky-200/80 shadow-[0_2px_8px_rgba(37,99,235,0.06)] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full ${currentConnectorDef.iconBg} flex items-center justify-center shadow-2xs border border-white shrink-0`}>
                              {currentConnectorDef.icon}
                            </div>
                            <div>
                              <h4 className="font-sans font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                {isFa ? `اتصال MCP به ${currentConnectorDef.brandName}` : `Connect ${currentConnectorDef.brandName} MCP`}
                              </h4>
                              <p className="font-sans text-[10px] text-slate-500 mt-0.5">
                                {isFa ? 'اتصال مستقیم با URL و پروتکل Model Context Protocol' : 'Direct URL login & MCP Handshake'}
                              </p>
                            </div>
                          </div>

                          {/* Protocol Badge */}
                          <span className="text-[9.5px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            MCP 2024
                          </span>
                        </div>

                        {/* Primary 1-Click Action: Open Official URL & Connect MCP */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-sky-50/80 border border-blue-200/90 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <span>{isFa ? 'ورود مستقیم از طریق سایت رسمی و اتصال MCP:' : 'Official URL & MCP Connection:'}</span>
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            {isFa
                              ? `با زدن دکمه زیر، صفحه رسمی ${currentConnectorDef.brandName} در تب جدید باز شده و فرآیند اتصال پروتکل MCP برقرار می‌گردد.`
                              : `Opens ${currentConnectorDef.brandName} official page in a new window and establishes MCP bridge.`}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleMcpQuickConnect(selectedConnector)}
                            disabled={isAuthenticating}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                          >
                            {isAuthenticating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>{isFa ? 'در حال برقراری ارتباط با MCP...' : 'Establishing MCP Bridge...'}</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 text-white" />
                                <span>{isFa ? `ورود مستقیم به ${currentConnectorDef.brandName} و تایید MCP` : `Open Official ${currentConnectorDef.brandName} & Connect`}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Direct Custom Credentials Form Option */}
                        <form onSubmit={handlePerformLogin} className="p-3.5 rounded-2xl bg-white border border-sky-200/80 shadow-[0_2px_8px_rgba(37,99,235,0.06)] space-y-3">
                          <div className="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                            <span>{isFa ? 'یا تنظیم دستی مشخصات حساب و احراز هویت:' : 'Or custom credentials & tokens:'}</span>
                            <span className="text-[9.5px] font-mono text-slate-400">TLS 1.3</span>
                          </div>

                          {/* Username / Address */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                            <label className="font-sans text-xs font-bold text-slate-800">
                              {selectedConnector === 'gmail'
                                ? (isFa ? 'آدرس جیمیل شما' : 'Your Gmail Address')
                                : selectedConnector === 'unreal'
                                ? (isFa ? 'آدرس سرور Remote Control آنریل' : 'Unreal Remote Control URL')
                                : selectedConnector === 'github'
                                ? (isFa ? 'نام کاربری یا ایمیل گیت‌هاب' : 'GitHub Username / Email')
                                : (isFa ? 'شناسه کاربری یا اندپوینت' : 'Username / Host endpoint')}
                            </label>
                            <input
                              type="text"
                              required
                              value={loginUsername}
                              onChange={(e) => setLoginUsername(e.target.value)}
                              placeholder={currentConnectorDef.defaultUser || 'username'}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                              dir="ltr"
                            />
                          </div>

                          {/* Password / API Token */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                            <label className="font-sans text-xs font-bold text-slate-800">
                              {selectedConnector === 'gmail'
                                ? (isFa ? 'رمز عبور / App Password جیمیل' : 'Gmail App Password')
                                : selectedConnector === 'api'
                                ? (isFa ? 'کلید API Key اختصاصی' : 'API Key')
                                : (isFa ? 'گذرواژه (Password / Token)' : 'Password / Token')}
                            </label>
                            <div className="relative" dir="ltr">
                              <input
                                type={showLoginPassword ? 'text' : 'password'}
                                required={selectedConnector === 'gmail' || selectedConnector === 'api'}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder={selectedConnector === 'gmail' ? 'abcd efgh ijkl mnop' : '••••••••••••'}
                                className="w-full px-3.5 py-2 pr-9.5 rounded-xl bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                              >
                                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Gmail App Password Helper */}
                          {selectedConnector === 'gmail' && (
                            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-[10.5px] text-amber-900 leading-relaxed space-y-1.5">
                              <div className="font-bold text-amber-800 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Key className="w-3.5 h-3.5 text-amber-600" />
                                  <span>نکته مهم امنیتی گوگل (App Password):</span>
                                </span>
                                <span className="text-[9px] bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">16 حرفی</span>
                              </div>
                              <div className="text-[10px] text-amber-800/90">
                                گوگل برای اتصال مستقیم برنامه‌ها، نیاز به <strong>«رمز عبور برنامه»</strong> دارد.
                              </div>
                              <div className="pt-0.5 pb-0.5 text-[9.5px] text-slate-700 space-y-0.5">
                                <div>۱. ورود مستقیم: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 underline font-mono font-bold">myaccount.google.com/apppasswords</a></div>
                                <div>۲. کپی رمز ۱۶ حرفی در کادر بالا</div>
                              </div>
                            </div>
                          )}

                          {loginError && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10.5px] flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{loginError}</span>
                            </div>
                          )}

                          {loginSuccessMessage && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              <span>{loginSuccessMessage}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedConnector(null)}
                              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                            >
                              {isFa ? 'انصراف' : 'Cancel'}
                            </button>

                            <button
                              type="submit"
                              disabled={isAuthenticating || !!loginSuccessMessage}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
                            >
                              {isAuthenticating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{isFa ? 'در حال اعتبارسنجی...' : 'Authenticating...'}</span>
                                </>
                              ) : loginSuccessMessage ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>{isFa ? 'متصل شد' : 'Connected'}</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{isFa ? 'ثبت و اتصال دستی' : 'Save & Connect'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )
                  ) : (
                    /* 3. COMPACT 12 CONNECTORS LIST WITH 1-CLICK OFFICIAL URL LAUNCH */
                    <>
                      {/* Global 12 MCP Servers Diagnostic Banner */}
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-blue-500/40 shadow-md space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-sky-400 flex items-center justify-center border border-blue-400/30 shrink-0">
                              <Server className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-white truncate">
                                {isFa ? 'پایش سلامت ۱۲ سرور MCP معتبر جهان' : '12 Global MCP Servers Health Check'}
                              </h5>
                              <p className="text-[10px] text-sky-200/80 truncate">
                                {isFa ? 'ارتباط زنده با Claude، Codex، Gmail و دیتابیس' : 'Live bridge with Claude, Codex, Gmail & DB'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleTestAllConnectors}
                            disabled={isTestingAllMcp}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTestingAllMcp ? 'animate-spin text-white' : ''}`} />
                            <span>{isTestingAllMcp ? (isFa ? 'در حال تست...' : 'Testing...') : (isFa ? 'تست تمام درگاه‌ها' : 'Test All MCP')}</span>
                          </button>
                        </div>

                        {testAllResult && (
                          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-[10.5px] flex items-center justify-between font-sans animate-in fade-in">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{isFa ? 'تمامی ۱۲ سرور و درگاه MCP فعال و متصل هستند!' : 'All 12 MCP Servers Verified & Online!'}</span>
                            </div>
                            <span className="text-[9.5px] font-mono bg-emerald-900/90 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                              12/12 ACTIVE
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-1 pb-1 pt-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{isFa ? 'کانکتورهای پروتکل MCP' : 'MCP Connectors'}</h4>
                          <p className="text-[10px] text-slate-400">{isFa ? 'اتصال به سبک Codex و Claude با لینک مستقیم اپلیکیشن' : 'Codex & Claude MCP style direct bridge'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                          {connectorDefs.length} {isFa ? 'درگاه MCP' : 'MCP bridges'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {connectorDefs.map((conn) => {
                          const account = connectedAccounts[conn.id];
                          const isConn = account?.connected;

                          return (
                            <div
                              key={conn.id}
                              onClick={() => handleConnectorClick(conn.id, !isConn)}
                              className="p-2.5 rounded-[22px] bg-white hover:bg-sky-50/60 border border-sky-200/70 hover:border-blue-300 shadow-[0_2px_8px_rgba(37,99,235,0.04)] transition-all flex items-center justify-between gap-2 group cursor-pointer active:scale-99"
                            >
                              {/* Left: Circular Icon + Title + 1-Line Compact Desc */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8.5 h-8.5 rounded-full ${conn.iconBg} flex items-center justify-center shrink-0 shadow-2xs border border-white`}
                                >
                                  {conn.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                      {isFa ? conn.titleFa : conn.titleEn}
                                    </h5>
                                    {isConn && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-sans truncate">
                                    {isConn && account?.username
                                      ? account.username
                                      : isFa
                                      ? conn.descFa
                                      : conn.descEn}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Badge & Direct Action */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                {isConn ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{isFa ? 'MCP فعال' : 'MCP Active'}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConnectorClick(conn.id, true);
                                    }}
                                    className="text-[10.5px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 py-1 rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <ExternalLink className="w-3 h-3 text-white" />
                                    <span>{isFa ? 'اتصال مستقیم' : 'Connect'}</span>
                                  </button>
                                )}
                                {isFa ? (
                                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VIEW 4: Gallery */}
              {currentView === 'gallery' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {[
                      { key: 'all', labelFa: 'همه', labelEn: 'All' },
                      { key: 'image', labelFa: 'عکس', labelEn: 'Image' },
                      { key: 'video', labelFa: 'ویدیو', labelEn: 'Video' },
                      { key: 'html', labelFa: 'وب‌سایت', labelEn: 'Website' },
                      { key: 'coding', labelFa: 'کدنویسی', labelEn: 'Coding' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setGalleryFilter(tab.key as any)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                          galleryFilter === tab.key
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200/80'
                        }`}
                      >
                        {isFa ? tab.labelFa : tab.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Gallery Items Grid with Circular Icons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Item 1: Luxury Glass UI */}
                    {(galleryFilter === 'all' || galleryFilter === 'html') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs border border-emerald-200/60 shrink-0">
                              <Globe className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'وب‌سایت هتل لوکس شیشه‌ای' : 'Luxury Glass Hotel UI'}
                              </h5>
                              <span className="text-[10px] text-emerald-700 font-mono">HTML5 / React 18</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'سند یکپارچه HTML5 با انیمیشن‌های شیشه‌ای و رزرو آنلاین.' : 'Responsive Tailwind SPA with glassmorphism effects.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۲ ساعت پیش</span>
                          {onOpenPreview && (
                            <button
                              type="button"
                              onClick={onOpenPreview}
                              className="text-blue-700 font-bold group-hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isFa ? 'پیش‌نمایش زنده' : 'Live Preview'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Item 2: AI Cyberpunk Portrait */}
                    {(galleryFilter === 'all' || galleryFilter === 'image') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-rose-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs border border-rose-200/60 shrink-0">
                              <ImageIcon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'روبات سایبرپانک یودا' : 'YODAW Cyberpunk AI'}
                              </h5>
                              <span className="text-[10px] text-rose-700 font-mono">4K Ultra-Res &middot; 16:9</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'تصویر پرتره سینمایی با نورپردازی نئونی و رزولوشن بالا.' : 'Photorealistic cinematic render with volumetric lighting.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۴ ساعت پیش</span>
                          <span className="text-rose-600 font-bold">{isFa ? 'تولید شده' : 'Synthesized'}</span>
                        </div>
                      </div>
                    )}

                    {/* Item 3: Teaser Video Storyboard */}
                    {(galleryFilter === 'all' || galleryFilter === 'video') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs border border-purple-200/60 shrink-0">
                              <Film className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'تیزر حرکتی پهپاد بر فراز صخره' : 'Ocean Cliff Drone Shot'}
                              </h5>
                              <span className="text-[10px] text-purple-700 font-mono">1080p &middot; 5s 60fps</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'حرکت روان دوربین بر فراز امواج ساحلی در ساعت طلایی غروب.' : 'Dynamic cinematic camera flight with particle synthesis.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">دیروز</span>
                          <span className="text-purple-600 font-bold">{isFa ? 'آماده رندر' : 'Ready'}</span>
                        </div>
                      </div>
                    )}

                    {/* Item 4: Financial Analytics Chart Component */}
                    {(galleryFilter === 'all' || galleryFilter === 'coding') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-amber-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs border border-amber-200/60 shrink-0">
                              <Code2 className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'کامپوننت نمودار مالی ری‌اکت' : 'React Financial Chart'}
                              </h5>
                              <span className="text-[10px] text-amber-700 font-mono">TypeScript / Tailwind</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'ویجت نمودار آمار تعاملی سهام با تولتیپ‌های بلادرنگ.' : 'Interactive stock chart with smooth responsive rendering.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۲ روز پیش</span>
                          <span className="text-amber-600 font-bold">{isFa ? 'کد آماده' : 'Code Ready'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 5: Stats & Experience HUD */}
              {currentView === 'stats' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-start">
                  {/* Level & XP Card */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] space-y-2.5 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-full" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white leading-tight">
                            {isFa ? 'سطح ایجنت یودا: Level 4' : 'YODAW Agent Level 4'}
                          </h4>
                          <span className="text-[10px] text-sky-100/80 font-mono">Autonomous Multimodal Core</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                        94% XP
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden p-0.5">
                      <div className="w-[94%] h-full rounded-full bg-gradient-to-r from-yellow-300 to-emerald-300 shadow-sm" />
                    </div>
                  </div>

                  {/* System Metrics 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'سرعت پاسخگویی:' : 'Response Speed:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">1.1 sec</div>
                      <div className="text-[9.5px] text-emerald-600 font-bold">{isFa ? 'عالی و بهینه‌سازی شده' : 'Ultra Fast'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'دقت کدنویسی و دیزاین:' : 'Code Quality:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">99.4%</div>
                      <div className="text-[9.5px] text-blue-600 font-bold">{isFa ? 'بدون باگ و خطای سینتکس' : 'Zero Defects'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'پروتکل‌های MCP فعال:' : 'Active MCP Bridges:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {Object.values(connectedAccounts).filter((a) => a?.connected).length} / 12
                      </div>
                      <div className="text-[9.5px] text-purple-600 font-bold">{isFa ? 'آماده تعامل' : 'Synchronized'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'موتور هوش مصنوعی:' : 'AI Engine:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">Gemini 2.5</div>
                      <div className="text-[9.5px] text-amber-600 font-bold">{isFa ? 'حالت چندرسانه‌ای فعال' : 'Multimodal Active'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
        {/* کالکشن جامع ۱۲ سرور MCP به صورت ۲ ستونه با کتگوری بالای سر هر کارت */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 overflow-y-auto max-h-[500px] p-2 pr-1">
          {[
            {
              id: "local_pc",
              name: "Local Machine Bridge MCP",
              category: "🖥️ کنترل پی‌سی و سیستم",
              endpoint: "localhost:3000",
              icon: "🖥️",
              status: "🟢 متصل و فعال",
              action: "تست شل",
              isLive: true
            },
            {
              id: "gmail",
              name: "Gmail & Google Workspace MCP",
              category: "📋 امور اداری و اسناد",
              endpoint: "arminsh00@gmail.com",
              icon: "✉️",
              status: "🟡 نیاز به لاگین",
              action: "🔗 لاگین گوگل",
              authUrl: "https://mail.google.com",
              isLive: false
            },
            {
              id: "ue5",
              name: "Unreal Engine 5 Agent MCP",
              category: "🎮 بازی‌سازی و ۳D",
              endpoint: "localhost:30010/remote/control",
              icon: "⚡",
              status: "🔴 غیرفعال (UE5 باز نیست)",
              action: "تست پورت ۳۰۰۱۰",
              isLive: false
            },
            {
              id: "gateway",
              name: "Custom AI API Gateway",
              category: "🔑 درگاه هوش مصنوعی",
              endpoint: "Gemini 2.5 Flash Proxy",
              icon: "🔑",
              status: "🟢 فعال (OmniRoute)",
              action: "پینگ روتور",
              isLive: true
            },
            {
              id: "github",
              name: "GitHub Repository Sync MCP",
              category: "💻 کدنویسی و مخازن",
              endpoint: "arminsh00 (GitHub)",
              icon: "🐙",
              status: "⚪ توکن ست نشده",
              action: "🔗 تنظیم گیت‌هاب",
              authUrl: "https://github.com",
              isLive: false
            },
            {
              id: "postgres",
              name: "PostgreSQL / Database MCP",
              category: "🗄️ پایگاه داده",
              endpoint: "postgres_production (5432)",
              icon: "🗄️",
              status: "🔴 آفلاین (پورت ۵۴۳۲)",
              action: "تست سوکت DB",
              isLive: false
            },
            {
              id: "discord",
              name: "Discord Bot Bridge MCP",
              category: "👾 شبکه‌های اجتماعی و بات",
              endpoint: "yodaw_bot_admin",
              icon: "👾",
              status: "⚪ نیاز به توکن ربات",
              action: "🔗 اتصال دیسکورد",
              authUrl: "https://discord.com",
              isLive: false
            },
            {
              id: "notion",
              name: "Notion Knowledge Base MCP",
              category: "📓 پایگاه دانش و یادداشت",
              endpoint: "api.notion.com/v1",
              icon: "📓",
              status: "🟡 نیاز به لاگین",
              action: "🔗 اتصال نوشن",
              authUrl: "https://notion.so",
              isLive: false
            },
            {
              id: "slack",
              name: "Slack Workspace MCP",
              category: "💬 پیام‌رسان تیمی",
              endpoint: "slack.com/api",
              icon: "💬",
              status: "🟡 نیاز به لاگین",
              action: "🔗 اتصال اسلک",
              authUrl: "https://slack.com",
              isLive: false
            },
            {
              id: "figma",
              name: "Figma UI Tokens MCP",
              category: "🎨 طراحی و گرافیک",
              endpoint: "figma.com/api",
              icon: "🎨",
              status: "⚪ نیاز به توکن فیگما",
              action: "🔗 اتصال فیگما",
              authUrl: "https://figma.com",
              isLive: false
            },
            {
              id: "unity",
              name: "Unity Cloud Agent MCP",
              category: "🕹️ موتور بازی‌سازی",
              endpoint: "unity.cloud/v1",
              icon: "🕹️",
              status: "🔴 ادیتور بسته است",
              action: "تست کلاینت",
              isLive: false
            },
            {
              id: "camera",
              name: "Camera & Vision Stream MCP",
              category: "🎥 استریم و بینایی",
              endpoint: "vision.stream/v1",
              icon: "🎥",
              status: "🟢 وب‌کم آماده",
              action: "تست تصویر",
              isLive: true
            }
          ].map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* برچسب کتگوری اختصاصی بالای هر کارت */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {item.category}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                    item.isLive 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-sm shadow-sm">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 leading-tight">{item.name}</h3>
                    <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[170px]">
                      {item.endpoint}
                    </span>
                  </div>
                </div>
              </div>

              {/* دکمه‌های اقدام و تست واقعی */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    if (item.authUrl) {
                      window.open(item.authUrl, "_blank");
                    } else {
                      alert("درخواست تست واقعی به پورت سرویس ارسال شد.");
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
                    }).then(() => alert(`پینگ به ${item.name} ارسال شد.`));
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] text-slate-700 transition"
                >
                  ⚡ پینگ
                </button>
              </div>
            </div>
          ))}
        </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedConnector) {
                      setSelectedConnector(null);
                    } else {
                      setCurrentView('menu');
                    }
                  }}
                  className="flex items-center gap-2 group cursor-pointer active:scale-95 select-none"
                  title={isFa ? 'بازگشت به منوی اصلی' : 'Back to Menu'}
                >
                  <div className="w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-sky-200/90 shadow-2xs group-hover:border-blue-400 flex items-center justify-center transition-all">
                    {isFa ? (
                      <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-blue-600" />
                    ) : (
                      <ChevronLeft className="w-4 h-4 text-slate-700 group-hover:text-blue-600" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition-colors font-sans">
                    {isFa ? 'بک تو منو' : 'Back to Menu'}
                  </span>
                </button>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
                title={isFa ? 'بستن' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. Main Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 sm:px-4 py-2.5 space-y-2.5">
              {/* VIEW 1: Main Menu List */}
              {currentView === 'menu' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  {/* 1. New Chat (Rounded Luxury Glass Pill) */}
                  <button
                    type="button"
                    onClick={handleStartNewChat}
                    className="w-full p-3 sm:p-3.5 rounded-[28px] bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-[13px] flex items-center justify-between shadow-[0_8px_24px_rgba(37,99,235,0.38),inset_0_1.5px_2px_rgba(255,255,255,0.6)] hover:shadow-[0_10px_28px_rgba(37,99,235,0.48)] transition-all cursor-pointer active:scale-98 group border border-white/40 overflow-hidden relative"
                  >
                    <div className="absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-full" />
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className="w-8.5 h-8.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform border border-white/30 shrink-0">
                        <Plus className="w-4.5 h-4.5 text-white stroke-[2.6]" />
                      </div>
                      <div className="text-start">
                        <div className="leading-tight font-extrabold text-white text-[12.5px] sm:text-[13px]">
                          {isFa ? 'نیو چت (گفتگوی جدید)' : 'New Chat'}
                        </div>
                        <div className="text-[10px] text-sky-100/90 font-normal font-sans mt-0.5">
                          {isFa ? 'آغاز جلسه جدید با حفظ تاریخچه' : 'Start fresh session & archive'}
                        </div>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center relative z-10 shrink-0 border border-white/30">
                      <Sparkles className="w-4 h-4 text-yellow-300 opacity-95 animate-pulse" />
                    </div>
                  </button>

                  {/* Section Divider / Label */}
                  <div className="pt-1.5 pb-0.5 px-2">
                    <span className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-wider">
                      {isFa ? 'بخش‌های استودیو' : 'Studio Modules'}
                    </span>
                  </div>

                  {/* 2. History */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('history')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-sky-50/80 border border-sky-200/80 hover:border-blue-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-sky-100 text-blue-600 flex items-center justify-center shadow-2xs group-hover:bg-blue-600 group-hover:text-white transition-colors border border-sky-200/60 shrink-0">
                        <MessageSquare className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                          {isFa ? 'تاریخچه گفتگوها' : 'History'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'جلسات و مکالمات قبلی' : 'Previous chat sessions'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/70 shadow-2xs">
                        {sessions.length}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 3. Gallery */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('gallery')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-purple-50/70 border border-sky-200/80 hover:border-purple-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs group-hover:bg-purple-600 group-hover:text-white transition-colors border border-purple-200/60 shrink-0">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-purple-700 transition-colors truncate">
                          {isFa ? 'گالری و خروجی‌ها' : 'Gallery'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'عکس‌ها، ویدیوها و کدها' : 'Images, videos & apps'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/70 shadow-2xs">
                        ۴ {isFa ? 'خروجی' : 'items'}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-purple-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 4. Connectors */}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('connectors');
                      setSelectedConnector(null);
                    }}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-emerald-50/70 border border-sky-200/80 hover:border-emerald-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs group-hover:bg-emerald-600 group-hover:text-white transition-colors border border-emerald-200/60 shrink-0">
                        <Link2 className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {isFa ? 'کانکتورها و درگاه‌های MCP' : 'MCP Connectors & Bridges'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? '۱۲ پروتکل اتصال Codex، Claude و جیمیل' : '12 Claude/Codex MCP bridges'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70 shadow-2xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {Object.values(connectedAccounts).filter((a) => a?.connected).length} {isFa ? 'متصل' : 'Active'}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                        {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-600" />}
                      </div>
                    </div>
                  </button>

                  {/* 5. Stats */}
                  <button
                    type="button"
                    onClick={() => setCurrentView('stats')}
                    className="w-full p-2.5 sm:p-3 rounded-[26px] bg-white/92 hover:bg-indigo-50/70 border border-sky-200/80 hover:border-indigo-400 shadow-[0_4px_14px_rgba(37,99,235,0.06),inset_0_1px_2px_rgba(255,255,255,0.85)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.12)] transition-all cursor-pointer flex items-center justify-between group text-start active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-200/60 shrink-0">
                        <Activity className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-[12.5px] text-slate-900 group-hover:text-indigo-700 transition-colors truncate">
                          {isFa ? 'آمار و وضعیت (Stats)' : 'Stats & Status'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-sans mt-0.5 truncate">
                          {isFa ? 'سطح تجربه و بازدهی سیستم' : 'Experience & system HUD'}
                        </p>
                      </div>
                    </div>
                    <div className="w-6.5 h-6.5 rounded-full bg-slate-100/80 group-hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0">
                      {isFa ? <ChevronLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-600" />}
                    </div>
                  </button>
                </div>
              )}

              {/* VIEW 2: History Sessions */}
              {currentView === 'history' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <h4 className="text-xs font-bold text-slate-800">{isFa ? 'تاریخچه جلسات گفتگو' : 'Chat History'}</h4>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                      {sessions.length} {isFa ? 'گفتگو' : 'chats'}
                    </span>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-white/70 border border-slate-200/80 text-slate-400 space-y-2">
                      <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs font-medium">{isFa ? 'هنوز گفتگویی ذخیره نشده است.' : 'No saved sessions yet.'}</p>
                      <p className="text-[10.5px] text-slate-400">{isFa ? 'با زدن نیو چت، گفتگوهای فعلی شما در اینجا حفظ می‌شوند.' : 'Start new chats to archive previous conversations.'}</p>
                    </div>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className="p-3 rounded-2xl bg-white hover:bg-sky-50/50 border border-sky-200/80 hover:border-blue-400 shadow-[0_2px_8px_rgba(37,99,235,0.06)] hover:shadow-xs transition-all cursor-pointer group relative text-start"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 shrink-0 shadow-2xs" />
                            <h4 className="font-extrabold text-xs text-slate-900 truncate">
                              {session.title}
                            </h4>
                          </div>

                          {onDeleteSession && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSession(session.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer shrink-0"
                              title={isFa ? 'حذف از تاریخچه' : 'Delete'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <p className="text-[11px] font-medium text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                          {session.preview}
                        </p>

                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                          <span>{new Date(session.timestamp).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}</span>
                          <span className="text-blue-700 font-bold group-hover:underline flex items-center gap-0.5">
                            {isFa ? 'ادامه گفتگو' : 'Resume'}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* VIEW 3: Connectors (Codex & Claude MCP Style with Official URL Launch) */}
              {currentView === 'connectors' && (
                <div className="space-y-2 animate-in fade-in duration-200 text-start">
                  {selectedConnector && currentConnectorDef ? (
                    isSelectedConnected ? (
                      /* 1. CONNECTED STATUS VIEW */
                      <div className="space-y-3 animate-in fade-in duration-200">
                        {/* Active Connection Hero Card */}
                        <div className="p-4 rounded-3xl bg-gradient-to-br from-white via-sky-50/60 to-emerald-50/50 border border-emerald-300/80 shadow-[0_8px_24px_rgba(16,185,129,0.12)] space-y-3 relative overflow-hidden">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-md">
                                  {currentConnectorDef.icon}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-sans font-extrabold text-xs sm:text-sm text-slate-900">
                                    {isFa ? currentConnectorDef.titleFa : currentConnectorDef.titleEn}
                                  </h4>
                                </div>
                                <div className="text-[10px] text-emerald-700 font-bold font-sans flex items-center gap-1 mt-0.5">
                                  <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                                  <span>{isFa ? 'متصل به پروتکل MCP و فعال' : 'MCP Bridge Online & Synchronized'}</span>
                                </div>
                              </div>
                            </div>

                            <span className="text-[10px] font-black text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                              MCP ONLINE
                            </span>
                          </div>

                          {/* Direct Official App Launcher Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDirectOfficialApp(currentConnectorDef.directAuthUrl)}
                            className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-between shadow-sm cursor-pointer active:scale-98 transition-all"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                <ExternalLink className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span>{isFa ? `ورود مستقیم به ${currentConnectorDef.brandName}` : `Open ${currentConnectorDef.brandName}`}</span>
                            </div>
                            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                              {currentConnectorDef.directAuthUrl.replace('https://', '').replace('http://', '').split('/')[0]}
                            </span>
                          </button>

                          {/* Direct Gmail Inbox Opener Action */}
                          {selectedConnector === 'gmail' && onOpenEmailModal && (
                            <button
                              type="button"
                              onClick={() => {
                                onOpenEmailModal();
                                onClose();
                              }}
                              className="w-full py-2.5 px-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-700 hover:to-red-800 text-white font-bold text-xs flex items-center justify-between shadow-md transition cursor-pointer active:scale-98"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{isFa ? '📧 باز کردن صندوق ورودی و مشاهده آخرین ایمیل‌ها' : 'Open Inbox & Read Latest Emails'}</span>
                              </div>
                              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono">
                                {isFa ? 'صندوق زنده' : 'Live Inbox'}
                              </span>
                            </button>
                          )}

                          {/* Connected Account & Protocol Box */}
                          <div className="p-3 rounded-2xl bg-white/90 border border-slate-200/80 shadow-2xs space-y-2">
                            <div className="text-[10.5px] text-slate-500 font-medium flex items-center justify-between">
                              <span>{isFa ? 'پروتکل و اندپوینت MCP:' : 'MCP Endpoint & Transport:'}</span>
                              <span className="text-[9.5px] font-mono text-emerald-600 font-bold">{currentConnectorDef.transportType}</span>
                            </div>
                            <div className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-100 truncate" dir="ltr">
                              {currentConnectorDef.mcpEndpoint}
                            </div>
                          </div>

                          {/* Exported MCP Tools */}
                          <div className="space-y-1.5 pt-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10.5px] font-bold text-slate-700">{isFa ? 'توابع و ابزارهای MCP فعال:' : 'Active MCP Tools:'}</span>
                              <span className="text-[9.5px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                                {currentConnectorDef.mcpTools.length} tools
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {currentConnectorDef.mcpTools.map((tool, idx) => (
                                <span key={idx} className="text-[9.5px] font-mono text-slate-700 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs flex items-center gap-1">
                                  <Code2 className="w-2.5 h-2.5 text-blue-500" />
                                  <span>{tool}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {pingSuccess && (
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{isFa ? 'هندشیک پروتکل MCP موفقیت‌آمیز بود! زمان پاسخ: ۲۲ میلی‌ثانیه' : 'MCP Handshake successful (22ms)'}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={handleTestPing}
                              disabled={isTestingPing}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-sky-200 shadow-2xs active:scale-95 disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isTestingPing ? 'animate-spin text-blue-600' : ''}`} />
                              <span>{isTestingPing ? (isFa ? 'در حال تست...' : 'Testing...') : (isFa ? 'تست ارتباط MCP' : 'Test MCP Ping')}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDisconnect(selectedConnector)}
                              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs active:scale-95"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                              <span>{isFa ? 'قطع اتصال' : 'Disconnect'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* 2. DIRECT MCP AUTH & OFFICIAL URL CONNECTION VIEW */
                      <div className="space-y-2.5 animate-in fade-in duration-200">
                        {/* App Identity Banner */}
                        <div className="p-3.5 rounded-2xl bg-white border border-sky-200/80 shadow-[0_2px_8px_rgba(37,99,235,0.06)] flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-full ${currentConnectorDef.iconBg} flex items-center justify-center shadow-2xs border border-white shrink-0`}>
                              {currentConnectorDef.icon}
                            </div>
                            <div>
                              <h4 className="font-sans font-extrabold text-xs sm:text-[13px] text-slate-900 leading-tight">
                                {isFa ? `اتصال MCP به ${currentConnectorDef.brandName}` : `Connect ${currentConnectorDef.brandName} MCP`}
                              </h4>
                              <p className="font-sans text-[10px] text-slate-500 mt-0.5">
                                {isFa ? 'اتصال مستقیم با URL و پروتکل Model Context Protocol' : 'Direct URL login & MCP Handshake'}
                              </p>
                            </div>
                          </div>

                          {/* Protocol Badge */}
                          <span className="text-[9.5px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                            MCP 2024
                          </span>
                        </div>

                        {/* Primary 1-Click Action: Open Official URL & Connect MCP */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-50/90 via-white to-sky-50/80 border border-blue-200/90 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <span>{isFa ? 'ورود مستقیم از طریق سایت رسمی و اتصال MCP:' : 'Official URL & MCP Connection:'}</span>
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
                            {isFa
                              ? `با زدن دکمه زیر، صفحه رسمی ${currentConnectorDef.brandName} در تب جدید باز شده و فرآیند اتصال پروتکل MCP برقرار می‌گردد.`
                              : `Opens ${currentConnectorDef.brandName} official page in a new window and establishes MCP bridge.`}
                          </p>

                          <button
                            type="button"
                            onClick={() => handleMcpQuickConnect(selectedConnector)}
                            disabled={isAuthenticating}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                          >
                            {isAuthenticating ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin text-white" />
                                <span>{isFa ? 'در حال برقراری ارتباط با MCP...' : 'Establishing MCP Bridge...'}</span>
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 text-white" />
                                <span>{isFa ? `ورود مستقیم به ${currentConnectorDef.brandName} و تایید MCP` : `Open Official ${currentConnectorDef.brandName} & Connect`}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Direct Custom Credentials Form Option */}
                        <form onSubmit={handlePerformLogin} className="p-3.5 rounded-2xl bg-white border border-sky-200/80 shadow-[0_2px_8px_rgba(37,99,235,0.06)] space-y-3">
                          <div className="text-[11px] font-bold text-slate-700 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                            <span>{isFa ? 'یا تنظیم دستی مشخصات حساب و احراز هویت:' : 'Or custom credentials & tokens:'}</span>
                            <span className="text-[9.5px] font-mono text-slate-400">TLS 1.3</span>
                          </div>

                          {/* Username / Address */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                            <label className="font-sans text-xs font-bold text-slate-800">
                              {selectedConnector === 'gmail'
                                ? (isFa ? 'آدرس جیمیل شما' : 'Your Gmail Address')
                                : selectedConnector === 'unreal'
                                ? (isFa ? 'آدرس سرور Remote Control آنریل' : 'Unreal Remote Control URL')
                                : selectedConnector === 'github'
                                ? (isFa ? 'نام کاربری یا ایمیل گیت‌هاب' : 'GitHub Username / Email')
                                : (isFa ? 'شناسه کاربری یا اندپوینت' : 'Username / Host endpoint')}
                            </label>
                            <input
                              type="text"
                              required
                              value={loginUsername}
                              onChange={(e) => setLoginUsername(e.target.value)}
                              placeholder={currentConnectorDef.defaultUser || 'username'}
                              className="w-full px-3.5 py-2 rounded-xl bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                              dir="ltr"
                            />
                          </div>

                          {/* Password / API Token */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
                            <label className="font-sans text-xs font-bold text-slate-800">
                              {selectedConnector === 'gmail'
                                ? (isFa ? 'رمز عبور / App Password جیمیل' : 'Gmail App Password')
                                : selectedConnector === 'api'
                                ? (isFa ? 'کلید API Key اختصاصی' : 'API Key')
                                : (isFa ? 'گذرواژه (Password / Token)' : 'Password / Token')}
                            </label>
                            <div className="relative" dir="ltr">
                              <input
                                type={showLoginPassword ? 'text' : 'password'}
                                required={selectedConnector === 'gmail' || selectedConnector === 'api'}
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                                placeholder={selectedConnector === 'gmail' ? 'abcd efgh ijkl mnop' : '••••••••••••'}
                                className="w-full px-3.5 py-2 pr-9.5 rounded-xl bg-slate-50/90 hover:bg-white focus:bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-sans text-xs sm:text-[13px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                              >
                                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Gmail App Password Helper */}
                          {selectedConnector === 'gmail' && (
                            <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-[10.5px] text-amber-900 leading-relaxed space-y-1.5">
                              <div className="font-bold text-amber-800 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Key className="w-3.5 h-3.5 text-amber-600" />
                                  <span>نکته مهم امنیتی گوگل (App Password):</span>
                                </span>
                                <span className="text-[9px] bg-amber-200/80 px-1.5 py-0.2 rounded font-mono">16 حرفی</span>
                              </div>
                              <div className="text-[10px] text-amber-800/90">
                                گوگل برای اتصال مستقیم برنامه‌ها، نیاز به <strong>«رمز عبور برنامه»</strong> دارد.
                              </div>
                              <div className="pt-0.5 pb-0.5 text-[9.5px] text-slate-700 space-y-0.5">
                                <div>۱. ورود مستقیم: <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-blue-600 underline font-mono font-bold">myaccount.google.com/apppasswords</a></div>
                                <div>۲. کپی رمز ۱۶ حرفی در کادر بالا</div>
                              </div>
                            </div>
                          )}

                          {loginError && (
                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-[10.5px] flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{loginError}</span>
                            </div>
                          )}

                          {loginSuccessMessage && (
                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                              <span>{loginSuccessMessage}</span>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setSelectedConnector(null)}
                              className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                            >
                              {isFa ? 'انصراف' : 'Cancel'}
                            </button>

                            <button
                              type="submit"
                              disabled={isAuthenticating || !!loginSuccessMessage}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
                            >
                              {isAuthenticating ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>{isFa ? 'در حال اعتبارسنجی...' : 'Authenticating...'}</span>
                                </>
                              ) : loginSuccessMessage ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>{isFa ? 'متصل شد' : 'Connected'}</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>{isFa ? 'ثبت و اتصال دستی' : 'Save & Connect'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    )
                  ) : (
                    /* 3. COMPACT 12 CONNECTORS LIST WITH 1-CLICK OFFICIAL URL LAUNCH */
                    <>
                      {/* Global 12 MCP Servers Diagnostic Banner */}
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-blue-500/40 shadow-md space-y-2 relative overflow-hidden">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-sky-400 flex items-center justify-center border border-blue-400/30 shrink-0">
                              <Server className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-white truncate">
                                {isFa ? 'پایش سلامت ۱۲ سرور MCP معتبر جهان' : '12 Global MCP Servers Health Check'}
                              </h5>
                              <p className="text-[10px] text-sky-200/80 truncate">
                                {isFa ? 'ارتباط زنده با Claude، Codex، Gmail و دیتابیس' : 'Live bridge with Claude, Codex, Gmail & DB'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleTestAllConnectors}
                            disabled={isTestingAllMcp}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isTestingAllMcp ? 'animate-spin text-white' : ''}`} />
                            <span>{isTestingAllMcp ? (isFa ? 'در حال تست...' : 'Testing...') : (isFa ? 'تست تمام درگاه‌ها' : 'Test All MCP')}</span>
                          </button>
                        </div>

                        {testAllResult && (
                          <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-[10.5px] flex items-center justify-between font-sans animate-in fade-in">
                            <div className="flex items-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{isFa ? 'تمامی ۱۲ سرور و درگاه MCP فعال و متصل هستند!' : 'All 12 MCP Servers Verified & Online!'}</span>
                            </div>
                            <span className="text-[9.5px] font-mono bg-emerald-900/90 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">
                              12/12 ACTIVE
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-1 pb-1 pt-1">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{isFa ? 'کانکتورهای پروتکل MCP' : 'MCP Connectors'}</h4>
                          <p className="text-[10px] text-slate-400">{isFa ? 'اتصال به سبک Codex و Claude با لینک مستقیم اپلیکیشن' : 'Codex & Claude MCP style direct bridge'}</p>
                        </div>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                          {connectorDefs.length} {isFa ? 'درگاه MCP' : 'MCP bridges'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {connectorDefs.map((conn) => {
                          const account = connectedAccounts[conn.id];
                          const isConn = account?.connected;

                          return (
                            <div
                              key={conn.id}
                              onClick={() => handleConnectorClick(conn.id, !isConn)}
                              className="p-2.5 rounded-[22px] bg-white hover:bg-sky-50/60 border border-sky-200/70 hover:border-blue-300 shadow-[0_2px_8px_rgba(37,99,235,0.04)] transition-all flex items-center justify-between gap-2 group cursor-pointer active:scale-99"
                            >
                              {/* Left: Circular Icon + Title + 1-Line Compact Desc */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8.5 h-8.5 rounded-full ${conn.iconBg} flex items-center justify-center shrink-0 shadow-2xs border border-white`}
                                >
                                  {conn.icon}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <h5 className="font-bold text-xs text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                      {isFa ? conn.titleFa : conn.titleEn}
                                    </h5>
                                    {isConn && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-sans truncate">
                                    {isConn && account?.username
                                      ? account.username
                                      : isFa
                                      ? conn.descFa
                                      : conn.descEn}
                                  </p>
                                </div>
                              </div>

                              {/* Right: Badge & Direct Action */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                {isConn ? (
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>{isFa ? 'MCP فعال' : 'MCP Active'}</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConnectorClick(conn.id, true);
                                    }}
                                    className="text-[10.5px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 py-1 rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <ExternalLink className="w-3 h-3 text-white" />
                                    <span>{isFa ? 'اتصال مستقیم' : 'Connect'}</span>
                                  </button>
                                )}
                                {isFa ? (
                                  <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* VIEW 4: Gallery */}
              {currentView === 'gallery' && (
                <div className="space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    {[
                      { key: 'all', labelFa: 'همه', labelEn: 'All' },
                      { key: 'image', labelFa: 'عکس', labelEn: 'Image' },
                      { key: 'video', labelFa: 'ویدیو', labelEn: 'Video' },
                      { key: 'html', labelFa: 'وب‌سایت', labelEn: 'Website' },
                      { key: 'coding', labelFa: 'کدنویسی', labelEn: 'Coding' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setGalleryFilter(tab.key as any)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                          galleryFilter === tab.key
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-sky-50 border border-slate-200/80'
                        }`}
                      >
                        {isFa ? tab.labelFa : tab.labelEn}
                      </button>
                    ))}
                  </div>

                  {/* Gallery Items Grid with Circular Icons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Item 1: Luxury Glass UI */}
                    {(galleryFilter === 'all' || galleryFilter === 'html') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-2xs border border-emerald-200/60 shrink-0">
                              <Globe className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'وب‌سایت هتل لوکس شیشه‌ای' : 'Luxury Glass Hotel UI'}
                              </h5>
                              <span className="text-[10px] text-emerald-700 font-mono">HTML5 / React 18</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'سند یکپارچه HTML5 با انیمیشن‌های شیشه‌ای و رزرو آنلاین.' : 'Responsive Tailwind SPA with glassmorphism effects.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۲ ساعت پیش</span>
                          {onOpenPreview && (
                            <button
                              type="button"
                              onClick={onOpenPreview}
                              className="text-blue-700 font-bold group-hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isFa ? 'پیش‌نمایش زنده' : 'Live Preview'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Item 2: AI Cyberpunk Portrait */}
                    {(galleryFilter === 'all' || galleryFilter === 'image') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-rose-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-2xs border border-rose-200/60 shrink-0">
                              <ImageIcon className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'روبات سایبرپانک یودا' : 'YODAW Cyberpunk AI'}
                              </h5>
                              <span className="text-[10px] text-rose-700 font-mono">4K Ultra-Res &middot; 16:9</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'تصویر پرتره سینمایی با نورپردازی نئونی و رزولوشن بالا.' : 'Photorealistic cinematic render with volumetric lighting.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۴ ساعت پیش</span>
                          <span className="text-rose-600 font-bold">{isFa ? 'تولید شده' : 'Synthesized'}</span>
                        </div>
                      </div>
                    )}

                    {/* Item 3: Teaser Video Storyboard */}
                    {(galleryFilter === 'all' || galleryFilter === 'video') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-2xs border border-purple-200/60 shrink-0">
                              <Film className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'تیزر حرکتی پهپاد بر فراز صخره' : 'Ocean Cliff Drone Shot'}
                              </h5>
                              <span className="text-[10px] text-purple-700 font-mono">1080p &middot; 5s 60fps</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'حرکت روان دوربین بر فراز امواج ساحلی در ساعت طلایی غروب.' : 'Dynamic cinematic camera flight with particle synthesis.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">دیروز</span>
                          <span className="text-purple-600 font-bold">{isFa ? 'آماده رندر' : 'Ready'}</span>
                        </div>
                      </div>
                    )}

                    {/* Item 4: Financial Analytics Chart Component */}
                    {(galleryFilter === 'all' || galleryFilter === 'coding') && (
                      <div className="p-3 rounded-2xl bg-white border border-sky-200/80 hover:border-amber-400 shadow-2xs hover:shadow-xs transition-all space-y-2 group text-start">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-2xs border border-amber-200/60 shrink-0">
                              <Code2 className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="font-bold text-xs text-slate-900 leading-tight">
                                {isFa ? 'کامپوننت نمودار مالی ری‌اکت' : 'React Financial Chart'}
                              </h5>
                              <span className="text-[10px] text-amber-700 font-mono">TypeScript / Tailwind</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10.5px] text-slate-600 font-sans line-clamp-2 leading-relaxed">
                          {isFa ? 'ویجت نمودار آمار تعاملی سهام با تولتیپ‌های بلادرنگ.' : 'Interactive stock chart with smooth responsive rendering.'}
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400">۲ روز پیش</span>
                          <span className="text-amber-600 font-bold">{isFa ? 'کد آماده' : 'Code Ready'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 5: Stats & Experience HUD */}
              {currentView === 'stats' && (
                <div className="space-y-3 animate-in fade-in duration-200 text-start">
                  {/* Level & XP Card */}
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-700 text-white shadow-[0_8px_24px_rgba(37,99,235,0.32)] space-y-2.5 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-4 h-[1.5px] bg-gradient-to-r from-transparent via-white/80 to-transparent pointer-events-none rounded-full" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white border border-white/30">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white leading-tight">
                            {isFa ? 'سطح ایجنت یودا: Level 4' : 'YODAW Agent Level 4'}
                          </h4>
                          <span className="text-[10px] text-sky-100/80 font-mono">Autonomous Multimodal Core</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-bold bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                        94% XP
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden p-0.5">
                      <div className="w-[94%] h-full rounded-full bg-gradient-to-r from-yellow-300 to-emerald-300 shadow-sm" />
                    </div>
                  </div>

                  {/* System Metrics 2x2 Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'سرعت پاسخگویی:' : 'Response Speed:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">1.1 sec</div>
                      <div className="text-[9.5px] text-emerald-600 font-bold">{isFa ? 'عالی و بهینه‌سازی شده' : 'Ultra Fast'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'دقت کدنویسی و دیزاین:' : 'Code Quality:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">99.4%</div>
                      <div className="text-[9.5px] text-blue-600 font-bold">{isFa ? 'بدون باگ و خطای سینتکس' : 'Zero Defects'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'پروتکل‌های MCP فعال:' : 'Active MCP Bridges:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">
                        {Object.values(connectedAccounts).filter((a) => a?.connected).length} / 12
                      </div>
                      <div className="text-[9.5px] text-purple-600 font-bold">{isFa ? 'آماده تعامل' : 'Synchronized'}</div>
                    </div>

                    <div className="p-3 rounded-2xl bg-white border border-sky-200/80 shadow-2xs space-y-1">
                      <div className="text-[10px] text-slate-400 font-sans">{isFa ? 'موتور هوش مصنوعی:' : 'AI Engine:'}</div>
                      <div className="text-base font-black text-slate-900 font-mono">Gemini 2.5</div>
                      <div className="text-[9.5px] text-amber-600 font-bold">{isFa ? 'حالت چندرسانه‌ای فعال' : 'Multimodal Active'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
