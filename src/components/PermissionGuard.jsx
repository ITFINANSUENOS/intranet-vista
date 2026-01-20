import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PermissionGuard = ({ children, permission }) => {
    const { user } = useAuth();
    
    // Si el usuario es ADMINISTRADOR, pasa siempre.
    const isAdmin = user?.roles?.some(role => 
        (typeof role === 'string' ? role : role.name).toUpperCase() === 'Super_usuario'
    );

    const hasPermission = user?.permissions?.includes(permission);

    if (!isAdmin && !hasPermission) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};