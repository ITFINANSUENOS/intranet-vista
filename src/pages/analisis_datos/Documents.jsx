import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useAuth } from '../../context/AuthContext';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Label
} from 'recharts';
import { 
    RefreshCw, CheckCircle2, Activity, UploadCloud, AlertTriangle, FilePieChart
} from 'lucide-react';

// --- CONFIGURACIÓN DE COLORES ---
const COLOR_MAP = {
    '1 A 30': '#818cf8', '31 A 90': '#f59e0b', '91 A 180': '#ef4444', 
    '181 A 360': '#10b981', 'AL DIA': '#22d3ee', 'MAS DE 360': '#6366f1', 
    'CON GESTIÓN': '#10b981', 'SIN GESTIÓN': '#6366f1', 'EMPEORO': '#ef4444', 
    'MEJORO': '#22d3ee', 'IGUAL': '#f59e0b', 'PAGO': '#10b981', 'SIN PAGO': '#94a3b8',
    'ANTICIPADO': '#10b981', 'VIGENCIA EXPIRADA': '#6366f1', 'VIGENTES': '#f43f5e',
    'CALL CENTER': '#8b5cf6', 'ASESOR': '#ec4899', 'GESTOR': '#f59e0b',
    'NORMALIZO': '#10b981', 'MANTUVO': '#f59e0b', 'PAGOS PENDIENTES POR CRUZAR': '#8b5cf6'
};
const DEFAULT_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899'];

// --- TOOLTIP CORREGIDO PARA BARRAS Y DONAS ---
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 shadow-2xl rounded-2xl border border-slate-100 min-w-[200px] z-50">
                <p className="text-[11px] font-black text-slate-800 mb-2 uppercase border-b pb-1">
                    {label || payload[0].payload.name || payload[0].name}
                </p>
                {payload.map((item, index) => (
                    <div key={index} className="flex justify-between items-center gap-4 py-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                            {item.name}:
                        </span>
                        <span className="text-[11px] font-black text-slate-900">
                            {Number(item.value || 0).toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function Documents() {
    const { apiClient } = useAuth();
    const [activeTab, setActiveTab] = useState('cartera'); 
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false); 
    const [uploadProgress, setUploadProgress] = useState(0); 
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [moduleData, setModuleData] = useState({ cartera: null, seguimientos: null });
    const [notification, setNotification] = useState(null);
    
    // Estados para drilldown
    const [vigenciaSelection, setVigenciaSelection] = useState(null); 
    const [gestionSelection, setGestionSelection] = useState(null);
    const [pagoSelection, setPagoSelection] = useState(null);
    const [sinPagoSelection, setSinPagoSelection] = useState(null);

    const fileInputRef = useRef(null);

    const fetchWalletData = useCallback(async (jobId) => {
        if (!jobId) return;
        setLoading(true);
        try {
            const [resCartera, resSeguimientos] = await Promise.all([
                apiClient.get(`/wallet/init/cartera?job_id=${jobId}`),
                apiClient.get(`/wallet/init/seguimientos?job_id=${jobId}`)
            ]);
            setModuleData({
                cartera: resCartera?.data?.data?.data || null,
                seguimientos: resSeguimientos?.data?.data?.data || null
            });
            setSelectedJobId(jobId);
        } catch (error) {
            setNotification({ type: 'error', message: 'Error al cargar datos' });
        } finally {
            setLoading(false);
        }
    }, [apiClient]);

    const waitForProcessAndRedirect = async (newJobId) => {
        const interval = setInterval(async () => {
            try {
                const { data } = await apiClient.get('/reportes/activo');
                const serverId = data.active_job_id || data.job_id;
                if (serverId === newJobId) {
                    clearInterval(interval);
                    await fetchWalletData(newJobId);
                    setIsUploading(false);
                    setUploadProgress(0);
                    setNotification({ type: 'success', message: 'Datos actualizados correctamente' });
                }
            } catch (e) { console.warn("Procesando..."); }
        }, 3000);
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const { data: signRes } = await apiClient.post('/reportes/generar-url', {
                filename: file.name,
                content_type: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signRes.upload_url);
            xhr.upload.onprogress = (e) => setUploadProgress(Math.round((e.loaded / e.total) * 70) + 10);
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    const { data: procRes } = await apiClient.post('/reportes/iniciar-procesamiento', {
                        file_key: signRes.file_key,
                        empresa: 'FINANSUENOS'
                    });
                    waitForProcessAndRedirect(procRes.job_id);
                }
            };
            xhr.send(file);
        } catch (error) {
            setIsUploading(false);
            setNotification({ type: 'error', message: 'Error en la subida' });
        }
    };

    useEffect(() => {
        apiClient.get('/reportes/activo').then(({ data }) => {
            const id = data?.active_job_id || data?.job_id;
            if (id) fetchWalletData(id);
        });
    }, [apiClient, fetchWalletData]);

    const charts = useMemo(() => {
        try {
            const raw = moduleData[activeTab];
            if (!raw) return null;

            const processGeneric = (list, xKey, stackKey, valKey) => {
                const items = Array.isArray(list) ? list : (list?.grouped || []);
                const map = {}; const keysSet = new Set();
                items.forEach(d => {
                    const xVal = d[xKey] || 'N/A';
                    const sKey = String(d[stackKey] || 'OTROS').toUpperCase();
                    const val = Number(d[valKey] || d['count'] || d['Cantidad'] || 0);
                    if (!map[xVal]) map[xVal] = { name: xVal };
                    map[xVal][sKey] = (map[xVal][sKey] || 0) + val;
                    keysSet.add(sKey);
                });
                return { data: Object.values(map), keys: Array.from(keysSet) };
            };

            const buildDrilldown = (list, mainKey, subKey, valKey) => {
                const items = Array.isArray(list) ? list : (list?.grouped || []);
                const total = items.reduce((sum, item) => sum + Number(item[valKey] || 0), 0);
                const grouped = items.reduce((acc, item) => {
                    const main = String(item[mainKey] || 'SIN DATO').toUpperCase();
                    const sub = String(item[subKey] || 'OTROS').toUpperCase();
                    const val = Number(item[valKey] || 0);
                    if (!acc[main]) acc[main] = { name: main, value: 0, children: {} };
                    acc[main].value += val;
                    acc[main].children[sub] = (acc[main].children[sub] || 0) + val;
                    return acc;
                }, {});

                return Object.values(grouped).map(m => ({
                    name: m.name,
                    value: m.value,
                    percentage: total > 0 ? ((m.value / total) * 100).toFixed(1) : "0",
                    children: Object.entries(m.children).map(([name, val]) => ({
                        name, 
                        value: val, 
                        percentage: m.value > 0 ? ((val / m.value) * 100).toFixed(1) : "0"
                    }))
                }));
            };

            if (activeTab === 'cartera') {
                const desembolsoMap = (raw?.cubo_desembolso || []).reduce((acc, d) => {
                    const anio = String(d.Año_Desembolso || d.Anio_Desembolso || 'N/A');
                    if (!acc[anio]) acc[anio] = { name: anio, "VALOR DESEMBOLSO": 0 };
                    acc[anio]["VALOR DESEMBOLSO"] += Number(d.Valor_Desembolso || 0);
                    return acc;
                }, {});

                return {
                    regional: processGeneric(raw?.cubo_regional, 'Regional_Venta', 'Franja_Meta', 'count'),
                    cobro: processGeneric(raw?.cubo_cobro, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
                    desembolso: { data: Object.values(desembolsoMap), keys: ["VALOR DESEMBOLSO"] },
                    vigencia: buildDrilldown(raw?.cubo_vigencia, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
                };
            } else {
                const recaudoItems = raw?.donut_data || [];
                const recaudoTotal = recaudoItems.reduce((a, b) => a + Number(b.count || 0), 0);
                const recaudoBase = recaudoItems.reduce((acc, item) => {
                    const estado = String(item.Estado_Pago || 'SIN PAGO').toUpperCase();
                    acc[estado] = (acc[estado] || 0) + Number(item.count || 0);
                    return acc;
                }, {});

                // Priorizamos el uso de detalle_pago/detalle_sin_pago para los drilldowns
                const detailData = raw?.detalle_pago?.grouped || raw?.detalle_pago || [];
                const detailSinPago = raw?.detalle_sin_pago?.grouped || raw?.detalle_sin_pago || [];

                return {
                    recaudo: Object.entries(recaudoBase).map(([name, value]) => ({
                        name, value, percentage: recaudoTotal > 0 ? ((value / recaudoTotal) * 100).toFixed(1) : "0"
                    })),
                    recaudoTotal,
                    gestion: buildDrilldown(raw?.sunburst_grouped, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
                    conPago: buildDrilldown(detailData.filter(d => d.Estado_Pago !== 'SIN PAGO'), 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
                    sinPago: buildDrilldown(detailSinPago, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad')
                };
            }
        } catch (err) {
            console.error("Error procesando charts:", err);
            return null;
        }
    }, [moduleData, activeTab]);

    return (
        <AuthenticatedLayout title="Seguimiento de Cartera">
            <div className="min-h-screen bg-slate-50 p-6">
                
                {notification && (
                    <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl">
                        <CheckCircle2 className="text-emerald-500" size={20} />
                        <span className="text-[10px] font-black uppercase text-slate-700">{notification.message}</span>
                    </div>
                )}

                <header className="bg-white p-4 rounded-[2rem] shadow-sm flex flex-wrap justify-between items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg"><Activity size={20}/></div>
                        <div>
                            <h1 className="text-sm font-black uppercase text-slate-800">Panel de Control</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">ID ACTIVO: {selectedJobId || 'PENDIENTE'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {['cartera', 'seguimientos'].map(tab => (
                                <button key={tab} onClick={() => { 
                                    setActiveTab(tab); 
                                    setVigenciaSelection(null);
                                    setGestionSelection(null);
                                    setPagoSelection(null);
                                    setSinPagoSelection(null);
                                }}
                                    className={`px-6 py-2 rounded-lg text-[10px] font-black transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                                    {tab.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current.click()} disabled={isUploading}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-indigo-700 disabled:bg-slate-300">
                            {isUploading ? <RefreshCw className="animate-spin" size={14}/> : <UploadCloud size={14}/>}
                            {isUploading ? `SUBIENDO ${uploadProgress}%` : 'CARGAR REPORTE'}
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center bg-white rounded-[3rem] shadow-sm">
                        <div className="w-14 h-14 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6" />
                        <p className="text-[11px] font-black text-slate-500 uppercase">Sincronizando gráficas...</p>
                    </div>
                ) : charts ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {activeTab === 'cartera' ? (
                            <>
                                <ChartCard title="Distribución Regional"><StackedBar data={charts.regional.data} keys={charts.regional.keys} /></ChartCard>
                                <ChartCard title="Gestión de Cobro"><StackedBar data={charts.cobro.data} keys={charts.cobro.keys} /></ChartCard>
                                <ChartCard title="Desembolso por Año"><StackedBar data={charts.desembolso.data} keys={charts.desembolso.keys} /></ChartCard>
                                <ChartCard 
                                    title={vigenciaSelection ? `Detalle: ${vigenciaSelection.name}` : "Vigencia de Cartera"} 
                                    action={vigenciaSelection && <button onClick={() => setVigenciaSelection(null)} className="text-indigo-600 text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-lg">VOLVER</button>}
                                >
                                    <DrilldownChart data={vigenciaSelection ? vigenciaSelection.children : charts.vigencia} onNodeClick={(n) => !vigenciaSelection && setVigenciaSelection(n)} />
                                </ChartCard>
                            </>
                        ) : (
                            <>
                                <ChartCard title="Recaudo General"><DonutWithTotal data={charts.recaudo} total={charts.recaudoTotal} /></ChartCard>
                                <ChartCard 
                                    title={gestionSelection ? `Gestión: ${gestionSelection.name}` : "Gestión Global"} 
                                    action={gestionSelection && <button onClick={() => setGestionSelection(null)} className="text-indigo-600 text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-lg">VOLVER</button>}
                                >
                                    <DrilldownChart data={gestionSelection ? gestionSelection.children : charts.gestion} onNodeClick={(n) => !gestionSelection && setGestionSelection(n)} />
                                </ChartCard>
                                <ChartCard 
                                    title={pagoSelection ? `Con Pago: ${pagoSelection.name}` : "Créditos con Pago"} 
                                    action={pagoSelection && <button onClick={() => setPagoSelection(null)} className="text-indigo-600 text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-lg">VOLVER</button>}
                                >
                                    <DrilldownChart data={pagoSelection ? pagoSelection.children : charts.conPago} onNodeClick={(n) => !pagoSelection && setPagoSelection(n)} />
                                </ChartCard>
                                <ChartCard 
                                    title={sinPagoSelection ? `Sin Pago: ${sinPagoSelection.name}` : "Créditos sin Pago"} 
                                    action={sinPagoSelection && <button onClick={() => setSinPagoSelection(null)} className="text-indigo-600 text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-lg">VOLVER</button>}
                                >
                                    <DrilldownChart data={sinPagoSelection ? sinPagoSelection.children : charts.sinPago} onNodeClick={(n) => !sinPagoSelection && setSinPagoSelection(n)} />
                                </ChartCard>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="h-[60vh] border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center bg-white/50 text-slate-400">
                        <FilePieChart size={50} className="mb-4 opacity-20" />
                        <p className="text-[10px] font-black uppercase">Sube un archivo para generar visualizaciones</p>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

// --- COMPONENTES AUXILIARES ---

const ChartCard = ({ title, children, action }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black text-slate-800 uppercase italic">{title}</h3>
            {action}
        </div>
        <div className="h-[300px] w-full">
            {children ? children : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <AlertTriangle size={30} className="mb-2 opacity-50"/>
                    <span className="text-[9px] font-bold">ERROR AL RENDERIZAR GRÁFICA</span>
                </div>
            )}
        </div>
    </div>
);

const StackedBar = ({ data, keys }) => {
    if (!data?.length) return null;
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: '800'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9}} tickFormatter={(v) => v >= 1000000 ? `${(v/1e6).toFixed(1)}M` : v} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingTop: '20px'}} />
                {keys.map((key, i) => (
                    <Bar key={key} dataKey={key} stackId="a" fill={COLOR_MAP[key] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} barSize={24} radius={[4, 4, 0, 0]} />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );
};

const DonutWithTotal = ({ data, total }) => {
    if (!data?.length) return null;
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={75} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {data.map((entry, index) => <Cell key={index} fill={COLOR_MAP[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />)}
                    <Label position="center" content={({ viewBox: { cx, cy } }) => (
                        <g>
                            <text x={cx} y={cy - 5} textAnchor="middle" className="fill-slate-800 text-lg font-black">{(total || 0).toLocaleString()}</text>
                            <text x={cx} y={cy + 15} textAnchor="middle" className="fill-slate-400 text-[8px] font-black uppercase">TOTAL CUENTAS</text>
                        </g>
                    )}/>
                </Pie>
                <Tooltip content={<CustomTooltip />} />
            </PieChart>
        </ResponsiveContainer>
    );
};

const DrilldownChart = ({ data, onNodeClick }) => {
    if (!data?.length) return null;
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none" 
                     onClick={(e) => onNodeClick && onNodeClick(e)} className="cursor-pointer outline-none">
                    {data.map((entry, index) => <Cell key={index} fill={COLOR_MAP[entry.name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingTop: '20px'}} />
            </PieChart>
        </ResponsiveContainer>
    );
};