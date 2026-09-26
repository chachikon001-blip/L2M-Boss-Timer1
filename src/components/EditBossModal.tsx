import React, { useState, useEffect } from 'react';
import { Boss } from '../types';
import { X, Clock, Calendar, Check, Trash2 } from 'lucide-react';
import { formatDurationHours } from '../utils/format';

interface EditBossModalProps {
  boss: Boss | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBoss: Boss) => void;
  onDelete?: (bossId: string) => void;
}

export const EditBossModal: React.FC<EditBossModalProps> = ({
  boss,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen || !boss) return null;

  const [thaiName, setThaiName] = useState(boss.thaiName);
  const [engName, setEngName] = useState(boss.engName);
  const [num, setNum] = useState(boss.num);
  const [cooldownHours, setCooldownHours] = useState(boss.cooldownHours);
  const [serverTag, setServerTag] = useState(boss.serverTag || 'เซิร์ฟหลัก');
  const [location, setLocation] = useState(boss.location || '');

  // Mode: 'by-kill' or 'by-respawn'
  const [mode, setMode] = useState<'by-kill' | 'by-respawn'>('by-kill');

  const getInitialDateString = (ts: number | null) => {
    const d = ts ? new Date(ts) : new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getInitialTimeString = (ts: number | null) => {
    const d = ts ? new Date(ts) : new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const [killDateStr, setKillDateStr] = useState(getInitialDateString(boss.lastKilledAt));
  const [killTimeStr, setKillTimeStr] = useState(getInitialTimeString(boss.lastKilledAt));

  const [respawnDateStr, setRespawnDateStr] = useState(getInitialDateString(boss.respawnAt));
  const [respawnTimeStr, setRespawnTimeStr] = useState(getInitialTimeString(boss.respawnAt));

  useEffect(() => {
    setThaiName(boss.thaiName);
    setEngName(boss.engName);
    setNum(boss.num);
    setCooldownHours(boss.cooldownHours);
    setServerTag(boss.serverTag || 'เซิร์ฟหลัก');
    setLocation(boss.location || '');

    setKillDateStr(getInitialDateString(boss.lastKilledAt));
    setKillTimeStr(getInitialTimeString(boss.lastKilledAt));

    setRespawnDateStr(getInitialDateString(boss.respawnAt));
    setRespawnTimeStr(getInitialTimeString(boss.respawnAt));
  }, [boss]);

  const combineDateAndTimeToTimestamp = (dateStr: string, timeStr: string): number => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const d = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return d.getTime();
  };

  const handleApplyQuickKillOffset = (minutesAgo: number) => {
    const target = new Date(Date.now() - minutesAgo * 60 * 1000);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const h = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');

    setKillDateStr(`${y}-${m}-${d}`);
    setKillTimeStr(`${h}:${min}`);
    setMode('by-kill');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newKilledAt: number | null = boss.lastKilledAt;
    let newRespawnAt: number | null = boss.respawnAt;

    const cooldownMs = cooldownHours * 3600 * 1000;

    if (mode === 'by-kill') {
      const killTs = combineDateAndTimeToTimestamp(killDateStr, killTimeStr);
      newKilledAt = killTs;
      newRespawnAt = killTs + cooldownMs;
    } else {
      const respawnTs = combineDateAndTimeToTimestamp(respawnDateStr, respawnTimeStr);
      newRespawnAt = respawnTs;
      newKilledAt = respawnTs - cooldownMs;
    }

    onSave({
      ...boss,
      thaiName,
      engName,
      name: `${thaiName} - ${engName}`,
      num,
      cooldownHours,
      serverTag,
      lastKilledAt: newKilledAt,
      respawnAt: newRespawnAt,
      location,
      lastAlertCycleRespawnAt: newRespawnAt,
      notifiedStages: {},
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#091124] border border-slate-700/80 p-6 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="text-xs font-mono font-bold text-amber-400">#{boss.num}</span>
            <h2 className="text-lg font-bold text-white tracking-wide">แก้ไขข้อมูล / กำหนดเวลาบอส</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Boss Number & Thai Name */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-1">
              <label className="text-xs text-slate-400 mb-1.5 block">หมายเลข (#)</label>
              <input
                type="number"
                value={num}
                onChange={(e) => setNum(Number(e.target.value))}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1.5 block">ชื่อไทย</label>
              <input
                type="text"
                value={thaiName}
                onChange={(e) => setThaiName(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* English Name & Cooldown */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">ชื่ออังกฤษ</label>
              <input
                type="text"
                value={engName}
                onChange={(e) => setEngName(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">คูลดาวน์ (ชม.)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="72"
                value={cooldownHours}
                onChange={(e) => setCooldownHours(parseFloat(e.target.value) || 1)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Location & Server Tag */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">สถานที่เกิด / แมพ</label>
              <input
                type="text"
                placeholder="เช่น หอคอยครูม่า ชั้น 4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block">แท็กเซิร์ฟเวอร์ / หมวดหมู่</label>
              <input
                type="text"
                placeholder="เซิร์ฟหลัก"
                value={serverTag}
                onChange={(e) => setServerTag(e.target.value)}
                className="w-full rounded-xl bg-[#070d19] border border-slate-700 px-3 py-2 text-sm text-cyan-300 placeholder-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Time Setup Section */}
          <div className="pt-2 border-t border-slate-800">
            <label className="text-xs font-semibold text-amber-400 block mb-2.5">
              วิธีระบุเวลา (เลือกอย่างใดอย่างหนึ่ง)
            </label>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#070d19] rounded-xl border border-slate-800 mb-3.5">
              <button
                type="button"
                onClick={() => setMode('by-kill')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'by-kill'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ระบุเวลาตาย (คำนวณเกิดออโต้)
              </button>
              <button
                type="button"
                onClick={() => setMode('by-respawn')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  mode === 'by-respawn'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ระบุเวลาเกิดโดยตรง
              </button>
            </div>

            {mode === 'by-kill' ? (
              <div className="space-y-3">
                {/* Date & Time of Death */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#070d19] border border-slate-800">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>วันที่ตาย:</span>
                    </label>
                    <input
                      type="date"
                      value={killDateStr}
                      onChange={(e) => setKillDateStr(e.target.value)}
                      className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-2.5 py-1.5 text-xs text-amber-300 font-mono focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>เวลาตาย (HH:mm):</span>
                    </label>
                    <input
                      type="time"
                      value={killTimeStr}
                      onChange={(e) => setKillTimeStr(e.target.value)}
                      className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-2.5 py-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div>
                  <div className="text-[11px] text-slate-400 mb-1.5">กดเลือกเวลาตายด่วน:</div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyQuickKillOffset(0)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                    >
                      ตอนนี้ (Now)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickKillOffset(3)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                    >
                      -3 นาที
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickKillOffset(5)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                    >
                      -5 นาที
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickKillOffset(10)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                    >
                      -10 นาที
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyQuickKillOffset(30)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors"
                    >
                      -30 นาที
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Date & Time of Respawn */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#070d19] border border-slate-800">
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span>วันที่เกิด:</span>
                    </label>
                    <input
                      type="date"
                      value={respawnDateStr}
                      onChange={(e) => setRespawnDateStr(e.target.value)}
                      className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-2.5 py-1.5 text-xs text-emerald-300 font-mono focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-slate-300 mb-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      <span>เวลาที่จะเกิด (HH:mm):</span>
                    </label>
                    <input
                      type="time"
                      value={respawnTimeStr}
                      onChange={(e) => setRespawnTimeStr(e.target.value)}
                      className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-2.5 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:border-emerald-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  ระบบจะหักลบเวลาคูลดาวน์ {formatDurationHours(cooldownHours)} เพื่อบันทึกเวลาตายให้อัตโนมัติ
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`ต้องการลบบอส "${boss.thaiName}" หรือไม่?`)) {
                    onDelete(boss.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1.5 rounded-lg border border-red-500/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบบอส</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-950 transition-colors"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
