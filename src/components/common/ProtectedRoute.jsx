import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ requiredRole, redirectPath = '/login' }) => {
    const { isLoggedIn, user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
                <LoadingSpinner size="large" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to={`${redirectPath}${window.location.search}`} replace />;
    }

    if (requiredRole && user?.role !== requiredRole && !user?.isAdmin) {
        return <Navigate to={`/${window.location.search}`} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
