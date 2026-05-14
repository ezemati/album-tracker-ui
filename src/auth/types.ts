export interface MeResponse {
    id: string;
    email: string;
}

export type AuthStatus = 'Checking' | 'Authenticated' | 'Anonymous';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: MeResponse;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export interface RefreshRequest {
    refresh_token: string;
}

export interface RefreshResponse {
    access_token: string;
    refresh_token: string;
    user: MeResponse;
}
