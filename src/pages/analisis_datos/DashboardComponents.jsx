import React, { useMemo } from 'react';
import { 
   BarChart, ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Customized, LabelList 
} from 'recharts';
import { 
    Search, Filter, ChevronDown, ChevronUp, Columns, ArrowLeftCircle, Building2, MapPin, Layers, Target, Trophy, ChevronLeft, ChevronRight, X, AlertCircle
} from 'lucide-react';

export const COLOR_MAP = {
    'APROBADO': '#059669', 'VIABILIZADO': '#10b981', 'PAGO': '#10b981',          
    'RECHAZADO': '#dc2626', 'ANULADO': '#ef4444', 'NEGADO': '#b91c1c', 'SIN PAGO': '#ef4444',      
    'STAND BY': '#d97706', 'PENDIENTE': '#f59e0b',     
    'EN PROCESO': '#2563eb', 'TRAMITE': '#3b82f6',       
    'DEVUELTO': '#8b5cf6', 'SUBSANAR': '#a855f7',      
    'RADICADO': '#0891b2', 'LEGALIZADO': '#0284c7',    
    
    'VIGENTES': '#16a34a', 'DIAS 1-10': '#86efac', 'DIAS 11-20': '#4ade80',        
    'DIAS 21+': '#22c55e', 'VIGENCIA EXPIRADA': '#f43f5e', 
    
    '1 A 30': '#3b82f6', 'FRANJA 1 A 30': '#3b82f6', '1-30': '#3b82f6', '1 - 30': '#3b82f6',
    '31 A 90': '#10b981', 'FRANJA 31 A 90': '#10b981', '31-90': '#10b981', '31 - 90': '#10b981',
    '91 A 180': '#f59e0b', 'FRANJA 91 A 180': '#f59e0b', '91-180': '#f59e0b', '91 - 180': '#f59e0b',
    '181 A 360': '#ef4444', 'FRANJA 181 A 360': '#ef4444', '181-360': '#ef4444', '181 - 360': '#ef4444',
    'MAYOR A 360': '#8b5cf6', 'FRANJA MAYOR A 360': '#8b5cf6', '>360': '#8b5cf6', '> 360': '#8b5cf6', '360 +': '#8b5cf6', '360+': '#8b5cf6', 'MÁS DE 360': '#8b5cf6', 'MAS DE 360': '#8b5cf6',

    'SIN GESTIÓN': '#94a3b8', 'CON GESTIÓN': '#0d9488', 'CALL CENTER': '#6366f1',      
    'COBRANZA': '#84cc16', 'OTROS': '#cbd5e1', 'TOTAL': '#0f172a'
};

export const DEFAULT_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
    '#0ea5e9', '#ec4899', '#84cc16', '#64748b', '#f97316'
];

export const getSafeColor = (key) => {
    if (!key) return DEFAULT_COLORS[0];
    const normalizedKey = String(key).toUpperCase().replace(/\s+/g, ' ').trim();
    if (COLOR_MAP[normalizedKey]) return COLOR_MAP[normalizedKey];

    let hash = 0;
    for (let i = 0; i < normalizedKey.length; i++) {
        hash = normalizedKey.charCodeAt(i) + ((hash << 5) - hash);
    }
    const stableIndex = Math.abs(hash) % DEFAULT_COLORS.length;
    return DEFAULT_COLORS[stableIndex];
};

const formatCompactNumber = (number) => {
    if (number < 1000) return number.toFixed(0);
    if (number >= 1000 && number < 1000000) return (number / 1000).toFixed(1) + "K";
    if (number >= 1000000 && number < 1000000000) return (number / 1000000).toFixed(1) + "M";
    if (number >= 1000000000) return (number / 1000000000).toFixed(2) + "B";
    return number;
};

// --- 2. ETIQUETA PERSONALIZADA PARA EL EJE X (HORIZONTAL Y SIN AMONTONARSE) ---
const CustomXAxisTick = ({ x, y, payload }) => {
    const text = payload.value;
    // Si el texto tiene más de 12 caracteres, lo cortamos y añadimos "..." para que no choque
    const truncatedText = text.length > 12 ? `${text.substring(0, 12)}...` : text;
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text 
                x={0} 
                y={0} 
                dy={12} // Distancia desde la línea del eje
                textAnchor="middle" // Centrado perfecto y horizontal
                fill="#94a3b8" 
                fontSize="10px" 
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
            >
                {truncatedText}
            </text>
        </g>
    );
};

// --- 3. ETIQUETAS DENTRO DE LAS BARRAS ---
export const CustomBarLabel = (props) => {
    
    const { x, y, width, height, value, isCurrency } = props;
    if (typeof x !== 'number' || typeof y !== 'number' || width < 0 || height < 0) return null;

    let numericValue = Array.isArray(value) ? Number(value[1]) - Number(value[0]) : Number(value);
    
    // Si la barra es muy pequeña, no renderizamos texto para no saturar
    if (isNaN(numericValue) || numericValue <= 0 || height < 15) return null;

    // Lógica clave: Si es moneda (desembolso) abreviamos, si no (los demás), mostramos completo
    const displayValue = isCurrency 
        ? `$${formatCompactNumber(numericValue)}` 
        : numericValue.toLocaleString('es-CO'); 
        
    return (
        <text 
            
            x={x + width / 2} 
            y={y + height / 2} 
            fill="#ffffff" 
            fontSize="9px" 
            fontFamily="system-ui, sans-serif" 
            fontWeight="800" 
            textAnchor="middle" 
            dominantBaseline="central"
            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.6)', pointerEvents: 'none' }}
        >
            {displayValue}
        </text>
    );
};

// --- 4. ETIQUETA TOTAL EN LA PARTE SUPERIOR ---
export const TotalTopLabel = (props) => {
    const { x, y, value, isCurrency } = props;
    if (!value || value <= 0) return null;
    
    // Lógica clave: Igual que arriba, respetamos los totales completos en los otros gráficos
    const displayValue = isCurrency 
        ? `$${formatCompactNumber(value)}` 
        : value.toLocaleString('es-CO');
    
    return (
        <text 
            x={x} 
            y={y - 12} 
            fill="#ffffff" 
            fontSize="10px" 
            fontFamily="system-ui, sans-serif" 
            fontWeight="900" 
            textAnchor="middle"
            style={{ pointerEvents: 'none', letterSpacing: '0.2px' }}
        >
            { displayValue}
        </text>
    );
};

// --- 5. COMPONENTE PRINCIPAL DEL GRÁFICO ---
export const StackedBar = React.memo(({ data, keys, isCurrency, getSafeColor }) => {
    if (!data || data.length === 0) return null;

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: 10, bottom: 20, right: 10, top: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.1} />
                
                {/* EJE X: Se le pasa el componente personalizado */}
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    interval="preserveStartEnd" // Ayuda nativa de recharts para no encimar
                    tick={<CustomXAxisTick />}
                />
                
                {/* EJE Y: Condicionado también para abreviar solo dinero */}
                <YAxis 
                    tick={{ fontSize: 9, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    width={50}
                    tickFormatter={(v) => isCurrency ? `$${formatCompactNumber(v)}` : v.toLocaleString('es-CO')} 
                />
                
                <Tooltip 
                    separator={" : \u00A0\u00A0\u00A0 "} /* <--- PEGA ESTA LÍNEA AQUÍ TAMBIÉN */
                    cursor={{ fill: '#ffffff', opacity: 0.05 }}
                    contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    border: '1px solid #1e293b',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                />
                
                <Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{paddingBottom: '20px', fontSize: '10px'}} />
                
                {keys.map((k) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={getSafeColor ? getSafeColor(k) : "#3b82f6"} barSize={45}>
                        <LabelList dataKey={k} content={<CustomBarLabel isCurrency={isCurrency} />} />
                    </Bar>
                ))}

                <Line dataKey="total" stroke="transparent" dot={false} activeDot={false}>
                    <LabelList dataKey="total" content={<TotalTopLabel isCurrency={isCurrency} />} />
                </Line>
            </ComposedChart>
        </ResponsiveContainer>
    );
});

const FILTER_CATEGORIES = [
    { key: 'Empresa', label: 'Empresa', icon: <Building2 size={14}/> },
    { key: 'CALL_CENTER_FILTRO', label: 'Call Center', icon: <Target size={14}/> },
    { key: 'Zona', label: 'Zona', icon: <MapPin size={14}/> },
    { key: 'Regional_Cobro', label: 'Regional Cobro', icon: <MapPin size={14}/> },
    { key: 'Franja_Cartera', label: 'Franja Cartera', icon: <Layers size={14}/> },
    { key: 'Novedades', label: 'Novedades', icon: <AlertCircle size={14}/> }
];
export const FilterSidebar = React.memo(({ options = {}, selectedFilters = {}, onFilterChange, onClear, isOpen, onClose }) => {
    
    // OPTIMIZACIÓN 3: Evaluación calculada para saber si hay *algún* filtro activo en todo el panel.
    const hasAnyFilter = useMemo(() => {
        return Object.values(selectedFilters).some(filterArray => filterArray && filterArray.length > 0);
    }, [selectedFilters]);

    return (
        <>
            {/* Overlay oscuro de fondo */}
            <div 
                className={`fixed inset-0 bg-[#041830]/60 z-[60] backdrop-blur-sm transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
                onClick={onClose}
            />
            
            {/* Contenedor principal del sidebar - DISEÑO PREMIUM */}
            <div 
                className={`
                    flex flex-col h-full 
                    fixed top-0 left-0 z-[70] 
                    w-72 md:w-80
                    transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] 
                    shadow-[20px_0_50px_rgba(0,0,0,0.6)]
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
                style={{
                    background: 'linear-gradient(145deg, rgba(4, 24, 48, 0.95) 0%, rgba(4, 24, 48, 0.7) 100%)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255, 255, 255, 0.08)'
                }}
            >
                
                {/* Header Premium Flotante */}
                <div className="flex items-center justify-between border-b border-white/10 p-6 shrink-0 sticky top-0 z-20"
                     style={{ background: 'linear-gradient(to bottom, rgba(4, 24, 48, 0.95) 60%, rgba(4, 24, 48, 0) 100%)' }}>
                    <div className="flex items-center gap-3">
                        <div className="relative p-2 bg-white/10 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                            <Filter size={16} className="text-cyan-400" />
                            {/* INDICADOR GLOBAL: Aparece si hay cualquier filtro activo */}
                            {hasAnyFilter && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-[#041830] shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                            )}
                        </div>
                        <h2 className="text-[12px] font-black text-white uppercase tracking-wider drop-shadow-md">Filtros Operativos</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClear} className="text-[9px] font-bold text-red-400 hover:text-red-300 hover:scale-105 uppercase transition-all tracking-widest drop-shadow-sm">
                            Limpiar
                        </button>
                        <button onClick={onClose} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/15 p-1.5 rounded-lg transition-all active:scale-95 border border-white/5 shadow-sm">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* Contenido con Scrollbar Premium Integrada */}
                <div className="flex-1 p-6 space-y-8 pb-24 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                    {FILTER_CATEGORIES.map((cat) => {
                        const catOptions = cat.key === 'Novedades' 
                            ? ['Con Novedad', 'Sin Novedad'] 
                            : options[cat.key] || [];

                        // Verificación rápida para saber si ESTA categoría específica tiene filtros
                        const isCategoryActive = selectedFilters[cat.key]?.length > 0;

                        return (
                            <div key={cat.key} className="space-y-4">
                                <div className="flex items-center gap-2 text-cyan-300/80 border-b border-white/10 pb-2 sticky top-0 z-10"
                                     style={{ background: 'linear-gradient(to bottom, rgba(4, 24, 48, 1) 0%, rgba(4, 24, 48, 0.9) 100%)' }}>
                                    <div className="relative">
                                        {cat.icon}
                                        {/* INDICADOR POR CATEGORÍA: Punto vibrante animado */}
                                        {isCategoryActive && (
                                            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_rgba(34,211,238,0.8)] animate-pulse" />
                                        )}
                                    </div>
                                    <h3 className="text-[10px] font-black text-white/90 uppercase tracking-[0.2em]">{cat.label}</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    {catOptions.map((opt) => (
                                        <label key={opt} className="flex items-center gap-3 group cursor-pointer transition-transform hover:translate-x-1 duration-200">
                                            <div className="relative flex items-center justify-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="peer w-4 h-4 rounded-md border-white/20 bg-[#041830]/50 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0 cursor-pointer transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] checked:border-cyan-400 checked:bg-cyan-500 hover:border-white/40" 
                                                    checked={selectedFilters[cat.key]?.includes(opt) || false} 
                                                    onChange={() => onFilterChange(cat.key, opt)} 
                                                />
                                            </div>
                                            <span className="text-[11px] font-semibold text-white/70 group-hover:text-white uppercase truncate transition-colors drop-shadow-md" title={opt || 'SIN DATO'}>
                                                {opt || 'SIN DATO'}
                                            </span>
                                        </label>
                                    ))}
                                    
                                    {catOptions.length === 0 && (
                                        <div className="flex items-center gap-2 text-white/40 italic bg-white/5 p-3 rounded-xl border border-white/5 shadow-inner">
                                            <AlertCircle size={14} />
                                            <span className="text-[10px] font-medium tracking-wide">Sin datos disponibles</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
});

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
                                                        <span className="text-[10px] font-black w-10 text-right">{percent.toFixed(2)}%</span>
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
                                        <span className="text-[11px] font-black w-10 text-right">{totals.cumplimiento.toFixed(2)}%</span>
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

export const RankingTable = ({ data = [], title }) => {
    // 1. BLINDAJE: Garantizamos que data SIEMPRE sea un array para que no crashee con .slice() o .length
    const safeData = Array.isArray(data) ? data : [];
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const rowsPerPage = 10;

    // 2. BLINDAJE: Si los datos cambian (ej. al aplicar un filtro), reseteamos a la página 1 
    // para evitar quedar "atrapados" en una página que ya no existe.
    React.useEffect(() => {
        setCurrentPage(1);
    }, [safeData.length]);

    const totalPages = Math.max(1, Math.ceil(safeData.length / rowsPerPage));
    
    // 3. BLINDAJE: Aseguramos que la página actual nunca sea mayor al total de páginas
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    
    const indexOfLastRow = validPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = safeData.slice(indexOfFirstRow, indexOfLastRow);

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
                        {currentRows.length > 0 ? (
                            currentRows.map((row, idx) => {
                                const cump = parseFloat(row['Cumplimiento_%'] || 0);
                                return (
                                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="p-3 text-[10px] font-bold text-slate-500 uppercase">{row.Regional_Cobro || 'S/D'}</td>
                                        <td className="p-3 text-[11px] font-black text-slate-700">{row.Zona || 'S/D'}</td>
                                        <td className="p-3 text-[10px] font-bold text-slate-600 uppercase">{row.Cobrador || 'S/D'}</td>
                                        <td className="p-3 text-[10px] font-semibold text-slate-500 text-right font-mono">${(Number(row.Meta_Total) || 0).toLocaleString()}</td>
                                        <td className="p-3 text-[10px] font-bold text-slate-700 text-right font-mono">${(Number(row.Recaudo_Total) || 0).toLocaleString()}</td>
                                        <td className="p-3 text-[10px] font-black text-red-500 text-right font-mono">${(Number(row.Faltante_Calc) > 0 ? Number(row.Faltante_Calc) : 0).toLocaleString()}</td>
                                        <td className="p-3 align-middle">
                                            <div className="flex items-center gap-2 w-full">
                                                <span className="text-[10px] font-black w-8 text-right">{cump.toFixed(2)}%</span>
                                                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getProgressColor(cump)}`} style={{ width: `${Math.min(cump, 100)}%` }}></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-xs font-bold text-slate-400 uppercase">
                                    No hay datos para mostrar
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Viendo {safeData.length > 0 ? indexOfFirstRow + 1 : 0} - {Math.min(indexOfLastRow, safeData.length)} de {safeData.length} registros
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={validPage === 1 || safeData.length === 0} 
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={validPage === totalPages || safeData.length === 0} 
                        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-500"
                    >
                        <ChevronRight size={14} />
                    </button>
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