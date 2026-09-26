import React, { useEffect, useRef } from 'react';
import { Clock, RotateCcw } from 'lucide-react';

interface InlineTimePickerProps {
  currentHHmm: string; // e.g. "11:42" or "--:--"
  isOpen: boolean;
  onClose: () => void;
  onSelectTime: (newTime: string) => void;
}

export const InlineTimePicker: React.FC<InlineTimePickerProps> = ({
  currentHHmm,
  isOpen,
  onClose,
  onSelectTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentHourNow = String(now.getHours()).padStart(2, '0');
  const currentMinuteNow = String(now.getMinutes()).padStart(2, '0');

  // Extract initial hour and minute safely (defaulting to current time if '--:--' or unset)
  let initialHour = currentHourNow;
  let initialMinute = currentMinuteNow;

  if (currentHHmm && currentHHmm.includes(':')) {
    const [h, m] = currentHHmm.split(':');
    if (h !== '--' && !isNaN(Number(h))) {
      initialHour = h.padStart(2, '0');
    }
    if (m !== '--' && !isNaN(Number(m))) {
      initialMinute = m.padStart(2, '0');
    }
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Auto scroll selected hour and minute into view on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hourScrollRef.current) {
          const selectedHourEl = hourScrollRef.current.querySelector('[data-selected="true"]');
          if (selectedHourEl) {
            (selectedHourEl as HTMLElement).scrollIntoView({ block: 'center' });
          }
        }
        if (minuteScrollRef.current) {
          const selectedMinuteEl = minuteScrollRef.current.querySelector('[data-selected="true"]');
          if (selectedMinuteEl) {
            (selectedMinuteEl as HTMLElement).scrollIntoView({ block: 'center' });
          }
        }
      }, 50);
    }
  }, [isOpen, initialHour, initialMinute]);

  if (!isOpen) return null;

  const handleSelectHour = (newHour: string) => {
    onSelectTime(`${newHour}:${initialMinute}`);
  };

  const handleSelectMinute = (newMinute: string) => {
    onSelectTime(`${initialHour}:${newMinute}`);
  };

  // Quick preset helper
  const handleApplyPreset = (offsetMinutes: number) => {
    const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    onSelectTime(`${h}:${m}`);
    onClose();
  };

  // Check if selected time is earlier than current time today (overdue)
  const isSelectedOverdue = () => {
    const hNum = Number(initialHour);
    const mNum = Number(initialMinute);
    const nowH = now.getHours();
    const nowM = now.getMinutes();
    return hNum < nowH || (hNum === nowH && mNum <= nowM);
  };

  const overdue = isSelectedOverdue();

  return (
    <div
      ref={containerRef}
      className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-[#0c1427] text-slate-100 rounded-xl shadow-[0_15px_40px_rgba(0,0,0,0.85)] border border-slate-700/80 flex flex-col w-[200px] overflow-hidden animate-in fade-in zoom-in-95 duration-150 select-none backdrop-blur-md"
    >
      {/* Header with date reference indicator */}
      <div className="bg-[#070d19] px-3 py-2 border-b border-slate-800 text-center">
        <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          <span>เวลาเกิด (อ้างอิงวันนี้)</span>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="font-mono text-base font-bold text-amber-300">{initialHour}</span>
          <span className="font-mono font-bold text-slate-500">:</span>
          <span className="font-mono text-base font-bold text-amber-300">{initialMinute}</span>
          <span className="text-[10px] text-slate-400">น.</span>
        </div>
        {overdue && (
          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            <span>เกินเวลาแล้ว</span>
          </div>
        )}
      </div>

      {/* Dual Column Picker */}
      <div className="flex h-[150px] border-b border-slate-800 text-xs font-mono">
        {/* Hours Column */}
        <div
          ref={hourScrollRef}
          className="flex-1 overflow-y-auto border-r border-slate-800 scrollbar-none py-1"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="text-[10px] font-sans font-bold text-slate-400 text-center py-0.5 sticky top-0 bg-[#0c1427]/90 backdrop-blur-xs">
            ชม.
          </div>
          {hours.map((h) => {
            const isSelected = h === initialHour;
            return (
              <div
                key={h}
                data-selected={isSelected}
                onClick={() => handleSelectHour(h)}
                className={`h-[28px] flex items-center justify-center font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                {h}
              </div>
            );
          })}
        </div>

        {/* Minutes Column */}
        <div
          ref={minuteScrollRef}
          className="flex-1 overflow-y-auto scrollbar-none py-1"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="text-[10px] font-sans font-bold text-slate-400 text-center py-0.5 sticky top-0 bg-[#0c1427]/90 backdrop-blur-xs">
            นาที
          </div>
          {minutes.map((m) => {
            const isSelected = m === initialMinute;
            return (
              <div
                key={m}
                data-selected={isSelected}
                onClick={() => handleSelectMinute(m)}
                className={`h-[28px] flex items-center justify-center font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                {m}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-2 bg-[#070d19]/90 space-y-1.5">
        <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-slate-300">
          <button
            type="button"
            onClick={() => handleApplyPreset(0)}
            className="py-1 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-center text-amber-300 cursor-pointer transition-colors"
          >
            ตอนนี้
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(10)}
            className="py-1 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-center cursor-pointer transition-colors"
          >
            +10น.
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset(30)}
            className="py-1 px-1 rounded bg-slate-800/80 hover:bg-slate-700 text-center cursor-pointer transition-colors"
          >
            +30น.
          </button>
        </div>

        {/* Action: Clear or Close */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[10px]">
          <button
            type="button"
            onClick={() => {
              onSelectTime('--:--');
              onClose();
            }}
            className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>ล้างเป็น --:--</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer transition-colors"
          >
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
};

