import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, ComposedChart, Line,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { 
    Search, Filter, ChevronDown, ChevronUp, Columns, ChevronLeft, ChevronRight, Layers, Download 
} from 'lucide-react';

import { getSafeColor } from './DashboardComponents';

// ─── PALETA DE COLORES ────────────────────────────────────────────────────────
const MAPA_COLORES_IMAGEN = {
    'VIGENCIA EXPIRADA': '#ff7e79',
    'EXPIRADA':          '#ff7e79',
    '100%':              '#cf6a66',
    'SIN PAGO':          '#ff7e79',
    'VIGENTES':          '#a2f3a2',
    'DIAS 21+':          '#82c482',
    'DIAS 11-20':        '#72b072',
    'DIAS 1-10':         '#94b394',
    'CON PAGO':          '#a2f3a2',
    'ANTICIPADO':        '#d1e9f5',
    'PAGO':              '#a2f3a2',
    'DEFAULT_GREY':      '#a0aec0'
};

const EMPTY_NAMES = new Set(['SIN ASIGNAR', 'SIN DATO', 'N/A', 'NULL', '']);

const getChartColor = (name, _parentName = null) => {
    const upperName = String(name || '').toUpperCase().trim();
    if (EMPTY_NAMES.has(upperName)) return '#475569';
    if (MAPA_COLORES_IMAGEN[upperName]) return MAPA_COLORES_IMAGEN[upperName];
    return getSafeColor(upperName);
};

const HIDDEN_NAMES = new Set(['SIN ASIGNAR', 'SIN GESTIÓN', 'SIN GESTION', 'N/A']);

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

const EmptyStateFallback = React.memo(() => (
    <div className="flex flex-col items-center justify-center h-full w-full opacity-60">
        <Layers size={40} className="text-slate-400 mb-3" strokeWidth={1.5} />
        <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Sin datos</p>
    </div>
));
EmptyStateFallback.displayName = 'EmptyStateFallback';

const ChartCard = React.memo(({ title, subtitle, children, isEmpty, action }) => (
    <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.4)] p-4 sm:p-6 flex flex-col h-full transition-all duration-300 hover:shadow-[0_10px_35px_rgba(34,211,235,0.15)] group min-h-[450px]">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-[13px] font-black text-white tracking-wider uppercase mb-1 drop-shadow-md">{title}</h3>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
            </div>
            {action && <div className="z-10">{action}</div>}
        </div>
        <div className="flex-1 w-full relative">
            {isEmpty ? <EmptyStateFallback /> : children}
        </div>
    </div>
));
ChartCard.displayName = 'ChartCard';

// ─── GRÁFICO DONA MULTINIVEL ──────────────────────────────────────────────────

const InteractiveSunburstPlotly = React.memo(({ data, focusedNode, setFocusedNode }) => {
    const displayL1 = useMemo(() => {
        const base = focusedNode ? [focusedNode] : (data.level1 || []);
        return [...base].sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }, [data.level1, focusedNode]);

    const displayL2 = useMemo(() => {
        const raw = focusedNode ? focusedNode.children : data.level2;
        if (!displayL1?.length || !raw?.length) return [];
        const indexMap = new Map(displayL1.map((l1, i) => [l1.name, i]));
        return [...raw].sort((a, b) => {
            const ia = indexMap.get(a.parentName) ?? Infinity;
            const ib = indexMap.get(b.parentName) ?? Infinity;
            if (ia === ib) return b.value - a.value;
            return ia - ib;
        });
    }, [displayL1, data.level2, focusedNode]);

    const renderCustomLabel = useCallback(({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, value }) => {
        const upperName = String(name).toUpperCase();
        const isOuterRing = outerRadius > 150;

        if (isOuterRing && HIDDEN_NAMES.has(upperName)) return null;
        if (percent < 0.018) return null;

        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        const percentValue = percent * 100;
        const displayPercent = (percentValue > 0 && percentValue < 1)
            ? percentValue.toFixed(1) + '%'
            : percentValue.toFixed(0) + '%';

        let textRotation = 0;
        
        // --- SOLUCIÓN 1: Rotación Inteligente ---
        // Rotamos el anillo externo siempre.
        // Rotamos el interno SOLO si la porción es pequeña (menor al 15%).
        if (isOuterRing || (!isOuterRing && percent < 0.15)) {
            let angle = ((-midAngle % 360) + 360) % 360;
            // Prevenir que el texto quede de cabeza
            if (angle > 90 && angle <= 270) angle += 180;
            textRotation = angle;
        }

        return (
            <text
                x={x} y={y}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="central"
                className="pointer-events-none font-bold"
                transform={`rotate(${textRotation}, ${x}, ${y})`} // <- Rotación aplicada siempre
                style={{ 
                    fontSize: isOuterRing ? '7px' : '8px', // Tamaño de fuente optimizado
                    textTransform: 'uppercase', 
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)' 
                }}
            >
                <tspan x={x} dy="-0.5em" fontWeight="900">{upperName}</tspan>
                <tspan x={x} dy="1.2em" fontSize={isOuterRing ? '8px' : '9px'}>{displayPercent}</tspan>
            </text>
        );
    }, []);

    const l1Cells = useMemo(() => displayL1.map((entry, i) => (
        <Cell key={`l1-${i}`} fill={getChartColor(entry.name)} />
    )), [displayL1]);

    const l2Cells = useMemo(() => displayL2.map((entry, i) => {
        const isHidden = HIDDEN_NAMES.has(String(entry.name).toUpperCase());
        return (
            <Cell
                key={`l2-${i}`}
                fill={isHidden ? 'transparent' : getChartColor(entry.name, entry.parentName)}
                stroke={isHidden ? 'transparent' : '#000000'}
                style={{ outline: 'none' }}
                className={isHidden ? 'pointer-events-none' : 'hover:brightness-110 transition-all'}
            />
        );
    }), [displayL2]);

    const handleInnerClick = useCallback((e) => {
        if (setFocusedNode) {
            setFocusedNode(focusedNode ? null : e);
        }
    }, [setFocusedNode, focusedNode]);

    const TooltipContent = useCallback(({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        const isOuter = payload[0].name !== d.parentName && d.parentName;
        if (isOuter && HIDDEN_NAMES.has(String(d.name).toUpperCase())) return null;
        return (
            <div className="bg-slate-900 border border-white/20 p-3 rounded-lg shadow-xl">
                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">
                    {d.parentName ? `${d.parentName} > ` : ''}{d.name}
                </p>
                <p className="text-white font-bold text-sm">{d.value.toLocaleString()}</p>
            </div>
        );
    }, []);

    return (
        <div className="relative w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip content={TooltipContent} />
                    <Pie
                        data={displayL1}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={focusedNode ? 0 : 45}
                        outerRadius={focusedNode ? 110 : 125}
                        label={renderCustomLabel}
                        labelLine={false}
                        stroke="#000000"
                        strokeWidth={1}
                        className="cursor-pointer hover:brightness-110 transition-all"
                        onClick={handleInnerClick}
                        isAnimationActive={false}
                    >
                        {l1Cells}
                    </Pie>
                    <Pie
                        data={displayL2}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        startAngle={90}
                        endAngle={-270}
                        innerRadius={focusedNode ? 115 : 127}
                        outerRadius={focusedNode ? 195 : 195}
                        label={renderCustomLabel}
                        labelLine={false}
                        stroke="#000000"
                        strokeWidth={1}
                        isAnimationActive={false}
                    >
                        {l2Cells}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
});
InteractiveSunburstPlotly.displayName = 'InteractiveSunburstPlotly';

// ─── GRÁFICO DE BARRAS APILADAS ────────────────────────────────────────────────

const LocalStackedBar = React.memo(({ data, keys }) => {
    const bars = useMemo(() => keys.map((k) => (
        <Bar key={k} dataKey={k} stackId="a" fill={getChartColor(k)} stroke="#000" strokeWidth={0.5} maxBarSize={80} isAnimationActive={false}>
            <LabelList
                dataKey={k}
                position="center"
                fill="#ffffff"
                fontSize={10}
                fontWeight="bold"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
                formatter={(val) => (val > 400 ? val.toLocaleString() : '')}
            />
        </Bar>
    )), [keys]);

    return (
        <ResponsiveContainer width="100%" height={500}>
            <BarChart data={data} margin={{ left: 10, bottom: 120, right: 20, top: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    height={120}
                    interval={0}
                    tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                            <text x={0} y={0} dx={-20} dy={5} textAnchor="end" fill="#e2e8f0" fontSize={11} fontWeight={800} transform="rotate(-90)">
                                {String(payload.value).toUpperCase()}
                            </text>
                        </g>
                    )}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => val.toLocaleString()}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0b2241', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '11px' }}
                />
                <Legend
                    verticalAlign="top"
                    align="center"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: '800', color: '#cbd5e1', paddingBottom: '30px', textTransform: 'uppercase' }}
                />
                {bars}
                <Line type="monotone" dataKey="total" stroke="transparent" strokeWidth={0} dot={false} activeDot={false}>
                    <LabelList dataKey="total" position="top" fill="#ffffff" fontSize={13} fontWeight="900" formatter={(val) => val.toLocaleString()} offset={10} />
                </Line>
            </BarChart>
        </ResponsiveContainer>
    );
});
LocalStackedBar.displayName = 'LocalStackedBar';

// ─── SECCIÓN DE FILTROS ────────────────────────────────────────────────────────

const LocalFilterSection = React.memo(({ title, configs, filters, onFilterChange, isOpen, onToggle }) => (
    <div className="mb-4 bg-[#0b2241]/80 backdrop-blur-xl border border-white/10 rounded-[1.5rem] shadow-lg overflow-hidden transition-all">
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 cursor-pointer hover:bg-white/10" onClick={onToggle}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg"><Filter size={16} /></div>
                <h3 className="text-[11px] font-black text-slate-200 uppercase tracking-wider">{title}</h3>
            </div>
            {isOpen ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
        {isOpen && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6 border-t border-white/10">
                {configs.map((config) => (
                    <div key={config.key} className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 block">{config.label}</label>
                        <select
                            className="w-full bg-[#0b2241] border border-white/20 text-slate-200 text-[11px] font-bold rounded-xl py-3 px-4 outline-none uppercase shadow-sm focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                            value={filters[config.key] || ''}
                            onChange={(e) => onFilterChange(config.key, e.target.value)}
                        >
                            <option value="">TODOS</option>
                            {config.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                ))}
            </div>
        )}
    </div>
));
LocalFilterSection.displayName = 'LocalFilterSection';

// ─── BARRA DE HERRAMIENTAS DE TABLA ───────────────────────────────────────────

const TableToolbar = React.memo(({ onSearch, searchValue, allColumns, visibleColumns, onToggleColumn, exportButton }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const handleMenuToggle = useCallback(() => setIsMenuOpen(prev => !prev), []);

    return (
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full md:flex-1 md:max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                    type="text"
                    value={searchValue}
                    placeholder="Buscar..."
                    className="w-full pl-12 pr-4 py-3 bg-[#0b2241]/60 backdrop-blur-md border border-white/10 rounded-[1rem] text-[11px] font-bold text-white placeholder-slate-400 outline-none"
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
            <div className="relative w-full md:w-auto">
                <button
                    onClick={handleMenuToggle}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/5 border border-white/10 px-5 py-3 rounded-[1rem] hover:bg-white/10 transition-colors"
                >
                    <Columns size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-slate-200 uppercase">Columnas</span>
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-full md:w-64 bg-[#0b2241] rounded-2xl shadow-2xl border border-white/10 z-[60] p-4 max-h-80 overflow-y-auto">
                        {allColumns.map((col) => (
                            <label key={col.key} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                                <input
                                    type="checkbox"
                                    checked={visibleColumns.includes(col.key)}
                                    onChange={() => onToggleColumn(col.key)}
                                    className="rounded bg-slate-800 border-slate-600 text-indigo-500 w-4 h-4"
                                />
                                <span className="text-[10px] font-bold uppercase text-slate-300">{col.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
            {exportButton && <div className="w-full md:w-auto">{exportButton}</div>}
        </div>
    );
});
TableToolbar.displayName = 'TableToolbar';

// ─── VISTA DE TABLA ────────────────────────────────────────────────────────────

const TableView = React.memo(({ data, columns, pagination, onPageChange, loading, title }) => (
    <div className="bg-[#0b2241]/80 backdrop-blur-xl rounded-[1.5rem] border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden mb-10">
        <div className="p-5 bg-white/5 border-b border-white/10 flex justify-between items-center">
            <h4 className="text-[11px] font-black text-slate-200 uppercase tracking-widest">{title}</h4>
            <div className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg">
                <span className="text-[10px] font-black text-indigo-300 uppercase">
                    Mostrando: {(data.length || 0).toLocaleString()} registros
                </span>
            </div>
        </div>

        <div className="overflow-x-auto relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-[#0b2241]/40 backdrop-blur-[2px] z-10 flex items-center justify-center transition-all">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-2"></div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-tighter">Actualizando...</span>
                    </div>
                </div>
            )}
            <table className={`w-full text-left border-collapse min-w-max transition-opacity duration-300 ${loading ? 'opacity-40' : 'opacity-100'}`}>
                <thead>
                    <tr className="bg-[#0b2241]/50 border-b border-white/10">
                        {columns.map((col) => (
                            <th key={col.key} className="p-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {data.length === 0 && !loading ? (
                        <tr>
                            <td colSpan={columns.length} className="p-16 text-center text-slate-500 uppercase text-[10px] font-bold">
                                No se encontraron registros
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                {columns.map((col) => (
                                    <td key={`${idx}-${col.key}`} className="p-4 text-[10px] font-bold text-slate-200">
                                        {row[col.key] !== null && row[col.key] !== undefined
                                            ? row[col.key].toLocaleString()
                                            : <span className="text-slate-500">N/A</span>}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/10 flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">
                Página {pagination.current} de {pagination.total_pages || 1}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, pagination.current - 1))}
                    disabled={pagination.current <= 1 || loading}
                    className="p-2.5 rounded-xl border border-white/10 bg-[#0b2241] text-slate-300 disabled:opacity-50"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={() => onPageChange(pagination.current + 1)}
                    disabled={!pagination.total_pages || pagination.current >= pagination.total_pages || loading}
                    className="p-2.5 rounded-xl border border-white/10 bg-[#0b2241] text-slate-300 disabled:opacity-50"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    </div>
));
TableView.displayName = 'TableView';

// ─── BOTÓN DE EXPORTACIÓN ─────────────────────────────────────────────────────

const ExportButton = React.memo(({ exportState, onExport }) => {
    const { loading, progress } = exportState;

    return (
        <button
            onClick={onExport}
            disabled={loading}
            title="Exportar tabla a Excel"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-[1rem] transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
        >
            {loading ? (
                <>
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin flex-shrink-0" />
                    <div className="flex items-center gap-1.5">
                        <div className="w-20 h-1.5 bg-emerald-900/60 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-emerald-300 uppercase tabular-nums">
                            {progress}%
                        </span>
                    </div>
                </>
            ) : (
                <>
                    <Download size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black text-emerald-300 uppercase">Excel</span>
                </>
            )}
        </button>
    );
});
ExportButton.displayName = 'ExportButton';

// ─── DEFINICIÓN ESTÁTICA DE COLUMNAS ──────────────────────────────────────────

const ALL_COLUMNS_GESTION = [
    { key: 'CALL_CENTER_FILTRO',  label: 'Filtro Call Center'    },
    { key: 'Cargo_Usuario',       label: 'Cargo Usuario'         },
    { key: 'Cedula_Cliente',      label: 'Cédula Cliente'        },
    { key: 'Celular',             label: 'Celular'               },
    { key: 'Codeudor1',           label: 'Codeudor 1'           },
    { key: 'Codeudor2',           label: 'Codeudor 2'           },
    { key: 'Credito',             label: 'Crédito'               },
    { key: 'Dias_Atraso_Final',   label: 'Días Atraso'          },
    { key: 'Empresa',             label: 'Empresa'               },
    { key: 'Estado_Gestion',      label: 'Estado Gestión'        },
    { key: 'Estado_Pago',         label: 'Estado Pago'           },
    { key: 'Fecha_Cuota_Vigente', label: 'Fecha Cuota'          },
    { key: 'Meta_$',              label: 'Meta $'                },
    { key: 'Nombre_Ciudad',       label: 'Ciudad'                },
    { key: 'Nombre_Cliente',      label: 'Nombre Cliente'        },
    { key: 'Nombre_Codeudor1',    label: 'Nombre Codeudor 1'    },
    { key: 'Nombre_Codeudor2',    label: 'Nombre Codeudor 2'    },
    { key: 'Nombre_Usuario',      label: 'Nombre Usuario'        },
    { key: 'Novedad',             label: 'Novedad'               },
    { key: 'Novedades_Por_Cargo', label: 'Novedades Por Cargo'  },
    { key: 'Regional_Cobro',      label: 'Regional Cobro'        },
    { key: 'Telefono_Codeudor1',  label: 'Teléfono Codeudor 1' },
    { key: 'Telefono_Codeudor2',  label: 'Teléfono Codeudor 2' },
    { key: 'Tipo_Novedad',        label: 'Tipo Novedad'          },
    { key: 'Tipo_Vigencia_Temp',  label: 'Tipo Vigencia'         },
    { key: 'Total_Recaudo',       label: 'Total Recaudo'         },
    { key: 'Valor_Cuota_Vigente', label: 'Valor Cuota'          },
    { key: 'Valor_Vencido',       label: 'Valor Vencido'         },
    { key: 'Zona',                label: 'Zona'                  }
];

const ALL_COLUMNS_RODAMIENTO = [
    { key: 'CALL_CENTER_FILTRO',  label: 'Filtro Call Center'    },
    { key: 'Cedula_Cliente',      label: 'Cédula Cliente'        },
    { key: 'Celular',             label: 'Celular'               },
    { key: 'Codeudor1',           label: 'Codeudor 1'           },
    { key: 'Codeudor2',           label: 'Codeudor 2'           },
    { key: 'Credito',             label: 'Crédito'               },
    { key: 'Dias_Atraso_Final',   label: 'Días Atraso'          },
    { key: 'Empresa',             label: 'Empresa'               },
    { key: 'Estado_Gestion',      label: 'Estado Gestión'        },
    { key: 'Estado_Pago',         label: 'Estado Pago'           },
    { key: 'Fecha_Cuota_Vigente', label: 'Fecha Cuota'          },
    { key: 'Franja_Cartera',      label: 'Franja Cartera'        },
    { key: 'Meta_$',              label: 'Meta $'                },
    { key: 'Meta_Intereses',      label: 'Meta Intereses'        },
    { key: 'Meta_Saldo',          label: 'Meta Saldo'            },
    { key: 'Nombre_Ciudad',       label: 'Ciudad'                },
    { key: 'Nombre_Cliente',      label: 'Nombre Cliente'        },
    { key: 'Nombre_Codeudor1',    label: 'Nombre Codeudor 1'    },
    { key: 'Nombre_Codeudor2',    label: 'Nombre Codeudor 2'    },
    { key: 'Regional_Cobro',      label: 'Regional Cobro'        },
    { key: 'Rodamiento',          label: 'Rodamiento'            },
    { key: 'Rodamiento_Cartera',  label: 'Rodamiento Cartera'    },
    { key: 'Telefono_Codeudor1',  label: 'Teléfono Codeudor 1' },
    { key: 'Telefono_Codeudor2',  label: 'Teléfono Codeudor 2' },
    { key: 'Tipo_Vigencia_Temp',  label: 'Tipo Vigencia'         },
    { key: 'Total_Recaudo',       label: 'Total Recaudo'         },
    { key: 'Valor_Cuota_Vigente', label: 'Valor Cuota'          },
    { key: 'Valor_Vencido',       label: 'Valor Vencido'         },
    { key: 'Zona',                label: 'Zona'                  }
];

// ─── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────

export default function Seguimientos({ data, selectedFilters, apiClient, jobId }) {

    const [focusedGestion,  setFocusedGestion]  = useState(null);
    const [focusedConPago,  setFocusedConPago]  = useState(null);
    const [focusedSinPago,  setFocusedSinPago]  = useState(null);

    const [localFiltersGestion, setLocalFiltersGestion] = useState({
        Estado_Pago: '', Estado_Gestion: '', Cargo_Usuario: '', excluir_cargos: ''
    });
    const [localFiltersRodamiento, setLocalFiltersRodamiento] = useState({
        Rodamiento: '', Estado_Gestion: '', Estado_Pago: ''
    });

    const [showLocalFiltersGestion,    setShowLocalFiltersGestion]    = useState(true);
    const [showLocalFiltersRodamiento, setShowLocalFiltersRodamiento] = useState(true);

    const [gestionTable, setGestionTable] = useState({
        data: [], loading: false, search: '',
        pagination: { current: 1, total_pages: 0, total_records: 0 }
    });
    const [rodamientoTable, setRodamientoTable] = useState({
        data: [], loading: false, search: '',
        pagination: { current: 1, total_pages: 0, total_records: 0 }
    });

    const [visibleColsGestion,    setVisibleColsGestion]    = useState(['Cedula_Cliente', 'Nombre_Cliente', 'Estado_Gestion', 'Estado_Pago', 'Regional_Cobro', 'Novedad']);
    const [visibleColsRodamiento, setVisibleColsRodamiento] = useState(['Credito', 'Cedula_Cliente', 'Rodamiento', 'Franja_Cartera', 'Valor_Vencido']);
    const EXPORT_INITIAL = { loading: false, progress: 0 };
    const [exportGestion,    setExportGestion]    = useState(EXPORT_INITIAL);
    const [exportRodamiento, setExportRodamiento] = useState(EXPORT_INITIAL);
    const pollRefGestion    = useRef(null);
    const pollRefRodamiento = useRef(null);

    // ── HELPERS ───────────────────────────────────────────────────────────────

    // MODIFICADO: AHORA INCLUYE LÓGICA FRONTEND PARA OCULTAR EL CARGO EN LAS GRÁFICAS
    const applyGlobalFilters = useCallback((dataSet) => {
        if (!Array.isArray(dataSet)) return [];

        // 1. Aplicamos el filtro frontal (excluir_cargos)
        let filteredSet = dataSet;
        if (localFiltersGestion.excluir_cargos) {
            filteredSet = filteredSet.filter(item => item.Cargo_Usuario !== localFiltersGestion.excluir_cargos);
        }

        // 2. Aplicamos el resto de los filtros globales
        const entries = Object.entries(selectedFilters || {});
        if (entries.length === 0) return filteredSet;

        return filteredSet.filter(item =>
            entries.every(([key, values]) => {
                if (!values || !Array.isArray(values) || values.length === 0) return true;
                return values.includes(item[key]);
            })
        );
    }, [selectedFilters, localFiltersGestion.excluir_cargos]); // Importante dependencia

    const buildSunburstData = useCallback((list, mainKey, subKey, valKey) => {
        const source = Array.isArray(list) ? list : (list?.grouped || []);
        const filtered = applyGlobalFilters(source);
        const grouped = filtered.reduce((acc, item) => {
            const main = String(item[mainKey] || 'SIN ASIGNAR').toUpperCase().trim();
            const sub  = String(item[subKey]  || 'SIN ASIGNAR').toUpperCase().trim();
            const val  = Number(item[valKey]  || item['count'] || 1);
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
    }, [applyGlobalFilters]);

    const processStackedBarData = useCallback((list, xKey, stackKey, valKey) => {
        const source = Array.isArray(list) ? list : (list?.grouped || []);
        const filtered = applyGlobalFilters(source);
        const map = {};
        const keyTotals = {};

        filtered.forEach(d => {
            const xVal = d[xKey] || 'SIN ASIGNAR';
            const sKey = String(d[stackKey] || 'SIN ASIGNAR').toUpperCase().trim();
            const val  = Number(d[valKey] || d['count'] || 1);
            if (!map[xVal]) map[xVal] = { name: xVal, total: 0 };
            map[xVal][sKey] = (map[xVal][sKey] || 0) + val;
            map[xVal].total += val;
            keyTotals[sKey] = (keyTotals[sKey] || 0) + val;
        });

        const sortedKeys = Object.keys(keyTotals).sort((a, b) => keyTotals[b] - keyTotals[a]);
        const sortedData = Object.values(map).sort((a, b) => b.total - a.total);
        return { data: sortedData, keys: sortedKeys };
    }, [applyGlobalFilters]);

    // ── FETCH CON DEBOUNCE ────────────────────────────────────────────────────

    const fetchTableData = useCallback(async (source, page = 1, search = '', filters = {}, setter) => {
        if (!jobId) return;
        setter(prev => ({ ...prev, loading: true, search }));

        try {
            const formattedFilters = {};
            Object.entries(filters).forEach(([key, value]) => {
                // MODIFICADO: Ignorar "excluir_cargos" para que el backend no falle
                if (value !== '' && value !== null && value !== undefined && key !== 'excluir_cargos') {
                    const backendKey = key.toLowerCase() === 'cargo_usuario' ? 'cargos' : key.toLowerCase();
                    formattedFilters[backendKey] = [value];
                }
            });

            const payload = {
                job_id: jobId,
                origen: source,
                page,
                page_size: 15,
                search_term: search,
                ...formattedFilters
            };

            const response = await apiClient.post('/wallet/buscar', payload);
            setter(prev => ({
                ...prev,
                data: response.data.data || [],
                loading: false,
                pagination: {
                    current:      response.data.meta?.page  || page,
                    total_pages:  response.data.meta?.pages || 0,
                    total_records: response.data.meta?.total || 0
                }
            }));
        } catch {
            setter(prev => ({ ...prev, loading: false }));
        }
    }, [jobId, apiClient]);

    const debounceGestion     = useRef(null);
    const debounceRodamiento  = useRef(null);

    const handleSearchGestion = useCallback((value) => {
        clearTimeout(debounceGestion.current);
        debounceGestion.current = setTimeout(() => {
            fetchTableData('seguimientos_gestion', 1, value, localFiltersGestion, setGestionTable);
        }, 350);
    }, [fetchTableData, localFiltersGestion]);

    const handleSearchRodamiento = useCallback((value) => {
        clearTimeout(debounceRodamiento.current);
        debounceRodamiento.current = setTimeout(() => {
            fetchTableData('seguimientos_rodamientos', 1, value, localFiltersRodamiento, setRodamientoTable);
        }, 350);
    }, [fetchTableData, localFiltersRodamiento]);

    const handleFilterGestion = useCallback((k, v) =>
        setLocalFiltersGestion(prev => ({ ...prev, [k]: v })), []);

    const handleFilterRodamiento = useCallback((k, v) =>
        setLocalFiltersRodamiento(prev => ({ ...prev, [k]: v })), []);

    const toggleColGestion = useCallback((key) =>
        setVisibleColsGestion(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]), []);

    const toggleColRodamiento = useCallback((key) =>
        setVisibleColsRodamiento(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]), []);

    const toggleFiltersGestion    = useCallback(() => setShowLocalFiltersGestion(prev => !prev), []);
    const toggleFiltersRodamiento = useCallback(() => setShowLocalFiltersRodamiento(prev => !prev), []);

    // ── EXPORTACIÓN ───────────────────────────────────────────────────────────

    const triggerFileDownload = useCallback((blob, fileName) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    }, []);

    const handleExport = useCallback(async (origen, filters, setExportState, pollRef) => {
        if (pollRef.current) {
            clearTimeout(pollRef.current);
            pollRef.current = null;
        }

        const formattedFilters = {};
        Object.entries(filters).forEach(([key, value]) => {
            // MODIFICADO: Ignorar "excluir_cargos" para exportación del backend
            if (value !== '' && value !== null && value !== undefined && key !== 'excluir_cargos') {
                const backendKey = key.toLowerCase() === 'cargo_usuario' ? 'cargos' : key.toLowerCase();
                formattedFilters[backendKey] = [value];
            }
        });

        const payload = { job_id: jobId, origen, ...formattedFilters };
        setExportState({ loading: true, progress: 5 });

        try {
            const res = await apiClient.post('/wallet/export', payload);
            const { status, file } = res.data;

            if (status === 'ready') {
                setExportState({ loading: true, progress: 100 });
                const direct = await apiClient.get(`/wallet/download/${file}`, { responseType: 'blob' });
                triggerFileDownload(new Blob([direct.data]), file);
                setTimeout(() => setExportState({ loading: false, progress: 0 }), 2000);
                return;
            }

            let simProgress = 10;
            const poll = async () => {
                if (!pollRef.current) return;
                simProgress = Math.min(simProgress + 7, 92);
                setExportState({ loading: true, progress: simProgress });

                try {
                    const pollRes = await apiClient.get(`/wallet/download/${file}`, { responseType: 'blob' });
                    const contentType = pollRes.headers?.['content-type'] || '';

                    if (contentType.includes('application/json')) {
                        pollRef.current = setTimeout(poll, 3000);
                        return;
                    }

                    pollRef.current = null;
                    triggerFileDownload(new Blob([pollRes.data]), file);
                    setExportState({ loading: true, progress: 100 });
                    setTimeout(() => setExportState({ loading: false, progress: 0 }), 2000);

                } catch {
                    pollRef.current = null;
                    setExportState({ loading: false, progress: 0 });
                }
            };

            pollRef.current = setTimeout(poll, 3000);

        } catch {
            setExportState({ loading: false, progress: 0 });
        }
    }, [jobId, apiClient, triggerFileDownload]);

    const handleExportGestion    = useCallback(() =>
        handleExport('seguimientos_gestion',     localFiltersGestion,    setExportGestion,    pollRefGestion),
    [handleExport, localFiltersGestion]);

    const handleExportRodamiento = useCallback(() =>
        handleExport('seguimientos_rodamientos', localFiltersRodamiento, setExportRodamiento, pollRefRodamiento),
    [handleExport, localFiltersRodamiento]);

    const pageGestion = useCallback((p) =>
        fetchTableData('seguimientos_gestion',     p, gestionTable.search,    localFiltersGestion,    setGestionTable), 
    [fetchTableData, gestionTable.search, localFiltersGestion]);

    const pageRodamiento = useCallback((p) =>
        fetchTableData('seguimientos_rodamientos', p, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable),
    [fetchTableData, rodamientoTable.search, localFiltersRodamiento]);

    // ── EFFECTS ───────────────────────────────────────────────────────────────

    useEffect(() => {
        if (jobId) fetchTableData('seguimientos_gestion', 1, gestionTable.search, localFiltersGestion, setGestionTable);
    }, [localFiltersGestion, jobId, fetchTableData]);

    useEffect(() => {
        if (jobId) fetchTableData('seguimientos_rodamientos', 1, rodamientoTable.search, localFiltersRodamiento, setRodamientoTable);
    }, [localFiltersRodamiento, jobId, fetchTableData]);

    useEffect(() => {
        return () => {
            if (pollRefGestion.current)    clearTimeout(pollRefGestion.current);
            if (pollRefRodamiento.current) clearTimeout(pollRefRodamiento.current);
        };
    }, []);

    // ── DATOS PROCESADOS ──────────────────────────────────────────────────────

    const charts = useMemo(() => {
        if (!data) return null;

        const filteredDonut = applyGlobalFilters(data.donut_data || []);
        const recaudoMap = filteredDonut.reduce((acc, curr) => {
            const key = curr.Estado_Pago || 'SIN ASIGNAR';
            acc[key] = (acc[key] || 0) + (curr.count || 0);
            return acc;
        }, {});

        return {
            recaudo:   Object.entries(recaudoMap).map(([name, value]) => ({ name: String(name).toUpperCase(), value })),
            gestion:   buildSunburstData(data.sunburst_grouped, 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            conPago:   buildSunburstData(
                           (data.detalle_pago?.grouped || []).filter(d => d.Estado_Pago !== 'SIN PAGO'),
                           'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'
                       ),
            sinPago:   buildSunburstData(data.detalle_sin_pago?.grouped || [], 'Estado_Gestion', 'Cargo_Usuario', 'Cantidad'),
            rodamiento: processStackedBarData(data.rodamiento_data, 'Rodamiento', 'Franja_Cartera', 'Número de Cuentas')
        };
    }, [data, applyGlobalFilters, buildSunburstData, processStackedBarData]);

    // MODIFICADO: Agregada la llave correcta `excluir_cargos` en filterConfigsGestion
    const filterConfigsGestion = useMemo(() => {
        const opcionesCargos = [...new Set(((data?.sunburst_grouped || data?.donut_data) || []).map(x => x.Cargo_Usuario).filter(Boolean))];
        return [
            {
                key: 'Estado_Pago',
                label: 'Estado de Pago',
                options: [...new Set((data?.donut_data || []).map(x => x.Estado_Pago).filter(Boolean))]
            },
            {
                key: 'Estado_Gestion',
                label: 'Gestión',
                options: [...new Set((data?.sunburst_grouped || []).map(x => x.Estado_Gestion).filter(Boolean))]
            },
            {
                key: 'Cargo_Usuario',
                label: 'Cargo de Usuario',
                options: opcionesCargos
            },
            {
                key: 'excluir_cargos',
                label: 'Excluir Cargo',
                options: opcionesCargos
            }
        ];
    }, [data]);

    const columnsGestion    = useMemo(() => ALL_COLUMNS_GESTION.filter(c    => visibleColsGestion.includes(c.key)),    [visibleColsGestion]);
    const columnsRodamiento = useMemo(() => ALL_COLUMNS_RODAMIENTO.filter(c => visibleColsRodamiento.includes(c.key)), [visibleColsRodamiento]);

    // MODIFICADO: Memoria para filtrar frontalmente la tabla y que no se muestre el cargo excluido
    const filteredGestionTableData = useMemo(() => {
        if (!localFiltersGestion.excluir_cargos) return gestionTable.data;
        return gestionTable.data.filter(row => row.Cargo_Usuario !== localFiltersGestion.excluir_cargos);
    }, [gestionTable.data, localFiltersGestion.excluir_cargos]);

    if (!charts) return null;

    // ── RENDER ────────────────────────────────────────────────────────────────

    return (
        <div className="space-y-12 animate-in fade-in duration-700 p-4">

            {/* GRÁFICOS SUNBURST */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <ChartCard
                    title="Estado de Vigencia y Recaudo"
                    subtitle="Distribución por estado actual de cartera"
                    isEmpty={charts.recaudo.length === 0}
                >
                    <InteractiveSunburstPlotly
                        data={{ level1: charts.recaudo, level2: [] }}
                        focusedNode={null}
                    />
                </ChartCard>

                <ChartCard
                    title="Distribución de Gestión"
                    subtitle="Cargos por cada estado de gestión"
                    isEmpty={charts.gestion.level1.length === 0}
                >
                    <InteractiveSunburstPlotly
                        data={charts.gestion}
                        focusedNode={focusedGestion}
                        setFocusedNode={setFocusedGestion}
                    />
                </ChartCard>

                <ChartCard
                    title="Gestión con Pago"
                    subtitle="Eficiencia de cobro por cargo"
                    isEmpty={charts.conPago.level1.length === 0}
                >
                    <InteractiveSunburstPlotly
                        data={charts.conPago}
                        focusedNode={focusedConPago}
                        setFocusedNode={setFocusedConPago}
                    />
                </ChartCard>

                <ChartCard
                    title="Gestión sin Pago"
                    subtitle="Cartera gestionada pendiente de recaudo"
                    isEmpty={charts.sinPago.level1.length === 0}
                >
                    <InteractiveSunburstPlotly
                        data={charts.sinPago}
                        focusedNode={focusedSinPago}
                        setFocusedNode={setFocusedSinPago}
                    />
                </ChartCard>
            </div>

            {/* SECCIÓN GESTIÓN */}
            <div className="space-y-4">
                <LocalFilterSection
                    title="Filtros y Controles de Gestión"
                    isOpen={showLocalFiltersGestion}
                    onToggle={toggleFiltersGestion}
                    filters={localFiltersGestion}
                    onFilterChange={handleFilterGestion}
                    configs={filterConfigsGestion}
                />
                <TableToolbar
                    onSearch={handleSearchGestion}
                    searchValue={gestionTable.search}
                    allColumns={ALL_COLUMNS_GESTION}
                    visibleColumns={visibleColsGestion}
                    onToggleColumn={toggleColGestion}
                    exportButton={
                        <ExportButton
                            exportState={exportGestion}
                            onExport={handleExportGestion}
                        />
                    }
                />
                <TableView
                    title="Reporte Detallado de Gestión"
                    data={filteredGestionTableData} // <-- AHORA PASA LA DATA FILTRADA FRONTALMENTE
                    columns={columnsGestion}
                    loading={gestionTable.loading}
                    pagination={gestionTable.pagination}
                    onPageChange={pageGestion}
                />
            </div>

            {/* BARRAS RODAMIENTOS */}
            <div className="grid grid-cols-1 pt-6">
                <ChartCard title="Análisis de Rodamiento de Cartera" isEmpty={charts.rodamiento.data.length === 0}>
                    <LocalStackedBar data={charts.rodamiento.data} keys={charts.rodamiento.keys} />
                </ChartCard>
            </div>

            {/* SECCIÓN RODAMIENTOS */}
            <div className="space-y-4">
                <LocalFilterSection
                    title="Filtros y Controles de Rodamientos"
                    isOpen={showLocalFiltersRodamiento}
                    onToggle={toggleFiltersRodamiento}
                    filters={localFiltersRodamiento}
                    onFilterChange={handleFilterRodamiento}
                    configs={[
                        { key: 'Rodamiento',    label: 'Rodamiento Cartera', options: ['EMPEORO', 'SE MANTIENE', 'MEJORO', 'NORMALIZO', 'PAGO TOTAL'] },
                        { key: 'Estado_Gestion', label: 'Estado de Gestión',  options: ['CON GESTIÓN', 'SIN GESTIÓN'] },
                        { key: 'Estado_Pago',    label: 'Estado de Pago',     options: ['SIN PAGO', 'PAGO'] }
                    ]}
                />
                <TableToolbar
                    onSearch={handleSearchRodamiento}
                    searchValue={rodamientoTable.search}
                    allColumns={ALL_COLUMNS_RODAMIENTO}
                    visibleColumns={visibleColsRodamiento}
                    onToggleColumn={toggleColRodamiento}
                    exportButton={
                        <ExportButton
                            exportState={exportRodamiento}
                            onExport={handleExportRodamiento}
                        />
                    }
                />
                <TableView
                    title="Reporte Detallado de Rodamientos"
                    data={rodamientoTable.data}
                    columns={columnsRodamiento}
                    loading={rodamientoTable.loading}
                    pagination={rodamientoTable.pagination}
                    onPageChange={pageRodamiento}
                />
            </div>

        </div>
    );
}