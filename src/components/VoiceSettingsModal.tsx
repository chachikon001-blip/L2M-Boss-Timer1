import React, { useState } from 'react';
import { SoundSettings } from '../types';
import { soundManager } from '../utils/audio';
import { X, Volume2, Play, Check, Mic } from 'lucide-react';

interface VoiceSettingsModalProps {
  settings: SoundSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newSettings: SoundSettings) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [localSettings, setLocalSettings] = useState<SoundSettings>({ ...settings });

  const handleTestVoice = () => {
    soundManager.playSound(localSettings.soundType, localSettings.volume);
    setTimeout(() => {
      soundManager.speak(
        'ฟลินท์ จะเกิดในอีก 5 นาที เตรียมตัววาร์ป',
        localSettings.volume,
        localSettings.voiceGender,
        localSettings.speechRate,
        localSettings.speechPitch
      );
    }, 350);
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b1329] border border-purple-500/40 p-5 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>ตั้งค่าเสียงแจ้งเตือน</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600/30 text-purple-300 font-medium">
                  {localSettings.voiceGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">ระบบอ่านออกเสียงภาษาไทย (TTS) และเสียงสังเคราะห์</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Gender Selector */}
          <div>
            <label className="text-xs text-slate-300 font-semibold block mb-2">เพศเสียงผู้พากย์ (Voice Gender)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    voiceGender: 'female',
                    speechPitch: 1.15,
                  }))
                }
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  localSettings.voiceGender === 'female'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 ring-1 ring-purple-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👩 เสียงผู้หญิง</span>
                {localSettings.voiceGender === 'female' && <Check className="w-3.5 h-3.5 text-purple-300" />}
              </button>

              <button
                type="button"
                onClick={() =>
                  setLocalSettings((prev) => ({
                    ...prev,
                    voiceGender: 'male',
                    speechPitch: 0.85,
                  }))
                }
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  localSettings.voiceGender === 'male'
                    ? 'bg-purple-600/30 border-purple-500 text-purple-200 ring-1 ring-purple-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>👨 เสียงผู้ชาย</span>
                {localSettings.voiceGender === 'male' && <Check className="w-3.5 h-3.5 text-purple-300" />}
              </button>
            </div>
          </div>

          {/* Speech Rate & Pitch */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>ความเร็วเสียง</span>
                <span className="font-mono text-purple-300">{localSettings.speechRate}x</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.4"
                step="0.05"
                value={localSettings.speechRate}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, speechRate: parseFloat(e.target.value) }))
                }
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>ระดับเสียงสูงต่ำ</span>
                <span className="font-mono text-purple-300">{localSettings.speechPitch}</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.4"
                step="0.05"
                value={localSettings.speechPitch}
                onChange={(e) =>
                  setLocalSettings((prev) => ({ ...prev, speechPitch: parseFloat(e.target.value) }))
                }
                className="w-full accent-purple-500 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Volume */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>ระดับความดังเสียงเตือน</span>
              <span className="font-mono text-amber-400">{Math.round(localSettings.volume * 100)}%</span>
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

          {/* Test Button */}
          <button
            type="button"
            onClick={handleTestVoice}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 text-xs font-bold transition-all shadow cursor-pointer"
          >
            <Play className="w-4 h-4 fill-purple-300" />
            <span>ทดสอบฟังเสียง ({localSettings.voiceGender === 'female' ? 'ผู้หญิง' : 'ผู้ชาย'})</span>
          </button>

          {/* Notification Stages */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 block font-semibold">ช่วงเวลาที่แจ้งเตือน:</span>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { key: '10m', label: '10 นาทีก่อนเกิด' },
                { key: '5m', label: '5 นาทีก่อนเกิด' },
                { key: '3m', label: '3 นาทีก่อนเกิด' },
                { key: '1m', label: '1 นาทีก่อนเกิด' },
                { key: 'spawned', label: 'เมื่อบอสเกิดทันที' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={localSettings.stages[key as keyof typeof localSettings.stages]}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        stages: { ...prev.stages, [key]: e.target.checked },
                      }))
                    }
                    className="rounded border-slate-700 text-purple-600"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกการตั้งค่า</span>
          </button>
        </div>
      </div>
    </div>
  );
};
