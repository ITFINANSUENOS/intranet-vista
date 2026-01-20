import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Label
} from 'recharts';
import { 
    RefreshCw, CheckCircle2, Activity, UploadCloud, AlertTriangle, 
    ChevronLeft, ChevronRight, Search, X, Filter, Building2, MapPin, Layers, Target,
    Settings, Eye, Columns, ChevronDown, ChevronUp, ArrowLeftCircle
} from 'lucide-react';

// --- 1. CONFIGURACIÓN DE COLORES (Fiel a tus imágenes) ---
const COLOR_MAP = {
    // Cartera Vigente (Verdes)
    'VIGENTES': '#22c55e',          
    'DIAS 1-10': '#bbf7d0',        
    'DIAS 11-20': '#4ade80',       
    'DIAS 21+': '#16a34a',         
    
    // Cartera Vencida (Rojos/Naranjas)
    'VIGENCIA EXPIRADA': '#f87171', 
    'SIN PAGO': '#ef4444',         
    'SIN GESTIÓN': '#fca5a5',      
    
    // Gestión y Otros
    'ANTICIPADO': '#6366f1',       
    'PAGO': '#10b981',             
    'CON GESTIÓN': '#059669',      
    'CALL CENTER': '#86efac',      
    'COBRANZA': '#4ade80',         
    'OTROS': '#e2e8f0',

    // Compatibilidad
    '1 A 30': '#818cf8', '31 A 90': '#f59e0b', '91 A 180': '#ef4444', 
    '181 A 360': '#10b981', 'AL DIA': '#22d3ee', 'MAS DE 360': '#6366f1',
    'EMPEORO': '#ef4444', 'MEJORO': '#22d3ee', 'IGUAL': '#f59e0b', 'CASTIGADA': '#7f1d1d'
};
const DEFAULT_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

// --- 2. COLUMNAS TABLAS ---
const ALL_COLUMNS_GESTION = [
    { key: 'Credito', label: 'Crédito' },
    { key: 'Cedula_Cliente', label: 'Cédula' },
    { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Celular', label: 'Celular' },
    { key: 'Nombre_Ciudad', label: 'Ciudad' },
    { key: 'Zona', label: 'Zona' },
    { key: 'Regional_Cobro', label: 'Regional' },
    { key: 'Estado_Gestion', label: 'Gestión' },
    { key: 'Estado_Pago', label: 'Estado Pago' },
    { key: 'Dias_Atraso_Final', label: 'Días Atraso' },
    { key: 'Valor_Vencido', label: 'Valor Vencido' },
    { key: 'Total_Recaudo', label: 'Total Recaudo' },
    { key: 'Cargo_Usuario', label: 'Cargo Usuario' },
    { key: 'Nombre_Usuario', label: 'Gestor' },
    { key: 'Novedad', label: 'Última Novedad' },
    { key: 'Tipo_Novedad', label: 'Tipo Novedad' },
    { key: 'Fecha_Cuota_Vigente', label: 'Fecha Cuota' },
    { key: 'Valor_Cuota_Vigente', label: 'Valor Cuota' },
    { key: 'Codeudor1', label: 'Doc. Codeudor 1' },
    { key: 'Nombre_Codeudor1', label: 'Nom. Codeudor 1' },
    { key: 'Telefono_Codeudor1', label: 'Tel. Codeudor 1' }
];

const ALL_COLUMNS_RODAMIENTO = [
    { key: 'Credito', label: 'Crédito' },
    { key: 'Cedula_Cliente', label: 'Cédula' },
    { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Celular', label: 'Celular' },
    { key: 'Rodamiento', label: 'Rodamiento' },
    { key: 'Rodamiento_Cartera', label: 'Rod. Cartera' },
    { key: 'Franja_Cartera', label: 'Franja' },
    { key: 'Valor_Vencido', label: 'Valor Vencido' },
    { key: 'Meta_Saldo', label: 'Meta Saldo' },
    { key: 'Meta_Intereses', label: 'Meta Intereses' },
    { key: 'Dias_Atraso_Final', label: 'Días Atraso' },
    { key: 'Total_Recaudo', label: 'Total Recaudo' },
    { key: 'Nombre_Ciudad', label: 'Ciudad' },
    { key: 'Zona', label: 'Zona' },
    { key: 'Regional_Cobro', label: 'Regional' },
    { key: 'Codeudor1', label: 'Doc. Codeudor 1' },
    { key: 'Nombre_Codeudor1', label: 'Nom. Codeudor 1' }
];

// --- 3. TOOLTIP Y COMPONENTES VISUALES ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 min-w-[200px] z-50">
                <p className="text-[11px] font-black text-slate-800 mb-2 uppercase border-b pb-1">
                    {data.name || label}
                </p>
                <div className="flex justify-between items-center gap-4 py-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Cantidad/Valor:</span>
                    <span className="text-[11px] font-black text-indigo-600">
                        {payload[0].value > 1000000 ? `$${Number(payload[0].value).toLocaleString()}` : payload[0].value.toLocaleString()}
                    </span>
                </div>
                {data.parentName && (
                    <div className="flex justify-between items-center gap-4 py-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Grupo:</span>
                        <span className="text-[9px] font-black text-slate-600 uppercase">{data.parentName}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

// Tarjeta de gráfico con soporte para botón de acción (Volver)
const ChartCard = ({ title, children, action }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-6 h-8">
            <h3 className="text-[10px] font-black text-slate-800 uppercase italic tracking-widest truncate max-w-[70%]">{title}</h3>
            {action}
        </div>
        <div className="h-[280px] w-full">{children}</div>
    </div>
);

// --- 4. COMPONENTES DE GRÁFICAS (Interactivos) ---

/**
 * SUNBURST INTERACTIVO (DRILLDOWN)
 */
const InteractiveSunburst = ({ data, activeSelection, onSelect }) => {
    if (activeSelection) {
        const detailData = activeSelection.children || [];
        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={detailData} 
                        dataKey="value" 
                        cx="50%" cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={5}
                        stroke="none"
                    >
                        {detailData.map((e, i) => (
                            <Cell key={`cell-det-${i}`} fill={COLOR_MAP[String(e.name).toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                        ))}
                        <Label position="center" content={({ viewBox: { cx, cy } }) => (
                            <g>
                                <text x={cx} y={cy} textAnchor="middle" className="fill-slate-700 text-[10px] font-black uppercase">
                                    {activeSelection.name.substring(0, 10)}
                                </text>
                                <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400 text-[8px] font-bold">
                                    Total: {activeSelection.value.toLocaleString()}
                                </text>
                            </g>
                        )}/>
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingTop: '15px'}} />
                </PieChart>
            </ResponsiveContainer>
        );
    }

    const outerData = [];
    data.forEach(parent => {
        if (parent.children && parent.children.length > 0) {
            parent.children.forEach(child => outerData.push({ ...child, parentName: parent.name }));
        } else {
            outerData.push({ ...parent, isPlaceholder: true });
        }
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie 
                    data={data} 
                    dataKey="value" 
                    cx="50%" cy="50%" 
                    innerRadius={50} 
                    outerRadius={75} 
                    stroke="#fff"
                    strokeWidth={2}
                    onClick={(node) => onSelect && onSelect(node)}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                    {data.map((e, i) => (
                        <Cell key={`cell-in-${i}`} fill={COLOR_MAP[String(e.name).toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                    ))}
                    <Label position="center" content={({ viewBox: { cx, cy } }) => (
                        <text x={cx} y={cy} textAnchor="middle" className="fill-slate-400 text-[8px] font-black uppercase tracking-widest">VER DETALLE</text>
                    )}/>
                </Pie>

                <Pie 
                    data={outerData} 
                    dataKey="value" 
                    cx="50%" cy="50%" 
                    innerRadius={80} 
                    outerRadius={100} 
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={1}
                >
                    {outerData.map((e, i) => (
                        <Cell 
                            key={`cell-out-${i}`} 
                            fill={COLOR_MAP[String(e.name).toUpperCase()] || (e.isPlaceholder ? COLOR_MAP[String(e.name).toUpperCase()] : DEFAULT_COLORS[i % DEFAULT_COLORS.length])} 
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingTop: '15px'}} />
            </PieChart>
        </ResponsiveContainer>
    );
};

const DonutWithTotal = ({ data, total }) => (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                {data.map((e, i) => <Cell key={i} fill={COLOR_MAP[String(e.name).toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />)}
                <Label position="center" content={({ viewBox: { cx, cy } }) => (
                    <g>
                        <text x={cx} y={cy - 5} textAnchor="middle" className="fill-slate-800 text-lg font-black">{(total || 0).toLocaleString()}</text>
                        <text x={cx} y={cy + 15} textAnchor="middle" className="fill-slate-400 text-[8px] font-black uppercase tracking-[2px]">CRÉDITOS</text>
                    </g>
                )}/>
            </Pie>
            <Tooltip content={<CustomTooltip />} />
        </PieChart>
    </ResponsiveContainer>
);

/**
 * STACKED BAR MODIFICADO PARA EJES VISIBLES
 */
const StackedBar = ({ data, keys, isCurrency }) => (
    <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -10, bottom: 45, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                tick={{fontSize: 8, fontWeight: 800, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false} 
                interval={0} // Muestra todas las etiquetas
                angle={-45} // Inclina para evitar superposición
                textAnchor="end" // Alineación correcta
                height={70} // Espacio para las etiquetas inclinadas
            />
            <YAxis 
                tick={{fontSize: 9, fill: '#94a3b8'}} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => isCurrency ? `$${(v/1000000).toFixed(0)}M` : v.toLocaleString()} 
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingBottom: '20px'}} />
            {keys.map((k, i) => (
                <Bar 
                    key={k} 
                    dataKey={k} 
                    stackId="a" 
                    fill={COLOR_MAP[k.toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} 
                    barSize={30} 
                />
            ))}
        </BarChart>
    </ResponsiveContainer>
);

// --- 5. COMPONENTES FILTROS Y TABLAS ---
const FilterSidebar = ({ options, selectedFilters, onFilterChange, onClear }) => {
    const categories = [
        { key: 'Empresa', label: 'Empresa', icon: <Building2 size={14}/> },
        { key: 'CALL_CENTER_FILTRO', label: 'Call Center', icon: <Target size={14}/> },
        { key: 'Zona', label: 'Zona', icon: <MapPin size={14}/> },
        { key: 'Regional_Cobro', label: 'Regional Cobro', icon: <MapPin size={14}/> },
        { key: 'Franja_Cartera', label: 'Franja Cartera', icon: <Layers size={14}/> }
    ];

    return (
        <aside className="w-72 bg-white border-r border-slate-100 h-[calc(100vh-80px)] sticky top-20 overflow-y-auto p-6 flex flex-col gap-8 shrink-0 shadow-sm z-30">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-indigo-600" />
                    <h2 className="text-[11px] font-black text-slate-800 uppercase tracking-tighter">Filtros Operativos</h2>
                </div>
                <button onClick={onClear} className="text-[9px] font-bold text-red-500 hover:underline uppercase">Limpiar</button>
            </div>
            {categories.map((cat) => (
                <div key={cat.key} className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400">
                        {cat.icon}
                        <h3 className="text-[10px] font-black uppercase tracking-widest">{cat.label}</h3>
                    </div>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {options[cat.key]?.map((opt) => (
                            <label key={opt} className="flex items-center gap-3 group cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                    checked={selectedFilters[cat.key]?.includes(opt)}
                                    onChange={() => onFilterChange(cat.key, opt)}
                                />
                                <span className="text-[10px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors uppercase truncate">
                                    {opt || 'SIN DATO'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </aside>
    );
};

const LocalFilterSection = ({ title, configs, filters, onFilterChange, isOpen, onToggle }) => (
    <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden transition-all">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={onToggle}>
            <div className="flex items-center gap-2"><Filter size={14} className="text-slate-500" /><h3 className="text-[10px] font-black text-slate-700 uppercase tracking-wide">{title}</h3></div>
            {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {isOpen && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100">
                {configs.map((config) => (
                    <div key={config.key} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 block">{config.label}</label>
                        <div className="relative">
                            <select className="w-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg py-2 pl-3 pr-8 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none transition-all uppercase"
                                value={filters[config.key]?.[0] || ''} onChange={(e) => { const val = e.target.value; onFilterChange(config.key, val ? [val] : []); }}>
                                <option value="">Todos</option>
                                {config.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TableToolbar = ({ onSearch, searchValue, allColumns, visibleColumns, onToggleColumn, placeholder }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => { if (menuRef.current && !menuRef.current.contains(event.target)) setIsMenuOpen(false); };
        document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    return (
        <div className="flex justify-between items-center mb-4 gap-4">
            <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={searchValue} placeholder={placeholder || "Buscar..."} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" onChange={(e) => onSearch(e.target.value)} />
            </div>
            <div className="relative" ref={menuRef}>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                    <Columns size={16} className="text-indigo-600"/>
                    <span className="text-[10px] font-black text-slate-700 uppercase">Columnas</span>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[60] p-3 max-h-80 overflow-y-auto">
                        <div className="space-y-2">
                            {allColumns.map((col) => (
                                <label key={col.key} className="flex items-center gap-3 cursor-pointer group hover:bg-slate-50 p-1 rounded-lg">
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumns.includes(col.key) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                        {visibleColumns.includes(col.key) && <CheckCircle2 size={10} className="text-white" />}
                                    </div>
                                    <input type="checkbox" className="hidden" checked={visibleColumns.includes(col.key)} onChange={() => onToggleColumn(col.key)} />
                                    <span className={`text-[10px] font-bold uppercase ${visibleColumns.includes(col.key) ? 'text-slate-800' : 'text-slate-400'}`}>{col.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const TableView = ({ data, columns, pagination, onPageChange, loading, title }) => (
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
                    {loading ? (<tr><td colSpan={columns.length} className="p-12 text-center text-[10px] font-bold text-slate-400 animate-pulse uppercase">Cargando datos...</td></tr>) : (
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
                <button disabled={pagination.current <= 1 || loading} onClick={() => onPageChange(pagination.current - 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black text-slate-600 disabled:opacity-30">ANTERIOR</button>
                <button disabled={pagination.current >= pagination.total_pages || loading} onClick={() => onPageChange(pagination.current + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-[9px] font-black text-slate-600 disabled:opacity-30">SIGUIENTE</button>
            </div>
        </div>
    </div>
);

// --- 6. COMPONENTE PRINCIPAL ---
export default function Documents() {
    const { apiClient } = useAuth();
    const [activeTab, setActiveTab] = useState('cartera'); 
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [moduleData, setModuleData] = useState({ cartera: null, seguimientos: null });
    const [notification, setNotification] = useState(null);

    const [selVigencia, setSelVigencia] = useState(null);
    const [selGestion, setSelGestion] = useState(null);
    const [selConPago, setSelConPago] = useState(null);
    const [selSinPago, setSelSinPago] = useState(null);

    const [selectedFilters, setSelectedFilters] = useState({
        Empresa: [], CALL_CENTER_FILTRO: [], Zona: [], Regional_Cobro: [], Franja_Cartera: []
    });

    const [localFiltersGestion, setLocalFiltersGestion] = useState({ estado_pago: [], estado_gestion: [], cargos: [] });
    const [localFiltersRodamiento, setLocalFiltersRodamiento] = useState({ rodamiento: [] });
    const [showLocalFiltersGestion, setShowLocalFiltersGestion] = useState(true);
    const [showLocalFiltersRodamiento, setShowLocalFiltersRodamiento] = useState(true);
    const [gestionTable, setGestionTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [rodamientoTable, setRodamientoTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [visibleColsGestion, setVisibleColsGestion] = useState(['Cedula_Cliente', 'Nombre_Cliente', 'Estado_Gestion', 'Estado_Pago', 'Regional_Cobro', 'Novedad']);
    const [visibleColsRodamiento, setVisibleColsRodamiento] = useState(['Credito', 'Cedula_Cliente', 'Rodamiento', 'Franja_Cartera', 'Valor_Vencido']);

    const fileInputRef = useRef(null);
    const toggleColumn = (key, setVisible, currentVisible) => {
        if (currentVisible.includes(key)) setVisible(currentVisible.filter(k => k !== key));
        else setVisible([...currentVisible, key]);
    };

    const fetchTableData = useCallback(async (source, page = 1, search = '', filters = {}, setter) => {
        if (!selectedJobId) return;
        setter(prev => ({ ...prev, loading: true, search: search }));
        try {
            const payload = { job_id: selectedJobId, origen: source, page, page_size: 15, search_term: search, ...filters };
            const response = await apiClient.post('/wallet/buscar', payload);
            setter(prev => ({ ...prev, data: response.data.data || [], loading: false, pagination: { current: response.data.meta?.page || page, total_pages: response.data.meta?.pages || 0, total_records: response.data.meta?.total || 0 } }));
        } catch (error) { setter(prev => ({ ...prev, loading: false })); }
    }, [selectedJobId, apiClient]);

    useEffect(() => { if(selectedJobId && activeTab === 'seguimientos') fetchTableData('seguimientos_gestion', 1, gestionTable.search, localFiltersGestion, setGestionTable); }, [localFiltersGestion, selectedJobId, activeTab, fetchTableData]);
    useEffect(() => { if(selectedJobId && activeTab === 'seguimientos') fetchTableData('seguimientos_rodamientos', 1, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable); }, [localFiltersRodamiento, selectedJobId, activeTab, fetchTableData]);

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
            Promise.all([apiClient.get(`/wallet/init/cartera${query}`), apiClient.get(`/wallet/init/seguimientos${query}`)])
            .then(([resC, resS]) => { setModuleData({ cartera: resC.data.data.data, seguimientos: resS.data.data.data }); setLoading(false); })
            .catch(() => setLoading(false));
        }
    }, [selectedJobId, apiClient]);

    const localOptions = useMemo(() => {
        const rawSeg = moduleData.seguimientos;
        if (!rawSeg) return { estado_pago: [], estado_gestion: [], cargos: [], rodamiento: [] };
        const getUniques = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))].sort();
        return { 
            estado_pago: getUniques(rawSeg.donut_data || [], 'Estado_Pago'),
            estado_gestion: getUniques(rawSeg.sunburst_grouped || [], 'Estado_Gestion'),
            cargos: getUniques(rawSeg.sunburst_grouped || [], 'Cargo_Usuario'),
            rodamiento: getUniques(rawSeg.rodamiento_data || [], 'Rodamiento')
        };
    }, [moduleData.seguimientos]);

    const filterOptions = useMemo(() => {
        const raw = moduleData.cartera;
        const rawSeg = moduleData.seguimientos;
        if (!raw || !rawSeg) return {};
        const keys = ['Empresa', 'CALL_CENTER_FILTRO', 'Zona', 'Regional_Cobro', 'Franja_Cartera'];
        const options = {};
        keys.forEach(key => {
            const allValues = [...(raw.cubo_regional || []), ...(raw.cubo_desembolso || []), ...(rawSeg.donut_data || [])].map(item => item[key]).filter(Boolean);
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

    const charts = useMemo(() => {
        const raw = moduleData[activeTab];
        if (!raw) return null;
        const applyFilters = (data) => {
            if (!Array.isArray(data)) return [];
            return data.filter(item => Object.entries(selectedFilters).every(([key, values]) => values.length === 0 || values.includes(item[key])));
        };

        const processGeneric = (list, xKey, stackKey, valKey) => {
            const filtered = applyFilters(Array.isArray(list) ? list : (list?.grouped || []));
            const map = {}; const keysSet = new Set();
            filtered.forEach(d => {
                const xVal = d[xKey] || 'N/A';
                const sKey = String(d[stackKey] || 'OTROS').toUpperCase();
                const val = Number(d[valKey] || d['count'] || 1);
                if (!map[xVal]) map[xVal] = { name: xVal };
                map[xVal][sKey] = (map[xVal][sKey] || 0) + val;
                keysSet.add(sKey);
            });
            return { data: Object.values(map).sort((a,b) => String(a.name).localeCompare(String(b.name))), keys: Array.from(keysSet) };
        };

        const buildDrilldown = (list, mainKey, subKey, valKey) => {
            const filtered = applyFilters(Array.isArray(list) ? list : (list?.grouped || []));
            const grouped = filtered.reduce((acc, item) => {
                const main = String(item[mainKey] || 'SIN DATO').toUpperCase();
                const sub = String(item[subKey] || 'OTROS').toUpperCase();
                const val = Number(item[valKey] || item['count'] || 1);
                if (!acc[main]) acc[main] = { name: main, value: 0, children: {} };
                acc[main].value += val;
                acc[main].children[sub] = (acc[main].children[sub] || 0) + val;
                return acc;
            }, {});
            return Object.values(grouped).map(m => ({
                name: m.name, value: m.value,
                children: Object.entries(m.children).map(([name, val]) => ({ name, value: val }))
            }));
        };

        if (activeTab === 'cartera') {
            return {
                regional: processGeneric(raw?.cubo_regional, 'Regional_Venta', 'Franja_Meta', 'count'),
                cobro: processGeneric(raw?.cubo_cobro, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
                desembolsos: processGeneric(raw?.cubo_desembolso, 'Año_Desembolso', 'Franja_Meta', 'Valor_Desembolso'),
                vigencia: buildDrilldown(raw?.cubo_vigencia, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
            };
        } else {
            const filteredDonut = applyFilters(raw?.donut_data || []);
            const recaudoMap = filteredDonut.reduce((acc, curr) => {
                const key = curr.Estado_Pago || 'SIN DATO';
                acc[key] = (acc[key] || 0) + (curr.count || 0);
                return acc;
            }, {});
            return {
                recaudo: Object.entries(recaudoMap).map(([name, value]) => ({ name, value })),
                gestion: buildDrilldown(raw?.sunburst_grouped, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
                conPago: buildDrilldown((raw?.detalle_pago?.grouped || []).filter(d => d.Estado_Pago !== 'SIN PAGO'), 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
                sinPago: buildDrilldown(raw?.detalle_sin_pago?.grouped || [], 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
                rodamiento: processGeneric(raw?.rodamiento_data, 'Franja_Cartera', 'Rodamiento', 'Número de Cuentas')
            };
        }
    }, [moduleData, activeTab, selectedFilters]);

    const BackBtn = ({ onClick }) => (
        <button onClick={onClick} className="flex items-center gap-1 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full text-[9px] font-black transition-all">
            <ArrowLeftCircle size={12} /> VOLVER
        </button>
    );

    return (
        <AuthenticatedLayout title="Panel Operativo">
            <div className="min-h-screen bg-slate-50 flex flex-col">
                {notification && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border p-4 rounded-2xl shadow-xl">
                        {notification.type === 'success' ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertTriangle className="text-red-500" size={20} />}
                        <span className="text-[10px] font-black uppercase">{notification.message}</span>
                        <X size={14} className="cursor-pointer" onClick={() => setNotification(null)}/>
                    </div>
                )}

                <header className="bg-white p-4 px-8 border-b border-slate-100 flex justify-between items-center sticky top-0 z-40 h-20">
                    <div className="flex items-center gap-3">
                        <Activity className="text-indigo-600" size={24}/>
                        <h1 className="text-sm font-black uppercase text-slate-800 tracking-tighter">Seguimiento Operativo</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['cartera', 'seguimientos'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2">
                            {isUploading ? <RefreshCw className="animate-spin" size={14}/> : <UploadCloud size={14}/>} {isUploading ? 'SUBIENDO...' : 'CARGAR BASE'}
                        </button>
                    </div>
                </header>

                <div className="flex flex-row flex-1 relative">
                    <FilterSidebar 
                        options={filterOptions} 
                        selectedFilters={selectedFilters} 
                        onFilterChange={handleFilterChange}
                        onClear={() => setSelectedFilters({ Empresa: [], CALL_CENTER_FILTRO: [], Zona: [], Regional_Cobro: [], Franja_Cartera: [] })}
                    />

                    <main className="flex-1 p-8 min-w-0 overflow-x-hidden">
                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm italic text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <RefreshCw className="animate-spin text-indigo-600 mb-4" size={32} /> Cargando datos...
                            </div>
                        ) : charts && (
                            <div className="space-y-12">
                                {activeTab === 'cartera' ? (
                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                        <ChartCard title="Distribución Regional"><StackedBar data={charts.regional.data} keys={charts.regional.keys} /></ChartCard>
                                        <ChartCard title="Distribución de Cobro"><StackedBar data={charts.cobro.data} keys={charts.cobro.keys} /></ChartCard>
                                        <ChartCard title="Evolución Desembolsos"><StackedBar data={charts.desembolsos.data} keys={charts.desembolsos.keys} isCurrency/></ChartCard>
                                        <ChartCard 
                                            title={selVigencia ? `Detalle: ${selVigencia.name}` : "Distribución Vigencia (Multinivel)"} 
                                            action={selVigencia && <BackBtn onClick={() => setSelVigencia(null)} />}
                                        >
                                            <InteractiveSunburst data={charts.vigencia} activeSelection={selVigencia} onSelect={setSelVigencia} />
                                        </ChartCard>
                                    </div>
                                ) : (
                                    <div className="space-y-12">
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                            <ChartCard title="Recaudo General">
                                                <DonutWithTotal data={charts.recaudo} total={charts.recaudo?.reduce((a,b)=>a+b.value,0)} />
                                            </ChartCard>
                                            <ChartCard 
                                                title={selGestion ? `Detalle: ${selGestion.name}` : "Gestión General (Multinivel)"} 
                                                action={selGestion && <BackBtn onClick={() => setSelGestion(null)} />}
                                            >
                                                <InteractiveSunburst data={charts.gestion} activeSelection={selGestion} onSelect={setSelGestion} />
                                            </ChartCard>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                            <ChartCard title="Crédito Con Pago (Multinivel)" action={selConPago && <BackBtn onClick={() => setSelConPago(null)} />}>
                                                <InteractiveSunburst data={charts.conPago} activeSelection={selConPago} onSelect={setSelConPago} />
                                            </ChartCard>
                                            <ChartCard title="Crédito Sin Pago (Multinivel)" action={selSinPago && <BackBtn onClick={() => setSelSinPago(null)} />}>
                                                <InteractiveSunburst data={charts.sinPago} activeSelection={selSinPago} onSelect={setSelSinPago} />
                                            </ChartCard>
                                        </div>

                                        <div className="space-y-2">
                                            <LocalFilterSection 
                                                title="Filtros de Búsqueda (Gestión)"
                                                isOpen={showLocalFiltersGestion}
                                                onToggle={() => setShowLocalFiltersGestion(!showLocalFiltersGestion)}
                                                filters={localFiltersGestion}
                                                onFilterChange={(k, v) => setLocalFiltersGestion(prev => ({...prev, [k]: v}))}
                                                configs={[
                                                    { key: 'estado_pago', label: 'Estado de Pago', options: localOptions.estado_pago },
                                                    { key: 'estado_gestion', label: 'Estado de Gestión', options: localOptions.estado_gestion },
                                                    { key: 'cargos', label: 'Cargo Usuario', options: localOptions.cargos },
                                                ]}
                                            />
                                            <TableToolbar 
                                                onSearch={(val) => fetchTableData('seguimientos_gestion', 1, val, localFiltersGestion, setGestionTable)}
                                                searchValue={gestionTable.search}
                                                allColumns={ALL_COLUMNS_GESTION}
                                                visibleColumns={visibleColsGestion}
                                                onToggleColumn={(key) => toggleColumn(key, setVisibleColsGestion, visibleColsGestion)}
                                            />
                                            <TableView 
                                                title="Tabla de Gestión Operativa" 
                                                data={gestionTable.data} 
                                                columns={ALL_COLUMNS_GESTION.filter(c => visibleColsGestion.includes(c.key))} 
                                                loading={gestionTable.loading} 
                                                pagination={gestionTable.pagination} 
                                                onPageChange={(p) => fetchTableData('seguimientos_gestion', p, gestionTable.search, localFiltersGestion, setGestionTable)} 
                                            />
                                        </div>

                                        <ChartCard title="Rodamiento por Franja"><StackedBar data={charts.rodamiento.data} keys={charts.rodamiento.keys} /></ChartCard>
                                        
                                        <div className="space-y-2">
                                            <LocalFilterSection 
                                                title="Filtros de Búsqueda (Rodamiento)"
                                                isOpen={showLocalFiltersRodamiento}
                                                onToggle={() => setShowLocalFiltersRodamiento(!showLocalFiltersRodamiento)}
                                                filters={localFiltersRodamiento}
                                                onFilterChange={(k, v) => setLocalFiltersRodamiento(prev => ({...prev, [k]: v}))}
                                                configs={[{ key: 'rodamiento', label: 'Rodamiento', options: localOptions.rodamiento }]}
                                            />
                                            <TableToolbar 
                                                onSearch={(val) => fetchTableData('seguimientos_rodamientos', 1, val, localFiltersRodamiento, setRodamientoTable)}
                                                searchValue={rodamientoTable.search}
                                                allColumns={ALL_COLUMNS_RODAMIENTO}
                                                visibleColumns={visibleColsRodamiento}
                                                onToggleColumn={(key) => toggleColumn(key, setVisibleColsRodamiento, visibleColsRodamiento)}
                                            />
                                            <TableView 
                                                title="Tabla de Rodamientos" 
                                                data={rodamientoTable.data} 
                                                columns={ALL_COLUMNS_RODAMIENTO.filter(c => visibleColsRodamiento.includes(c.key))} 
                                                loading={rodamientoTable.loading} 
                                                pagination={rodamientoTable.pagination} 
                                                onPageChange={(p) => fetchTableData('seguimientos_rodamientos', p, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable)} 
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}