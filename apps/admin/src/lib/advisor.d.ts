/**
 * Advisor API client — streaming chat, document management, TTS.
 */
export declare function streamChat(message: string, sessionId: string, documentIds?: string[]): AsyncGenerator<string>;
export interface DocumentInfo {
    name: string;
    displayName: string;
    mimeType: string;
    uri: string;
    state: string;
    sizeBytes?: string;
}
export declare function uploadDocument(file: File, sessionId: string): Promise<DocumentInfo>;
export declare function listDocuments(sessionId: string): Promise<DocumentInfo[]>;
export declare function deleteDocument(fileId: string, sessionId: string): Promise<void>;
export declare function generateSpeech(text: string): Promise<Blob>;
//# sourceMappingURL=advisor.d.ts.map