// src/layouts/AuthenticatedLayout.jsx
import React from 'react'; 
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar'; 
import { useAuth } from '../context/AuthContext';

// 1. CONSTANTES DE DISEÑO FUERA DEL COMPONENTE
// Mejora el rendimiento al no reasignarse en cada render
const HEADER_BG_COLOR = 'rgba(4, 24, 48)';
const MAIN_CONTENT_MARGIN = 'lg:ml-20'; 
const BG_LAYOUT = 'bg-gray-100';

export default function AuthenticatedLayout({ children, title }) {
    // 2. CONSUMO DE ESTADOS DESDE EL ORQUESTADOR
    const { user, isAuthenticated, loading } = useAuth();
    
    // 3. BARRERA DE CARGA (Loading Guard)
    // Espera a que el AuthContext termine de validar el token silenciosamente
    if (loading) {
        return (
            <div className={`min-h-screen ${BG_LAYOUT} flex flex-col items-center justify-center`}>
                <div className="w-12 h-12 border-4 border-blue-200 border-t-[rgba(4,24,48)] rounded-full animate-spin mb-4"></div>
                <p className="text-[rgba(4,24,48)] font-semibold animate-pulse">
                    Validando sesión segura...
                </p>
            </div>
        );
    }

    // 4. BARRERA DE SEGURIDAD (Auth Guard)
    // Si terminó de cargar y no hay sesión válida, lo expulsa al login inmediatamente
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 5. RENDERIZADO SEGURO
    return (
        <div className={`min-h-screen ${BG_LAYOUT} relative`}>
            
            {/* Menú Lateral Seguro */}
            <Sidebar /> 
            
            {/* Contenedor Principal Adaptativo */}
            <div className={`transition-all duration-300 ${MAIN_CONTENT_MARGIN}`}>
                
                {/* Header Superior Corporativo */}
                <header 
                    className="shadow-sm sticky top-0 z-40 border-b border-white/10"
                    style={{ backgroundColor: HEADER_BG_COLOR }}
                >
                    <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h2 className="font-light text-xl text-white leading-tight">
                            {title || 'Panel de Control'}
                        </h2>
                        
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-300 hidden sm:block">
                                Hola, <span className="font-semibold text-white">{user?.name || 'Usuario'}</span>
                            </span>
                            
                            {/* Avatar generado automáticamente con la inicial del usuario */}
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold shadow-inner cursor-pointer hover:bg-white/30 transition-colors">
                                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </div>
                    </div>
                </header>
                
                {/* Contenedor de las Vistas Hija (Dashboard, Inventario, etc.) */}
                <main className="w-full relative"> 
                    {children}
                </main>
            </div>
        </div>
    );
}