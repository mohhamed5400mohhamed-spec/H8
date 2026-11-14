import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Power,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Check,
  X,
  MessageSquare,
  RefreshCw,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ChatRoom } from '../types/chat';
import { uploadMediaWithProgress } from '../utils/connectionKeepAlive';

export type BotStatus = 'online' | 'offline' | 'away' | 'hidden';
export type BotPersonality = 'ودود' | 'رسمي' | 'مرح' | 'ذكي';

export interface BotRecord {
  id: string;
  username: string;
  avatarUrl: string;
  status: BotStatus;
  statusQuote: string;
  defaultRoom: string;
  currentRoom: string;
  personality: BotPersonality;
  note?: string;
  flag?: string;
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface BotSettings {
  globalEnabled: boolean;
  autoHopEnabled: boolean;
  autoRejoinOnKick: boolean;
  kickRejoinDelaySeconds: number;
  autoRepliesEnabled: boolean;
  smartQaEnabled: boolean;
  welcomeEnabled: boolean;
  delayedReplyEnabled: boolean;
  replyDelaySeconds: number;
  hopMode: 'random' | 'selected';
  hopIntervalMinutes: number;
  selectedHopRooms: string[];
}

export interface BotReplyRule {
  id: string;
  keyword: string;
  reply: string;
}

// 6 صور جاهزة للاختيار السريع (Pure SVG Data URIs)
export const PRESET_BOT_AVATARS: Array<{ id: string; label: string; url: string }> = [
  {
    id: 'preset-1',
    label: 'أميرة ذهبية',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f59e0b'/%3E%3Cstop offset='100%25' stop-color='%2378350f'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g1)'/%3E%3Ccircle cx='40' cy='31' r='13' fill='%23fef3c7'/%3E%3Cpath d='M18 68c2-14 11-20 22-20s20 6 22 20' fill='%23fde68a'/%3E%3Cpath d='M28 19l6 6 6-8 6 8 6-6-2 10H30z' fill='%23fbbf24'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-2',
    label: 'فارس أزرق',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g2' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%230284c7'/%3E%3Cstop offset='100%25' stop-color='%231e3a8a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g2)'/%3E%3Ccircle cx='40' cy='31' r='13' fill='%23e0f2fe'/%3E%3Cpath d='M18 68c2-14 11-20 22-20s20 6 22 20' fill='%23bae6fd'/%3E%3Ccircle cx='35' cy='30' r='2' fill='%230c4a6e'/%3E%3Ccircle cx='45' cy='30' r='2' fill='%230c4a6e'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-3',
    label: 'وردة بنفسجية',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g3' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23a855f7'/%3E%3Cstop offset='100%25' stop-color='%236b21a8'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g3)'/%3E%3Ccircle cx='40' cy='31' r='13' fill='%23f3e8ff'/%3E%3Cpath d='M18 68c2-14 11-20 22-20s20 6 22 20' fill='%23e9d5ff'/%3E%3Ccircle cx='53' cy='21' r='5' fill='%23f43f5e'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-4',
    label: 'زمردي ذكي',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g4' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%2310b981'/%3E%3Cstop offset='100%25' stop-color='%23064e3b'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g4)'/%3E%3Crect x='24' y='20' width='32' height='26' rx='8' fill='%23d1fae5'/%3E%3Ccircle cx='34' cy='33' r='3' fill='%23065f46'/%3E%3Ccircle cx='46' cy='33' r='3' fill='%23065f46'/%3E%3Crect x='33' y='40' width='14' height='2.5' rx='1' fill='%23065f46'/%3E%3Cpath d='M20 68c2-11 10-16 20-16s18 5 20 16' fill='%23a7f3d0'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-5',
    label: 'ياقوتي مرح',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g5' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23f43f5e'/%3E%3Cstop offset='100%25' stop-color='%23881337'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g5)'/%3E%3Ccircle cx='40' cy='31' r='13' fill='%23ffe4e6'/%3E%3Cpath d='M18 68c2-14 11-20 22-20s20 6 22 20' fill='%23fecdd3'/%3E%3Cpath d='M34 35q6 5 12 0' stroke='%239f1239' stroke-width='2.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"
  },
  {
    id: 'preset-6',
    label: 'كلاسيكي رسمي',
    url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Cdefs%3E%3ClinearGradient id='g6' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23475569'/%3E%3Cstop offset='100%25' stop-color='%230f172a'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='80' height='80' rx='20' fill='url(%23g6)'/%3E%3Ccircle cx='40' cy='30' r='12' fill='%23f1f5f9'/%3E%3Cpath d='M18 68c2-14 11-20 22-20s20 6 22 20' fill='%23cbd5e1'/%3E%3Cpath d='M36 48l4 10 4-10z' fill='%23f59e0b'/%3E%3C/svg%3E"
  }
];

const BOT_FLAG_OPTIONS: Array<{ flag: string; label: string }> = [
  { flag: '🇸🇦', label: 'المملكة العربية السعودية' },
  { flag: '🇾🇪', label: 'الجمهورية اليمنية' },
  { flag: '🇪🇬', label: 'جمهورية مصر العربية' },
  { flag: '🇮🇶', label: 'جمهورية العراق' },
  { flag: '🇸🇾', label: 'الجمهورية العربية السورية' },
  { flag: '🇦🇪', label: 'الإمارات العربية المتحدة' },
  { flag: '🇰🇼', label: 'دولة الكويت' },
  { flag: '🇶🇦', label: 'دولة قطر' },
  { flag: '🇧🇭', label: 'مملكة البحرين' },
  { flag: '🇴🇲', label: 'سلطنة عمان' },
  { flag: '🇯🇴', label: 'المملكة الأردنية الهاشمية' },
  { flag: '🇱🇧', label: 'الجمهورية اللبنانية' },
  { flag: '🇵🇸', label: 'دولة فلسطين' },
  { flag: '🇩🇿', label: 'الجمهورية الجزائرية' },
  { flag: '🇲🇦', label: 'المملكة المغربية' },
  { flag: '🇹🇳', label: 'الجمهورية التونسية' },
  { flag: '🇱🇾', label: 'دولة ليبيا' },
  { flag: '🇸🇩', label: 'جمهورية السودان' },
  { flag: '🇲🇷', label: 'موريتانيا' },
  { flag: '🇸🇴', label: 'الصومال' },
  { flag: '🇹🇷', label: 'تركيا' },
  { flag: '🇬🇧', label: 'المملكة المتحدة' },
  { flag: '🇺🇸', label: 'الولايات المتحدة الأمريكية' },
  { flag: '🇩🇪', label: 'ألمانيا' },
  { flag: '🇫🇷', label: 'فرنسا' },
  { flag: '🇨🇦', label: 'كندا' },
  { flag: '👑', label: 'تاج ملكي' },
  { flag: '🦅', label: 'صقر مميز' },
  { flag: '⭐', label: 'نجمة ذهبية' }
];

const DEFAULT_SETTINGS_STATE: BotSettings = {
  globalEnabled: true,
  autoHopEnabled: false,
  autoRejoinOnKick: true,
  kickRejoinDelaySeconds: 10,
  autoRepliesEnabled: true,
  smartQaEnabled: true,
  welcomeEnabled: true,
  delayedReplyEnabled: true,
  replyDelaySeconds: 2,
  hopMode: 'random',
  hopIntervalMinutes: 5,
  selectedHopRooms: []
};

interface BotAdminPanelProps {
  socket: any;
  roomsList: ChatRoom[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const BotAdminPanel: React.FC<BotAdminPanelProps> = ({
  socket,
  roomsList,
  showToast
}) => {
  const [settings, setSettings] = useState<BotSettings>(DEFAULT_SETTINGS_STATE);
  const [bots, setBots] = useState<BotRecord[]>([]);
  const [botReplies, setBotReplies] = useState<BotReplyRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Create / Edit Bot Modal Form State
  const [showBotForm, setShowBotForm] = useState(false);
  const [editingBotId, setEditingBotId] = useState<string | null>(null);
  const [botName, setBotName] = useState('');
  const [botAvatarUrl, setBotAvatarUrl] = useState(PRESET_BOT_AVATARS[0].url);
  const [botStatus, setBotStatus] = useState<BotStatus>('online');
  const [botStatusQuote, setBotStatusQuote] = useState('أهلاً بكم في شات حسن برو');
  const [botDefaultRoom, setBotDefaultRoom] = useState(roomsList[0]?.id || 'الغرفة العامة');
  const [botPersonality, setBotPersonality] = useState<BotPersonality>('ودود');
  const [botFlag, setBotFlag] = useState('🇸🇦');
  const [botNote, setBotNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Bot Delete Inline Confirm
  const [confirmDeleteBotId, setConfirmDeleteBotId] = useState<string | null>(null);

  // Keywords Section ("كلمات البوت") State
  const [showAddReplyForm, setShowAddReplyForm] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [replyKeywordInput, setReplyKeywordInput] = useState('');
  const [replyTextInput, setReplyTextInput] = useState('');
  const [replySearchQuery, setReplySearchQuery] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleState = (data: { settings?: BotSettings; bots?: BotRecord[]; botReplies?: BotReplyRule[] }) => {
      if (data?.settings) setSettings({ ...DEFAULT_SETTINGS_STATE, ...data.settings });
      if (Array.isArray(data?.bots)) setBots(data.bots);
      if (Array.isArray(data?.botReplies)) setBotReplies(data.botReplies);
      setLoading(false);
    };

    const handleActionResult = (res: { success?: boolean; message?: string; action?: string }) => {
      if (res?.message) {
        showToast(res.message, res.success ? 'success' : 'error');
      }
      if (res?.success && (res.action === 'create' || res.action === 'update')) {
        setShowBotForm(false);
        setEditingBotId(null);
        setFormError(null);
      } else if (!res?.success && (res?.action === 'create' || res?.action === 'update')) {
        setFormError(res.message || 'حدث خطأ أثناء الحفظ');
      }
    };

    socket.on('botsAdminStateUpdated', handleState);
    socket.on('botActionResult', handleActionResult);
    socket.emit('getBotsAdminState');

    return () => {
      socket.off('botsAdminStateUpdated', handleState);
      socket.off('botActionResult', handleActionResult);
    };
  }, [socket, showToast]);

  const updateSettingsImmediate = (partial: Partial<BotSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
    socket?.emit('updateBotSettings', partial);
  };

  const openCreateForm = () => {
    setEditingBotId(null);
    setBotName('');
    setBotAvatarUrl(PRESET_BOT_AVATARS[0].url);
    setBotStatus('online');
    setBotStatusQuote('أهلاً بكم في شات حسن برو');
    setBotDefaultRoom(roomsList[0]?.id || 'الغرفة العامة');
    setBotPersonality('ودود');
    setBotFlag('🇸🇦');
    setBotNote('');
    setFormError(null);
    setShowBotForm(true);
  };

  const openEditForm = (bot: BotRecord) => {
    setEditingBotId(bot.id);
    setBotName(bot.username);
    setBotAvatarUrl(bot.avatarUrl || PRESET_BOT_AVATARS[0].url);
    setBotStatus(bot.status);
    setBotStatusQuote(bot.statusQuote);
    setBotDefaultRoom(bot.defaultRoom || roomsList[0]?.id || 'الغرفة العامة');
    setBotPersonality(bot.personality || 'ودود');
    setBotFlag(bot.flag || '🇸🇦');
    setBotNote(bot.note || '');
    setFormError(null);
    setShowBotForm(true);
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setUploadProgress(5);
    try {
      const res = await uploadMediaWithProgress(file, (pct) => setUploadProgress(pct));
      if (res?.url) {
        setBotAvatarUrl(res.url);
        showToast('تم رفع صورة البوت بنجاح ✅', 'success');
      }
    } catch {
      // Fallback: convert small image to base64 Data URI if binary endpoint rejects
      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setBotAvatarUrl(reader.result);
            showToast('تم تجهيز صورة البوت بنجاح ✅', 'success');
          }
        };
        reader.readAsDataURL(file);
      } catch {
        showToast('تعذر رفع الصورة، يرجى اختيار صورة أصغر.', 'error');
      }
    } finally {
      setUploadingAvatar(false);
      setUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveBot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!botName.trim() || !botAvatarUrl.trim() || !botStatus || !botStatusQuote.trim() || !botDefaultRoom || !botPersonality) {
      setFormError('جميع الحقول إجبارية ما عدا الملاحظة.');
      return;
    }

    const payload = {
      username: botName.trim(),
      avatarUrl: botAvatarUrl.trim(),
      status: botStatus,
      statusQuote: botStatusQuote.trim(),
      defaultRoom: botDefaultRoom,
      personality: botPersonality,
      flag: botFlag.trim() || '🇸🇦',
      note: botNote.trim()
    };

    if (editingBotId) {
      socket?.emit('updateBot', { id: editingBotId, data: payload });
    } else {
      socket?.emit('createBot', payload);
    }
  };

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyKeywordInput.trim() || !replyTextInput.trim()) {
      showToast('يرجى كتابة الكلمة والرد معاً.', 'error');
      return;
    }
    if (editingReplyId) {
      socket?.emit('updateBotReply', {
        id: editingReplyId,
        keyword: replyKeywordInput.trim(),
        reply: replyTextInput.trim()
      });
    } else {
      socket?.emit('addBotReply', {
        keyword: replyKeywordInput.trim(),
        reply: replyTextInput.trim()
      });
    }
    setEditingReplyId(null);
    setReplyKeywordInput('');
    setReplyTextInput('');
    setShowAddReplyForm(false);
  };

  const getStatusMeta = (status: BotStatus) => {
    switch (status) {
      case 'online':
        return { label: 'متصل - أخضر', dot: 'bg-emerald-500', badge: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40' };
      case 'away':
        return { label: 'مشغول - أصفر', dot: 'bg-amber-400', badge: 'bg-amber-950/70 text-amber-300 border-amber-500/40' };
      case 'offline':
        return { label: 'غير متصل - رمادي', dot: 'bg-slate-400', badge: 'bg-slate-800 text-slate-300 border-slate-600' };
      case 'hidden':
        return { label: 'مخفي', dot: 'bg-blue-500', badge: 'bg-blue-950/70 text-blue-300 border-blue-500/40' };
    }
  };

  const filteredReplies = botReplies.filter((item) => {
    const q = replySearchQuery.trim().toLowerCase();
    if (!q) return true;
    return item.keyword.toLowerCase().includes(q) || item.reply.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-amber-400 font-bold text-xs gap-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>جاري تحميل نظام إدارة البوتات...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs bg-slate-900/60" dir="rtl">
      {/* Header Banner */}
      <div className="p-3 rounded-2xl bg-gradient-to-l from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-300">إدارة البوتات الذكية</h3>
            <p className="text-[10px] text-slate-400">
              بوتات حقيقية متفاعلة مسجلة كأعضاء في قاعدة البيانات وتعمل فورياً في جميع الغرف
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء بوت جديد</span>
        </button>
      </div>

      {/* 1. 6 Global Switches & Timings */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
        <div className="font-black text-amber-400 text-xs flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>الإعدادات العامة للبوتات (تحفظ في MongoDB فوراً)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* 1. تشغيل / إيقاف البوتات بشكل عام */}
          <button
            type="button"
            onClick={() => updateSettingsImmediate({ globalEnabled: !settings.globalEnabled })}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              settings.globalEnabled
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <Power className={`w-4 h-4 ${settings.globalEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>1. تشغيل البوتات بشكل عام</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.globalEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.globalEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 2. تشغيل / إيقاف التنقل التلقائي بين الغرف */}
          <button
            type="button"
            onClick={() => updateSettingsImmediate({ autoHopEnabled: !settings.autoHopEnabled })}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              settings.autoHopEnabled
                ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <RefreshCw className={`w-4 h-4 ${settings.autoHopEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>2. التنقل التلقائي بين الغرف</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.autoHopEnabled ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.autoHopEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 3. الدخول التلقائي بعد الطرد + مدة الانتظار */}
          <div
            className={`p-2.5 rounded-xl border space-y-2 ${
              settings.autoRejoinOnKick
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <button
              type="button"
              onClick={() => updateSettingsImmediate({ autoRejoinOnKick: !settings.autoRejoinOnKick })}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span className="font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>3. الدخول التلقائي بعد الطرد</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.autoRejoinOnKick ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {settings.autoRejoinOnKick ? 'مفعّل' : 'متوقف'}
              </span>
            </button>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-300">مدة الانتظار قبل الرجوع (ثواني):</span>
              <input
                type="number"
                min={1}
                max={3600}
                value={settings.kickRejoinDelaySeconds}
                onChange={(e) => updateSettingsImmediate({ kickRejoinDelaySeconds: Math.max(1, Number(e.target.value) || 10) })}
                className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-center font-bold outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          {/* 4. تشغيل / إيقاف الردود التلقائية */}
          <button
            type="button"
            onClick={() => updateSettingsImmediate({ autoRepliesEnabled: !settings.autoRepliesEnabled })}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              settings.autoRepliesEnabled
                ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <MessageSquare className={`w-4 h-4 ${settings.autoRepliesEnabled ? 'text-indigo-400' : 'text-slate-500'}`} />
              <span>4. الردود التلقائية</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.autoRepliesEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.autoRepliesEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 5. تشغيل / إيقاف رسالة الترحيب */}
          <button
            type="button"
            onClick={() => updateSettingsImmediate({ welcomeEnabled: !settings.welcomeEnabled })}
            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              settings.welcomeEnabled
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className={`w-4 h-4 ${settings.welcomeEnabled ? 'text-rose-400' : 'text-slate-500'}`} />
              <span>5. رسالة الترحيب التلقائية</span>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.welcomeEnabled ? 'bg-rose-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.welcomeEnabled ? 'مفعّل' : 'متوقف'}
            </span>
          </button>

          {/* 6. الرد بعد تأخير (الافتراضي 2 ثواني) */}
          <div
            className={`p-2.5 rounded-xl border space-y-2 ${
              settings.delayedReplyEnabled
                ? 'bg-purple-950/30 border-purple-500/40 text-purple-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <button
              type="button"
              onClick={() => updateSettingsImmediate({ delayedReplyEnabled: !settings.delayedReplyEnabled })}
              className="w-full flex items-center justify-between cursor-pointer"
            >
              <span className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <span>6. الرد بعد تأخير</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${settings.delayedReplyEnabled ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {settings.delayedReplyEnabled ? 'مفعّل' : 'فوري'}
              </span>
            </button>
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
              <span className="text-slate-300">مدة التأخير بالثواني (الافتراضي 2):</span>
              <input
                type="number"
                min={0}
                max={60}
                value={settings.replyDelaySeconds}
                onChange={(e) => updateSettingsImmediate({ replyDelaySeconds: Math.max(0, Number(e.target.value) || 0) })}
                className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-center font-bold outline-none focus:border-purple-400"
              />
            </div>
          </div>

          {/* 7. الإجابة الذكية عند ذكر اسم البوت قبل السؤال */}
          <button
            type="button"
            onClick={() => updateSettingsImmediate({ smartQaEnabled: !(settings.smartQaEnabled !== false) })}
            className={`sm:col-span-2 p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 cursor-pointer transition-all ${
              settings.smartQaEnabled !== false
                ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <div className="text-right">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className={`w-4 h-4 ${settings.smartQaEnabled !== false ? 'text-teal-400' : 'text-slate-500'}`} />
                <span>7. الإجابة الذكية على الأسئلة والحوار المتواصل</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 pr-6">
                مثال: «كيفك ساره» أو «سارة ما عدد قارات العالم» — ويفهم البوت متابعة الحوار معك تلقائياً
              </div>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${settings.smartQaEnabled !== false ? 'bg-teal-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
              {settings.smartQaEnabled !== false ? 'مفعّل' : 'متوقف'}
            </span>
          </button>
        </div>

        {/* Room Hopping Config */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 mt-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-amber-300 text-xs">خيارات التنقل بين الغرف:</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-300">وقت التنقل (بالدقائق):</span>
              <input
                type="number"
                min={1}
                max={1440}
                value={settings.hopIntervalMinutes}
                onChange={(e) => updateSettingsImmediate({ hopIntervalMinutes: Math.max(1, Number(e.target.value) || 5) })}
                className="w-20 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-center font-bold outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateSettingsImmediate({ hopMode: 'random' })}
              className={`p-2 rounded-xl border text-right flex items-center justify-between cursor-pointer ${
                settings.hopMode === 'random'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span>أ) تنقل عشوائي بين كل الغرف</span>
              {settings.hopMode === 'random' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => updateSettingsImmediate({ hopMode: 'selected' })}
              className={`p-2 rounded-xl border text-right flex items-center justify-between cursor-pointer ${
                settings.hopMode === 'selected'
                  ? 'bg-amber-600/20 border-amber-500 text-amber-200 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <span>ب) تنقل حسب قائمة غرف محددة</span>
              {settings.hopMode === 'selected' && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>

          {settings.hopMode === 'selected' && (
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="text-[11px] font-bold text-slate-300">اختر الغرف المسموح للبوت بالتنقل بينها:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto">
                {roomsList
                  .filter((r) => r.id !== 'سجن حسان برو')
                  .map((room) => {
                    const checked = settings.selectedHopRooms.includes(room.id);
                    return (
                      <label
                        key={room.id}
                        className={`flex items-center gap-2 p-1.5 rounded-lg border cursor-pointer text-[11px] ${
                          checked ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const nextRooms = checked
                              ? settings.selectedHopRooms.filter((id) => id !== room.id)
                              : [...settings.selectedHopRooms, room.id];
                            updateSettingsImmediate({ selectedHopRooms: nextRooms });
                          }}
                          className="accent-amber-500"
                        />
                        <span className="truncate">{room.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Bots Table */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="font-black text-xs text-white flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-amber-400" />
            <span>قائمة البوتات ({bots.length})</span>
          </h4>
        </div>

        {bots.length === 0 ? (
          <div className="p-6 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-700">
            لا يوجد بوتات مضافة حالياً. اضغط على "إنشاء بوت جديد" لإضافة أول بوت.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="py-2 px-2">البوت</th>
                  <th className="py-2 px-2">الحالة</th>
                  <th className="py-2 px-2">الغرفة الحالية</th>
                  <th className="py-2 px-2">الشخصية</th>
                  <th className="py-2 px-2 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {bots.map((bot) => {
                  const sMeta = getStatusMeta(bot.status);
                  const roomObj = roomsList.find((r) => r.id === bot.currentRoom);
                  return (
                    <tr key={bot.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="relative shrink-0">
                            <img
                              src={bot.avatarUrl || PRESET_BOT_AVATARS[0].url}
                              alt={bot.username}
                              className="w-9 h-9 rounded-lg object-cover border border-amber-500/40"
                            />
                            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-950 ${sMeta.dot}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-white truncate max-w-[140px] flex items-center gap-1">
                              <span>{bot.flag || '🇸🇦'}</span>
                              <span className="truncate">{bot.username}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{bot.statusQuote}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold inline-block ${sMeta.badge}`}>
                          {sMeta.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-[11px] text-amber-300 font-bold">
                        {roomObj?.name || bot.currentRoom}
                      </td>
                      <td className="py-2 px-2 text-[11px] text-slate-300">
                        {bot.personality}
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => socket?.emit('toggleBotEnabled', { id: bot.id, enabled: !bot.enabled })}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer flex items-center gap-1 ${
                              bot.enabled
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                            title={bot.enabled ? 'إيقاف البوت' : 'تشغيل البوت'}
                          >
                            <Power className="w-3 h-3" />
                            <span>{bot.enabled ? 'يعمل' : 'متوقف'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditForm(bot)}
                            className="px-2 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black cursor-pointer flex items-center gap-1"
                            title="تعديل البوت"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>تعديل</span>
                          </button>

                          {confirmDeleteBotId === bot.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  socket?.emit('deleteBot', { id: bot.id });
                                  setConfirmDeleteBotId(null);
                                }}
                                className="px-2 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black cursor-pointer"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteBotId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-700 text-slate-300 text-[10px] font-bold cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteBotId(bot.id)}
                              className="px-2 py-1 rounded-lg bg-rose-700/80 hover:bg-rose-600 text-white text-[10px] font-black cursor-pointer flex items-center gap-1"
                              title="حذف البوت"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Bot Replies Dictionary ("كلمات البوت") */}
      <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-black text-xs text-amber-300 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>كلمات البوت (botReplies) — ({botReplies.length})</span>
            </h4>
            <p className="text-[10px] text-slate-400">
              يمكنك استخدام المتغيرات: {'{اسم العضو}'} و {'{الوقت الحقيقي}'} و {'{اسم البوت}'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingReplyId(null);
              setReplyKeywordInput('');
              setReplyTextInput('');
              setShowAddReplyForm((prev) => !prev);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة كلمة جديدة</span>
          </button>
        </div>

        {showAddReplyForm && (
          <form onSubmit={handleSaveReply} className="p-3 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">الكلمة (المُشغّل):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: السلام عليكم"
                  value={replyKeywordInput}
                  onChange={(e) => setReplyKeywordInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">الرد:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: وعليكم السلام ورحمة الله، نورتنا يا {اسم العضو} 🌹"
                  value={replyTextInput}
                  onChange={(e) => setReplyTextInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs outline-none focus:border-indigo-400"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddReplyForm(false);
                  setEditingReplyId(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
              >
                حفظ
              </button>
            </div>
          </form>
        )}

        <input
          type="text"
          placeholder="ابحث في كلمات البوت..."
          value={replySearchQuery}
          onChange={(e) => setReplySearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs outline-none focus:border-amber-500"
        />

        <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/70 rounded-xl border border-slate-800 bg-slate-900/50">
          {filteredReplies.map((item) => (
            <div key={item.id} className="p-2.5 flex items-center justify-between gap-2 hover:bg-white/5">
              <div className="min-w-0 flex-1">
                <div className="font-black text-amber-300 text-xs">{item.keyword}</div>
                <div className="text-[11px] text-slate-300 break-words">{item.reply}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReplyId(item.id);
                    setReplyKeywordInput(item.keyword);
                    setReplyTextInput(item.reply);
                    setShowAddReplyForm(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-200 hover:text-white text-[10px] font-bold cursor-pointer"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => socket?.emit('deleteBotReply', { id: item.id })}
                  className="px-2 py-1 rounded-lg bg-rose-800/80 hover:bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Bot Modal */}
      {showBotForm && (
        <div
          className="fixed inset-0 z-[10070] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3"
          onClick={() => setShowBotForm(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-amber-500/40 shadow-2xl text-right"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10">
              <h4 className="font-black text-sm text-amber-300 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span>{editingBotId ? 'تعديل بيانات البوت' : 'إنشاء بوت جديد'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowBotForm(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBot} className="p-4 space-y-3 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* اسم البوت */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">اسم البوت (إجباري):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سارة"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* صورة البوت: رفع من الجهاز + 6 صور جاهزة */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-200">صورة البوت (إجباري):</label>
                <div className="flex items-center gap-3">
                  <img
                    src={botAvatarUrl}
                    alt="معاينة"
                    className="w-14 h-14 rounded-xl object-cover border-2 border-amber-500 shrink-0 bg-slate-950"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileUpload}
                    />
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? `جاري الرفع ${uploadProgress}%...` : 'رفع صورة من الجهاز'}</span>
                    </button>
                    <div className="text-[10px] text-slate-400">أو اختر سريعاً من 6 صور جاهزة:</div>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-2 pt-1">
                  {PRESET_BOT_AVATARS.map((preset) => {
                    const selected = botAvatarUrl === preset.url;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setBotAvatarUrl(preset.url)}
                        title={preset.label}
                        className={`p-1 rounded-xl border transition-all cursor-pointer ${
                          selected ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400' : 'border-slate-700 bg-slate-950 hover:border-slate-500'
                        }`}
                      >
                        <img src={preset.url} alt={preset.label} className="w-full aspect-square rounded-lg object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* الحالة (4 خيارات فقط) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">الحالة (إجباري):</label>
                  <select
                    required
                    value={botStatus}
                    onChange={(e) => setBotStatus(e.target.value as BotStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                  >
                    <option value="online">متصل - أخضر</option>
                    <option value="offline">غير متصل - رمادي</option>
                    <option value="away">مشغول - أصفر</option>
                    <option value="hidden">مخفي</option>
                  </select>
                </div>

                {/* شخصية البوت */}
                <div>
                  <label className="block font-bold text-slate-200 mb-1">شخصية البوت (إجباري):</label>
                  <select
                    required
                    value={botPersonality}
                    onChange={(e) => setBotPersonality(e.target.value as BotPersonality)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                  >
                    <option value="ودود">ودود</option>
                    <option value="رسمي">رسمي</option>
                    <option value="مرح">مرح</option>
                    <option value="ذكي">ذكي</option>
                  </select>
                </div>
              </div>

              {/* الحالة الكتابية */}
              <div>
                <label className="block font-bold text-slate-200 mb-1">الحالة الكتابية تحت الاسم (إجباري):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: أهلاً بكم في شات حسن برو"
                  value={botStatusQuote}
                  onChange={(e) => setBotStatusQuote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                />
              </div>

              {/* الغرفة الافتراضية + العلم يدوياً */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-200 mb-1">الغرفة الافتراضية (إجباري):</label>
                  <select
                    required
                    value={botDefaultRoom}
                    onChange={(e) => setBotDefaultRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                  >
                    {roomsList.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-200 mb-1">العلم / الدولة (يدوياً):</label>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={BOT_FLAG_OPTIONS.some((c) => c.flag === botFlag) ? botFlag : '__custom__'}
                      onChange={(e) => {
                        if (e.target.value !== '__custom__') {
                          setBotFlag(e.target.value);
                        }
                      }}
                      className="flex-1 min-w-0 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                    >
                      {BOT_FLAG_OPTIONS.map((c) => (
                        <option key={c.flag} value={c.flag}>
                          {c.flag} {c.label}
                        </option>
                      ))}
                      {!BOT_FLAG_OPTIONS.some((c) => c.flag === botFlag) && (
                        <option value="__custom__">{botFlag} علم مخصص</option>
                      )}
                    </select>
                    <input
                      type="text"
                      maxLength={8}
                      value={botFlag}
                      onChange={(e) => setBotFlag(e.target.value)}
                      placeholder="🇸🇦"
                      title="يمكنك أيضاً لصق أي علم دولة أو رمز هنا"
                      className="w-12 px-1.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center text-sm text-white outline-none focus:border-amber-500 shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* ملاحظة اختيارية */}
              <div>
                <label className="block font-bold text-slate-400 mb-1">ملاحظة (اختياري):</label>
                <input
                  type="text"
                  placeholder="ملاحظة إدارية داخلية..."
                  value={botNote}
                  onChange={(e) => setBotNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBotForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
