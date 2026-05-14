import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

import { useAuthStore } from './auth/store';
import { AuthProvider, useCurrentUser } from './auth/useCurrentUser';
import { queryClient } from './lib/queryClient';
import { router } from './router';

function InitializedApp() {
    const { currentUser } = useCurrentUser();
    return <RouterProvider router={router} context={{ currentUser }} />;
}

function AuthApp() {
    const status = useAuthStore((state) => state.status);
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        initialize();
    }, [initialize]);

    if (status === 'Checking') {
        return 'Loading...';
    }

    return <InitializedApp />;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AuthApp />
            </AuthProvider>
        </QueryClientProvider>
    );
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const rootElement = document.getElementById('app')!;

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
