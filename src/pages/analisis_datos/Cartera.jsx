import React, { useMemo, useState } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, Label 
} from 'recharts';
import { ArrowLeftCircle } from 'lucide-react';
// Única importación permitida: Colores
import { COLOR_MAP, DEFAULT_COLORS } from './DashboardComponents';

// --- COMPONENTES DE INTERFAZ LOCALES ---
const ChartCard = ({ title, children, action }) => (
    <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-tighter">{title}</h3>
            {action}
        </div>
        <div className="flex-1 min-h-[350px]">{children}</div>
    </div>
);

const BackBtn = ({ onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 transition-colors">
        <ArrowLeftCircle size={18} />
        <span className="text-[10px] font-bold uppercase">General</span>
    </button>
);

export default function Cartera({ data, selectedFilters }) {
    const [focusedNode, setFocusedNode] = useState(null);

    // --- PROCESAMIENTO DE DATOS ---
    const applyFilters = (dataSet) => {
        if (!Array.isArray(dataSet)) return [];
        return dataSet.filter(item => 
            Object.entries(selectedFilters).every(([key, values]) => {
                if (!values || !Array.isArray(values) || values.length === 0) return true;
                return values.includes(item[key]);
            })
        );
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
        return { data: Object.values(map), keys: Array.from(keysSet) };
    };

    const buildSunburstData = (list, level1Key, level2Key, valKey) => {
        const filtered = applyFilters(list || []);
        const rootMap = {};
        filtered.forEach(d => {
            const l1 = d[level1Key] || 'OTROS';
            const l2 = d[level2Key] || 'N/A';
            const val = Number(d[valKey] || 1);
            if (!rootMap[l1]) rootMap[l1] = { name: l1, value: 0, children: {} };
            rootMap[l1].value += val;
            rootMap[l1].children[l2] = (rootMap[l1].children[l2] || 0) + val;
        });

        const level1 = Object.values(rootMap).map(node => ({ 
            name: node.name, 
            value: node.value,
            children: Object.entries(node.children).map(([name, value]) => ({ 
                name, value, parentName: node.name 
            }))
        }));
        
        const level2 = level1.flatMap(p => p.children);
        return { level1, level2 };
    };

    const charts = useMemo(() => {
        if (!data) return null;
        return {
            regional: processGeneric(data?.cubo_regional, 'Regional_Venta', 'Franja_Meta', 'count'),
            cobro: processGeneric(data?.cubo_cobro, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
            desembolsos: processGeneric(data?.cubo_desembolso, 'Año_Desembolso', 'Franja_Meta', 'Valor_Desembolso'),
            vigencia: buildSunburstData(data?.cubo_vigencia, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
        };
    }, [data, selectedFilters]);

    // --- GRÁFICOS LOCALES ---
    const LocalStackedBar = ({ data, keys, isCurrency }) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -10, bottom: 40, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{fontSize: 8, fontWeight: 800, fill: '#94a3b8'}} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{fontSize: 9, fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={v => isCurrency ? `$${(v/1e6).toFixed(0)}M` : v} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{fontSize: '9px', fontWeight: '800', paddingBottom: '10px'}} />
                {keys.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={COLOR_MAP[k.toUpperCase()] || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} radius={[2, 2, 0, 0]} />)}
            </BarChart>
        </ResponsiveContainer>
    );

    const MultiLevelSunburst = ({ sunburstData }) => {
        const displayL1 = focusedNode ? [focusedNode] : sunburstData.level1;
        const displayL2 = focusedNode ? focusedNode.children : sunburstData.level2;

        const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent }) => {
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
            
            // Umbral para no mostrar texto en tajadas minúsculas
            if (percent < 0.04) return null;

            return (
                <text 
                    x={x} y={y} 
                    fill="white" 
                    textAnchor="middle" 
                    dominantBaseline="central" 
                    className="text-[7px] font-black uppercase pointer-events-none tracking-tighter"
                    style={{ textShadow: '0px 1px 3px rgba(0,0,0,0.6)' }} // Mejora contraste en cualquier color
                >
                    <tspan x={x} dy="-0.4em">{name.length > 12 ? `${name.substring(0, 10)}..` : name}</tspan>
                    <tspan x={x} dy="1.2em" className="fill-white/90">{(percent * 100).toFixed(0)}%</tspan>
                </text>
            );
        };

        return (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={displayL1} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={focusedNode ? 0 : 65} outerRadius={100} paddingAngle={focusedNode ? 0 : 2}
                        label={renderLabel} labelLine={false} stroke="#fff" strokeWidth={2}
                        onClick={(e) => !focusedNode && setFocusedNode(e)}
                    >
                        {displayL1.map((entry, index) => (
                            <Cell key={index} fill={COLOR_MAP[entry.name.toUpperCase()] || DEFAULT_COLORS[index % 10]} className="cursor-pointer outline-none hover:opacity-90" />
                        ))}
                        {!focusedNode && <Label position="center" content={() => <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-slate-400 text-[10px] font-black uppercase tracking-widest">Cartera</text>} />}
                    </Pie>
                    <Pie
                        data={displayL2} dataKey="value" nameKey="name" cx="50%" cy="50%"
                        innerRadius={105} outerRadius={focusedNode ? 145 : 135} paddingAngle={1}
                        label={renderLabel} labelLine={false} stroke="#fff" strokeWidth={1}
                    >
                        {displayL2.map((entry, index) => (
                            <Cell key={index} fill={COLOR_MAP[entry.parentName.toUpperCase()] || DEFAULT_COLORS[index % 10]} opacity={focusedNode ? 0.9 : 0.6} />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    if (!charts) return null;

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in duration-500">
            <ChartCard title="Regional"><LocalStackedBar data={charts.regional.data} keys={charts.regional.keys} /></ChartCard>
            <ChartCard title="Cobro"><LocalStackedBar data={charts.cobro.data} keys={charts.cobro.keys} /></ChartCard>
            <ChartCard title="Desembolsos"><LocalStackedBar data={charts.desembolsos.data} keys={charts.desembolsos.keys} isCurrency/></ChartCard>
            <ChartCard 
                title={focusedNode ? `Vigencia: ${focusedNode.name}` : "Vigencia de Cartera"} 
                action={focusedNode && <BackBtn onClick={() => setFocusedNode(null)} />}
            >
                <MultiLevelSunburst sunburstData={charts.vigencia} />
            </ChartCard>
        </div>
    );
}