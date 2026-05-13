import { getStoredRefreshToken, useAuthStore } from '../stores/auth-store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export interface BaseResponse<T> {
    data: T;
    message: string;
}

export interface LoginResponse {
    token_type: string;
    access_token: string;
    refresh_token: string;
}

export interface MeResponse {
    id: string;
    email: string;
}

export interface RegisterResponse {
    userId: string;
}

export interface AlbumSummaryResponse {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    year: number | null;
    isActive: boolean;
    totalCards: number;
}

export type AlbumDetailResponse = AlbumSummaryResponse & {
    sections: AlbumSectionResponse[];
};

export interface AlbumSectionResponse {
    id: string;
    albumId: string;
    name: string;
    orderIndex: number;
    cards: CardResponse[];
}

export interface CardResponse {
    id: string;
    sectionId: string;
    code: string;
    name: string;
    orderIndex: number;
    imageUrl: string | null;
}

export interface UserCardResponse {
    card: CardResponse;
    quantity: number;
    isMissing: boolean;
    isTradable: boolean;
    tradableCopies: number;
}

export interface UserCollectionSummaryResponse {
    id: string;
    album: AlbumSummaryResponse;
    createdAt: string;
    ownedCards: number;
    missingCards: number;
    tradableCards: number;
    completionPercentage: number;
}

export type UserCollectionDetailResponse = UserCollectionSummaryResponse & {
    cards: UserCardResponse[];
};

export class ApiError extends Error {
    status: number;
    details: unknown;

    constructor(message: string, status: number, details?: unknown) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.details = details;
    }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
    body?: unknown;
    auth?: boolean;
    retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<LoginResponse> | null = null;

function buildUrl(path: string) {
    if (path.startsWith('http')) {
        return path;
    }

    return `${API_BASE_URL}${path}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
        const fallbackMessage = response.statusText || 'Request failed';
        const responseMessage =
            typeof payload === 'object' && payload && 'message' in payload && typeof payload.message === 'string'
                ? payload.message
                : fallbackMessage;

        throw new ApiError(responseMessage, response.status, payload);
    }

    return payload as T;
}

async function refreshSession() {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
        useAuthStore.getState().clearSession();
        throw new ApiError('Your session has expired. Please log in again.', 401);
    }

    refreshPromise ??= rawRequest<LoginResponse>('/auth/refresh', {
        method: 'POST',
        body: { refresh_token: refreshToken },
    }).finally(() => {
        refreshPromise = null;
    });

    try {
        const session = await refreshPromise;
        const user = await api.me(session.access_token);
        useAuthStore.getState().setSession({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            user,
        });

        return session.access_token;
    } catch (error) {
        useAuthStore.getState().clearSession();
        throw error;
    }
}

async function rawRequest<T>(path: string, options: RequestOptions = {}) {
    const { body, headers, ...init } = options;
    const requestHeaders = new Headers(headers);

    if (
        body !== undefined &&
        !(body instanceof FormData) &&
        !(body instanceof URLSearchParams) &&
        !requestHeaders.has('Content-Type')
    ) {
        requestHeaders.set('Content-Type', 'application/json');
    }

    const response = await fetch(buildUrl(path), {
        ...init,
        headers: requestHeaders,
        body:
            body instanceof FormData || body instanceof URLSearchParams
                ? body
                : body === undefined
                  ? undefined
                  : JSON.stringify(body),
    });

    return parseResponse<T>(response);
}

async function request<T>(path: string, options: RequestOptions = {}) {
    const { auth = true, retryOnUnauthorized = true, headers, ...init } = options;
    const requestHeaders = new Headers(headers);
    const accessToken = useAuthStore.getState().accessToken;

    if (auth && accessToken && !requestHeaders.has('Authorization')) {
        requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }

    try {
        return await rawRequest<T>(path, { ...init, headers: requestHeaders });
    } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || !auth || !retryOnUnauthorized) {
            throw error;
        }

        const refreshedAccessToken = await refreshSession();
        const retryHeaders = new Headers(headers);
        retryHeaders.set('Authorization', `Bearer ${refreshedAccessToken}`);

        return rawRequest<T>(path, { ...init, headers: retryHeaders });
    }
}

function unwrap<T>(response: BaseResponse<T>) {
    return response.data;
}

export const api = {
    async register(email: string, password: string) {
        const response = await request<BaseResponse<RegisterResponse>>('/auth/register', {
            method: 'POST',
            body: { email, password },
            auth: false,
        });

        return unwrap(response);
    },

    async login(email: string, password: string) {
        const body = new URLSearchParams({ username: email, password });

        return request<LoginResponse>('/auth/login', {
            method: 'POST',
            body,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            auth: false,
        });
    },

    async restoreSession() {
        const accessToken = await refreshSession();
        return accessToken;
    },

    async me(accessToken?: string) {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
        const response = await request<BaseResponse<MeResponse>>('/users/me', { headers });

        return unwrap(response);
    },

    async listAlbums() {
        const response = await request<BaseResponse<AlbumSummaryResponse[]>>('/albums/', { auth: false });

        return unwrap(response);
    },

    async getAlbum(albumId: string) {
        const response = await request<BaseResponse<AlbumDetailResponse>>(`/albums/${albumId}`, { auth: false });

        return unwrap(response);
    },

    async listCollections() {
        const response = await request<BaseResponse<UserCollectionSummaryResponse[]>>('/collections/');

        return unwrap(response);
    },

    async subscribeToAlbum(albumId: string) {
        const response = await request<BaseResponse<UserCollectionSummaryResponse>>('/collections/', {
            method: 'POST',
            body: { albumId },
        });

        return unwrap(response);
    },

    async unsubscribe(collectionId: string) {
        const response = await request<BaseResponse<boolean>>(`/collections/${collectionId}`, { method: 'DELETE' });

        return unwrap(response);
    },

    async getCollection(collectionId: string) {
        const response = await request<BaseResponse<UserCollectionDetailResponse>>(`/collections/${collectionId}`);

        return unwrap(response);
    },

    async getMissingCards(collectionId: string) {
        const response = await request<BaseResponse<UserCardResponse[]>>(`/collections/${collectionId}/missing-cards`);

        return unwrap(response);
    },

    async getTradableCards(collectionId: string) {
        const response = await request<BaseResponse<UserCardResponse[]>>(`/collections/${collectionId}/tradable-cards`);

        return unwrap(response);
    },

    async setCardQuantity(collectionId: string, cardId: string, quantity: number) {
        const response = await request<BaseResponse<UserCardResponse>>(`/collections/${collectionId}/cards/${cardId}`, {
            method: 'PUT',
            body: { quantity },
        });

        return unwrap(response);
    },

    async adjustCardQuantity(collectionId: string, cardId: string, delta: number) {
        const response = await request<BaseResponse<UserCardResponse>>(`/collections/${collectionId}/cards/${cardId}`, {
            method: 'PATCH',
            body: { delta },
        });

        return unwrap(response);
    },
};
