import type { AlbumSummaryResponse, CardResponse } from './albumClient';
import { type BaseResponse, unwrap } from './base';
import { api } from './http';

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

export const collectionClient = {
    async listCollections() {
        const response = await api.get<BaseResponse<UserCollectionSummaryResponse[]>>('/collections/');
        return unwrap(response.data);
    },
    async subscribeToAlbum(albumId: string) {
        const response = await api.post<BaseResponse<UserCollectionSummaryResponse>>('/collections/', { albumId });
        return unwrap(response.data);
    },
    async unsubscribe(collectionId: string) {
        const response = await api.delete<BaseResponse<boolean>>(`/collections/${collectionId}`);
        return unwrap(response.data);
    },
    async getCollection(collectionId: string) {
        const response = await api.get<BaseResponse<UserCollectionDetailResponse>>(`/collections/${collectionId}`);
        return unwrap(response.data);
    },
    async getMissingCards(collectionId: string) {
        const response = await api.get<BaseResponse<UserCardResponse[]>>(`/collections/${collectionId}/missing-cards`);
        return unwrap(response.data);
    },
    async getTradableCards(collectionId: string) {
        const response = await api.get<BaseResponse<UserCardResponse[]>>(`/collections/${collectionId}/tradable-cards`);
        return unwrap(response.data);
    },
    async setCardQuantity(collectionId: string, cardId: string, quantity: number) {
        const response = await api.put<BaseResponse<UserCardResponse>>(`/collections/${collectionId}/cards/${cardId}`, {
            quantity,
        });
        return unwrap(response.data);
    },
    async adjustCardQuantity(collectionId: string, cardId: string, delta: number) {
        const response = await api.patch<BaseResponse<UserCardResponse>>(
            `/collections/${collectionId}/cards/${cardId}`,
            { delta },
        );
        return unwrap(response.data);
    },
};
