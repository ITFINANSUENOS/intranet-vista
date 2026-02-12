import React, { useState, useMemo } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Label, Customized
} from 'recharts';
import { 
    Search, Filter, ChevronDown, ChevronUp, Columns, ArrowLeftCircle, Building2, MapPin, Layers, Target, Trophy, ChevronLeft, ChevronRight, X
} from 'lucide-react';

export const COLOR_MAP = {
    // ESTADOS DE GESTIÓN (Prioridad: Diferenciación visual en gráficas apiladas)
    'APROBADO': '#059669',      // Emerald 600 (Éxito fuerte)
    'VIABILIZADO': '#10b981',   // Emerald 500 (Éxito medio)
    'PAGO': '#10b981',          // Emerald 500
    
    'RECHAZADO': '#dc2626',     // Red 600 (Error fuerte)
    'ANULADO': '#ef4444',       // Red 500
    'NEGADO': '#b91c1c',        // Red 700
    'SIN PAGO': '#ef4444',      // Red 500
    
    'STAND BY': '#d97706',      // Amber 600 (Advertencia visible)
    'PENDIENTE': '#f59e0b',     // Amber 500
    'EN PROCESO': '#2563eb',    // Blue 600 (Proceso activo)
    'TRAMITE': '#3b82f6',       // Blue 500
    
    'DEVUELTO': '#8b5cf6',      // Violet 500 (Diferente a rojo/azul)
    'SUBSANAR': '#a855f7',      // Purple 500
    
    'RADICADO': '#0891b2',      // Cyan 600
    'LEGALIZADO': '#0284c7',    // Sky 600
    
    // ESTADOS DE CARTERA / TIEMPO (Gradientes lógicos)
    'VIGENTES': '#16a34a',          // Green 600
    'DIAS 1-10': '#86efac',         // Green 300
    'DIAS 11-20': '#4ade80',        // Green 400
    'DIAS 21+': '#22c55e',          // Green 500
    
    'VIGENCIA EXPIRADA': '#f43f5e', // Rose 500
    
    // RANGOS DE MORA (Semáforo)
    '1 A 30': '#facc15',    // Yellow 400
    '31 A 90': '#fb923c',   // Orange 400
    '91 A 180': '#f87171',  // Red 400
    '181 A 360': '#c084fc', // Purple 400
    'MAYOR A 360': '#6366f1', // Indigo 500

    // GESTIÓN CALL CENTER
    'SIN GESTIÓN': '#94a3b8',      // Slate 400 (Neutral)
    'CON GESTIÓN': '#0d9488',      // Teal 600
    'CALL CENTER': '#6366f1',      // Indigo 500
    'COBRANZA': '#84cc16',         // Lime 500
    'OTROS': '#cbd5e1',            // Slate 300
    
    // CUMPLIMIENTO
    'TOTAL': '#0f172a',            // Slate 900 (Negro suave)
    'CUMPLIMIENTO_BAJO': '#ef4444',
    'CUMPLIMIENTO_MEDIO': '#eab308',
    'CUMPLIMIENTO_ALTO': '#22c55e',
};

// Paleta por defecto robusta (12 colores distintos) para datos sin mapeo
export const DEFAULT_COLORS = [
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Green
    '#d97706', // Amber
    '#7c3aed', // Violet
    '#0891b2', // Cyan
    '#db2777', // Pink
    '#65a30d', // Lime
    '#475569', // Slate
    '#ea580c', // Orange
    '#059669', // Emerald
    '#4f46e5'  // Indigo
];

// --- COMPONENTES VISUALES ---

export const StackedBar = ({ data, keys, isCurrency }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, bottom: 45, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 800, fill: '#94a3b8'}} axisLine={false} tickLine={false} interval={0} angle={-45} textAnchor="end" height={70} />
            <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(v) => isCurrency ? `$${(v/1000000).toFixed(0)}M` : v.toLocaleString()} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingBottom: '20px'}} />
            {keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={COLOR_MAP[k.toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} barSize={30} />)}
        </BarChart>
    </ResponsiveContainer>
);

// --- MODIFICACIÓN CLAVE: SIDEBAR RESPONSIVO CON PROPIEDADES DE APERTURA ---
export const FilterSidebar = ({ options, selectedFilters, onFilterChange, onClear, isOpen, onClose }) => {
    const categories = [
        { key: 'Empresa', label: 'Empresa', icon: <Building2 size={14}/> },
        { key: 'CALL_CENTER_FILTRO', label: 'Call Center', icon: <Target size={14}/> },
        { key: 'Zona', label: 'Zona', icon: <MapPin size={14}/> },
        { key: 'Regional_Cobro', label: 'Regional Cobro', icon: <MapPin size={14}/> },
        { key: 'Franja_Cartera', label: 'Franja Cartera', icon: <Layers size={14}/> }
    ];

    return (
        <>
            {/* Overlay para móvil */}
            <div 
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />
            
            {/* Sidebar con clases condicionales para móvil vs escritorio */}
            <aside className={`
                fixed md:sticky top-0 md:top-20 left-0 h-full md:h-[calc(100vh-80px)] 
                w-72 bg-white border-r border-slate-100 overflow-y-auto p-6 
                flex flex-col gap-8 shrink-0 shadow-2xl md:shadow-sm z-50 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-indigo-600" />
                        <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Filtros Operativos</h2>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onClear} className="text-[9px] font-bold text-red-500 hover:underline uppercase">Limpiar</button>
                        {/* Botón de cerrar solo en móvil */}
                        <button onClick={onClose} className="md:hidden text-slate-400 hover:text-slate-600">
                            <X size={16} />
                        </button>
                    </div>
                </div>
                {categories.map((cat) => (
                    <div key={cat.key} className="space-y-3">
                        <div className="flex items-center gap-2 text-slate-400">
                            {cat.icon}
                            <h3 className="text-[10px] font-black uppercase tracking-widest">{cat.label}</h3>
                        </div>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2">
                            {options[cat.key]?.map((opt) => (
                                <label key={opt} className="flex items-center gap-3 group cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" checked={selectedFilters[cat.key]?.includes(opt)} onChange={() => onFilterChange(cat.key, opt)} />
                                    <span className="text-[10px] font-bold text-slate-600 uppercase truncate">{opt || 'SIN DATO'}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </aside>
        </>
    );
};

export const LocalFilterSection = ({ title, configs, filters, onFilterChange, isOpen, onToggle }) => (
    <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2"><Filter size={14} className="text-slate-500" /><h3 className="text-[10px] font-black text-slate-700 uppercase">{title}</h3></div>
            {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {isOpen && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100">
                {configs.map((config) => (
                    <div key={config.key} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 block">{config.label}</label>
                        <select className="w-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg py-2 px-3 outline-none uppercase"
                            value={filters[config.key]?.[0] || ''} onChange={(e) => { const val = e.target.value; onFilterChange(config.key, val ? [val] : []); }}>
                            <option value="">Todos</option>
                            {config.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export const TableToolbar = ({ onSearch, searchValue, allColumns, visibleColumns, onToggleColumn, placeholder }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:flex-1 md:max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={searchValue} placeholder={placeholder || "Buscar..."} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none" onChange={(e) => onSearch(e.target.value)} />
            </div>
            <div className="relative w-full md:w-auto">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl">
                    <Columns size={16} className="text-indigo-600"/><span className="text-[10px] font-black text-slate-700 uppercase">Columnas</span>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[60] p-3 max-h-80 overflow-y-auto">
                        {allColumns.map((col) => (
                            <label key={col.key} className="flex items-center gap-3 cursor-pointer p-1">
                                <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => onToggleColumn(col.key)} />
                                <span className="text-[10px] font-bold uppercase">{col.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const TableView = ({ data, columns, pagination, onPageChange, loading, title }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden mb-10">
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
            <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{title}</h4>
            <div className="px-3 py-1 bg-indigo-50 rounded-lg"><span className="text-[9px] font-black text-indigo-600 uppercase">Total: {pagination.total_records.toLocaleString()} registros</span></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                        {columns.map((col) => <th key={col.key} className="p-4 text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">{col.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (<tr><td colSpan={columns.length} className="p-12 text-center text-[10px] font-bold text-slate-400 animate-pulse">CARGANDO...</td></tr>) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                {columns.map((col) => <td key={`${idx}-${col.key}`} className="p-3 text-[10px] font-semibold text-slate-600 whitespace-nowrap">{row[col.key] !== null && row[col.key] !== undefined ? row[col.key].toLocaleString() : '-'}</td>)}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="flex justify-between items-center p-4 bg-slate-50/50 border-t border-slate-100">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Página {pagination.current} de {pagination.total_pages || 1}</span>
            <div className="flex gap-2">
                <button disabled={pagination.current <= 1 || loading} onClick={() => onPageChange(pagination.current - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black">ANTERIOR</button>
                <button disabled={pagination.current >= pagination.total_pages || loading} onClick={() => onPageChange(pagination.current + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black">SIGUIENTE</button>
            </div>
        </div>
    </div>
);

// --- COMPONENTE 1: GAUGE ---
const RADIAN = Math.PI / 180;

export const GaugeWithDetailsCard = ({ title, value, meta, recaudo, faltante, isMain = false }) => {
    const safeValue = Math.min(Math.max(Number(value) || 0, 0), 100);
    const safeMeta = Number(meta) || 0;
    const safeRecaudo = Number(recaudo) || 0;
    const safeFaltante = Number(faltante) || 0;
    
    const heightClass = isMain ? "h-[400px]" : "h-[280px]";
    const titleClass = isMain ? "text-xl mb-6" : "text-[10px] mb-2";
    const percentSize = isMain ? "text-5xl" : "text-3xl";

    const gaugeData = [
        { value: 20, color: '#ef4444' },
        { value: 20, color: '#f97316' },
        { value: 20, color: '#eab308' },
        { value: 20, color: '#84cc16' },
        { value: 20, color: '#22c55e' },
    ];

    const needleAngle = 180 - (safeValue * 1.8);
    
    const renderNeedle = (cx, cy, iR, oR, color) => {
        const length = (iR + 2 * oR) / 3;
        const sin = Math.sin(-RADIAN * needleAngle);
        const cos = Math.cos(-RADIAN * needleAngle);
        const r = 5; 
        const x0 = cx;
        const y0 = cy;
        const xba = x0 + r * sin;
        const yba = y0 - r * cos;
        const xbb = x0 - r * sin;
        const ybb = y0 + r * cos;
        const xp = x0 + length * cos;
        const yp = y0 + length * sin;

        return (
            <g>
                <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" />
                <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} Z`} stroke="none" fill={color} />
            </g>
        );
    };

    return (
        <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-between p-6 relative overflow-hidden ${heightClass}`}>
            <h3 className={`${titleClass} font-black text-slate-700 uppercase tracking-tight text-center z-10`}>
                {title}
            </h3>
            <div className="w-full flex-1 relative flex flex-col items-center justify-start mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={gaugeData}
                            cx="50%"
                            cy="70%" 
                            startAngle={180}
                            endAngle={0}
                            innerRadius={isMain ? 110 : 60}
                            outerRadius={isMain ? 140 : 80}
                            paddingAngle={0}
                            dataKey="value"
                            stroke="white"
                            strokeWidth={2}
                        >
                            {gaugeData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Customized component={(props) => {
                            if (!props || !props.viewBox) return null;
                            const { cx, cy } = props.viewBox;
                            const outerRadius = isMain ? 140 : 80;
                            const innerRadius = isMain ? 110 : 60;
                            return renderNeedle(cx, cy * 1.4, innerRadius, outerRadius, '#334155');
                        }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[65%] left-0 right-0 text-center transform -translate-y-1/2">
                     <span className={`${percentSize} font-black text-slate-800`}>
                        {safeValue.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="w-full text-center space-y-1 pb-2 z-10 -mt-6">
                <div className="flex justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Meta:</span>
                    <span className="text-slate-600 font-black">${safeMeta.toLocaleString()}</span>
                </div>
                <div className="flex justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Recaudo:</span>
                    <span className="text-slate-600 font-black">${safeRecaudo.toLocaleString()}</span>
                </div>
                <div className="flex justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Faltante:</span>
                    <span className="text-red-500 font-black">${safeFaltante.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE 2: MINI TABLAS DE ZONA (MODIFICADO: AÑADIDO TFOOT CON TOTALES) ---
export const ZoneMiniTable = ({ title, data, count }) => {
    
    const { groupedData, totals } = useMemo(() => {
        const groups = {};
        let totalMeta = 0;
        let totalRecaudo = 0;
        let totalFaltante = 0;

        data.forEach(item => {
            const reg = item.Regional_Cobro || 'SIN REGIONAL';
            if (!groups[reg]) groups[reg] = [];
            groups[reg].push(item);
            
            totalMeta += parseFloat(item.Meta_Total || 0);
            totalRecaudo += parseFloat(item.Recaudo_Total || 0);
            totalFaltante += parseFloat(item.Faltante_Calc || 0);
        });

        return {
            groupedData: Object.keys(groups).sort().map(reg => ({
                regional: reg,
                items: groups[reg]
            })),
            totals: { 
                meta: totalMeta, 
                recaudo: totalRecaudo, 
                faltante: totalFaltante,
                cumplimiento: totalMeta > 0 ? (totalRecaudo / totalMeta) * 100 : 0
            }
        };
    }, [data]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[550px] md:h-[500px]">
            <div className="px-4 py-4 md:px-6 bg-slate-900 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0">
                <h4 className="text-[11px] md:text-[12px] font-black text-white uppercase tracking-widest text-center md:text-left">{title}</h4>
                <span className="bg-indigo-600 px-3 py-1 rounded-full text-[9px] md:text-[10px] font-black text-white uppercase tracking-tighter">
                    {count} ZONAS ACTIVAS
                </span>
            </div>
            
            <div className="flex-1 overflow-auto bg-white scrollbar-thin">
                <div className="min-w-[800px] flex flex-col">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-30 shadow-sm">
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-[120px] text-left border-r border-slate-100 bg-slate-50">Regional</th>
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-[80px] text-center bg-slate-50">Zona</th>
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-right bg-slate-50">Meta ($)</th>
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-right bg-slate-50">Recaudo ($)</th>
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase text-right bg-slate-50">Faltante ($)</th>
                                <th className="p-3 text-[10px] font-black text-slate-500 uppercase w-[120px] text-center bg-slate-50">Progreso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groupedData.map((group) => (
                                <React.Fragment key={group.regional}>
                                    {group.items.map((row, idx) => {
                                        const percent = row.Meta_Total > 0 ? (row.Recaudo_Total / row.Meta_Total) * 100 : 0;
                                        return (
                                            <tr key={`${group.regional}-${idx}`} className="hover:bg-indigo-50/50 transition-colors">
                                                <td className="p-3 text-[10px] font-bold text-slate-500 uppercase border-r border-slate-100 bg-slate-50/30">{group.regional}</td>
                                                <td className="p-3 text-[11px] font-black text-slate-700 uppercase text-center">{row.Zona}</td>
                                                <td className="p-3 text-[10px] font-semibold text-slate-500 text-right font-mono">${(row.Meta_Total || 0).toLocaleString()}</td>
                                                <td className="p-3 text-[10px] font-bold text-slate-700 text-right font-mono">${(row.Recaudo_Total || 0).toLocaleString()}</td>
                                                <td className="p-3 text-[10px] font-black text-red-500 text-right font-mono">${(row.Faltante_Calc > 0 ? row.Faltante_Calc : 0).toLocaleString()}</td>
                                                <td className="p-3 align-middle">
                                                    <div className="flex items-center gap-2 w-full justify-center">
                                                        <span className="text-[10px] font-black w-8 text-right">{percent.toFixed(0)}%</span>
                                                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(percent, 100)}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                        </tbody>
                        <tfoot className="sticky bottom-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                            <tr className="bg-slate-900 text-white font-black">
                                <td colSpan={2} className="p-4 text-[11px] uppercase tracking-widest text-center border-r border-slate-700">TOTAL {title}</td>
                                <td className="p-4 text-[11px] text-right font-mono">${totals.meta.toLocaleString()}</td>
                                <td className="p-4 text-[11px] text-right font-mono text-emerald-400">${totals.recaudo.toLocaleString()}</td>
                                <td className="p-4 text-[11px] text-right font-mono text-red-400">${totals.faltante.toLocaleString()}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 w-full justify-center">
                                        <span className="text-[11px] font-black w-10 text-right">{totals.cumplimiento.toFixed(1)}%</span>
                                        <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(totals.cumplimiento, 100)}%` }}></div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const RankingTable = ({ data, title }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(data.length / rowsPerPage);

    const getProgressColor = (val) => {
        if (val < 40) return 'bg-red-500';
        if (val < 80) return 'bg-amber-400';
        return 'bg-emerald-500';
    };

    return (
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden w-full mt-6">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                <Trophy size={20} className="text-slate-400"/>
                <h3 className="text-lg font-black text-slate-700 uppercase tracking-tight">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/30">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Regional</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Zona</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cobrador</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Meta T.R ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Recaudo ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Faltante ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-48 text-center">Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {currentRows.map((row, idx) => {
                            const cump = parseFloat(row['Cumplimiento_%'] || 0);
                            return (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{row.Regional_Cobro}</td>
                                    <td className="p-3 text-[11px] font-black text-slate-700">{row.Zona}</td>
                                    <td className="p-3 text-[10px] font-bold text-slate-600 uppercase">{row.Cobrador}</td>
                                    <td className="p-3 text-[10px] font-semibold text-slate-500 text-right font-mono">${(row.Meta_Total || 0).toLocaleString()}</td>
                                    <td className="p-3 text-[10px] font-bold text-slate-700 text-right font-mono">${(row.Recaudo_Total || 0).toLocaleString()}</td>
                                    <td className="p-3 text-[10px] font-black text-red-500 text-right font-mono">${(row.Faltante_Calc > 0 ? row.Faltante_Calc : 0).toLocaleString()}</td>
                                    <td className="p-3 align-middle">
                                        <div className="flex items-center gap-2 w-full">
                                            <span className="text-[10px] font-black w-8 text-right">{cump.toFixed(0)}%</span>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getProgressColor(cump)}`} style={{ width: `${Math.min(cump, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Viendo {indexOfFirstRow + 1} - {Math.min(indexOfLastRow, data.length)} de {data.length} registros</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500"><ChevronLeft size={14} /></button>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500"><ChevronRight size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export const TableWithColumnSelector = ({ data, columns, title, currentPage, totalPages, onPageChange, loading }) => {
    // Estado para las columnas visibles
    const [visibleCols, setVisibleCols] = React.useState({});
    const [showColMenu, setShowColMenu] = React.useState(false);

    // Inicializar columnas visibles cuando llegan los datos
    React.useEffect(() => {
        if (columns && columns.length > 0) {
            // Por defecto mostramos todas. Puedes filtrar aquí si son demasiadas.
            const initialVisibility = columns.reduce((acc, col) => ({ ...acc, [col]: true }), {});
            setVisibleCols(initialVisibility);
        }
    }, [columns]);

    const toggleColumn = (col) => {
        setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
    };

    const activeColumns = columns.filter(col => visibleCols[col]);

    if (!data || data.length === 0 && !loading) {
        return (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 border-dashed mb-8">
                <p className="text-xs font-bold text-slate-400 uppercase">No hay datos disponibles para {title}</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
            {/* Cabecera: Título y Selector de Columnas */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600"/> {title}
                </h3>
                
                <div className="relative">
                    <button 
                        onClick={() => setShowColMenu(!showColMenu)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-colors border border-slate-200"
                    >
                        <Columns size={14} /> Seleccionar Columnas
                        <ChevronDown size={12} />
                    </button>

                    {/* Menú Desplegable */}
                    {showColMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowColMenu(false)}/>
                            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-80 overflow-y-auto p-2">
                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2 px-2 sticky top-0 bg-white pb-2 border-b border-slate-100">
                                    Mostrar/Ocultar ({activeColumns.length} visibles)
                                </div>
                                <div className="space-y-1">
                                    {columns.map(col => (
                                        <label key={col} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={!!visibleCols[col]} 
                                                onChange={() => toggleColumn(col)}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3 w-3"
                                            />
                                            {/* Reemplazamos guiones bajos por espacios para mejor lectura */}
                                            <span className="text-[10px] font-bold text-slate-700 truncate" title={col}>
                                                {col.replace(/_/g, ' ')}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tabla con Scroll Horizontal */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full">
                    <thead className="bg-slate-50">
                        <tr>
                            {activeColumns.map((col) => (
                                <th key={col} className="px-4 py-3 text-left text-[9px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap border-b border-slate-100">
                                    {col.replace(/_/g, ' ')}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr>
                                <td colSpan={Math.max(1, activeColumns.length)} className="p-8 text-center">
                                    <div className="flex justify-center items-center gap-2 text-xs font-bold text-slate-400 uppercase animate-pulse">
                                        Cargando registros...
                                    </div>
                                </td>
                             </tr>
                        ) : (
                            data.map((row, idx) => (
                                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                    {activeColumns.map((col) => (
                                        <td key={`${idx}-${col}`} className="px-4 py-2.5 text-[10px] font-medium text-slate-600 whitespace-nowrap group-hover:text-slate-800">
                                            {/* Manejo de nulos y booleanos */}
                                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center sticky bottom-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {loading ? '...' : `Página ${currentPage} de ${totalPages || 1}`}
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
                        disabled={currentPage === 1 || loading}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 transition-all active:scale-95"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button 
                        onClick={() => onPageChange(currentPage + 1)} 
                        disabled={!totalPages || currentPage >= totalPages || loading}
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500 transition-all active:scale-95"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};