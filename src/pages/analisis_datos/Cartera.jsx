import React, { useMemo, useState, useCallback } from 'react';
import { 
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, LabelList 
} from 'recharts';
import { Layers } from 'lucide-react';

import { getSafeColor, CustomBarLabel, TotalTopLabel } from './DashboardComponents';

// --- COMPONENTES DE INTERFAZ (Optimizados con React.memo) ---
const EmptyStateFallback = React.memo(() => (
    <div className="flex flex-col items-center justify-center h-full w-full opacity-60">
        <Layers size={40} className="text-slate-500 mb-3" strokeWidth={1.5} />
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sin datos</p>
        <p className="text-[10px] text-slate-400 mt-1">Los filtros aplicados no arrojaron resultados</p>
    </div>
));

const ChartCard = React.memo(({ title, subtitle, children, isEmpty }) => (
    <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-4 sm:p-6 flex flex-col h-full transition-all duration-300 hover:shadow-[0_10px_35px_rgba(34,211,238,0.1)] hover:border-cyan-500/30 relative group overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none transition-opacity group-hover:bg-cyan-500/20"></div>
        
        <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <h3 className="text-[12px] sm:text-[13px] font-black text-white uppercase tracking-tight">{title}</h3>
                </div>
                {subtitle && <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 pl-4">{subtitle}</p>}
            </div>
        </div>
        <div className="flex-1 min-h-[350px] sm:min-h-[400px] relative z-10">
            {isEmpty ? <EmptyStateFallback /> : children}
        </div>
    </div>
));

// --- ETIQUETA VERTICAL PARA EL EJE X (Optimizada) ---
const CustomVerticalTick = React.memo(({ x, y, payload }) => (
    <g transform={`translate(${x},${y})`}>
        <text 
            x={0} 
            y={0} 
            dy={10} 
            textAnchor="end" 
            fill="#e2e8f0" 
            fontSize={9}
            fontWeight="600"
            transform="rotate(-90)" 
        >
            {payload.value}
        </text>
    </g>
));

// --- GRÁFICOS LOCALES ---
const LocalStackedBar = React.memo(({ data, keys, isCurrency }) => {
    // Funciones formateadoras estables
    const yAxisFormatter = useCallback((v) => isCurrency ? `$${(v/1000000).toFixed(0)}M` : v, [isCurrency]);
    const tooltipFormatter = useCallback((val) => isCurrency ? `$${val.toLocaleString()}` : val.toLocaleString(), [isCurrency]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ left: -15, bottom: 80, right: 10, top: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                
                <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    height={100} 
                    interval={0} 
                    tick={<CustomVerticalTick />} 
                />
                
                <YAxis 
                    tick={{fontSize: 9, fill: '#94a3b8', fontWeight: 600}} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={yAxisFormatter} 
                />
                
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', padding: '14px 18px' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 600, padding: '3px 0', color: '#f8fafc' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}
                    formatter={tooltipFormatter}
                />
                
                <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{fontSize: '10px', fontWeight: '700', color: '#cbd5e1', paddingBottom: '20px'}} />
                
                {keys.map((k) => (
                    <Bar key={k} dataKey={k} stackId="a" fill={getSafeColor(k)} barSize={38} stroke="#1e293b" strokeWidth={1.5}>
                        <LabelList dataKey={k} content={<CustomBarLabel isCurrency={isCurrency} />} />
                    </Bar>
                ))}

                <Line dataKey="total" stroke="transparent" strokeWidth={0} dot={false} activeDot={false} isAnimationActive={false}>
                    <LabelList dataKey="total" content={<TotalTopLabel isCurrency={isCurrency} />} />
                </Line>
            </ComposedChart>
        </ResponsiveContainer>
    );
});

// --- PALETA DE COLORES EXACTA ---
const getSunburstColor = (name, parentName, isLevel1) => {
    const target = isLevel1 ? String(name).toUpperCase() : String(parentName).toUpperCase();
    if (target.includes('EXPIRADA')) return isLevel1 ? '#FF7272' : '#BE6161'; 
    if (target.includes('VIGENTES')) return isLevel1 ? '#98F598' : '#77BC77'; 
    if (target.includes('ANTICIPADO')) return isLevel1 ? '#C0E0F0' : '#92A8B2'; 
    return isLevel1 ? '#cbd5e1' : '#94a3b8';
};

// --- ETIQUETA INTELIGENTE SUNBURST (Extraída para optimización) ---
const renderSmartLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, payload } = props;
    
    if (typeof cx !== 'number' || typeof cy !== 'number' || !payload.globalTotal) return null;
    
    const { value: realValue, name, parentValue, globalTotal } = payload;
    const isLevel2 = !!parentValue;
    const sliceAngle = Math.abs(startAngle - endAngle);
    
    if (sliceAngle < 1.5) return null; 

    const percent = isLevel2 ? (realValue / parentValue) * 100 : (realValue / globalTotal) * 100;

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    let angle = -midAngle;
    let normalizedAngle = ((angle % 360) + 360) % 360; 
    if (normalizedAngle > 90 && normalizedAngle < 270) {
        angle += 180;
    }

    const arcSpace = radius * (sliceAngle * RADIAN);
    
    let fontSizeText = isLevel2 ? 10 : 11;
    let fontSizePct = isLevel2 ? 9 : 10;
    
    if (arcSpace < 35) {
        fontSizeText = Math.max(4.5, arcSpace / 2.8); 
        fontSizePct = Math.max(4, arcSpace / 3.2);
    }

    const nameStr = String(name);
    const lines = (nameStr.length > 12 && nameStr.includes(' ') && !isLevel2) 
        ? nameStr.split(' ') 
        : [nameStr.length > 18 ? nameStr.substring(0, 16) + '...' : nameStr];

    return (
        <g transform={`translate(${x},${y})`} className="pointer-events-none">
            <text
                transform={`rotate(${angle})`} textAnchor="middle" dominantBaseline="central"
                style={{ fontWeight: 600, fontFamily: 'sans-serif' }} fill="#111827"
            >
                {lines.map((line, i) => (
                    <tspan 
                        x="0" dy={i === 0 ? (lines.length > 1 ? "-0.8em" : "-0.5em") : "1.1em"} 
                        key={i} style={{ fontSize: `${fontSizeText}px` }}
                    >
                        {line}
                    </tspan>
                ))}
                <tspan 
                    x="0" dy="1.4em" 
                    style={{ fontSize: `${fontSizePct}px`, fontWeight: 400, fill: "#374151" }}
                >
                    {Math.round(percent)}%
                </tspan>
            </text>
        </g>
    );
};

// --- TOOLTIP SUNBURST (Extraído para optimización) ---
const SunburstTooltip = React.memo(({ active, payload, focusedNode }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isLevel2 = !!data.parentName;
        const percentage = isLevel2 ? ((data.value / data.parentValue) * 100).toFixed(1) : ((data.value / data.globalTotal) * 100).toFixed(1);

        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl text-white z-50 pointer-events-none">
                <p className="font-bold text-[12px] mb-2 uppercase tracking-wide border-b border-white/10 pb-2">{data.name}</p>
                <div className="flex justify-between items-center gap-4 mb-1.5">
                    <span className="text-[11px] text-slate-400">Volumen Real:</span>
                    <span className="font-semibold text-white text-[12px]">{data.value.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                    <span className="text-[11px] text-slate-400">{isLevel2 ? `vs Padre (${data.parentName}):` : 'Total Global:'}</span>
                    <span className="font-bold text-[#a7f3d0] text-[12px]">{percentage}%</span>
                </div>
                <div className="mt-3 pt-2 border-t border-white/5 text-center">
                    <p className="text-[9px] text-indigo-300/70 italic">{focusedNode ? 'Clic para alejar' : 'Clic para hacer Zoom'}</p>
                </div>
            </div>
        );
    }
    return null;
});

// --- SUNBURST PRINCIPAL ---
const InteractiveSunburst = React.memo(({ level1, level2, focusedNode, onNodeClick }) => {
    const displayL1 = useMemo(() => focusedNode ? level1.filter(n => n.name === focusedNode.name) : level1, [level1, focusedNode]);
    const displayL2 = useMemo(() => focusedNode ? level2.filter(n => n.parentName === focusedNode.name) : level2, [level2, focusedNode]);

    // Uso de renderProp estable para el tooltip para pasar el estado actual
    const renderTooltip = useCallback((props) => <SunburstTooltip {...props} focusedNode={focusedNode} />, [focusedNode]);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={displayL1} dataKey="visualValue" nameKey="name" cx="50%" cy="50%" 
                    innerRadius="0%" outerRadius={focusedNode ? "50%" : "48%"}
                    onClick={onNodeClick} className="cursor-pointer outline-none" 
                    stroke="#1e293b" strokeWidth={1.2} 
                    label={renderSmartLabel} labelLine={false}
                    startAngle={180} endAngle={-180}
                    minAngle={2}
                    isAnimationActive={true} animationDuration={600} 
                >
                    {displayL1.map((entry, index) => (
                        <Cell key={`l1-${index}`} fill={getSunburstColor(entry.name, null, true)} opacity={focusedNode ? 0.6 : 1} />
                    ))}
                </Pie>
                <Pie
                    data={displayL2} dataKey="visualValue" nameKey="name" cx="50%" cy="50%" 
                    innerRadius={focusedNode ? "50%" : "48%"} outerRadius={focusedNode ? "95%" : "88%"}
                    stroke="#1e293b" strokeWidth={1.2} className="outline-none"
                    label={renderSmartLabel} labelLine={false}
                    onClick={onNodeClick} 
                    startAngle={180} endAngle={-180}
                    minAngle={2} 
                    isAnimationActive={true} animationDuration={600}
                >
                    {displayL2.map((entry, index) => (
                        <Cell key={`l2-${index}`} fill={getSunburstColor(entry.name, entry.parentName, false)} className="hover:opacity-80 transition-opacity cursor-pointer"/>
                    ))}
                </Pie>
                <Tooltip content={renderTooltip} />
            </PieChart>
        </ResponsiveContainer>
    );
});

export default function Cartera({ data, selectedFilters }) {
    const [focusedNode, setFocusedNode] = useState(null);

    const activeFilters = useMemo(() => {
        if (!selectedFilters) return [];
        return Object.entries(selectedFilters).filter(([_, values]) => values && Array.isArray(values) && values.length > 0);
    }, [selectedFilters]);

    const applyFilters = useCallback((dataSet) => {
        if (!Array.isArray(dataSet)) return [];
        if (activeFilters.length === 0) return dataSet;
        return dataSet.filter(item => activeFilters.every(([key, values]) => values.includes(item[key])));
    }, [activeFilters]);

    const processGeneric = useCallback((list, xKey, stackKey, valKey) => {
        const filtered = applyFilters(Array.isArray(list) ? list : (list?.grouped || []));
        if (filtered.length === 0) return { data: [], keys: [] };

        const map = new Map();
        const keyTotals = new Map();
        
        for (const d of filtered) {
            const xVal = d[xKey] || 'N/A';
            const sKey = String(d[stackKey] || 'OTROS').toUpperCase().replace(/\s+/g, ' ').trim();
            let val = Number(d[valKey] !== undefined ? d[valKey] : (d['count'] !== undefined ? d['count'] : 1)) || 0;
            
            if (!map.has(xVal)) map.set(xVal, { name: xVal });
            const current = map.get(xVal);
            current[sKey] = (current[sKey] || 0) + val;
            keyTotals.set(sKey, (keyTotals.get(sKey) || 0) + val);
        }

        const sortedKeys = Array.from(keyTotals.entries()).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
        const dataArray = Array.from(map.values());
        
        dataArray.forEach(d => {
            d.total = sortedKeys.reduce((acc, k) => acc + (Number(d[k]) || 0), 0);
        });
        
        dataArray.sort((a, b) => b.total - a.total);
        return { data: dataArray, keys: sortedKeys };
    }, [applyFilters]);

    const buildSunburstData = useCallback((list, level1Key, level2Key, valKey) => {
        const filtered = applyFilters(list || []);
        if (filtered.length === 0) return { level1: [], level2: [] };

        const rootMap = new Map();
        let globalTotal = 0; 

        for (const d of filtered) {
            const l1Raw = String(d[level1Key] || 'OTROS').toUpperCase().trim();
            let l1 = l1Raw;
            if (l1Raw.includes('EXPIRADA')) l1 = 'VIGENCIA EXPIRADA';
            else if (l1Raw.includes('VIGENT')) l1 = 'VIGENTES';
            else if (l1Raw.includes('ANTICIPA')) l1 = 'ANTICIPADO';

            const l2 = String(d[level2Key] || 'N/A').trim();
            let val = Number(d[valKey] !== undefined ? d[valKey] : 1) || 0;
            globalTotal += val;

            if (!rootMap.has(l1)) rootMap.set(l1, { name: l1, value: 0, children: new Map() });
            const l1Node = rootMap.get(l1);
            l1Node.value += val;
            
            let displayL2 = l2;
            if (l1 === 'VIGENCIA EXPIRADA' || l1 === 'ANTICIPADO') {
                displayL2 = l2 && l2 !== 'N/A' ? l2 : '100%';
            }
            l1Node.children.set(displayL2, (l1Node.children.get(displayL2) || 0) + val);
        }

        const level1 = [];
        const rawLevel2 = [];

        for (const [_, node] of rootMap) {
            let visualTotalForParent = 0;
            const childrenOfNode = [];

            for (const [childName, childValue] of node.children.entries()) {
                
                let visualSize = childValue;
                if (childValue > 0) {
                    const minSize = globalTotal * 0.035; 
                    visualSize = Math.max(childValue, minSize);
                }

                visualTotalForParent += visualSize;

                childrenOfNode.push({
                    name: childName, 
                    value: childValue, 
                    visualValue: visualSize, 
                    parentName: node.name, 
                    parentValue: node.value, 
                    globalTotal
                });
            }

            childrenOfNode.sort((a, b) => b.value - a.value);
            rawLevel2.push(...childrenOfNode);

            level1.push({ 
                name: node.name, 
                value: node.value, 
                visualValue: visualTotalForParent, 
                globalTotal 
            });
        }
        
        level1.sort((a, b) => b.value - a.value);
        
        const finalLevel2 = [];
        for (const l1Node of level1) {
            const childrenMatchingParent = rawLevel2.filter(child => child.parentName === l1Node.name);
            finalLevel2.push(...childrenMatchingParent);
        }
        
        return { level1, level2: finalLevel2 };
    }, [applyFilters]);

    const charts = useMemo(() => {
        if (!data) return null;
        try {
            return {
                regional: processGeneric(data?.cubo_regional, 'Regional_Venta', 'Franja_Meta', 'count'),
                cobro: processGeneric(data?.cubo_cobro, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
                desembolsos: processGeneric(data?.cubo_desembolso, 'Año_Desembolso', 'Franja_Meta', 'Valor_Desembolso'),
                vigencia: buildSunburstData(data?.cubo_vigencia, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
            };
        } catch (error) {
            console.error("Error procesando gráficos:", error);
            return null;
        }
    }, [data, processGeneric, buildSunburstData]);

    const handleNodeClick = useCallback((nodeData) => {
        const targetName = nodeData.parentName || nodeData.name;
        setFocusedNode(prev => prev?.name === targetName ? null : { name: targetName });
    }, []);

    // Uso de useMemo para prevenir que la estructura de la grilla principal re-evalúe los hijos 
    // si los gráficos y el focusedNode no han cambiado.
    const renderCharts = useMemo(() => {
        if (!charts) return <EmptyStateFallback />;
        
        return (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <ChartCard title="Regional" subtitle="Distribución por puntos de venta" isEmpty={!charts.regional.data || charts.regional.data.length === 0}>
                    <LocalStackedBar data={charts.regional.data} keys={charts.regional.keys} />
                </ChartCard>
                
                <ChartCard title="Cobro" subtitle="Estado de metas de cobranza" isEmpty={!charts.cobro.data || charts.cobro.data.length === 0}>
                    <LocalStackedBar data={charts.cobro.data} keys={charts.cobro.keys} />
                </ChartCard>
                
                <ChartCard title="Desembolsos" subtitle="Ordenado de mayor a menor volumen" isEmpty={!charts.desembolsos.data || charts.desembolsos.data.length === 0}>
                    <LocalStackedBar data={charts.desembolsos.data} keys={charts.desembolsos.keys} isCurrency/>
                </ChartCard>
                
                <ChartCard 
                    title="Vigencia de Cartera" 
                    subtitle={focusedNode ? `Nivel Enfocado: ${focusedNode.name}` : "Distribución de Cuotas por Estado de Vigencia"}
                    isEmpty={!charts.vigencia.level1 || charts.vigencia.level1.length === 0}
                >
                    <InteractiveSunburst 
                        level1={charts.vigencia.level1} 
                        level2={charts.vigencia.level2} 
                        focusedNode={focusedNode}
                        onNodeClick={handleNodeClick}
                    />
                </ChartCard>
            </div>
        );
    }, [charts, focusedNode, handleNodeClick]);

    return renderCharts;
}