import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend
} from 'recharts';
import { Layers, Database, Search, ChevronDown, ChevronUp, Columns, ChevronLeft, ChevronRight, Phone, MessageSquare, Bell } from 'lucide-react';
import ExportExcel from "../../components/cartera_buttons/ExportExcel";
import Llamadas_Call from './Sub_Call_Center/Llamadas_Call';
import Mensajeria_Call from './Sub_Call_Center/Mensajeria_Call';
import Novedades_Call from './Sub_Call_Center/Novedades_Call';

const PIE_COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#eab308'];

const getDynamicColor = (val) => {
    if (val <= 20) return '#ef4444'; // Rojo
    if (val <= 40) return '#f59e0b'; // Naranja
    if (val <= 60) return '#eab308'; // Amarillo
    if (val <= 80) return '#10b981'; // Verde
    return '#8b5cf6';                // Morado
};

// 2. FORMATEADOR DE MONEDA
const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};

const SummaryCard = ({ title, value, color = "#ffffff" }) => (
    <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[16px] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] p-4 sm:p-5 flex flex-col justify-center transition-all duration-300 hover:bg-white/5 hover:border-white/20">
        <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            {title}
        </h4>
        <p className="text-xl sm:text-[22px] font-black font-mono tracking-tight" style={{ color: color }}>
            {value}
        </p>
    </div>
);

const ChartCard = React.memo(({ title, subtitle, children, isEmpty }) => (
    <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-4 sm:p-6 flex flex-col h-full transition-all duration-300 hover:shadow-[0_10px_35px_rgba(139,92,246,0.1)] hover:border-purple-500/30 relative group overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:bg-purple-500/20"></div>
        
        <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
                    <h3 className="text-[12px] sm:text-[13px] font-black text-white uppercase tracking-tight">{title}</h3>
                </div>
                {subtitle && <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 pl-4">{subtitle}</p>}
            </div>
        </div>
        
        <div className="w-full h-[350px] relative z-10">
            {isEmpty ? (
                <div className="flex flex-col items-center justify-center h-full w-full opacity-60">
                    <Layers size={40} className="text-slate-500 mb-3" strokeWidth={1.5} />
                    <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sin datos</p>
                </div>
            ) : children}
        </div>
    </div>
));

// Tooltip para el gráfico de barras
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-50 pointer-events-none">
                <p className="font-bold text-[14px] mb-2 text-white border-b border-white/10 pb-2">
                    {data.CALL_CENTER}
                </p>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">Asesor:</span>
                        <span className="font-semibold text-white text-[12px] text-right">
                            {data.NOMBRE ? String(data.NOMBRE).trim() : 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">Cumplimiento:</span>
                        <span className="font-bold text-[#8b5cf6] text-[13px]">{data.porcentaje}%</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Tooltip para el gráfico circular
const PieCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-50 pointer-events-none">
                <p className="font-bold text-[14px] mb-2 text-white border-b border-white/10 pb-2">
                    {data.Rodamiento}
                </p>
                <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">Cantidad:</span>
                        <span className="font-semibold text-white text-[12px] text-right">
                            {data.count}
                        </span>
                    </div>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">Porcentaje:</span>
                        {/* CORRECCIÓN: Se fuerza a usar text-white */}
                        <span className="font-bold text-white text-[13px]">
                            {data.percentage}%
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

// Función para mostrar el porcentaje dentro de las tajadas del pastel
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    // Ajustado de 0.5 a 0.65 para empujar los números un poco más al borde y evitar que se pisen en el centro
    const radius = innerRadius + (outerRadius - innerRadius) * 0.65; 
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    // CORRECCIÓN: Ya no ocultamos los porcentajes pequeños, se renderizan todos
    if (percent < 0.02) return null;
    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(1)}%`}
        </text>
    );
};


// ─── SUBCOMPONENTES DE TABLA (definidos fuera de CallCenter para evitar remount al cambiar pestañas) ───
const TableToolbar = React.memo(({ filters, onFilterChange, allColumns, visibleColumns, onToggleColumn, exportButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [columnSearch, setColumnSearch] = useState('');
    
    const handleMenuToggle = useCallback(() => setIsMenuOpen(prev => !prev), []);
    
    const handleSelectAll = useCallback(() => {
        allColumns.forEach(col => { 
            if (!visibleColumns.includes(col.key)) onToggleColumn(col.key); 
        });
    }, [allColumns, visibleColumns, onToggleColumn]);
    
    const handleDeselectAll = useCallback(() => {
        visibleColumns.forEach(key => onToggleColumn(key));
    }, [visibleColumns, onToggleColumn]);

    const filteredColumns = useMemo(() => {
        return allColumns.filter(col => 
            col.label.toLowerCase().includes(columnSearch.toLowerCase())
        );
    }, [allColumns, columnSearch]);

    return (
        <div className="relative z-20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 bg-[#0b2241]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">
            
            {/* ─── NUEVOS FILTROS DESPLEGABLES ─── */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <select 
                    value={filters.Rodamiento} 
                    onChange={(e) => onFilterChange('Rodamiento', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Rodamiento (Todos)</option>
                    <option value="SE MANTIENE">SE MANTIENE</option>
                    <option value="EMPEORO">EMPEORO</option>
                    <option value="NORMALIZO">NORMALIZO</option>
                    <option value="PAGO TOTAL">PAGO TOTAL</option>
                    <option value="MEJORO">MEJORO</option>
                    {/* Puedes agregar más opciones aquí si lo necesitas */}
                </select>

                <select 
                    value={filters.Estado_Gestion} 
                    onChange={(e) => onFilterChange('Estado_Gestion', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Gestión (Todos)</option>
                    <option value="CON GESTIÓN">CON GESTIÓN</option>
                    <option value="SIN GESTIÓN">SIN GESTIÓN</option>
                </select>

                <select 
                    value={filters.Estado_Pago} 
                    onChange={(e) => onFilterChange('Estado_Pago', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Pagos (Todos)</option>
                    <option value="SIN PAGO">SIN PAGO</option>
                    <option value="PAGO">PAGO</option>
                </select>

                <select 
                    value={filters.Tipo_Novedad} 
                    onChange={(e) => onFilterChange('Tipo_Novedad', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Novedades (Todas)</option>
                    <option value="NOTIFICACIONES">NOTIFICACIONES</option>
                    <option value="COMPROMISO DE PAGO">COMPROMISO DE PAGO</option>
                    <option value="OTRAS GESTIONES">OTRAS GESTIONES</option>
                    <option value="NO LOCALIZADO">NO LOCALIZADO</option>
                    <option value="PAGOS PENDIENTES POR CRUZAR">PAGOS PENDIENTES POR CRUZAR</option>
                    <option value="SIN NOVEDAD">SIN NOVEDAD</option>
                </select>
            </div>

            {/* ─── BOTONES DE EXPORTAR Y COLUMNAS ─── */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                {exportButton}
                
                <div className="relative">
                    <button
                        onClick={handleMenuToggle}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#061428] border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all text-sm font-medium"
                    >
                        <Columns size={16} />
                        <span className="hidden sm:inline">Columnas</span>
                        <div className="flex items-center justify-center bg-indigo-500/20 text-indigo-300 rounded-md px-1.5 py-0.5 text-xs font-bold ml-1">
                            {visibleColumns.length}/{allColumns.length}
                        </div>
                        {isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-[#0b2241] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                            <div className="p-3 border-b border-white/10 bg-[#061428]/50">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar columna..."
                                        value={columnSearch}
                                        onChange={(e) => setColumnSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-[#0b2241] border border-white/10 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    <button onClick={handleSelectAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Todas</button>
                                    <button onClick={handleDeselectAll} className="text-xs text-slate-400 hover:text-slate-300 font-medium">Ninguna</button>
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                {filteredColumns.map(col => (
                                    <label key={col.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(col.key)}
                                                onChange={() => onToggleColumn(col.key)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-4 h-4 border border-slate-500 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all"></div>
                                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">
                                            {col.label}
                                        </span>
                                    </label>
                                ))}
                                {filteredColumns.length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No se encontraron columnas
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});



const TableView = React.memo(({ title, data, columns, loading, pagination, onPageChange }) => {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0b2241]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl min-h-[400px]">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-6 text-indigo-300 font-medium tracking-wide animate-pulse">Cargando datos de {title}...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-[#0b2241]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl min-h-[400px]">
                <div className="p-4 bg-[#061428] rounded-full mb-4">
                    <Database size={32} className="text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium text-lg">No se encontraron registros</p>
                <p className="text-slate-500 text-sm mt-1">Intenta con otros filtros o términos de búsqueda</p>
            </div>
        );
    }

    return (
        <div className="bg-[#0b2241]/80 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto custom-scrollbar flex-1">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr>
                            {columns.map((col, index) => (
                                <th 
                                    key={col.key} 
                                    className={`
                                        sticky top-0 z-10 
                                        bg-[#061428] border-b border-white/10
                                        p-4 text-xs font-bold text-indigo-300 uppercase tracking-wider
                                        ${index === 0 ? 'pl-6' : ''}
                                        ${index === columns.length - 1 ? 'pr-6' : ''}
                                        shadow-[0_4px_10px_-4px_rgba(0,0,0,0.3)]
                                    `}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex} 
                                className="hover:bg-white/[0.02] transition-colors duration-200 group"
                            >
                                {columns.map((col, colIndex) => {
                                    const value = row[col.key];
                                    const isNumber = typeof value === 'number';
                                    const displayValue = value === null || value === undefined ? '-' : value;
                                    
                                    return (
                                        <td 
                                            key={`${rowIndex}-${col.key}`} 
                                            className={`
                                                p-4 text-sm text-slate-300 whitespace-nowrap
                                                group-hover:text-slate-200
                                                ${colIndex === 0 ? 'pl-6 font-medium text-slate-200' : ''}
                                                ${colIndex === columns.length - 1 ? 'pr-6' : ''}
                                                ${isNumber ? 'font-mono' : ''}
                                            `}
                                        >
                                            {isNumber && col.key.toLowerCase().includes('valor') 
                                                ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value)
                                                : displayValue}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination.total_pages > 1 && (
                <div className="bg-[#061428] border-t border-white/10 p-4 flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Mostrando página <span className="font-medium text-white">{pagination.current}</span> de <span className="font-medium text-white">{pagination.total_pages}</span>
                        <span className="mx-2 text-slate-600">•</span>
                        <span className="font-medium text-white">{pagination.total_records}</span> registros en total
                    </div>
                    
                    <div className="flex gap-2">
                        <button
                            onClick={() => onPageChange(pagination.current - 1)}
                            disabled={pagination.current === 1}
                            className="p-2 bg-[#0b2241] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => onPageChange(pagination.current + 1)}
                            disabled={pagination.current === pagination.total_pages}
                            className="p-2 bg-[#0b2241] border border-white/10 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});


    // ─── LÓGICA DE TABLA PARA CALL CENTER ──────────────────────────────────────────
const TablaRemotaCallCenter = ({ titulo, origen, apiClient, jobId, selectedFilters }) => {
    const [data, setData] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, total_pages: 0, total_records: 0 });
    
    // ─── ESTADO DE NUESTROS NUEVOS FILTROS ───
    const [localFilters, setLocalFilters] = useState({
        Rodamiento: '',
        Estado_Gestion: '',
        Estado_Pago: '',
        Tipo_Novedad: ''
    });
    const hasFetchedRef = useRef(false);

    const fetchData = useCallback(async (pageToFetch = 1) => {
        if (!jobId || !apiClient) return;
        
        setLoading(true);
        try {
            // Construimos el Payload solo con los filtros que tienen algún valor
            const payload = {
                job_id: jobId,
                origen: origen, 
                page: pageToFetch,
                page_size: 15
            };

           // Filtros locales de la tabla
           if (localFilters.Rodamiento) payload.rodamiento = [localFilters.Rodamiento];
if (localFilters.Estado_Gestion) payload.estado_gestion = [localFilters.Estado_Gestion];
if (localFilters.Estado_Pago) payload.estado_pago = [localFilters.Estado_Pago];
if (localFilters.Tipo_Novedad) payload.novedades = [localFilters.Tipo_Novedad];
           // Filtros globales
           if (selectedFilters?.Empresa?.length) payload.empresa = selectedFilters.Empresa;
           if (selectedFilters?.CALL_CENTER_FILTRO?.length) payload.call_center = selectedFilters.CALL_CENTER_FILTRO;

            const response = await apiClient.post('/wallet/buscar', payload);
            
            const items = response.data?.data || [];
            const metaInfo = response.data?.meta || {};

            setData(items);
            setPagination({
                current: metaInfo.page || pageToFetch,
                total_pages: metaInfo.pages || 0,
                total_records: metaInfo.total || 0
            });

            if (items.length > 0 && allColumns.length === 0) {
                const keys = Object.keys(items[0]).filter(k => k !== 'id' && !k.startsWith('_'));
                const generatedCols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ') }));
                setAllColumns(generatedCols);
                setVisibleColumns(generatedCols.slice(0, 5).map(c => c.key));
            }

        } catch (error) {
            console.error("Error cargando tabla de Call Center:", error);
        } finally {
            setLoading(false);
        }
    }, [apiClient, jobId, origen, allColumns.length, localFilters, selectedFilters]);

    // Re-fetch solo cuando cambian filtros o jobId, no en cada re-render
    useEffect(() => {
        fetchData(1);
    }, [jobId, localFilters, selectedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = useCallback((filterName, value) => {
        setLocalFilters(prev => ({ ...prev, [filterName]: value }));
    }, []);

    const handlePageChange = useCallback((newPage) => {
        fetchData(newPage);
    }, [fetchData]);

    const toggleColumn = useCallback((key) => {
        setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }, []);

    const filtrosExport = useMemo(() => {
        const payloadExport = {
            job_id: jobId,
            origen: origen,
            page: 1,
            page_size: 100000,
            columnas_visibles: visibleColumns
        };

        if (localFilters.Rodamiento) payloadExport.rodamiento = [localFilters.Rodamiento];
    if (localFilters.Estado_Gestion) payloadExport.estado_gestion = [localFilters.Estado_Gestion];
    if (localFilters.Estado_Pago) payloadExport.estado_pago = [localFilters.Estado_Pago];
    if (localFilters.Tipo_Novedad) payloadExport.novedades = [localFilters.Tipo_Novedad];

        return payloadExport;
    }, [jobId, origen, visibleColumns, localFilters]);

    const columnsToRender = useMemo(() => {
        return allColumns.filter(col => visibleColumns.includes(col.key));
    }, [allColumns, visibleColumns]);

    return (
        <div className="space-y-4 mt-10">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-[#061428] border border-white/5 rounded-xl text-purple-400 shadow-inner">
                    <Database size={24} strokeWidth={2} />
                </div>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 uppercase tracking-widest drop-shadow-sm">
                    {titulo}
                </h2>
            </div>
            <TableToolbar
                filters={localFilters}
                onFilterChange={handleFilterChange}
                allColumns={allColumns}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
                exportButton={
                    <ExportExcel
                        filtros={filtrosExport}
                        fileName={`${titulo.replace(/\s+/g, '_')}.xlsx`}
                        tableTitle={titulo}
                        isAvailable={data.length > 0 && visibleColumns.length > 0}
                    />
                }
            />
            <TableView
                title={titulo}
                data={data}
                columns={columnsToRender}
                loading={loading}
                pagination={pagination}
                onPageChange={handlePageChange}
            />
        </div>
    );
};

// ─── TOOLBAR: CALL CENTER + ESTADO GESTIÓN + NOVEDADES (todos dinámicos) ──────
const TableToolbarCallCenterGestion = React.memo(({ filters, onFilterChange, allColumns, visibleColumns, onToggleColumn, exportButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [columnSearch, setColumnSearch] = useState('');

    const handleMenuToggle = useCallback(() => setIsMenuOpen(prev => !prev), []);

    const handleSelectAll = useCallback(() => {
        allColumns.forEach(col => {
            if (!visibleColumns.includes(col.key)) onToggleColumn(col.key);
        });
    }, [allColumns, visibleColumns, onToggleColumn]);

    const handleDeselectAll = useCallback(() => {
        visibleColumns.forEach(key => onToggleColumn(key));
    }, [visibleColumns, onToggleColumn]);

    const filteredColumns = useMemo(() => {
        return allColumns.filter(col =>
            col.label.toLowerCase().includes(columnSearch.toLowerCase())
        );
    }, [allColumns, columnSearch]);

    return (
        <div className="relative z-20 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-4 bg-[#0b2241]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-xl">

            {/* FILTROS: Call Center, Estado Gestión, Novedades */}
            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                <select
                    value={filters.CALL_CENTER_FILTRO}
                    onChange={(e) => onFilterChange('CALL_CENTER_FILTRO', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Call Center (Todos)</option>
                    <option value="CALL 1">CALL 1</option>
                    <option value="CALL 2">CALL 2</option>
                </select>

                <select
                    value={filters.Estado_Gestion}
                    onChange={(e) => onFilterChange('Estado_Gestion', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Gestión (Todos)</option>
                    <option value="CON GESTIÓN">CON GESTIÓN</option>
                    <option value="SIN GESTIÓN">SIN GESTIÓN</option>
                </select>

                <select
                    value={filters.Tipo_Novedad}
                    onChange={(e) => onFilterChange('Tipo_Novedad', e.target.value)}
                    className="bg-[#061428] border border-white/10 rounded-xl text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm px-3 py-2.5 outline-none min-w-[140px]"
                >
                    <option value="">Novedades (Todas)</option>
                    <option value="NOTIFICACIONES">NOTIFICACIONES</option>
                    <option value="COMPROMISO DE PAGO">COMPROMISO DE PAGO</option>
                    <option value="OTRAS GESTIONES">OTRAS GESTIONES</option>
                    <option value="NO LOCALIZADO">NO LOCALIZADO</option>
                    <option value="PAGOS PENDIENTES POR CRUZAR">PAGOS PENDIENTES POR CRUZAR</option>
                    <option value="SIN NOVEDAD">SIN NOVEDAD</option>
                </select>
            </div>

            {/* BOTONES DE EXPORTAR Y COLUMNAS */}
            <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
                {exportButton}

                <div className="relative">
                    <button
                        onClick={handleMenuToggle}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#061428] border border-white/10 rounded-xl text-slate-300 hover:text-white hover:border-indigo-500/50 transition-all text-sm font-medium"
                    >
                        <Columns size={16} />
                        <span className="hidden sm:inline">Columnas</span>
                        <div className="flex items-center justify-center bg-indigo-500/20 text-indigo-300 rounded-md px-1.5 py-0.5 text-xs font-bold ml-1">
                            {visibleColumns.length}/{allColumns.length}
                        </div>
                        {isMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-[#0b2241] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                            <div className="p-3 border-b border-white/10 bg-[#061428]/50">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400" size={14} />
                                    <input
                                        type="text"
                                        placeholder="Buscar columna..."
                                        value={columnSearch}
                                        onChange={(e) => setColumnSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 bg-[#0b2241] border border-white/10 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div className="flex justify-between mt-2 px-1">
                                    <button onClick={handleSelectAll} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Todas</button>
                                    <button onClick={handleDeselectAll} className="text-xs text-slate-400 hover:text-slate-300 font-medium">Ninguna</button>
                                </div>
                            </div>
                            <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                {filteredColumns.map(col => (
                                    <label key={col.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(col.key)}
                                                onChange={() => onToggleColumn(col.key)}
                                                className="peer sr-only"
                                            />
                                            <div className="w-4 h-4 border border-slate-500 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition-all"></div>
                                            <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <span className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">
                                            {col.label}
                                        </span>
                                    </label>
                                ))}
                                {filteredColumns.length === 0 && (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No se encontraron columnas
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

// ─── TABLA REMOTA: CALL CENTER + ESTADO GESTIÓN + NOVEDADES ──────────────────
const TablaRemotaCallCenterGestion = ({ titulo, origen, apiClient, jobId, selectedFilters }) => {
    const [dataCG, setDataCG] = useState([]);
    const [allColumnsCG, setAllColumnsCG] = useState([]);
    const [visibleColumnsCG, setVisibleColumnsCG] = useState([]);
    const [loadingCG, setLoadingCG] = useState(false);
    const [paginationCG, setPaginationCG] = useState({ current: 1, total_pages: 0, total_records: 0 });

    const [localFiltersCG, setLocalFiltersCG] = useState({
        CALL_CENTER_FILTRO: '',
        Estado_Gestion: '',
        Tipo_Novedad: ''
    });

    const fetchDataCG = useCallback(async (pageToFetch = 1) => {
        if (!jobId || !apiClient) return;
        setLoadingCG(true);
        try {
            const payload = {
                job_id:    jobId,
                origen:    origen,
                page:      pageToFetch,
                page_size: 10,
            };

            if (localFiltersCG.Estado_Gestion) payload.estado_gestion = [localFiltersCG.Estado_Gestion];
            if (localFiltersCG.Tipo_Novedad)   payload.novedades       = [localFiltersCG.Tipo_Novedad];
            // Filtros globales
            if (selectedFilters?.Empresa?.length) payload.empresa = selectedFilters.Empresa;
            if (selectedFilters?.CALL_CENTER_FILTRO?.length) payload.call_center = selectedFilters.CALL_CENTER_FILTRO;

            const response = await apiClient.post('/wallet/buscar', payload);

            let items      = response.data?.data || [];
            const metaInfo = response.data?.meta || {};

            // Filtro cliente: CALL_CENTER
            if (localFiltersCG.CALL_CENTER_FILTRO) {
                const cc = localFiltersCG.CALL_CENTER_FILTRO.toUpperCase();
                items = items.filter(row => {
                    const val = (row.CALL_CENTER || row.call_center || '').toString().toUpperCase();
                    return val === cc || val.includes(cc);
                });
            }

            setDataCG(items);
            setPaginationCG({
                current:       metaInfo.page  || pageToFetch,
                total_pages:   metaInfo.pages || 0,
                total_records: items.length   || 0
            });

            if (items.length > 0 && allColumnsCG.length === 0) {
                const keys          = Object.keys(items[0]).filter(k => k !== 'id' && !k.startsWith('_'));
                const generatedCols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ') }));
                setAllColumnsCG(generatedCols);
                setVisibleColumnsCG(generatedCols.slice(0, 8).map(c => c.key));
            }
        } catch (error) {
            console.error('Error cargando tabla Call Center Gestión:', error);
        } finally {
            setLoadingCG(false);
        }
    }, [apiClient, jobId, origen, allColumnsCG.length, localFiltersCG.CALL_CENTER_FILTRO, localFiltersCG.Estado_Gestion, localFiltersCG.Tipo_Novedad, selectedFilters]);

    // Re-fetch solo cuando cambian filtros o jobId
    useEffect(() => {
        fetchDataCG(1);
    }, [jobId, localFiltersCG, selectedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChangeCG = useCallback((filterName, value) => {
        setLocalFiltersCG(prev => ({ ...prev, [filterName]: value }));
    }, []);

    const handlePageChangeCG = useCallback((newPage) => {
        fetchDataCG(newPage);
    }, [fetchDataCG]);

    const toggleColumnCG = useCallback((key) => {
        setVisibleColumnsCG(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const filtrosExportCG = useMemo(() => {
        const payload = {
            job_id:            jobId,
            origen:            origen,
            page:              1,
            page_size:         100000,
            columnas_visibles: visibleColumnsCG,
        };
        if (localFiltersCG.Estado_Gestion) payload.estado_gestion = [localFiltersCG.Estado_Gestion];
        if (localFiltersCG.Tipo_Novedad)   payload.novedades       = [localFiltersCG.Tipo_Novedad];
        return payload;
    }, [jobId, origen, visibleColumnsCG, localFiltersCG]);

    const columnsToRenderCG = useMemo(() => {
        return allColumnsCG.filter(col => visibleColumnsCG.includes(col.key));
    }, [allColumnsCG, visibleColumnsCG]);

    return (
        <div className="space-y-4 mt-10">
            <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-[#061428] border border-white/5 rounded-xl text-purple-400 shadow-inner">
                    <Database size={24} strokeWidth={2} />
                </div>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 uppercase tracking-widest drop-shadow-sm">
                    {titulo}
                </h2>
            </div>
            <TableToolbarCallCenterGestion
                filters={localFiltersCG}
                onFilterChange={handleFilterChangeCG}
                allColumns={allColumnsCG}
                visibleColumns={visibleColumnsCG}
                onToggleColumn={toggleColumnCG}
                exportButton={
                    <ExportExcel
                        filtros={filtrosExportCG}
                        fileName={`${titulo.replace(/\s+/g, '_')}.xlsx`}
                        tableTitle={titulo}
                        isAvailable={dataCG.length > 0 && visibleColumnsCG.length > 0}
                    />
                }
            />
            <TableView
                title={titulo}
                data={dataCG}
                columns={columnsToRenderCG}
                loading={loadingCG}
                pagination={paginationCG}
                onPageChange={handlePageChangeCG}
            />
        </div>
    );
};

export default function CallCenter({ data, selectedFilters, apiClient, jobId }) {

   const [activeTab, setActiveTab] = useState('llamadas');
    // Menú de navegación de las pestañas
    const renderNavbar = () => (
        <div className="flex flex-wrap gap-2 bg-[#061428] p-1.5 rounded-xl border border-white/10 w-fit mb-6 shadow-lg">
            <button
                onClick={() => setActiveTab('llamadas')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === 'llamadas'
                        ? 'bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
                <Phone size={16} /> Llamadas
            </button>
            <button
                onClick={() => setActiveTab('mensajerias')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === 'mensajerias'
                        ? 'bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
                <MessageSquare size={16} /> Mensajerías
            </button>
            <button
                onClick={() => setActiveTab('novedades')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    activeTab === 'novedades'
                        ? 'bg-[#8b5cf6] text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
            >
                <Bell size={16} /> Novedades
            </button>
        </div>
    );

    // Procesamiento de datos para gráfico de barras
    const chartData = useMemo(() => {
        let reporteRaw = [];
        if (Array.isArray(data)) reporteRaw = data;
        else if (data?.reporte_raw && Array.isArray(data.reporte_raw)) reporteRaw = data.reporte_raw;
        else if (data?.data?.reporte_raw && Array.isArray(data.data.reporte_raw)) reporteRaw = data.data.reporte_raw;
        
        if (selectedFilters) {
            reporteRaw = reporteRaw.filter(item => {
                const matchEmpresa = !selectedFilters.Empresa?.length || selectedFilters.Empresa.includes(item.Empresa);
                const matchCall = !selectedFilters.CALL_CENTER_FILTRO?.length || selectedFilters.CALL_CENTER_FILTRO.includes(item.CALL_CENTER);
                return matchEmpresa && matchCall;
            });
        }
        
        return reporteRaw.map(item => {
            let val = item.Cumplimiento;
            if (typeof val === 'string') val = val.replace(',', '.');
            const cumplimientoNum = Number(val) || 0;
            const pct = (cumplimientoNum * 100).toFixed(2);
            return {
                ...item,
                CALL_CENTER: item.CALL_CENTER || 'Desconocido',
                porcentaje: Number(pct)
            };
        }).sort((a, b) => b.porcentaje - a.porcentaje); 
    }, [data, selectedFilters]);

    // Procesamiento de datos para gráfico circular (Rodamiento)
    const pieData = useMemo(() => {
        let rawData = [];
        if (data?.rodamiento_data && Array.isArray(data.rodamiento_data)) rawData = data.rodamiento_data;
        else if (data?.data?.rodamiento_data && Array.isArray(data.data.rodamiento_data)) rawData = data.data.rodamiento_data;

        if (!rawData.length) return [];

        const total = rawData.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

        return rawData.map(item => ({
            ...item,
            count: Number(item.count) || 0,
            percentage: total > 0 ? ((Number(item.count) || 0) / total * 100).toFixed(2) : 0
        })).sort((a, b) => b.count - a.count); 
    }, [data]);

    const tableTotals = useMemo(() => {
        const totals = chartData.reduce((acc, curr) => {
            acc.meta += Number(curr['META_$']) || 0;
            acc.recaudo += Number(curr.Recaudo_Meta) || 0;
            acc.faltante += Number(curr.Faltante) || 0;
            return acc;
        }, { meta: 0, recaudo: 0, faltante: 0 });

        const cumplimientoTotal = totals.meta > 0 
            ? ((totals.recaudo / totals.meta) * 100).toFixed(2) 
            : 0;

        return { ...totals, cumplimientoTotal };
    }, [chartData]);

    // ─── COMPONENTES DE TABLA (TOOLBAR Y VIEW) ───────────────────────────────────


    return (

        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-6">
            
            {/* GRÁFICOS 1 Y 2: FILA ALINEADA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* GRÁFICO 1: BARRAS */}
            <ChartCard 
                title="Rendimiento Call Center" 
                subtitle="Porcentaje de cumplimiento por asesor"
                isEmpty={chartData.length === 0}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="rgba(255,255,255,0.06)" />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="CALL_CENTER" axisLine={false} tickLine={false} tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} width={60} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                        <Bar dataKey="porcentaje" radius={[0, 6, 6, 0]} barSize={30}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill="#8b5cf6" />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </ChartCard>

            {/* GRÁFICO 2: CIRCULAR (RODAMIENTO) */}
            <ChartCard 
                title="Rodamientos en Call Centers" 
                subtitle="Distribución de estado de rodamiento"
                isEmpty={pieData.length === 0}
            >
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                        <Pie
                            data={pieData}
                            cx="45%" 
                            cy="50%"
                            innerRadius={0} 
                            outerRadius={155} 
                            dataKey="count"
                            nameKey="Rodamiento" // CORRECCIÓN: Esto renderiza los nombres correctos en la leyenda
                            stroke="rgba(255,255,255,0.05)" 
                            strokeWidth={2}
                            labelLine={false}
                            label={renderCustomizedLabel}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieCustomTooltip />} />
                        <Legend 
                            verticalAlign="middle" 
                            align="right" 
                            layout="vertical" 
                            iconType="circle"
                            wrapperStyle={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </ChartCard>

            </div>{/* fin grid 2 columnas */}

            <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col mt-4">
                
                {/* Header de la tabla similar a la imagen */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-[#131129]/80">
                    <h3 className="text-[13px] font-black text-white uppercase tracking-wider">Detalle por Asesor</h3>
                    <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 text-xs font-bold text-slate-300">
                        {chartData.length} ASESORES
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-[#0f172a]/60 text-[11px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                                <th className="p-4 font-black">Call Center</th>
                                <th className="p-4 font-black">Nombre</th>
                                <th className="p-4 font-black text-right">Meta ($)</th>
                                <th className="p-4 font-black text-right">Recaudo ($)</th>
                                <th className="p-4 font-black text-right">Faltante ($)</th>
                                <th className="p-4 font-black text-right pr-8">Progreso</th>
                            </tr>
                        </thead>
                        <tbody className="text-[12px] sm:text-[13px]">
                            {chartData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500 font-bold uppercase tracking-widest">Sin datos para mostrar</td>
                                </tr>
                            ) : (
                                chartData.map((row, idx) => {
                                    const progColor = getDynamicColor(row.porcentaje);
                                    return (
                                        <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-bold text-white">{row.CALL_CENTER}</td>
                                            {/* Azul celeste para el nombre, como las 'Cuentas' en la imagen */}
                                            <td className="p-4 font-bold text-[#38bdf8]">{row.NOMBRE ? row.NOMBRE.trim() : 'N/A'}</td>
                                            <td className="p-4 text-right text-slate-200 font-mono font-semibold">{formatCurrency(row['META_$'])}</td>
                                            {/* Verde para el recaudo */}
                                            <td className="p-4 text-right text-[#10b981] font-mono font-semibold">{formatCurrency(row.Recaudo_Meta)}</td>
                                            {/* Rojo para el faltante */}
                                            <td className="p-4 text-right text-[#ef4444] font-mono font-semibold">{formatCurrency(row.Faltante)}</td>
                                            <td className="p-4 pr-8">
                                                <div className="flex items-center justify-end gap-3 w-full ml-auto">
                                                    <span className="font-bold text-[13px]" style={{ color: progColor }}>
                                                        {row.porcentaje}%
                                                    </span>
                                                    <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                                            style={{ 
                                                                width: `${Math.min(100, row.porcentaje)}%`,
                                                                backgroundColor: progColor 
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {/* FILA DE TOTALES */}
                        {chartData.length > 0 && (
                            <tfoot className="bg-[#020617]/80 border-t border-white/10 text-[13px]">
                                <tr>
                                    <td colSpan="2" className="p-4 font-black text-white text-center tracking-widest">TOTAL</td>
                                    <td className="p-4 text-right text-white font-mono font-bold">{formatCurrency(tableTotals.meta)}</td>
                                    <td className="p-4 text-right text-[#10b981] font-mono font-bold">{formatCurrency(tableTotals.recaudo)}</td>
                                    <td className="p-4 text-right text-[#ef4444] font-mono font-bold">{formatCurrency(tableTotals.faltante)}</td>
                                    <td className="p-4 pr-8">
                                        <div className="flex items-center justify-end gap-3 w-full ml-auto">
                                            <span className="font-bold text-[13px]" style={{ color: getDynamicColor(tableTotals.cumplimientoTotal) }}>
                                                {tableTotals.cumplimientoTotal}%
                                            </span>
                                            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full rounded-full"
                                                    style={{ 
                                                        width: `${Math.min(100, tableTotals.cumplimientoTotal)}%`,
                                                        backgroundColor: getDynamicColor(tableTotals.cumplimientoTotal) 
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>  
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <SummaryCard 
                    title="Meta Total" 
                    value={formatCurrency(tableTotals.meta)} 
                    color="#ffffff" 
                />
                <SummaryCard 
                    title="Recaudo Total" 
                    value={formatCurrency(tableTotals.recaudo)} 
                    color="#10b981" /* Verde */
                />
                <SummaryCard 
                    title="Faltante Total" 
                    value={formatCurrency(tableTotals.faltante)} 
                    color="#ef4444" /* Rojo */
                />
                <SummaryCard 
                    title="Cumplimiento" 
                    value={`${tableTotals.cumplimientoTotal}%`} 
                    color={getDynamicColor(tableTotals.cumplimientoTotal)} /* Color Dinámico */
                />
            </div>

            {jobId && apiClient && (
                <TablaRemotaCallCenter 
                    titulo="Detalle de Operación Call Center"
                    origen="detallados_call_center" 
                    apiClient={apiClient}
                    jobId={jobId}
                    selectedFilters={selectedFilters}
                />
            )}

          <div className="space-y-6 w-full animate-in fade-in duration-500">
            {/* 1. RENDERIZAMOS EL NAVBAR AQUÍ ARRIBA */}
            {renderNavbar()}

            {/* 2. RENDER CONDICIONAL DEPENDIENDO DE LA PESTAÑA */}
                        {/* PESTAÑA LLAMADAS - siempre montada, visible con CSS para preservar estado y tamaño */}
            <div style={{ display: activeTab === 'llamadas' ? 'block' : 'none' }}>
                <div className="mb-6">
                    <Llamadas_Call 
                        stats={data?.llamadas_stats}
                        graficoData={data?.df_grafico_llamadas || data?.data?.df_grafico_llamadas}
                        efectividadData={data?.df_efectividad_call || data?.data?.df_efectividad_call}
                        evolucionData={data?.df_llamadas_por_dia || data?.data?.df_llamadas_por_dia}
                        isLoading={!data}
                        apiClient={apiClient}
                        jobId={jobId}
                    />
                </div>
            </div>
            {/* PESTAÑA MENSAJERÍAS - siempre montada */}
            <div style={{ display: activeTab === 'mensajerias' ? 'block' : 'none' }}>
                <Mensajeria_Call 
                    data={data?.df_funnel_mensajeria} 
                    efectividadMensajeria={data?.df_efectividad_mensajeria} 
                    isLoading={!data} 
                />
            </div>
            {/* PESTAÑA NOVEDADES - siempre montada */}
            <div style={{ display: activeTab === 'novedades' ? 'block' : 'none' }}>
                <Novedades_Call 
                    data={data?.df_agg_tipo || data?.data?.df_agg_tipo} 
                    df_compromisos={data?.df_compromisos || data?.data?.df_compromisos}
                    selectedFilters={selectedFilters} 
                />
            </div>
        </div>

            {/* ── TABLA: CALL CENTER + ESTADO GESTIÓN + NOVEDADES ── */}
            {jobId && apiClient && (
                <TablaRemotaCallCenterGestion
                    titulo="Call Center – Gestión y Novedades"
                    origen="detallados_call_center"
                    apiClient={apiClient}
                    jobId={jobId}
                    selectedFilters={selectedFilters}
                />
            )}

        </div>
        
    );
}