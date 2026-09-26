import React, { useState, useMemo } from 'react';
import { Boss, DiscordSettings } from '../types';
import { generateClanScheduleText } from '../utils/format';
import {
  X,
  Bell,
  Send,
  Copy,
  Check,
  Search,
  Castle,
  Swords,
  Star,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface DiscordModalProps {
  bosses: Boss[];
  isOpen: boolean;
  onClose: () => void;
  settings: DiscordSettings;
  onSaveSettings: (settings: DiscordSettings) => void;
  mainServerName?: string;
  invasionServerName?: string;
}

export const DiscordModal: React.FC<DiscordModalProps> = ({
  bosses,
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  mainServerName = 'เซิร์ฟหลัก',
  invasionServerName = 'Invasion',
}) => {
  if (!isOpen) return null;

  // Local state initialized with passed settings
  const [enabled, setEnabled] = useState(settings.enabled);
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '');
  const [botName, setBotName] = useState(settings.botName || 'L2M Boss Notifier');
  const [mentionType, setMentionType] = useState<DiscordSettings['mentionType']>(
    settings.mentionType || 'none'
  );
  const [customRoleId, setCustomRoleId] = useState(settings.customRoleId || '');
  const [stages, setStages] = useState(
    settings.stages || {
      '10m': false,
      '5m': true,
      '3m': false,
      '1m': true,
      '0m': true,
    }
  );
  const [bossFilterMode, setBossFilterMode] = useState<DiscordSettings['bossFilterMode']>(
    settings.bossFilterMode || 'all'
  );
  const [selectedBossIds, setSelectedBossIds] = useState<string[]>(
    settings.selectedBossIds && settings.selectedBossIds.length > 0
      ? settings.selectedBossIds
      : bosses.map((b) => b.id)
  );

  // Search & filter for boss selection list
  const [bossSearchQuery, setBossSearchQuery] = useState('');
  const [bossTabFilter, setBossTabFilter] = useState<'all' | 'main' | 'invasion'>('all');

  // UI state for testing and status
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [sendingSchedule, setSendingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtered bosses for the selection list
  const filteredBosses = useMemo(() => {
    let list = [...bosses];
    if (bossTabFilter === 'main') {
      list = list.filter((b) => b.server !== 'invasion');
    } else if (bossTabFilter === 'invasion') {
      list = list.filter((b) => b.server === 'invasion');
    }
    if (bossSearchQuery.trim()) {
      const q = bossSearchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.thaiName.toLowerCase().includes(q) ||
          b.engName.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          String(b.num).includes(q) ||
          (b.location && b.location.toLowerCase().includes(q))
      );
    }
    return list;
  }, [bosses, bossTabFilter, bossSearchQuery]);

  // Toggle stage
  const handleToggleStage = (key: keyof DiscordSettings['stages']) => {
    setStages((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle individual boss
  const handleToggleBoss = (id: string) => {
    setSelectedBossIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all bosses
  const handleSelectAllBosses = () => {
    setSelectedBossIds(bosses.map((b) => b.id));
  };

  // Select only main bosses
  const handleSelectMainOnly = () => {
    const mainIds = bosses.filter((b) => b.server !== 'invasion').map((b) => b.id);
    setSelectedBossIds(mainIds);
  };

  // Select only invasion bosses
  const handleSelectInvasionOnly = () => {
    const invIds = bosses.filter((b) => b.server === 'invasion').map((b) => b.id);
    setSelectedBossIds(invIds);
  };

  // Clear all boss selections
  const handleDeselectAll = () => {
    setSelectedBossIds([]);
  };

  // Format mention string
  const getMentionString = () => {
    if (mentionType === 'everyone') return '@everyone ';
    if (mentionType === 'here') return '@here ';
    if (mentionType === 'role' && customRoleId.trim()) return `<@&${customRoleId.trim()}> `;
    return '';
  };

  // Test Webhook Message
  const handleTestSend = async () => {
    if (!webhookUrl.trim()) {
      setErrorMsg('กรุณากรอก Discord Webhook URL ก่อนกดทดสอบ');
      return;
    }
    setErrorMsg(null);
    setSendingTest(true);
    setTestSuccess(false);

    const mention = getMentionString();

    try {
      const res = await fetch('/api/discord/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          username: botName.trim() || 'L2M Boss Notifier',
          message: `${mention}🔔 **[ทดสอบการเชื่อมต่อ]** บอทแจ้งเตือนบอส Lineage 2M เชื่อมต่อ Discord สำเร็จเรียบร้อย!`,
          embeds: [
            {
              title: '✅ ทดสอบส่งแจ้งเตือนสำเร็จ (System Test)',
              description:
                'ระบบแจ้งเตือนบอสพร้อมทำงานเรียบร้อยแล้ว จะส่งข้อความแจ้งเตือนอัตโนมัติตามช่วงเวลาที่คุณเลือก',
              color: 0x5865f2,
              fields: [
                {
                  name: 'บอสที่เลือกแจ้งเตือน',
                  value:
                    bossFilterMode === 'all'
                      ? `บอสทั้งหมด (${bosses.length} ตัว ทั้ง 2 เซิร์ฟ)`
                      : bossFilterMode === 'pinned'
                      ? 'เฉพาะบอสที่ปักหมุด ⭐'
                      : `กำหนดเอง (${selectedBossIds.length} ตัว)`,
                  inline: true,
                },
                {
                  name: 'ช่วงเวลาที่เลือก',
                  value: Object.entries(stages)
                    .filter(([_, v]) => v)
                    .map(([k]) => (k === '0m' ? 'ตอนเกิดทันที' : `${k.replace('m', '')} นาที`))
                    .join(', ') || 'ไม่มี',
                  inline: true,
                },
              ],
              footer: {
                text: 'Lineage 2M Boss Tracker • Discord Webhook Integration',
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ส่งข้อความไม่สำเร็จ');
      }

      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'ส่งทดสอบไม่สำเร็จ ตรวจสอบ Webhook URL อีกครั้ง');
    } finally {
      setSendingTest(false);
    }
  };

  // Send Clan Schedule Text
  const handleSendFullSchedule = async () => {
    if (!webhookUrl.trim()) {
      setErrorMsg('กรุณากรอก Discord Webhook URL');
      return;
    }
    setErrorMsg(null);
    setSendingSchedule(true);
    setScheduleSuccess(false);

    const clanText = generateClanScheduleText(bosses, {
      includeSpawned: true,
      onlyPinned: false,
    });

    const mention = getMentionString();

    try {
      const res = await fetch('/api/discord/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          username: botName.trim() || 'L2M Boss Notifier',
          message: `${mention}\`\`\`fix\n⚔️ [L2M Boss Timer] ตารางเวลาเกิดบอสล่าสุด\n\`\`\`\n${clanText}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'ส่งไม่สำเร็จ');
      }

      setScheduleSuccess(true);
      setTimeout(() => setScheduleSuccess(false), 4000);
    } catch (e: any) {
      setErrorMsg(e.message || 'ส่งไม่สำเร็จ ตรวจสอบ Webhook URL');
    } finally {
      setSendingSchedule(false);
    }
  };

  // Save Settings
  const handleSave = () => {
    const newSettings: DiscordSettings = {
      enabled,
      webhookUrl: webhookUrl.trim(),
      botName: botName.trim() || 'L2M Boss Notifier',
      mentionType,
      customRoleId: customRoleId.trim(),
      stages,
      bossFilterMode,
      selectedBossIds,
    };
    onSaveSettings(newSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b1222] border border-slate-700/80 p-4 sm:p-6 shadow-2xl flex flex-col max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Bell className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                <span>ตั้งค่าแจ้งเตือน Discord Webhook</span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* 1. Toggle Enable Discord Notification Card */}
          <div className="bg-[#070d19] p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white">เปิดใช้งานการแจ้งเตือน Discord</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                ส่งข้อความอัตโนมัติเข้า Channel เมื่อบอสใกล้เกิด
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* 2. Webhook URL Input */}
          <div>
            <label className="text-xs text-slate-300 font-bold block mb-1">
              Discord Webhook URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full rounded-xl bg-[#070d19] border border-slate-700/80 px-3.5 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              วิธีรับ URL: ใน Discord ไปที่การตั้งค่าช่อง (Edit Channel) → การเชื่อมต่อ (Integrations) → เว็บฮุก (Webhooks) → คัดลอก URL
            </p>
          </div>

          {/* 3. Bot Name & Mention Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                ชื่อบอทที่แสดง
              </label>
              <input
                type="text"
                placeholder="L2M Boss Notifier"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700/80 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-bold block mb-1">
                แท็กผู้ใช้ (Mention)
              </label>
              <select
                value={mentionType}
                onChange={(e) => setMentionType(e.target.value as any)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700/80 px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="none">ไม่แท็ก (None)</option>
                <option value="everyone">@everyone</option>
                <option value="here">@here</option>
                <option value="role">แท็ก Role ID</option>
              </select>
            </div>
          </div>

          {mentionType === 'role' && (
            <div>
              <label className="text-xs text-indigo-300 font-semibold block mb-1">
                ระบุ Role ID ใน Discord (เช่น 123456789012345678)
              </label>
              <input
                type="text"
                placeholder="พิมพ์ตัวเลข Role ID..."
                value={customRoleId}
                onChange={(e) => setCustomRoleId(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-indigo-700/60 px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-400"
              />
            </div>
          )}

          {/* 4. Alert Notification Stages */}
          <div>
            <label className="text-xs text-slate-300 font-bold block mb-2">
              ช่วงเวลาที่ให้ส่งแจ้งเตือนเข้า Discord:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* 10 นาทีก่อนเกิด */}
              <div
                onClick={() => handleToggleStage('10m')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stages['10m']
                    ? 'bg-[#0a1530] border-indigo-500/70 text-white shadow-sm'
                    : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stages['10m']}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 pointer-events-none"
                />
                <span className="text-xs font-semibold">10 นาทีก่อนเกิด</span>
              </div>

              {/* 5 นาทีก่อนเกิด ★ */}
              <div
                onClick={() => handleToggleStage('5m')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stages['5m']
                    ? 'bg-[#0a1530] border-amber-500/70 text-white shadow-sm'
                    : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stages['5m']}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 pointer-events-none"
                />
                <div className="flex items-center gap-1 text-xs font-semibold">
                  <span>5 นาทีก่อนเกิด</span>
                  <span className="text-amber-400 font-bold">★</span>
                </div>
              </div>

              {/* 3 นาทีก่อนเกิด */}
              <div
                onClick={() => handleToggleStage('3m')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stages['3m']
                    ? 'bg-[#0a1530] border-indigo-500/70 text-white shadow-sm'
                    : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stages['3m']}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 pointer-events-none"
                />
                <span className="text-xs font-semibold">3 นาทีก่อนเกิด</span>
              </div>

              {/* 1 นาทีก่อนเกิด */}
              <div
                onClick={() => handleToggleStage('1m')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  stages['1m']
                    ? 'bg-[#0a1530] border-indigo-500/70 text-white shadow-sm'
                    : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stages['1m']}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 pointer-events-none"
                />
                <span className="text-xs font-semibold">1 นาทีก่อนเกิด</span>
              </div>
            </div>

            {/* แจ้งเตือนตอนบอสเกิดทันที (0 นาที) */}
            <div
              onClick={() => handleToggleStage('0m')}
              className={`mt-2 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                stages['0m']
                  ? 'bg-[#0a1530] border-rose-500/70 text-white shadow-sm'
                  : 'bg-[#070d19] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={stages['0m']}
                onChange={() => {}}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 pointer-events-none"
              />
              <span className="text-xs font-semibold text-rose-300">
                แจ้งเตือนตอนบอสเกิดทันที (0 นาที)
              </span>
            </div>
          </div>

          {/* 5. USER REQUEST: เพิ่ม และตัวเลือก เพิ่มรายชื่อทั้งหมดไปด้วย (BOSS SELECTION) */}
          <div className="bg-[#070d19] p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs text-amber-300 font-bold flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>ตัวเลือกรายชื่อบอสที่จะให้แจ้งเตือนเข้า Discord:</span>
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                เลือกแล้ว{' '}
                <span className="text-amber-400 font-bold">
                  {bossFilterMode === 'all'
                    ? bosses.length
                    : bossFilterMode === 'pinned'
                    ? bosses.filter((b) => b.pinned).length
                    : selectedBossIds.length}
                </span>{' '}
                / {bosses.length} ตัว
              </span>
            </div>

            {/* Filter Mode Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setBossFilterMode('all');
                  handleSelectAllBosses();
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bossFilterMode === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>บอสทั้งหมด ({bosses.length})</span>
                <span className="text-[10px] opacity-80">(เพิ่มทั้งหมด)</span>
              </button>

              <button
                type="button"
                onClick={() => setBossFilterMode('pinned')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bossFilterMode === 'pinned'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>เฉพาะที่ปักหมุด</span>
              </button>

              <button
                type="button"
                onClick={() => setBossFilterMode('custom')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  bossFilterMode === 'custom'
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>เลือกรายชื่อเอง</span>
              </button>
            </div>

            {/* Boss List Box with search and quick actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Search */}
                <div className="relative flex-1 min-w-[160px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="ค้นหาบอสในรายชื่อ..."
                    value={bossSearchQuery}
                    onChange={(e) => setBossSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Server Tabs */}
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBossTabFilter('all')}
                    className={`px-2 py-1 rounded transition-colors ${
                      bossTabFilter === 'all'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    type="button"
                    onClick={() => setBossTabFilter('main')}
                    className={`px-2 py-1 rounded transition-colors ${
                      bossTabFilter === 'main'
                        ? 'bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700/60'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    เซิร์ฟหลัก
                  </button>
                  <button
                    type="button"
                    onClick={() => setBossTabFilter('invasion')}
                    className={`px-2 py-1 rounded transition-colors ${
                      bossTabFilter === 'invasion'
                        ? 'bg-purple-900/60 text-purple-300 font-bold border border-purple-700/60'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Invasion
                  </button>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={handleSelectAllBosses}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold cursor-pointer transition-colors"
                >
                  ✓ เลือกรายชื่อทั้งหมด (94 ตัว)
                </button>
                <button
                  type="button"
                  onClick={handleSelectMainOnly}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer transition-colors"
                >
                  🏰 เฉพาะเซิร์ฟหลัก
                </button>
                <button
                  type="button"
                  onClick={handleSelectInvasionOnly}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 cursor-pointer transition-colors"
                >
                  ⚔️ เฉพาะ Invasion
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900/60 text-rose-300 cursor-pointer transition-colors ml-auto"
                >
                  ✕ ยกเลิกทั้งหมด
                </button>
              </div>

              {/* Boss Items Grid (Scrollable) */}
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950 divide-y divide-slate-800/50 p-1">
                {filteredBosses.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    ไม่พบบอสที่ตรงกับคำค้นหา
                  </div>
                ) : (
                  filteredBosses.map((boss) => {
                    const isChecked =
                      bossFilterMode === 'all'
                        ? true
                        : bossFilterMode === 'pinned'
                        ? boss.pinned
                        : selectedBossIds.includes(boss.id);

                    return (
                      <label
                        key={boss.id}
                        className={`flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-900/70 rounded transition-colors cursor-pointer text-xs ${
                          isChecked ? 'bg-slate-900/40' : 'opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (bossFilterMode !== 'custom') {
                                setBossFilterMode('custom');
                              }
                              handleToggleBoss(boss.id);
                            }}
                            className="w-3.5 h-3.5 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="font-mono text-[11px] font-bold text-amber-400 w-7">
                            #{boss.num}
                          </span>
                          <span className="font-semibold text-white truncate">
                            {boss.thaiName || boss.name}
                            {boss.engName && (
                              <span className="text-slate-400 font-normal ml-1 text-[11px]">
                                ({boss.engName})
                              </span>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {boss.server === 'invasion' ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#240e36] text-purple-300 border border-purple-800/60">
                              <Swords className="w-2.5 h-2.5" />
                              <span>{invasionServerName}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#082238] text-cyan-300 border border-cyan-800/60">
                              <Castle className="w-2.5 h-2.5" />
                              <span>{mainServerName}</span>
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-slate-400">
                            {boss.cooldownHours}ชม.
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Test & Immediate Send Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={sendingTest}
              onClick={handleTestSend}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sendingTest ? 'กำลังทดสอบ...' : 'ทดสอบส่งข้อความ'}</span>
            </button>

            <button
              type="button"
              disabled={sendingSchedule}
              onClick={handleSendFullSchedule}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#121c3b] hover:bg-[#1a2854] text-indigo-300 text-xs font-semibold border border-indigo-700/50 transition-colors cursor-pointer disabled:opacity-50"
              title="ส่งตารางเวลาเกิดของบอสทั้งหมดเข้า Discord ทันที"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>{sendingSchedule ? 'กำลังส่งตาราง...' : 'ส่งตารางบอสทั้งหมดเข้า Discord'}</span>
            </button>
          </div>

          {/* Status Feedback Messages */}
          {errorMsg && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testSuccess && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>ส่งข้อความทดสอบเข้า Discord สำเร็จแล้ว! ตรวจสอบที่ Discord ได้เลย</span>
            </div>
          )}

          {scheduleSuccess && (
            <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs animate-in fade-in">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>ส่งตารางบอสทั้งหมดเข้า Discord เรียบร้อยแล้ว!</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold shadow-lg shadow-indigo-950 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>บันทึกการตั้งค่า Discord</span>
          </button>
        </div>
      </div>
    </div>
  );
};
