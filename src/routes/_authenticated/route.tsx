import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { useAuthStore } from '@/auth/store';

export const Route = createFileRoute('/_authenticated')({
    beforeLoad: async ({ location }) => {
        const isAuthenticated = useAuthStore.getState().isAuthenticated();
        if (!isAuthenticated) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw redirect({
                to: '/auth/login',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
    return <Outlet />;
}
