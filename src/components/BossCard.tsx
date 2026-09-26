import React, { useState } from 'react';
import { Boss, BossStatus } from '../types';
import { formatCountdown, formatDurationHours, formatTimeOnly } from '../utils/format';
import { Pin, RotateCw, Edit3, RotateCcw, Clock, MapPin, Sparkles, Castle, Swords } from 'lucide-react';

interface BossCardProps {
  boss: Boss;
  now: number;
  status: BossStatus;
  mainServerName?: string;
  invasionServerName?: string;
  onKill: (bossId: string) => void;
  onDirectChangeTime: (bossId: string, newTimeStr: string) => void;
  onReset: (bossId: string) => void;
  onTogglePin: (bossId: string) => void;
  onOpenEdit: (boss: Boss) => void;
}

export const BossCard: React.FC<BossCardProps> = ({
  boss,
  now,
  status,
  mainServerName,
  invasionServerName,
  onKill,
  onDirectChangeTime,
  onReset,
  onTogglePin,
  onOpenEdit,
}) => {
  const diffMs = boss.respawnAt ? boss.respawnAt - now : null;
  const countdown = diffMs !== null ? formatCountdown(diffMs) : null;
  const timeOnly = boss.respawnAt ? formatTimeOnly(boss.respawnAt).slice(0, 5) : '';

  const getStatusConfig = () => {
    switch (status) {
      case 'spawned':
        return {
          border: 'border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.25)]',
          badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
          badgeText: '🔴 เกินเวลาแล้ว',
          timerColor: 'text-red-400 animate-pulse',
          subText: 'เกินเวลาแล้ว',
        };
      case 'imminent':
        return {
          border: 'border-amber-500/80 shadow-[0_0_18px_rgba(245,158,11,0.2)]',
          badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
          badgeText: '⚠️ ใกล้เกิดแล้ว (<15น.)',
          timerColor: 'text-amber-300 font-bold',
          subText: 'เตรียมตัววาร์ปไปหน้าห้องบอส',
        };
      case 'counting':
        return {
          border: 'border-slate-800 hover:border-slate-700',
          badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          badgeText: '⏳ กำลังนับถอยหลัง',
          timerColor: 'text-emerald-400',
          subText: 'เหลือเวลาเกิด',
        };
      default:
        return {
          border: 'border-slate-800/80 bg-slate-900/40',
          badgeBg: 'bg-slate-800 text-slate-400 border-slate-700/50',
          badgeText: '⚪ ยังไม่ได้จับเวลา',
          timerColor: 'text-slate-500',
          subText: 'กด "อัปเดต" เพื่อเริ่มรอบเกิด',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div
      className={`relative rounded-2xl border bg-[#091124] p-4 transition-all duration-200 flex flex-col justify-between ${
        config.border
      } ${boss.pinned ? 'ring-1 ring-amber-400/50' : ''}`}
    >
      <div>
        {/* Top Header: Boss Number, Pin, Title */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center text-xs font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700 px-2 py-0.5 rounded-md min-w-[34px]">
              #{boss.num}
            </span>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${config.badgeBg}`}
            >
              {config.badgeText}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onTogglePin(boss.id)}
              title={boss.pinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดไว้บนสุด'}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                boss.pinned
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 ${boss.pinned ? 'fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => onOpenEdit(boss)}
              title="แก้ไขข้อมูล / ปรับเวลา"
              className="p-1.5 rounded-lg border border-slate-700/60 bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Names */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-1.5">
            {boss.thaiName || boss.name}
            {boss.pinned && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-0.5">
            <span className="flex items-center gap-1.5">
              <span>{boss.engName || boss.name}</span>
              {boss.server === 'invasion' ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-[#240e36] text-purple-300 border border-purple-800/60">
                  <Swords className="w-2.5 h-2.5 text-purple-400" />
                  <span>{invasionServerName || boss.serverTag || 'Invasion'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  <Castle className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{mainServerName || boss.serverTag || 'เซิร์ฟหลัก'}</span>
                </span>
              )}
            </span>
            <span className="bg-slate-800/90 text-slate-300 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-700">
              CD {formatDurationHours(boss.cooldownHours)}
            </span>
          </div>
          {boss.location && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
              <MapPin className="w-3 h-3 text-slate-500" />
              <span>{boss.location}</span>
            </div>
          )}
        </div>

        {/* Countdown Display */}
        <div className="my-2 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{config.subText}</span>
          </div>
          <div className={`text-2xl sm:text-3xl font-mono font-bold tracking-wider ${config.timerColor}`}>
            {countdown ? countdown.text : '--:--:--'}
          </div>

          {/* Time meta with direct time change input */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span className="text-slate-500">เวลาเกิด:</span>
            <div className="flex items-center gap-1 bg-[#0b1329] px-2 py-0.5 rounded-lg border border-slate-700/70">
              <input
                type="time"
                value={timeOnly}
                onChange={(e) => onDirectChangeTime(boss.id, e.target.value)}
                className="font-mono font-bold text-amber-300 bg-transparent border-none outline-none text-xs w-[60px] text-center cursor-pointer"
                title="กดเปลี่ยนเวลาเกิดได้ทันที"
              />
              <Clock className="w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={() => onKill(boss.id)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer font-sans"
          title="กดอัปเดต: เอาเวลาเกิดปัจจุบัน + คูลดาวน์ หาเวลาเกิดใหม่"
        >
          <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>อัปเดตรอบเกิด (+{boss.cooldownHours}ชม.)</span>
        </button>

        {boss.respawnAt && (
          <button
            onClick={() => onReset(boss.id)}
            title="ล้างเวลาบอสตัวนี้"
            className="p-2 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
