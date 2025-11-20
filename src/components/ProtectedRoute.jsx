// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();

    // 1. Si la app está verificando el token, mostramos un cargando
    // Esto evita que te expulse mientras verifica tu sesión con /me
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    // 2. Si terminó de cargar y NO está autenticado, adiós.
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si está autenticado, muestra la ruta protegida (Dashboard, etc)
    return <Outlet />;
}