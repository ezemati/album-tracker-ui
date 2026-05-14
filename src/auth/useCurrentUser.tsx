import { createContext, useContext } from 'react';

import { useAuthStore } from './store';
import type { MeResponse } from './types';

export interface AuthContext {
    currentUser: MeResponse | null;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const currentUser = useAuthStore((state) => state.user);
    return <AuthContext.Provider value={{ currentUser }}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useCurrentUser must be used within an AuthProvider');
    }
    return context;
}
