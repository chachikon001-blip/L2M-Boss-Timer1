import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Boss,
  ServerFilterType,
  ServerConfig,
  FilterType,
  SortType,
  SoundSettings,
  DiscordSettings,
  GuildActivity,
  RebootOffsetRule,
} from './types';
import { INITIAL_BOSSES } from './data/defaultBosses';
import { DEFAULT_ACTIVITIES } from './data/defaultActivities';
import { BossTableRow } from './components/BossTableRow';
import { BossCard } from './components/BossCard';
import { EditBossModal } from './components/EditBossModal';
import { AddBossModal } from './components/AddBossModal';
import { QuickTimeModal } from './components/QuickTimeModal';
import { RebootServerModal } from './components/RebootServerModal';
import { ActivitiesModal } from './components/ActivitiesModal';
import { DiscordModal } from './components/DiscordModal';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { soundManager } from './utils/audio';
import { getBossStatus } from './utils/format';
import {
  Swords,
  Clock,
  Table,
  LayoutGrid,
  Volume2,
  VolumeX,
  Bell,
  RotateCw,
  Plus,
  Search,
  Star,
  Calendar,
  Castle,
  Globe,
  CheckCircle2,
  Settings2,
  Check,
} from 'lucide-react';

const LOCAL_SOUND_KEY = 'l2m_sound_settings_v3';
const DISCORD_WEBHOOK_KEY = 'l2m_discord_webhook_url';
const DISCORD_SETTINGS_KEY = 'l2m_discord_settings_v3';

const DEFAULT_DISCORD_SETTINGS: DiscordSettings = {
  enabled: false,
  webhookUrl: '',
  botName: 'L2M Boss Notifier',
  mentionType: 'none',
  customRoleId: '',
  stages: {
    '10m': false,
    '5m': true,
    '3m': false,
    '1m': true,
    '0m': true,
  },
  bossFilterMode: 'all',
  selectedBossIds: [],
};

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  soundEnabled: true,
  ttsEnabled: true,
  voiceGender: 'female',
  volume: 0.8,
  speechRate: 1.05,
  speechPitch: 1.15,
  soundType: 'synth-crystal',
  stages: {
    '10m': true,
    '5m': true,
    '3m': true,
    '1m': true,
    'spawned': true,
  },
  browserNotification: false,
};

export default function App() {
  const [now, setNow] = useState<number>(Date.now());
  const [bosses, setBosses] = useState<Boss[]>(INITIAL_BOSSES);
  const [activities, setActivities] = useState<GuildActivity[]>(DEFAULT_ACTIVITIES);

  // Filters & Views
  const [serverFilter, setServerFilter] = useState<ServerFilterType>('all'); // 'all' | 'main' | 'invasion'
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortType>('respawn');

  // Server Names Config (เซิร์ฟหลัก vs เซิร์ฟ Invasion)
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    mainServerName: 'เซิร์ฟหลัก 01',
    invasionServerName: 'Invasion 01',
  });

  // Sound Settings
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_SOUND_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return DEFAULT_SOUND_SETTINGS;
  });

  // Discord Webhook & Notification Settings
  const [discordSettings, setDiscordSettings] = useState<DiscordSettings>(() => {
    try {
      const saved = localStorage.getItem(DISCORD_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_DISCORD_SETTINGS, ...JSON.parse(saved) };
      const legacyUrl = localStorage.getItem(DISCORD_WEBHOOK_KEY);
      if (legacyUrl) return { ...DEFAULT_DISCORD_SETTINGS, webhookUrl: legacyUrl };
    } catch {
      // ignore
    }
    return DEFAULT_DISCORD_SETTINGS;
  });

  // Modals
  const [editingBoss, setEditingBoss] = useState<Boss | null>(null);
  const [quickTimeBoss, setQuickTimeBoss] = useState<Boss | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRebootModalOpen, setIsRebootModalOpen] = useState(false);
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false);
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load & Real-time Server-Sent Events (SSE) Synchronization
  useEffect(() => {
    // Initial fetch bosses
    fetch('/api/bosses')
      .then((res) => res.json())
      .then((data) => {
        if (data.bosses && Array.isArray(data.bosses) && data.bosses.length > 0) {
          setBosses(data.bosses);
        } else {
          // Initialize server with default bosses
          fetch('/api/bosses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bosses: INITIAL_BOSSES }),
          });
        }
      })
      .catch((err) => {
        console.error('Fetch bosses error:', err);
      });

    // Initial fetch server config
    fetch('/api/server-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.mainServerName) {
          setServerConfig(data);
        }
      })
      .catch((err) => {
        console.error('Fetch server config error:', err);
      });

    // Initial fetch activities
    fetch('/api/activities')
      .then((res) => res.json())
      .then((data) => {
        if (data.activities && Array.isArray(data.activities) && data.activities.length > 0) {
          setActivities(data.activities);
        } else {
          fetch('/api/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activities: DEFAULT_ACTIVITIES }),
          });
        }
      })
      .catch((err) => {
        console.error('Fetch activities error:', err);
      });

    // Real-time EventSource connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'SYNC_BOSSES' && Array.isArray(payload.data)) {
            setBosses(payload.data);
          } else if (payload.type === 'SYNC_ACTIVITIES' && Array.isArray(payload.data)) {
            setActivities(payload.data);
          } else if (payload.type === 'SYNC_SERVER_CONFIG' && payload.data) {
            setServerConfig(payload.data);
          }
        } catch {
          // ignore
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Update server config
  const handleUpdateServerConfig = async (newConfig: Partial<ServerConfig>) => {
    const merged: ServerConfig = { ...serverConfig, ...newConfig };
    setServerConfig(merged);
    try {
      await fetch('/api/server-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      });
    } catch (err) {
      console.error('Failed to update server config:', err);
    }
  };

  // Persist sound settings
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SOUND_KEY, JSON.stringify(soundSettings));
    } catch {
      // ignore
    }
  }, [soundSettings]);

  // Clock Ticker (every 1 second)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Invasion bosses automatic midnight (00:00) reset: เวลาเกิน 00.00 ให้กลับไปเป็น --:--
  useEffect(() => {
    let hasOverMidnight = false;
    const updated = bosses.map((boss) => {
      if (boss.server === 'invasion' && boss.respawnAt !== null) {
        const respDate = new Date(boss.respawnAt);
        const midnight = new Date(
          respDate.getFullYear(),
          respDate.getMonth(),
          respDate.getDate() + 1,
          0, 0, 0, 0
        ).getTime();

        if (now >= midnight) {
          hasOverMidnight = true;
          return {
            ...boss,
            respawnAt: null,
            lastKilledAt: null,
            lastAlertCycleRespawnAt: null,
            notifiedStages: {},
          };
        }
      }
      return boss;
    });

    if (hasOverMidnight) {
      setBosses(updated);
      fetch('/api/bosses/reset-invasion-midnight', { method: 'POST' }).catch(() => {});
    }
  }, [now, bosses]);

  // Alert & Voice Notification Engine (Sound & Discord Webhook)
  useEffect(() => {
    if (!soundSettings.soundEnabled && !soundSettings.ttsEnabled && !discordSettings.enabled) return;

    let needLocalStateUpdate = false;
    const newBosses = bosses.map((boss) => {
      if (!boss.respawnAt) return boss;

      const diff = boss.respawnAt - now;
      const isCycleSame = boss.lastAlertCycleRespawnAt === boss.respawnAt;
      const notified = isCycleSame ? { ...boss.notifiedStages } : {};

      const triggerAlert = (stageKey: keyof typeof soundSettings.stages, text: string) => {
        if (soundSettings.stages[stageKey] && !notified[stageKey]) {
          notified[stageKey] = true;
          needLocalStateUpdate = true;

          if (soundSettings.soundEnabled) {
            soundManager.playSound(soundSettings.soundType, soundSettings.volume);
          }

          if (soundSettings.ttsEnabled) {
            const serverNote = boss.server === 'invasion' ? 'เซิร์ฟเวอร์รุกราน ' : '';
            setTimeout(() => {
              soundManager.speak(
                `${serverNote}${text}`,
                soundSettings.volume,
                soundSettings.voiceGender,
                soundSettings.speechRate,
                soundSettings.speechPitch
              );
            }, 300);
          }
        }
      };

      // Discord automated alert trigger
      const triggerDiscordAlert = (stageKey: keyof DiscordSettings['stages'], minutesLeft: number) => {
        if (!discordSettings.enabled || !discordSettings.webhookUrl) return;
        if (!discordSettings.stages[stageKey]) return;

        // Check boss filter mode
        if (discordSettings.bossFilterMode === 'pinned' && !boss.pinned) return;
        if (
          discordSettings.bossFilterMode === 'custom' &&
          Array.isArray(discordSettings.selectedBossIds) &&
          !discordSettings.selectedBossIds.includes(boss.id)
        ) {
          return;
        }

        const discordNotifiedKey = `discord_${stageKey}`;
        if (notified[discordNotifiedKey]) return;
        notified[discordNotifiedKey] = true;
        needLocalStateUpdate = true;

        let mention = '';
        if (discordSettings.mentionType === 'everyone') mention = '@everyone ';
        else if (discordSettings.mentionType === 'here') mention = '@here ';
        else if (discordSettings.mentionType === 'role' && discordSettings.customRoleId) {
          mention = `<@&${discordSettings.customRoleId}> `;
        }

        const serverName =
          boss.server === 'invasion'
            ? serverConfig.invasionServerName || 'Invasion'
            : serverConfig.mainServerName || 'เซิร์ฟหลัก';

        const isNowSpawned = stageKey === '0m';
        const embedColor = isNowSpawned ? 0xef4444 : stageKey === '1m' ? 0xf59e0b : 0x3b82f6;
        const timeFormatted = boss.respawnAt
          ? new Date(boss.respawnAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          : '-';

        fetch('/api/discord/webhook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            webhookUrl: discordSettings.webhookUrl,
            username: discordSettings.botName || 'L2M Boss Notifier',
            message: `${mention}${isNowSpawned ? '🔴' : '⚠️'} **[แจ้งเตือนบอส]** #${boss.num} **${boss.thaiName}** (${serverName})`,
            embeds: [
              {
                title: isNowSpawned ? '🔴 บอสเกิดแล้ว! (SPAWNED)' : `⚠️ บอสจะเกิดในอีก ${minutesLeft} นาที`,
                description: `บอส **${boss.thaiName}** (${boss.engName || boss.name})`,
                color: embedColor,
                fields: [
                  { name: 'เซิร์ฟเวอร์', value: boss.server === 'invasion' ? `⚔️ ${serverName}` : `🏰 ${serverName}`, inline: true },
                  { name: 'เวลาเกิด', value: `${timeFormatted} น.`, inline: true },
                  { name: 'คูลดาวน์', value: `${boss.cooldownHours} ชม.`, inline: true },
                  ...(boss.location ? [{ name: 'สถานที่', value: boss.location, inline: false }] : []),
                ],
                footer: { text: 'Lineage 2M Boss Tracker • Webhook Alert' },
                timestamp: new Date().toISOString(),
              },
            ],
          }),
        }).catch(() => {});
      };

      // ตรวจสอบเซิร์ฟเวอร์ Invasion: หากเวลาเกิดเกิน 00:00 (ข้ามเที่ยงคืน) ให้รีเซ็ตกลับเป็น --:-- (null)
      if (boss.server === 'invasion' && boss.respawnAt) {
        const respawnDate = new Date(boss.respawnAt);
        const midnight = new Date(
          respawnDate.getFullYear(),
          respawnDate.getMonth(),
          respawnDate.getDate() + 1,
          0, 0, 0, 0
        ).getTime();

        if (now >= midnight) {
          needLocalStateUpdate = true;
          return {
            ...boss,
            respawnAt: null,
            lastAlertCycleRespawnAt: null,
            notifiedStages: {},
          };
        }
      }

      if (diff <= 10 * 60 * 1000 && diff > 9.5 * 60 * 1000) {
        triggerAlert('10m', `${boss.thaiName} จะเกิดในอีก 10 นาที`);
        triggerDiscordAlert('10m', 10);
      } else if (diff <= 5 * 60 * 1000 && diff > 4.5 * 60 * 1000) {
        triggerAlert('5m', `${boss.thaiName} จะเกิดในอีก 5 นาที เตรียมตัว`);
        triggerDiscordAlert('5m', 5);
      } else if (diff <= 3 * 60 * 1000 && diff > 2.5 * 60 * 1000) {
        triggerAlert('3m', `${boss.thaiName} จะเกิดในอีก 3 นาที รวมพล`);
        triggerDiscordAlert('3m', 3);
      } else if (diff <= 1 * 60 * 1000 && diff > 0.2 * 60 * 1000) {
        triggerAlert('1m', `${boss.thaiName} จะเกิดในอีก 1 นาที เข้าจุดวาร์ป`);
        triggerDiscordAlert('1m', 1);
      } else if (diff <= 0 && diff > -2 * 60 * 1000) {
        triggerAlert('spawned', `${boss.thaiName} เกิดแล้ว!`);
        triggerDiscordAlert('0m', 0);
      }

      if (needLocalStateUpdate) {
        return {
          ...boss,
          lastAlertCycleRespawnAt: boss.respawnAt,
          notifiedStages: notified,
        };
      }
      return boss;
    });

    if (needLocalStateUpdate) {
      setBosses(newBosses);
    }
  }, [now, bosses, soundSettings, discordSettings, serverConfig]);

  // Update boss next cycle: เอาเวลาที่เกิด + คูลดาวน์ ของเเต่ละบอสเเละหาเวลาใหม่
  const handleKill = async (bossId: string) => {
    const targetBoss = bosses.find((b) => b.id === bossId);
    if (!targetBoss) return;

    const baseTime = targetBoss.respawnAt ? targetBoss.respawnAt : now;
    const respawnTime = baseTime + targetBoss.cooldownHours * 3600 * 1000;
    const lastKilledAt = baseTime;

    // ตรวจสอบเซิร์ฟเวอร์ Invasion: หากรอบเกิดใหม่เกิน 00:00 ให้กลับไปเป็น --:-- (null)
    let finalRespawn: number | null = respawnTime;
    let isOverMidnight = false;
    if (targetBoss.server === 'invasion') {
      const baseDate = new Date(baseTime);
      const midnightTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate() + 1,
        0, 0, 0, 0
      ).getTime();

      if (respawnTime >= midnightTime) {
        finalRespawn = null;
        isOverMidnight = true;
      }
    }

    const updatedBoss: Boss = {
      ...targetBoss,
      lastKilledAt,
      respawnAt: finalRespawn,
      lastAlertCycleRespawnAt: finalRespawn,
      notifiedStages: {},
    };

    setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
    if (isOverMidnight) {
      showToast(`🔄 อัปเดต ${targetBoss.thaiName} แล้ว (รอบเกิดใหม่เกิน 00:00 จึงรีเซ็ตเป็น --:--)`);
    } else {
      showToast(`🔄 อัปเดตรอบเกิด ${targetBoss.thaiName} แล้ว (+${targetBoss.cooldownHours} ชม.)`);
    }

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: updatedBoss }),
      });
    } catch (e) {
      console.error('Failed to sync boss update:', e);
    }
  };

  // Direct change respawn time from main page
  const handleDirectChangeTime = async (bossId: string, timeString: string) => {
    const targetBoss = bosses.find((b) => b.id === bossId);
    if (!targetBoss) return;

    // ล้างเวลาเป็น --:--
    if (!timeString || timeString === '--:--') {
      const updatedBoss: Boss = {
        ...targetBoss,
        respawnAt: null,
        lastKilledAt: null,
        lastAlertCycleRespawnAt: null,
        notifiedStages: {},
      };
      setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
      showToast(`🕒 รีเซ็ตเวลา ${targetBoss.thaiName} เป็น --:-- แล้ว`);
      try {
        await fetch('/api/bosses/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boss: updatedBoss }),
        });
      } catch (e) {
        console.error('Failed to sync time reset:', e);
      }
      return;
    }

    const [h, m] = timeString.split(':').map(Number);

    // กรณี Invasion ตั้งเวลา 00:00 ถือว่าสิ้นสุดรอบ Invasion รีเซ็ตเป็น --:--
    if (targetBoss.server === 'invasion' && h === 0 && m === 0) {
      const updatedBoss: Boss = {
        ...targetBoss,
        respawnAt: null,
        lastKilledAt: null,
        lastAlertCycleRespawnAt: null,
        notifiedStages: {},
      };
      setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
      showToast(`🕒 สิ้นสุดเวลา Invasion (00:00) รีเซ็ต ${targetBoss.thaiName} เป็น --:--`);
      try {
        await fetch('/api/bosses/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ boss: updatedBoss }),
        });
      } catch (e) {
        console.error('Failed to sync time reset:', e);
      }
      return;
    }

    // วันที่จะอ้างอิงจากวันที่ใส่เวลา (วันนี้)
    const today = new Date(now);
    const targetDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0, 0);
    const newRespawnAt = targetDate.getTime();

    // สำหรับ Invasion: ถ้าเวลาที่ระบุข้ามเที่ยงคืนไปแล้ว (เกิน 00:00) ให้กลับเป็น --:--
    if (targetBoss.server === 'invasion') {
      const midnightTime = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() + 1,
        0, 0, 0, 0
      ).getTime();
      if (now >= midnightTime) {
        const updatedBoss: Boss = {
          ...targetBoss,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
        setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
        showToast(`🕒 เวลาเกิน 00:00 แล้ว รีเซ็ต ${targetBoss.thaiName} เป็น --:--`);
        try {
          await fetch('/api/bosses/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ boss: updatedBoss }),
          });
        } catch (e) {
          console.error('Failed to sync time reset:', e);
        }
        return;
      }
    }

    const newLastKilled = newRespawnAt - targetBoss.cooldownHours * 3600 * 1000;

    const updatedBoss: Boss = {
      ...targetBoss,
      respawnAt: newRespawnAt,
      lastKilledAt: newLastKilled,
      lastAlertCycleRespawnAt: newRespawnAt,
      notifiedStages: {},
    };

    const isOverdue = newRespawnAt <= now;
    setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
    if (isOverdue) {
      showToast(`🕒 ตั้งเวลาเกิด ${targetBoss.thaiName} เป็น ${timeString} น. (เกินเวลาแล้ว)`);
    } else {
      showToast(`🕒 ตั้งเวลาเกิด ${targetBoss.thaiName} เป็น ${timeString} น. เรียบร้อย`);
    }

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: updatedBoss }),
      });
    } catch (e) {
      console.error('Failed to sync direct time change:', e);
    }
  };

  // Quick Time set (Respawn or Kill)
  const handleSaveQuickTime = async (
    bossId: string,
    respawnAt: number | null,
    lastKilledAt: number | null
  ) => {
    const targetBoss = bosses.find((b) => b.id === bossId);
    if (!targetBoss) return;

    const updatedBoss: Boss = {
      ...targetBoss,
      respawnAt,
      lastKilledAt,
      lastAlertCycleRespawnAt: respawnAt,
      notifiedStages: {},
    };

    setBosses((prev) => prev.map((b) => (b.id === bossId ? updatedBoss : b)));
    showToast(`🕒 ตั้งเวลา ${targetBoss.thaiName} แล้ว`);

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: updatedBoss }),
      });
    } catch (e) {
      console.error('Failed to sync boss time:', e);
    }
  };

  // Full Edit save
  const handleSaveFullBoss = async (updatedBoss: Boss) => {
    setBosses((prev) => prev.map((b) => (b.id === updatedBoss.id ? updatedBoss : b)));
    showToast(`บันทึกข้อมูล ${updatedBoss.thaiName} แล้ว`);

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: updatedBoss }),
      });
    } catch (e) {
      console.error('Failed to sync edit:', e);
    }
  };

  // Add new boss
  const handleAddBoss = async (newBoss: Boss) => {
    // assign current server view if applicable
    const bossWithServer: Boss = {
      ...newBoss,
      server: serverFilter === 'invasion' ? 'invasion' : 'main',
      serverTag: serverFilter === 'invasion' ? 'เซิร์ฟ Invasion' : 'เซิร์ฟหลัก',
    };

    setBosses((prev) => [bossWithServer, ...prev]);
    showToast(`เพิ่มบอส ${newBoss.thaiName} ใน ${bossWithServer.serverTag} สำเร็จ`);

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: bossWithServer }),
      });
    } catch (e) {
      console.error('Failed to add boss:', e);
    }
  };

  // Pin toggle
  const handleTogglePin = async (bossId: string) => {
    const target = bosses.find((b) => b.id === bossId);
    if (!target) return;
    const updated = { ...target, pinned: !target.pinned };

    setBosses((prev) => prev.map((b) => (b.id === bossId ? updated : b)));

    try {
      await fetch('/api/bosses/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boss: updated }),
      });
    } catch {
      // ignore
    }
  };

  // Reset all invasion bosses to --:--
  const handleResetInvasion = async () => {
    const updated = bosses.map((b) => {
      if (b.server === 'invasion') {
        return {
          ...b,
          respawnAt: null,
          lastKilledAt: null,
          lastAlertCycleRespawnAt: null,
          notifiedStages: {},
        };
      }
      return b;
    });
    setBosses(updated);
    showToast('รีเซ็ตเวลาบอส Invasion ทั้งหมดเป็น --:-- เรียบร้อยแล้ว');
    try {
      await fetch('/api/bosses/reset-invasion', { method: 'POST' });
    } catch (e) {
      console.error('Failed to reset invasion:', e);
    }
  };

  // Reboot Server Apply
  const handleApplyReboot = async (
    targetServer: 'all' | 'main' | 'invasion',
    rebootTimestamp: number,
    rules: RebootOffsetRule[]
  ) => {
    showToast('🔄 กำลังคำนวณและตั้งเวลารีบูทเซิร์ฟเวอร์...');
    try {
      const res = await fetch('/api/bosses/reboot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetServer, rebootTimestamp, rules }),
      });
      const data = await res.json();
      showToast(`✅ คำนวณเวลารีบูทสำเร็จ! ตั้งเวลาบอส ${data.count || 27} ตัวแล้ว`);
    } catch (e) {
      console.error('Reboot failed:', e);
      showToast('❌ คำนวณเวลารีบูทไม่สำเร็จ');
    }
  };

  // Save Activities
  const handleSaveActivities = async (updatedActivities: GuildActivity[]) => {
    setActivities(updatedActivities);
    showToast('บันทึกตารางกิจกรรมแล้ว');
    try {
      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updatedActivities }),
      });
    } catch (e) {
      console.error('Failed to sync activities:', e);
    }
  };

  // Filter & Sort bosses
  const displayBosses = useMemo(() => {
    let list = [...bosses];

    // 1. Server filter: main / invasion / all
    if (serverFilter === 'main') {
      list = list.filter((b) => b.server !== 'invasion');
    } else if (serverFilter === 'invasion') {
      list = list.filter((b) => b.server === 'invasion');
    }

    // 2. Status filter
    if (activeFilter === 'spawned') {
      list = list.filter((b) => getBossStatus(b, now) === 'spawned');
    } else if (activeFilter === 'imminent') {
      list = list.filter((b) => getBossStatus(b, now) === 'imminent');
    } else if (activeFilter === 'counting') {
      list = list.filter((b) => getBossStatus(b, now) === 'counting');
    } else if (activeFilter === 'pinned') {
      list = list.filter((b) => b.pinned);
    } else if (activeFilter === 'unset') {
      list = list.filter((b) => getBossStatus(b, now) === 'unset');
    }

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          b.thaiName.toLowerCase().includes(q) ||
          b.engName.toLowerCase().includes(q) ||
          b.name.toLowerCase().includes(q) ||
          String(b.num).includes(q) ||
          (b.serverTag && b.serverTag.toLowerCase().includes(q))
      );
    }

    // 4. Sort: "วิที่เรียงบอสไห้เอา เวลาไกล้ที่สุดขึ้นก่อนไม่สนใจดาว"
    list.sort((a, b) => {
      // เอาเวลาที่ใกล้ที่สุดขึ้นก่อน ไม่สนใจดาว
      if (a.respawnAt && b.respawnAt) {
        return a.respawnAt - b.respawnAt;
      }
      if (a.respawnAt && !b.respawnAt) return -1;
      if (!a.respawnAt && b.respawnAt) return 1;
      return a.num - b.num;
    });

    return list;
  }, [bosses, serverFilter, activeFilter, searchQuery, now]);

  // Current formatted time display (HH:mm:ss)
  const currentClock = useMemo(() => {
    const d = new Date(now);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return {
      time: `${h}:${m}:${s}`,
      date: `${day}/${month}/${year} (GMT+7)`,
    };
  }, [now]);

  // Count bosses in each server
  const mainCount = useMemo(() => bosses.filter((b) => b.server !== 'invasion').length, [bosses]);
  const invasionCount = useMemo(() => bosses.filter((b) => b.server === 'invasion').length, [bosses]);

  return (
    <div className="min-h-screen bg-[#070d19] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0b1329] border border-amber-500/50 text-white text-xs font-semibold shadow-2xl shadow-black/80 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#091024]/95 backdrop-blur-md px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Crossed swords icon + Title + Live Clock */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#181d33] border border-[#2d3356] text-purple-400 shadow-md">
              <Swords className="w-5 h-5 stroke-[2]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  L2M Boss Timer
                </span>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-slate-300 text-xs sm:text-sm font-medium">
                  แจ้งเตือนบอสเกิด
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono font-bold text-slate-200">{currentClock.time}</span>
                <span className="text-slate-600">•</span>
                <span>{currentClock.date}</span>

                <span className="inline-flex items-center gap-1 ml-1 text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  ลิ้งค์ข้อมูลสด
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls matching layout */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#070d19] p-1 rounded-xl border border-slate-800 gap-1">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table'
                    ? 'bg-[#f59e0b] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>ตาราง</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#f59e0b] text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>การ์ด</span>
              </button>
            </div>

            {/* Activities Schedule Button */}
            <button
              type="button"
              onClick={() => setIsActivitiesModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#12193b] border border-indigo-600/50 text-indigo-300 hover:bg-indigo-900/40 transition-colors cursor-pointer shadow-sm"
              title="เปิดตารางกิจกรรมกิลด์/อีเวนต์ เพิ่มลดได้"
            >
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>ตารางกิจกรรม ({activities.length})</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() =>
                setSoundSettings((prev) => ({
                  ...prev,
                  soundEnabled: !prev.soundEnabled,
                  ttsEnabled: !prev.soundEnabled,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                soundSettings.soundEnabled && soundSettings.ttsEnabled
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400 hover:bg-emerald-900/40'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {soundSettings.soundEnabled && soundSettings.ttsEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>อ่านเสียงเปิด</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                  <span>อ่านเสียงปิด</span>
                </>
              )}
            </button>

            {/* Voice Settings */}
            <button
              type="button"
              onClick={() => setIsVoiceModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-medium transition-colors"
            >
              <span>ตั้งค่าเสียง</span>
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600/80 text-white text-[10px] font-bold">
                {soundSettings.voiceGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}
              </span>
            </button>

            {/* Discord */}
            <button
              type="button"
              onClick={() => setIsDiscordModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span>Discord</span>
              {discordSettings.enabled && (
                <span
                  className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                  title="เปิดแจ้งเตือน Discord อัตโนมัติอยู่"
                ></span>
              )}
            </button>

            {/* Reboot Server (with calculation modal) */}
            <button
              type="button"
              onClick={() => setIsRebootModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/60 text-cyan-300 text-xs font-bold transition-colors shadow-sm cursor-pointer"
              title="คำนวณเวลาเกิดอัตโนมัติตามระยะเวลาหลังรีบูทเซิร์ฟเวอร์เสร็จ"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400 stroke-[2.5]" />
              <span>รีบูทเซิร์ฟเวอร์</span>
            </button>

            {/* Add Boss */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer font-sans"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>เพิ่มบอส</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 sm:px-6 py-4 space-y-4">
        {/* SERVER CONFIGURATION BAR (ระบุเซิร์ฟเวอร์หลักว่าเซิร์ฟไหน Invasion เซิร์ฟไหน) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1124] px-4 py-3 rounded-2xl border border-slate-800 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5 shrink-0">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span>ระบุชื่อเซิร์ฟเวอร์:</span>
            </span>

            {/* Input เซิร์ฟหลัก */}
            <div className="flex items-center gap-2 bg-[#070d19] px-3 py-1.5 rounded-xl border border-cyan-800/80 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400 transition-all shadow-inner">
              <Castle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-cyan-300 font-semibold whitespace-nowrap">เซิร์ฟหลัก:</span>
              <input
                type="text"
                value={serverConfig.mainServerName}
                onChange={(e) => handleUpdateServerConfig({ mainServerName: e.target.value })}
                placeholder="เช่น เซิร์ฟหลัก 01, Giran 01"
                className="bg-transparent border-none text-white text-xs font-bold focus:outline-none w-32 sm:w-40 placeholder:text-slate-500"
              />
            </div>

            {/* Input เซิร์ฟ Invasion */}
            <div className="flex items-center gap-2 bg-[#070d19] px-3 py-1.5 rounded-xl border border-purple-800/80 focus-within:border-purple-400 focus-within:ring-1 focus-within:ring-purple-400 transition-all shadow-inner">
              <Swords className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-purple-300 font-semibold whitespace-nowrap">Invasion:</span>
              <input
                type="text"
                value={serverConfig.invasionServerName}
                onChange={(e) => handleUpdateServerConfig({ invasionServerName: e.target.value })}
                placeholder="เช่น Invasion 01, จ.พ.ศ"
                className="bg-transparent border-none text-white text-xs font-bold focus:outline-none w-32 sm:w-40 placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>บันทึกและซิงค์ชื่อเซิร์ฟเวอร์เรียลไทม์</span>
          </div>
        </div>

        {/* SERVER SEPARATION TABS (รวมทั้ง 2 เซิร์ฟ นำหน้า เซิร์ฟหลัก และ เซิร์ฟ Invasion) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a1124] p-2.5 rounded-2xl border border-slate-800">
          <div className="flex items-center flex-wrap gap-1.5">
            {/* 1. รวมทั้ง 2 เซิร์ฟ (หน้าสุด ตามคำขอ) */}
            <button
              type="button"
              onClick={() => setServerFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                serverFilter === 'all'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-950 ring-1 ring-amber-400/50'
                  : 'bg-[#070d19] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-300" />
              <span>รวมทั้ง 2 เซิร์ฟ ({bosses.length})</span>
            </button>

            {/* 2. เซิร์ฟหลัก */}
            <button
              type="button"
              onClick={() => setServerFilter('main')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                serverFilter === 'main'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-950 ring-1 ring-cyan-400/50'
                  : 'bg-[#070d19] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Castle className="w-4 h-4 text-cyan-300" />
              <span>{serverConfig.mainServerName || 'เซิร์ฟหลัก'} ({mainCount})</span>
            </button>

            {/* 3. เซิร์ฟ Invasion */}
            <button
              type="button"
              onClick={() => setServerFilter('invasion')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                serverFilter === 'invasion'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-950 ring-1 ring-purple-400/50'
                  : 'bg-[#070d19] text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Swords className="w-4 h-4 text-purple-300" />
              <span>{serverConfig.invasionServerName || 'เซิร์ฟ Invasion'} ({invasionCount})</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-purple-200">
                จ, พ, ศ 08:00 - 00:00
              </span>
            </button>

            {/* ปุ่มล้างเวลา Invasion เป็น --:-- */}
            {serverFilter === 'invasion' && (
              <button
                type="button"
                onClick={handleResetInvasion}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-950/40 border border-rose-600/50 text-rose-300 hover:bg-rose-900/40 transition-colors shadow-sm cursor-pointer ml-1"
                title="ล้างเวลาบอส Invasion ทั้งหมดกลับเป็น --:--"
              >
                <RotateCw className="w-3 h-3 text-rose-400" />
                <span>ล้างเวลาเป็น --:--</span>
              </button>
            )}
          </div>

          {/* Quick status filters */}
          <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'ทั้งหมด' },
              { id: 'spawned', label: '🔴 เกินเวลาแล้ว' },
              { id: 'imminent', label: 'ใกล้เกิด' },
              { id: 'counting', label: 'นับถอยหลัง' },
              { id: 'pinned', label: '⭐ ปักหมุด' },
              { id: 'unset', label: 'ยังไม่มีเวลา (--:--)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterType)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  activeFilter === tab.id
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Search */}
        <div className="flex items-center justify-between gap-3 bg-[#0a1124] p-3 rounded-2xl border border-slate-800/80">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาบอส... เช่น บาซิลา, เชอร์ทูบา, เฟลิส, ดราก้อนบีสต์"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#070d19] border border-slate-700/70 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-500">แสดงผล:</span>
              <span className="font-bold text-white">{displayBosses.length} ตัว</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-amber-400">
              <span>⭐ ปักหมุด:</span>
              <span className="font-bold">{displayBosses.filter((b) => b.pinned).length}</span>
            </div>
          </div>
        </div>

        {/* LIST / TABLE VIEW (Matching the user screenshot) */}
        {viewMode === 'table' ? (
          <div className="rounded-2xl border border-slate-800/90 bg-[#091124] overflow-hidden shadow-2xl">
            {/* Table Header matching screenshot: ⭐  ชื่อบอส  เวลาเกิด GMT+7 (แก้ไขได้)  อัปเดต (เวลาตาย)  เครื่องมือ */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-[#060c1c]/90 border-b border-slate-800 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-3 sm:gap-6 flex-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400 ml-1" />
                <span>ชื่อบอส</span>
              </div>
              <div className="text-center min-w-[160px] sm:min-w-[200px]">
                <span>เวลาเกิด GMT+7 (แก้ไขได้)</span>
              </div>
              <div className="flex items-center justify-end gap-3 sm:gap-6 min-w-[180px]">
                <span className="text-right">อัปเดต (เวลาตาย)</span>
                <span>เครื่องมือ</span>
              </div>
            </div>

            {displayBosses.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                ไม่พบบอสในหมวดหมู่นี้
              </div>
            ) : (
              displayBosses.map((boss) => (
                <BossTableRow
                  key={boss.id}
                  boss={boss}
                  now={now}
                  status={getBossStatus(boss, now)}
                  mainServerName={serverConfig.mainServerName}
                  invasionServerName={serverConfig.invasionServerName}
                  onKill={handleKill}
                  onDirectChangeTime={handleDirectChangeTime}
                  onOpenClock={(b) => setQuickTimeBoss(b)}
                  onOpenEdit={(b) => setEditingBoss(b)}
                  onTogglePin={handleTogglePin}
                />
              ))
            )}
          </div>
        ) : (
          /* GRID / CARDS VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {displayBosses.map((boss) => (
              <BossCard
                key={boss.id}
                boss={boss}
                now={now}
                status={getBossStatus(boss, now)}
                mainServerName={serverConfig.mainServerName}
                invasionServerName={serverConfig.invasionServerName}
                onKill={handleKill}
                onDirectChangeTime={handleDirectChangeTime}
                onReset={(id) => handleSaveQuickTime(id, null, null)}
                onTogglePin={handleTogglePin}
                onOpenEdit={(b) => setEditingBoss(b)}
              />
            ))}
          </div>
        )}
      </main>

      {/* MODALS */}
      <QuickTimeModal
        boss={quickTimeBoss}
        isOpen={!!quickTimeBoss}
        onClose={() => setQuickTimeBoss(null)}
        onSaveTime={handleSaveQuickTime}
      />

      <EditBossModal
        boss={editingBoss}
        isOpen={!!editingBoss}
        onClose={() => setEditingBoss(null)}
        onSave={handleSaveFullBoss}
      />

      <AddBossModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBoss}
        nextNum={Math.max(...bosses.map((b) => b.num || 0), 0) + 1}
      />

      <RebootServerModal
        isOpen={isRebootModalOpen}
        onClose={() => setIsRebootModalOpen(false)}
        bosses={bosses}
        onApplyReboot={handleApplyReboot}
      />

      <ActivitiesModal
        isOpen={isActivitiesModalOpen}
        onClose={() => setIsActivitiesModalOpen(false)}
        activities={activities}
        onSaveActivities={handleSaveActivities}
      />

      <DiscordModal
        bosses={bosses}
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        settings={discordSettings}
        onSaveSettings={(newSettings) => {
          setDiscordSettings(newSettings);
          try {
            localStorage.setItem(DISCORD_SETTINGS_KEY, JSON.stringify(newSettings));
            localStorage.setItem(DISCORD_WEBHOOK_KEY, newSettings.webhookUrl);
          } catch {}
          showToast(
            newSettings.enabled
              ? '✅ บันทึกและเปิดใช้งานแจ้งเตือน Discord แล้ว'
              : 'บันทึกการตั้งค่า Discord แล้ว'
          );
        }}
        mainServerName={serverConfig.mainServerName}
        invasionServerName={serverConfig.invasionServerName}
      />

      <VoiceSettingsModal
        settings={soundSettings}
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSave={(newSettings) => {
          setSoundSettings(newSettings);
          showToast('บันทึกการตั้งค่าเสียงแล้ว');
        }}
      />
    </div>
  );
}
