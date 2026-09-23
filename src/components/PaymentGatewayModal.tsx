import { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  Zap,
  Coins,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  Lock,
  Sparkles,
  Smartphone,
  User,
  Mail,
  Tag,
  AlertCircle,
  RefreshCw,
  FileText,
  Download,
  Building2,
  Wallet,
  Globe2,
} from 'lucide-react';

export interface PaymentItem {
  id: string;
  type: 'hours' | 'subscription';
  titleFa: string;
  titleEn: string;
  hoursAdded?: number;
  planKey?: 'pro' | 'unlimited';
  priceToman: number;
  priceUsdt: number;
  badgeFa?: string;
  badgeEn?: string;
  descriptionFa: string;
  descriptionEn: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: PaymentItem | null;
  language?: string;
  onPaymentSuccess: (item: PaymentItem) => void;
}

export function PaymentGatewayModal({
  isOpen,
  onClose,
  item,
  language = 'fa',
  onPaymentSuccess,
}: Props) {
  const isFa = language === 'fa';

  // Gateway mode: 'rial' (Shetab / Iran) or 'crypto' (International / USDT / Web3)
  const [gatewayType, setGatewayType] = useState<'rial' | 'crypto'>('rial');

  // Form states for Rial payment
  const [fullName, setFullName] = useState('آرمین شفیعی');
  const [mobileNumber, setMobileNumber] = useState('۰۹۱۲۳۴۵۶۷۸۹');
  const [email, setEmail] = useState('arminsh00@gmail.com');
  const [selectedIpg, setSelectedIpg] = useState<'zarinpal' | 'saman' | 'mellat' | 'zibal'>('zarinpal');
  const [discountCode, setDiscountCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState<number | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

  // Form states for Crypto payment
  const [selectedCrypto, setSelectedCrypto] = useState<'usdt_trc20' | 'usdt_erc20' | 'ton' | 'btc' | 'sol'>('usdt_trc20');
  const [txHash, setTxHash] = useState('');
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Step state: 'checkout' -> 'bank_terminal' | 'crypto_verifying' -> 'success'
  const [paymentStep, setPaymentStep] = useState<'checkout' | 'bank_terminal' | 'crypto_verifying' | 'success'>('checkout');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(900); // 15 mins
  const [trackingNumber, setTrackingNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');

  // Bank Terminal Simulation Fields
  const [cardNumber, setCardNumber] = useState('۶۰۳۷ - ۹۹۱۸ - **** - ۷۸۲۱');
  const [cvv2, setCvv2] = useState('');
  const [cardMonth, setCardMonth] = useState('۰۶');
  const [cardYear, setCardYear] = useState('۰۷');
  const [dynamicOtp, setDynamicOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);

  // Initialize order ID and default gateway on open
  useEffect(() => {
    if (isOpen) {
      setOrderNumber(`CDG-${Math.floor(100000 + Math.random() * 900000)}`);
      setTrackingNumber(`SHP-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
      setPaymentStep('checkout');
      setIsSubmitting(false);
      setDiscountApplied(null);
      setDiscountError(null);
      setGatewayType(language === 'fa' ? 'rial' : 'crypto');
      setCountdownSeconds(900);
    }
  }, [isOpen, language]);

  // Crypto Countdown timer
  useEffect(() => {
    if (paymentStep === 'checkout' && gatewayType === 'crypto' && isOpen) {
      const timer = setInterval(() => {
        setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentStep, gatewayType, isOpen]);

  // OTP Timer countdown
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [otpSent, otpTimer]);

  if (!isOpen || !item) return null;

  // Calculate pricing
  const baseToman = item.priceToman;
  const discountToman = discountApplied ? Math.round((baseToman * discountApplied) / 100) : 0;
  const finalToman = Math.max(0, baseToman - discountToman);

  const baseUsdt = item.priceUsdt;
  const discountUsdt = discountApplied ? (baseUsdt * discountApplied) / 100 : 0;
  const finalUsdt = Math.max(0, baseUsdt - discountUsdt).toFixed(2);

  // Crypto Addresses dictionary
  const CRYPTO_DATA = {
    usdt_trc20: {
      name: 'Tether (USDT - TRC20)',
      network: 'Tron (TRC-20)',
      address: 'TQ7s8j9vK2Lp4N1wY5xZ6aBcDeFgHiJkLm',
      rate: finalUsdt,
      unit: 'USDT',
      memo: null,
    },
    usdt_erc20: {
      name: 'Tether (USDT - ERC20)',
      network: 'Ethereum (ERC-20)',
      address: '0x71C...b89A52eF42b7816e88cE7d8e',
      rate: finalUsdt,
      unit: 'USDT',
      memo: null,
    },
    ton: {
      name: 'Toncoin (TON)',
      network: 'The Open Network',
      address: 'EQCD39VS5jcptHL8vMjEXrxNUHzd0qTRPFGKL',
      rate: (parseFloat(finalUsdt) / 5.2).toFixed(3),
      unit: 'TON',
      memo: '984210',
    },
    btc: {
      name: 'Bitcoin (BTC)',
      network: 'Bitcoin Mainnet / Lightning',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      rate: (parseFloat(finalUsdt) / 64000).toFixed(6),
      unit: 'BTC',
      memo: null,
    },
    sol: {
      name: 'Solana (SOL)',
      network: 'Solana SPL',
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      rate: (parseFloat(finalUsdt) / 145).toFixed(4),
      unit: 'SOL',
      memo: null,
    },
  };

  const currentCrypto = CRYPTO_DATA[selectedCrypto];

  // Handle Discount Coupon
  const handleApplyDiscount = () => {
    setDiscountError(null);
    const code = discountCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'CODGAR' || code === 'CODGAR2026' || code === 'VIP') {
      setDiscountApplied(25); // 25% discount
    } else if (code === 'NOWRUZ' || code === 'OFF50') {
      setDiscountApplied(50); // 50% discount
    } else {
      setDiscountError(isFa ? 'کد تخفیف وارد شده معتبر نیست یا منقضی شده است.' : 'Invalid or expired coupon code.');
    }
  };

  const handleCopy = (text: string, type: 'addr' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'addr') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // Proceed from Checkout to Bank Terminal
  const handleProceedToBank = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentStep('bank_terminal');
    }, 600);
  };

  // Send Dynamic SMS OTP in Bank Terminal
  const handleRequestOtp = () => {
    setOtpSent(true);
    setOtpTimer(120);
    setDynamicOtp('842910');
  };

  // Finalize Bank Payment
  const handleCompleteBankPayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentStep('success');
      onPaymentSuccess(item);
    }, 900);
  };

  // Finalize Crypto Payment
  const handleCompleteCryptoPayment = () => {
    setIsSubmitting(true);
    setPaymentStep('crypto_verifying');
    setTimeout(() => {
      setIsSubmitting(false);
      setPaymentStep('success');
      onPaymentSuccess(item);
    }, 2000);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div
        className="w-full max-w-3xl bg-[#070d1a] border border-blue-500/30 rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col text-slate-100 font-sans relative my-auto animate-fadeIn"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Top Glowing Color Stripe */}
        <div className="h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 w-full" />

        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0c1426] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-[#080e1d] rounded-[14px] flex items-center justify-center text-sky-400">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {paymentStep === 'success'
                    ? isFa
                      ? 'رسید پرداخت موفق و شارژ حساب'
                      : 'Payment Receipt & Confirmation'
                    : isFa
                    ? 'درگاه امن پرداخت و صدور صورتحساب'
                    : 'Secure Payment Gateway & Invoice'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>SSL 256-Bit</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {isFa ? `شماره سفارش: ${orderNumber}` : `Order ID: ${orderNumber}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer border border-white/10"
            title={isFa ? 'بستن' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 1: CHECKOUT & GATEWAY SELECTION                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {paymentStep === 'checkout' && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            {/* Package Summary Card */}
            <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-950/40 via-[#0e1c38] to-indigo-950/40 border border-blue-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {isFa ? item.badgeFa || 'بسته شارژ زمان' : item.badgeEn || 'Time Booster'}
                  </span>
                  <h4 className="text-base font-bold text-white">
                    {isFa ? item.titleFa : item.titleEn}
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  {isFa ? item.descriptionFa : item.descriptionEn}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-r border-white/10 pt-2 sm:pt-0 sm:pr-4">
                <div className="text-xs text-slate-400">{isFa ? 'مبلغ قابل پرداخت:' : 'Total Amount:'}</div>
                <div className="text-xl sm:text-2xl font-black text-sky-400">
                  {gatewayType === 'rial'
                    ? `${finalToman.toLocaleString('fa-IR')} تومان`
                    : `$${finalUsdt} USDT`}
                </div>
                {discountApplied && (
                  <div className="text-[11px] text-emerald-400 font-semibold line-through">
                    {gatewayType === 'rial'
                      ? `${baseToman.toLocaleString('fa-IR')} تومان`
                      : `$${baseUsdt} USDT`}
                  </div>
                )}
              </div>
            </div>

            {/* Gateway Mode Switcher (Rial / Crypto) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>{isFa ? 'انتخاب نوع درگاه پرداخت:' : 'Select Payment Gateway Type:'}</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {isFa ? 'پشتیبانی از کارت‌های شتاب و کلیه شبکه‌های بلاکچین' : 'Supports Iranian Shetab & Global Crypto'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 1. Rial Shetab Option */}
                <button
                  type="button"
                  onClick={() => setGatewayType('rial')}
                  className={`p-3.5 rounded-2xl border text-right sm:text-center transition-all cursor-pointer flex items-center gap-3 ${
                    gatewayType === 'rial'
                      ? 'bg-blue-600/20 border-blue-400 shadow-lg shadow-blue-600/20 text-white'
                      : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      gatewayType === 'rial' ? 'bg-blue-500 text-white' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>{isFa ? 'درگاه بانکی شاپرک / ریالی' : 'Iranian Shetab Gateway (Rial)'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isFa ? 'زرین‌پال، ملت، سامان (کارت‌های شتاب)' : 'Direct instant Shetab cards (Toman)'}
                    </div>
                  </div>
                </button>

                {/* 2. Crypto & International Option */}
                <button
                  type="button"
                  onClick={() => setGatewayType('crypto')}
                  className={`p-3.5 rounded-2xl border text-right sm:text-center transition-all cursor-pointer flex items-center gap-3 ${
                    gatewayType === 'crypto'
                      ? 'bg-emerald-600/20 border-emerald-400 shadow-lg shadow-emerald-600/20 text-white'
                      : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      gatewayType === 'crypto' ? 'bg-emerald-500 text-slate-950' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold flex items-center gap-1.5">
                      <span>{isFa ? 'درگاه کریپتو و بین‌المللی' : 'Crypto & Global Web3 (USDT)'}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isFa ? 'تتر (TRC20/ERC20)، تون، بیت‌کوین' : 'Instant USDT, TON, BTC, SOL checkout'}
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* ════════════════════════════════════════════════════════════ */}
            {/* RIAL PAYMENT FORM                                            */}
            {/* ════════════════════════════════════════════════════════════ */}
            {gatewayType === 'rial' && (
              <div className="space-y-4 pt-1">
                {/* User Info Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isFa ? 'نام و نام خانوادگی خریدار:' : 'Full Name:'}</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={isFa ? 'مثال: آرمین شفیعی' : 'e.g. John Doe'}
                      className="w-full bg-[#0a1120] border border-white/15 focus:border-blue-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isFa ? 'شماره موبایل (جهت پیامک پیگیری):' : 'Mobile Number:'}</span>
                    </label>
                    <input
                      type="text"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-[#0a1120] border border-white/15 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none transition shadow-inner font-mono text-left dir-ltr"
                    />
                  </div>
                </div>

                {/* Bank IPG Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>{isFa ? 'انتخاب درگاه پرداخت شاپرک:' : 'Select Shetab IPG Gateway:'}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'zarinpal', nameFa: 'زرین‌پال (مستقیم)', nameEn: 'ZarinPal IPG', color: 'border-yellow-500/40 text-yellow-400' },
                      { id: 'mellat', nameFa: 'به‌پرداخت ملت', nameEn: 'Mellat IPG', color: 'border-rose-500/40 text-rose-400' },
                      { id: 'saman', nameFa: 'سامان‌کیش', nameEn: 'Saman Pay', color: 'border-blue-500/40 text-blue-400' },
                      { id: 'zibal', nameFa: 'زیبال / پی‌پینگ', nameEn: 'Zibal Swift', color: 'border-cyan-500/40 text-cyan-400' },
                    ].map((ipg) => (
                      <button
                        key={ipg.id}
                        type="button"
                        onClick={() => setSelectedIpg(ipg.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                          selectedIpg === ipg.id
                            ? 'bg-blue-600/30 border-blue-400 text-white shadow-xs'
                            : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                        }`}
                      >
                        {isFa ? ipg.nameFa : ipg.nameEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Discount Code */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder={isFa ? 'کد تخفیف (مثال: CODGAR یا NOWRUZ)' : 'Coupon Code (e.g. CODGAR)'}
                        className="w-full bg-[#080e1a] border border-white/10 focus:border-blue-400 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white uppercase focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyDiscount}
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition cursor-pointer"
                    >
                      {isFa ? 'اعمال کد' : 'Apply'}
                    </button>
                  </div>
                  {discountApplied && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isFa ? `🎉 تخفیف ${discountApplied}٪ با موفقیت روی فاکتور اعمال شد!` : `Coupon applied! ${discountApplied}% off`}</span>
                    </div>
                  )}
                  {discountError && (
                    <div className="text-[11px] text-rose-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{discountError}</span>
                    </div>
                  )}
                </div>

                {/* Action Submit Button */}
                <button
                  type="button"
                  onClick={handleProceedToBank}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm transition cursor-pointer shadow-lg shadow-blue-500/25 active:scale-98 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>{isFa ? `ورود به درگاه امن شاپرک و پرداخت (${finalToman.toLocaleString('fa-IR')} تومان)` : `Proceed to Secure Bank Gateway (${finalToman.toLocaleString()} T)`}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════════════════════ */}
            {/* CRYPTO PAYMENT VIEW                                          */}
            {/* ════════════════════════════════════════════════════════════ */}
            {gatewayType === 'crypto' && (
              <div className="space-y-4 pt-1">
                {/* Crypto Coin Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isFa ? 'انتخاب رمزارز و شبکه انتقال:' : 'Select Cryptocurrency & Network:'}</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'usdt_trc20', name: 'USDT (TRC20)', badge: 'محبوب / کم‌کارمزد' },
                      { id: 'ton', name: 'TON (Toncoin)', badge: 'سریع / بدون کارمزد' },
                      { id: 'usdt_erc20', name: 'USDT (ERC20)', badge: 'اتریوم' },
                      { id: 'sol', name: 'SOL (Solana)', badge: 'سولانا' },
                      { id: 'btc', name: 'BTC (Bitcoin)', badge: 'بیت‌کوین' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCrypto(c.id as any)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer text-xs font-bold flex flex-col items-center justify-center gap-0.5 ${
                          selectedCrypto === c.id
                            ? 'bg-emerald-600/30 border-emerald-400 text-emerald-300 shadow-xs'
                            : 'bg-black/30 border-white/10 hover:border-white/20 text-slate-400'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-[9px] text-slate-400 font-normal">{c.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Crypto Deposit Box with QR and Address */}
                <div className="p-4 rounded-2xl bg-[#091224] border border-emerald-500/30 flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Code */}
                  <div className="p-2 bg-white rounded-xl shadow-md shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${currentCrypto.address}`}
                      alt="Deposit QR"
                      className="w-28 h-28"
                    />
                  </div>

                  {/* Address & Amount Details */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{isFa ? 'آدرس واریز کیف پول:' : 'Deposit Wallet Address:'}</span>
                        <span className="text-emerald-400 font-bold">{currentCrypto.network}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 bg-black/50 p-2 rounded-xl border border-white/10">
                        <span className="text-xs font-mono text-slate-200 truncate flex-1 dir-ltr text-left">
                          {currentCrypto.address}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(currentCrypto.address, 'addr')}
                          className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 transition cursor-pointer shrink-0"
                          title="Copy Address"
                        >
                          {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-xs text-slate-400">{isFa ? 'مبلغ دقیق واریزی:' : 'Exact Amount:'}</div>
                        <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5 font-mono">
                          <span>
                            {currentCrypto.rate} {currentCrypto.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(currentCrypto.rate.toString(), 'amount')}
                            className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-[10px]"
                          >
                            {copiedAmount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-left shrink-0">
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{isFa ? 'زمان انقضا:' : 'Expires in:'}</span>
                        </div>
                        <div className="text-sm font-mono font-bold text-amber-300 mt-0.5">
                          {formatSeconds(countdownSeconds)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TxID Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isFa ? 'کد هش تراکنش یا شناسه واریز (TxID / Hash):' : 'Transaction Hash (TxID):'}</span>
                  </label>
                  <input
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder={isFa ? 'هش تراکنش را پس از انتقال اینجا وارد کنید (اختیاری جهت تسریع تایید)' : '0x7a2f8b... or Tron Tx Hash'}
                    className="w-full bg-[#0a1120] border border-white/15 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono dir-ltr"
                  />
                </div>

                {/* Complete Crypto Button */}
                <button
                  type="button"
                  onClick={handleCompleteCryptoPayment}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>{isFa ? 'تایید واریز و شارژ آنی حساب' : 'I Have Transferred - Confirm & Top Up'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 2: HIGH-FIDELITY SHAPARAK BANK TERMINAL VIEW                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {paymentStep === 'bank_terminal' && (
          <div className="p-5 sm:p-7 space-y-5 max-h-[80vh] overflow-y-auto bg-[#070e1c]">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-[#0e1d3d] to-indigo-900/40 border border-blue-400/40 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400">{isFa ? 'پذیرنده: درگاه هوش مصنوعی کُدگر' : 'Merchant: Codgar AI Platform'}</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {isFa ? item.titleFa : item.titleEn}
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs text-slate-400">{isFa ? 'مبلغ قابل پرداخت:' : 'Amount:'}</div>
                <div className="text-xl font-black text-emerald-400">
                  {finalToman.toLocaleString('fa-IR')} تومان
                </div>
              </div>
            </div>

            {/* Shaparak Card Form */}
            <div className="p-5 rounded-2xl bg-[#091428] border border-white/10 space-y-4 shadow-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isFa ? 'شماره کارت ۱۶ رقمی شتاب:' : '16-Digit Card Number:'}
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-black/40 border border-white/20 focus:border-blue-400 rounded-xl px-3.5 py-2.5 text-base font-mono text-center tracking-widest text-white focus:outline-none dir-ltr"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'کد امنیتی (CVV2):' : 'CVV2:'}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cvv2}
                    onChange={(e) => setCvv2(e.target.value)}
                    placeholder="•••"
                    className="w-full bg-black/40 border border-white/20 focus:border-blue-400 rounded-xl px-3 py-2 text-sm font-mono text-center text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'تاریخ انقضا (ماه / سال):' : 'Expiry Date:'}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={2}
                      value={cardMonth}
                      onChange={(e) => setCardMonth(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 focus:border-blue-400 rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none"
                    />
                    <span className="text-slate-500">/</span>
                    <input
                      type="text"
                      maxLength={2}
                      value={cardYear}
                      onChange={(e) => setCardYear(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 focus:border-blue-400 rounded-xl px-2 py-2 text-xs font-mono text-center text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {isFa ? 'رمز دوم پویا:' : 'Dynamic OTP:'}
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="password"
                      maxLength={8}
                      value={dynamicOtp}
                      onChange={(e) => setDynamicOtp(e.target.value)}
                      placeholder="رمز پیامکی"
                      className="w-full bg-black/40 border border-white/20 focus:border-blue-400 rounded-xl px-2.5 py-2 text-xs font-mono text-center text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleRequestOtp}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[11px] font-bold shrink-0 transition cursor-pointer"
                    >
                      {otpSent ? `${otpTimer}s` : isFa ? 'دریافت رمز' : 'Get OTP'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaymentStep('checkout')}
                className="py-3 px-5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition cursor-pointer"
              >
                {isFa ? 'انصراف و بازگشت' : 'Cancel & Back'}
              </button>

              <button
                type="button"
                onClick={handleCompleteBankPayment}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-98 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{isFa ? 'تکمیل پرداخت و شارژ حساب' : 'Confirm & Complete Payment'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 3: BLOCKCHAIN VERIFYING SIMULATION                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {paymentStep === 'crypto_verifying' && (
          <div className="p-8 sm:p-12 text-center space-y-4 max-h-[80vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center animate-spin">
              <RefreshCw className="w-8 h-8 text-emerald-400" />
            </div>
            <h4 className="text-lg font-bold text-white">
              {isFa ? 'در حال تایید و ثبت تراکنش در شبکه بلاکچین...' : 'Confirming on Blockchain Network...'}
            </h4>
            <p className="text-xs text-slate-400 max-w-md">
              {isFa
                ? 'لطفاً چند ثانیه شکیبا باشید؛ پس از تایید بلوک‌های شبکه، اعتبار خریداری‌شده بلافاصله به باک انرژی و حساب کُدگر شما افزوده می‌شود.'
                : 'Please wait a moment while the network confirms your transaction. Your account is being credited automatically.'}
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VIEW 4: OFFICIAL PAYMENT RECEIPT & SUCCESS SCREEN                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {paymentStep === 'success' && (
          <div className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto text-center">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/30">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl sm:text-2xl font-black text-white">
                {isFa ? '🎉 پرداخت با موفقیت انجام و حساب شما شارژ شد!' : '🎉 Payment Successful & Account Credited!'}
              </h4>
              <p className="text-xs text-slate-300">
                {isFa
                  ? `بسته «${item.titleFa}» به اعتبار شما افزوده شد و هم‌اکنون می‌توانید بدون محدودیت از تمام قابلیت‌های کُدگر استفاده نمایید.`
                  : `Successfully activated ${item.titleEn}. Your hours have been added to your live fuel tank.`}
              </p>
            </div>

            {/* Digital Invoice Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#091428] border border-emerald-500/30 text-right text-xs space-y-2.5 max-w-lg mx-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-slate-400">{isFa ? 'کد پیگیری شاپرک / تراکنش:' : 'Tracking / TxID:'}</span>
                <span className="font-mono font-bold text-emerald-400">{trackingNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-slate-400">{isFa ? 'شماره سفارش:' : 'Order Number:'}</span>
                <span className="font-mono text-white">{orderNumber}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-slate-400">{isFa ? 'بسته خریداری‌شده:' : 'Purchased Package:'}</span>
                <span className="font-bold text-white">{isFa ? item.titleFa : item.titleEn}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{isFa ? 'مبلغ پرداخت‌شده:' : 'Paid Amount:'}</span>
                <span className="font-bold text-sky-400 text-sm">
                  {gatewayType === 'rial'
                    ? `${finalToman.toLocaleString('fa-IR')} تومان`
                    : `$${finalUsdt} USDT`}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm transition cursor-pointer shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>{isFa ? 'بازگشت به محیط کُدگر و ادامه کار' : 'Return to Workspace'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
