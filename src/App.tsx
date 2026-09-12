import React, { useState, useEffect } from 'react';
import { ScannedDocument, DocumentType, Quad, FilterMode } from './types';
import { getSavedDocuments, saveDocuments, upsertDocument, deleteDocument } from './utils/storage';
import { getInitialSampleDocument } from './utils/sampleData';
import { downloadDocumentPDF } from './utils/pdfGenerator';
import { AndroidFrame } from './components/AndroidFrame';
import { DocumentList } from './components/DocumentList';
import { CameraViewfinder } from './components/CameraViewfinder';
import { CropAdjuster } from './components/CropAdjuster';
import { FilterEditor } from './components/FilterEditor';
import { DualSideIdModal } from './components/DualSideIdModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AndroidBuildModal } from './components/AndroidBuildModal';
import { ShareSheetModal } from './components/ShareSheetModal';

type AppView = 'list' | 'camera' | 'crop' | 'filter' | 'view_doc';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme_pref') !== 'light';
  });

  const [documents, setDocuments] = useState<ScannedDocument[]>([]);
  const [currentView, setCurrentView] = useState<AppView>('list');

  // Active scan pipeline state
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [capturedDocType, setCapturedDocType] = useState<DocumentType>('id_card');
  const [warpedImageUrl, setWarpedImageUrl] = useState<string | null>(null);
  const [savedQuad, setSavedQuad] = useState<Quad | undefined>(undefined);
  const [activeRotation, setActiveRotation] = useState<number>(0);

  // Selected document for details
  const [selectedDoc, setSelectedDoc] = useState<ScannedDocument | null>(null);

  // Modals
  const [isDualSideOpen, setIsDualSideOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isBuildGuideOpen, setIsBuildGuideOpen] = useState(false);
  const [shareModalState, setShareModalState] = useState<{
    isOpen: boolean;
    doc?: ScannedDocument | null;
    imageUrl?: string | null;
  }>({ isOpen: false });

  // Initialize documents
  useEffect(() => {
    const existing = getSavedDocuments();
    if (existing && existing.length > 0) {
      setDocuments(existing);
    } else {
      const sample = getInitialSampleDocument();
      setDocuments([sample]);
      saveDocuments([sample]);
    }
  }, []);

  // Theme toggle
  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme_pref', next ? 'dark' : 'light');
      return next;
    });
  };

  // 1. Camera Capture Handler
  const handleCapture = (imageDataUrl: string, docType: DocumentType) => {
    setCapturedImageUrl(imageDataUrl);
    setCapturedDocType(docType);
    setCurrentView('crop');
  };

  // 2. Crop Confirmation Handler
  const handleConfirmCrop = (croppedDataUrl: string, quad: Quad, rotation: number) => {
    setWarpedImageUrl(croppedDataUrl);
    setSavedQuad(quad);
    setActiveRotation(rotation);
    setCurrentView('filter');
  };

  // 3. Save Processed Document to Collection
  const handleSaveProcessed = (
    finalDataUrl: string,
    settings: { filter: FilterMode; brightness: number; contrast: number; threshold: number }
  ) => {
    const now = Date.now();
    const typeTitle =
      capturedDocType === 'id_card'
        ? 'کارت ملی و شناسایی'
        : capturedDocType === 'document_a4'
        ? 'سند A4 رسمی'
        : capturedDocType === 'passport'
        ? 'شناسنامه / گذرنامه'
        : 'فیش و رسید';

    const newDoc: ScannedDocument = {
      id: 'doc_' + now,
      title: `${typeTitle} ${documents.length + 1}`,
      type: capturedDocType,
      createdAt: now,
      updatedAt: now,
      pages: [
        {
          id: 'page_' + now,
          originalDataUrl: capturedImageUrl || finalDataUrl,
          processedDataUrl: finalDataUrl,
          quad: savedQuad || {
            topLeft: { x: 0, y: 0 },
            topRight: { x: 800, y: 0 },
            bottomRight: { x: 800, y: 600 },
            bottomLeft: { x: 0, y: 600 },
          },
          rotation: activeRotation,
          filter: settings.filter,
          brightness: settings.brightness,
          contrast: settings.contrast,
          threshold: settings.threshold,
          createdAt: now,
        },
      ],
    };

    const updated = upsertDocument(newDoc);
    setDocuments(updated);
    setCurrentView('list');
    setSelectedDoc(null);
  };

  // Save dual-side combined A4 directly to vault
  const handleSaveDualSideToVault = (combinedDataUrl: string) => {
    const now = Date.now();
    const newDoc: ScannedDocument = {
      id: 'doc_dualside_' + now,
      title: `فتوکپی کارت ملی دوطرفه A4 ${documents.length + 1}`,
      type: 'id_card',
      createdAt: now,
      updatedAt: now,
      pages: [
        {
          id: 'page_dual_' + now,
          originalDataUrl: combinedDataUrl,
          processedDataUrl: combinedDataUrl,
          quad: {
            topLeft: { x: 0, y: 0 },
            topRight: { x: 1240, y: 0 },
            bottomRight: { x: 1240, y: 1754 },
            bottomLeft: { x: 0, y: 1754 },
          },
          rotation: 0,
          filter: 'photocopy',
          brightness: 0,
          contrast: 10,
          threshold: 135,
          createdAt: now,
        },
      ],
    };

    const updated = upsertDocument(newDoc);
    setDocuments(updated);
  };

  // Delete document
  const handleDeleteDoc = (docId: string) => {
    const updated = deleteDocument(docId);
    setDocuments(updated);
    if (selectedDoc?.id === docId) {
      setSelectedDoc(null);
      setCurrentView('list');
    }
  };

  // Toggle favorite
  const handleToggleFavorite = (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return;
    const updatedDoc = { ...doc, isFavorite: !doc.isFavorite };
    const updatedList = upsertDocument(updatedDoc);
    setDocuments(updatedList);
  };

  // Open single document view
  const handleOpenDoc = (doc: ScannedDocument) => {
    setSelectedDoc(doc);
    setWarpedImageUrl(doc.pages[0]?.processedDataUrl || doc.pages[0]?.originalDataUrl);
    setCapturedDocType(doc.type);
    setCurrentView('view_doc');
  };

  // Android back button trigger
  const handleAndroidBack = () => {
    if (shareModalState.isOpen) {
      setShareModalState({ isOpen: false });
      return;
    }
    if (isDualSideOpen) {
      setIsDualSideOpen(false);
      return;
    }
    if (isCloudSyncOpen) {
      setIsCloudSyncOpen(false);
      return;
    }
    if (isBuildGuideOpen) {
      setIsBuildGuideOpen(false);
      return;
    }

    if (currentView === 'filter') {
      setCurrentView('crop');
    } else if (currentView === 'crop') {
      setCurrentView('camera');
    } else if (currentView === 'camera' || currentView === 'view_doc') {
      setCurrentView('list');
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''} dir="rtl">
      <AndroidFrame
        isDarkMode={isDarkMode}
        onAndroidBack={handleAndroidBack}
        title="فتوکپی پلاس"
      >
        {/* VIEW 1: Main Document Archive List */}
        {currentView === 'list' && (
          <DocumentList
            documents={documents}
            onOpenDoc={handleOpenDoc}
            onDeleteDoc={handleDeleteDoc}
            onToggleFavorite={handleToggleFavorite}
            onNewScan={() => setCurrentView('camera')}
            onOpenDualSide={() => setIsDualSideOpen(true)}
            onOpenCloudSync={() => setIsCloudSyncOpen(true)}
            onOpenBuildGuide={() => setIsBuildGuideOpen(true)}
            onShareDoc={(doc) => setShareModalState({ isOpen: true, doc })}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        )}

        {/* VIEW 2: Camera Capture / Gallery Viewfinder */}
        {currentView === 'camera' && (
          <CameraViewfinder
            onCapture={handleCapture}
            onCancel={() => setCurrentView('list')}
            onStartDualSide={() => {
              setCurrentView('list');
              setIsDualSideOpen(true);
            }}
          />
        )}

        {/* VIEW 3: Crop and Perspective Corner Adjuster */}
        {currentView === 'crop' && capturedImageUrl && (
          <CropAdjuster
            imageDataUrl={capturedImageUrl}
            initialQuad={savedQuad}
            onConfirmCrop={handleConfirmCrop}
            onCancel={() => setCurrentView('camera')}
          />
        )}

        {/* VIEW 4: Photocopy Filters and Processing Editor */}
        {(currentView === 'filter' || currentView === 'view_doc') && warpedImageUrl && (
          <FilterEditor
            warpedImageDataUrl={warpedImageUrl}
            initialFilter={selectedDoc?.pages[0]?.filter || 'photocopy'}
            onSave={handleSaveProcessed}
            onReCrop={() => setCurrentView('crop')}
            onShare={(dataUrl) => setShareModalState({ isOpen: true, imageUrl: dataUrl, doc: selectedDoc })}
            onDownloadPdf={async (dataUrl) => {
              if (selectedDoc) {
                await downloadDocumentPDF(selectedDoc);
              } else {
                setShareModalState({ isOpen: true, imageUrl: dataUrl });
              }
            }}
          />
        )}

        {/* MODAL 1: Dual-Side ID Card on A4 Photocopy */}
        <DualSideIdModal
          isOpen={isDualSideOpen}
          onClose={() => setIsDualSideOpen(false)}
          onSaveToVault={handleSaveDualSideToVault}
          onDownloadPdf={async (combinedDataUrl) => {
            handleSaveDualSideToVault(combinedDataUrl);
            const tempDoc: ScannedDocument = {
              id: 'temp_dual',
              title: 'فتوکپی_کارت_ملی_دوطرفه',
              type: 'id_card',
              createdAt: Date.now(),
              updatedAt: Date.now(),
              pages: [
                {
                  id: 'p1',
                  originalDataUrl: combinedDataUrl,
                  processedDataUrl: combinedDataUrl,
                  quad: {
                    topLeft: { x: 0, y: 0 },
                    topRight: { x: 1240, y: 0 },
                    bottomRight: { x: 1240, y: 1754 },
                    bottomLeft: { x: 0, y: 1754 },
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
            await downloadDocumentPDF(tempDoc);
          }}
          onShare={(combinedDataUrl) => {
            setShareModalState({ isOpen: true, imageUrl: combinedDataUrl });
          }}
        />

        {/* MODAL 2: Cloud Sync and Encrypted Vault Backup */}
        <CloudSyncModal
          isOpen={isCloudSyncOpen}
          onClose={() => setIsCloudSyncOpen(false)}
          totalDocsCount={documents.length}
          onSyncComplete={() => {
            setDocuments(getSavedDocuments());
          }}
        />

        {/* MODAL 3: Android 14 (API Level 34) Bazaar and Myket Guide */}
        <AndroidBuildModal
          isOpen={isBuildGuideOpen}
          onClose={() => setIsBuildGuideOpen(false)}
        />

        {/* MODAL 4: Social Share & PDF Export Modal */}
        <ShareSheetModal
          isOpen={shareModalState.isOpen}
          onClose={() => setShareModalState({ isOpen: false })}
          document={shareModalState.doc}
          imageDataUrl={shareModalState.imageUrl}
        />
      </AndroidFrame>
    </div>
  );
}
