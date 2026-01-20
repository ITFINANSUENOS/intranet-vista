import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, 
    Database, 
    LayoutGrid,
    ChevronRight,
    ShieldAlert,
    X,
    Loader2
} from 'lucide-react';

// Importación de Layout y Contexto
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';

// Importación de botones SSO
import { HelpSsoButton } from '../components/sso/HelpSsoButton';
import { InventorySsoButton } from '../components/sso/InventorySsoButton';

const Herramientas = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // ESTADOS PARA EL MODAL DE CARGA
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const timeoutRef = useRef(null);

    // Validación de permisos original
    const canViewCartera = user?.permissions?.includes('view_documents'); 
    const canViewDatacredito = user?.permissions?.includes('view_datacredito');
    const canViewInventory = user?.permissions?.includes('view_inventory'); 
    const canViewHelp = user?.permissions?.includes('view_help_desk'); 

    // Limpieza de seguridad
    const stopLoading = () => {
        setIsLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };

    // Manejador de acciones con temporizador de 30s
    const handleAction = (path, message, isExternal = false) => {
        setLoadingMessage(message);
        setIsLoading(true);

        // Seguridad: Si en 30 segundos no ha pasado nada, cerramos el modal
        timeoutRef.current = setTimeout(() => {
            stopLoading();
        }, 30000);

        if (!isExternal) {
            // Navegación interna
            setTimeout(() => {
                navigate(path);
                stopLoading();
            }, 1000);
        }
        // Si es externo (SSO), el componente botón hará su trabajo, 
        // y el timeout de 30s se encargará de limpiar la pantalla original.
    };

    // Limpiar al desmontar
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Estilos base originales con mejoras estéticas
    const cardBaseStyle = `
        group relative bg-white p-8 rounded-[2rem] 
        border border-gray-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]
        transition-all duration-500 ease-out
        hover:shadow-[0_20px_60px_-15px_rgba(5,25,49,0.15)]
        hover:-translate-y-2 hover:border-[rgb(5,25,49)]/20
        flex flex-col justify-between min-h-[240px] cursor-pointer overflow-hidden
    `;

    return (
        <AuthenticatedLayout title="Centro de Herramientas">
            
            {/* MODAL DE CARGA INTERACTIVO */}
            {isLoading && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[rgb(5,25,49)]/70 backdrop-blur-md animate-in fade-in duration-300">
                    <button 
                        onClick={stopLoading}
                        className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={40} />
                    </button>
                    <div className="text-center">
                        <div className="relative flex items-center justify-center mb-6">
                            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                            <Loader2 className="absolute text-white animate-pulse" size={30} />
                        </div>
                        <h2 className="text-white text-2xl font-bold tracking-tight">{loadingMessage}</h2>
                        <p className="text-blue-200/60 mt-2 text-sm uppercase tracking-widest">Preparando Conexión Segura</p>
                    </div>
                </div>
            )}

            <div className={`max-w-7xl mx-auto px-6 py-12 lg:px-12 transition-all duration-500 ${isLoading ? 'blur-sm scale-95 opacity-50' : ''}`}>
                
                {/* Cabecera Principal */}
                <div className="relative mb-16 animate-in fade-in slide-in-from-top duration-700">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-2 bg-[rgb(5,25,49)] text-white rounded-lg">
                            <LayoutGrid size={24} />
                        </div>
                        <span className="text-[rgb(5,25,49)] font-bold tracking-[0.2em] uppercase text-sm">Ecosistema Digital</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
                        Nuestras <span className="text-[rgb(5,25,49)]">Herramientas</span>
                    </h1>
                    <p className="text-gray-500 mt-4 text-lg max-w-2xl leading-relaxed">
                        Accede de forma segura a los módulos de análisis de datos y sistemas integrados de la organización.
                    </p>
                </div>

                {/* SECCIÓN 1: ANÁLISIS ESTRATÉGICO */}
                {(canViewCartera || canViewDatacredito) && (
                    <div className="mb-20">
                        <div className="flex items-center gap-3 mb-10 group">
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Análisis Operativo</h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-[rgb(5,25,49)]/20 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {canViewCartera && (
                                <div onClick={() => handleAction('/analisis_datos/Documents')} className={cardBaseStyle}>
                                    <div className="flex justify-between items-start">
                                        <div className="p-4 bg-blue-50 text-[rgb(5,25,49)] rounded-2xl group-hover:bg-[rgb(5,25,49)] group-hover:text-white transition-all duration-500 shadow-sm">
                                            <FileText size={32} />
                                        </div>
                                        <div className="flex items-center gap-1 text-[rgb(5,25,49)] font-bold opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <span className="text-xs uppercase tracking-widest">Abrir</span>
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Gestión de Cartera</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">Monitor estratégico para el seguimiento de ventas y regionalización.</p>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 text-[rgb(5,25,49)]/5 group-hover:scale-110 transition-transform duration-700">
                                        <FileText size={120} />
                                    </div>
                                </div>
                            )}

                            {canViewDatacredito && (
                                <div onClick={() => handleAction('/analisis_datos/DatacreditoProcessingPage')} className={cardBaseStyle}>
                                    <div className="flex justify-between items-start">
                                        <div className="p-4 bg-blue-50 text-[rgb(5,25,49)] rounded-2xl group-hover:bg-[rgb(5,25,49)] group-hover:text-white transition-all duration-500 shadow-sm">
                                            <Database size={32} />
                                        </div>
                                        <div className="flex items-center gap-1 text-[rgb(5,25,49)] font-bold opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                                            <span className="text-xs uppercase tracking-widest">Abrir</span>
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Carga Datacrédito</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">Procesamiento masivo para centrales de riesgo.</p>
                                    </div>
                                    <div className="absolute -right-4 -bottom-4 text-[rgb(5,25,49)]/5 group-hover:scale-110 transition-transform duration-700">
                                        <Database size={120} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SECCIÓN 2: SERVICIOS INTEGRADOS (SSO) */}
                {(canViewInventory || canViewHelp) && (
                    <div className="animate-in fade-in slide-in-from-bottom duration-1000 delay-200">
                        <div className="flex items-center gap-3 mb-10">
                            <h2 className="text-xl font-bold text-gray-800 tracking-tight">Sistemas Externos</h2>
                            <div className="h-[2px] flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {canViewInventory && (
                                <div onClick={() => handleAction(null, true)} className="transform transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                                    <InventorySsoButton className="w-full flex items-center justify-between p-8 rounded-3xl bg-[rgb(5,25,49)] text-white shadow-xl hover:bg-[#0a2240] transition-colors group" />
                                </div>
                            )}

                            {canViewHelp && (
                                <div onClick={() => handleAction(null, "", true)} className="transform transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]">
                                    <HelpSsoButton className="w-full flex items-center justify-between p-8 rounded-3xl bg-white border-2 border-[rgb(5,25,49)] text-[rgb(5,25,49)] font-black hover:bg-gray-50 transition-colors shadow-lg shadow-gray-200 group" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Estado sin permisos */}
                {!(canViewCartera || canViewDatacredito || canViewInventory || canViewHelp) && (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                        <div className="p-6 bg-white rounded-full shadow-sm mb-6">
                            <ShieldAlert size={48} className="text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Acceso Restringido</h3>
                        <p className="text-gray-500 mt-2 max-w-sm">No tienes módulos asignados. Contacta al área de tecnología.</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default Herramientas;