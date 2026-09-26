import React, { useState } from 'react';
import { Boss } from '../types';
import { generateClanScheduleText } from '../utils/format';
import { X, Copy, Check, Share2 } from 'lucide-react';

interface ClanShareModalProps {
  bosses: Boss[];
  isOpen: boolean;
  onClose: () => void;
}

export const ClanShareModal: React.FC<ClanShareModalProps> = ({
  bosses,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [includeSpawned, setIncludeSpawned] = useState(true);
  const [onlyPinned, setOnlyPinned] = useState(false);
  const [timeWindowHours, setTimeWindowHours] = useState<number | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  const text = generateClanScheduleText(bosses, {
    includeSpawned,
    onlyPinned,
    timeWindowHours,
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">คัดลอกตารางบอสลง LINE / Discord</h2>
              <p className="text-xs text-slate-400">จัดรูปแบบเรียงเวลาอัตโนมัติ สำหรับแจ้งเตือนเพื่อนในกิลด์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={includeSpawned}
                onChange={(e) => setIncludeSpawned(e.target.checked)}
                className="rounded border-slate-700 text-amber-500"
              />
              <span>รวมบอสที่เกิดแล้ว</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={onlyPinned}
                onChange={(e) => setOnlyPinned(e.target.checked)}
                className="rounded border-slate-700 text-amber-500"
              />
              <span>เฉพาะบอสปักหมุด ⭐</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <span className="text-slate-400">ช่วงเวลา:</span>
            <div className="flex items-center gap-1.5">
              {[
                { label: 'ทั้งหมด', val: undefined },
                { label: '3 ชม.', val: 3 },
                { label: '6 ชม.', val: 6 },
                { label: '12 ชม.', val: 12 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setTimeWindowHours(opt.val)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    timeWindowHours === opt.val
                      ? 'bg-amber-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Text Preview */}
        <div className="flex-1 min-h-[160px] overflow-hidden flex flex-col mb-4">
          <label className="text-xs text-slate-400 mb-1">ตัวอย่างข้อความ:</label>
          <textarea
            readOnly
            value={text}
            className="flex-1 w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs resize-none focus:outline-none focus:border-amber-500/50 selection:bg-amber-500/40"
            rows={8}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>คัดลอกเรียบร้อยแล้ว!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความ (Copy)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
