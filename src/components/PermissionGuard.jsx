// src/components/PermissionGuard.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PermissionGuard = ({ children, permission }) => {
    const { user, loading } = useAuth();

    // Mientras se verifica la identidad, no renderizamos nada o mostramos un skeleton
    if (loading) return null;

    // 1. Verificación de SUPER_USUARIO (Acceso total)
    // Usamos encadenamiento opcional (?.) y aseguramos que el valor sea un string antes de comparar.
    const isAdmin = user?.roles?.some(role => {
        const roleName = typeof role === 'string' ? role : role.name;
        return roleName?.toUpperCase() === 'SUPER_USUARIO';
    });

    // 2. Verificación de Permiso Específico
    const hasPermission = user?.permissions?.some(p => {
        const permName = typeof p === 'string' ? p : p.name;
        return permName === permission;
    });

    // 3. Lógica de Redirección
    // Si no es administrador y tampoco tiene el permiso solicitado, se le devuelve al dashboard.
    if (!isAdmin && !hasPermission) {
        console.warn(`Acceso denegado: Se requiere el permiso [${permission}]`);
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};