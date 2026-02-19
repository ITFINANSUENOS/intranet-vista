import React from 'react'; 
import Sidebar from '../components/Sidebar'; 
import { useAuth } from '../context/AuthContext';

export default function AuthenticatedLayout({ children, title }) {
    const { user } = useAuth();
    
    // Margen fijo para desktop, coincidiendo con el ancho del Sidebar colapsado (w-20 = 5rem)
    const mainContentMarginClass = 'lg:ml-20'; 

    return (
        // [SOLUCIÓN 1]: Eliminé la clase 'flex'. 
        // Al ser un bloque normal, el margen restará espacio en lugar de empujar el contenido fuera.
        <div className="min-h-screen bg-gray-100 relative">
            
            {/* Sidebar (Posición Fixed, no afecta el flujo del bloque) */}
            <Sidebar /> 
            
            {/* [SOLUCIÓN 2]: Eliminé 'flex-1'. Ahora es un bloque que respeta el margen. */}
            <div className={`transition-all duration-300 ${mainContentMarginClass}`}>
                
                {/* Header Superior Principal Modificado */}
                <header 
                    className="shadow-sm sticky top-0 z-40 border-b border-white/10"
                    style={{ backgroundColor: 'rgba(4, 24, 48)' }}
                >
                    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                        <h2 className="font-light text-xl text-white leading-tight">
                            {title || 'Panel'}
                        </h2>
                        <span className="text-sm text-gray-300">
                            Hola, <span className="font-semibold text-white">{user?.name || 'Usuario'}</span>
                        </span>
                    </div>
                </header>
                
                {/* Main Content */}
                <main className="w-full"> 
                    {children}
                </main>
            </div>
        </div>
    );
}