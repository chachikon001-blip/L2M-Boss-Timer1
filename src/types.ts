export interface Boss {
  id: string;
  num: number;
  name: string;
  thaiName: string;
  engName: string;
  cooldownHours: number;
  lastKilledAt: number | null;
  respawnAt: number | null;
  pinned: boolean;
  lastAlertCycleRespawnAt: number | null;
  notifiedStages: Record<string, boolean>;
  server: 'main' | 'invasion'; // 'main' = เซิร์ฟหลัก, 'invasion' = เซิร์ฟ Invasion
  serverTag?: string; // 'เซิร์ฟหลัก' | 'เซิร์ฟ Invasion'
  location?: string;
  notes?: string;
}

export type BossStatus = 'spawned' | 'imminent' | 'counting' | 'unset';

export type ServerFilterType = 'all' | 'main' | 'invasion';

export interface ServerConfig {
  mainServerName: string;
  invasionServerName: string;
}

export type FilterType = 'all' | 'spawned' | 'imminent' | 'counting' | 'pinned' | 'unset';

export type SortType = 'respawn' | 'num' | 'cooldown' | 'name';

export interface SoundSettings {
  soundEnabled: boolean;
  ttsEnabled: boolean;
  voiceGender: 'female' | 'male';
  volume: number; // 0 to 1
  speechRate: number; // 0.8 to 1.5
  speechPitch: number; // 0.8 to 1.4
  soundType: 'synth-crystal' | 'synth-alarm' | 'synth-radar' | 'synth-bell';
  stages: {
    '10m': boolean;
    '5m': boolean;
    '3m': boolean;
    '1m': boolean;
    'spawned': boolean;
  };
  browserNotification: boolean;
}

export interface GuildActivity {
  id: string;
  title: string;
  dayType: 'all' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'mwf' | 'weekend';
  dayLabel: string; // e.g. "จันทร์, พุธ, ศุกร์" or "ทุกๆวัน"
  time: string; // e.g. "08:00 - 00:00" or "20:00"
  location?: string;
  description?: string;
  enabled: boolean;
}

export interface DiscordSettings {
  enabled: boolean;
  webhookUrl: string;
  botName: string;
  mentionType: 'none' | 'everyone' | 'here' | 'role';
  customRoleId?: string;
  stages: {
    '10m': boolean;
    '5m': boolean;
    '3m': boolean;
    '1m': boolean;
    '0m': boolean;
  };
  bossFilterMode: 'all' | 'pinned' | 'custom';
  selectedBossIds: string[];
}

export interface RebootOffsetRule {
  id: string;
  bossDisplayName: string;
  matchKeyword: string; // keyword to match thaiName, engName or name
  offsetHours: number;
}
