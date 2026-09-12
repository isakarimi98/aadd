export interface Point {
  x: number;
  y: number;
}

export interface Quad {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

export type FilterMode = 'photocopy' | 'grayscale' | 'magic' | 'high_contrast' | 'original' | 'invert';

export type DocumentType = 'id_card' | 'passport' | 'document_a4' | 'receipt';

export interface ScannedPage {
  id: string;
  originalDataUrl: string;
  processedDataUrl: string;
  quad: Quad;
  rotation: number; // 0, 90, 180, 270
  filter: FilterMode;
  brightness: number; // -50 to 50
  contrast: number;   // -50 to 50
  threshold: number;  // 50 to 200
  createdAt: number;
}

export interface ScannedDocument {
  id: string;
  title: string;
  type: DocumentType;
  pages: ScannedPage[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface CloudSyncSettings {
  lastSyncTime?: number;
  syncToken?: string;
  autoSync: boolean;
  provider: 'local_backup' | 'cloud_vault';
}
