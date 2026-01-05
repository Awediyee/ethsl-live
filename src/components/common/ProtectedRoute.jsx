import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ requiredRole, redirectPath = '/login' }) => {
    const { isLoggedIn, user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    if (!isLoggedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    if (requiredRole && user?.role !== requiredRole && !user?.isAdmin) {
        // If role mismatch (and not admin overriding), redirect to home or unauthorized
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
