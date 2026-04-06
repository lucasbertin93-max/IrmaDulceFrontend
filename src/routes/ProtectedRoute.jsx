import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuthStore();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (roles && !roles.includes(user.perfil)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
