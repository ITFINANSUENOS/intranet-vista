// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext'; 
import { dashboardService } from '../services/dashboardService'; // Importamos el servicio
import { 
    ChevronRightIcon, 
    ChartBarIcon, 
    DocumentTextIcon 
} from '@heroicons/react/24/outline'; 
import { motion } from 'framer-motion'; 

// Importación de componentes SSO existentes
import { InventorySsoButton } from "../components/sso/InventorySsoButton";
import { HelpSsoButton } from "../components/sso/HelpSsoButton";

const PRIMARY_COLOR_CLASS = 'text-[rgb(5,25,49)]'; 
const BG_PRIMARY_DARK = 'bg-[rgb(5,25,49)]';

export default function Dashboard() {
    // 1. Extraemos SOLO el usuario del contexto. La vista no necesita saber de apiClient.
    const { user } = useAuth(); 
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [newsData, setNewsData] = useState(null); // Guardamos la data si a futuro la muestras

    // 2. Efecto para cargar los datos usando el SERVICIO, no Axios directamente
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Delegamos la responsabilidad de la red a la capa de servicios
                const data = await dashboardService.getNews();
                setNewsData(data);
            } catch (error) {
                // Aquí podrías manejar un estado de error si lo deseas
                console.warn("No se pudieron cargar las noticias del dashboard");
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    // 3. Renderizado de estado de carga
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-blue-900 italic">
                Cargando dashboard corporativo...
            </div>
        );
    }

    const actionButtonStyle = `w-full h-[72px] flex items-center justify-between px-6 ${BG_PRIMARY_DARK} hover:bg-opacity-90 text-white rounded-2xl transition-all shadow-md group border border-transparent`;

    return (
        <AuthenticatedLayout title="Panel de Control">
            <div className="py-12 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                        {/* BIENVENIDA */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-2 h-full bg-[rgb(5,25,49)]"></div>
                            <h1 className="text-4xl font-extrabold text-gray-900">
                                ¡Bienvenido, <span className={PRIMARY_COLOR_CLASS}>{user?.name || 'Usuario'}</span>!
                            </h1>
                            <p className="text-lg text-gray-500 mt-4 max-w-lg">
                                Central de gestión: monitorea indicadores estratégicos y mantente al día.
                            </p>
                        </motion.div>

                        {/* ACCESOS RÁPIDOS */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                 Accesos Rápidos
                            </h3>
                            
                            <div className="flex flex-col gap-4">
                                {/* Gestión Cartera - Validado con permisos */}
                                {user?.permissions?.includes('view_documents') && (
                                    <button onClick={() => navigate('/analisis_datos/Documents')} className={actionButtonStyle}>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-2 rounded-xl">
                                                <ChartBarIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-bold text-lg tracking-tight">Gestión Cartera</span>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                    </button>
                                )}

                                {/* Carga Datacrédito - Validado con permisos */}
                                {user?.permissions?.includes('view_datacredito') && (
                                    <button onClick={() => navigate('/analisis_datos/DatacreditoProcessingPage')} className={actionButtonStyle}>
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/10 p-2 rounded-xl">
                                                <DocumentTextIcon className="w-6 h-6 text-white" />
                                            </div>
                                            <span className="font-bold text-lg tracking-tight">Carga Datacrédito</span>
                                        </div>
                                        <ChevronRightIcon className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
                                    </button>
                                )}

                                {/* SSO Buttons */}
                                {user?.permissions?.includes('view_inventory') && (
                                    <InventorySsoButton className={actionButtonStyle} />
                                )}
                                
                                {user?.permissions?.includes('view_help_desk') && (
                                    <HelpSsoButton className={actionButtonStyle} />
                                )}
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}