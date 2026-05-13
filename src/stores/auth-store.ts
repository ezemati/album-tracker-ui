import { create } from 'zustand';

import type { MeResponse } from '../lib/api';

const REFRESH_TOKEN_STORAGE_KEY = 'album-tracker.refreshToken';

export function getStoredRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function setStoredRefreshToken(refreshToken: string) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

function clearStoredRefreshToken() {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

interface SessionPayload {
    accessToken: string;
    user: MeResponse;
    refreshToken?: string;
}

interface AuthState {
    accessToken: string | null;
    user: MeResponse | null;
    hasHydrated: boolean;
    isAuthenticated: boolean;
    setSession: (session: SessionPayload) => void;
    setAccessToken: (accessToken: string) => void;
    clearSession: () => void;
    markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    hasHydrated: false,
    isAuthenticated: false,
    setSession: ({ accessToken, user, refreshToken }) => {
        if (refreshToken) {
            setStoredRefreshToken(refreshToken);
        }

        set({ accessToken, user, isAuthenticated: true, hasHydrated: true });
    },
    setAccessToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
    clearSession: () => {
        clearStoredRefreshToken();
        set({ accessToken: null, user: null, isAuthenticated: false, hasHydrated: true });
    },
    markHydrated: () => set({ hasHydrated: true }),
}));
