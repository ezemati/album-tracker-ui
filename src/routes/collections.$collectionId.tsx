import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, createFileRoute } from '@tanstack/react-router';

import { RequireAuth } from '../components/RequireAuth';
import { api } from '../lib/api';
import type { AlbumDetailResponse, UserCardResponse, UserCollectionDetailResponse } from '../lib/api';
import { getErrorMessage } from '../lib/errors';

export const Route = createFileRoute('/collections/$collectionId')({ component: CollectionDetailPage });

type CardFilter = 'all' | 'owned' | 'missing' | 'tradable';

function CollectionDetailPage() {
    return (
        <RequireAuth>
            <CollectionDetail />
        </RequireAuth>
    );
}

function CollectionDetail() {
    const { collectionId } = Route.useParams();
    const [collection, setCollection] = useState<UserCollectionDetailResponse | null>(null);
    const [albumDetail, setAlbumDetail] = useState<AlbumDetailResponse | null>(null);
    const [filter, setFilter] = useState<CardFilter>('all');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [mutatingCardId, setMutatingCardId] = useState<string | null>(null);

    async function loadCollection() {
        const detail = await api.getCollection(collectionId);
        setCollection(detail);
        setAlbumDetail(await api.getAlbum(detail.album.id));
    }

    useEffect(() => {
        let isActive = true;

        async function load() {
            setIsLoading(true);
            setError(null);

            try {
                const detail = await api.getCollection(collectionId);
                const album = await api.getAlbum(detail.album.id);

                if (isActive) {
                    setCollection(detail);
                    setAlbumDetail(album);
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

        void load();

        return () => {
            isActive = false;
        };
    }, [collectionId]);

    async function handleAdjust(cardId: string, delta: number) {
        setMutatingCardId(cardId);
        setError(null);

        try {
            await api.adjustCardQuantity(collectionId, cardId, delta);
            await loadCollection();
        } catch (adjustError) {
            setError(getErrorMessage(adjustError));
        } finally {
            setMutatingCardId(null);
        }
    }

    async function handleSetQuantity(cardId: string, quantity: number) {
        setMutatingCardId(cardId);
        setError(null);

        try {
            await api.setCardQuantity(collectionId, cardId, quantity);
            await loadCollection();
        } catch (setErrorResult) {
            setError(getErrorMessage(setErrorResult));
        } finally {
            setMutatingCardId(null);
        }
    }

    const sectionNames = new Map(albumDetail?.sections.map((section) => [section.id, section.name]) ?? []);
    const sectionOrder = new Map(albumDetail?.sections.map((section, index) => [section.id, index]) ?? []);
    const cards = [...(collection?.cards ?? [])]
        .filter((userCard) => {
            if (filter === 'owned') {
                return userCard.quantity > 0;
            }

            if (filter === 'missing') {
                return userCard.isMissing;
            }

            if (filter === 'tradable') {
                return userCard.isTradable;
            }

            return true;
        })
        .sort((first, second) => {
            const firstSection = sectionOrder.get(first.card.sectionId) ?? 0;
            const secondSection = sectionOrder.get(second.card.sectionId) ?? 0;

            if (firstSection !== secondSection) {
                return firstSection - secondSection;
            }

            return first.card.orderIndex - second.card.orderIndex;
        });

    return (
        <section>
            <Link to="/collections" className="text-sm font-bold text-amber-300 hover:text-amber-200">
                Back to collections
            </Link>

            {isLoading ? <p className="mt-8 text-slate-300">Loading collection...</p> : null}
            {error ? <p className="mt-6 rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}

            {collection ? (
                <>
                    <div className="mt-6 rounded-[2rem] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">
                                    Collection detail
                                </p>
                                <h1 className="mt-3 text-4xl font-black text-white">{collection.album.name}</h1>
                                <p className="mt-3 max-w-2xl text-slate-300">
                                    {collection.album.description ?? 'Manage card quantities for this album.'}
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] bg-emerald-300 p-5 text-center text-slate-950">
                                <div className="text-4xl font-black">
                                    {Math.round(collection.completionPercentage)}%
                                </div>
                                <div className="text-sm font-bold uppercase tracking-widest">complete</div>
                            </div>
                        </div>
                        <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-950">
                            <div
                                className="h-full rounded-full bg-emerald-300"
                                style={{ width: `${Math.min(collection.completionPercentage, 100)}%` }}
                            />
                        </div>
                        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                            <Metric label="Owned" value={collection.ownedCards} />
                            <Metric label="Missing" value={collection.missingCards} />
                            <Metric label="Tradable" value={collection.tradableCards} />
                        </dl>
                    </div>

                    <div className="mt-8 flex flex-wrap gap-2">
                        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
                            All cards
                        </FilterButton>
                        <FilterButton active={filter === 'owned'} onClick={() => setFilter('owned')}>
                            Owned
                        </FilterButton>
                        <FilterButton active={filter === 'missing'} onClick={() => setFilter('missing')}>
                            Missing
                        </FilterButton>
                        <FilterButton active={filter === 'tradable'} onClick={() => setFilter('tradable')}>
                            Tradable
                        </FilterButton>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03]">
                        {cards.length === 0 ? (
                            <p className="p-6 text-slate-300">No cards match this filter.</p>
                        ) : (
                            cards.map((userCard) => (
                                <CardRow
                                    key={userCard.card.id}
                                    userCard={userCard}
                                    sectionName={sectionNames.get(userCard.card.sectionId) ?? 'Album'}
                                    isMutating={mutatingCardId === userCard.card.id}
                                    onAdd={() => void handleAdjust(userCard.card.id, 1)}
                                    onRemove={() =>
                                        void handleSetQuantity(userCard.card.id, Math.max(userCard.quantity - 1, 0))
                                    }
                                    onSetQuantity={(quantity) => void handleSetQuantity(userCard.card.id, quantity)}
                                />
                            ))
                        )}
                    </div>
                </>
            ) : null}
        </section>
    );
}

interface MetricProps {
    label: string;
    value: number;
}

function Metric({ label, value }: MetricProps) {
    return (
        <div className="rounded-2xl bg-slate-950/70 p-4 text-center">
            <dt className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</dt>
            <dd className="mt-1 text-2xl font-black text-white">{value}</dd>
        </div>
    );
}

interface FilterButtonProps {
    active: boolean;
    children: string;
    onClick: () => void;
}

function FilterButton({ active, children, onClick }: FilterButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active ? 'bg-amber-300 text-slate-950' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
            }`}
        >
            {children}
        </button>
    );
}

interface CardRowProps {
    userCard: UserCardResponse;
    sectionName: string;
    isMutating: boolean;
    onAdd: () => void;
    onRemove: () => void;
    onSetQuantity: (quantity: number) => void;
}

function CardRow({ userCard, sectionName, isMutating, onAdd, onRemove, onSetQuantity }: CardRowProps) {
    return (
        <div className="grid gap-4 border-b border-white/10 p-4 last:border-b-0 md:grid-cols-[1fr_auto] md:items-center">
            <div className="flex min-w-0 gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-800 text-sm font-black text-slate-400">
                    {userCard.card.imageUrl ? (
                        <img src={userCard.card.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        userCard.card.code
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">{userCard.card.name}</h3>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-bold text-slate-300">
                            {userCard.card.code}
                        </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{sectionName}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                        {userCard.isMissing ? (
                            <span className="rounded-full bg-red-500/15 px-2 py-1 text-red-200">Missing</span>
                        ) : null}
                        {userCard.isTradable ? (
                            <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200">
                                {userCard.tradableCopies} tradable
                            </span>
                        ) : null}
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <button
                    type="button"
                    disabled={isMutating || userCard.quantity === 0}
                    onClick={onRemove}
                    className="h-10 w-10 rounded-full border border-white/10 text-xl font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove ${userCard.card.name}`}
                >
                    -
                </button>
                <QuantityForm quantity={userCard.quantity} disabled={isMutating} onSetQuantity={onSetQuantity} />
                <button
                    type="button"
                    disabled={isMutating}
                    onClick={onAdd}
                    className="h-10 w-10 rounded-full bg-amber-300 text-xl font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Add ${userCard.card.name}`}
                >
                    +
                </button>
            </div>
        </div>
    );
}

interface QuantityFormProps {
    quantity: number;
    disabled: boolean;
    onSetQuantity: (quantity: number) => void;
}

function QuantityForm({ quantity, disabled, onSetQuantity }: QuantityFormProps) {
    const [draft, setDraft] = useState(String(quantity));

    useEffect(() => {
        setDraft(String(quantity));
    }, [quantity]);

    function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        const nextQuantity = Math.max(Number.parseInt(draft, 10) || 0, 0);

        if (nextQuantity !== quantity) {
            onSetQuantity(nextQuantity);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="number"
                min="0"
                value={draft}
                disabled={disabled}
                onChange={(event) => setDraft(event.target.value)}
                className="w-20 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-center font-black text-white outline-none transition focus:border-amber-300 disabled:opacity-60"
                aria-label="Card quantity"
            />
            <button
                type="submit"
                disabled={disabled}
                className="rounded-2xl border border-white/10 px-3 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
                Set
            </button>
        </form>
    );
}
