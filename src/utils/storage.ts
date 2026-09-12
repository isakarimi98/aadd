import { ScannedDocument, CloudSyncSettings } from '../types';

const STORAGE_KEY = 'scanmaster_persian_docs_v1';
const SYNC_SETTINGS_KEY = 'scanmaster_cloud_settings_v1';

/**
 * Load all saved documents
 */
export function getSavedDocuments(): ScannedDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load documents from storage:', err);
    return [];
  }
}

/**
 * Save documents to local storage
 */
export function saveDocuments(docs: ScannedDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.error('Storage quota exceeded or error:', err);
  }
}

/**
 * Save or update a single document
 */
export function upsertDocument(doc: ScannedDocument): ScannedDocument[] {
  const docs = getSavedDocuments();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    docs[idx] = { ...doc, updatedAt: Date.now() };
  } else {
    docs.unshift({ ...doc, createdAt: Date.now(), updatedAt: Date.now() });
  }
  saveDocuments(docs);
  return docs;
}

/**
 * Delete a document by ID
 */
export function deleteDocument(docId: string): ScannedDocument[] {
  const docs = getSavedDocuments().filter((d) => d.id !== docId);
  saveDocuments(docs);
  return docs;
}

/**
 * Cloud Sync Settings
 */
export function getCloudSyncSettings(): CloudSyncSettings {
  try {
    const raw = localStorage.getItem(SYNC_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return {
    autoSync: false,
    provider: 'local_backup',
  };
}

export function saveCloudSyncSettings(settings: CloudSyncSettings): void {
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Export full backup for Cloud or local migration
 */
export function exportBackupData(): string {
  const docs = getSavedDocuments();
  const payload = {
    appName: 'فتوکپی پلاس - اسکنر مدارک',
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    documentsCount: docs.length,
    documents: docs,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import backup data with validation
 */
export function importBackupData(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.documents || !Array.isArray(parsed.documents)) {
      return { success: false, count: 0, error: 'فرمت فایل پشتیبان نامعتبر است.' };
    }

    const currentDocs = getSavedDocuments();
    const existingIds = new Set(currentDocs.map((d) => d.id));

    let importedCount = 0;
    const merged = [...currentDocs];

    for (const doc of parsed.documents) {
      if (doc && doc.id && doc.pages) {
        if (!existingIds.has(doc.id)) {
          merged.unshift(doc);
          existingIds.add(doc.id);
          importedCount++;
        }
      }
    }

    saveDocuments(merged);
    return { success: true, count: importedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'خطا در خواندن فایل' };
  }
}
