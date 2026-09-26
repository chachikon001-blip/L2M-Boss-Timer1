import React, { useState, useEffect } from 'react';
import { Boss } from '../types';
import { X, Clock, Check, RotateCcw } from 'lucide-react';
import { formatDurationHours } from '../utils/format';

interface QuickTimeModalProps {
  boss: Boss | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTime: (bossId: string, respawnAt: number | null, lastKilledAt: number | null) => void;
}

export const QuickTimeModal: React.FC<QuickTimeModalProps> = ({
  boss,
  isOpen,
  onClose,
  onSaveTime,
}) => {
  if (!isOpen || !boss) return null;

  const getInitialTimeString = (ts: number | null) => {
    const d = ts ? new Date(ts) : new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [mode, setMode] = useState<'respawn' | 'killed'>('respawn');
  const [timeStr, setTimeStr] = useState(getInitialTimeString(boss.respawnAt || Date.now()));

  useEffect(() => {
    setTimeStr(getInitialTimeString(boss.respawnAt || Date.now()));
  }, [boss]);

  const parseTimeToTimestamp = (val: string): number => {
    const [h, m] = val.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
  };

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const cooldownMs = boss.cooldownHours * 3600 * 1000;
    const targetMs = parseTimeToTimestamp(timeStr);

    if (mode === 'respawn') {
      const respawn = targetMs;
      const killed = respawn - cooldownMs;
      onSaveTime(boss.id, respawn, killed);
    } else {
      const killed = targetMs;
      const respawn = killed + cooldownMs;
      onSaveTime(boss.id, respawn, killed);
    }
    onClose();
  };

  const handleClear = () => {
    onSaveTime(boss.id, null, null);
    onClose();
  };

  const setOffsetMinutes = (mins: number) => {
    const target = new Date(Date.now() - mins * 60 * 1000);
    setTimeStr(`${String(target.getHours()).padStart(2, '0')}:${String(target.getMinutes()).padStart(2, '0')}`);
    setMode('killed');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0b1329] border border-slate-700/80 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{boss.thaiName || boss.name}</h3>
              <p className="text-xs text-slate-400">คูลดาวน์ {formatDurationHours(boss.cooldownHours)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleApply} className="space-y-4">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setMode('respawn')}
              className={`py-1.5 rounded-md font-medium transition-colors ${
                mode === 'respawn' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เวลาเกิดโดยตรง
            </button>
            <button
              type="button"
              onClick={() => setMode('killed')}
              className={`py-1.5 rounded-md font-medium transition-colors ${
                mode === 'killed' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เวลาที่บอสตาย
            </button>
          </div>

          {/* Time Input */}
          <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400 mb-1">
              {mode === 'respawn' ? 'ระบุเวลาที่จะเกิด (อ้างอิงวันนี้)' : 'ระบุเวลาที่บอสตาย (อ้างอิงวันนี้)'}
            </span>
            <input
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className="text-2xl font-mono font-bold text-amber-300 bg-transparent border-b border-amber-500/50 pb-1 focus:outline-none text-center"
              required
            />
            {timeStr && mode === 'respawn' && (() => {
              const [h, m] = timeStr.split(':').map(Number);
              const now = new Date();
              const isPast = h < now.getHours() || (h === now.getHours() && m <= now.getMinutes());
              return isPast ? (
                <span className="mt-2 text-[11px] font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                  เกินเวลาแล้ว
                </span>
              ) : (
                <span className="mt-2 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                  เวลานี้ยังไม่ถึงกำหนดเกิด
                </span>
              );
            })()}
          </div>

          {/* Quick offsets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5">ตายย้อนหลังเมื่อ:</span>
            <div className="grid grid-cols-4 gap-1.5">
              {[0, 2, 5, 10].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setOffsetMinutes(mins)}
                  className="py-1 px-1.5 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 border border-slate-700/60 font-mono transition-colors text-center"
                >
                  {mins === 0 ? 'ตอนนี้' : `-${mins}น.`}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างเวลา</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>บันทึก</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
