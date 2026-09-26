import { Boss, BossStatus } from '../types';

export function getBossStatus(boss: Boss, now: number): BossStatus {
  if (!boss.respawnAt) return 'unset';
  const diff = boss.respawnAt - now;
  if (diff <= 0) return 'spawned';
  if (diff <= 15 * 60 * 1000) return 'imminent';
  return 'counting';
}

export function formatDurationHours(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  if (minutes === 0) return `${wholeHours} ชม.`;
  if (wholeHours === 0) return `${minutes} นาที`;
  return `${wholeHours} ชม. ${minutes} นาที`;
}

export function formatTimeOnly(timestamp: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatDateTime(timestamp: number | null): string {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  const d = date.getDate();
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const month = months[date.getMonth()];
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${d} ${month} ${h}:${m}`;
}

export function formatCountdown(diffMs: number): { text: string; isOverdue: boolean } {
  const isOverdue = diffMs < 0;
  const absMs = Math.abs(diffMs);

  const totalSec = Math.floor(absMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const hStr = hours > 0 ? `${String(hours).padStart(2, '0')}:` : '';
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');

  const text = `${isOverdue ? '+' : ''}${hStr}${mStr}:${sStr}`;
  return { text, isOverdue };
}

export function generateClanScheduleText(
  bosses: Boss[],
  options: {
    includeSpawned: boolean;
    onlyPinned: boolean;
    timeWindowHours?: number;
  }
): string {
  const now = Date.now();
  const currentDate = new Date(now);
  const timeStr = `${String(currentDate.getHours()).padStart(2, '0')}:${String(currentDate.getMinutes()).padStart(2, '0')}`;

  let list = [...bosses].filter((b) => b.respawnAt !== null);

  if (options.onlyPinned) {
    list = list.filter((b) => b.pinned);
  }

  // Sort by respawn time
  list.sort((a, b) => (a.respawnAt || 0) - (b.respawnAt || 0));

  const spawnedBosses = list.filter((b) => (b.respawnAt || 0) <= now);
  const upcomingBosses = list.filter((b) => {
    if ((b.respawnAt || 0) <= now) return false;
    if (options.timeWindowHours) {
      const diffHrs = ((b.respawnAt || 0) - now) / (3600 * 1000);
      return diffHrs <= options.timeWindowHours;
    }
    return true;
  });

  const lines: string[] = [];
  lines.push(`⚔️ [ตารางเกิดบอส MMORPG] อัปเดต ${timeStr} น.`);
  lines.push('──────────────────────');

  if (options.includeSpawned && spawnedBosses.length > 0) {
    lines.push(`🔴 【เกินเวลาแล้ว (${spawnedBosses.length})】`);
    spawnedBosses.forEach((b) => {
      const diff = now - (b.respawnAt || 0);
      const minsAgo = Math.floor(diff / 60000);
      const name = b.thaiName || b.name;
      lines.push(`• #${b.num} ${name} (เกินเวลาแล้ว ${minsAgo} นาที)`);
    });
    lines.push('');
  }

  if (upcomingBosses.length > 0) {
    lines.push(`🟡 【คิวบอสใกล้เกิด (${upcomingBosses.length})】`);
    upcomingBosses.forEach((b) => {
      const spawnDate = new Date(b.respawnAt || 0);
      const spawnTime = `${String(spawnDate.getHours()).padStart(2, '0')}:${String(spawnDate.getMinutes()).padStart(2, '0')}`;
      const diffMin = Math.round(((b.respawnAt || 0) - now) / 60000);
      const name = b.thaiName || b.name;

      let remainingText = '';
      if (diffMin >= 60) {
        const hrs = Math.floor(diffMin / 60);
        const rm = diffMin % 60;
        remainingText = rm > 0 ? `อีก ${hrs} ชม. ${rm} น.` : `อีก ${hrs} ชม.`;
      } else {
        remainingText = `อีก ${diffMin} นาที`;
      }

      const pinIcon = b.pinned ? '⭐ ' : '';
      lines.push(`• ${spawnTime} | ${pinIcon}#${b.num} ${name} (${remainingText})`);
    });
  } else {
    lines.push('ไม่มีบอสในคิวที่กำหนด');
  }

  lines.push('──────────────────────');
  lines.push('📱 บันทึกด้วย Lineage 2M Boss Tracker');

  return lines.join('\n');
}
