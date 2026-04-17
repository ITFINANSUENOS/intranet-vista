import React, { useMemo } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/apiClient';
import { RefreshCw, CheckCircle2, Activity, AlertTriangle, X, Filter as FilterIcon, Clock } from 'lucide-react';

// Hooks y Servicios
import { useAnalisisDatos } from "../../hooks/useAnalisisDatos";

// Componentes de Interfaz
import { FilterSidebar } from './DashboardComponents';
import FileUploadButton from '../../components/FileUploadButton'; 
import Cartera from './Cartera';
import Seguirientos from './Seguimientos';
import Resultados from './Resultados';
import DatosDetallados from './DatosDetallados';
import Comercial from './Comercial';
import CallCenter from './CallCenter';

export default function Documents() {
    const { user, permissions = [] } = useAuth();
    const { state, actions } = useAnalisisDatos();

    // Determinar permisos de manera segura
    const userPermissions = permissions.length > 0 ? permissions : (user?.permissions || []);

    const hasActiveFilters = useMemo(() => 
        Object.values(state.selectedFilters).some(arr => arr && arr.length > 0)
    , [state.selectedFilters]);

    // Lógica central para filtrar los datos antes de enviarlos a los componentes
    const filteredData = useMemo(() => {
        const rawData = state.moduleData[state.activeTab];
        if (!rawData) return null;

        // Identificar qué filtros tienen valores seleccionados
        const activeFilterKeys = Object.keys(state.selectedFilters).filter(
            key => state.selectedFilters[key] && state.selectedFilters[key].length > 0
        );

        // Si no hay filtros activos, devolver la data original
        if (activeFilterKeys.length === 0) return rawData;

        // Determinar si los datos son un array directo o están dentro de una propiedad 'data'
        const isArray = Array.isArray(rawData);
        const dataArray = isArray ? rawData : (rawData.data || []);

        // Si la estructura no es un array iterable, devolvemos intacto por seguridad
        if (!Array.isArray(dataArray)) {
            return rawData;
        }

        // Aplicar el filtrado iterando sobre todas las llaves activas
        const filtered = dataArray.filter(item => {
            return activeFilterKeys.every(key => {
                const itemValue = String(item[key] || '');
                return state.selectedFilters[key].includes(itemValue);
            });
        });

        // Retornar preservando la estructura original esperada por los componentes
        return isArray ? filtered : { ...rawData, data: filtered };
    }, [state.moduleData, state.activeTab, state.selectedFilters]);

    // Funciones para manejar los eventos del Sidebar de Filtros
    const handleFilterChange = (key, value) => {
        actions.setSelectedFilters(prev => {
            const current = prev[key] || [];
            const updated = current.includes(value)
                ? current.filter(item => item !== value) // Si ya existe, lo quita
                : [...current, value];                   // Si no existe, lo agrega
            return { ...prev, [key]: updated };
        });
    };

    const handleClearFilters = () => {
        actions.setSelectedFilters({
            Empresa: [],
            CALL_CENTER_FILTRO: [],
            Zona: [],
            Regional_Cobro: [],
            Franja_Cartera: [],
            Estado_Vigencia: [],
            Novedades: [],
            Tipo_Novedad: []
        });
    };

    return (
        <AuthenticatedLayout title="Panel Cartera">
            <div className="min-h-screen flex flex-col relative w-full bg-[#041830] text-slate-200 font-sans selection:bg-cyan-500/30">
                
                {/* NOTIFICACIONES */}
                {state.notification && (
                    <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl animate-in slide-in-from-right duration-300 ${
                        state.notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                        {state.notification.type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle2 size={18}/>}
                        <p className="text-sm font-medium">{state.notification.message}</p>
                        <button onClick={() => actions.setNotification(null)} className="ml-2 hover:opacity-70"><X size={14}/></button>
                    </div>
                )}

                {/* HEADER Y NAVEGACIÓN */}
                <header className="sticky top-0 z-40 w-full bg-[#041830]/80 backdrop-blur-md border-b border-white/5 px-4 md:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                                <Activity className="text-cyan-400" size={24} />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white tracking-tight">Análisis de Datos</h1>
                                {state.lastUpdateDate && (
                                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                                        <Clock size={10} /> <span>Corte: {state.lastUpdateDate}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-center overflow-x-auto no-scrollbar">
                            {['cartera', 'seguimientos', 'detallados', 'resultados', 'comercial', 'call_center'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => actions.changeTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 capitalize whitespace-nowrap ${
                                        state.activeTab === tab 
                                        ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.replace('_', ' ')}
                                </button>
                            ))}
                        </nav>

                        <div className="flex items-center gap-3">
                            <FileUploadButton onUploadSuccess={actions.handleUploadSuccess} />
                            <button 
                                onClick={() => actions.setIsSidebarOpen(true)}
                                className={`p-2.5 rounded-xl border transition-all relative ${
                                    hasActiveFilters 
                                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400' 
                                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                                }`}
                            >
                                <FilterIcon size={20} />
                                {hasActiveFilters && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-500 rounded-full border-2 border-[#041830]" />}
                            </button>
                        </div>
                    </div>
                </header>

                {/* SIDEBAR DE FILTROS */}
                <FilterSidebar 
                    isOpen={state.isSidebarOpen}
                    onClose={() => actions.setIsSidebarOpen(false)}
                    selectedFilters={state.selectedFilters}
                    options={state.filterOptions}
                    onFilterChange={handleFilterChange}
                    onClear={handleClearFilters}
                />

                {/* CONTENIDO PRINCIPAL */}
                <main className="flex-1 w-full p-4 md:p-8 relative z-10 max-w-[1600px] mx-auto">
                    {state.loading ? (
                        <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-4">
                            <RefreshCw className="animate-spin text-cyan-400" size={32} />
                            <p className="text-sm font-medium animate-pulse">Sincronizando información...</p>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-10 w-full animate-in fade-in duration-500">
                            {state.activeTab === 'detallados' && (
                                <DatosDetallados 
                                    apiClient={apiClient} 
                                    jobId={state.selectedJobId} 
                                    selectedFilters={state.selectedFilters} 
                                />
                            )}
                            
                            {state.activeTab === 'comercial' && filteredData && (
                                <Comercial 
                                    data={filteredData} 
                                    selectedFilters={state.selectedFilters} 
                                    apiClient={apiClient} 
                                    jobId={state.selectedJobId} 
                                />
                            )}
                            
                            {state.activeTab === 'cartera' && filteredData && (
                                <Cartera 
                                    data={filteredData} 
                                    selectedFilters={state.selectedFilters} 
                                />
                            )}
                            
                            {state.activeTab === 'seguimientos' && filteredData && (
                                <Seguirientos 
                                    data={filteredData} 
                                    selectedFilters={state.selectedFilters} 
                                    apiClient={apiClient} 
                                    jobId={state.selectedJobId} 
                                />
                            )}
                            
                            {state.activeTab === 'resultados' && filteredData && (
                                <Resultados 
                                    data={filteredData} 
                                    selectedFilters={state.selectedFilters} 
                                    apiClient={apiClient} 
                                    jobId={state.selectedJobId}
                                />
                            )}
                            
                            {state.activeTab === 'call_center' && filteredData && (
                                <CallCenter 
                                    data={filteredData} 
                                    jobId={state.selectedJobId} 
                                    selectedFilters={state.selectedFilters} 
                                    apiClient={apiClient} 
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>
        </AuthenticatedLayout>
    );
}