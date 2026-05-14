import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { clsx } from 'clsx';
import type { SubmitEvent } from 'react';
import { useState } from 'react';

import { type AlbumDetailResponse } from '#/lib/albumClient';
import { collectionClient, type UserCardResponse, type UserCollectionDetailResponse } from '#/lib/collectionClient';
import { queries } from '#/lib/queries';

export const Route = createFileRoute('/_authenticated/collections/$collectionId')({ component: CollectionDetailPage });

type CardFilter = 'all' | 'owned' | 'missing' | 'tradable';

function CollectionDetailPage() {
    const { collectionId } = Route.useParams();

    const collectionQuery = useQuery(queries.collections.detail(collectionId));
    const albumId = collectionQuery.data?.album.id;
    const albumQuery = useQuery({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...queries.albums.detail(albumId!),
        enabled: !!albumId,
    });

    const isLoading = collectionQuery.isPending || albumQuery.isPending;

    return (
        <section>
            <Link to="/collections" className="text-sm font-bold text-amber-300 hover:text-amber-200">
                Back to collections
            </Link>
            {isLoading ? <p className="mt-8 text-slate-300">Loading collection...</p> : null}
            {/* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */}
            {!isLoading ? <CollectionDetail collection={collectionQuery.data!} album={albumQuery.data!} /> : null}
        </section>
    );
}

function CollectionDetail({
    collection,
    album,
}: {
    collection: UserCollectionDetailResponse;
    album: AlbumDetailResponse;
}) {
    const [filter, setFilter] = useState<CardFilter>('all');

    const sectionNames = new Map(album.sections.map((section) => [section.id, section.name]));
    const sectionOrder = new Map(album.sections.map((section, index) => [section.id, index]));
    const cards = collection.cards
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
        <>
            <CollectionSummary collection={collection} />

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

            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/3">
                {cards.length === 0 ? (
                    <p className="p-6 text-slate-300">No cards match this filter.</p>
                ) : (
                    cards.map((userCard) => (
                        <CardRow
                            key={userCard.card.id}
                            userCard={userCard}
                            sectionName={sectionNames.get(userCard.card.sectionId) ?? 'Album'}
                            collectionId={collection.id}
                        />
                    ))
                )}
            </div>
        </>
    );
}

function CollectionSummary({ collection }: { collection: UserCollectionDetailResponse }) {
    return (
        <div className="mt-6 rounded-4xl border border-white/10 bg-linear-to-br from-slate-900 to-slate-800 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-bold tracking-[0.3em] text-emerald-300 uppercase">Collection detail</p>
                    <h1 className="mt-3 text-4xl font-black text-white">{collection.album.name}</h1>
                    <p className="mt-3 max-w-2xl text-slate-300">
                        {collection.album.description ?? 'Manage card quantities for this album.'}
                    </p>
                </div>
                <div className="rounded-3xl bg-emerald-300 p-5 text-center text-slate-950">
                    <div className="text-4xl font-black">{Math.round(collection.completionPercentage)}%</div>
                    <div className="text-sm font-bold tracking-widest uppercase">complete</div>
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
    );
}

interface MetricProps {
    label: string;
    value: number;
}

function Metric({ label, value }: MetricProps) {
    return (
        <div className="rounded-2xl bg-slate-950/70 p-4 text-center">
            <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">{label}</dt>
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
    collectionId: string;
    userCard: UserCardResponse;
    sectionName: string;
}

function CardRow({ userCard, collectionId, sectionName }: CardRowProps) {
    const queryClient = useQueryClient();

    const setCardQuantityMutation = useMutation({
        mutationFn: async (quantity: number) => {
            await collectionClient.setCardQuantity(collectionId, userCard.card.id, quantity);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queries.collections.detail(collectionId).queryKey });
        },
    });

    const adjustCardQuantityMutation = useMutation({
        mutationFn: async (delta: number) => {
            await collectionClient.adjustCardQuantity(collectionId, userCard.card.id, delta);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: queries.collections.detail(collectionId).queryKey });
        },
    });

    const isMutating = setCardQuantityMutation.isPending || adjustCardQuantityMutation.isPending;

    const handleSetQuantity = async (quantity: number) => {
        await setCardQuantityMutation.mutateAsync(quantity);
    };

    const handleAdjust = async (delta: number) => {
        await adjustCardQuantityMutation.mutateAsync(delta);
    };

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
                    onClick={() => handleSetQuantity(Math.max(userCard.quantity - 1, 0))}
                    className="h-10 w-10 rounded-full border border-white/10 text-xl font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    -
                </button>
                <QuantityForm
                    key={`${userCard.card.id}_${userCard.quantity}`}
                    quantity={userCard.quantity}
                    disabled={isMutating}
                    onSetQuantity={(quantity) => handleSetQuantity(quantity)}
                />
                <button
                    type="button"
                    disabled={isMutating}
                    onClick={() => handleAdjust(1)}
                    className="h-10 w-10 rounded-full bg-amber-300 text-xl font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
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

    const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextQuantity = Math.max(Number.parseInt(draft, 10) || 0, 0);
        if (nextQuantity !== quantity) {
            onSetQuantity(nextQuantity);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
                type="number"
                min="0"
                value={draft}
                disabled={disabled}
                onChange={(event) => setDraft(event.target.value)}
                className={clsx(
                    'w-20 rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-center font-black text-white transition outline-none disabled:opacity-60',
                    { 'border-red-400!': draft !== String(quantity) },
                    'focus:border-amber-300',
                )}
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
