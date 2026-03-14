import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { 
    RefreshCw, AlertCircle, TrendingUp, Users, SearchX, Search, Check, Trophy, 
    Database, Columns, X, Loader2, Clock, AlertTriangle, XCircle, Filter,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown
} from 'lucide-react';
import ExportExcel from "../../components/cartera_buttons/ExportExcel";
import { COLOR_MAP, DEFAULT_COLORS } from './DashboardComponents';

// ==========================================
// 1. CONFIGURACIÓN COLUMNAS (5 INICIALES)
// ==========================================

const COLUMNAS_FNZ_INICIALES = [
    "Estado", "Nombre", "Cedula_Cliente", "Ciudad", "Nombre_Vendedor"
];
const COLUMNAS_RETANQUEO_INICIALES = [
    "Credito", "Nombre_Vendedor", "Vendedor_Activo", "Regional_Venta", "Cuotas_Pagadas"
];
const COLUMNAS_COSECHA_INICIALES = [
    "Credito", "Cedula_Cliente", "Nombre_Cliente", "Celular", "Dias_Atraso_Final"
];

// ==========================================
const FILTER_KEY_MAP = {

};

// ==========================================
// MAPEO DE VALORES DE VIGENCIA
// El parquet usa "VIGENTES" (con S), "VIGENCIA EXPIRADA", "DIAS 1-10", etc.
// El selector global puede enviar variaciones → normalizamos aquí
// ==========================================
const VIGENCIA_VALUE_MAP = {
    'VIGENTE':           'VIGENTES',
    'VIGENTES':          'VIGENTES',
    'EXPIRADA':          'VIGENCIA EXPIRADA',
    'VIGENCIA EXPIRADA': 'VIGENCIA EXPIRADA',
    'DIAS 1-10':         'DIAS 1-10',
    'DIAS 11-20':        'DIAS 11-20',
    'DIAS 21+':          'DIAS 21+',
};

// ==========================================
// 2. COMPONENTE DE TABLA REMOTA
// ==========================================
const TablaComercialRemota = ({ 
    apiClient, jobId, origen, titulo, icono: Icono, canLoad, onLoadComplete, 
    colorBadge, initialColumns = [], filterConfig = [],
    // ── NUEVO: filtros globales del sidebar ──────────────────────────────────
    globalFilters = {}
}) => {
    const [tableData, setTableData] = useState([]); 
    const [columns, setColumns] = useState([]); 
    const [visibleColumns, setVisibleColumns] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false); 
    const [pagination, setPagination] = useState({
        current: 1, total_pages: 0, total_records: 0, page_size: 15
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnSearch, setColumnSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [tempFilters, setTempFilters] = useState({});

    // ── OPCIONES DINÁMICAS: se extraen de los datos cargados de ESTA tabla ──────
    const [dynamicOptions, setDynamicOptions] = useState({});

    // ── FIX #1: buildGlobalFilterPayload con normalización de valores de vigencia ──
    const buildGlobalFilterPayload = useCallback((gf) => {
        const KEY_MAP = {
            Empresa:            'empresa',
            Zona:               'zona',
            Regional_Cobro:     'regional_cobro',
            Franja_Cartera:     'franja',
            CALL_CENTER_FILTRO: 'call_center_filtro',
            Novedades:          'novedades',
            Estado_Vigencia:    'vigencia',
            Estado_Vigencia:    'estado_vigencia', // Python lee payload.vigencia
        };

        const UPPERCASE_KEYS = new Set(['Empresa', 'Zona', 'Regional_Cobro', 'CALL_CENTER_FILTRO']);

        const result = {};
        Object.entries(gf || {}).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                const backendKey = KEY_MAP[key] ?? key.toLowerCase();

                if (key === 'Estado_Vigencia') {
                    // ✅ Normalizar al valor exacto que tiene el parquet (VIGENTE → VIGENTES, etc.)
                    result[backendKey] = value.map(v => {
                        const upper = String(v).toUpperCase().trim();
                        return VIGENCIA_VALUE_MAP[upper] || upper;
                    });
                } else if (UPPERCASE_KEYS.has(key)) {
                    result[backendKey] = value.map(v => String(v).toUpperCase().trim());
                } else {
                    result[backendKey] = value;
                }
            }
        });
        return result;
    }, []);

    // Extrae valores únicos por columna de los datos recibidos para poblar los dropdowns
    const extractDynamicOptions = useCallback((data) => {
        if (!data || data.length === 0 || filterConfig.length === 0) return;
        const newOptions = {};
        filterConfig.forEach(({ key }) => {
            const valores = [...new Set(data.map(row => row[key]).filter(v => v !== null && v !== undefined && v !== ''))];
            valores.sort();
            newOptions[key] = valores;
        });
        setDynamicOptions(newOptions);
    }, [filterConfig]);

    // ── FETCH DATA ───────────────────────────────────────────────────────────────
    const fetchData = useCallback(async (pageToLoad = 1, filtersToApply = activeFilters) => {
        if (!jobId) return;
        setLoading(true);
        try {
            // Filtros locales de la tabla (columnas propias)
            const formattedFilters = {};
            Object.entries(filtersToApply).forEach(([key, value]) => {
                if (value && value !== "") {
                    const backendKey = FILTER_KEY_MAP[key] ?? key;
                    formattedFilters[backendKey] = Array.isArray(value) ? value : [value.trim()];
                }
            });

            // ── Filtros globales del sidebar ────────────────────────────────
            const globalPayload = buildGlobalFilterPayload(globalFilters);

            const payload = {
                job_id: jobId,
                origen,
                search_term: "",
                page: pageToLoad,
                page_size: 15,
                // Los globales van primero; los locales tienen prioridad si coinciden
                ...globalPayload,
                ...formattedFilters
            };

            const response = await apiClient.post('/wallet/buscar', payload);
            const responseData = response.data?.data || [];
            const meta = response.data?.meta || {};

            if (responseData.length > 0 && columns.length === 0) {
                const detectedCols = Object.keys(responseData[0]);
                setColumns(detectedCols);
                if (initialColumns && initialColumns.length > 0) {
                    const orderedVisibleCols = initialColumns.filter(col => detectedCols.includes(col));
                    setVisibleColumns(orderedVisibleCols.length > 0 ? orderedVisibleCols : detectedCols);
                } else {
                    setVisibleColumns(detectedCols);
                }
                // Extraemos opciones dinámicas de los primeros datos recibidos
                extractDynamicOptions(responseData);
            }

            setTableData(responseData);
            setPagination({
                current: meta.page || pageToLoad,
                total_pages: meta.pages || 0,
                total_records: meta.total || 0,
                page_size: meta.page_size || 15
            });
            setDataLoaded(true);
        } catch (err) {
            console.error(`Error cargando tabla ${origen}:`, err);
        } finally {
            setLoading(false);
            if (onLoadComplete) onLoadComplete();
        }
    }, [jobId, origen, apiClient, columns.length, initialColumns, onLoadComplete, extractDynamicOptions, globalFilters, buildGlobalFilterPayload]);

    // ── Carga inicial en cascada ─────────────────────────────────────────────
    useEffect(() => {
        if (jobId && canLoad && !dataLoaded && !loading) fetchData(1, {});
    }, [jobId, canLoad, dataLoaded, loading, fetchData]);

    // ── Cuando cambian los filtros globales, resetear y recargar ─────────────
    const globalFiltersKey = useMemo(() => JSON.stringify(globalFilters), [globalFilters]);
    useEffect(() => {
        // Solo resetear si la tabla ya había cargado datos antes
        if (dataLoaded) {
            setDataLoaded(false);
            setTableData([]);
            setColumns([]);
            setVisibleColumns([]);
            setActiveFilters({});
            setTempFilters({});
            setDynamicOptions({});
            setPagination({ current: 1, total_pages: 0, total_records: 0, page_size: 15 });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalFiltersKey]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.total_pages) fetchData(newPage, activeFilters);
    };

    // ── handleFilterChange: aplica inmediatamente al cambiar un select ───────────
    const handleFilterChange = (col, value) => {
        setTempFilters(prev => ({ ...prev, [col]: value }));
        const nextFilters = { ...activeFilters, [col]: value };
        if (!value || value === "") delete nextFilters[col];
        setActiveFilters(nextFilters);
        fetchData(1, nextFilters);
    };

    const applyFilter = (col) => {
        const value = tempFilters[col];
        const newFilters = { ...activeFilters, [col]: value };
        if (!value) delete newFilters[col];
        setActiveFilters(newFilters);
        fetchData(1, newFilters); 
    };

    const handleKeyDown = (e, col) => { if (e.key === 'Enter') applyFilter(col); };
    const clearFilters = () => { setTempFilters({}); setActiveFilters({}); fetchData(1, {}); };

    const toggleColumnVisibility = (col) => {
        setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };
    const handleMostrarTodas = () => setVisibleColumns(columns);
    const handleOcultarTodas = () => setVisibleColumns([]);
    const filteredColumns = columns.filter(col => col.toLowerCase().includes(columnSearch.toLowerCase()));

   const filtrosExport = useMemo(() => {
    const formattedFilters = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) {
            const backendKey = FILTER_KEY_MAP[key] ?? key;
            formattedFilters[backendKey] = Array.isArray(value) ? value : [value.trim()];
        }
    });

    // ── Incluir filtros globales también en la exportación ──────────────────
    const globalPayload = buildGlobalFilterPayload(globalFilters);

    return { 
        job_id: jobId, 
        origen, 
        search_term: "", 
        page: 1,
        page_size: 100000,
        ...globalPayload,
        ...formattedFilters,
        columnas_visibles: visibleColumns.length > 0 ? visibleColumns : columns
    };
}, [jobId, origen, activeFilters, visibleColumns, columns, globalFilters, buildGlobalFilterPayload]);

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-[2rem] border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col mb-8 animate-in fade-in slide-in-from-bottom-4 transition-all duration-500 hover:border-slate-600/80">
            <div className="p-6 border-b border-slate-700/40 flex flex-col gap-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${canLoad ? (colorBadge || 'bg-cyan-900/40 text-cyan-400') : 'bg-slate-800/60 text-slate-400'}`}>
                            {Icono ? <Icono size={18} /> : <Database size={18} />}
                        </div>
                        <div>
                            <h3 className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">{titulo}</h3>
                            <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                                {!canLoad ? 'En cola de espera...' : loading ? 'Cargando datos...' : 'Datos listos'}
                            </p>
                        </div>
                    </div>
                    {canLoad && (
                        <div className="relative flex items-center gap-2.5">
                            <button 
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                                disabled={!dataLoaded}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-600/60 hover:bg-slate-700/60 hover:border-cyan-500/40 rounded-lg text-[10px] font-bold text-slate-300 transition-all shadow-lg active:scale-95 disabled:opacity-50 whitespace-nowrap"
                            >
                                <Columns size={14} /> Columnas
                            </button>
                            <ExportExcel 
                                isAvailable={dataLoaded && tableData.length > 0} 
                                filtros={filtrosExport} 
                                fileName={`Comercial_${origen}_${jobId}.xlsx`} 
                            />
                            {showColumnSelector && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-[#0c1424] border border-slate-700/60 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] rounded-xl z-50 animate-in slide-in-from-top-2 overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-slate-700/60">
                                        <div className="relative flex items-center bg-slate-800/40 border border-slate-600/50 rounded-lg px-3 py-2.5 focus-within:border-indigo-500/50 transition-colors">
                                            <Search size={16} className="text-slate-400 mr-2" />
                                            <input 
                                                type="text" placeholder="Buscar columna..." value={columnSearch}
                                                onChange={(e) => setColumnSearch(e.target.value)}
                                                className="bg-transparent border-none outline-none text-slate-200 text-[11px] w-full placeholder:text-slate-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 p-3 border-b border-slate-700/60 bg-[#0f192d]">
                                        <button onClick={handleMostrarTodas} className="flex-1 bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-700/50 text-white text-[10px] font-bold py-2.5 px-2 rounded-lg transition-colors shadow-sm">MOSTRAR TODAS</button>
                                        <button onClick={handleOcultarTodas} className="flex-1 bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-slate-200 text-[10px] font-bold py-2.5 px-2 rounded-lg transition-colors shadow-sm">OCULTAR TODAS</button>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto custom-scrollbar p-2 bg-[#0c1424]">
                                        {filteredColumns.map(col => {
                                            const isChecked = visibleColumns.includes(col);
                                            return (
                                                <label key={col} className="flex items-center gap-3 p-2.5 hover:bg-slate-800/40 rounded-lg cursor-pointer select-none transition-colors mb-0.5 group">
                                                    <div className="relative flex items-center justify-center">
                                                        <input type="checkbox" checked={isChecked} onChange={() => toggleColumnVisibility(col)} className="peer sr-only" />
                                                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]' : 'bg-slate-800 border-slate-600 group-hover:border-slate-500'}`}>
                                                            {isChecked && <Check size={12} className="text-white" strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                    <span className={`text-[11px] font-black uppercase tracking-wide truncate ${isChecked ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`} title={col}>
                                                        {col.replace(/_/g, ' ')}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                        {filteredColumns.length === 0 && (
                                            <div className="p-6 text-center text-slate-500 text-xs italic font-medium">No se encontraron columnas</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── BARRA DE FILTROS ─────────────────────────────────────────────────────
                ─────────────────────────────────────────────────────────────────────────── */}
                {filterConfig.length > 0 && dataLoaded && (
                    <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-700/40 animate-in slide-in-from-top-1">
                        <div className="flex items-center gap-2 text-slate-400 mr-2">
                            <Filter size={14} />
                            <span className="text-[10px] font-bold uppercase">Filtrar:</span>
                        </div>
                        {filterConfig.map((config) => {
                            // Usamos las opciones dinámicas (del propio parquet) con fallback a las externas
                            const opciones = (dynamicOptions[config.key] && dynamicOptions[config.key].length > 0)
                                ? dynamicOptions[config.key]
                                : (config.options || []);
                            return (
                                <div key={config.key} className="relative flex flex-col gap-1 min-w-[160px]">
                                    {config.type === 'select' ? (
                                        <div className="relative">
                                            <select
                                                className={`w-full appearance-none bg-slate-800/60 border text-slate-100 text-[10px] font-medium rounded-lg px-2 py-1.5 pr-8 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all cursor-pointer ${activeFilters[config.key] ? 'border-cyan-500/60 bg-cyan-900/20' : 'border-slate-600/60 hover:border-slate-500/60'}`}
                                                value={tempFilters[config.key] || ''}
                                                onChange={(e) => handleFilterChange(config.key, e.target.value)}
                                            >
                                                <option value="">{`Todos: ${config.label || config.key.replace(/_/g, ' ')}`}</option>
                                                {opciones.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            placeholder={`Buscar ${config.label || config.key.replace(/_/g, ' ')}...`}
                                            className={`w-full bg-slate-800/60 border text-slate-100 text-[10px] font-medium rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all ${activeFilters[config.key] ? 'border-cyan-500/60 bg-cyan-900/20' : 'border-slate-600/60 hover:border-slate-500/60'}`}
                                            value={tempFilters[config.key] || ''}
                                            onChange={(e) => handleFilterChange(config.key, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, config.key)}
                                            onBlur={() => applyFilter(config.key)}
                                        />
                                    )}
                                </div>
                            );
                        })}
                        {Object.keys(activeFilters).length > 0 && (
                            <button onClick={clearFilters} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-800/40 text-red-400 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 border border-red-700/40">
                                <XCircle size={12} /> Limpiar
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="overflow-auto custom-scrollbar relative max-h-[500px] bg-slate-950/40 min-h-[150px]">
                {!canLoad && (
                    <div className="absolute inset-0 bg-slate-900/50 z-20 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Clock size={32} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Esperando turno...</span>
                        </div>
                    </div>
                )}
                {loading && (
                    <div className="absolute inset-0 bg-slate-900/80 z-20 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="animate-spin text-cyan-400" size={32} />
                            <span className="text-[10px] font-bold text-cyan-400">Cargando datos...</span>
                        </div>
                    </div>
                )}
                <table className="w-full text-[10px] border-collapse relative bg-slate-900/60">
                    <thead className="bg-slate-800/80 sticky top-0 z-10 shadow-lg ring-1 ring-slate-700/40">
                        <tr>
                            {visibleColumns.length > 0 ? visibleColumns.map(col => (
                                <th key={col} className="p-3 text-left min-w-[150px] border-b border-slate-700/40 bg-slate-800/80">
                                    <span className="font-black text-cyan-300 uppercase tracking-wider truncate block text-[9px]" title={col}>
                                        {col.replace(/_/g, ' ')}
                                    </span>
                                </th>
                            )) : (
                                <th className="p-3 text-left bg-slate-800/80 text-slate-400 italic font-medium">
                                    {loading ? '...' : 'Sin datos'}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30 bg-slate-900/40">
                        {tableData.length > 0 ? (
                            tableData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-800/40 transition-colors duration-200">
                                    {visibleColumns.map(col => (
                                        <td key={`${idx}-${col}`} className="p-3 text-slate-200 border-r border-slate-700/20 truncate max-w-[200px]" title={row[col]}>
                                            {row[col]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            !loading && dataLoaded && (
                                <tr>
                                    <td colSpan={visibleColumns.length || 1} className="p-12 text-center text-slate-400 italic">
                                        No hay registros disponibles.
                                    </td>
                                </tr>
                            )
                        )}
                    </tbody>
                </table>
            </div>

            {dataLoaded && canLoad && (
                <div className="p-3 border-t border-slate-700/40 bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col gap-0.5">
                        <div className="text-[10px] text-slate-300 font-medium">
                            Registros: <span className="font-black text-cyan-400">{tableData.length}</span> de {pagination.total_records}
                        </div>
                        <div className="text-[9px] text-slate-400">
                            Página <span className="font-bold text-slate-300">{pagination.current}</span> de {pagination.total_pages}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handlePageChange(1)} disabled={pagination.current === 1 || loading} className="p-1.5 rounded-lg border border-slate-600/60 text-slate-400 hover:border-cyan-500/40 hover:bg-slate-800/60 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronsLeft size={14} /></button>
                        <button onClick={() => handlePageChange(pagination.current - 1)} disabled={pagination.current === 1 || loading} className="p-1.5 rounded-lg border border-slate-600/60 text-slate-400 hover:border-cyan-500/40 hover:bg-slate-800/60 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronLeft size={14} /></button>
                        <span className="px-3 py-1 bg-slate-800/60 rounded-lg text-[10px] font-bold text-cyan-400 border border-slate-600/60">{pagination.current}</span>
                        <button onClick={() => handlePageChange(pagination.current + 1)} disabled={pagination.current === pagination.total_pages || loading} className="p-1.5 rounded-lg border border-slate-600/60 text-slate-400 hover:border-cyan-500/40 hover:bg-slate-800/60 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronRight size={14} /></button>
                        <button onClick={() => handlePageChange(pagination.total_pages)} disabled={pagination.current === pagination.total_pages || loading} className="p-1.5 rounded-lg border border-slate-600/60 text-slate-400 hover:border-cyan-500/40 hover:bg-slate-800/60 hover:text-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"><ChevronsRight size={14} /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// 3. SELECT REUTILIZABLE PARA FILTROS DEL CHART
// ==========================================

const ChartFilterSelect = ({ label, value, options, onChange, active }) => (
    <div className="relative min-w-[160px]">
        <select
            className={`w-full appearance-none text-[10px] font-semibold rounded-xl px-3 py-2 pr-8 outline-none cursor-pointer transition-all border
                ${active
                    ? 'bg-cyan-900/30 border-cyan-500/60 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                    : 'bg-slate-800/60 border-slate-600/60 text-slate-300 hover:border-slate-500/80 hover:bg-slate-800/80'
                }`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="">Todos: {label}</option>
            {options.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
            ))}
        </select>
        <ChevronDown
            size={12}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${active ? 'text-cyan-400' : 'text-slate-400'}`}
        />
    </div>
);

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
    const [data, setData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const [error, setError] = useState(null);
    const [loadStep, setLoadStep] = useState(0);

    // ── FILTROS LOCALES para gráfico + tabla resumen ──
    const [chartFilters, setChartFilters] = useState({
        Estado: '',
        Analista_Asociado: '',
        Regional_Venta: '',
    });

    // ── FIX #2: Separar vigencia del resto de filtros ──────────────────────────
    // filtersWithoutVigencia → afecta el gráfico/chart y la tabla FNZ
    // selectedFilters completo → afecta retanqueos y cosechas
    const filtersWithoutVigencia = useMemo(() => {
        const { Estado_Vigencia, ...rest } = selectedFilters || {};
        return rest;
    }, [selectedFilters]);

    // ── FIX #3: El gráfico SOLO se recarga cuando cambian filtros que NO son vigencia ──
    // Antes: dependía de selectedFilters (cualquier filtro recargaba el gráfico)
    // Ahora: depende de filtersWithoutVigencia (vigencia NO recarga el gráfico)
    useEffect(() => {
        if (!jobId) return;
        setLoadingCharts(true);
        setError(null);
        setData([]);
        setLoadStep(0);
        setChartFilters({ Estado: '', Analista_Asociado: '', Regional_Venta: '' });

        apiClient.get(`/wallet/init/comercial`, { 
            params: { job_id: jobId, ...filtersWithoutVigencia } 
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
            setLoadStep(1); 
        });
    }, [jobId, apiClient, filtersWithoutVigencia]); // ← filtersWithoutVigencia, NO selectedFilters

    const handleStepComplete = useCallback((currentStep) => {
        setLoadStep(prev => prev === currentStep ? prev + 1 : prev);
    }, []);

    // ── Procesa el raw data y extrae valores únicos ──
    const processRawData = (rawData) => {
        if (!rawData || rawData.length === 0) return {
            processedData: [], uniqueStates: [], totals: {},
            uniqueSellers: [], uniqueRegionals: [], uniqueActivos: [], uniqueAnalistas: []
        };

        const statesSet    = new Set();
        const sellersSet   = new Set();
        const regionalsSet = new Set();
        const activosSet   = new Set();
        const analistasSet = new Set();
        const grouped      = {};

        rawData.forEach(item => {
            const vendedor  = String(item.Nombre_Vendedor    || item.nombre_vendedor    || 'SIN VENDEDOR').trim();
            const estado    = String(item.Estado             || item.estado             || 'SIN ESTADO').toUpperCase().trim();
            const regional  = String(item.Regional_Venta    || item.regional_venta    || '').trim();
            const activo    = String(item.Vendedor_Activo   || item.vendedor_activo   || '').trim();
            const analista  = String(item.Analista_Asociado || item.analista_asociado || '').trim();

            if (estado)   statesSet.add(estado);
            if (vendedor) sellersSet.add(vendedor);
            if (regional) regionalsSet.add(regional);
            if (activo)   activosSet.add(activo);
            if (analista) analistasSet.add(analista);

            if (!grouped[vendedor]) grouped[vendedor] = { name: vendedor, total: 0 };
            grouped[vendedor][estado] = (grouped[vendedor][estado] || 0) + 1;
            grouped[vendedor].total  += 1;
        });

        const uniqueStates    = Array.from(statesSet).sort();
        const uniqueSellers   = Array.from(sellersSet).sort();
        const uniqueRegionals = Array.from(regionalsSet).sort();
        const uniqueActivos   = Array.from(activosSet).sort();
        const uniqueAnalistas = Array.from(analistasSet).sort();

        const processedData = Object.values(grouped).sort((a, b) => b.total - a.total);
        const totals = { total: 0 };
        uniqueStates.forEach(s => totals[s] = 0);
        processedData.forEach(row => {
            totals.total += row.total;
            uniqueStates.forEach(s => { if (row[s]) totals[s] += row[s]; });
        });

        return { processedData, uniqueStates, totals, uniqueSellers, uniqueRegionals, uniqueActivos, uniqueAnalistas };
    };

    // Opciones extraídas de TODOS los datos (sin filtrar) para los dropdowns del chart
    const { uniqueStates: allStates, uniqueSellers, uniqueRegionals, uniqueActivos, uniqueAnalistas } =
        useMemo(() => processRawData(data), [data]);

    // Datos filtrados localmente para gráfico y tabla resumen
    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(item => {
            const estado   = String(item.Estado            || item.estado            || '').toUpperCase().trim();
            const analista = String(item.Analista_Asociado || item.analista_asociado || '').trim();
            const regional = String(item.Regional_Venta   || item.regional_venta   || '').trim();

            if (chartFilters.Estado           && estado   !== chartFilters.Estado.toUpperCase().trim()) return false;
            if (chartFilters.Analista_Asociado && analista !== chartFilters.Analista_Asociado.trim())    return false;
            if (chartFilters.Regional_Venta   && regional !== chartFilters.Regional_Venta.trim())         return false;
            return true;
        });
    }, [data, chartFilters]);

    const { processedData, uniqueStates, totals } =
        useMemo(() => processRawData(filteredData), [filteredData]);

    const chartData = useMemo(() => processedData.slice(0, 15), [processedData]);

    // ── CONFIGURACIÓN DE FILTROS PARA LA TABLA RETANQUEOS ────────────────────────
    // ─────────────────────────────────────────────────────────────────────────────
    const filtrosRetanqueo = useMemo(() => [
        { key: 'Vendedor_Activo', label: 'Activo',   type: 'select', options: [] },
        { key: 'Nombre_Vendedor', label: 'Vendedor', type: 'select', options: [] },
        { key: 'Regional_Venta',  label: 'Regional', type: 'select', options: [] }
    ], []);

    const activeChartFilterCount = Object.values(chartFilters).filter(Boolean).length;
    const clearChartFilters = () => setChartFilters({ Estado: '', Analista_Asociado: '', Regional_Venta: '' });

    if (loadingCharts) {
        return (
            <div className="h-96 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-[2rem] border border-slate-700/60 shadow-2xl animate-pulse">
                <RefreshCw className="animate-spin mb-4 text-cyan-400" size={40} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Analizando Datos...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-950/40 rounded-2xl border border-red-800/60 flex items-center gap-4 text-red-400 backdrop-blur-sm">
                <AlertCircle size={24} />
                <span className="font-bold text-xs">{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700 fade-in">

            {/* ══════════════════════════════════════════
                BARRA DE FILTROS — afecta gráfico + tabla
            ══════════════════════════════════════════ */}
            {data.length > 0 && (
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-700/60 shadow-xl px-5 py-3.5 flex flex-wrap items-center gap-3">

                    {/* Ícono + label */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
                            <Filter size={13} className="text-cyan-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros</span>
                        {activeChartFilterCount > 0 && (
                            <span className="flex items-center justify-center w-4 h-4 rounded-full bg-cyan-500 text-[9px] font-black text-slate-900">
                                {activeChartFilterCount}
                            </span>
                        )}
                    </div>

                    <div className="w-px h-6 bg-slate-700/60 shrink-0" />

                    {/* Estado */}
                    <ChartFilterSelect
                        label="Estado"
                        value={chartFilters.Estado}
                        options={allStates}
                        onChange={(v) => setChartFilters(prev => ({ ...prev, Estado: v }))}
                        active={!!chartFilters.Estado}
                    />

                    {/* Analista_Asociado */}
                    <ChartFilterSelect
                        label="Analista"
                        value={chartFilters.Analista_Asociado}
                        options={uniqueAnalistas}
                        onChange={(v) => setChartFilters(prev => ({ ...prev, Analista_Asociado: v }))}
                        active={!!chartFilters.Analista_Asociado}
                    />

                    {/* Regional_Venta */}
                    <ChartFilterSelect
                        label="Regional"
                        value={chartFilters.Regional_Venta}
                        options={uniqueRegionals}
                        onChange={(v) => setChartFilters(prev => ({ ...prev, Regional_Venta: v }))}
                        active={!!chartFilters.Regional_Venta}
                    />

                    {/* Limpiar */}
                    {activeChartFilterCount > 0 && (
                        <button
                            onClick={clearChartFilters}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-900/30 hover:bg-red-800/40 text-red-400 rounded-xl text-[10px] font-bold transition-all border border-red-700/40 hover:border-red-600/60 active:scale-95"
                        >
                            <XCircle size={12} /> Limpiar
                        </button>
                    )}

                    {/* Contador */}
                    <div className="ml-auto shrink-0">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            Mostrando{' '}
                            <span className="text-cyan-400 font-black">{filteredData.length}</span>
                            {' '}/ {data.length} registros
                        </span>
                    </div>
                </div>
            )}

            {/* GRÁFICOS Y RESUMEN */}
            {processedData.length > 0 ? (
                <>
                    <div className="bg-slate-900/80 backdrop-blur-sm p-6 md:p-8 rounded-[2.5rem] border border-slate-700/60 shadow-2xl hover:border-slate-600/80 transition-all">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[11px] font-black text-cyan-300 uppercase tracking-widest flex items-center gap-2">
                                <Trophy size={16} className="text-amber-400"/> Top 15 Vendedores
                            </h3>
                            <div className="hidden md:flex gap-2">
                                {uniqueStates.slice(0, 4).map((state, idx) => (
                                    <div key={state} className="flex items-center gap-1 bg-slate-800/60 px-2 py-1 rounded-full border border-slate-700/60">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLOR_MAP[state] || DEFAULT_COLORS[idx] }}></span>
                                        <span className="text-[9px] font-bold text-slate-300">{state}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="h-[420px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                               <BarChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis 
                                        dataKey="name" angle={-90} textAnchor="end" interval={0}
                                        tick={{ fontSize: 9, fontWeight: 650, fill: '#cbd5e1' }}
                                        tickMargin={85} height={170}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                    <Tooltip 
                                        cursor={{ fill: '#1e293b' }} 
                                        contentStyle={{ borderRadius: '12px', border: '1px solid #475569', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)', backgroundColor: '#0f172a', color: '#e2e8f0' }} 
                                    />
                                    <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 'bold', color: '#cbd5e1' }} />
                                    {uniqueStates.map((state, index) => {
                                        const isLast = index === uniqueStates.length - 1;
                                        return (
                                            <Bar key={state} dataKey={state} stackId="a"
                                                fill={COLOR_MAP[state] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                                radius={isLast ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                                name={state}
                                            >
                                                <LabelList dataKey={state} position="center" fill="#ffffff" fontSize={10} fontWeight="bold" formatter={(val) => (val > 0 ? val : '')} />
                                                {isLast && <LabelList dataKey="total" position="top" fill="#ffffff" fontSize={12} fontWeight="900" offset={10} />}
                                            </Bar>
                                        );
                                    })}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-slate-900/80 backdrop-blur-sm rounded-[2.5rem] border border-slate-700/60 shadow-2xl overflow-hidden flex flex-col hover:border-slate-600/80 transition-all">
                        <div className="p-6 border-b border-slate-700/40 flex items-center justify-between bg-gradient-to-r from-slate-900/50 to-slate-800/50">
                            <div className="flex items-center gap-2">
                                <Users size={18} className="text-cyan-400"/>
                                <h3 className="text-[11px] font-black text-cyan-300 uppercase tracking-widest">Resumen por vendedor y estado</h3>
                            </div>
                        </div>
                        <div className="overflow-auto custom-scrollbar max-h-[500px]">
                            <table className="w-full text-[10px] bg-slate-900/60">
                                <thead className="sticky top-0 z-10">
                                    <tr className="bg-slate-800/80 text-slate-300 uppercase shadow-sm border-b border-slate-700/40">
                                        <th className="p-4 text-left font-black sticky left-0 bg-slate-800/80 border-b border-slate-700/40 min-w-[150px] text-cyan-300">Vendedor</th>
                                        {uniqueStates.map(state => <th key={state} className="p-4 text-center border-b border-slate-700/40 min-w-[80px] bg-slate-800/80 text-cyan-300">{state}</th>)}
                                        <th className="p-4 text-right border-b border-slate-700/40 bg-slate-800/80 text-cyan-300">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/30 bg-slate-900/40">
                                    {processedData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors duration-200">
                                            <td className="p-4 font-bold text-slate-200 sticky left-0 bg-slate-900/40 border-r border-slate-700/20">{row.name}</td>
                                            {uniqueStates.map(state => <td key={state} className="p-3 text-center text-slate-400">{row[state] || '-'}</td>)}
                                            <td className="p-4 text-right font-black text-cyan-400">{row.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="sticky bottom-0 z-10 font-black text-[10px] uppercase bg-cyan-900/30 text-cyan-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] border-t-2 border-cyan-700/40">
                                    <tr>
                                        <td className="p-4 sticky left-0 bg-cyan-900/30 border-r border-cyan-700/40">TOTALES GLOBALES</td>
                                        {uniqueStates.map(state => (
                                            <td key={state} className="p-3 text-center">{totals[state] || 0}</td>
                                        ))}
                                        <td className="p-4 text-right text-cyan-200 text-xs">{totals.total}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-2xl border-slate-700/40 text-slate-400 font-bold text-xs uppercase">
                    {data.length > 0 ? 'Sin resultados con los filtros aplicados' : 'No hay datos gráficos'}
                </div>
            )}

            {/* SECCIÓN: FUENTES DE DATOS EN CASCADA */}
            <div className="pt-8 border-t border-slate-700/40">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-px flex-1 bg-slate-700/40"></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fuentes de Datos</span>
                    <div className="h-px flex-1 bg-slate-700/40"></div>
                </div>

                {/* ── FIX #4: FNZ recibe filtersWithoutVigencia — vigencia NO aplica aquí ── */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_fnz" titulo="Detalles de registros FNZ"
                    canLoad={loadStep >= 1} onLoadComplete={() => handleStepComplete(1)}
                    initialColumns={COLUMNAS_FNZ_INICIALES}
                    globalFilters={filtersWithoutVigencia}
                />

                {/* ── FIX #5: Retanqueos y Cosechas reciben selectedFilters COMPLETO (con vigencia) ── */}
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_retanqueos" titulo="Clientes potenciales para Retanqueos"
                    icono={RefreshCw} canLoad={loadStep >= 2} onLoadComplete={() => handleStepComplete(2)}
                    initialColumns={COLUMNAS_RETANQUEO_INICIALES}
                    filterConfig={filtrosRetanqueo}
                    globalFilters={selectedFilters}
                />
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s1" titulo="alerta critica (Fallaron 1ra Cuota)"
                    icono={XCircle} colorBadge="bg-red-900/40 text-red-400"
                    canLoad={loadStep >= 3} onLoadComplete={() => handleStepComplete(3)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                    globalFilters={selectedFilters}
                />
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s2" titulo="Riesgo alto: (Pago 1ra / Fallo 2da)"
                    icono={AlertTriangle} colorBadge="bg-orange-900/40 text-orange-400"
                    canLoad={loadStep >= 4} onLoadComplete={() => handleStepComplete(4)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                    globalFilters={selectedFilters}
                />
                <TablaComercialRemota 
                    apiClient={apiClient} jobId={jobId}
                    origen="comercial_cosechas_s3" titulo="seguimiento: (Fallo 3ra - 6ta)"
                    icono={TrendingUp} colorBadge="bg-amber-900/40 text-amber-400"
                    canLoad={loadStep >= 5} onLoadComplete={() => handleStepComplete(5)}
                    initialColumns={COLUMNAS_COSECHA_INICIALES}
                    globalFilters={selectedFilters}
                />
            </div>
        </div>
    );
};

export default Comercial;