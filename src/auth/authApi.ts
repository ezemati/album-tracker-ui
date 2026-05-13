import { config } from '#/lib/config';
import axios from 'axios';
import type { LoginRequest, LoginResponse, RefreshRequest, RefreshResponse, RegisterRequest } from './types';

/**
 * Axios Client for auth requests (e.g. Login, Register or Refresh)
 */
export const authApi = axios.create({
    baseURL: config.VITE_API_BASE_URL,
});

export const authClient = {
    async register(request: RegisterRequest) {
        await authApi.post('/auth/register', request);
    },
    async login(request: LoginRequest) {
        const { data } = await authApi.postForm<LoginResponse>('/auth/login', request, {
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
        });
        return data;
    },
    async refresh(request: RefreshRequest) {
        const { data } = await authApi.post<RefreshResponse>('/auth/refresh', request);
        return data;
    },
};
