import type { InternalAxiosRequestConfig } from 'axios';

export type RetriableAxiosRequestConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
};
