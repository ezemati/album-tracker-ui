export interface BaseResponse<T> {
    data: T;
    message: string;
}

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

export function unwrap<T>(response: BaseResponse<T>) {
    return response.data;
}
