import { useEffect, useState } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';

import { api } from '../lib/api';
import type { AlbumSummaryResponse, UserCollectionSummaryResponse } from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { useAuthStore } from '../stores/auth-store';

export const Route = createFileRoute('/albums')({ component: Albums });

function Albums() {
    const navigate = useNavigate();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const [albums, setAlbums] = useState<AlbumSummaryResponse[]>([]);
    const [collections, setCollections] = useState<UserCollectionSummaryResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [subscribingAlbumId, setSubscribingAlbumId] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        async function loadAlbums() {
            setIsLoading(true);
            setError(null);

            try {
                const [albumList, collectionList] = await Promise.all([
                    api.listAlbums(),
                    isAuthenticated ? api.listCollections() : Promise.resolve([]),
                ]);

                if (isActive) {
                    setAlbums(albumList);
                    setCollections(collectionList);
                }
            } catch (loadError) {
                if (isActive) {
                    setError(getErrorMessage(loadError));
                }
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        }

        if (hasHydrated) {
            void loadAlbums();
        }

        return () => {
            isActive = false;
        };
    }, [hasHydrated, isAuthenticated]);

    async function handleSubscribe(albumId: string) {
        if (!isAuthenticated) {
            await navigate({ to: '/login' });
            return;
        }

        setSubscribingAlbumId(albumId);
        setError(null);

        try {
            const collection = await api.subscribeToAlbum(albumId);
            setCollections((current) => [...current, collection]);
            await navigate({ to: '/collections/$collectionId', params: { collectionId: collection.id } });
        } catch (subscribeError) {
            setError(getErrorMessage(subscribeError));
        } finally {
            setSubscribingAlbumId(null);
        }
    }

    const subscribedAlbumIds = new Set(collections.map((collection) => collection.album.id));

    return (
        <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-amber-300">Available albums</p>
                    <h1 className="mt-3 text-4xl font-black text-white">Choose a collection to track</h1>
                </div>
                <Link to="/collections" className="text-sm font-bold text-amber-300 hover:text-amber-200">
                    View my collections
                </Link>
            </div>

            {error ? <p className="mt-6 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            {isLoading ? <p className="mt-8 text-slate-300">Loading albums...</p> : null}

            {!isLoading && albums.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-300">
                    No albums are available yet.
                </div>
            ) : null}

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {albums.map((album) => {
                    const isSubscribed = subscribedAlbumIds.has(album.id);

                    return (
                        <article
                            key={album.id}
                            className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black text-white">{album.name}</h2>
                                    <p className="mt-1 text-sm text-slate-400">
                                        {album.year ?? 'No year'} · {album.totalCards} cards
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                                    {album.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                            <p className="mt-4 min-h-12 text-sm leading-6 text-slate-300">
                                {album.description ?? 'No description available for this album.'}
                            </p>
                            <button
                                type="button"
                                disabled={isSubscribed || subscribingAlbumId === album.id || !album.isActive}
                                onClick={() => void handleSubscribe(album.id)}
                                className="mt-6 w-full rounded-2xl bg-amber-300 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                            >
                                {isSubscribed
                                    ? 'Already tracking'
                                    : subscribingAlbumId === album.id
                                      ? 'Subscribing...'
                                      : 'Subscribe'}
                            </button>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
