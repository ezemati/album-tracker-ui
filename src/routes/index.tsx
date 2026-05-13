import { Link, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
    return (
        <section className="overflow-hidden rounded-4xl border border-white/10 bg-linear-to-br from-slate-900 via-slate-900 to-emerald-950 p-8 shadow-2xl shadow-black/30 sm:p-12">
            <div className="max-w-3xl">
                <p className="mb-4 text-sm font-bold tracking-[0.35em] text-amber-300 uppercase">Collections, sorted</p>
                <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl">
                    Track every card you own, miss, and can trade.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                    Subscribe to albums, update card counts in your collections, and keep a live view of completion,
                    missing cards, and tradable duplicates.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        to="/albums"
                        className="rounded-full bg-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-amber-200"
                    >
                        Browse albums
                    </Link>
                    <Link
                        to="/collections"
                        className="rounded-full border border-white/15 px-5 py-3 font-bold text-white transition hover:bg-white/10"
                    >
                        My collections
                    </Link>
                </div>
            </div>
        </section>
    );
}
