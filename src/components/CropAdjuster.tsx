import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Point, Quad } from '../types';
import { autoDetectCorners, warpPerspective, rotateCanvas, loadImage } from '../utils/imageProcessing';
import { RotateCw, Sparkles, Maximize2, Check, ArrowRight, Undo2 } from 'lucide-react';

interface CropAdjusterProps {
  imageDataUrl: string;
  initialQuad?: Quad;
  onConfirmCrop: (croppedDataUrl: string, quad: Quad, rotation: number) => void;
  onCancel: () => void;
}

type CornerKey = 'topLeft' | 'topRight' | 'bottomRight' | 'bottomLeft';

export const CropAdjuster: React.FC<CropAdjusterProps> = ({
  imageDataUrl,
  initialQuad,
  onConfirmCrop,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loupeCanvasRef = useRef<HTMLCanvasElement>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imgDims, setImgDims] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

  const [quad, setQuad] = useState<Quad>({
    topLeft: { x: 50, y: 50 },
    topRight: { x: 750, y: 50 },
    bottomRight: { x: 750, y: 550 },
    bottomLeft: { x: 50, y: 550 },
  });

  const [activeCorner, setActiveCorner] = useState<CornerKey | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [magnifierPos, setMagnifierPos] = useState<Point | null>(null);

  // Load image
  useEffect(() => {
    loadImage(imageDataUrl).then((img) => {
      setImage(img);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      setImgDims({ width: w, height: h });

      if (initialQuad) {
        setQuad(initialQuad);
      } else {
        const detected = autoDetectCorners(img);
        setQuad(detected);
      }
    });
  }, [imageDataUrl, initialQuad]);

  // Compute scale and bounds on resize
  const updateLayout = useCallback(() => {
    if (!containerRef.current || !image) return;
    const rect = containerRef.current.getBoundingClientRect();
    const availableW = rect.width - 24;
    const availableH = rect.height - 24;

    const s = Math.min(availableW / imgDims.width, availableH / imgDims.height);
    setScale(s);

    const renderedW = imgDims.width * s;
    const renderedH = imgDims.height * s;
    setOffset({
      x: (rect.width - renderedW) / 2,
      y: (rect.height - renderedH) / 2,
    });
  }, [image, imgDims]);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  // Convert image coords to container screen coords
  const toScreen = (p: Point): Point => ({
    x: p.x * scale + offset.x,
    y: p.y * scale + offset.y,
  });

  // Convert container screen coords to image coords
  const toImage = (p: Point): Point => ({
    x: Math.max(0, Math.min(imgDims.width, Math.round((p.x - offset.x) / scale))),
    y: Math.max(0, Math.min(imgDims.height, Math.round((p.y - offset.y) / scale))),
  });

  // Draw magnifier loupe
  const updateLoupe = (imgPoint: Point) => {
    if (!image || !loupeCanvasRef.current) return;
    const loupe = loupeCanvasRef.current;
    const ctx = loupe.getContext('2d');
    if (!ctx) return;

    const size = 110;
    loupe.width = size;
    loupe.height = size;

    const zoom = 2.4;
    const sampleSize = size / zoom;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Circular clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.drawImage(
      image,
      imgPoint.x - sampleSize / 2,
      imgPoint.y - sampleSize / 2,
      sampleSize,
      sampleSize,
      0,
      0,
      size,
      size
    );

    // Crosshairs
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();

    // Central target dot
    ctx.fillStyle = '#0d9488';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Pointer drag handling
  const handlePointerDown = (corner: CornerKey, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveCorner(corner);

    const pt = toScreen(quad[corner]);
    setMagnifierPos({ x: pt.x, y: Math.max(70, pt.y - 80) });
    updateLoupe(quad[corner]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeCorner || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const imgPt = toImage({ x: mouseX, y: mouseY });

    setQuad((prev) => ({
      ...prev,
      [activeCorner]: imgPt,
    }));

    setMagnifierPos({ x: mouseX, y: Math.max(70, mouseY - 80) });
    updateLoupe(imgPt);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activeCorner) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setActiveCorner(null);
      setMagnifierPos(null);
    }
  };

  // Auto detect corners
  const handleAutoDetect = () => {
    if (!image) return;
    const detected = autoDetectCorners(image);
    setQuad(detected);
  };

  // Reset to full frame
  const handleFullFrame = () => {
    setQuad({
      topLeft: { x: 0, y: 0 },
      topRight: { x: imgDims.width, y: 0 },
      bottomRight: { x: imgDims.width, y: imgDims.height },
      bottomLeft: { x: 0, y: imgDims.height },
    });
  };

  // Rotate image by 90 degrees
  const handleRotate = () => {
    if (!image) return;
    setIsProcessing(true);
    const c = document.createElement('canvas');
    c.width = imgDims.width;
    c.height = imgDims.height;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(image, 0, 0);

    const rotated = rotateCanvas(c, 90);
    const newUrl = rotated.toDataURL('image/jpeg', 0.95);

    loadImage(newUrl).then((newImg) => {
      setImage(newImg);
      const w = newImg.naturalWidth || newImg.width;
      const h = newImg.naturalHeight || newImg.height;
      setImgDims({ width: w, height: h });
      setRotation((prev) => (prev + 90) % 360);
      const detected = autoDetectCorners(newImg);
      setQuad(detected);
      setIsProcessing(false);
    });
  };

  // Confirm crop & perspective warp
  const handleConfirm = () => {
    if (!image) return;
    setIsProcessing(true);
    setTimeout(() => {
      const warpedCanvas = warpPerspective(image, quad);
      const resultDataUrl = warpedCanvas.toDataURL('image/jpeg', 0.95);
      setIsProcessing(false);
      onConfirmCrop(resultDataUrl, quad, rotation);
    }, 40);
  };

  const pTL = toScreen(quad.topLeft);
  const pTR = toScreen(quad.topRight);
  const pBR = toScreen(quad.bottomRight);
  const pBL = toScreen(quad.bottomLeft);

  const corners: { key: CornerKey; label: string; pt: Point }[] = [
    { key: 'topLeft', label: 'بالا-راست', pt: pTL },
    { key: 'topRight', label: 'بالا-چپ', pt: pTR },
    { key: 'bottomRight', label: 'پایین-چپ', pt: pBR },
    { key: 'bottomLeft', label: 'پایین-راست', pt: pBL },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 z-10">
        <button
          id="btn-cancel-crop"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Undo2 size={18} />
          <span>بازگشت</span>
        </button>

        <div className="text-center">
          <h2 className="text-sm font-semibold text-slate-100">تنظیم و برش هوشمند لبه‌ها</h2>
          <p className="text-[11px] text-teal-400">گوشه‌ها را برای تراز دقیق تنظیم کنید</p>
        </div>

        <button
          id="btn-confirm-crop"
          onClick={handleConfirm}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <span>تایید و فیلتر</span>
          <Check size={18} />
        </button>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden flex items-center justify-center p-3 bg-slate-950 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {image && (
          <div
            className="relative"
            style={{
              width: `${imgDims.width * scale}px`,
              height: `${imgDims.height * scale}px`,
            }}
          >
            <img
              src={image.src}
              alt="Scan target"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain pointer-events-none rounded"
            />

            {/* SVG Quad Overlay */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ overflow: 'visible' }}
            >
              {/* Semi-transparent dark backdrop mask */}
              <polygon
                points={`${pTL.x - offset.x},${pTL.y - offset.y} ${pTR.x - offset.x},${pTR.y - offset.y} ${pBR.x - offset.x},${pBR.y - offset.y} ${pBL.x - offset.x},${pBL.y - offset.y}`}
                fill="rgba(13, 148, 136, 0.16)"
                stroke="#0d9488"
                strokeWidth="2.5"
                strokeLinejoin="round"
                strokeDasharray="4 2"
              />
            </svg>

            {/* Draggable Corner Handles */}
            {corners.map((c) => {
              const relX = c.pt.x - offset.x;
              const relY = c.pt.y - offset.y;
              const isActive = activeCorner === c.key;

              return (
                <div
                  key={c.key}
                  id={`corner-handle-${c.key}`}
                  onPointerDown={(e) => handlePointerDown(c.key, e)}
                  style={{
                    transform: `translate(${relX}px, ${relY}px) translate(-50%, -50%)`,
                  }}
                  className="absolute cursor-grab active:cursor-grabbing touch-none z-20"
                >
                  <div className="relative flex items-center justify-center w-11 h-11">
                    {/* Ripple animation on active */}
                    {isActive && (
                      <div className="absolute w-12 h-12 rounded-full bg-teal-400 opacity-40 animate-ping pointer-events-none" />
                    )}
                    {/* Outer circle */}
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
                        isActive
                          ? 'scale-125 bg-teal-500 border-white ring-4 ring-teal-500/40'
                          : 'bg-teal-600 border-white hover:scale-110'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Magnifier Loupe Floating View */}
        {magnifierPos && (
          <div
            className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out shadow-2xl rounded-full border-2 border-teal-400 bg-slate-900 overflow-hidden"
            style={{
              left: `${magnifierPos.x}px`,
              top: `${magnifierPos.y}px`,
              transform: 'translate(-50%, -100%)',
              width: '110px',
              height: '110px',
            }}
          >
            <canvas ref={loupeCanvasRef} className="w-full h-full" />
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-40">
            <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-slate-200">در حال اصلاح زاویه و پرسپکتیو...</span>
          </div>
        )}
      </div>

      {/* Bottom Tools Toolbar */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-around gap-2 z-10">
        <button
          id="btn-auto-detect"
          onClick={handleAutoDetect}
          className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-teal-300 hover:text-teal-200 active:scale-95 transition-all rounded-lg hover:bg-slate-800"
        >
          <Sparkles size={20} className="text-teal-400" />
          <span>تشخیص خودکار</span>
        </button>

        <button
          id="btn-full-frame"
          onClick={handleFullFrame}
          className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white active:scale-95 transition-all rounded-lg hover:bg-slate-800"
        >
          <Maximize2 size={20} className="text-slate-400" />
          <span>کل کادر</span>
        </button>

        <button
          id="btn-rotate-90"
          onClick={handleRotate}
          className="flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white active:scale-95 transition-all rounded-lg hover:bg-slate-800"
        >
          <RotateCw size={20} className="text-slate-400" />
          <span>چرخش ۹۰°</span>
        </button>
      </div>
    </div>
  );
};
