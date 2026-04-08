import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, CheckCircle2, Activity, AlertTriangle, X, Filter as FilterIcon, Clock } from 'lucide-react';

import { FilterSidebar } from './DashboardComponents';
import Cartera from './Cartera';
import Seguirientos from './Seguimientos';
import Resultados from './Resultados';
import DatosDetallados from './DatosDetallados';
import Comercial from './Comercial';


import FileUploadButton from '../../components/FileUploadButton'; 

// --- 1. CUSTOM HOOK: useStateRef ---
function useStateRef(initialValue) {
    const [state, setState] = useState(initialValue);
    const ref = useRef(state);

    const dispatch = useCallback((value) => {
        ref.current = typeof value === 'function' ? value(ref.current) : value;
        setState(ref.current);
    }, []);

    return [state, dispatch, ref];
}

//  HELPER: Leer de sessionStorage de forma segura
function readSession(key, fallback) {
    try {
        const v = sessionStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch {
        return fallback;
    }
}

// HELPER: Escribir en sessionStorage de forma segura
function writeSession(key, value) {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch { /* quota exceeded — ignorar */ }
}

export default function Documents() {
    const { apiClient, permissions = [], user } = useAuth();
    const userPermissions = permissions.length > 0 ? permissions : (user?.permissions || []);

    //  CAMBIO: activeTab persiste entre recargas
    const [activeTab, setActiveTab] = useState(
        () => readSession('dashboard_activeTab', 'cartera')
    );

    //  CAMBIO: visitedTabs persiste entre recargas
    const [visitedTabs, setVisitedTabs] = useState(
        () => readSession('dashboard_visitedTabs', { cartera: true })
    );
    
    const [loading, setLoading] = useState(false);

    //  CAMBIO: selectedJobId persiste entre recargas
    const [selectedJobId, setSelectedJobId] = useState(
        () => readSession('dashboard_jobId', null)
    );

    //  CAMBIO: lastUpdateDate persiste entre recargas
    const [lastUpdateDate, setLastUpdateDate] = useState(
        () => readSession('dashboard_lastUpdate', null)
    );
    
    //  CAMBIO: moduleData se inicializa desde sessionStorage
    const [moduleData, setModuleData, moduleDataRef] = useStateRef(
        () => readSession('dashboard_moduleData', { 
            cartera: null,
            seguimientos: null, 
            resultados: null,
            call_center: null,
            comercial: null
        })
    );
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    const [selectedFilters, setSelectedFilters] = useState({ 
        Empresa: [], 
        CALL_CENTER_FILTRO: [], 
        Zona: [], 
        Regional_Cobro: [], 
        Franja_Cartera: [],
        Estado_Vigencia: [],
        Novedades: [],
        Tipo_Novedad: []
    });

    const hasActiveFilters = useMemo(() => {
        return Object.values(selectedFilters).some(filterArray => filterArray && filterArray.length > 0);
    }, [selectedFilters]);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeTab]);
    
    //  CAMBIO: Solo llamar a /reportes/activo si NO tenemos jobId ya guardado
    useEffect(() => {
        // Si ya tenemos un jobId (de sessionStorage o de estado previo), no pedimos de nuevo
        if (selectedJobId) return;

        let isMounted = true; 

        apiClient.get('/reportes/activo')
            .then((response) => {
                if (!isMounted) return;
                
                const data = response.data;
                const responseData = data?.data || data; 
                const id = responseData?.active_job_id || responseData?.job_id || data?.active_job_id;
                
                if (id) {
                    setSelectedJobId(id);
                    writeSession('dashboard_jobId', id); // ✅ Persistir
                    
                    const dateString = responseData?.fecha_actualizacion || responseData?.updated_at || responseData?.created_at;
                    
                    const date = new Date(dateString || Date.now()).toLocaleString('es-ES', { 
                        day: '2-digit', 
                        month: 'short', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });

                    setLastUpdateDate(date);
                    writeSession('dashboard_lastUpdate', date); // ✅ Persistir
                }
            })
            .catch(err => {
                if (isMounted) console.error("Error al obtener reporte activo:", err);
            });

        return () => { isMounted = false; };
    //  selectedJobId en dependencias: si ya tiene valor, el guard de arriba previene la llamada
    }, [apiClient, selectedJobId]); 

    // Carga diferida de pestañas
    useEffect(() => {
        if (!selectedJobId) return;

        let isMounted = true;
        const abortController = new AbortController();

        const loadTabData = async () => {
            if (['cartera', 'seguimientos', 'resultados', 'call_center', 'comercial'].includes(activeTab)) {
                
                if (!moduleDataRef.current[activeTab]) {
                    setLoading(true);
                    try {
                        const response = await apiClient.get(`/wallet/init/${activeTab}?job_id=${selectedJobId}`, {
                            signal: abortController.signal
                        });
                        
                        if (!isMounted) return;

                        const rawData = response.data?.data?.data || response.data?.data || response.data;
                        
                        // CAMBIO: Persistir moduleData en sessionStorage al actualizar
                        setModuleData(prev => {
                            const next = { ...prev, [activeTab]: rawData };
                            writeSession('dashboard_moduleData', next);
                            return next;
                        });

                    } catch (error) {
                        if (error.name === 'CanceledError' || error.message === 'canceled') {
                            console.log(`Petición cancelada para la pestaña: ${activeTab}`);
                            return; 
                        }

                        if (isMounted) {
                            console.error(`Error cargando datos de ${activeTab}:`, error);
                            setNotification({ type: 'error', message: `Error al cargar datos de ${activeTab}` });
                        }
                    } finally {
                        if (isMounted) setLoading(false);
                    }
                }
            }
        };

        loadTabData();

        return () => { 
            isMounted = false; 
            abortController.abort();
        };
        
    }, [activeTab, selectedJobId, apiClient]); 

    // Notificaciones del Upload
    const handleUploadStart = () => setNotification({ type: 'success', message: 'Iniciando carga...' });

    const handleUploadSuccess = (jobId) => {
        //  CAMBIO: Limpiar caché de datos al subir nuevo reporte
        sessionStorage.removeItem('dashboard_moduleData');
        sessionStorage.removeItem('dashboard_jobId');
        sessionStorage.removeItem('dashboard_lastUpdate');

        setSelectedJobId(jobId);
        writeSession('dashboard_jobId', jobId);

        const date = new Date().toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        setLastUpdateDate(date);
        writeSession('dashboard_lastUpdate', date);

        setModuleData({ cartera: null, seguimientos: null, resultados: null, call_center: null });
        setNotification({ type: 'success', message: 'Reporte procesado correctamente' });
    };

    const handleUploadError = (errorMessage) => setNotification({ type: 'error', message: errorMessage });

    // Optimización O(N) para Extracción de Filtros
    const filterOptions = useMemo(() => {
        const keys = [
            'Empresa', 'CALL_CENTER_FILTRO', 'Zona', 'Regional_Cobro', 
            'Franja_Cartera', 'Estado_Vigencia', 
            'Cantidad_Novedades', 'Tipo_Novedad' 
        ];
        
        const sets = {
            Empresa: new Set(),
            CALL_CENTER_FILTRO: new Set(),
            Zona: new Set(),
            Regional_Cobro: new Set(),
            Franja_Cartera: new Set(),
            Estado_Vigencia: new Set(),
            Cantidad_Novedades: new Set(), 
            Tipo_Novedad: new Set()        
        };

        const extractFilters = (dataArray) => {
            if (!dataArray || !Array.isArray(dataArray)) return;
            for (let i = 0; i < dataArray.length; i++) {
                const item = dataArray[i];
                for (let j = 0; j < keys.length; j++) {
                    const key = keys[j];
                    if (item[key] !== undefined && item[key] !== null && item[key] !== '') {
                        sets[key].add(item[key]);
                    }
                }
            }
        };

        if (moduleData.cartera) {
            extractFilters(moduleData.cartera.cubo_regional);
            extractFilters(moduleData.cartera.cubo_desembolso);
        }
        if (moduleData.seguimientos) {
            extractFilters(moduleData.seguimientos.donut_data);
        }

        const options = {};
        keys.forEach(key => {
            options[key] = Array.from(sets[key]).sort();
        });
        
        return options;
    }, [moduleData]);

    const handleFilterChange = useCallback((category, value) => {
        setSelectedFilters(prev => {
            const current = prev[category] || [];
            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [category]: next };
        });
    }, []);

    const handleClearFilters = useCallback(() => {
        setSelectedFilters({ 
            Empresa: [], 
            CALL_CENTER_FILTRO: [], 
            Zona: [], 
            Regional_Cobro: [], 
            Franja_Cartera: [], 
            Estado_Vigencia: [],
            Novedades: [],
            Tipo_Novedad: []
        });
    }, []);

    return (
        <AuthenticatedLayout title="Panel Cartera">
            <div className="min-h-screen flex flex-col relative w-full bg-[#041830]">
                
                {/* --- CAPA DE DISEÑO LLAMATIVO --- */}
                <div 
                    className="absolute inset-0 pointer-events-none opacity-60 z-0" 
                    style={{ 
                        backgroundImage: `
                            radial-gradient(circle at 50% 30%, rgba(34, 211, 238, 0.1) 0%, transparent 60%), 
                            radial-gradient(rgba(255, 255, 255, 0.04) 1.5px, transparent 1.5px)
                        `, 
                        backgroundSize: '100% 100%, 28px 28px' 
                    }}
                />
                
                {notification && (
                    <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 bg-slate-800 border border-white/10 p-4 rounded-2xl shadow-xl animate-in slide-in-from-right duration-300">
                        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertTriangle className="text-red-400" size={20} />}
                        <span className="text-[10px] font-black uppercase text-white">{notification.message}</span>
                        <X size={14} className="cursor-pointer text-slate-400 hover:text-white" onClick={() => setNotification(null)}/>
                    </div>
                )}
                
                {/* --- HEADER --- */}
                <header 
                    className="px-4 md:px-8 py-3.5 flex justify-between items-center sticky top-0 z-50 min-h-[5rem] gap-4 shadow-[0_4px_30px_rgba(0,0,0,0.3)] backdrop-blur-md border-b border-white/10 transition-all duration-300"
                    style={{ backgroundColor: 'rgba(4, 24, 48, 0.85)' }} 
                >
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(prev => !prev)} 
                            className={`
                                relative flex items-center gap-2 p-2.5 rounded-xl border transition-all duration-200 active:scale-95
                                ${hasActiveFilters 
                                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.15)]' 
                                    : isSidebarOpen 
                                        ? 'bg-white/20 text-white border-white/30' 
                                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                                }
                            `}
                        >
                            <div className="relative flex items-center">
                                <FilterIcon size={18} strokeWidth={2.5} className={hasActiveFilters ? "text-cyan-300" : ""} />
                                {hasActiveFilters && (
                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse" />
                                )}
                            </div>
                            <span className="hidden sm:inline text-[11px] font-bold tracking-wider uppercase">Filtros</span>
                        </button>
                        
                        <div className="h-8 w-px bg-white/10 hidden lg:block mx-2"></div>

                        <div className="hidden sm:flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                                <Activity className="text-cyan-400" size={18} strokeWidth={2.5}/>
                                <h1 className="text-sm font-black uppercase text-white tracking-widest leading-none drop-shadow-sm">
                                    Gestión Cartera
                                </h1>
                            </div>
                            
                            {lastUpdateDate && (
                                <div className="flex items-center gap-1.5 mt-1.5 opacity-90">
                                    <Clock size={11} className="text-cyan-300/80" />
                                    <span className="text-[10px] font-medium text-white/70 tracking-wide uppercase">
                                        Última act: <span className="text-white/90">{lastUpdateDate}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                        <div className="flex bg-black/20 p-1.5 rounded-xl shrink-0 items-center border border-white/5 shadow-inner">
                            {['cartera', 'seguimientos', 'detallados', 'resultados', 'comercial', 'call_center'].map(tab => (
                                <button 
                                    key={tab} 
                                    onClick={() => {
                                        setActiveTab(tab);
                                        writeSession('dashboard_activeTab', tab); // ✅ Persistir pestaña activa
                                        setVisitedTabs(prev => {
                                            if (prev[tab]) return prev;
                                            const next = { ...prev, [tab]: true };
                                            writeSession('dashboard_visitedTabs', next); // ✅ Persistir tabs visitadas
                                            return next;
                                        });
                                    }}
                                    className={`px-4 md:px-5 py-2 rounded-lg text-[10px] font-bold transition-all duration-300 whitespace-nowrap tracking-wider uppercase ${
                                        activeTab === tab 
                                            ? 'bg-white/15 text-white shadow-sm border border-white/20 backdrop-blur-sm' 
                                            : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {userPermissions.includes('general_report') && (
                            <div className="shrink-0">
                                <div className="hidden md:block">
                                    <FileUploadButton apiClient={apiClient} onUploadStart={handleUploadStart} onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />
                                </div>
                                <div className="md:hidden">
                                    <FileUploadButton apiClient={apiClient} onUploadStart={handleUploadStart} onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} iconOnly={true} className="bg-cyan-500 hover:bg-cyan-400 text-[#041830] p-2.5 rounded-xl transition-colors shadow-lg" />
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                
                <FilterSidebar 
                    options={filterOptions} selectedFilters={selectedFilters} 
                    onFilterChange={handleFilterChange} onClear={handleClearFilters} 
                    isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
                />
                
                <main className="flex-1 w-full p-4 md:p-8 relative z-10">
    {loading ? (
        <div className="h-96 w-full flex flex-col items-center justify-center bg-[#0a203f]/50 backdrop-blur-xl rounded-[3rem] shadow-2xl italic text-[10px] font-black text-cyan-200/70 uppercase tracking-widest border border-white/10">
            <RefreshCw className="animate-spin text-cyan-400 mb-4" size={32} /> Obteniendo datos...
        </div>
    ) : (
        <div className="space-y-12 pb-10 w-full">
            {/* Renderizado estricto: Si no es la pestaña activa, el componente NO existe */}
            {activeTab === 'detallados'   && <DatosDetallados apiClient={apiClient} jobId={selectedJobId} selectedFilters={selectedFilters} />}
         {activeTab === 'comercial' && moduleData.comercial && (
            <Comercial 
                data={moduleData.comercial} 
                selectedFilters={selectedFilters} 
                apiClient={apiClient} 
                jobId={selectedJobId} 
            />
        )}
            {activeTab === 'cartera'      && moduleData.cartera      && <Cartera data={moduleData.cartera} selectedFilters={selectedFilters} />}
            {activeTab === 'seguimientos' && moduleData.seguimientos && <Seguirientos data={moduleData.seguimientos} selectedFilters={selectedFilters} apiClient={apiClient} jobId={selectedJobId} />}
            {activeTab === 'resultados'   && moduleData.resultados   && <Resultados data={moduleData.resultados} selectedFilters={selectedFilters} apiClient={apiClient} jobId={selectedJobId}/>}
            
        </div>
    )}
</main>
            </div>
        </AuthenticatedLayout>
    );
}