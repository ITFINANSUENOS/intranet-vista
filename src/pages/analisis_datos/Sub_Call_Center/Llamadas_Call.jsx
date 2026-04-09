import React from 'react';
import { Phone, PhoneIncoming, PhoneMissed, Loader2 } from 'lucide-react';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    LabelList, AreaChart, 
    Area, 
    ReferenceLine 
} from 'recharts';

export default function Llamadas_Call({ stats, graficoData, efectividadData, evolucionData, isLoading, apiClient, jobId }) {
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 bg-[#0a192f] border border-[#1e293b] rounded-3xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="ml-3 text-slate-400">Cargando estadísticas...</span>
            </div>
        );
    }

    const total = stats?.total_llamadas || 0;
    const conRespuesta = stats?.con_respuesta || 0;
    const sinRespuesta = stats?.sin_respuesta || 0;

    // Extraemos la data del gráfico desde la nueva prop (o de stats como respaldo)
    const chartData = graficoData || stats?.df_grafico_llamadas || [];

    const chartEfectividad = (efectividadData || []).map(item => {
        const porcentaje = Number((item.Efectividad * 100).toFixed(2));
        return {
            ...item,
            EfectividadPct: porcentaje,
            // Etiqueta que irá dentro de la barra: "24.32% (81)"
            EtiquetaInterna: `${porcentaje}% (${item.Con_Respuesta})`,
            // Etiqueta que irá fuera de la barra: "333"
            EtiquetaExterna: item.Total_Intentos 
        };
    });

    const [visibleSeries, setVisibleSeries] = React.useState({
    conRespuesta: true,
    sinRespuesta: true
});

// 2. Procesamos la data para cortar líneas en el último dato válido
const chartEvolucion = React.useMemo(() => {
    if (!evolucionData || evolucionData.length === 0) return [];
    
    // Agrupar datos por fecha
    const grouped = evolucionData.reduce((acc, curr) => {
        const { Fecha, Estado_Respuesta, Total_Llamadas } = curr;
        if (!acc[Fecha]) acc[Fecha] = { Fecha, conRespuesta: null, sinRespuesta: null };
        
        const valor = Total_Llamadas > 0 ? Total_Llamadas : null;
        if (Estado_Respuesta === 'CON RESPUESTA') acc[Fecha].conRespuesta = valor;
        else acc[Fecha].sinRespuesta = valor;
        return acc;
    }, {});

    const result = Object.values(grouped).sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));

    // Lógica para no mostrar ceros/caídas al final si no hay datos
    // Buscamos el último índice que tenga algún valor real
    let lastValidIndex = -1;
    result.forEach((item, index) => {
        if (item.conRespuesta !== null || item.sinRespuesta !== null) {
            lastValidIndex = index;
        }
    });

    // Retornamos solo hasta el último día con datos
    return lastValidIndex !== -1 ? result.slice(0, lastValidIndex + 1) : [];
}, [evolucionData]);

    return (
       <div className="animate-in slide-in-from-bottom-4 duration-500 mb-20">
            
            {/* Contenedor de las Tarjetas Superiores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-8">
                
                {/* Etiqueta: Total Llamadas */}
                <div className="bg-[#0a192f] border border-[#1e293b] p-8 rounded-3xl hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-black/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col gap-2">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider m-0">Total Llamadas</p>
                            <h3 className="text-4xl font-bold text-white tracking-tight m-0">
                                {total.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Phone className="text-blue-400 w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Etiqueta: Con Respuesta */}
                <div className="bg-[#0a192f] border border-[#1e293b] p-8 rounded-3xl hover:border-emerald-500/50 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-black/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col gap-2">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider m-0">Con Respuesta</p>
                            <h3 className="text-4xl font-bold text-white tracking-tight m-0">
                                {conRespuesta.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                            <PhoneIncoming className="text-emerald-400 w-7 h-7" />
                        </div>
                    </div>
                </div>

                {/* Etiqueta: Sin Respuesta */}
                <div className="bg-[#0a192f] border border-[#1e293b] p-8 rounded-3xl hover:border-rose-500/50 transition-all duration-300 relative overflow-hidden group shadow-lg shadow-black/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col gap-2">
                            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider m-0">Sin Respuesta</p>
                            <h3 className="text-4xl font-bold text-white tracking-tight m-0">
                                {sinRespuesta.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                            <PhoneMissed className="text-rose-400 w-7 h-7" />
                        </div>
                    </div>
                </div>

            </div>
            
            {/* Contenedor del Gráfico de Barras */}
            {chartData && chartData.length > 0 && (
                <div className="bg-[#0a192f] border border-[#1e293b] p-8 rounded-3xl shadow-lg shadow-black/20">
                    <h3 className="text-xl font-semibold text-white mb-6">Proporción de Llamadas</h3>
                    
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
                            >
                                {/* Cuadrícula de fondo discreta */}
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                
                                {/* Eje X (Tipos) */}
                                <XAxis 
                                    dataKey="Tipo" 
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                
                                {/* Eje Y (Cantidades) */}
                                <YAxis 
                                    tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    label={{ 
                                        value: 'Cantidad de Llamadas', 
                                        angle: -90, 
                                        position: 'insideLeft', 
                                        fill: '#94a3b8',
                                        style: { textAnchor: 'middle' }
                                    }}
                                />
                                
                                {/* Tooltip al pasar el mouse */}
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                    contentStyle={{ 
                                        backgroundColor: '#0f172a', 
                                        border: '1px solid #1e293b',
                                        borderRadius: '0.5rem',
                                        color: '#fff'
                                    }}
                                />
                                
                                {/* Las barras del gráfico */}
                                <Bar 
                                    dataKey="Cantidad" 
                                    fill="#004A99" /* Azul oscuro de tu imagen */
                                    radius={[4, 4, 0, 0]} 
                                    maxBarSize={120} 
                                >
                                    {/* Etiquetas numéricas sobre las barras */}
                                    <LabelList 
                                        dataKey="Cantidad" 
                                        position="top" 
                                        fill="#cbd5e1" 
                                        fontSize={14}
                                        fontWeight="bold"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}


            {chartEfectividad.length > 0 && (
                <div className="bg-[#0a192f] border border-[#1e293b] rounded-3xl p-6 mt-8">
                    <h3 className="text-xl font-bold text-white mb-6">Efectividad por Call Center</h3>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={chartEfectividad} 
                                layout="vertical" // <-- Clave para que sea horizontal
                                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                
                                {/* Eje X oculto pero necesario para la escala */}
                                <XAxis type="number" hide />
                                
                                {/* Eje Y muestra los nombres (ej. CL6) */}
                                <YAxis 
                                    dataKey="Call_Center" 
                                    type="category" 
                                    stroke="#94a3b8" 
                                    axisLine={false} 
                                    tickLine={false} 
                                />
                                
                                
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                    formatter={(value, name, props) => {
                                        if (name === 'EfectividadPct') {
                                            return [`${value}% \n(Intentos: ${props.payload.Total_Intentos})`, 'Efectividad'];
                                        }
                                        return [value, name];
                                    }}
                                />
                                
                                <Bar 
                                    dataKey="EfectividadPct" 
                                    fill="#0284c7" 
                                    radius={[0, 4, 4, 0]} 
                                    maxBarSize={40}
                                >
                                    {/* Etiqueta dentro de la barra (Porcentaje y Con_Respuesta) */}
                                    <LabelList 
                                        dataKey="EtiquetaInterna" 
                                        position="insideLeft" // o "insideRight" según prefieras la alineación
                                        fill="#ffffff" 
                                        fontSize={13}
                                        fontWeight="bold"
                                        offset={10}
                                    />
                                    {/* Etiqueta fuera de la barra (Total_Intentos) */}
                                    <LabelList 
                                        dataKey="EtiquetaExterna" 
                                        position="right" 
                                        fill="#e2e8f0" 
                                        fontSize={13}
                                        fontWeight="bold"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

           {chartEvolucion.length > 0 && (
    <div className="mt-12 bg-[#0a192f] border border-[#1e293b] p-8 rounded-[32px] shadow-2xl">
        
        {/* Cabecera idéntica */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Evolución Diaria</h3>
                <p className="text-slate-400 text-sm mt-1">Comparativa de efectividad por jornada</p>
            </div>

            <div className="flex items-center gap-3 bg-[#0f172a] p-1.5 rounded-2xl border border-[#1e293b]">
                <button 
                    onClick={() => setVisibleSeries(prev => ({ ...prev, conRespuesta: !prev.conRespuesta }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${visibleSeries.conRespuesta ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400' : 'text-slate-500 opacity-50'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${visibleSeries.conRespuesta ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">Con Respuesta</span>
                </button>
                <button 
                    onClick={() => setVisibleSeries(prev => ({ ...prev, sinRespuesta: !prev.sinRespuesta }))}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${visibleSeries.sinRespuesta ? 'bg-blue-500/10 border border-blue-500/50 text-blue-400' : 'text-slate-500 opacity-50'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${visibleSeries.sinRespuesta ? 'bg-blue-500' : 'bg-slate-500'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">Sin Respuesta</span>
                </button>
            </div>
        </div>

        <div className="h-[480px] w-full"> {/* Aumentamos ligeramente la altura */}
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                    data={chartEvolucion} 
                    margin={{ top: 40, right: 30, left: 10, bottom: 60 }} // Más margen inferior para las fechas rotadas
                >
                    <defs>
                        <linearGradient id="gradCon" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradSin" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
                    
                    <XAxis 
                        dataKey="Fecha" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 11 }}
                        interval={0} // Obliga a mostrar todas las fechas
                        angle={-45}  // Rota las fechas para que no se toquen
                        textAnchor="end"
                        height={70}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    />
                    
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        domain={[0, 'dataMax + 100']} // Da espacio arriba para que las etiquetas no se corten
                    />
                    
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px' }}
                    />

                    {/* Línea Sin Respuesta (Azul) */}
                    {visibleSeries.sinRespuesta && (
                        <Area 
                            type="monotone" 
                            dataKey="sinRespuesta" 
                            stroke="#3b82f6" 
                            strokeWidth={3} 
                            fill="url(#gradSin)" 
                            connectNulls={false}
                            dot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: '#0a192f' }}
                        >
                            <LabelList 
                                dataKey="sinRespuesta" 
                                position="top" 
                                offset={20} // Desplazamiento mayor para no chocar con la otra línea
                                fill="#60a5fa" 
                                fontSize={11} 
                                fontWeight="bold" 
                            />
                        </Area>
                    )}

                    {/* Línea Con Respuesta (Verde) */}
                    {visibleSeries.conRespuesta && (
                        <Area 
                            type="monotone" 
                            dataKey="conRespuesta" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            fill="url(#gradCon)" 
                            connectNulls={false}
                            dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#0a192f' }}
                        >
                            <LabelList 
                                dataKey="conRespuesta" 
                                position="top" 
                                offset={8} // Desplazamiento menor
                                fill="#34d399" 
                                fontSize={11} 
                                fontWeight="bold" 
                            />
                        </Area>
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    </div>
)}

        </div>
    );
}