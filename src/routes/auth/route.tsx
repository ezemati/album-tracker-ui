import { useAuthStore } from '#/auth/store';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/auth')({
    beforeLoad: async () => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated();
        if (isAuthenticated) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({
                to: '/collections',
            });
        }
    },
    component: AuthLayout,
});

function AuthLayout() {
    return <Outlet />;
}
