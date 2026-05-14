import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useAuthStore } from '#/auth/store';

interface AppShellProps {
    children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const router = useRouter();
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
    const logout = useAuthStore((state) => state.logout);

    async function handleLogout() {
        logout();
        await router.invalidate();
        await navigate({ to: '/auth/login' });
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <Link to="/" className="text-xl font-black tracking-tight text-white">
                        Album Tracker
                    </Link>
                    <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                        <NavLink to="/albums">Albums</NavLink>
                        <NavLink to="/collections">Collections</NavLink>
                        {isAuthenticated ? (
                            <>
                                <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-400">
                                    {user?.email ?? 'Signed in'}
                                </span>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-200"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <NavLink to="/auth/login">Login</NavLink>
                                <Link
                                    to="/auth/register"
                                    className="rounded-full bg-amber-300 px-4 py-2 font-semibold text-slate-950 transition hover:bg-amber-200"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        </div>
    );
}

interface NavLinkProps {
    to: '/' | '/albums' | '/collections' | '/auth/login' | '/auth/register';
    children: ReactNode;
}

function NavLink({ to, children }: NavLinkProps) {
    return (
        <Link
            to={to}
            activeProps={{ className: 'bg-white/10 text-white' }}
            className="rounded-full px-4 py-2 font-medium transition hover:bg-white/10 hover:text-white"
        >
            {children}
        </Link>
    );
}
