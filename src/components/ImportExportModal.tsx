import React, { useState } from 'react';
import { Boss } from '../types';
import { INITIAL_BOSSES } from '../data/defaultBosses';
import { X, Download, Upload, Copy, Check, RotateCcw, AlertTriangle } from 'lucide-react';

interface ImportExportModalProps {
  bosses: Boss[];
  isOpen: boolean;
  onClose: () => void;
  onImport: (newBosses: Boss[]) => void;
  onResetToDefault: () => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  bosses,
  isOpen,
  onClose,
  onImport,
  onResetToDefault,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const exportString = JSON.stringify(bosses, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(exportString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([exportString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lineage2m-bosses-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteImport = () => {
    try {
      setImportError(null);
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('ข้อมูลต้องเป็น Array [...] ของ Boss');
      }

      // Basic sanity validation
      const validBosses: Boss[] = parsed.map((item, idx) => ({
        id: item.id || `boss-${item.num || idx + 1}`,
        num: Number(item.num || idx + 1),
        name: item.name || item.thaiName || `บอส ${idx + 1}`,
        thaiName: item.thaiName || item.name || `บอส ${idx + 1}`,
        engName: item.engName || item.name || `Boss ${idx + 1}`,
        cooldownHours: Number(item.cooldownHours || 4),
        lastKilledAt: item.lastKilledAt ? Number(item.lastKilledAt) : null,
        respawnAt: item.respawnAt ? Number(item.respawnAt) : null,
        pinned: Boolean(item.pinned),
        lastAlertCycleRespawnAt: item.lastAlertCycleRespawnAt ? Number(item.lastAlertCycleRespawnAt) : null,
        notifiedStages: item.notifiedStages || {},
        location: item.location || '',
        notes: item.notes || '',
        server: item.server || (item.serverTag?.includes('Invasion') ? 'invasion' : 'main'),
        serverTag: item.serverTag || (item.server === 'invasion' ? 'เซิร์ฟ Invasion' : 'เซิร์ฟหลัก'),
      }));

      onImport(validBosses);
      onClose();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'รูปแบบ JSON ไม่ถูกต้อง');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <h2 className="text-lg font-bold text-white">จัดการข้อมูล (Export / Import / Reset)</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'export'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            สำรองข้อมูล (Export)
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'import'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            นำเข้าข้อมูล (Import)
          </button>
          <button
            onClick={() => setActiveTab('reset')}
            className={`py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'reset'
                ? 'bg-red-600/80 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            คืนค่าเริ่มต้น
          </button>
        </div>

        {/* Content based on tab */}
        {activeTab === 'export' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <p className="text-xs text-slate-400">
              คัดลอก JSON หรือดาวน์โหลดไฟล์เพื่อสำรองตารางเวลาบอสปัจจุบัน ({bosses.length} รายการ)
            </p>
            <textarea
              readOnly
              value={exportString}
              className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs resize-none focus:outline-none"
              rows={9}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>ดาวน์โหลดไฟล์ .json</span>
              </button>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก JSON'}</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <p className="text-xs text-slate-400">
              วาง JSON ของบอสที่ต้องการนำเข้า (จะแทนที่ตารางบอสปัจจุบัน)
            </p>
            <textarea
              placeholder="[ { id: 'boss-22', num: 22, ... } ]"
              value={importJsonText}
              onChange={(e) => setImportJsonText(e.target.value)}
              className="flex-1 p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs resize-none focus:outline-none focus:border-amber-500"
              rows={9}
            />
            {importError && (
              <div className="text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={!importJsonText.trim()}
                onClick={handleExecuteImport}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>นำเข้าและบันทึก</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reset' && (
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 space-y-3 bg-slate-950/60 rounded-xl border border-red-900/30">
            <div className="p-3 rounded-full bg-red-500/20 text-red-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">ต้องการคืนค่าเริ่มต้นทั้งหมด?</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              ระบบจะรีเซ็ตข้อมูลบอสทั้ง 47 ตัวกลับสู่ชุดข้อมูลเริ่มต้นที่คุณส่งมา
              เวลาที่บันทึกไว้ในเบราว์เซอร์จะถูกล้าง
            </p>
            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToDefault();
                  onClose();
                }}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-950 transition-colors"
              >
                ยืนยันคืนค่าเริ่มต้น
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
