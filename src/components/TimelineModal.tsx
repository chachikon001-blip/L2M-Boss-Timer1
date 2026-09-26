import React from 'react';
import { Boss } from '../types';
import { formatTimeOnly, formatCountdown, formatDurationHours } from '../utils/format';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';

interface TimelineModalProps {
  bosses: Boss[];
  now: number;
  isOpen: boolean;
  onClose: () => void;
  onSelectBoss: (boss: Boss) => void;
}

export const TimelineModal: React.FC<TimelineModalProps> = ({
  bosses,
  now,
  isOpen,
  onClose,
  onSelectBoss,
}) => {
  if (!isOpen) return null;

  // Filter only bosses with respawnAt, sort chronologically
  const sorted = [...bosses]
    .filter((b) => b.respawnAt !== null)
    .sort((a, b) => (a.respawnAt || 0) - (b.respawnAt || 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ไทม์ไลน์เวลาเกิดบอส (Boss Spawn Timeline)</h2>
              <p className="text-xs text-slate-400">เรียงตามลำดับเวลาที่จะเกิดจริง จากใกล้ที่สุดไปไกลที่สุด</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              ยังไม่มีบอสที่ถูกจับเวลาในระบบ
            </div>
          ) : (
            sorted.map((boss) => {
              const diff = (boss.respawnAt || 0) - now;
              const isSpawned = diff <= 0;
              const isImminent = diff > 0 && diff <= 15 * 60 * 1000;
              const countdown = formatCountdown(diff);

              return (
                <div
                  key={boss.id}
                  onClick={() => {
                    onSelectBoss(boss);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSpawned
                      ? 'bg-red-950/20 border-red-500/40 hover:border-red-500'
                      : isImminent
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Time pill */}
                    <div className="flex flex-col items-center justify-center min-w-[65px] px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 font-mono text-xs">
                      <Clock className="w-3 h-3 text-slate-400 mb-0.5" />
                      <span className="font-bold text-white">{formatTimeOnly(boss.respawnAt)}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-amber-400">#{boss.num}</span>
                        <span className="text-sm font-bold text-white">{boss.thaiName}</span>
                        {boss.pinned && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="text-xs text-slate-400">
                        {boss.engName} • คูลดาวน์ {formatDurationHours(boss.cooldownHours)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-mono font-bold text-sm ${
                        isSpawned
                          ? 'text-red-400 animate-pulse'
                          : isImminent
                          ? 'text-amber-300'
                          : 'text-emerald-400'
                      }`}
                    >
                      {countdown.text}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isSpawned ? 'เกิดแล้ว' : isImminent ? 'ใกล้เกิดแล้ว' : 'นับถอยหลัง'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
