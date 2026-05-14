const REFRESH_TOKEN_STORAGE_KEY = 'album-tracker.refreshToken';

export const refreshTokenStorage = {
    get: () => localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
    set: (refreshToken: string) => {
        localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    },
    clear: () => {
        localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    },
};
