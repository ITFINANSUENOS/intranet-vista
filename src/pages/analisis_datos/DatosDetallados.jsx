import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Database, Search, ChevronDown, ChevronUp, Columns, ChevronLeft, ChevronRight } from 'lucide-react';
import ExportExcel from "../../components/cartera_buttons/ExportExcel"; // Asegúrate de que la ruta sea correcta

// ─── BARRA DE HERRAMIENTAS DE TABLA (COMO EN SEGUIMIENTOS) ──────────────────
const TableToolbar = React.memo(({ onSearch, searchValue, allColumns, visibleColumns, onToggleColumn, exportButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [columnSearch, setColumnSearch] = useState(''); // Estado para el buscador de columnas
    
    const handleMenuToggle = useCallback(() => setIsMenuOpen(prev => !prev), []);
    
    const handleSelectAll = useCallback(() => {
        allColumns.forEach(col => { 
            if (!visibleColumns.includes(col.key)) onToggleColumn(col.key); 
        });
    }, [allColumns, visibleColumns, onToggleColumn]);
    
    const handleDeselectAll = useCallback(() => {
        visibleColumns.forEach(key => onToggleColumn(key));
    }, [visibleColumns, onToggleColumn]);

    // Filtrar columnas basadas en el buscador interno
    const filteredColumns = useMemo(() => {
        return allColumns.filter(col => 
            col.label.toLowerCase().includes(columnSearch.toLowerCase())
        );
    }, [allColumns, columnSearch]);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            {/* Buscador Principal */}
            <div className="relative w-full md:flex-1 md:max-w-lg group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-[1rem] blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400/80 transition-colors group-focus-within:text-cyan-300">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder="Buscar en la tabla..."
                    value={searchValue}
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full bg-[#0b2241]/80 border border-white/10 rounded-[1rem] py-3 pl-12 pr-4 text-xs font-bold text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/50 transition-all shadow-inner"
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Selector de Columnas */}
                <div className="relative">
                    <button
                        onClick={handleMenuToggle}
                        className="flex items-center justify-between w-full md:w-auto gap-3 px-5 py-3 bg-[#0b2241]/80 border border-white/10 rounded-[1rem] text-[10px] font-black text-slate-200 uppercase tracking-wider hover:bg-white/5 hover:border-indigo-400/50 transition-all group shadow-sm"
                    >
                        <div className="flex items-center gap-2">
                            <Columns size={16} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                            <span>Columnas ({visibleColumns.length}/{allColumns.length})</span>
                        </div>
                        {isMenuOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-72 bg-[#0b1f3a]/95 backdrop-blur-2xl border border-indigo-500/30 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            
                            {/* Header del Menú de Columnas (Buscador + Botones) */}
                            <div className="p-3 border-b border-white/5 bg-[#08182f]/90">
                                <div className="relative flex items-center mb-3 group/search">
                                    <Search size={14} className="absolute left-3 text-slate-400 group-focus-within/search:text-indigo-400 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Buscar columna..."
                                        value={columnSearch}
                                        onChange={(e) => setColumnSearch(e.target.value)}
                                        className="w-full bg-[#061428]/80 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="flex justify-between gap-2">
                                    <button onClick={handleSelectAll} className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-200 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-indigo-500/20">Mostrar Todas</button>
                                    <button onClick={handleDeselectAll} className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors border border-white/5">Ocultar Todas</button>
                                </div>
                            </div>

                            {/* Lista de Columnas Filtradas */}
                            <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                <div className="px-3 py-2">
                                    {filteredColumns.length > 0 ? (
                                        filteredColumns.map((col, idx) => (
                                            <label key={col.key} className={`flex items-center gap-3 cursor-pointer px-4 py-2.5 rounded-lg transition-all duration-200 group/item ${idx % 2 === 0 ? 'bg-slate-800/40' : 'bg-slate-800/20'} hover:bg-indigo-500/15 border border-transparent hover:border-indigo-500/30`}>
                                                <div className="relative flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={visibleColumns.includes(col.key)}
                                                        onChange={() => onToggleColumn(col.key)}
                                                        className="w-4 h-4 rounded bg-slate-700 border-2 border-indigo-400/40 text-indigo-500 cursor-pointer accent-indigo-500 appearance-none checked:bg-indigo-600 checked:border-indigo-500"
                                                    />
                                                    <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 group-hover/item:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: visibleColumns.includes(col.key) ? 'block' : 'none', opacity: visibleColumns.includes(col.key) ? 1 : 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-300 group-hover/item:text-indigo-200 uppercase tracking-wider transition-colors">{col.label}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-[10px] text-slate-500 uppercase font-bold">
                                            No se encontraron columnas
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Botón Excel */}
                {exportButton}
            </div>
        </div>
    );
});
TableToolbar.displayName = 'TableToolbar';

// ─── VISTA DE TABLA CON ESTILOS Y PAGINACIÓN ─────────────────────────────────
const TableView = React.memo(({ title, data, columns, loading, pagination, onPageChange }) => {
    return (
        <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[0_10px_40px_rgba(34,211,235,0.1)]">
            <div className="px-6 py-5 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full bg-gradient-to-b from-cyan-400 to-blue-600 shadow-[0_0_10px_rgba(34,211,235,0.5)]"></div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest drop-shadow-md">{title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50">
                        Total: {pagination.total_records || 0}
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-max">
                    <thead>
                        <tr className="bg-[#061428]/90 border-b border-white/10 shadow-sm">
                            {columns.map((col) => (
                                <th key={col.key} className="p-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest whitespace-nowrap">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 relative">
                        {loading && (
                            <tr>
                                <td colSpan={columns.length} className="p-0">
                                    <div className="absolute inset-0 bg-[#0b2241]/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <div className="flex items-center gap-3 bg-indigo-900/80 px-6 py-3 rounded-full border border-indigo-500/30 shadow-2xl">
                                            <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin"></div>
                                            <span className="text-xs font-bold text-indigo-200 uppercase tracking-widest">Actualizando...</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {data.length === 0 && !loading ? (
                            <tr>
                                <td colSpan={columns.length} className="p-16 text-center text-slate-500 uppercase text-[10px] font-bold">
                                    No se encontraron registros
                                </td>
                            </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors">
                                    {columns.map((col) => (
                                        <td key={`${idx}-${col.key}`} className="p-4 text-[10px] font-bold text-slate-200 whitespace-nowrap">
                                            {row[col.key] !== null && row[col.key] !== undefined 
                                                ? (typeof row[col.key] === 'number' ? row[col.key].toLocaleString() : row[col.key]) 
                                                : <span className="text-slate-500">N/A</span>}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Página {pagination.current} de {pagination.total_pages || 1}
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, pagination.current - 1))}
                        disabled={pagination.current <= 1 || loading}
                        className="p-2.5 rounded-xl border border-white/10 bg-[#0b2241] hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        onClick={() => onPageChange(pagination.current + 1)}
                        disabled={!pagination.total_pages || pagination.current >= pagination.total_pages || loading}
                        className="p-2.5 rounded-xl border border-white/10 bg-[#0b2241] hover:bg-white/10 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
});
TableView.displayName = 'TableView';

// ─── LÓGICA DE DATOS Y CONEXIÓN AL CONTROLADOR ────────────────────────────────
const TablaRemota = ({ titulo, origen, apiClient, jobId, selectedFilters }) => {
    const [data, setData] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current: 1, total_pages: 0, total_records: 0 });
    
    const debounceSearch = useRef(null);

    const fetchData = useCallback(async (pageToFetch = 1, searchTerm = search) => {
        if (!jobId) return;
        
        setLoading(true);
        try {
            // 1. Mapear los filtros de React al formato que espera Laravel
            const mappedFilters = {
                empresa: selectedFilters.Empresa || [],
                call_center_filtro: selectedFilters.CALL_CENTER_FILTRO || [],
                zona: selectedFilters.Zona || [],
                regional_cobro: selectedFilters.Regional_Cobro || [],
                franja: selectedFilters.Franja_Cartera || [], // Nota: React envía Franja_Cartera, Laravel espera franja
                novedades: selectedFilters.Novedades || [] 
            };

            // 2. Limpiar arrays vacíos para no enviar basura al backend
            Object.keys(mappedFilters).forEach(key => {
                if (!mappedFilters[key] || mappedFilters[key].length === 0) {
                    delete mappedFilters[key];
                }
            });

            // 3. Construir el payload
            const payload = {
                job_id: jobId,
                origen: origen, 
                page: pageToFetch,
                page_size: 20,
                search_term: searchTerm,
                ...mappedFilters // Usar los filtros mapeados aquí
            };
            
            const response = await apiClient.post('/wallet/buscar', payload);
            
            const items = response.data?.data || [];
            const metaInfo = response.data?.meta || {};

            setData(items);
            setPagination({
                current: metaInfo.page || pageToFetch,
                total_pages: metaInfo.pages || 0,
                total_records: metaInfo.total || 0
            });

            // Generar columnas dinámicamente y seleccionar solo las 5 primeras por defecto
            if (items.length > 0 && allColumns.length === 0) {
                const keys = Object.keys(items[0]).filter(k => k !== 'id' && !k.startsWith('_'));
                const generatedCols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ') }));
                setAllColumns(generatedCols);
                
                // LIMITAR A 5 COLUMNAS VISIBLES INICIALMENTE
                setVisibleColumns(generatedCols.slice(0, 5).map(c => c.key));
            }

        } catch (error) {
            console.error("Error cargando tabla remota:", error);
        } finally {
            setLoading(false);
        }
    }, [apiClient, jobId, origen, selectedFilters, allColumns.length, search]);

    useEffect(() => {
        fetchData(1, search);
    }, [fetchData, selectedFilters, jobId]);

    const handleSearch = useCallback((value) => {
        setSearch(value);
        clearTimeout(debounceSearch.current);
        debounceSearch.current = setTimeout(() => {
            fetchData(1, value);
        }, 350);
    }, [fetchData]);

    const handlePageChange = useCallback((newPage) => {
        fetchData(newPage, search);
    }, [fetchData, search]);

    const toggleColumn = useCallback((key) => {
        setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }, []);

    const handleExport = useCallback(() => {
        console.log("Iniciando exportación para:", titulo);
        // Aquí puedes agregar la petición al backend para generar el archivo Excel o descargar
    }, [titulo]);

    const columnsToRender = useMemo(() => {
        return allColumns.filter(col => visibleColumns.includes(col.key));
    }, [allColumns, visibleColumns]);

    return (
        <div className="space-y-4 mb-10">
            <TableToolbar
                onSearch={handleSearch}
                searchValue={search}
                allColumns={allColumns}
                visibleColumns={visibleColumns}
                onToggleColumn={toggleColumn}
                exportButton={
                    <ExportExcel
                        onExport={handleExport}
                        tableTitle={titulo}
                        isAvailable={data.length > 0}
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

// ─── COMPONENTE PRINCIPAL EXPORTADO ───────────────────────────────────────────
export default function DatosDetallados({ apiClient, jobId, selectedFilters }) {
    if (!jobId) return null;

    return (
        <div className="space-y-6 p-4">
            {/* NUEVO ENCABEZADO: Más estético, sobrio y acorde al diseño oscuro */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#061428] border border-white/5 rounded-xl text-indigo-400 shadow-inner">
                        <Database size={24} strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400 uppercase tracking-widest drop-shadow-sm">
                            Explorador de Datos
                        </h2>
                        
                    </div>
                </div>
            </div>

            <TablaRemota 
                titulo="Detallado de Cartera"
                origen="detallados_cartera" 
                apiClient={apiClient}
                jobId={jobId}
                selectedFilters={selectedFilters}
            />

            <TablaRemota 
                titulo="Detallado de Novedades"
                origen="detallados_novedades"
                apiClient={apiClient}
                jobId={jobId}
                selectedFilters={selectedFilters}
            />
        </div>
    );
}