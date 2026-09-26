import React, { useState } from 'react';
import { Boss, BossStatus } from '../types';
import { formatTimeOnly, formatCountdown } from '../utils/format';
import { Star, RotateCw, Clock, Pencil, Castle, Swords } from 'lucide-react';
import { InlineTimePicker } from './InlineTimePicker';

interface BossTableRowProps {
  boss: Boss;
  now: number;
  status: BossStatus;
  mainServerName?: string;
  invasionServerName?: string;
  onKill: (bossId: string) => void;
  onDirectChangeTime: (bossId: string, newTimeStr: string) => void;
  onOpenClock: (boss: Boss) => void;
  onOpenEdit: (boss: Boss) => void;
  onTogglePin: (bossId: string) => void;
}

export const BossTableRow: React.FC<BossTableRowProps> = ({
  boss,
  now,
  status,
  mainServerName,
  invasionServerName,
  onKill,
  onDirectChangeTime,
  onOpenClock,
  onOpenEdit,
  onTogglePin,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const isSpawned = status === 'spawned';
  const isImminent = status === 'imminent';

  // Format time (HH:mm)
  const timeOnly = boss.respawnAt ? formatTimeOnly(boss.respawnAt).slice(0, 5) : '--:--';

  // Overdue elapsed time
  const overdueDiff = boss.respawnAt && isSpawned ? now - boss.respawnAt : 0;
  const overdueCountdown = overdueDiff > 0 ? formatCountdown(-overdueDiff) : null;

  return (
    <div
      className={`group flex items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-800/80 hover:bg-slate-900/50 transition-colors ${
        boss.pinned ? 'bg-amber-950/10' : ''
      }`}
    >
      {/* 1. Left: Star + Boss Name + Tags */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onTogglePin(boss.id)}
          className="p-1 transition-colors shrink-0 cursor-pointer"
          title={boss.pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด'}
        >
          <Star
            className={`w-5 h-5 transition-transform ${
              boss.pinned ? 'text-amber-400 fill-amber-400 scale-110' : 'text-slate-600 hover:text-amber-400'
            }`}
          />
        </button>

        <div className="flex flex-wrap items-center gap-2.5 min-w-0">
          <span className="font-semibold text-sm sm:text-base text-white tracking-wide truncate">
            {boss.thaiName || boss.name}
            {boss.engName && (
              <span className="text-slate-400 text-xs sm:text-sm font-normal ml-1.5">
                - {boss.engName}
              </span>
            )}
          </span>

          {/* Server Badge: 🏰 เซิร์ฟหลัก หรือ ⚔️ เซิร์ฟ Invasion */}
          {boss.server === 'invasion' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#240e36] text-purple-300 border border-purple-800/60 shadow-sm shrink-0">
              <Swords className="w-3 h-3 text-purple-400" />
              <span>{invasionServerName || boss.serverTag || 'Invasion'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#082238] text-cyan-300 border border-cyan-800/60 shadow-sm shrink-0">
              <Castle className="w-3 h-3 text-cyan-400" />
              <span>{mainServerName || boss.serverTag || 'เซิร์ฟหลัก'}</span>
            </span>
          )}

          {/* Overdue Badge: เกินเวลาแล้ว */}
          {isSpawned && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3b1220] text-rose-300 border border-rose-600/70 shadow-sm shrink-0 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
              <span>เกินเวลาแล้ว</span>
              {overdueCountdown && (
                <span className="font-mono text-[10px] text-rose-200 opacity-90">
                  ({overdueCountdown.text})
                </span>
              )}
            </div>
          )}

          {isImminent && !isSpawned && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/70 text-amber-300 border border-amber-800/60 shrink-0">
              ใกล้เกิด
            </span>
          )}

          {!boss.respawnAt && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-normal text-slate-400 bg-slate-800/60 border border-slate-700/60 shrink-0">
              รอระบุเวลา
            </span>
          )}
        </div>
      </div>

      {/* 2. Middle: เวลาเกิด GMT+7 (แก้ไขได้) with dual-column dropdown picker */}
      <div className="flex items-center justify-center min-w-[160px] sm:min-w-[200px] shrink-0">
        <div className="relative flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
              isPickerOpen
                ? 'border-amber-500 ring-1 ring-amber-500 bg-[#070d19] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : isSpawned
                ? 'border-rose-600/80 bg-rose-950/20 text-rose-300 hover:border-rose-500 shadow-sm'
                : 'border-slate-700/80 bg-[#070d19] hover:border-amber-500/80'
            }`}
            title="กดเพื่อเลือกหรือเปลี่ยนเวลาเกิด (อ้างอิงวันนี้)"
          >
            <span
              className={`font-mono text-sm sm:text-base font-bold ${
                !boss.respawnAt
                  ? 'text-slate-500'
                  : isSpawned
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {timeOnly}
            </span>
            <Clock className={`w-3.5 h-3.5 ${isSpawned ? 'text-rose-400' : 'text-slate-500'}`} />
          </button>
          <span className="text-xs text-slate-400 font-normal">น.</span>

          {/* Dual-column Time Picker Dropdown */}
          <InlineTimePicker
            currentHHmm={timeOnly}
            isOpen={isPickerOpen}
            onClose={() => setIsPickerOpen(false)}
            onSelectTime={(newTime) => {
              onDirectChangeTime(boss.id, newTime);
            }}
          />
        </div>
      </div>

      {/* 3. Right: อัปเดต (เวลาตาย) & เครื่องมือ */}
      <div className="flex items-center justify-end gap-3 sm:gap-6 min-w-[180px] shrink-0">
        <div className="flex items-center gap-2">
          {/* [ 🔄 อัปเดต ] Action Button */}
          <button
            type="button"
            onClick={() => onKill(boss.id)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-[#d97706] active:bg-[#b45309] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer font-sans"
            title="กดอัปเดต: นำเวลาเกิดปัจจุบัน + คูลดาวน์ หาเวลาเกิดรอบถัดไป"
          >
            <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>อัปเดต</span>
          </button>

          {/* [ 🕒 ] Clock / Direct Time Pick Button */}
          <button
            type="button"
            onClick={() => onOpenClock(boss)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="ระบุเวลาเกิด / เวลาตายแบบเจาะจง"
          >
            <Clock className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* [ ✏️ ] Tool Button */}
        <button
          type="button"
          onClick={() => onOpenEdit(boss)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-colors cursor-pointer"
          title="แก้ไขข้อมูลบอส"
        >
          <Pencil className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </div>
  );
};
