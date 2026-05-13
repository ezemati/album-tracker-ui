import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { useAuthStore } from '../stores/auth-store';

interface RequireAuthProps {
    children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
    const navigate = useNavigate();
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    useEffect(() => {
        if (hasHydrated && !isAuthenticated) {
            void navigate({ to: '/login' });
        }
    }, [hasHydrated, isAuthenticated, navigate]);

    if (!hasHydrated) {
        return (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">
                Restoring session...
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return children;
}
