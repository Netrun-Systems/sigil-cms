/**
 * Photo API client — upload, curate, list, manage photos.
 *
 * Backported from frost. Site-scoped photo management via Azure Blob Storage.
 */
export interface Photo {
    id: string;
    siteId: string;
    filename: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedAt: string;
    selected: boolean;
    blobUrl?: string;
    aiScore?: number;
    aiReason?: string;
    tags?: string[];
}
export interface CurationData {
    photos: Photo[];
    summary: string;
    totalAnalyzed: number;
    totalSelected: number;
}
export declare function uploadPhotos(siteId: string, files: File[]): Promise<Photo[]>;
export declare function curatePhotos(siteId: string, photoIds: string[]): Promise<CurationData>;
export declare function listPhotos(siteId: string): Promise<Photo[]>;
export declare function updatePhotoSelection(siteId: string, id: string, selected: boolean): Promise<Photo>;
export declare function deletePhoto(siteId: string, id: string): Promise<void>;
//# sourceMappingURL=photos.d.ts.map