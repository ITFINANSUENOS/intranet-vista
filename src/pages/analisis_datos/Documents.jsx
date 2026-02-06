import React, { useState, useEffect, useMemo } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, CheckCircle2, Activity, AlertTriangle, X, Filter as FilterIcon } from 'lucide-react';

// Importamos los componentes locales
import { FilterSidebar } from './DashboardComponents';
import Cartera from './Cartera';
import Seguirientos from './Seguimientos';
import Resultados from './Resultados';

// Importación del botón
import FileUploadButton from '../../components/FileUploadButton'; 

export default function Documents() {
    const { apiClient, permissions = [], user } = useAuth();
    const userPermissions = permissions.length > 0 ? permissions : (user?.permissions || []);

    const [activeTab, setActiveTab] = useState('cartera'); 
    const [loading, setLoading] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    
    const [moduleData, setModuleData] = useState({ 
        cartera: null, 
        seguimientos: null, 
        resultados: null 
    });
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    const [selectedFilters, setSelectedFilters] = useState({ 
        Empresa: [], 
        CALL_CENTER_FILTRO: [], 
        Zona: [], 
        Regional_Cobro: [], 
        Franja_Cartera: [] 
    });
    
    // --- CORRECCIÓN 1: Obtención robusta del ID ---
    useEffect(() => {
        apiClient.get('/reportes/activo')
            .then((response) => {
                // No desestructuramos inmediatamente para poder inspeccionar toda la respuesta
                const data = response.data;
                console.log("Respuesta /reportes/activo:", data);

                // Laravel a veces devuelve { data: { active_job_id: 123 } } y a veces directo { active_job_id: 123 }
                // Esta lógica cubre ambos casos:
                const responseData = data?.data || data; 
                const id = responseData?.active_job_id || responseData?.job_id || data?.active_job_id;

                if (id) {
                    console.log("ID encontrado:", id);
                    setSelectedJobId(id);
                } else {
                    console.error("No se encontró active_job_id en la respuesta", data);
                }
            })
            .catch(err => console.error("Error al obtener reporte activo:", err));
    }, [apiClient]);

    // --- CORRECCIÓN 2: Carga de módulos segura ---
    useEffect(() => {
        if (selectedJobId) {
            setLoading(true);
            const query = `?job_id=${selectedJobId}`;
            
            Promise.all([
                apiClient.get(`/wallet/init/cartera${query}`),
                apiClient.get(`/wallet/init/seguimientos${query}`),
                apiClient.get(`/wallet/init/resultados${query}`)
            ])
            .then(([resC, resS, resR]) => { 
                console.log("Datos Cartera:", resC.data);
                
                // Tu controlador WalletController devuelve: { data: $graficos }
                // Axios envuelve eso en otro 'data'. Así que resC.data.data son tus gráficos.
                // Si tus gráficos NO tienen otra propiedad 'data' dentro, resC.data.data.data será undefined.
                // Usamos "||" para intentar leerlo profundo, y si falla, leerlo un nivel antes.
                
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

    // Callbacks del botón de carga
    const handleUploadStart = () => {
         setNotification({ type: 'success', message: 'Iniciando carga...' });
    };

    const handleUploadSuccess = (jobId) => {
        setSelectedJobId(jobId);
        setNotification({ type: 'success', message: 'Reporte procesando correctamente' });
    };

    const handleUploadError = (errorMessage) => {
        setNotification({ type: 'error', message: errorMessage });
    };

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
        <AuthenticatedLayout title="Panel cartera">
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Notificaciones */}
                {notification && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border p-4 rounded-2xl shadow-xl">
                        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
                        <span className="text-[10px] font-black uppercase">{notification.message}</span>
                        <X size={14} className="cursor-pointer" onClick={() => setNotification(null)}/>
                    </div>
                )}
                
                {/* Header */}
                <header className="bg-white px-4 md:px-8 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40 h-auto md:h-20 gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)} 
                            className="md:hidden p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 shadow-sm active:scale-95 transition-transform"
                        >
                            <FilterIcon size={20} strokeWidth={2.5} />
                        </button>
                        
                        <Activity className="text-indigo-600 hidden md:block" size={24}/>
                        <div>
                            <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter leading-none">Gestion Cartera</h1>
                            {selectedJobId && (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded mt-1 inline-block border border-indigo-100">
                                    JOB: #{selectedJobId}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 overflow-x-auto pb-1 md:pb-0">
                        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                            {['cartera', 'seguimientos', 'resultados'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 md:px-6 py-2 rounded-lg text-[10px] font-black transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
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
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm italic text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} /> Cargando Datos...
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
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}