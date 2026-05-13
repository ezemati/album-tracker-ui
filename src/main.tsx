import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router';
import { StrictMode, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { useAuthStore } from './auth/store';

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

    return <RouterProvider router={router} />;
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthApp />
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
