import React from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { 
    FunnelChart, 
    Funnel, 
    Cell, 
    LabelList, 
    Tooltip, 
    ResponsiveContainer,
    // Nuevas importaciones para el gráfico de barras
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid 
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'];

export default function Mensajeria_Call({ data, efectividadMensajeria, isLoading }) {
    
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12 bg-[#0a192f] border border-[#1e293b] rounded-3xl">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="ml-3 text-slate-400 font-medium">Cargando métricas...</span>
            </div>
        );
    }

    // Procesamos la data de efectividad para que tenga el mismo formato de etiquetas
    const chartEfectividad = (efectividadMensajeria || []).map(item => {
        const pct = Number(item.porcentaje.toFixed(2));
        return {
            ...item,
            porcentaje: pct,
            // Etiqueta interna: "6.03% (12)"
            EtiquetaInterna: `${pct}% (${item.conversaciones})`,
            // Etiqueta externa: "199"
            EtiquetaExterna: item.entregados 
        };
    });

    if (!data || data.length === 0) {
        return (
            <div className="p-12 bg-[#0a192f] border border-[#1e293b] rounded-3xl text-center">
                <MessageSquare className="mx-auto mb-4 opacity-20 text-indigo-400" size={48} />
                <p className="text-slate-400">No hay datos de mensajería disponibles.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
            
            {/* 1. Gráfico de Embudo */}
            <div className="bg-[#0b2241]/80 backdrop-blur-xl border border-white/10 rounded-[24px] p-8 shadow-xl flex flex-col">
                <div className="mb-10">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-lg">
                            <MessageSquare className="text-indigo-400" size={20} />
                        </div>
                        Embudo de Gestión
                    </h3>
                </div>

                {/* Ajustamos la altura a 400px para que sea estético en fila */}
                <div className="h-[400px] w-full mt-auto">
                    <ResponsiveContainer width="100%" height="100%">
                        {/* Reduje los márgenes laterales de 180 a 80 para que respire mejor en la columna */}
                        <FunnelChart 
                            // Aumentamos el margen derecho (right) para dar aire a los textos largos
                            margin={{ top: 20, right: 120, left: 40, bottom: 20 }}
                        >
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#0f172a', 
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff' 
                            }} 
                        />
                        <Funnel data={data} dataKey="value" nameKey="name" isAnimationActive>
                            {data.map((entry, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]} 
                                    fillOpacity={0.85} 
                                    stroke="rgba(255, 255, 255, 0.2)"
                                />
                            ))}

                            {/* ETIQUETAS DE TEXTO (DERECHA) */}
                            <LabelList 
                                position="right" 
                                fill="#ffff" // Un gris más claro para que resalte sobre el fondo oscuro
                                dataKey="name" 
                                fontSize={15} 
                                fontWeight={500} 
                                offset={40} // Espacio entre el embudo y el texto
                            />

                            {/* NÚMEROS (CENTRO) */}
                            <LabelList 
                                position="center" 
                                fill="#fff" 
                                dataKey="value" 
                                formatter={(val) => val.toLocaleString()} 
                                fontWeight="bold" 
                                fontSize={16} // Un poco más pequeño para que no sature el bloque
                            />
                        </Funnel>
                    </FunnelChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Gráfico de Efectividad */}
            {chartEfectividad.length > 0 && (
                <div className="bg-[#0a192f] border border-[#1e293b] rounded-3xl p-8 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-10 flex items-center gap-3">
                         <div className="p-2 bg-violet-500/20 rounded-lg">
                            <div className="w-5 h-5 border-2 border-violet-400 rounded-sm" /> {/* Icono visual simple */}
                        </div>
                        Efectividad por Call Center
                    </h3>
                    
                    {/* Igualamos la altura a 400px para simetría visual */}
                    <div className="h-[400px] w-full mt-auto">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={chartEfectividad} 
                                layout="vertical" 
                                margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    stroke="#94a3b8" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={100}
                                />
                                <Tooltip
                                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                                    formatter={(value, name, props) => {
                                        if (name === 'porcentaje') {
                                            return [`${value}% \n(Entregados: ${props.payload.entregados})`, 'Efectividad'];
                                        }
                                        return [value, name];
                                    }}
                                />
                                <Bar 
                                    dataKey="porcentaje" 
                                    fill="#8b5cf6" 
                                    radius={[0, 4, 4, 0]} 
                                    maxBarSize={40}
                                >
                                    <LabelList 
                                        dataKey="EtiquetaInterna" 
                                        position="insideLeft" 
                                        fill="#ffffff" 
                                        fontSize={12}
                                        fontWeight="bold"
                                        offset={10}
                                    />
                                    <LabelList 
                                        dataKey="EtiquetaExterna" 
                                        position="right" 
                                        fill="#e2e8f0" 
                                        fontSize={12}
                                        fontWeight="bold"
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}