import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { useAuthStore } from '#/stores/auth-store';
import { api } from '#/lib/api';
import { getErrorMessage } from '#/lib/errors';

export const Route = createFileRoute('/auth/register')({ component: Register });

function Register() {
    const navigate = useNavigate();
    const setSession = useAuthStore((state) => state.setSession);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await api.register(email, password);
            const session = await api.login(email, password);
            const user = await api.me(session.access_token);
            setSession({ accessToken: session.access_token, refreshToken: session.refresh_token, user });
            await navigate({ to: '/albums' });
        } catch (submitError) {
            setError(getErrorMessage(submitError));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-md rounded-4xl border border-white/10 bg-white/4 p-8 shadow-xl shadow-black/20">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-300">Start tracking</p>
            <h1 className="mt-3 text-3xl font-black text-white">Create account</h1>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                    <span className="text-sm font-semibold text-slate-300">Email</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        autoComplete="email"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                    />
                </label>
                <label className="block">
                    <span className="text-sm font-semibold text-slate-300">Password</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        autoComplete="new-password"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                    />
                </label>
                {error ? <p className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p> : null}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-emerald-300 px-5 py-3 font-black text-slate-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isSubmitting ? 'Creating account...' : 'Register'}
                </button>
            </form>
            <p className="mt-6 text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/auth/login" className="font-bold text-emerald-300 hover:text-emerald-200">
                    Login
                </Link>
            </p>
        </div>
    );
}
