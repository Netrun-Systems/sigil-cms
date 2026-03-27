/**
 * KAMERA API Client — communicates with the KAMERA OSINT research pipeline.
 *
 * Endpoints proxy through the CMS plugin so scan data can be embedded
 * directly into CMS pages without exposing the internal Survai API.
 */

const SURVAI_API = process.env.SURVAI_API_URL || 'http://localhost:8000';
const SURVAI_TOKEN = process.env.SURVAI_API_TOKEN;

export interface SurvaiScan {
  id: string;
  status: string;
  filename: string;
  fileSize: number;
  detectionCount: number;
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
}

export interface Detection {
  id: string;
  type: string;
  confidence: number;
  position: { x: number; y: number; z: number };
  label: string;
}

class SurvaiApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string,
  ) {
    super(message);
    this.name = 'SurvaiApiError';
  }
}

/**
 * Make an authenticated request to the Survai API.
 */
export async function survaiRequest(
  path: string,
  options?: RequestInit,
): Promise<Response> {
  const url = `${SURVAI_API}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (SURVAI_TOKEN) {
    headers['Authorization'] = `Bearer ${SURVAI_TOKEN}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new SurvaiApiError(
      `Survai API error: ${response.status} ${response.statusText}`,
      response.status,
      body,
    );
  }

  return response;
}

/**
 * List all scans, optionally filtered by project.
 */
export async function listScans(projectId?: string): Promise<SurvaiScan[]> {
  const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
  const response = await survaiRequest(`/api/scans${query}`);
  const data = await response.json();
  return data.scans ?? data;
}

/**
 * Get a single scan by ID.
 */
export async function getScan(scanId: string): Promise<SurvaiScan> {
  const response = await survaiRequest(`/api/scans/${encodeURIComponent(scanId)}`);
  const data = await response.json();
  return data.scan ?? data;
}

/**
 * Get detections (MEP objects) identified in a scan.
 */
export async function getScanDetections(scanId: string): Promise<Detection[]> {
  const response = await survaiRequest(
    `/api/scans/${encodeURIComponent(scanId)}/detections`,
  );
  const data = await response.json();
  return data.detections ?? data;
}

/**
 * Trigger report generation for a scan in a given format.
 */
export async function generateReport(
  scanId: string,
  format: 'json' | 'csv' | 'geojson',
): Promise<{ downloadUrl: string }> {
  const response = await survaiRequest(
    `/api/scans/${encodeURIComponent(scanId)}/report`,
    {
      method: 'POST',
      body: JSON.stringify({ format }),
    },
  );
  return response.json();
}

/**
 * Download an exported report as a raw buffer.
 */
export async function getExport(
  scanId: string,
  format: string,
): Promise<Buffer> {
  const response = await survaiRequest(
    `/api/scans/${encodeURIComponent(scanId)}/export/${encodeURIComponent(format)}`,
  );
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
