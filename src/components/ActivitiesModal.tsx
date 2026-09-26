import React, { useState } from 'react';
import { GuildActivity } from '../types';
import { X, Calendar, Clock, Plus, Trash2, Edit3, Check, MapPin, Sparkles } from 'lucide-react';

interface ActivitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: GuildActivity[];
  onSaveActivities: (updated: GuildActivity[]) => void;
}

export const ActivitiesModal: React.FC<ActivitiesModalProps> = ({
  isOpen,
  onClose,
  activities,
  onSaveActivities,
}) => {
  if (!isOpen) return null;

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [dayType, setDayType] = useState<GuildActivity['dayType']>('mwf');
  const [dayLabel, setDayLabel] = useState('จันทร์, พุธ, ศุกร์');
  const [time, setTime] = useState('08:00 - 00:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const handleStartAdd = () => {
    setTitle('');
    setDayType('all');
    setDayLabel('ทุกๆวัน');
    setTime('20:00');
    setLocation('');
    setDescription('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleStartEdit = (act: GuildActivity) => {
    setTitle(act.title);
    setDayType(act.dayType);
    setDayLabel(act.dayLabel);
    setTime(act.time);
    setLocation(act.location || '');
    setDescription(act.description || '');
    setEditingId(act.id);
    setIsAdding(true);
  };

  const handleDaySelect = (dt: GuildActivity['dayType']) => {
    setDayType(dt);
    switch (dt) {
      case 'all':
        setDayLabel('ทุกๆวัน');
        break;
      case 'mwf':
        setDayLabel('จันทร์, พุธ, ศุกร์ (Invasion)');
        break;
      case 'mon':
        setDayLabel('ทุกวันจันทร์');
        break;
      case 'tue':
        setDayLabel('ทุกวันอังคาร');
        break;
      case 'wed':
        setDayLabel('ทุกวันพุธ');
        break;
      case 'thu':
        setDayLabel('ทุกวันพฤหัสบดี');
        break;
      case 'fri':
        setDayLabel('ทุกวันศุกร์');
        break;
      case 'sat':
        setDayLabel('ทุกวันเสาร์');
        break;
      case 'sun':
        setDayLabel('ทุกวันอาทิตย์');
        break;
      case 'weekend':
        setDayLabel('เสาร์ - อาทิตย์');
        break;
      default:
        setDayLabel('ทุกๆวัน');
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let updated: GuildActivity[];
    if (editingId) {
      updated = activities.map((a) =>
        a.id === editingId
          ? {
              ...a,
              title: title.trim(),
              dayType,
              dayLabel,
              time: time.trim(),
              location: location.trim(),
              description: description.trim(),
            }
          : a
      );
    } else {
      const newAct: GuildActivity = {
        id: `act-${Date.now()}`,
        title: title.trim(),
        dayType,
        dayLabel,
        time: time.trim(),
        location: location.trim(),
        description: description.trim(),
        enabled: true,
      };
      updated = [newAct, ...activities];
    }

    onSaveActivities(updated);
    setIsAdding(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = activities.filter((a) => a.id !== id);
    onSaveActivities(updated);
  };

  const handleToggle = (id: string) => {
    const updated = activities.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a));
    onSaveActivities(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#091124] border border-indigo-600/50 p-5 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>ตารางกิจกรรม (Guild Activities Schedule)</span>
              </h2>
              <p className="text-xs text-slate-400">
                กำหนดและจัดการกิจกรรมกิลด์/อีเวนต์ รายวัน หรือตามวันในสัปดาห์
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Add / Edit Form Modal inside */}
          {isAdding ? (
            <form onSubmit={handleSubmitForm} className="p-4 rounded-xl bg-[#070d19] border border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-sm font-bold text-indigo-300">
                  {editingId ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมใหม่'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ปิดฟอร์ม
                </button>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ชื่อกิจกรรม</label>
                <input
                  type="text"
                  placeholder="เช่น ดันเจี้ยนรุกราน (Invasion), กิลด์เรด, วอร์ปราสาท"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              {/* Day selection */}
              <div>
                <label className="text-xs text-slate-300 block mb-1">เลือกวันที่จัดกิจกรรม</label>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {[
                    { id: 'all', label: 'ทุกๆวัน' },
                    { id: 'mwf', label: 'จ.พ.ศ (Invasion)' },
                    { id: 'mon', label: 'จันทร์' },
                    { id: 'tue', label: 'อังคาร' },
                    { id: 'wed', label: 'พุธ' },
                    { id: 'thu', label: 'พฤหัส' },
                    { id: 'fri', label: 'ศุกร์' },
                    { id: 'sat', label: 'เสาร์' },
                    { id: 'sun', label: 'อาทิตย์' },
                    { id: 'weekend', label: 'เสาร์-อาทิตย์' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleDaySelect(d.id as any)}
                      className={`px-2.5 py-1 rounded-lg border transition-colors ${
                        dayType === d.id
                          ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                          : 'bg-[#0b1329] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">เวลา (เช่น 08:00 - 00:00 หรือ 20:30)</label>
                  <input
                    type="text"
                    placeholder="เช่น 20:30 น."
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-indigo-300 font-mono font-bold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">สถานที่ / แผนที่</label>
                  <input
                    type="text"
                    placeholder="เช่น ห้องโถงแคลน, ปราสาทกีรัน"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">รายละเอียด / ของรางวัล</label>
                <input
                  type="text"
                  placeholder="เช่น รวมสมาชิกเตรียมตีดันเจี้ยนระดับสูง"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg bg-[#0b1329] border border-slate-700 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกกิจกรรม</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">
                รายการกิจกรรมทั้งหมด ({activities.length} รายการ)
              </span>
              <button
                type="button"
                onClick={handleStartAdd}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ เพิ่มกิจกรรม</span>
              </button>
            </div>
          )}

          {/* Activity Cards List */}
          <div className="space-y-2">
            {activities.map((act) => (
              <div
                key={act.id}
                className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                  act.enabled
                    ? 'bg-[#070d19] border-slate-800 hover:border-slate-700'
                    : 'bg-[#070d19]/40 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-800/50 text-indigo-300 shrink-0 min-w-[70px]">
                    <Clock className="w-3 h-3 text-indigo-400 mb-0.5" />
                    <span className="font-mono font-bold text-xs text-center">{act.time}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-white">{act.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {act.dayLabel}
                      </span>
                    </div>

                    {act.location && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{act.location}</span>
                      </div>
                    )}

                    {act.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{act.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleToggle(act.id)}
                    className={`text-[11px] px-2 py-1 rounded-md border font-medium transition-colors ${
                      act.enabled
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {act.enabled ? 'เปิดใช้งาน' : 'ปิด'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartEdit(act)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="แก้ไขกิจกรรม"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(act.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title="ลบกิจกรรม"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
