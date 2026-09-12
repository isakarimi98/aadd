import React from 'react';
import { X, Smartphone, CheckCircle, GitBranch, Download, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';

interface AndroidBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidBuildModal: React.FC<AndroidBuildModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">راهنمای خروجی APK و انتشار در بازار و مایکت</h3>
              <p className="text-[11px] text-emerald-400">منطبق بر اندروید ۱۴ (API Level 34)</p>
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
          {/* Status banner */}
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-xl space-y-1.5 text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle size={16} className="text-emerald-400" />
              <span>تمام الزامات API Level 34 بازار و مایکت اعمال شد</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              فایل‌های گریدل اندروید (`android/app/build.gradle`) و مانیفست با `targetSdkVersion 34` و `compileSdkVersion 34` آماده‌سازی شده و ورک‌فلوی خودکار گیت‌هاب اکشن ایجاد گردید.
            </p>
          </div>

          {/* Checklist */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-200">چک‌لیست تایید انتشار در کافه بازار و مایکت:</span>
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>تنظیم <code>targetSdkVersion = 34</code> (الزام جدید بازار و مایکت ۱۴۰۳/۱۴۰۴)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>عملکرد ۱۰۰٪ آفلاین هسته بدون نیاز اجباری به اینترنت یا مدل هوش مصنوعی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>رابط کاربری کاملا راست‌چین (RTL) با فونت استاندارد و زیبای فارسی</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>پشتیبانی کامل از حالت تاریک (Dark Mode) و حالت روشن</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 flex-shrink-0" />
                <span>مجوزهای بهینه‌شده طبق استاندارد Android 14 (READ_MEDIA_IMAGES و CAMERA)</span>
              </div>
            </div>
          </div>

          {/* GitHub Actions Guide */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <GitBranch size={16} className="text-teal-400" />
              <span>ساخت خودکار فایل نصبی APK توسط گیت‌هاب اکشن:</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ورک‌فلو در مسیر <code>.github/workflows/build-apk.yml</code> قرار دارد. با هر بار Push یا اجرای دستی در تب Actions گیت‌هاب:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 mr-2">
              <li>محیط بیلد لینوکس و Java 17 به همراه Android SDK 34 راه‌اندازی می‌شود.</li>
              <li>پروژه کامپایل شده و فایل‌های <code>APK</code> و <code>AAB</code> خروجی گرفته می‌شوند.</li>
              <li>فایل نصبی نهایی در بخش <b>Artifacts</b> گیت‌هاب جهت دانلود مستقیم قرار می‌گیرد.</li>
            </ol>
          </div>

          {/* Local Command instruction */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <Terminal size={14} className="text-amber-400" />
              <span>دستور بیلد محلی در سیستم شخصی:</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-lg font-mono text-[10px] text-teal-300 select-all text-left dir-ltr">
              cd android && ./gradlew assembleRelease
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
