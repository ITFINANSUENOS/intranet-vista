// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();

    // 1. Mientras la aplicación verifica el token con el servidor (/me)
    // mostramos un estado de carga para no redirigir al login por error.
    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[rgba(4,24,48)]"></div>
                <p className="mt-4 text-[rgba(4,24,48)] font-medium animate-pulse">Verificando acceso...</p>
            </div>
        );
    }

    // 2. Si terminó de cargar y NO hay autenticación confirmada, redirigir.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si está autenticado, renderiza las rutas hijas (Dashboard, etc.)
    return <Outlet />;
}