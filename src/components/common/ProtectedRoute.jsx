import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ requiredRole, redirectPath = '/login' }) => {
    const { isLoggedIn, user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isLoggedIn) {
        return <Navigate to={redirectPath} replace />;
    }

    if (requiredRole && user?.role !== requiredRole && !user?.isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
