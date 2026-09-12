import { jsPDF } from 'jspdf';
import { ScannedDocument } from '../types';

export interface PDFExportOptions {
  pageSize?: 'a4' | 'fit';
  quality?: number; // 0.7 to 1.0
  addPageNumbers?: boolean;
  docTitle?: string;
}

/**
 * Generates an offline PDF document from scanned pages
 */
export async function generateDocumentPDF(
  doc: ScannedDocument,
  options: PDFExportOptions = {}
): Promise<{ blob: Blob; filename: string }> {
  const {
    pageSize = 'a4',
    quality = 0.92,
    addPageNumbers = true,
    docTitle = doc.title || 'سند_اسکن_شده',
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;

  const pages = doc.pages;
  if (!pages || pages.length === 0) {
    throw new Error('سندی برای تبدیل به پی‌دی‌اف یافت نشد.');
  }

  for (let i = 0; i < pages.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const page = pages[i];
    const imgData = page.processedDataUrl || page.originalDataUrl;

    // Determine dimensions by creating temporary Image
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.width / img.height;

        let renderW = printableWidth;
        let renderH = printableWidth / imgRatio;

        if (renderH > printableHeight) {
          renderH = printableHeight;
          renderW = printableHeight * imgRatio;
        }

        const posX = margin + (printableWidth - renderW) / 2;
        const posY = margin + (printableHeight - renderH) / 2;

        pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');

        if (addPageNumbers && pages.length > 1) {
          pdf.setFontSize(9);
          pdf.setTextColor(150, 150, 150);
          pdf.text(`صفحه ${i + 1} از ${pages.length}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
        }

        resolve();
      };
      img.onerror = () => reject(new Error('خطا در بارگذاری تصویر صفحه'));
      img.src = imgData;
    });
  }

  const cleanFilename = `${docTitle.replace(/[\s\\/:*?"<>|]/g, '_')}_${Date.now()}.pdf`;
  const blob = pdf.output('blob');

  return { blob, filename: cleanFilename };
}

/**
 * Triggers direct download of generated PDF
 */
export async function downloadDocumentPDF(doc: ScannedDocument, options?: PDFExportOptions): Promise<string> {
  const { blob, filename } = await generateDocumentPDF(doc, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return filename;
}
