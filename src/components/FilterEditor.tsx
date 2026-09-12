import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FilterMode } from '../types';
import { applyDocumentFilter, loadImage } from '../utils/imageProcessing';
import {
  FileText,
  Sliders,
  Share2,
  Download,
  Save,
  Crop,
  Check,
  RotateCcw,
  Sun,
  Contrast,
  SlidersHorizontal,
} from 'lucide-react';

interface FilterEditorProps {
  warpedImageDataUrl: string;
  initialFilter?: FilterMode;
  onSave: (finalDataUrl: string, settings: { filter: FilterMode; brightness: number; contrast: number; threshold: number }) => void;
  onReCrop: () => void;
  onShare: (dataUrl: string) => void;
  onDownloadPdf: (dataUrl: string) => void;
}

interface FilterOption {
  id: FilterMode;
  name: string;
  desc: string;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'photocopy', name: 'فتوکپی B&W', desc: 'حذف سایه و متن پررنگ' },
  { id: 'grayscale', name: 'اسکن خاکستری', desc: 'تمیز و رسمی' },
  { id: 'magic', name: 'رنگ جادویی', desc: 'تقویت جوهر و مهرها' },
  { id: 'high_contrast', name: 'کنتراست بالا', desc: 'خوانایی حداکثر' },
  { id: 'original', name: 'اصل تصویر', desc: 'بدون دستکاری' },
  { id: 'invert', name: 'نگاتیو', desc: 'معکوس رنگی' },
];

export const FilterEditor: React.FC<FilterEditorProps> = ({
  warpedImageDataUrl,
  initialFilter = 'photocopy',
  onSave,
  onReCrop,
  onShare,
  onDownloadPdf,
}) => {
  const [filter, setFilter] = useState<FilterMode>(initialFilter);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(10);
  const [threshold, setThreshold] = useState<number>(135);
  const [showSliders, setShowSliders] = useState<boolean>(false);

  const [processedUrl, setProcessedUrl] = useState<string>(warpedImageDataUrl);
  const baseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize base canvas from warped data URL
  useEffect(() => {
    loadImage(warpedImageDataUrl).then((img) => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth || img.width;
      c.height = img.naturalHeight || img.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        baseCanvasRef.current = c;
        // initial filter apply
        const res = applyDocumentFilter(c, filter, brightness, contrast, threshold);
        setProcessedUrl(res);
      }
    });
  }, [warpedImageDataUrl]);

  // Re-apply filter when settings change
  useEffect(() => {
    if (!baseCanvasRef.current) return;
    const res = applyDocumentFilter(
      baseCanvasRef.current,
      filter,
      brightness,
      contrast,
      threshold
    );
    setProcessedUrl(res);
  }, [filter, brightness, contrast, threshold]);

  const handleResetSliders = () => {
    setBrightness(0);
    setContrast(filter === 'photocopy' ? 15 : 0);
    setThreshold(135);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-10">
        <button
          id="btn-recrop"
          onClick={onReCrop}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Crop size={16} />
          <span>اصلاح برش</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-slate-100">فیلتر فتوکپی و اسکن</h2>
          <p className="text-[11px] text-teal-400">تنظیم کیفیت چاپ و خروجی</p>
        </div>

        <button
          id="btn-save-processed"
          onClick={() => onSave(processedUrl, { filter, brightness, contrast, threshold })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <span>ذخیره سند</span>
          <Check size={16} />
        </button>
      </div>

      {/* Main Image Preview Area */}
      <div className="relative flex-1 overflow-hidden flex items-center justify-center p-3 bg-slate-950">
        <div className="relative max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg overflow-hidden border border-slate-800">
          <img
            src={processedUrl}
            alt="Processed document"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[58vh] object-contain rounded"
          />

          {/* Quick Floating Actions */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2 py-1 rounded-full border border-slate-700/50 text-[11px] text-teal-300">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            <span>پردازش ۱۰۰٪ آفلاین</span>
          </div>
        </div>

        {/* Sliders Drawer */}
        {showSliders && (
          <div className="absolute bottom-2 left-3 right-3 bg-slate-900/95 backdrop-blur-md rounded-xl p-3 border border-slate-700/80 shadow-2xl z-30 transition-all text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-teal-400" />
                <span>تنظیم دستی نور و آستانه تفکیک</span>
              </span>
              <button
                onClick={handleResetSliders}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RotateCcw size={12} />
                <span>بازنشانی</span>
              </button>
            </div>

            {/* Brightness */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Sun size={12} /> روشنایی
                </span>
                <span>{brightness}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Contrast */}
            <div className="mb-2">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Contrast size={12} /> کنتراست
                </span>
                <span>{contrast}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />
            </div>

            {/* Threshold for photocopy */}
            {filter === 'photocopy' && (
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>آستانه تفکیک متن و کاغذ</span>
                  <span>{threshold}</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="190"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter Selection Tabs */}
      <div className="bg-slate-900 border-t border-slate-800 p-2.5 z-20">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-xs font-medium text-slate-400">حالت‌های فتوکپی و بهینه‌سازی:</span>
          <button
            onClick={() => setShowSliders(!showSliders)}
            className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${
              showSliders ? 'bg-teal-600/30 text-teal-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders size={13} />
            <span>تنظیمات پیشرفته</span>
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_OPTIONS.map((opt) => {
            const isSelected = filter === opt.id;
            return (
              <button
                key={opt.id}
                id={`filter-opt-${opt.id}`}
                onClick={() => setFilter(opt.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-3.5 py-2 rounded-xl text-center transition-all border ${
                  isSelected
                    ? 'bg-teal-950/60 border-teal-500 text-teal-200 ring-1 ring-teal-500/40 shadow-sm'
                    : 'bg-slate-800/70 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <span className="text-xs font-bold leading-tight whitespace-nowrap">{opt.name}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{opt.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-around gap-2 z-10">
        <button
          id="btn-share-direct"
          onClick={() => onShare(processedUrl)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 active:scale-98 text-slate-200 rounded-xl text-xs font-medium transition-all"
        >
          <Share2 size={16} className="text-teal-400" />
          <span>اشتراک‌گذاری سریع</span>
        </button>

        <button
          id="btn-download-pdf-direct"
          onClick={() => onDownloadPdf(processedUrl)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 active:scale-98 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
        >
          <FileText size={16} />
          <span>خروجی PDF مدارک</span>
        </button>
      </div>
    </div>
  );
};
