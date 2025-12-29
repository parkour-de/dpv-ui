export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8070/dpv';

export interface ApiErrorData {
    message?: string;
    [key: string]: unknown;
}

export class ApiError extends Error {
    public status: number;
    public statusText: string;
    public data?: ApiErrorData;

    constructor(status: number, statusText: string, data?: ApiErrorData) {
        super(`API Error ${status}: ${statusText}`);
        this.status = status;
        this.statusText = statusText;
        this.data = data;
    }
}

const getHeaders = (token?: string) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Basic ${token}`;
    }
    return headers;
};

export const api = {
    get: async <T>(endpoint: string, token?: string): Promise<T> => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'GET',
            headers: getHeaders(token),
        });
        if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
        return res.json();
    },

    post: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
        return res.json();
    },

    patch: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(token),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
        return res.json();
    },

    delete: async (endpoint: string, token?: string): Promise<void> => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders(token),
        });
        if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
    },

    upload: async <T>(endpoint: string, formData: FormData, token?: string): Promise<T> => {
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Basic ${token}`;
        }
        // Note: Content-Type is set automatically by fetch when body is FormData
        const res = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers,
            body: formData
        });
        if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
        return res.json();
    }
};
