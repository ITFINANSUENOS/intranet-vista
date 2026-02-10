import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
    RefreshCw, AlertCircle, TrendingUp, Users, SearchX, Trophy, 
    Database, Columns, X, Loader2, Clock, AlertTriangle, XCircle, Filter
} from 'lucide-react';

// Asegúrate de que la ruta sea correcta a tu configuración de colores
import { COLOR_MAP, DEFAULT_COLORS } from './DashboardComponents';

// ==========================================
// 1. CONFIGURACIÓN COLUMNAS RETANQUEOS
// ==========================================
const COLUMNAS_RETANQUEO_15 = [
    "Credito",
    "Nombre_Cliente",
    "Celular",
    "Total_Cuotas",
    "Cuotas_Pagadas",
    "Cuotas_Restantes",
    "Dias_Atraso_Final",
    "Nombre_Vendedor",
    "Cedula_Cliente",
    "Valor_Desembolso",
    "Meta_Saldo",
    "Direccion",
    "Vendedor_Activo",
    "Nombre_Producto",
    "Regional_Venta"
];

// ==========================================
// 2. CONFIGURACIÓN COLUMNAS COSECHAS
// ==========================================
const COLUMNAS_COSECHA_INICIALES = [
    "Credito",
    "Cedula_Cliente",
    "Nombre_Cliente",
    "Celular",
    "Direccion",
    "Fecha_Desembolso",
    "Valor_Desembolso",
    "Cuotas_Pagadas",
    "Primera_Cuota_Mora",
    "Fecha_Ultimo_pago",
    "Cuota_Vigente",
    "Total_Cuotas",
    "Dias_Atraso_Final",
    "Valor_Vencido",
    "Nombre_Vendedor"
];

// ==========================================
// 3. COMPONENTE DE TABLA REMOTA CON FILTROS
// ==========================================
const TablaComercialRemota = ({ 
    apiClient, 
    jobId, 
    origen, 
    titulo, 
    icono: Icono, 
    canLoad, 
    onLoadComplete, 
    colorBadge, 
    initialColumns = [],
    filterableColumns = [] // Nueva propiedad para definir filtros
}) => {
    // Estados de datos
    const [fullData, setFullData] = useState([]); 
    const [columns, setColumns] = useState([]); 
    const [visibleColumns, setVisibleColumns] = useState([]); 
    
    // Estados de control
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); 
    
    // Estados de UI
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    
    // Estados de Filtros
    const [activeFilters, setActiveFilters] = useState({});

    // --- CARGA DE DATOS ---
    const fetchData = useCallback(async () => {
        if (!jobId) return;
        
        setLoading(true);
        try {
            const response = await apiClient.post('/wallet/buscar', {
                job_id: jobId,
                origen: origen, 
                page: 1,           
                page_size: 100000, 
                filters: {} 
            });

            const responseData = response.data?.data || [];

            if (responseData.length > 0) {
                const detectedCols = Object.keys(responseData[0]);
                
                if (columns.length === 0) {
                    setColumns(detectedCols);
                    
                    if (initialColumns && initialColumns.length > 0) {
                        const orderedVisibleCols = initialColumns.filter(col => detectedCols.includes(col));
                        if (orderedVisibleCols.length > 0) {
                            setVisibleColumns(orderedVisibleCols);
                        } else {
                            setVisibleColumns(detectedCols);
                        }
                    } else {
                        setVisibleColumns(detectedCols);
                    }
                }
            }
            setFullData(responseData);
            setDataLoaded(true);

        } catch (err) {
            console.error(`Error cargando tabla ${origen}:`, err);
            setDataLoaded(true); 
        } finally {
            setLoading(false);
            if (onLoadComplete) {
                onLoadComplete();
            }
        }
    }, [jobId, origen, apiClient, columns.length, onLoadComplete, initialColumns]);

    // EFECTO DE CARGA CONTROLADA
    useEffect(() => {
        if (jobId && canLoad && !dataLoaded && !loading) {
            fetchData();
        }
    }, [jobId, canLoad, dataLoaded, loading, fetchData]);

    // --- LÓGICA DE FILTROS ---
    
    // 1. Extraer opciones únicas para los selectores
    const filterOptions = useMemo(() => {
        if (!fullData || fullData.length === 0 || filterableColumns.length === 0) return {};
        
        const options = {};
        filterableColumns.forEach(col => {
            // Extraemos valores únicos, filtramos nulos/vacíos y ordenamos
            const uniqueValues = [...new Set(fullData.map(item => item[col]).filter(val => val !== null && val !== undefined && val !== ''))].sort();
            options[col] = uniqueValues;
        });
        return options;
    }, [fullData, filterableColumns]);

    // 2. Aplicar filtros a los datos
    const filteredData = useMemo(() => {
        return fullData.filter(item => {
            // Verifica que el ítem cumpla con TODOS los filtros activos
            return Object.entries(activeFilters).every(([key, value]) => {
                if (!value) return true; // Si el filtro está vacío ("Todos"), pasa
                return String(item[key]) === String(value);
            });
        });
    }, [fullData, activeFilters]);

    // 3. Handler para cambiar filtros
    const handleFilterChange = (col, value) => {
        setActiveFilters(prev => ({
            ...prev,
            [col]: value
        }));
    };

    // --- HANDLERS UI ---
    const toggleColumnVisibility = (col) => {
        setVisibleColumns(prev => 
            prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
        );
    };

    return (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-4 transition-all duration-500">
            
            {/* HEADER */}
            <div className="p-6 border-b border-slate-50 flex flex-col gap-4">
                
                {/* Título y Controles Principales */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${canLoad ? (colorBadge || 'bg-indigo-50 text-indigo-600') : 'bg-slate-100 text-slate-400'}`}>
                            {Icono ? <Icono size={18} /> : <Database size={18} />}
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">
                                {titulo}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {!canLoad 
                                    ? 'En cola de espera...' 
                                    : loading 
                                        ? 'Cargando datos...' 
                                        : `Mostrando: ${filteredData.length} de ${fullData.length}`
                                }
                            </p>
                        </div>
                    </div>

                    {canLoad && (
                        <div className="relative">
                            <button 
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                                disabled={!dataLoaded}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-[10px] font-bold text-slate-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                            >
                                <Columns size={14} /> Columnas
                            </button>
                            
                            {showColumnSelector && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-3 z-50 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-50">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Mostrar/Ocultar</span>
                                        <X size={14} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => setShowColumnSelector(false)} />
                                    </div>
                                    {columns.map(col => (
                                        <label key={col} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumns.includes(col)} 
                                                onChange={() => toggleColumnVisibility(col)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                            />
                                            <span className="text-[10px] text-slate-600 font-medium truncate" title={col}>{col}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* BARRA DE FILTROS (Si hay columnas filtrables definidas y datos cargados) */}
                {filterableColumns.length > 0 && dataLoaded && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-50 animate-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 text-slate-400 mr-2">
                            <Filter size={14} />
                            <span className="text-[10px] font-bold uppercase">Filtrar por:</span>
                        </div>
                        {filterableColumns.map(col => (
                            <div key={col} className="flex flex-col gap-1 min-w-[150px]">
                                <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all cursor-pointer"
                                    value={activeFilters[col] || ''}
                                    onChange={(e) => handleFilterChange(col, e.target.value)}
                                >
                                    <option value="">Todo: {col.replace(/_/g, ' ')}</option>
                                    {filterOptions[col]?.map((opt, idx) => (
                                        <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                        {/* Botón para limpiar filtros si hay alguno activo */}
                        {Object.values(activeFilters).some(v => v) && (
                            <button 
                                onClick={() => setActiveFilters({})}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-[10px] font-bold transition-colors"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* BODY */}
            <div className="overflow-auto custom-scrollbar relative max-h-[500px] bg-slate-50/30 min-h-[150px]">
                
                {/* ESTADO: ESPERA */}
                {!canLoad && (
                    <div className="absolute inset-0 bg-white z-20 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-slate-300">
                            <Clock size={32} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Esperando turno...</span>
                        </div>
                    </div>
                )}

                {/* ESTADO: CARGANDO */}
                {loading && (
                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                            <span className="text-[10px] font-bold text-indigo-600">Cargando...</span>
                        </div>
                    </div>
                )}

                {/* TABLA DE DATOS */}
                <table className="w-full text-[10px] border-collapse relative">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm ring-1 ring-slate-200/50">
                        <tr>
                            {visibleColumns.length > 0 ? visibleColumns.map(col => (
                                <th key={col} className="p-3 text-left min-w-[150px] border-b border-slate-200 bg-slate-50">
                                    <span className="font-black text-slate-500 uppercase tracking-wider truncate block" title={col}>
                                        {col.replace(/_/g, ' ')}
                                    </span>
                                </th>
                            )) : (
                                <th className="p-3 text-left bg-slate-50 text-slate-300 italic font-medium">
                                    {loading ? '...' : 'Sin datos'}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredData.length > 0 ? (
                            filteredData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/10 transition-colors">
                                    {visibleColumns.map(col => (
                                        <td key={`${idx}-${col}`} className="p-3 text-slate-600 border-r border-transparent truncate max-w-[200px]" title={row[col]}>
                                            {row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            !loading && dataLoaded && (
                                <tr>
                                    <td colSpan={visibleColumns.length || 1} className="p-12 text-center text-slate-400 italic">
                                        {fullData.length > 0 
                                            ? 'No hay registros que coincidan con los filtros seleccionados.' 
                                            : 'No se encontraron resultados en la base de datos.'}
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-2 border-t border-slate-100 bg-slate-50 text-right">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider pr-4">Fin de Tabla</span>
            </div>
        </div>
    );
};

// ==========================================
// 4. COMPONENTE PRINCIPAL
// ==========================================

const findKeyInObject = (obj, targetKey) => {
    if (!obj || typeof obj !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(obj, targetKey)) return obj[targetKey];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const child = obj[key];
            if (typeof child === 'object') {
                const result = findKeyInObject(child, targetKey);
                if (result) return result;
            }
        }
    }
    return null;
};

const Comercial = ({ apiClient, jobId, selectedFilters }) => {
    // --- ESTADOS ---
    const [data, setData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const [error, setError] = useState(null);

    // --- SECUENCIA DE CARGA ---
    const [loadStep, setLoadStep] = useState(0); 
    
    // --- CARGA DE GRÁFICOS ---
    useEffect(() => {
        if (!jobId) return;

        setLoadingCharts(true);
        setError(null);
        setData([]); 
        setLoadStep(0); 

        apiClient.get(`/wallet/init/comercial`, { 
            params: { job_id: jobId, ...selectedFilters } 
        })
        .then(response => {
            const foundData = findKeyInObject(response.data, 'fnz_resumen');
            setData(Array.isArray(foundData) ? foundData : []);
        })
        .catch(err => {
            console.error("Error comercial:", err);
            setError("Error cargando resumen.");
        })
        .finally(() => {
            setLoadingCharts(false);
            setLoadStep(1); // Inicia cascada
        });
    }, [jobId, apiClient, selectedFilters]);

    // Función para avanzar paso a paso
    const handleStepComplete = useCallback((currentStep) => {
        setLoadStep(prev => {
            if (prev === currentStep) return prev + 1;
            return prev;
        });
    }, []);

    // --- PROCESAMIENTO PIVOTE (GRÁFICOS) ---
    const useChartData = (rawData) => {
        if (!rawData || rawData.length === 0) return { processedData: [], uniqueStates: [], totals: {} };

        const statesSet = new Set();
        const grouped = {};

        rawData.forEach(item => {
            const vendedor = item.Nombre_Vendedor || item.nombre_vendedor || 'SIN VENDEDOR';
            const estado = String(item.Estado || item.estado || 'SIN ESTADO').toUpperCase().trim();
            statesSet.add(estado);
            if (!grouped[vendedor]) grouped[vendedor] = { name: vendedor, total: 0 };
            grouped[vendedor][estado] = (grouped[vendedor][estado] || 0) + 1;
            grouped[vendedor].total += 1;
        });

        const uniqueStates = Array.from(statesSet).sort();
        const processedData = Object.values(grouped).sort((a, b) => b.total - a.total);
        const totals = { total: 0 };
        uniqueStates.forEach(s => totals[s] = 0);
        processedData.forEach(row => {
            totals.total += row.total;
            uniqueStates.forEach(s => { if (row[s]) totals[s] += row[s]; });
        });

        return { processedData, uniqueStates, totals };
    };

    const { processedData, uniqueStates, totals } = React.useMemo(() => useChartData(data), [data]);
    const chartData = React.useMemo(() => processedData.slice(0, 15), [processedData]);

    if (loadingCharts) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-pulse">
                <RefreshCw className="animate-spin mb-4 text-indigo-600" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Analizando Datos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-4 text-red-600">
                <AlertCircle size={24} />
                <span className="font-bold text-xs">{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 fade-in">
            
            {/* SECCIÓN 1: GRÁFICOS Y RESUMEN */}
            {processedData.length > 0 ? (
                <>
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                <Trophy size={16} className="text-amber-500"/> Top 15 Vendedores
                            </h3>
                            <div className="hidden md:flex gap-2">
                                {uniqueStates.slice(0, 4).map((state, idx) => (
                                    <div key={state} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_MAP[state] || DEFAULT_COLORS[idx] }}></span>
                                        <span className="text-[9px] font-bold text-slate-600">{state}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} height={70} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                                    {uniqueStates.map((state, index) => (
                                        <Bar key={state} dataKey={state} stackId="a" fill={COLOR_MAP[state] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} radius={index === uniqueStates.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} name={state} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-indigo-600"/>
                                <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Resumen Numérico</h3>
                            </div>
                        </div>
                        <div className="overflow-auto custom-scrollbar max-h-[500px]">
                            <table className="w-full text-[10px]">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-50 text-slate-500 uppercase shadow-sm">
                                        <th className="p-4 text-left font-black sticky left-0 bg-slate-50 border-b border-slate-100 min-w-[150px]">Vendedor</th>
                                        {uniqueStates.map(state => <th key={state} className="p-4 text-center border-b border-slate-100 min-w-[80px] bg-slate-50">{state}</th>)}
                                        <th className="p-4 text-right border-b border-slate-100 bg-slate-50">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {processedData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold text-slate-700 sticky left-0 bg-white border-r border-slate-50">{row.name}</td>
                                            {uniqueStates.map(state => <td key={state} className="p-3 text-center text-slate-500">{row[state] || '-'}</td>)}
                                            <td className="p-4 text-right font-black text-indigo-600">{row.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-2xl border-slate-200 text-slate-400 font-bold text-xs uppercase">No hay datos gráficos</div>
            )}

            {/* SECCIÓN 2: FUENTES DE DATOS EN CASCADA */}
            <div className="pt-8 border-t border-slate-200">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-slate-200"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fuentes de Datos</span>
                    <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                {/* 1. FNZ */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_fnz"
                    titulo="Detalle FNZ"
                    icono={Database}
                    canLoad={loadStep >= 1}
                    onLoadComplete={() => handleStepComplete(1)}
                />

                {/* 2. RETANQUEOS - AHORA CON FILTROS ACTIVADOS */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_retanqueos"
                    titulo="Detalle Retanqueos"
                    icono={RefreshCw}
                    canLoad={loadStep >= 2}
                    onLoadComplete={() => handleStepComplete(2)}
                    initialColumns={COLUMNAS_RETANQUEO_15} 
                    // AQUÍ ESTÁ LA MAGIA: FILTROS ESPECÍFICOS SOLICITADOS
                    filterableColumns={["Vendedor_Activo", "Nombre_Vendedor", "Regional_Venta"]}
                />

                {/* 3. COSECHAS S1 */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s1"
                    titulo="Cosechas: Sección 1 (Fallo 1ra Cuota)"
                    icono={XCircle}
                    colorBadge="bg-red-50 text-red-600"
                    canLoad={loadStep >= 3}
                    onLoadComplete={() => handleStepComplete(3)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                />

                {/* 4. COSECHAS S2 */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s2"
                    titulo="Cosechas: Sección 2 (Pago 1ra / Fallo 2da)"
                    icono={AlertTriangle}
                    colorBadge="bg-orange-50 text-orange-600"
                    canLoad={loadStep >= 4}
                    onLoadComplete={() => handleStepComplete(4)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                />

                {/* 5. COSECHAS S3 */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s3"
                    titulo="Cosechas: Sección 3 (Fallo 3ra - 6ta)"
                    icono={TrendingUp}
                    colorBadge="bg-amber-50 text-amber-600"
                    canLoad={loadStep >= 5}
                    onLoadComplete={() => handleStepComplete(5)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                />
            </div>
        </div>
    );
};

export default Comercial;