import React, { useState } from 'react';
import { Boss, RebootOffsetRule } from '../types';
import { DEFAULT_REBOOT_RULES } from '../data/defaultRebootRules';
import { BASE_BOSS_DEFINITIONS } from '../data/defaultBosses';
import { X, RotateCw, Clock, Calendar, Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { formatTimeOnly } from '../utils/format';

interface RebootServerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bosses: Boss[];
  onApplyReboot: (
    targetServer: 'all' | 'main' | 'invasion',
    rebootTimestamp: number,
    rules: RebootOffsetRule[]
  ) => void;
}

export const RebootServerModal: React.FC<RebootServerModalProps> = ({
  isOpen,
  onClose,
  bosses,
  onApplyReboot,
}) => {
  if (!isOpen) return null;

  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [rebootDate, setRebootDate] = useState(defaultDate);
  const [rebootTime, setRebootTime] = useState(defaultTime);
  const [targetServer, setTargetServer] = useState<'all' | 'main' | 'invasion'>('all');
  const [rules, setRules] = useState<RebootOffsetRule[]>(() => {
    try {
      const saved = localStorage.getItem('l2m_reboot_rules_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_REBOOT_RULES;
  });

  // New rule input states
  const [newBossName, setNewBossName] = useState(BASE_BOSS_DEFINITIONS[0].thaiName);
  const [newOffsetHours, setNewOffsetHours] = useState(6);

  // Compute reboot timestamp
  const getRebootTimestamp = (): number => {
    const [y, m, d] = rebootDate.split('-').map(Number);
    const [hh, mm] = rebootTime.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  };

  const rebootTs = getRebootTimestamp();

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBossName) return;

    const newRule: RebootOffsetRule = {
      id: `rule-${Date.now()}`,
      bossDisplayName: newBossName,
      matchKeyword: newBossName,
      offsetHours: Number(newOffsetHours),
    };

    const updated = [...rules, newRule];
    setRules(updated);
    try {
      localStorage.setItem('l2m_reboot_rules_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    setRules(updated);
    try {
      localStorage.setItem('l2m_reboot_rules_v1', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleConfirmApply = () => {
    onApplyReboot(targetServer, rebootTs, rules);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#091124] border border-cyan-500/50 p-5 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40">
              <RotateCw className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>รีบูทเซิร์ฟเวอร์ (Server Reboot Respawn Calculator)</span>
              </h2>
              <p className="text-xs text-slate-400">
                ระบุเวลาเปิดเซิร์ฟเวอร์เสร็จ เพื่อคำนวณเวลาเกิดของบอสทั้งหมดตามสูตรหลังรีบูท
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* 1. Time & Server Setup Box */}
          <div className="p-3.5 rounded-xl bg-[#070d19] border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Date */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>วันที่รีบูทเสร็จ:</span>
                </label>
                <input
                  type="date"
                  value={rebootDate}
                  onChange={(e) => setRebootDate(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-cyan-300 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Time */}
              <div>
                <label className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>เวลาที่เปิดเซิร์ฟเสร็จ:</span>
                </label>
                <input
                  type="time"
                  value={rebootTime}
                  onChange={(e) => setRebootTime(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Target Server Switch */}
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1">
                  ใช้กับเซิร์ฟเวอร์:
                </label>
                <select
                  value={targetServer}
                  onChange={(e) => setTargetServer(e.target.value as any)}
                  className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">🌐 ทั้ง 2 เซิร์ฟ (หลัก + Invasion)</option>
                  <option value="main">🏰 เฉพาะเซิร์ฟหลัก</option>
                  <option value="invasion">⚔️ เฉพาะเซิร์ฟ Invasion</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
              <span>
                เวลาฐานอ้างอิง: <span className="text-white font-mono font-bold">{rebootDate} {rebootTime} น.</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const n = new Date();
                  setRebootDate(
                    `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(
                      n.getDate()
                    ).padStart(2, '0')}`
                  );
                  setRebootTime(
                    `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`
                  );
                }}
                className="text-cyan-400 hover:underline"
              >
                ตั้งเป็นเวลาปัจจุบัน
              </button>
            </div>
          </div>

          {/* 2. Add Boss to Reboot Rule Form */}
          <form
            onSubmit={handleAddRule}
            className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center gap-2"
          >
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1 shrink-0">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>เพิ่มบอสในสูตรรีบูท:</span>
            </span>

            {/* Boss select */}
            <select
              value={newBossName}
              onChange={(e) => setNewBossName(e.target.value)}
              className="flex-1 min-w-[130px] rounded-lg bg-[#070d19] border border-slate-700 px-2.5 py-1 text-xs text-white focus:border-amber-500"
            >
              {BASE_BOSS_DEFINITIONS.map((b) => (
                <option key={b.num} value={b.thaiName}>
                  #{b.num} {b.thaiName} ({b.engName})
                </option>
              ))}
            </select>

            {/* Offset hours */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs text-slate-400">+</span>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="72"
                value={newOffsetHours}
                onChange={(e) => setNewOffsetHours(parseFloat(e.target.value) || 1)}
                className="w-14 rounded-lg bg-[#070d19] border border-slate-700 px-2 py-1 text-xs text-amber-300 font-mono text-center focus:border-amber-500"
              />
              <span className="text-xs text-slate-400">ชม.</span>
            </div>

            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              + เพิ่ม
            </button>
          </form>

          {/* 3. Boss Reboot Offset Rules List */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
              <span>รายการบอสและเวลาเกิดหลังรีบูท ({rules.length} รายการ):</span>
              <span className="text-[11px] text-cyan-400 font-mono">เวลาเกิดที่คำนวณได้</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-1">
              {rules.map((rule) => {
                const calculatedRespawnTs = rebootTs + rule.offsetHours * 3600 * 1000;
                const calcTimeStr = formatTimeOnly(calculatedRespawnTs).slice(0, 5);
                const calcDate = new Date(calculatedRespawnTs);
                const dateDisplay = `${calcDate.getDate()}/${calcDate.getMonth() + 1}`;

                return (
                  <div
                    key={rule.id}
                    className="p-2.5 rounded-xl bg-[#070d19] border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-white truncate">
                        {rule.bossDisplayName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        +{rule.offsetHours} ชม. หลังรีบูท
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-cyan-300">
                          {calcTimeStr} น.
                        </div>
                        <div className="text-[10px] text-slate-500">{dateDisplay}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                        title="ลบออกจากรายการรีบูท"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleConfirmApply}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>คำนวณและตั้งเวลาเกิดทันที ({rules.length} ตัว)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
