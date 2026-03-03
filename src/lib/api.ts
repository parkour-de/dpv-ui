export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/dpv';

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

export const getErrorMessage = (err: unknown, t: (key: string) => string): string => {
    if (err instanceof ApiError) {
        if (err.status === 0) {
            return `${t('errors.network')}: ${err.data?.message || err.message}`;
        }
        return err.data?.message || err.message;
    }
    if (err instanceof Error) {
        return err.message;
    }
    return String(err);
};

const getHeaders = (token?: string) => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Basic ${token}`;
    }
    const lang = localStorage.getItem('dpv_language');
    if (lang) {
        headers['X-Language'] = lang;
    }
    return headers;
};

export const api = {
    get: async <T>(endpoint: string, token?: string): Promise<T> => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'GET',
                headers: getHeaders(token),
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    post: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: getHeaders(token),
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    patch: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PATCH',
                headers: getHeaders(token),
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    delete: async (endpoint: string, token?: string): Promise<void> => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'DELETE',
                headers: getHeaders(token),
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    upload: async <T>(endpoint: string, formData: FormData, token?: string): Promise<T> => {
        try {
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Basic ${token}`;
            }
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers,
                body: formData
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    put: async <T>(endpoint: string, body: unknown, token?: string): Promise<T> => {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PUT',
                headers: getHeaders(token),
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    },

    uploadPut: async <T>(endpoint: string, formData: FormData, token?: string): Promise<T> => {
        try {
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Basic ${token}`;
            }
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PUT',
                headers,
                body: formData
            });
            if (!res.ok) throw new ApiError(res.status, res.statusText, await res.json().catch(() => { }));
            return res.json();
        } catch (error) {
            if (error instanceof ApiError) throw error;
            throw new ApiError(0, 'Network Error', { message: error instanceof Error ? error.message : 'Unknown network error' });
        }
    }
};
