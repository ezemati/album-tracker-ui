import { Link, createFileRoute } from '@tanstack/react-router';
import { useAuthStore } from '#/auth/store';
import { type AlbumSummaryResponse } from '#/lib/albumClient';
import { collectionClient } from '#/lib/collectionClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queries } from '#/lib/queries';

export const Route = createFileRoute('/albums/')({ component: Albums });

function Albums() {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

    const albumsQuery = useQuery(queries.albums.all);
    const collectionsQuery = useQuery({
        ...queries.collections.all,
        enabled: isAuthenticated,
    });
    const isLoading = albumsQuery.isPending || collectionsQuery.isPending;

    const subscribedAlbumIds = new Set(
        collectionsQuery.data ? collectionsQuery.data.map((collection) => collection.album.id) : [],
    );

    return (
        <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold tracking-[0.3em] text-amber-300 uppercase">Available albums</p>
                    <h1 className="mt-3 text-4xl font-black text-white">Choose a collection to track</h1>
                </div>
                <Link to="/collections" className="text-sm font-bold text-amber-300 hover:text-amber-200">
                    View my collections
                </Link>
            </div>

            {isLoading ? <p className="mt-8 text-slate-300">Loading albums...</p> : null}

            {!isLoading && albumsQuery.data?.length === 0 ? (
                <div className="mt-8 rounded-3xl border border-white/10 bg-white/3 p-8 text-slate-300">
                    No albums are available yet.
                </div>
            ) : null}

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {albumsQuery.data?.map((album) => (
                    <Album album={album} subscribedAlbumIds={subscribedAlbumIds} key={album.id} />
                ))}
            </div>
        </section>
    );
}

function Album({ album, subscribedAlbumIds }: { album: AlbumSummaryResponse; subscribedAlbumIds: Set<string> }) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    const navigate = Route.useNavigate();
    const queryClient = useQueryClient();
    const isSubscribed = subscribedAlbumIds.has(album.id);

    const subscribeMutation = useMutation({
        mutationFn: async () => await collectionClient.subscribeToAlbum(album.id),
        onSuccess: async (response) => {
            await queryClient.invalidateQueries({ queryKey: [queries.albums.all.queryKey] });
            await navigate({ to: '/collections/$collectionId', params: { collectionId: response.id } });
        },
    });

    async function handleSubscribe() {
        if (!isAuthenticated) {
            await navigate({ to: '/auth/login' });
            return;
        }
        await subscribeMutation.mutateAsync();
    }

    return (
        <article className="rounded-[1.75rem] border border-white/10 bg-white/4 p-6">
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
                disabled={isSubscribed || subscribeMutation.isPending || !album.isActive}
                onClick={handleSubscribe}
                className="mt-6 w-full rounded-2xl bg-amber-300 px-4 py-3 font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
                {isSubscribed ? 'Already tracking' : subscribeMutation.isPending ? 'Subscribing...' : 'Subscribe'}
            </button>
        </article>
    );
}
