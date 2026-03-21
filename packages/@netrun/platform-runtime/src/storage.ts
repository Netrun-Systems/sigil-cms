/**
 * Storage Abstraction Layer
 *
 * Provides a unified interface for object storage across:
 * - Google Cloud Storage (default for headless GCloud deployments)
 * - AWS S3 / S3-compatible (MinIO, DigitalOcean Spaces, etc.)
 * - Azure Blob Storage
 *
 * Provider is selected via STORAGE_PROVIDER env var.
 * Falls back to GCS -> Azure -> S3 based on which credentials are present.
 */

import crypto from 'crypto';
import path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface StorageConfig {
  /** 'gcs' | 'azure' | 's3' — auto-detected from env if not set */
  provider?: 'gcs' | 'azure' | 's3';
  /** Bucket/container name */
  bucket?: string;
}

export interface UploadResult {
  /** Generated unique ID */
  id: string;
  /** Stored filename (id + extension) */
  storedName: string;
  /** Public URL to the file */
  url: string;
}

export interface StorageProvider {
  /** Ensure the bucket/container exists */
  ensureBucket(): Promise<void>;
  /** Upload a file buffer, returns URL */
  upload(buffer: Buffer, storedName: string, mimeType: string): Promise<string>;
  /** Delete a file by stored name */
  delete(storedName: string): Promise<void>;
  /** Download a file to buffer */
  download(storedName: string): Promise<Buffer>;
  /** Get the provider name */
  readonly name: string;
}

// ============================================================================
// AUTO-DETECT PROVIDER
// ============================================================================

function detectProvider(): 'gcs' | 'azure' | 's3' {
  const explicit = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (explicit === 'gcs' || explicit === 'google') return 'gcs';
  if (explicit === 'azure' || explicit === 'blob') return 'azure';
  if (explicit === 's3' || explicit === 'aws') return 's3';

  // Auto-detect from credentials present in env
  if (process.env.GCS_BUCKET || process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCS_PROJECT_ID) return 'gcs';
  if (process.env.AZURE_STORAGE_CONNECTION_STRING) return 'azure';
  if (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ENDPOINT) return 's3';

  // Default to GCS for headless GCloud operation
  return 'gcs';
}

function getBucketName(): string {
  return process.env.STORAGE_BUCKET
    || process.env.GCS_BUCKET
    || process.env.PHOTOS_CONTAINER
    || process.env.S3_BUCKET
    || 'sigil-media';
}

// ============================================================================
// GOOGLE CLOUD STORAGE PROVIDER
// ============================================================================

function createGCSProvider(bucket: string): StorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _bucket: any = null;

  async function getBucket() {
    if (!_bucket) {
      // Dynamic import — @google-cloud/storage is an optional peer dep
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (Function('return import("@google-cloud/storage")')() as Promise<any>);
      const storage = new mod.Storage({
        projectId: process.env.GCS_PROJECT_ID || undefined,
      });
      _bucket = storage.bucket(bucket);
    }
    return _bucket;
  }

  return {
    name: 'gcs',

    async ensureBucket() {
      const b = await getBucket();
      const [exists] = await b.exists();
      if (!exists) {
        await b.create({
          location: process.env.GCS_LOCATION || 'us-central1',
          storageClass: 'STANDARD',
        });
        // Make bucket publicly readable for media serving
        await b.makePublic();
      }
    },

    async upload(buffer: Buffer, storedName: string, mimeType: string): Promise<string> {
      const b = await getBucket();
      const file = b.file(storedName);
      await file.save(buffer, {
        contentType: mimeType,
        resumable: false,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      // Verify upload (confirmed delivery)
      const [exists] = await file.exists();
      if (!exists) throw new Error(`Upload verification failed: ${storedName}`);
      return `https://storage.googleapis.com/${bucket}/${storedName}`;
    },

    async delete(storedName: string): Promise<void> {
      const b = await getBucket();
      try { await b.file(storedName).delete(); } catch { /* file may not exist */ }
    },

    async download(storedName: string): Promise<Buffer> {
      const b = await getBucket();
      const [contents] = await b.file(storedName).download();
      return contents;
    },
  };
}

// ============================================================================
// AZURE BLOB STORAGE PROVIDER
// ============================================================================

function createAzureProvider(container: string): StorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _client: any = null;

  async function getClient() {
    if (!_client) {
      const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
      if (!connStr) throw new Error('AZURE_STORAGE_CONNECTION_STRING is required for azure provider');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (Function('return import("@azure/storage-blob")')() as Promise<any>);
      const blobService = mod.BlobServiceClient.fromConnectionString(connStr);
      _client = blobService.getContainerClient(container);
    }
    return _client;
  }

  return {
    name: 'azure',

    async ensureBucket() {
      const client = await getClient();
      await client.createIfNotExists({ access: 'blob' });
    },

    async upload(buffer: Buffer, storedName: string, mimeType: string): Promise<string> {
      const client = await getClient();
      const blockBlob = client.getBlockBlobClient(storedName);
      await blockBlob.upload(buffer, buffer.length, {
        blobHTTPHeaders: { blobContentType: mimeType },
      });
      // Confirmed delivery
      await blockBlob.getProperties();
      return blockBlob.url;
    },

    async delete(storedName: string): Promise<void> {
      const client = await getClient();
      await client.getBlockBlobClient(storedName).deleteIfExists();
    },

    async download(storedName: string): Promise<Buffer> {
      const client = await getClient();
      return client.getBlockBlobClient(storedName).downloadToBuffer();
    },
  };
}

// ============================================================================
// AWS S3 / S3-COMPATIBLE PROVIDER
// ============================================================================

function createS3Provider(bucket: string): StorageProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _client: any = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _mod: any = null;

  async function getS3Mod() {
    if (!_mod) {
      _mod = await (Function('return import("@aws-sdk/client-s3")')() as Promise<any>);
    }
    return _mod;
  }

  async function getClient() {
    if (!_client) {
      const mod = await getS3Mod();
      const config: Record<string, unknown> = {
        region: process.env.AWS_REGION || process.env.S3_REGION || 'us-east-1',
      };
      if (process.env.S3_ENDPOINT) {
        config.endpoint = process.env.S3_ENDPOINT;
        config.forcePathStyle = true;
      }
      if (process.env.AWS_ACCESS_KEY_ID) {
        config.credentials = {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        };
      }
      _client = new mod.S3Client(config);
    }
    return _client;
  }

  return {
    name: 's3',

    async ensureBucket() {
      const client = await getClient();
      const mod = await getS3Mod();
      try {
        await client.send(new mod.HeadBucketCommand({ Bucket: bucket }));
      } catch {
        await client.send(new mod.CreateBucketCommand({ Bucket: bucket }));
      }
    },

    async upload(buffer: Buffer, storedName: string, mimeType: string): Promise<string> {
      const client = await getClient();
      const mod = await getS3Mod();
      await client.send(new mod.PutObjectCommand({
        Bucket: bucket,
        Key: storedName,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }));
      // Confirmed delivery
      await client.send(new mod.HeadObjectCommand({ Bucket: bucket, Key: storedName }));

      const endpoint = process.env.S3_ENDPOINT || `https://s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
      return `${endpoint}/${bucket}/${storedName}`;
    },

    async delete(storedName: string): Promise<void> {
      const client = await getClient();
      const mod = await getS3Mod();
      try { await client.send(new mod.DeleteObjectCommand({ Bucket: bucket, Key: storedName })); } catch { /* ok */ }
    },

    async download(storedName: string): Promise<Buffer> {
      const client = await getClient();
      const mod = await getS3Mod();
      const response = await client.send(new mod.GetObjectCommand({ Bucket: bucket, Key: storedName }));
      const chunks: Buffer[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const chunk of response.Body as any) {
        chunks.push(Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    },
  };
}

// ============================================================================
// FACTORY
// ============================================================================

let _provider: StorageProvider | null = null;

/**
 * Get the configured storage provider (singleton).
 * Auto-detects from env vars, defaults to GCS.
 */
export function getStorageProvider(config?: StorageConfig): StorageProvider {
  if (_provider) return _provider;

  const providerType = config?.provider || detectProvider();
  const bucket = config?.bucket || getBucketName();

  switch (providerType) {
    case 'gcs':
      _provider = createGCSProvider(bucket);
      break;
    case 'azure':
      _provider = createAzureProvider(bucket);
      break;
    case 's3':
      _provider = createS3Provider(bucket);
      break;
    default:
      _provider = createGCSProvider(bucket);
  }

  return _provider;
}

/**
 * Reset the storage provider singleton (for testing).
 */
export function resetStorageProvider(): void {
  _provider = null;
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
  'image/avif': '.avif',
  'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'audio/mpeg': '.mp3',
};

/**
 * Upload a file with auto-generated ID and stored name.
 */
export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  config?: StorageConfig,
): Promise<UploadResult> {
  const provider = getStorageProvider(config);
  const id = crypto.randomUUID();
  const ext = path.extname(originalName) || MIME_EXTENSIONS[mimeType] || '.bin';
  const storedName = `${id}${ext}`;

  const url = await provider.upload(buffer, storedName, mimeType);
  return { id, storedName, url };
}

/**
 * Delete a file by stored name.
 */
export async function deleteFile(storedName: string, config?: StorageConfig): Promise<void> {
  const provider = getStorageProvider(config);
  await provider.delete(storedName);
}

/**
 * Download a file to buffer.
 */
export async function downloadFile(storedName: string, config?: StorageConfig): Promise<Buffer> {
  const provider = getStorageProvider(config);
  return provider.download(storedName);
}

/**
 * Ensure the storage bucket exists.
 */
export async function ensureStorage(config?: StorageConfig): Promise<void> {
  const provider = getStorageProvider(config);
  await provider.ensureBucket();
}
