import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, CheckCircle2, Activity, AlertTriangle, X, Filter as FilterIcon, FileText, ShoppingBag } from 'lucide-react';

// Importamos los componentes locales
import { FilterSidebar } from './DashboardComponents';
import Cartera from './Cartera';
import Seguirientos from './Seguimientos';
import Resultados from './Resultados';
import DatosDetallados from './DatosDetallados';
import Comercial from './Comercial'; 

// Importación del botón
import FileUploadButton from '../../components/FileUploadButton'; 

export default function Documents() {
    const { apiClient, permissions = [], user } = useAuth();
    const userPermissions = permissions.length > 0 ? permissions : (user?.permissions || []);

    // Estado de la pestaña activa
    const [activeTab, setActiveTab] = useState('cartera'); 
    
    // Estados generales
    const [loading, setLoading] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [moduleData, setModuleData] = useState({ 
        cartera: null, 
        seguimientos: null, 
        resultados: null 
    });
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    // Filtros seleccionados
    const [selectedFilters, setSelectedFilters] = useState({ 
        Empresa: [], 
        CALL_CENTER_FILTRO: [], 
        Zona: [], 
        Regional_Cobro: [], 
        Franja_Cartera: [] 
    });
    
    // --- 1. Obtener ID del Reporte Activo ---
    useEffect(() => {
        apiClient.get('/reportes/activo')
            .then((response) => {
                const data = response.data;
                const responseData = data?.data || data; 
                const id = responseData?.active_job_id || responseData?.job_id || data?.active_job_id;

                if (id) {
                    setSelectedJobId(id);
                } else {
                    console.error("No se encontró active_job_id en la respuesta", data);
                }
            })
            .catch(err => console.error("Error al obtener reporte activo:", err));
    }, [apiClient]);

    // --- 2. Cargar datos de las gráficas (Cartera, Seguimientos, Resultados) ---
    useEffect(() => {
        if (selectedJobId) {
            // No mostramos loading si navegamos a pestañas que tienen su propia carga (Detallados/Comercial)
            if (activeTab !== 'detallados' && activeTab !== 'comercial') {
                setLoading(true);
            }
            
            const query = `?job_id=${selectedJobId}`;
            
            Promise.all([
                apiClient.get(`/wallet/init/cartera${query}`),
                apiClient.get(`/wallet/init/seguimientos${query}`),
                apiClient.get(`/wallet/init/resultados${query}`)
            ])
            .then(([resC, resS, resR]) => { 
                setModuleData({ 
                    cartera:      resC.data?.data?.data || resC.data?.data, 
                    seguimientos: resS.data?.data?.data || resS.data?.data,
                    resultados:   resR.data?.data?.data || resR.data?.data 
                }); 
                setLoading(false); 
            })
            .catch((err) => {
                console.error("Error cargando datos de gráficas:", err);
                setLoading(false);
            });
        }
    }, [selectedJobId, apiClient]); 

    // --- Callbacks de Carga de Archivo ---
    const handleUploadStart = () => {
         setNotification({ type: 'success', message: 'Iniciando carga...' });
    };

    const handleUploadSuccess = (jobId) => {
        setSelectedJobId(jobId);
        setNotification({ type: 'success', message: 'Reporte procesado correctamente' });
    };

    const handleUploadError = (errorMessage) => {
        setNotification({ type: 'error', message: errorMessage });
    };

    // --- Opciones de Filtros Dinámicos ---
    const filterOptions = useMemo(() => {
        const raw = moduleData.cartera;
        const rawSeg = moduleData.seguimientos;
        if (!raw || !rawSeg) return {};
        
        const keys = ['Empresa', 'CALL_CENTER_FILTRO', 'Zona', 'Regional_Cobro', 'Franja_Cartera'];
        const options = {};
        
        keys.forEach(key => {
            const allValues = [
                ...(raw.cubo_regional || []), 
                ...(raw.cubo_desembolso || []), 
                ...(rawSeg.donut_data || [])
            ].map(item => item[key]).filter(Boolean);
            options[key] = [...new Set(allValues)].sort();
        });
        return options;
    }, [moduleData]);

    const handleFilterChange = (category, value) => {
        setSelectedFilters(prev => {
            const current = prev[category] || [];
            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [category]: next };
        });
    };

    return (
        <AuthenticatedLayout title="Panel Cartera">
            <div className="min-h-screen bg-slate-50 flex flex-col">
                
                {/* Notificaciones Flotantes */}
                {notification && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border p-4 rounded-2xl shadow-xl animate-in slide-in-from-right duration-300">
                        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
                        <span className="text-[10px] font-black uppercase text-slate-700">{notification.message}</span>
                        <X size={14} className="cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => setNotification(null)}/>
                    </div>
                )}
                
                {/* Header Principal */}
                <header className="bg-white px-4 md:px-8 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40 h-auto md:h-20 gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="md:hidden p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 shadow-sm active:scale-95 transition-transform"
                        >
                            <FilterIcon size={20} strokeWidth={2.5} />
                        </button>
                        
                        <Activity className="text-indigo-600 hidden md:block" size={24}/>
                        <div>
                            <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter leading-none">Gestión Cartera</h1>
                            {selectedJobId && (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-100">
                                    JOB: #{selectedJobId}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    {/* Barra de Navegación (Pestañas) */}
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 items-center">
                            {['cartera', 'seguimientos', 'resultados'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => setActiveTab(tab)} 
                                    className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${
                                        activeTab === tab 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                            
                            {/* BOTÓN DETALLADOS (AHORA ANTES DE COMERCIAL) */}
                            <button 
                                onClick={() => setActiveTab('detallados')} 
                                className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'detallados' 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <FileText size={14} /> DETALLADOS
                            </button>

                             {/* --- BOTÓN COMERCIAL (MOVIDO AL FINAL) --- */}
                             <button 
                                onClick={() => setActiveTab('comercial')} 
                                className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap flex items-center gap-2 ${
                                    activeTab === 'comercial' 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                            >
                                <ShoppingBag size={14} /> COMERCIAL
                            </button>
                        </div>

                        {userPermissions.includes('general_report') && (
                            <>
                                <div className="hidden md:block">
                                    <FileUploadButton 
                                        apiClient={apiClient}
                                        onUploadStart={handleUploadStart}
                                        onUploadSuccess={handleUploadSuccess}
                                        onUploadError={handleUploadError}
                                    />
                                </div>
                                <div className="md:hidden">
                                    <FileUploadButton 
                                        apiClient={apiClient}
                                        onUploadStart={handleUploadStart}
                                        onUploadSuccess={handleUploadSuccess}
                                        onUploadError={handleUploadError}
                                        iconOnly={true}
                                        className="bg-indigo-600 text-white p-2 rounded-xl"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </header>

                <div className="flex flex-row flex-1 relative">
                    <FilterSidebar 
                        options={filterOptions} 
                        selectedFilters={selectedFilters} 
                        onFilterChange={handleFilterChange} 
                        onClear={() => setSelectedFilters({ Empresa: [], CALL_CENTER_FILTRO: [], Zona: [], Regional_Cobro: [], Franja_Cartera: [] })} 
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                    />
                    
                    <main className="flex-1 p-4 md:p-8 min-w-0 overflow-x-hidden">
                        
                        {loading && activeTab !== 'detallados' && activeTab !== 'comercial' ? (
                            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm italic text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
                                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} /> Cargando Tablero...
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {activeTab === 'cartera' && moduleData.cartera && (
                                    <Cartera data={moduleData.cartera} selectedFilters={selectedFilters} />
                                )}
                                
                                {activeTab === 'seguimientos' && moduleData.seguimientos && (
                                    <Seguirientos data={moduleData.seguimientos} selectedFilters={selectedFilters} apiClient={apiClient} jobId={selectedJobId} />
                                )}

                                {activeTab === 'resultados' && moduleData.resultados && (
                                    <Resultados data={moduleData.resultados} selectedFilters={selectedFilters} apiClient={apiClient} jobId={selectedJobId}/>
                                )}

                                {/* --- RENDERIZADO DETALLADOS (PERSISTENTE) --- */}
                                <div className={activeTab === 'detallados' ? 'block' : 'hidden'}>
                                    <DatosDetallados 
                                        apiClient={apiClient} 
                                        jobId={selectedJobId} 
                                        selectedFilters={selectedFilters} 
                                    />
                                </div>

                                {/* --- RENDERIZADO COMERCIAL (PERSISTENTE - SE CARGA AL INICIO) --- */}
                                <div className={activeTab === 'comercial' ? 'block' : 'hidden'}>
                                    <Comercial 
                                        apiClient={apiClient}
                                        jobId={selectedJobId}
                                        selectedFilters={selectedFilters}
                                    />
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}