/**
 * Blog Admin API client — typed fetch wrapper for blog plugin routes.
 */

const BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(body.error?.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Posts
export const blogApi = {
  posts: {
    list: (siteId: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any>(`/sites/${siteId}/blog/posts${qs}`);
    },
    get: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}`),
    create: (siteId: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/posts`, { method: 'POST', body: JSON.stringify(data) }),
    update: (siteId: string, id: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}`, { method: 'DELETE' }),
    publish: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}/publish`, { method: 'POST' }),
    schedule: (siteId: string, id: string, scheduledAt: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduledAt }) }),
    featured: (siteId: string) =>
      request<any>(`/sites/${siteId}/blog/posts/featured`),
    revisions: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${id}/revisions`),
    revert: (siteId: string, postId: string, revId: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${postId}/revisions/${revId}/revert`, { method: 'POST' }),
  },

  categories: {
    list: (siteId: string) => request<any>(`/sites/${siteId}/blog/categories`),
    create: (siteId: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/categories`, { method: 'POST', body: JSON.stringify(data) }),
    update: (siteId: string, id: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/categories/${id}`, { method: 'DELETE' }),
  },

  tags: {
    list: (siteId: string) => request<any>(`/sites/${siteId}/blog/tags`),
    create: (siteId: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/tags`, { method: 'POST', body: JSON.stringify(data) }),
    delete: (siteId: string, id: string) =>
      request<any>(`/sites/${siteId}/blog/tags/${id}`, { method: 'DELETE' }),
  },

  authors: {
    list: (siteId: string) => request<any>(`/sites/${siteId}/blog/authors`),
    get: (siteId: string, id: string) => request<any>(`/sites/${siteId}/blog/authors/${id}`),
    update: (siteId: string, id: string, data: any) =>
      request<any>(`/sites/${siteId}/blog/authors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },

  comments: {
    list: (siteId: string, postId: string) =>
      request<any>(`/sites/${siteId}/blog/posts/${postId}/comments`),
    approve: (siteId: string, commentId: string) =>
      request<any>(`/sites/${siteId}/blog/comments/${commentId}/approve`, { method: 'PUT' }),
    delete: (siteId: string, commentId: string) =>
      request<any>(`/sites/${siteId}/blog/comments/${commentId}`, { method: 'DELETE' }),
  },

  ai: {
    generateExcerpt: (siteId: string, postId: string) =>
      request<any>(`/sites/${siteId}/blog/ai/posts/${postId}/generate-excerpt`, { method: 'POST' }),
    generateSeo: (siteId: string, postId: string) =>
      request<any>(`/sites/${siteId}/blog/ai/posts/${postId}/generate-seo`, { method: 'POST' }),
    generatePost: (siteId: string, data: { topic?: string; prompt?: string; tone?: string }) =>
      request<any>(`/sites/${siteId}/blog/ai/posts/generate`, { method: 'POST', body: JSON.stringify(data) }),
    suggestTags: (siteId: string, postId: string) =>
      request<any>(`/sites/${siteId}/blog/ai/posts/${postId}/suggest-tags`, { method: 'POST' }),
  },
};
