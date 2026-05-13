import { useEffect, useState } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { RequireAuth } from '../components/RequireAuth';
import { api } from '../lib/api';
import type { UserCollectionSummaryResponse } from '../lib/api';
import { getErrorMessage } from '../lib/errors';

export const Route = createFileRoute('/collections')({ component: CollectionsPage });

function CollectionsPage() {
    return (
        <RequireAuth>
            <Collections />
        </RequireAuth>
    );
}

function Collections() {
    const [collections, setCollections] = useState<UserCollectionSummaryResponse[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [unsubscribingId, setUnsubscribingId] = useState<string | null>(null);

    useEffect(() => {
        let isActive = true;

        async function loadCollections() {
            setIsLoading(true);
            setError(null);

            try {
                const collectionList = await api.listCollections();

                if (isActive) {
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

        void loadCollections();

        return () => {
            isActive = false;
        };
    }, []);

    async function handleUnsubscribe(collectionId: string) {
        setUnsubscribingId(collectionId);
        setError(null);

        try {
            await api.unsubscribe(collectionId);
            setCollections((current) => current.filter((collection) => collection.id !== collectionId));
        } catch (unsubscribeError) {
            setError(getErrorMessage(unsubscribeError));
        } finally {
            setUnsubscribingId(null);
        }
    }

    return (
        <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">Inventory</p>
                    <h1 className="mt-3 text-4xl font-black text-white">My collections</h1>
                </div>
                <Link
                    to="/albums"
                    className="rounded-full bg-amber-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200"
                >
                    Add collection
                </Link>
            </div>

            {error ? <p className="mt-6 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
            {isLoading ? <p className="mt-8 text-slate-300">Loading collections...</p> : null}

            {!isLoading && collections.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-8">
                    <h2 className="text-2xl font-black text-white">No collections yet</h2>
                    <p className="mt-2 text-slate-300">Subscribe to an album to start tracking your cards.</p>
                    <Link
                        to="/albums"
                        className="mt-6 inline-flex rounded-full bg-amber-300 px-5 py-3 font-black text-slate-950 transition hover:bg-amber-200"
                    >
                        Browse albums
                    </Link>
                </div>
            ) : null}

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {collections.map((collection) => (
                    <article
                        key={collection.id}
                        className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-white">{collection.album.name}</h2>
                                <p className="mt-1 text-sm text-slate-400">
                                    Started {new Date(collection.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <span className="rounded-full bg-emerald-300 px-3 py-1 text-sm font-black text-slate-950">
                                {Math.round(collection.completionPercentage)}%
                            </span>
                        </div>
                        <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-800">
                            <div
                                className="h-full rounded-full bg-emerald-300"
                                style={{ width: `${Math.min(collection.completionPercentage, 100)}%` }}
                            />
                        </div>
                        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
                            <Metric label="Owned" value={collection.ownedCards} />
                            <Metric label="Missing" value={collection.missingCards} />
                            <Metric label="Tradable" value={collection.tradableCards} />
                        </dl>
                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                to="/collections/$collectionId"
                                params={{ collectionId: collection.id }}
                                className="flex-1 rounded-2xl bg-white px-4 py-3 text-center font-black text-slate-950 transition hover:bg-amber-200"
                            >
                                Open
                            </Link>
                            <button
                                type="button"
                                disabled={unsubscribingId === collection.id}
                                onClick={() => void handleUnsubscribe(collection.id)}
                                className="rounded-2xl border border-red-300/30 px-4 py-3 font-black text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {unsubscribingId === collection.id ? 'Removing...' : 'Unsubscribe'}
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

interface MetricProps {
    label: string;
    value: number;
}

function Metric({ label, value }: MetricProps) {
    return (
        <div className="rounded-2xl bg-slate-950/70 p-3">
            <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</dt>
            <dd className="mt-1 text-xl font-black text-white">{value}</dd>
        </div>
    );
}
