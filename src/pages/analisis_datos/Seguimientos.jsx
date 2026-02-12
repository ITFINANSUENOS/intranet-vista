import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
    PieChart, Pie, Cell, Label, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
    Search, Filter, ChevronDown, ChevronUp, Columns, ArrowLeftCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';

// Colores proporcionados por el usuario
const CUSTOM_PALETTE = [
    '#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', 
    '#db2777', '#65a30d', '#475569', '#ea580c', '#059669', '#4f46e5'
];

import { COLOR_MAP } from './DashboardComponents';

// --- COMPONENTES DE INTERFAZ LOCALES ---

const ChartCard = ({ title, children, action }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{title}</h3>
            {action}
        </div>
        <div className="flex-1 min-h-[380px]">{children}</div>
    </div>
);

const BackBtn = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-1.5 rounded-full transition-all shadow-md active:scale-95">
        <ArrowLeftCircle size={14} />
        <span className="text-[9px] font-black uppercase">General</span>
    </button>
);

const LocalFilterSection = ({ title, configs, filters, onFilterChange, isOpen, onToggle }) => (
    <div className="mb-4 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-500" />
                <h3 className="text-[10px] font-black text-slate-700 uppercase">{title}</h3>
            </div>
            {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
        {isOpen && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100">
                {configs.map((config) => (
                    <div key={config.key} className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 block">{config.label}</label>
                        <select className="w-full bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded-lg py-2 px-3 outline-none uppercase"
                            value={filters[config.key]?.[0] || ''} 
                            onChange={(e) => { const val = e.target.value; onFilterChange(config.key, val ? [val] : []); }}>
                            <option value="">Todos</option>
                            {config.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const TableToolbar = ({ onSearch, searchValue, allColumns, visibleColumns, onToggleColumn }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:flex-1 md:max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" value={searchValue} placeholder="Buscar..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold outline-none shadow-sm" 
                    onChange={(e) => onSearch(e.target.value)} />
            </div>
            <div className="relative w-full md:w-auto">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm">
                    <Columns size={16} className="text-indigo-600"/><span className="text-[10px] font-black text-slate-700 uppercase">Columnas</span>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full md:w-64 bg-white rounded-xl shadow-2xl border border-slate-100 z-[60] p-3 max-h-80 overflow-y-auto animate-in fade-in zoom-in duration-200">
                        {allColumns.map((col) => (
                            <label key={col.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => onToggleColumn(col.key)} className="rounded text-indigo-600" />
                                <span className="text-[10px] font-bold uppercase text-slate-600">{col.label}</span>
                            </label>
                        ))}
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
            <div className="px-3 py-1 bg-indigo-50 rounded-lg"><span className="text-[9px] font-black text-indigo-600 uppercase">Total: {(pagination.total_records || 0).toLocaleString()}</span></div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                        {columns.map((col) => <th key={col.key} className="p-4 text-[9px] font-black text-slate-500 uppercase whitespace-nowrap">{col.label}</th>)}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {loading ? (<tr><td colSpan={columns.length} className="p-12 text-center text-[10px] font-bold text-slate-400 animate-pulse uppercase">Cargando datos...</td></tr>) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                                {columns.map((col) => <td key={`${idx}-${col.key}`} className="p-3 text-[10px] font-semibold text-slate-600 whitespace-nowrap">{row[col.key] !== null ? row[col.key].toLocaleString() : '-'}</td>)}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Página {pagination.current} de {pagination.total_pages || 1}</span>
            <div className="flex gap-2">
                <button onClick={() => onPageChange(pagination.current - 1)} disabled={pagination.current <= 1 || loading} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={14}/></button>
                <button onClick={() => onPageChange(pagination.current + 1)} disabled={pagination.current >= pagination.total_pages || loading} className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={14}/></button>
            </div>
        </div>
    </div>
);

// --- COMPONENTES DE GRÁFICOS (GROSOR Y ESTÉTICA OPTIMIZADA) ---

const SunburstPieLocal = ({ data, focusedNode, setFocusedNode }) => {
    const displayL1 = focusedNode ? [focusedNode] : data.level1;
    const displayL2 = focusedNode ? focusedNode.children : data.level2;

    const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
        
        if (percent < 0.05) return null;
        const textColor = innerRadius > 95 && !focusedNode ? '#334155' : '#ffffff';
        const displayName = name.length > 14 ? `${name.substring(0, 11)}...` : name;

        return (
            <text x={x} y={y} fill={textColor} textAnchor="middle" dominantBaseline="central" className="text-[8px] font-black uppercase tracking-tight pointer-events-none">
                <tspan x={x} dy="-0.4em">{displayName}</tspan>
                <tspan x={x} dy="1.2em">{(percent * 100).toFixed(0)}%</tspan>
            </text>
        );
    };

    return (
        <ResponsiveContainer width="100%" height={380}>
            <PieChart>
                <Pie 
                    data={displayL1} dataKey="value" nameKey="name" cx="50%" cy="50%" 
                    innerRadius={focusedNode ? 0 : 50} outerRadius={105} paddingAngle={focusedNode ? 0 : 2} 
                    label={renderLabel} labelLine={false} stroke="#fff" strokeWidth={3}
                    onClick={(e) => !focusedNode && setFocusedNode(e)}
                >
                    {displayL1.map((entry, i) => (
                        <Cell key={i} fill={COLOR_MAP?.[entry.name.toUpperCase()] || CUSTOM_PALETTE[i % CUSTOM_PALETTE.length]} className="cursor-pointer outline-none hover:brightness-110 transition-all" />
                    ))}
                    {!focusedNode && <Label position="center" content={() => <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-slate-300 text-[10px] font-black uppercase tracking-widest">Total</text>} />}
                </Pie>
                <Pie 
                    data={displayL2} dataKey="value" nameKey="name" cx="50%" cy="50%" 
                    innerRadius={112} outerRadius={focusedNode ? 155 : 145} paddingAngle={1} 
                    label={renderLabel} labelLine={false} stroke="#fff" strokeWidth={1}
                >
                    {displayL2.map((entry, i) => (
                        <Cell key={i} fill={COLOR_MAP?.[entry.parentName?.toUpperCase()] || CUSTOM_PALETTE[i % CUSTOM_PALETTE.length]} opacity={focusedNode ? 1 : 0.6} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    );
};

const LocalStackedBar = ({ data, keys }) => (
    <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ left: -10, bottom: 40, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 800, fill: '#94a3b8'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: '#f8fafc'}} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingBottom: '10px'}} />
            {keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={COLOR_MAP[k.toUpperCase()] || CUSTOM_PALETTE[i % CUSTOM_PALETTE.length]} radius={[2, 2, 0, 0]} />)}
        </BarChart>
    </ResponsiveContainer>
);

// --- COMPONENTE PRINCIPAL ---

const ALL_COLUMNS_GESTION = [
    { key: 'Credito', label: 'Crédito' }, { key: 'Cedula_Cliente', label: 'Cédula' }, { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Celular', label: 'Celular' }, { key: 'Nombre_Ciudad', label: 'Ciudad' }, { key: 'Zona', label: 'Zona' },
    { key: 'Regional_Cobro', label: 'Regional' }, { key: 'Estado_Gestion', label: 'Gestión' }, { key: 'Estado_Pago', label: 'Estado Pago' },
    { key: 'Dias_Atraso_Final', label: 'Días Atraso' }, { key: 'Valor_Vencido', label: 'Valor Vencido' }, { key: 'Total_Recaudo', label: 'Total Recaudo' },
    { key: 'Cargo_Usuario', label: 'Cargo Usuario' }, { key: 'Nombre_Usuario', label: 'Gestor' }, { key: 'Novedad', label: 'Última Novedad' }
];

const ALL_COLUMNS_RODAMIENTO = [
    { key: 'Credito', label: 'Crédito' }, { key: 'Cedula_Cliente', label: 'Cédula' }, { key: 'Nombre_Cliente', label: 'Cliente' },
    { key: 'Rodamiento', label: 'Rodamiento' }, { key: 'Franja_Cartera', label: 'Franja' }, { key: 'Valor_Vencido', label: 'Valor Vencido' }
];

export default function Seguimientos({ data, selectedFilters, apiClient, jobId }) {
    // Estados Zoom
    const [focusedGestion, setFocusedGestion] = useState(null);
    const [focusedConPago, setFocusedConPago] = useState(null);
    const [focusedSinPago, setFocusedSinPago] = useState(null);

    // Estados Tablas
    const [localFiltersGestion, setLocalFiltersGestion] = useState({ estado_pago: [], estado_gestion: [], cargos: [] });
    const [localFiltersRodamiento, setLocalFiltersRodamiento] = useState({ rodamiento: [] });
    const [showLocalFiltersGestion, setShowLocalFiltersGestion] = useState(true);
    const [showLocalFiltersRodamiento, setShowLocalFiltersRodamiento] = useState(true);

    const [gestionTable, setGestionTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [rodamientoTable, setRodamientoTable] = useState({ data: [], loading: false, search: '', pagination: { current: 1, total_pages: 0, total_records: 0 } });
    const [visibleColsGestion, setVisibleColsGestion] = useState(['Cedula_Cliente', 'Nombre_Cliente', 'Estado_Gestion', 'Estado_Pago', 'Regional_Cobro', 'Novedad']);
    const [visibleColsRodamiento, setVisibleColsRodamiento] = useState(['Credito', 'Cedula_Cliente', 'Rodamiento', 'Franja_Cartera', 'Valor_Vencido']);

    const applyGlobalFilters = (dataSet) => {
        if (!Array.isArray(dataSet)) return [];
        return dataSet.filter(item => 
            Object.entries(selectedFilters).every(([key, values]) => {
                if (!values || !Array.isArray(values) || values.length === 0) return true;
                return values.includes(item[key]);
            })
        );
    };

    const buildSunburstData = (list, mainKey, subKey, valKey) => {
        const filtered = applyGlobalFilters(Array.isArray(list) ? list : (list?.grouped || []));
        const grouped = filtered.reduce((acc, item) => {
            const main = String(item[mainKey] || 'SIN DATO').toUpperCase();
            const sub = String(item[subKey] || 'OTROS').toUpperCase();
            const val = Number(item[valKey] || item['count'] || 1);
            if (!acc[main]) acc[main] = { name: main, value: 0, children: {} };
            acc[main].value += val;
            acc[main].children[sub] = (acc[main].children[sub] || 0) + val;
            return acc;
        }, {});

        const level1 = Object.values(grouped).map(m => ({ 
            name: m.name, value: m.value,
            children: Object.entries(m.children).map(([name, value]) => ({ name, value, parentName: m.name }))
        }));
        return { level1, level2: level1.flatMap(p => p.children) };
    };

    const processStackedBarData = (list, xKey, stackKey, valKey) => {
        const filtered = applyGlobalFilters(Array.isArray(list) ? list : (list?.grouped || []));
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

    const toggleColumn = (key, setter, current) => setter(current.includes(key) ? current.filter(k => k !== key) : [...current, key]);

    const localOptions = useMemo(() => {
        if (!data) return { estado_pago: [], estado_gestion: [], cargos: [], rodamiento: [] };
        const getUniques = (arr, key) => [...new Set(arr.map(x => x[key]).filter(Boolean))].sort();
        return { 
            estado_pago: getUniques(data.donut_data || [], 'Estado_Pago'),
            estado_gestion: getUniques(data.sunburst_grouped || [], 'Estado_Gestion'),
            cargos: getUniques(data.sunburst_grouped || [], 'Cargo_Usuario'),
            rodamiento: getUniques(data.rodamiento_data || [], 'Rodamiento')
        };
    }, [data]);

    const fetchTableData = useCallback(async (source, page = 1, search = '', filters = {}, setter) => {
        if (!jobId) return;
        setter(prev => ({ ...prev, loading: true, search }));
        try {
            const payload = { job_id: jobId, origen: source, page, page_size: 15, search_term: search, ...filters };
            const response = await apiClient.post('/wallet/buscar', payload);
            setter(prev => ({ 
                ...prev, data: response.data.data || [], loading: false, 
                pagination: { current: response.data.meta?.page || page, total_pages: response.data.meta?.pages || 0, total_records: response.data.meta?.total || 0 } 
            }));
        } catch (error) { setter(prev => ({ ...prev, loading: false })); }
    }, [jobId, apiClient]);

    useEffect(() => { if(jobId) fetchTableData('seguimientos_gestion', 1, gestionTable.search, localFiltersGestion, setGestionTable); }, [localFiltersGestion, jobId, fetchTableData]);
    useEffect(() => { if(jobId) fetchTableData('seguimientos_rodamientos', 1, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable); }, [localFiltersRodamiento, jobId, fetchTableData]);

    const charts = useMemo(() => {
        if (!data) return null;
        const filteredDonut = applyGlobalFilters(data.donut_data || []);
        const recaudoMap = filteredDonut.reduce((acc, curr) => {
            const key = curr.Estado_Pago || 'SIN DATO';
            acc[key] = (acc[key] || 0) + (curr.count || 0);
            return acc;
        }, {});

        return {
            recaudo: Object.entries(recaudoMap).map(([name, value]) => ({ name, value })),
            gestion: buildSunburstData(data.sunburst_grouped, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            conPago: buildSunburstData((data.detalle_pago?.grouped || []).filter(d => d.Estado_Pago !== 'SIN PAGO'), 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            sinPago: buildSunburstData(data.detalle_sin_pago?.grouped || [], 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            rodamiento: processStackedBarData(data.rodamiento_data, 'Franja_Cartera', 'Rodamiento', 'Número de Cuentas')
        };
    }, [data, selectedFilters]);

    if (!charts) return null;

    return (
        <div className="space-y-16 animate-in fade-in duration-700 p-4">
            
            {/* 1. SECCIÓN DE GRÁFICOS SUNBURST */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <ChartCard title="Recaudo General">
                    <SunburstPieLocal data={{level1: charts.recaudo, level2: []}} focusedNode={null} />
                </ChartCard>

                <ChartCard 
                    title={focusedGestion ? `Gestión: ${focusedGestion.name}` : "Distribución de Gestión"} 
                    action={focusedGestion && <BackBtn onClick={() => setFocusedGestion(null)} />}
                >
                    <SunburstPieLocal data={charts.gestion} focusedNode={focusedGestion} setFocusedNode={setFocusedGestion} />
                </ChartCard>

                <ChartCard 
                    title={focusedConPago ? `Con Pago: ${focusedConPago.name}` : "Gestión con Pago"} 
                    action={focusedConPago && <BackBtn onClick={() => setFocusedConPago(null)} />}
                >
                    <SunburstPieLocal data={charts.conPago} focusedNode={focusedConPago} setFocusedNode={setFocusedConPago} />
                </ChartCard>

                <ChartCard 
                    title={focusedSinPago ? `Sin Pago: ${focusedSinPago.name}` : "Gestión sin Pago"} 
                    action={focusedSinPago && <BackBtn onClick={() => setFocusedSinPago(null)} />}
                >
                    <SunburstPieLocal data={charts.sinPago} focusedNode={focusedSinPago} setFocusedNode={setFocusedSinPago} />
                </ChartCard>
            </div>

            {/* 2. FILTROS Y TABLA DE GESTIÓN */}
            <div className="space-y-6">
                <LocalFilterSection 
                    title="Filtros de Gestión" 
                    isOpen={showLocalFiltersGestion} 
                    onToggle={() => setShowLocalFiltersGestion(!showLocalFiltersGestion)} 
                    filters={localFiltersGestion} 
                    onFilterChange={(k, v) => setLocalFiltersGestion(prev => ({...prev, [k]: v}))} 
                    configs={[
                        { key: 'estado_pago', label: 'Pago', options: localOptions.estado_pago },
                        { key: 'estado_gestion', label: 'Gestión', options: localOptions.estado_gestion },
                        { key: 'cargos', label: 'Cargos', options: localOptions.cargos }
                    ]} 
                />
                
                <TableToolbar 
                    onSearch={(v) => fetchTableData('seguimientos_gestion', 1, v, localFiltersGestion, setGestionTable)} 
                    searchValue={gestionTable.search} 
                    allColumns={ALL_COLUMNS_GESTION} 
                    visibleColumns={visibleColsGestion} 
                    onToggleColumn={(key) => toggleColumn(key, setVisibleColsGestion, visibleColsGestion)} 
                />
                
                <TableView 
                    title="Tabla Detallada de Gestión" 
                    data={gestionTable.data} 
                    columns={ALL_COLUMNS_GESTION.filter(c => visibleColsGestion.includes(c.key))} 
                    loading={gestionTable.loading} 
                    pagination={gestionTable.pagination} 
                    onPageChange={(p) => fetchTableData('seguimientos_gestion', p, gestionTable.search, localFiltersGestion, setGestionTable)} 
                />
            </div>

            {/* 3. GRÁFICO DE RODAMIENTOS */}
            <div className="grid grid-cols-1">
                <ChartCard title="Análisis de Rodamiento de Cartera">
                    <LocalStackedBar data={charts.rodamiento.data} keys={charts.rodamiento.keys} />
                </ChartCard>
            </div>

            {/* 4. FILTROS Y TABLA DE RODAMIENTOS */}
            <div className="space-y-6">
                <LocalFilterSection 
                    title="Filtros de Rodamientos" 
                    isOpen={showLocalFiltersRodamiento} 
                    onToggle={() => setShowLocalFiltersRodamiento(!showLocalFiltersRodamiento)} 
                    filters={localFiltersRodamiento} 
                    onFilterChange={(k, v) => setLocalFiltersRodamiento(prev => ({...prev, [k]: v}))} 
                    configs={[{ key: 'rodamiento', label: 'Rodamiento', options: localOptions.rodamiento }]} 
                />
                
                <TableToolbar 
                    onSearch={(v) => fetchTableData('seguimientos_rodamientos', 1, v, localFiltersRodamiento, setRodamientoTable)} 
                    searchValue={rodamientoTable.search} 
                    allColumns={ALL_COLUMNS_RODAMIENTO} 
                    visibleColumns={visibleColsRodamiento} 
                    onToggleColumn={(key) => toggleColumn(key, setVisibleColsRodamiento, visibleColsRodamiento)} 
                />
                
                <TableView 
                    title="Tabla Detallada de Rodamientos" 
                    data={rodamientoTable.data} 
                    columns={ALL_COLUMNS_RODAMIENTO.filter(c => visibleColsRodamiento.includes(c.key))} 
                    loading={rodamientoTable.loading} 
                    pagination={rodamientoTable.pagination} 
                    onPageChange={(p) => fetchTableData('seguimientos_rodamientos', p, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable)} 
                />
            </div>

        </div>
    );
}