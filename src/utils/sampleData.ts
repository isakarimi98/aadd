import { ScannedDocument } from '../types';

/**
 * Generates an authentic sample document image using Canvas for quick testing
 */
export function createSampleDocumentImage(type: 'id_card' | 'document_a4'): string {
  const canvas = document.createElement('canvas');

  if (type === 'id_card') {
    canvas.width = 856;
    canvas.height = 540;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Card background
    const gradient = ctx.createLinearGradient(0, 0, 856, 540);
    gradient.addColorStop(0, '#e2e8f0');
    gradient.addColorStop(0.5, '#cbd5e1');
    gradient.addColorStop(1, '#94a3b8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 856, 540);

    // Card border
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 836, 520);

    // Guilloche / Security pattern lines
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 856; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.bezierCurveTo(i + 40, 270, i - 40, 270, i, 540);
      ctx.stroke();
    }

    // Top Header
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 26px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('جمهوری اسلامی ایران - سازمان ثبت احوال کشور', 428, 60);
    ctx.font = '20px Vazirmatn, sans-serif';
    ctx.fillText('کارت هوشمند ملی (نمونه آزمایشی)', 428, 95);

    // Photo placeholder box
    ctx.fillStyle = '#64748b';
    ctx.fillRect(50, 140, 200, 260);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 140, 200, 260);

    // Silhouette
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(150, 220, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 360, 80, Math.PI, 0);
    ctx.fill();

    // Data fields in Persian
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 22px Vazirmatn, sans-serif';
    ctx.fillText('نام: علی', 780, 170);
    ctx.fillText('نام خانوادگی: محمدی', 780, 220);
    ctx.fillText('نام پدر: رضا', 780, 270);
    ctx.fillText('شماره ملی: ۰۰۱۲۳۴۵۶۷۸', 780, 320);
    ctx.fillText('تاریخ تولد: ۱۳۷۲/۰۴/۱۵', 780, 370);
    ctx.fillText('اعتبار: ۱۴۰۸/۰۴/۱۵', 780, 420);

    // Chip icon
    ctx.fillStyle = '#d97706';
    ctx.fillRect(300, 220, 70, 60);
    ctx.strokeStyle = '#b45309';
    ctx.strokeRect(300, 220, 70, 60);

    // Red Official Stamp
    ctx.save();
    ctx.translate(620, 420);
    ctx.rotate(-0.15);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 14px Vazirmatn, sans-serif';
    ctx.fillStyle = '#dc2626';
    ctx.textAlign = 'center';
    ctx.fillText('سازمان ثبت', 0, -5);
    ctx.fillText('تایید شد', 0, 15);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  } else {
    // A4 document
    canvas.width = 1000;
    canvas.height = 1414;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#fdfbf7'; // warm paper
    ctx.fillRect(0, 0, 1000, 1414);

    // Decorative margin
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, 920, 1334);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 30px Vazirmatn, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('بسمه تعالی', 500, 110);
    ctx.font = 'bold 24px Vazirmatn, sans-serif';
    ctx.fillText('گواهی و تاییدیه رسمی مدارک', 500, 160);

    ctx.textAlign = 'right';
    ctx.font = '18px Vazirmatn, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('شماره پیگیری: ۱۴۰۳/ص/۹۸۴۵', 900, 220);
    ctx.fillText('تاریخ: ۱۴۰۳/۰۶/۲۲', 900, 255);
    ctx.fillText('پیوست: دارد', 900, 290);

    // Divider
    ctx.beginPath();
    ctx.moveTo(100, 320);
    ctx.lineTo(900, 320);
    ctx.strokeStyle = '#cbd5e1';
    ctx.stroke();

    ctx.font = '20px Vazirmatn, sans-serif';
    ctx.fillStyle = '#1e293b';
    const lines = [
      'بدین‌وسیله گواهی می‌شود مدارک و اسناد هویتی ضمیمه‌شده به این درخواست،',
      'پس از تطبیق با سامانه‌های ثبت احوال و مرجع صادرکننده، به طور کامل تایید گردید.',
      'این نسخه جهت ارائه به مراجع قانونی، بانک‌ها و نهادهای ذی‌ربط معتبر می‌باشد.',
      'هرگونه تغییر و خدشه در مندرجات این سند موجب پیگرد قانونی خواهد بود.',
      'نسخه الکترونیکی این برگه دارای بارکد امنیتی و امضای دیجیتال است.',
    ];
    let curY = 400;
    for (const line of lines) {
      ctx.fillText(line, 900, curY);
      curY += 50;
    }

    // Official Blue Stamp
    ctx.save();
    ctx.translate(250, 1150);
    ctx.rotate(0.1);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 4;
    ctx.strokeRect(-80, -40, 160, 80);
    ctx.font = 'bold 18px Vazirmatn, sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.textAlign = 'center';
    ctx.fillText('دایره حقوقی و اسناد', 0, -5);
    ctx.fillText('ثبت رسمی', 0, 22);
    ctx.restore();

    // Signature
    ctx.save();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(650, 1140);
    ctx.bezierCurveTo(700, 1100, 750, 1190, 800, 1130);
    ctx.bezierCurveTo(820, 1110, 850, 1170, 880, 1140);
    ctx.stroke();
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.95);
  }
}

/**
 * Initializes sample documents if empty
 */
export function getInitialSampleDocument(): ScannedDocument {
  const sampleImg = createSampleDocumentImage('id_card');
  return {
    id: 'sample-doc-1',
    title: 'کارت ملی هوشمند (نمونه فتوکپی)',
    type: 'id_card',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
    isFavorite: true,
    pages: [
      {
        id: 'page-1',
        originalDataUrl: sampleImg,
        processedDataUrl: sampleImg,
        quad: {
          topLeft: { x: 40, y: 30 },
          topRight: { x: 816, y: 30 },
          bottomRight: { x: 816, y: 510 },
          bottomLeft: { x: 40, y: 510 },
        },
        rotation: 0,
        filter: 'photocopy',
        brightness: 0,
        contrast: 15,
        threshold: 128,
        createdAt: Date.now() - 3600000,
      },
    ],
  };
}
