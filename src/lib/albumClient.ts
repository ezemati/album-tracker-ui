import { type BaseResponse, unwrap } from './base';
import { api } from './http';

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

export const albumClient = {
    async listAlbums() {
        const response = await api.get<BaseResponse<AlbumSummaryResponse[]>>('/albums/');
        return unwrap(response.data);
    },
    async getAlbum(albumId: string) {
        const response = await api.get<BaseResponse<AlbumDetailResponse>>(`/albums/${albumId}`);
        return unwrap(response.data);
    },
};
