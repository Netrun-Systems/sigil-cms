/**
 * Photo API client — upload, curate, list, manage photos.
 *
 * Backported from frost. Site-scoped photo management via Azure Blob Storage.
 */
const API_BASE = '/api/v1';
function getAuthHeaders() {
    const token = localStorage.getItem('netrun_cms_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}
// ── Upload ───────────────────────────────────────
export async function uploadPhotos(siteId, files) {
    const form = new FormData();
    for (const file of files) {
        form.append('photos', file);
    }
    const res = await fetch(`${API_BASE}/sites/${siteId}/photos/upload`, {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: form,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(body.error?.message || 'Upload failed');
    }
    const { data } = await res.json();
    return data;
}
// ── AI Curation ──────────────────────────────────
export async function curatePhotos(siteId, photoIds) {
    const res = await fetch(`${API_BASE}/sites/${siteId}/photos/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ photoIds }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(body.error?.message || 'Curation failed');
    }
    const { data } = await res.json();
    return data;
}
// ── List ─────────────────────────────────────────
export async function listPhotos(siteId) {
    const res = await fetch(`${API_BASE}/sites/${siteId}/photos`, {
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok)
        throw new Error('Failed to list photos');
    const { data } = await res.json();
    return data;
}
// ── Update selection ─────────────────────────────
export async function updatePhotoSelection(siteId, id, selected) {
    const res = await fetch(`${API_BASE}/sites/${siteId}/photos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ selected }),
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(body.error?.message || 'Update failed');
    }
    const { data } = await res.json();
    return data;
}
// ── Delete ───────────────────────────────────────
export async function deletePhoto(siteId, id) {
    const res = await fetch(`${API_BASE}/sites/${siteId}/photos/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new Error(body.error?.message || 'Delete failed');
    }
}
//# sourceMappingURL=photos.js.map