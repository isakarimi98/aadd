import React, { useState } from 'react';
import { X, Share2, Download, Copy, Check, Send, MessageCircle, Mail } from 'lucide-react';
import { ScannedDocument } from '../types';
import { downloadDocumentPDF } from '../utils/pdfGenerator';

interface ShareSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  document?: ScannedDocument | null;
  imageDataUrl?: string | null;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  isOpen,
  onClose,
  document,
  imageDataUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  if (!isOpen) return null;

  const title = document?.title || 'سند فتوکپی و اسکن شده';
  const previewImg = imageDataUrl || document?.pages[0]?.processedDataUrl || document?.pages[0]?.originalDataUrl;

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share && previewImg) {
      try {
        // Convert dataUrl to File
        const res = await fetch(previewImg);
        const blob = await res.blob();
        const file = new File([blob], `${title}.jpg`, { type: 'image/jpeg' });

        await navigator.share({
          title: title,
          text: 'تصویر مدرک اسکن شده با کیفیت بالا توسط فتوکپی پلاس',
          files: [file],
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleDownloadJpg = () => {
    if (!previewImg) return;
    const a = window.document.createElement('a');
    a.href = previewImg;
    a.download = `${title}.jpg`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  const handleDownloadPdf = async () => {
    if (!document && previewImg) {
      // Create temporary doc
      const tempDoc: ScannedDocument = {
        id: 'temp',
        title: title,
        type: 'document_a4',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        pages: [
          {
            id: 'temp-p1',
            originalDataUrl: previewImg,
            processedDataUrl: previewImg,
            quad: {
              topLeft: { x: 0, y: 0 },
              topRight: { x: 800, y: 0 },
              bottomRight: { x: 800, y: 600 },
              bottomLeft: { x: 0, y: 600 },
            },
            rotation: 0,
            filter: 'photocopy',
            brightness: 0,
            contrast: 10,
            threshold: 135,
            createdAt: Date.now(),
          },
        ],
      };
      setIsExportingPdf(true);
      await downloadDocumentPDF(tempDoc);
      setIsExportingPdf(false);
      return;
    }

    if (document) {
      setIsExportingPdf(true);
      await downloadDocumentPDF(document);
      setIsExportingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Pre-configured social messenger share links
  const textMsg = encodeURIComponent(`تصویر مدرک هویتی اسکن شده: ${title}`);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${textMsg}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${textMsg}`;
  const eitaaUrl = `https://eitaa.com/share/url?url=${encodeURIComponent(window.location.href)}&text=${textMsg}`;
  const baleUrl = `https://ble.ir/share/url?url=${encodeURIComponent(window.location.href)}&text=${textMsg}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Share2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">اشتراک‌گذاری و ارسال مدرک</h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{title}</p>
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
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Preview Image */}
          {previewImg && (
            <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center p-2">
              <img
                src={previewImg}
                alt="Document preview"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          )}

          {/* Direct File Downloads */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold shadow transition-all"
            >
              <Download size={15} />
              <span>{isExportingPdf ? 'در حال تولید...' : 'خروجی فایل PDF'}</span>
            </button>

            <button
              onClick={handleDownloadJpg}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium border border-slate-700 transition-all"
            >
              <Download size={15} className="text-teal-400" />
              <span>دانلود عکس JPG</span>
            </button>
          </div>

          {/* Native Android Share */}
          {navigator.share && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Share2 size={16} />
              <span>ارسال از طریق منوی اشتراک اندروید</span>
            </button>
          )}

          {/* Social Messenger Shortcuts */}
          <div className="space-y-2">
            <span className="font-semibold text-slate-400 text-[11px]">ارسال به پیام‌رسان‌ها:</span>
            <div className="grid grid-cols-4 gap-2 text-center">
              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-slate-200 transition-all gap-1"
              >
                <Send size={18} className="text-sky-400" />
                <span className="text-[10px]">تلگرام</span>
              </a>

              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-slate-200 transition-all gap-1"
              >
                <MessageCircle size={18} className="text-emerald-400" />
                <span className="text-[10px]">واتساپ</span>
              </a>

              {/* Eitaa */}
              <a
                href={eitaaUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-slate-200 transition-all gap-1"
              >
                <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] flex items-center justify-center">
                  ای
                </div>
                <span className="text-[10px]">ایتا</span>
              </a>

              {/* Bale */}
              <a
                href={baleUrl}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700/80 rounded-xl border border-slate-700 text-slate-200 transition-all gap-1"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[11px] flex items-center justify-center">
                  ب
                </div>
                <span className="text-[10px]">بله</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
