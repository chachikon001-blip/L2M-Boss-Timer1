import React, { useState } from 'react';
import { SoundSettings } from '../types';
import { soundManager, sendBrowserNotification } from '../utils/audio';
import { X, Volume2, VolumeX, Bell, Play, Check, ShieldAlert } from 'lucide-react';

interface SoundSettingsModalProps {
  settings: SoundSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: SoundSettings) => void;
}

export const SoundSettingsModal: React.FC<SoundSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = useState<SoundSettings>({ ...settings });
  const [notificationStatus, setNotificationStatus] = useState<string>(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  const handleTestSound = () => {
    soundManager.playSound(localSettings.soundType, localSettings.volume);
    if (localSettings.ttsEnabled) {
      setTimeout(() => {
        soundManager.speak('ทดสอบเสียงแจ้งเตือน บาซิลา เกิดแล้ว', localSettings.volume);
      }, 400);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return;
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      if (permission === 'granted') {
        sendBrowserNotification('แจ้งเตือนบอส MMORPG', 'เปิดการแจ้งเตือนสำเร็จแล้ว!');
        setLocalSettings((prev) => ({ ...prev, browserNotification: true }));
      }
    } catch {
      // Ignore
    }
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">ตั้งค่าการแจ้งเตือนและเสียง</h2>
              <p className="text-xs text-slate-400">ปรับแต่งเสียงสังเคราะห์ เสียงพูดภาษาไทย และเตือนล่วงหน้า</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Master Sound Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              {localSettings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <span className="text-sm font-semibold text-white block">เปิดใช้งานเสียงแจ้งเตือน</span>
                <span className="text-xs text-slate-400">ส่งเสียงเมื่อบอสใกล้เกิดหรือเกิดแล้ว</span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.soundEnabled}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, soundEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Thai TTS Voice */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-sm font-semibold text-white block">เสียงพูดชื่อบอส (TTS ภาษาไทย)</span>
              <span className="text-xs text-slate-400">
                อ่านออกเสียงชื่อบอสและเวลาก่อนเกิด (ไม่ต้องมองจอ)
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.ttsEnabled}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, ttsEnabled: e.target.checked }))
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Sound Type Selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 block">รูปแบบเสียงเตือน (Synth Sound)</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'synth-crystal', label: 'Crystal Chime (กระดิ่งคริสตัล)' },
                { id: 'synth-alarm', label: 'Warning Pulse (สัญญาณเตือนภัย)' },
                { id: 'synth-radar', label: 'Sonar Radar (เรดาร์สแกน)' },
                { id: 'synth-bell', label: 'Temple Bell (ระฆังวิหาร)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setLocalSettings((prev) => ({
                      ...prev,
                      soundType: item.id as SoundSettings['soundType'],
                    }))
                  }
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    localSettings.soundType === item.id
                      ? 'bg-amber-600/20 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>ระดับความดัง</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round(localSettings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={localSettings.volume}
              onChange={(e) =>
                setLocalSettings((prev) => ({ ...prev, volume: parseFloat(e.target.value) }))
              }
              className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Test Sound Button */}
          <button
            type="button"
            onClick={handleTestSound}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>ทดสอบฟังเสียงเตือน</span>
          </button>

          {/* Alert Stages Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="text-xs text-slate-400 block font-semibold">
              ช่วงเวลาที่จะให้แจ้งเตือน:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { key: '10m', label: '10 นาทีก่อนเกิด' },
                { key: '5m', label: '5 นาทีก่อนเกิด' },
                { key: '3m', label: '3 นาทีก่อนเกิด' },
                { key: '1m', label: '1 นาทีก่อนเกิด' },
                { key: 'spawned', label: 'เมื่อบอสเกิดแล้ว (0 นาที)' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800/80 cursor-pointer text-slate-300"
                >
                  <input
                    type="checkbox"
                    checked={localSettings.stages[key as keyof typeof localSettings.stages]}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        stages: {
                          ...prev.stages,
                          [key]: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-slate-700 text-amber-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Browser Notification Permission */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <div className="text-xs">
                <div className="text-slate-300">แจ้งเตือน Desktop / บราวเซอร์</div>
                <div className="text-slate-500 text-[10px]">
                  สถานะ: {notificationStatus === 'granted' ? 'เปิดแล้ว' : notificationStatus}
                </div>
              </div>
            </div>
            {notificationStatus !== 'granted' ? (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium"
              >
                อนุญาตแจ้งเตือน
              </button>
            ) : (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> พร้อมใช้งาน
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-950 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};
