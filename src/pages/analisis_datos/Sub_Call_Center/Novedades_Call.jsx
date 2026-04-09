import React, { useMemo } from 'react';
import { 
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, 
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#8b5cf6'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    if (percent < 0.01) return null;

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    let rotation = -midAngle;
    if (midAngle > 90 && midAngle < 270) {
        rotation += 180;
    }

    const isVerySmall = percent < 0.02; 
    const isSmall = percent < 0.08;     
    const isMedium = percent < 0.15;    

    let nameFontSize = '9px'; 
    let percentFontSize = '12px';

    if (isSmall) {
        nameFontSize = '7px';
        percentFontSize = '9px';
    } else if (isMedium) {
        nameFontSize = '8px';
        percentFontSize = '11px';
    }

    let lines = [name];
    if (name.length > 12 && name.includes(' ')) {
        const words = name.split(' ');
        const mid = Math.ceil(words.length / 2);
        lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
    }

    return (
        <text 
            x={x} 
            y={y} 
            fill="white" 
            textAnchor="middle" 
            dominantBaseline="central"
            transform={`rotate(${rotation}, ${x}, ${y})`}
            style={{ pointerEvents: 'none' }}
        >
            {!isVerySmall && lines.map((line, index) => (
                <tspan 
                    key={index}
                    x={x} 
                    dy={index === 0 ? (lines.length === 2 ? '-1em' : '-0.5em') : '1.1em'} 
                    style={{ 
                        fontSize: nameFontSize, 
                        fontWeight: 600, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.02em',
                        textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0px 0px 5px rgba(0,0,0,0.5)' 
                    }}
                >
                    {line}
                </tspan>
            ))}
            
            <tspan 
                x={x} 
                dy={isVerySmall ? '0.3em' : '1.2em'} 
                style={{ 
                    fontSize: percentFontSize, 
                    fontWeight: 900, 
                    textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0px 0px 5px rgba(0,0,0,0.5)' 
                }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </tspan>
        </text>
    );
};

export default function Novedades_Call({ data, df_compromisos = [], selectedFilters }) {
    
    // Procesamiento para el PieChart Original
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];

        let filteredData = data;
        
        if (selectedFilters?.CALL_CENTER_FILTRO?.length > 0) {
            filteredData = filteredData.filter(item => 
                selectedFilters.CALL_CENTER_FILTRO.includes(item.Call_Center)
            );
        }
        
        const grouped = filteredData.reduce((acc, curr) => {
            const tipo = curr.Tipo_Novedad || 'DESCONOCIDO';
            if (!acc[tipo]) acc[tipo] = 0;
            acc[tipo] += (Number(curr.Cantidad) || 0);
            return acc;
        }, {});

        return Object.keys(grouped).map(key => ({
            name: key,
            value: grouped[key]
        })).sort((a, b) => b.value - a.value); 

    }, [data, selectedFilters]);

    // Procesamiento para las Tarjetas y el BarChart (Compromisos)
    const compromisosData = useMemo(() => {
        if (!df_compromisos || !Array.isArray(df_compromisos)) {
            return { totals: { vigentes: 0, vencidos: 0, totales: 0 }, chart: [] };
        }

        let filtered = df_compromisos;
        if (selectedFilters?.CALL_CENTER_FILTRO?.length > 0) {
            filtered = filtered.filter(item => selectedFilters.CALL_CENTER_FILTRO.includes(item.Call_Center));
        }

        let vigentes = 0;
        let vencidos = 0;
        let totales = 0;

        const groupedByCC = {};

        filtered.forEach(item => {
            const qty = Number(item.Cantidad) || 0;
            totales += qty;
            
            // Normalizar estado
            const estado = (item.Estado_Acuerdo || '').toUpperCase().trim();
            
            if (estado === 'ACUERDOS VIGENTES') vigentes += qty;
            else if (estado === 'ACUERDOS VENCIDO' || estado === 'ACUERDOS VENCIDOS') vencidos += qty;

            // Agrupar para el gráfico de barras por Call Center
            const cc = item.Call_Center || 'Desconocido';
            if (!groupedByCC[cc]) {
                groupedByCC[cc] = { name: cc, vigentes: 0, vencidos: 0, otros: 0, total: 0 };
            }
            
            if (estado === 'ACUERDOS VIGENTES') groupedByCC[cc].vigentes += qty;
            else if (estado === 'ACUERDOS VENCIDO' || estado === 'ACUERDOS VENCIDOS') groupedByCC[cc].vencidos += qty;
            else groupedByCC[cc].otros += qty;
            
            groupedByCC[cc].total += qty;
        });

        return {
            totals: { vigentes, vencidos, totales },
            chart: Object.values(groupedByCC).sort((a, b) => b.total - a.total)
        };
    }, [df_compromisos, selectedFilters]);

    // Tooltip original de Novedades
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const rowData = payload[0].payload;
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-50 pointer-events-none">
                    <p className="font-bold text-[14px] mb-2 text-white border-b border-white/10 pb-2">
                        {rowData.name}
                    </p>
                    <div className="flex justify-between items-center gap-6">
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider">Total Acumulado:</span>
                        <span className="font-bold text-white text-[13px]">{rowData.value}</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Tooltip para el BarChart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl z-50 pointer-events-none">
                    <p className="font-bold text-[14px] mb-2 text-white border-b border-white/10 pb-2">
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center gap-6 mt-1.5">
                            <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{backgroundColor: entry.color}}></span>
                                {entry.name}:
                            </span>
                            <span className="font-bold text-white text-[13px]">{entry.value}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-[#0b2241]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-6 text-slate-400 shadow-xl flex flex-col w-full max-w-[1200px] mx-auto mt-6">
            
            {/* --- 1. GRÁFICO DE DONA ORIGINAL (NOVEDADES) --- */}
            <div className="flex flex-col w-full h-[400px] mb-8">
                <h3 className="text-[13px] font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></div>
                    Distribución por Tipo de Novedad
                </h3>
                
                <div className="w-full flex-1 relative">
                    {chartData.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 uppercase text-xs font-bold tracking-widest">
                            Sin datos disponibles
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="35%" 
                                    outerRadius="95%" 
                                    paddingAngle={2}
                                    dataKey="value"
                                    labelLine={false} 
                                    label={renderCustomizedLabel} 
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={26} 
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* DIVISOR VISUAL */}
            <div className="w-full h-px bg-white/10 mb-8"></div>

            {/* --- 2. SECCIÓN DE TARJETAS (COMPROMISOS) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Tarjeta Acuerdos Vigentes */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500 opacity-20 blur-2xl"></div>
                    <h4 className="text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                        Acuerdos Vigentes
                    </h4>
                    <p className="text-3xl font-black text-white relative z-10">{compromisosData.totals.vigentes}</p>
                </div>

                {/* Tarjeta Acuerdos Vencidos */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-red-500/30 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_20px_rgba(239,68,68,0.15)]">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-red-500 opacity-20 blur-2xl"></div>
                    <h4 className="text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                        Acuerdos Vencidos
                    </h4>
                    <p className="text-3xl font-black text-white relative z-10">{compromisosData.totals.vencidos}</p>
                </div>

                {/* Tarjeta Acuerdos Totales */}
                <div className="bg-slate-900/50 backdrop-blur-md border border-blue-500/30 rounded-xl p-5 flex flex-col justify-center relative overflow-hidden shadow-[0_4px_20px_rgba(59,130,246,0.15)]">
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
                    <h4 className="text-[12px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                        Total Acuerdos
                    </h4>
                    <p className="text-3xl font-black text-white relative z-10">{compromisosData.totals.totales}</p>
                </div>
            </div>

            {/* --- 3. BAR CHART NUEVO (COMPROMISOS POR CALL CENTER) --- */}
            <div className="flex flex-col w-full h-[400px]">
                <h3 className="text-[13px] font-black text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                    Desglose de Compromisos por Call Center
                </h3>
                
                <div className="w-full flex-1 relative">
                    {compromisosData.chart.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 uppercase text-xs font-bold tracking-widest">
                            Sin datos de compromisos
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={compromisosData.chart} 
                                layout="vertical" 
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={true} vertical={false} />
                                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={45} />
                                <Tooltip cursor={{fill: '#ffffff05'}} content={<CustomBarTooltip />} />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={26} 
                                    iconType="circle" 
                                    wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                                />
                                <Bar dataKey="vigentes" name="Vigentes" stackId="a" fill="#10b981" barSize={22} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="vencidos" name="Vencidos" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="otros" name="Otros" stackId="a" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

        </div>
    );
}