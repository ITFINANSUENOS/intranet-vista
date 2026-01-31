import React, { useState, useEffect, useMemo, useRef } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, CheckCircle2, Activity, UploadCloud, AlertTriangle, X, Filter as FilterIcon } from 'lucide-react'; // Cambiado Menu por FilterIcon

// Importamos los componentes modularizados
import { FilterSidebar } from './DashboardComponents';
import Cartera from './Cartera';
import Seguirientos from './Seguimientos';
import Resultados from './Resultados';

export default function Documents() {
    const { apiClient, permissions = [], user } = useAuth();
    const userPermissions = permissions.length > 0 ? permissions : (user?.permissions || []);

    const [activeTab, setActiveTab] = useState('cartera'); 
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
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
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        apiClient.get('/reportes/activo').then(({ data }) => {
            const id = data?.active_job_id || data?.job_id;
            if (id) setSelectedJobId(id);
        });
    }, [apiClient]);

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
                setModuleData({ 
                    cartera: resC.data.data.data, 
                    seguimientos: resS.data.data.data,
                    resultados: resR.data.data 
                }); 
                setLoading(false); 
            })
            .catch((err) => {
                console.error("Error cargando datos:", err);
                setLoading(false);
            });
        }
    }, [selectedJobId, apiClient]);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const { data: signRes } = await apiClient.post('/reportes/generar-url', { filename: file.name, content_type: file.type });
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signRes.upload_url);
            xhr.setRequestHeader('Content-Type', file.type);
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const { data: procRes } = await apiClient.post('/reportes/iniciar-procesamiento', { file_key: signRes.file_key, empresa: 'FINANSUENOS' });
                    setSelectedJobId(procRes.job_id);
                    setNotification({ type: 'success', message: 'Reporte procesando...' });
                    setIsUploading(false);
                }
            };
            xhr.send(file);
        } catch (error) { setIsUploading(false); setNotification({ type: 'error', message: 'Error al subir' }); }
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
                {notification && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border p-4 rounded-2xl shadow-xl">
                        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
                        <span className="text-[10px] font-black uppercase">{notification.message}</span>
                        <X size={14} className="cursor-pointer" onClick={() => setNotification(null)}/>
                    </div>
                )}
                
                <header className="bg-white px-4 md:px-8 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40 h-auto md:h-20 gap-4">
                    <div className="flex items-center gap-3">
                        {/* BOTÓN CAMBIADO: Ahora muestra un ícono de FILTRO en lugar de hamburguesa */}
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
                                <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-1 inline-block">
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
                                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="hidden md:flex bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 whitespace-nowrap">
                                    {isUploading ? <RefreshCw className="animate-spin" size={14}/> : <UploadCloud size={14}/>} {isUploading ? 'SUBIENDO...' : 'CARGAR BASE'}
                                </button>
                                <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="md:hidden p-2 bg-indigo-600 text-white rounded-xl">
                                    <UploadCloud size={18}/>
                                </button>
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