import React, { useState } from 'react';
import { Boss } from '../types';
import { X, Plus, Sparkles } from 'lucide-react';

interface AddBossModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newBoss: Boss) => void;
  nextNum: number;
}

export const AddBossModal: React.FC<AddBossModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  nextNum,
}) => {
  if (!isOpen) return null;

  const [num, setNum] = useState(nextNum);
  const [thaiName, setThaiName] = useState('');
  const [engName, setEngName] = useState('');
  const [cooldownHours, setCooldownHours] = useState(4);
  const [location, setLocation] = useState('');
  const [serverTag, setServerTag] = useState('เซิร์ฟหลัก');
  const [pinned, setPinned] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!thaiName.trim()) return;

    const newBoss: Boss = {
      id: `boss-${Date.now()}`,
      num: Number(num),
      name: `${thaiName.trim()}${engName.trim() ? ` - ${engName.trim()}` : ''}`,
      thaiName: thaiName.trim(),
      engName: engName.trim() || thaiName.trim(),
      cooldownHours: Number(cooldownHours),
      lastKilledAt: null,
      respawnAt: null,
      pinned,
      lastAlertCycleRespawnAt: null,
      notifiedStages: {},
      location: location.trim(),
      server: serverTag.includes('Invasion') ? 'invasion' : 'main',
      serverTag: serverTag.trim() || 'เซิร์ฟหลัก',
    };

    onAdd(newBoss);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white">เพิ่มบอสใหม่ / บอสกิจกรรม</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">หมายเลข (#)</label>
              <input
                type="number"
                value={num}
                onChange={(e) => setNum(Number(e.target.value))}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">ชื่อไทย</label>
              <input
                type="text"
                placeholder="เช่น บอสแคลนเลเวล 4"
                value={thaiName}
                onChange={(e) => setThaiName(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">ชื่ออังกฤษ</label>
              <input
                type="text"
                placeholder="เช่น Clan Boss 4"
                value={engName}
                onChange={(e) => setEngName(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">คูลดาวน์ (ชั่วโมง)</label>
              <input
                type="number"
                step="0.5"
                min="0.1"
                max="168"
                value={cooldownHours}
                onChange={(e) => setCooldownHours(parseFloat(e.target.value) || 1)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 block">สถานที่เกิด / แมพ</label>
            <input
              type="text"
              placeholder="เช่น เกาะโจรสลัด, ป่าแห่งความเงียบ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-1.5 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="pinned-checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-700 focus:ring-0"
            />
            <label htmlFor="pinned-checkbox" className="text-xs text-slate-300 cursor-pointer">
              ปักหมุดบอสนี้ไว้ด้านบนสุดเป็นพิเศษ
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-950 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มบอส</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
