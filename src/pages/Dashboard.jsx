// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext'; 
import { 
    UsersIcon, BriefcaseIcon, LightBulbIcon, 
    ClipboardDocumentListIcon, ChevronLeftIcon, 
    ChevronRightIcon, ChartBarIcon, DocumentTextIcon,
    CalendarDaysIcon, RocketLaunchIcon,
    CubeIcon, QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'; 
import { motion } from 'framer-motion'; 

// Importación de componentes SSO existentes
import { InventorySsoButton } from "../components/sso/InventorySsoButton";
import { HelpSsoButton } from "../components/sso/HelpSsoButton";

const PRIMARY_COLOR_CLASS = 'text-[rgb(5,25,49)]'; 
const BG_PRIMARY_DARK = 'bg-[rgb(5,25,49)]';

const getBaseUrl = (apiClient) => apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace('/api', '') : 'http://localhost:8000';

// --- COMPONENTE PRINCIPAL ---
export default function Dashboard() {
    const { apiClient, user } = useAuth();
    const navigate = useNavigate();
    const IMAGE_BASE_URL = getBaseUrl(apiClient);
    const [newsList, setNewsList] = useState([]);
    const [objectivesList, setObjectivesList] = useState([]);
    const [eventsList, setEventsList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [news, obj, ev] = await Promise.all([
                    apiClient.get('/news'),
                    apiClient.get('/objectives'),
                    apiClient.get('/events'),
                ]);
                setNewsList(news.data || []);
                setObjectivesList(obj.data?.slice(0, 5) || []);
                setEventsList(ev.data?.slice(0, 5) || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [apiClient]);

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-900 italic">Cargando dashboard empresarial...</div>;

    // Estilo común para los botones grandes tipo tarjeta
    const actionButtonStyle = `w-full flex items-center justify-between px-6 py-4 ${BG_PRIMARY_DARK} hover:bg-opacity-90 text-white rounded-2xl transition-all shadow-md group border border-transparent`;

    return (
        <AuthenticatedLayout title="Panel de Control">
            <div className="py-12 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* BIENVENIDA Y ACCESOS RÁPIDOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
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
                                Central de gestión: monitorea indicadores estratégicos y mantente al día con los eventos institucionales.
                            </p>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
                        >
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                                 Accesos Rápidos
                            </h3>
                            
                            <div className="space-y-4">
                                {/* Botón Monitor Estratégico */}
                                <button onClick={() => navigate('/analisis_datos/Documents')} className={actionButtonStyle}>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-2 rounded-lg"><ChartBarIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" /></div>
                                        <span className="font-bold text-lg">Cartera</span>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-white/70" />
                                </button>

                                {/* Botón Carga Datacrédito */}
                                <button onClick={() => navigate('/analisis_datos/DatacreditoProcessingPage')} className={actionButtonStyle}>
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/10 p-2 rounded-lg"><DocumentTextIcon className="w-6 h-6 text-white group-hover:scale-110 transition-transform" /></div>
                                        <span className="font-bold text-lg">Carga Datacrédito</span>
                                    </div>
                                    <ChevronRightIcon className="w-5 h-5 text-white/70" />
                                </button>

                                {/* Botones SSO (Inyectando el estilo similar) */}
                               <div className="grid grid-cols-1 gap-4">
                                    {user?.permissions?.includes('view_inventory') && (
                                        <InventorySsoButton className={actionButtonStyle} />
                                    )}
                                    
                                    {user?.permissions?.includes('view_help_desk') && (
                                        <HelpSsoButton className={actionButtonStyle} />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    

                    

                    {/* SECCIÓN: OBJETIVOS Y EVENTOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Lista de Objetivos */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <LightBulbIcon className="w-7 h-7 text-yellow-500" /> Objetivos del Periodo
                            </h3>
                            <div className="space-y-4">
                                {objectivesList.length > 0 ? objectivesList.map((obj) => (
                                    <div key={obj.id} className="p-5 border border-gray-100 bg-gray-50/50 rounded-2xl hover:bg-white hover:shadow-md transition-all border-l-4 border-l-blue-900">
                                        <h4 className="font-bold text-gray-800">{obj.title}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                    </div>
                                )) : <p className="text-gray-400 italic">No hay objetivos registrados.</p>}
                            </div>
                        </motion.div>

                        {/* Lista de Eventos */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <CalendarDaysIcon className="w-7 h-7 text-blue-600" /> Próximos Eventos
                            </h3>
                            <div className="space-y-4">
                                {eventsList.length > 0 ? eventsList.map((ev) => (
                                    <div key={ev.id} className="flex items-center gap-5 p-4 border border-gray-50 bg-gray-50/50 rounded-2xl">
                                        <div className="bg-blue-900 text-white p-3 rounded-xl font-bold text-center min-w-[70px] shadow-sm">
                                            <span className="block text-[10px] uppercase opacity-80">Evento</span>
                                            <span className="text-lg"># {ev.id}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-800">{ev.title}</h4>
                                            <p className="text-xs text-blue-600 font-semibold">{ev.date || 'Pendiente de fecha'}</p>
                                        </div>
                                    </div>
                                )) : <p className="text-gray-400 italic">Sin eventos próximos.</p>}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}



