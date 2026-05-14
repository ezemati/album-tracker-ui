import axios, { AxiosError, HttpStatusCode } from 'axios';

import { useAuthStore } from '#/auth/store';
import { router } from '#/router';

import type { RetriableAxiosRequestConfig } from './axios.types';
import { config } from './config';

/**
 * Axios Client for authenticated requests (i.e. non-auth related)
 */
export const api = axios.create({
    baseURL: config.VITE_API_BASE_URL,
});

interface RouterInvalidator {
    invalidate: () => Promise<void>;
}

let routerInvalidationPromise: Promise<void> | null = null;

async function invalidateRouterOnce(router: RouterInvalidator): Promise<void> {
    routerInvalidationPromise ??= router.invalidate().finally(() => {
        routerInvalidationPromise = null;
    });
    return routerInvalidationPromise;
}

api.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) {
        config.headers.set('Authorization', `Bearer ${accessToken}`);
    }
    return config;
});

api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as RetriableAxiosRequestConfig | undefined;
        if (!originalRequest) {
            return Promise.reject(error);
        }

        const isUnauthorized = error.response?.status === HttpStatusCode.Unauthorized;
        const hasAlreadyRetried = !!originalRequest._retry;
        if (!isUnauthorized || hasAlreadyRetried) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;
        const refreshedUser = await useAuthStore.getState().refreshFromStorage();
        await invalidateRouterOnce(router).catch(() => undefined);
        if (!refreshedUser) {
            return Promise.reject(error);
        }

        const newAccessToken = useAuthStore.getState().accessToken;
        if (newAccessToken) {
            originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
        }
        return api(originalRequest);
    },
);
