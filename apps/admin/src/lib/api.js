const API_BASE = '/api/v1';
class ApiError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}
async function request(path, options = {}) {
    const token = localStorage.getItem('netrun_cms_token');
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });
    if (res.status === 401) {
        localStorage.removeItem('netrun_cms_token');
        window.location.href = '/login';
        throw new ApiError(401, 'Unauthorized');
    }
    if (!res.ok) {
        const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
        throw new ApiError(res.status, body.error?.message || res.statusText);
    }
    return res.json();
}
export const api = {
    get: (path) => request(path),
    post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
    put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (path) => request(path, { method: 'DELETE' }),
};
export { ApiError };
//# sourceMappingURL=api.js.map