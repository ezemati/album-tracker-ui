import { create } from 'zustand';

import { authClient } from './authApi';
import { refreshTokenStorage } from './refreshTokenStorage';
import type { AuthStatus, LoginRequest, LoginResponse, MeResponse, RefreshResponse } from './types';

interface AuthState {
    accessToken: string | null;
    user: MeResponse | null;
    status: AuthStatus;

    isAuthenticated: () => boolean;
    initialize: () => Promise<MeResponse | null>;
    refreshFromStorage: () => Promise<MeResponse | null>;
    setAuthenticated: (response: LoginResponse | RefreshResponse) => MeResponse;
    login: (request: LoginRequest) => Promise<MeResponse>;
    logout: () => void;
}

let initializePromise: Promise<MeResponse | null> | null = null;
let refreshPromise: Promise<MeResponse | null> | null = null;

export const useAuthStore = create<AuthState>()((set, get) => ({
    accessToken: null,
    user: null,
    status: 'Checking',

    isAuthenticated: () => {
        const { accessToken, user } = get();
        return !!accessToken && !!user;
    },

    initialize: async () => {
        const hasInitialized = get().status !== 'Checking';
        if (hasInitialized) {
            return get().user;
        }

        if (initializePromise) {
            return initializePromise;
        }

        initializePromise = get()
            .refreshFromStorage()
            .finally(() => {
                initializePromise = null;
            });

        return initializePromise;
    },

    refreshFromStorage: async () => {
        if (refreshPromise) {
            return refreshPromise;
        }

        refreshPromise = (async () => {
            const refreshToken = refreshTokenStorage.get();
            if (!refreshToken) {
                get().logout();
                return null;
            }

            try {
                const response = await authClient.refresh({ refresh_token: refreshToken });
                return get().setAuthenticated(response);
            } catch {
                get().logout();
                return null;
            } finally {
                refreshPromise = null;
            }
        })();
        return refreshPromise;
    },

    login: async (request) => {
        const response = await authClient.login(request);
        return get().setAuthenticated(response);
    },

    logout: () => {
        refreshTokenStorage.clear();
        set({
            accessToken: null,
            user: null,
            status: 'Anonymous',
        });
    },

    setAuthenticated: (response) => {
        refreshTokenStorage.set(response.refresh_token);
        set({
            accessToken: response.access_token,
            user: response.user,
            status: 'Authenticated',
        });
        return response.user;
    },
}));
