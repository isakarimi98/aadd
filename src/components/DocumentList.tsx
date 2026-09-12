import React, { useState } from 'react';
import { ScannedDocument, DocumentType } from '../types';
import {
  FileText,
  Share2,
  Download,
  Trash2,
  Star,
  Search,
  Plus,
  Camera,
  FileBadge,
  Sparkles,
  ExternalLink,
  Calendar,
  Layers,
  Smartphone,
  Cloud,
  Moon,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { downloadDocumentPDF } from '../utils/pdfGenerator';

interface DocumentListProps {
  documents: ScannedDocument[];
  onOpenDoc: (doc: ScannedDocument) => void;
  onDeleteDoc: (docId: string) => void;
  onToggleFavorite: (docId: string) => void;
  onNewScan: () => void;
  onOpenDualSide: () => void;
  onOpenCloudSync: () => void;
  onOpenBuildGuide: () => void;
  onShareDoc: (doc: ScannedDocument) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onOpenDoc,
  onDeleteDoc,
  onToggleFavorite,
  onNewScan,
  onOpenDualSide,
  onOpenCloudSync,
  onOpenBuildGuide,
  onShareDoc,
  isDarkMode,
  onToggleTheme,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | DocumentType | 'favorite'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filtered list
  const filtered = documents.filter((doc) => {
    const matchSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;

    if (filterCategory === 'favorite') return !!doc.isFavorite;
    if (filterCategory !== 'all') return doc.type === filterCategory;
    return true;
  });

  const handleDownloadPdf = async (e: React.MouseEvent, doc: ScannedDocument) => {
    e.stopPropagation();
    try {
      setDownloadingId(doc.id);
      await downloadDocumentPDF(doc);
    } catch (err) {
      console.error('Download PDF error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const getDocTypeBadge = (type: DocumentType) => {
    switch (type) {
      case 'id_card':
        return { label: 'کارت ملی / هوشمند', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' };
      case 'document_a4':
        return { label: 'سند رسمی A4', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'passport':
        return { label: 'پاسپورت و شناسنامه', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'receipt':
        return { label: 'رسید و فیش', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      default:
        return { label: 'سند', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  const formatPersianDate = (ts: number) => {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(ts));
  };

  return (
    <div className="flex flex-col h-full select-none">
      {/* Top App Header */}
      <header className="px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-teal-500/40 shadow-sm flex items-center justify-center bg-slate-950">
            <img
              src="/src/assets/images/app_scanner_icon_1789253189368.jpg"
              alt="App Icon"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>فتوکپی پلاس</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                آفلاین
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">اسکنر و فتوکپی هوشمند مدارک</p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-1.5">
          {/* APK / Bazaar guide button */}
          <button
            id="btn-open-build-guide"
            onClick={onOpenBuildGuide}
            title="راهنمای خروجی APK بازار و مایکت"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-emerald-400 transition-colors"
          >
            <Smartphone size={16} />
          </button>

          {/* Cloud sync */}
          <button
            id="btn-open-cloud-sync"
            onClick={onOpenCloudSync}
            title="سینک ابری و پشتیبان"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-teal-400 transition-colors"
          >
            <Cloud size={16} />
          </button>

          {/* Dark / Light toggle */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            title="تغییر تم رنگی"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-amber-300 transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Action Cards Banner */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-start-scan-banner"
            onClick={onNewScan}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 border border-teal-500/40 text-right shadow-lg flex flex-col justify-between h-28 hover:brightness-110 active:scale-98 transition-all group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Camera size={18} />
              </div>
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                فوری
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">اسکن مدرک جدید</span>
              <span className="text-[10px] text-teal-100">تشخیص خودکار و برش لبه‌ها</span>
            </div>
          </button>

          <button
            id="btn-start-dualside-banner"
            onClick={onOpenDualSide}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-700/80 to-slate-900 border border-amber-500/40 text-right shadow-lg flex flex-col justify-between h-28 hover:brightness-110 active:scale-98 transition-all group"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <FileBadge size={18} />
              </div>
              <span className="text-[10px] bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded-full font-medium">
                ویژه A4
              </span>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">کارت ملی دوطرفه</span>
              <span className="text-[10px] text-amber-200">رو و پشت در یک برگه A4</span>
            </div>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در مدارک و کارت‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pr-9 pl-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'all'
                ? 'bg-teal-600 text-white font-medium shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            همه ({documents.length})
          </button>

          <button
            onClick={() => setFilterCategory('id_card')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'id_card'
                ? 'bg-teal-600 text-white font-medium shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            کارت‌های شناسایی
          </button>

          <button
            onClick={() => setFilterCategory('document_a4')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
              filterCategory === 'document_a4'
                ? 'bg-teal-600 text-white font-medium shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            اسناد A4
          </button>

          <button
            onClick={() => setFilterCategory('favorite')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1 ${
              filterCategory === 'favorite'
                ? 'bg-amber-600 text-white font-medium shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Star size={12} />
            <span>برگزیده‌ها</span>
          </button>
        </div>

        {/* Document Items List */}
        {filtered.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800/80">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/60 flex items-center justify-center text-slate-500">
              <FileText size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-300">مدرکی یافت نشد</h3>
              <p className="text-xs text-slate-500">
                با دکمه اسکن جدید اولین مدرک یا کارت شناسایی خود را ثبت کنید.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => {
              const badge = getDocTypeBadge(doc.type);
              const previewThumb = doc.pages[0]?.processedDataUrl || doc.pages[0]?.originalDataUrl;

              return (
                <div
                  key={doc.id}
                  id={`doc-card-${doc.id}`}
                  onClick={() => onOpenDoc(doc)}
                  className="p-3 bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 rounded-2xl flex items-center gap-3 transition-all cursor-pointer shadow-sm group hover:border-slate-700"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-slate-950 border border-slate-700/60 flex-shrink-0 flex items-center justify-center">
                    {previewThumb ? (
                      <img
                        src={previewThumb}
                        alt={doc.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <FileText size={24} className="text-slate-600" />
                    )}

                    {doc.pages.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1.5 py-0.2 rounded-md font-mono flex items-center gap-0.5">
                        <Layers size={9} />
                        {doc.pages.length}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-100 truncate group-hover:text-teal-300 transition-colors">
                        {doc.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(doc.id);
                        }}
                        className="text-slate-500 hover:text-amber-400 p-1"
                      >
                        <Star
                          size={15}
                          className={doc.isFavorite ? 'fill-amber-400 text-amber-400' : ''}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md border ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Calendar size={10} />
                        {formatPersianDate(doc.createdAt)}
                      </span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        id={`btn-download-pdf-${doc.id}`}
                        onClick={(e) => handleDownloadPdf(e, doc)}
                        disabled={downloadingId === doc.id}
                        title="دانلود فایل PDF"
                        className="flex items-center gap-1 px-2.5 py-1 bg-teal-950/60 hover:bg-teal-900/80 border border-teal-700/50 text-teal-300 rounded-lg text-[11px] font-medium transition-colors"
                      >
                        <Download size={12} />
                        <span>{downloadingId === doc.id ? 'در حال تولید...' : 'PDF'}</span>
                      </button>

                      <button
                        id={`btn-share-${doc.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareDoc(doc);
                        }}
                        title="اشتراک‌گذاری در پیام‌رسان‌ها"
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        id={`btn-delete-${doc.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteDoc(doc.id);
                        }}
                        title="حذف مدرک"
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors mr-auto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) for Camera */}
      <div className="fixed bottom-5 left-5 z-20">
        <button
          id="btn-fab-scan"
          onClick={onNewScan}
          className="w-14 h-14 rounded-full bg-teal-500 hover:bg-teal-400 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <Camera size={26} />
        </button>
      </div>
    </div>
  );
};
