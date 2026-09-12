import React, { useState, useRef, useEffect } from 'react';
import { DocumentType } from '../types';
import { Camera, Image as ImageIcon, Zap, RefreshCw, X, FileBadge, Sparkles } from 'lucide-react';
import { createSampleDocumentImage } from '../utils/sampleData';

interface CameraViewfinderProps {
  onCapture: (imageDataUrl: string, docType: DocumentType) => void;
  onCancel: () => void;
  onStartDualSide?: () => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCapture,
  onCancel,
  onStartDualSide,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocumentType>('id_card');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);

  // Start video stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function initCamera() {
      try {
        setCameraError(null);
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const s = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = s;
        setStream(s);

        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }

        // Check torch capability
        const track = s.getVideoTracks()[0];
        const caps = track.getCapabilities?.() as any;
        if (caps && 'torch' in caps) {
          setHasTorch(true);
        }
      } catch (err: any) {
        console.warn('Camera access error or restricted:', err);
        setCameraError('دسترسی به دوربین در این محیط فعال نیست. می‌توانید از گالری عکس انتخاب کنید یا نمونه تستی را امتحان کنید.');
      }
    }

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Toggle flashlight
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      await (track as any).applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch {
      // ignore
    }
  };

  // Flip camera
  const flipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from video
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    onCapture(dataUrl, docType);
  };

  // File upload fallback
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        onCapture(result, docType);
      }
    };
    reader.readAsDataURL(file);
  };

  // Use built-in high quality sample test
  const handleUseSample = () => {
    const sample = createSampleDocumentImage(docType === 'document_a4' ? 'document_a4' : 'id_card');
    onCapture(sample, docType);
  };

  return (
    <div className="relative flex flex-col h-full bg-black text-slate-100 select-none overflow-hidden">
      {/* Top Bar Controls */}
      <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
        <button
          id="btn-close-camera"
          onClick={onCancel}
          className="w-10 h-10 rounded-full bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white border border-slate-700/50"
        >
          <X size={20} />
        </button>

        {/* Document Type Selector */}
        <div className="flex bg-slate-900/80 backdrop-blur-md rounded-full p-1 border border-slate-700/50 text-xs">
          <button
            onClick={() => setDocType('id_card')}
            className={`px-3 py-1 rounded-full transition-all ${
              docType === 'id_card' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            کارت ملی / گواهینامه
          </button>
          <button
            onClick={() => setDocType('document_a4')}
            className={`px-3 py-1 rounded-full transition-all ${
              docType === 'document_a4' ? 'bg-teal-600 text-white font-semibold' : 'text-slate-300'
            }`}
          >
            برگه A4 و سند
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border border-slate-700/50 ${
                torchOn ? 'bg-amber-500 text-black' : 'bg-slate-900/70 text-slate-200'
              }`}
            >
              <Zap size={18} />
            </button>
          )}

          <button
            onClick={flipCamera}
            className="w-10 h-10 rounded-full bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-slate-200 hover:text-white border border-slate-700/50"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Camera Video Viewfinder or Fallback */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {cameraError ? (
          <div className="p-6 text-center max-w-sm mx-auto flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Camera size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-200">آماده اسکن و فتوکپی هوشمند</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{cameraError}</p>

            <div className="flex flex-col w-full gap-2 mt-3">
              <button
                id="btn-pick-from-gallery"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg transition-all"
              >
                <ImageIcon size={18} />
                <span>انتخاب تصویر از گالری یا مدارک</span>
              </button>

              <button
                id="btn-test-sample-card"
                onClick={handleUseSample}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-xl text-xs font-medium border border-teal-500/30 transition-all"
              >
                <Sparkles size={16} />
                <span>آزمایش سریع با نمونه کارت ملی / سند رسمی</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Viewfinder Target Guide Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
              <div
                className={`relative border-2 border-teal-400/80 rounded-2xl shadow-2xl transition-all duration-300 ${
                  docType === 'id_card'
                    ? 'w-[85vw] max-w-[340px] aspect-[1.585/1]'
                    : 'w-[85vw] max-w-[320px] aspect-[1/1.414]'
                }`}
              >
                {/* Corner guide brackets */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-300 rounded-tl-md" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-300 rounded-tr-md" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-300 rounded-bl-md" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-300 rounded-br-md" />

                {/* Scanning laser effect */}
                <div className="absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent scanner-laser shadow-[0_0_10px_#2dd4bf]" />

                <div className="absolute inset-x-0 -bottom-8 text-center text-xs font-medium text-teal-300 drop-shadow-md">
                  مدرک را داخل کادر نگه دارید
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hidden File Input for Gallery */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Bottom Shutter Controls */}
      <div className="z-30 p-5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-around">
        {/* Gallery button */}
        <button
          id="btn-gallery-select"
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white"
        >
          <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center">
            <ImageIcon size={22} className="text-teal-400" />
          </div>
          <span className="text-[11px]">گالری</span>
        </button>

        {/* Shutter Button */}
        <button
          id="btn-camera-shutter"
          onClick={takeSnapshot}
          className="w-19 h-19 rounded-full bg-white/20 border-4 border-white flex items-center justify-center active:scale-90 transition-transform shadow-xl"
        >
          <div className="w-14 h-14 rounded-full bg-white active:bg-teal-400" />
        </button>

        {/* Dual Side ID Mode Button */}
        <button
          id="btn-dual-side-mode"
          onClick={onStartDualSide}
          className="flex flex-col items-center gap-1 text-slate-300 hover:text-white"
        >
          <div className="w-12 h-12 rounded-full bg-slate-900/80 border border-slate-700 flex items-center justify-center">
            <FileBadge size={22} className="text-amber-400" />
          </div>
          <span className="text-[11px]">کارت ملی دوطرفه</span>
        </button>
      </div>
    </div>
  );
};
