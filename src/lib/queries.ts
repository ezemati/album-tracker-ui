import { createQueryKeyStore } from '@lukemorales/query-key-factory';
import { albumClient } from './albumClient';
import { collectionClient } from './collectionClient';

export const queries = createQueryKeyStore({
    albums: {
        all: {
            queryKey: null,
            queryFn: () => albumClient.listAlbums(),
        },
        detail: (albumId: string) => ({
            queryKey: [albumId],
            queryFn: () => albumClient.getAlbum(albumId),
        }),
    },
    collections: {
        all: {
            queryKey: null,
            queryFn: () => collectionClient.listCollections(),
        },
        detail: (collectionId: string) => ({
            queryKey: [collectionId],
            queryFn: () => collectionClient.getCollection(collectionId),
            contextQueries: {
                missingCards: {
                    queryKey: 'missingCards',
                    queryFn: () => collectionClient.getMissingCards(collectionId),
                },
                tradableCards: {
                    queryKey: 'tradableCards',
                    queryFn: () => collectionClient.getTradableCards(collectionId),
                },
            },
        }),
    },
});
