import React, { useState, useRef } from 'react';
import { X, Camera, CheckCircle2, FileBadge, ArrowLeft, Download, FileText, Share2 } from 'lucide-react';
import { createDualSideIDCard } from '../utils/imageProcessing';
import { createSampleDocumentImage } from '../utils/sampleData';

interface DualSideIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToVault: (combinedDataUrl: string) => void;
  onDownloadPdf: (combinedDataUrl: string) => void;
  onShare: (combinedDataUrl: string) => void;
}

export const DualSideIdModal: React.FC<DualSideIdModalProps> = ({
  isOpen,
  onClose,
  onSaveToVault,
  onDownloadPdf,
  onShare,
}) => {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  const [combinedImage, setCombinedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessCombine = async () => {
    if (!frontImage || !backImage) return;
    setIsProcessing(true);
    try {
      const res = await createDualSideIDCard(frontImage, backImage);
      setCombinedImage(res);
    } catch (err) {
      console.error('Error combining ID card images:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUseSamplePair = () => {
    const sample = createSampleDocumentImage('id_card');
    setFrontImage(sample);
    setBackImage(sample);
  };

  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setCombinedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileBadge size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">فتوکپی دوطرفه کارت ملی</h3>
              <p className="text-[11px] text-slate-400">تلفیق روی و پشت کارت در یک برگه A4 رسمی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {combinedImage ? (
            /* Result View */
            <div className="space-y-3 text-center">
              <div className="border border-slate-700 rounded-xl overflow-hidden bg-white shadow-md max-h-[50vh] flex items-center justify-center p-2">
                <img
                  src={combinedImage}
                  alt="A4 Combined ID"
                  referrerPolicy="no-referrer"
                  className="max-h-[46vh] object-contain rounded"
                />
              </div>

              <div className="text-xs text-teal-400 font-medium">
                برگه A4 استاندارد فتوکپی با موفقیت آماده شد.
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => onDownloadPdf(combinedImage)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow transition-all"
                >
                  <FileText size={16} />
                  <span>دانلود PDF آماده چاپ</span>
                </button>

                <button
                  onClick={() => onShare(combinedImage)}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all"
                >
                  <Share2 size={16} className="text-teal-400" />
                  <span>اشتراک‌گذاری سریع</span>
                </button>
              </div>

              <button
                onClick={() => {
                  onSaveToVault(combinedImage);
                  onClose();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-medium border border-teal-500/30 transition-all"
              >
                ذخیره در بایگانی مدارک
              </button>

              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                تلفیق مجدد کارت دیگر
              </button>
            </div>
          ) : (
            /* Step 1 & Step 2 Input */
            <div className="space-y-4">
              {/* Front Card slot */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">۱</span>
                    <span>تصویر روی کارت ملی</span>
                  </span>
                  {frontImage && (
                    <span className="text-[11px] text-teal-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> تایید شد
                    </span>
                  )}
                </div>

                {frontImage ? (
                  <div className="relative aspect-[1.585/1] rounded-lg overflow-hidden border border-slate-700">
                    <img src={frontImage} alt="Front ID" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setFrontImage(null)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-md text-[10px]"
                    >
                      تغییر
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputFrontRef.current?.click()}
                    className="w-full aspect-[1.585/1] border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-teal-300 bg-slate-900/40 transition-colors"
                  >
                    <Camera size={24} />
                    <span className="text-xs font-medium">عکسبرداری یا انتخاب روی کارت</span>
                  </button>
                )}
                <input
                  ref={fileInputFrontRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setFrontImage(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
              </div>

              {/* Back Card slot */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px]">۲</span>
                    <span>تصویر پشت کارت ملی</span>
                  </span>
                  {backImage && (
                    <span className="text-[11px] text-teal-400 flex items-center gap-1">
                      <CheckCircle2 size={13} /> تایید شد
                    </span>
                  )}
                </div>

                {backImage ? (
                  <div className="relative aspect-[1.585/1] rounded-lg overflow-hidden border border-slate-700">
                    <img src={backImage} alt="Back ID" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setBackImage(null)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-md text-[10px]"
                    >
                      تغییر
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputBackRef.current?.click()}
                    className="w-full aspect-[1.585/1] border-2 border-dashed border-slate-700 hover:border-teal-500 rounded-lg flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-teal-300 bg-slate-900/40 transition-colors"
                  >
                    <Camera size={24} />
                    <span className="text-xs font-medium">عکسبرداری یا انتخاب پشت کارت</span>
                  </button>
                )}
                <input
                  ref={fileInputBackRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setBackImage(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }}
                />
              </div>

              {/* Sample test button */}
              <button
                onClick={handleUseSamplePair}
                className="w-full text-center text-xs text-slate-400 hover:text-teal-400 py-1 transition-colors"
              >
                تکمیل سریع با نمونه آزمایشی کارت
              </button>

              <button
                disabled={!frontImage || !backImage || isProcessing}
                onClick={handleProcessCombine}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? 'در حال تلفیق و تنظیم A4...' : 'ایجاد فتوکپی A4 دوطرفه'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
