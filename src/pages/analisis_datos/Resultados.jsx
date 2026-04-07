import React, { useMemo, useState } from 'react';
import { Layers, Filter, XCircle, ChevronDown, AlertCircle, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { COLOR_MAP } from './DashboardComponents';
import { PieChart, Pie, Cell, Customized, ResponsiveContainer } from 'recharts';
import ExportExcel from "../../components/cartera_buttons/ExportExcel";

const RADIAN = Math.PI / 180;

const FRANJAS_CONFIG = [
    { key: '1 A 30', title: '1 A 30 DÍAS', color: COLOR_MAP?.['1 A 30'] || '#10b981' }, 
    { key: '31 A 90', title: '31 A 90 DÍAS', color: COLOR_MAP?.['31 A 90'] || '#f59e0b' },
    { key: '91 A 180', title: '91 A 180 DÍAS', color: COLOR_MAP?.['91 A 180'] || '#ef4444' }, 
    { key: '181 A 360', title: '181 A 360 DÍAS', color: COLOR_MAP?.['181 A 360'] || '#8b5cf6' }
];

// ============= GAUGE WITH DETAILS CARD (ESTILO IMAGEN: BARRA INTERNA Y COLORES FIJOS) =============
const GaugeWithDetailsCard = ({ title, value, meta, recaudo, faltante, isMain = false }) => {
    const rawValue = Number(value) || 0;
    const safeValue = Math.min(Math.max(rawValue, 0), 100);
    const safeMeta = Number(meta) || 0;
    const safeRecaudo = Number(recaudo) || 0;
    const safeFaltante = Number(faltante) || 0;
    
    // Alturas y tamaños adaptados
    const heightClass = isMain ? "min-h-[400px] lg:h-full" : "min-h-[320px] h-full";
    const titleClass = isMain ? "text-[15px] md:text-[17px] font-black" : "text-[13px] md:text-[15px] font-black";
    const percentSize = isMain ? "text-5xl md:text-6xl" : "text-4xl md:text-5xl";

    // Lógica para determinar el color base del texto según la zona alcanzada
    const getDynamicColor = (val) => {
        if (val <= 20) return '#ef4444'; // Rojo
        if (val <= 40) return '#f59e0b'; // Naranja
        if (val <= 60) return '#eab308'; // Amarillo
        if (val <= 80) return '#10b981'; // Verde
        return '#8b5cf6';                // Morado
    };
    
    const activeColor = getDynamicColor(safeValue);

    // Los 5 colores base estáticos para el arco completo
    const referenceData = [
        { value: 20, color: '#ef4444' }, // Rojo
        { value: 20, color: '#f59e0b' }, // Naranja
        { value: 20, color: '#eab308' }, // Amarillo
        { value: 20, color: '#10b981' }, // Verde
        { value: 20, color: '#8b5cf6' }, // Morado
    ];
    
    return (
        <div className={`bg-[#0A192F] rounded-2xl border border-slate-700/50 shadow-xl flex flex-col items-center p-5 md:p-6 relative overflow-hidden transition-all duration-300 w-full hover:border-cyan-500/30 ${heightClass}`}>
            
            {/* TÍTULO */}
            <h3 className={`${titleClass} text-slate-100 uppercase tracking-widest text-center mb-6 z-10 drop-shadow-md`}>
                {title}
            </h3>

            {/* GAUGE CHART (Compuesto por Fondo + Barra Superpuesta + Textos) */}
            <div className="w-full flex-1 relative flex flex-col items-center justify-center min-h-[160px] pb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        {/* CAPA 1: Arco de 5 colores (Estructura base idéntica a la imagen) */}
                        <Pie
                            data={referenceData}
                            cx="50%" cy="80%" 
                            startAngle={180} endAngle={0}
                            innerRadius="55%" outerRadius="90%"
                            dataKey="value" stroke="#0A192F" strokeWidth={2}
                            isAnimationActive={false}
                        >
                            {referenceData.map((entry, index) => (
                                <Cell key={`ref-${index}`} fill={entry.color} opacity={0.9} />
                            ))}
                        </Pie>

                        {/* CAPA 2: Barra de progreso interna (El barrido oscuro por el centro) */}
                        <Pie
                            data={[{ value: safeValue }, { value: 100 - safeValue }]}
                            cx="50%" cy="80%" 
                            startAngle={180} endAngle={0}
                            innerRadius="65%" outerRadius="80%" // Queda exactamente en medio del arco base
                            dataKey="value" stroke="none"
                            cornerRadius={4}
                        >
                            {/* Color oscuro con transparencia para oscurecer dinámicamente el color base */}
                            <Cell fill="rgba(0,0,0,0.45)" style={{ filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,0.5))' }} />
                            <Cell fill="transparent" />
                        </Pie>

                        {/* CAPA 3: Textos personalizados (0, 50, 100) en el borde */}
                        <Customized component={(props) => {
                            if (!props || !props.width || !props.height) return null;
                            const { width, height } = props;
                            const cx = width / 2;
                            const cy = height * 0.80; // Mismo centro que los arcos
                            const r = Math.min(width, height) / 2 * 0.96; // Justo por fuera del borde exterior
                            
                            const polarToCartesian = (angle) => {
                                const rad = angle * Math.PI / 180;
                                return {
                                    x: cx + r * Math.cos(rad),
                                    y: cy - r * Math.sin(rad)
                                };
                            };

                            const pos0 = polarToCartesian(180);
                            const pos50 = polarToCartesian(90);
                            const pos100 = polarToCartesian(0);

                            return (
                                <g className="text-[10px] md:text-[11px] font-bold fill-slate-400">
                                    <text x={pos0.x} y={pos0.y} textAnchor="end" dominantBaseline="central" dx="-6">0</text>
                                    <text x={pos50.x} y={pos50.y} textAnchor="middle" dominantBaseline="bottom" dy="-6">50</text>
                                    <text x={pos100.x} y={pos100.y} textAnchor="start" dominantBaseline="central" dx="6">100</text>
                                </g>
                            );
                        }} />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* PORCENTAJE (Hereda el color dinámico) */}
                <div className="absolute top-[68%] left-1/2 transform -translate-x-1/2 mt-2 flex flex-col items-center">
                    <span className={`${percentSize} font-black block leading-none drop-shadow-lg tracking-tighter transition-colors duration-500`} style={{ color: activeColor }}>
                        {rawValue.toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* DETALLES DE CÁLCULO */}
            <div className="w-full flex flex-col gap-2 mt-4 z-10 shrink-0 bg-[#112240] rounded-xl border border-slate-700/50 p-4">
                <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] md:text-[12px] text-slate-400 font-bold uppercase tracking-widest">Meta:</span>
                    <span className="text-[12px] md:text-[13px] text-white font-black">${safeMeta.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] md:text-[12px] text-slate-400 font-bold uppercase tracking-widest">Recaudo:</span>
                    <span className="text-[12px] md:text-[13px] text-emerald-400 font-black">${safeRecaudo.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center w-full">
                    <span className="text-[11px] md:text-[12px] text-slate-400 font-bold uppercase tracking-widest">Faltante:</span>
                    <span className="text-[12px] md:text-[13px] text-red-400 font-black">${safeFaltante.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
            </div>
        </div>
    );
};

// ============= ZONE MINI TABLE =============
const ZoneMiniTable = ({ title, data, count, jobId}) => {

    const getDynamicColor = (val) => {
        if (val <= 20) return '#ef4444'; // Rojo
        if (val <= 40) return '#f59e0b'; // Naranja
        if (val <= 60) return '#eab308'; // Amarillo
        if (val <= 80) return '#10b981'; // Verde
        return '#8b5cf6';                // Morado
    };
    const { groupedData, totals } = useMemo(() => {
        const groups = {};
        let totalMeta = 0;
        let totalRecaudo = 0;
        let totalFaltante = 0;
        let totalCuentas = 0;

        data.forEach(item => {
            const reg = item.Regional_Cobro || 'SIN REGIONAL';
            if (!groups[reg]) groups[reg] = [];
            groups[reg].push(item);
            
            totalMeta += parseFloat(item.Meta_Total || 0);
            totalRecaudo += parseFloat(item.Recaudo_Total || 0);
            totalFaltante += parseFloat(item.Faltante_Calc || 0);
            totalCuentas += parseFloat(item.Cuentas || 0);
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
                cuentas: totalCuentas,
                cumplimiento: totalMeta > 0 ? (totalRecaudo / totalMeta) * 100 : 0
            }
        };
    }, [data]);

    const datosParaExcel = data.map(fila => ({
        "Regional": fila.Regional_Cobro,
        "Zona": fila.Zona,
        "Cuentas": fila.Cuentas,
        "Cumplimiento %": fila['Cumplimiento_%'],
        "Meta Total": fila.Meta_Total,
        "Recaudo": fila.Recaudo_Total,
        "Faltante": fila.Faltante_Calc
        // Agrega o quita los que necesites que se vean en el Excel
    }))

    return (
        <div className="bg-[#0A192F] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden flex flex-col h-[550px] md:h-[400px] transition-all duration-300">
            <div className="px-4 py-3 md:px-5 bg-gradient-to-r from-indigo-900/50 to-transparent border-b border-slate-700/50 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0">
                <h4 className="text-[12px] md:text-[13px] font-black text-slate-200 uppercase tracking-widest text-center md:text-left drop-shadow">{title}</h4>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="bg-indigo-500/20 border border-indigo-500/30 px-3 py-1 rounded-full text-[10px] md:text-[11px] font-black text-indigo-300 uppercase tracking-tighter whitespace-nowrap">
                        {count} ZONAS
                    </span>
                    {/* Contenedor estético para el botón para que encaje perfecto */}
                    <div className="h-8 flex items-stretch min-w-[100px]">
                        <ExportExcel 
            filtros={{ 
                datos_tabla: datosParaExcel, // <--- 2. USA LA NUEVA VARIABLE AQUÍ
                titulo: title,
                job_id: jobId 
            }}
            fileName={`Reporte_${title.replace(/ /g, '_')}.xlsx`}
            tableTitle={title} 
            isAvailable={data && data.length > 0} 
        />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-transparent scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="min-w-full flex flex-col">
                    <table className="w-full text-left border-collapse">
    <thead className="sticky top-0 z-30 shadow-sm backdrop-blur-md bg-[#0A192F]/95">
        <tr className="border-b border-slate-700/50">
            {/* Se reemplazan los anchos fijos por porcentajes y se unifican los tamaños de texto */}
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[15%] text-left border-r border-slate-700/50">Regional</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[10%] text-center border-r border-slate-700/50">Zona</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[10%] text-center border-r border-slate-700/50">Cuentas</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[20%] text-right border-r border-slate-700/50">Meta ($)</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[15%] text-right border-r border-slate-700/50">Recaudo ($)</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[15%] text-right border-r border-slate-700/50">Faltante ($)</th>
            <th className="p-3 text-xs font-black text-slate-300 uppercase w-[15%] text-center">Progreso</th>
        </tr>
    </thead>
    <tbody className="divide-y divide-slate-700/50">
        {groupedData.map((group) => (
            <React.Fragment key={group.regional}>
                {group.items.map((row, idx) => {
                    const percent = row.Meta_Total > 0 ? (row.Recaudo_Total / row.Meta_Total) * 100 : 0;
                    return (
                        <tr key={`${group.regional}-${idx}`} className="hover:bg-white/5 transition-colors">
                            {/* Se eliminan los fondos dispares (bg-[#112240] etc) y se aumenta el tamaño de fuente a text-[13px] */}
                            <td className="p-3 text-xs md:text-[13px] font-bold text-slate-200 uppercase border-r border-slate-700/50">{group.regional}</td>
                            <td className="p-3 text-xs md:text-[13px] font-black text-slate-100 uppercase text-center border-r border-slate-700/50">{row.Zona}</td>
                            <td className="p-3 text-xs md:text-[13px] font-bold text-cyan-400 text-center border-r border-slate-700/50">{(row.Cuentas || 0).toLocaleString()}</td>
                            <td className="p-3 text-xs md:text-[13px] font-semibold text-slate-200 text-right font-mono border-r border-slate-700/50">${(row.Meta_Total || 0).toLocaleString()}</td>
                            <td className="p-3 text-xs md:text-[13px] font-bold text-emerald-400 text-right font-mono border-r border-slate-700/50">${(row.Recaudo_Total || 0).toLocaleString()}</td>
                            <td className="p-3 text-xs md:text-[13px] font-black text-red-400 text-right font-mono border-r border-slate-700/50">${(row.Faltante_Calc > 0 ? row.Faltante_Calc : 0).toLocaleString()}</td>
                            <td className="p-3 align-middle">
    <div className="flex items-center gap-2 w-full justify-center">
        <span 
            className="text-xs font-bold w-12 text-right transition-colors duration-300"
            style={{ color: getDynamicColor(percent) }}
        >
            {percent.toFixed(1)}%
        </span>
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                    width: `${Math.min(percent, 100)}%`,
                    backgroundColor: getDynamicColor(percent) 
                }}
            ></div>
        </div>
    </div>
</td>
                        </tr>
                    );
                })}
            </React.Fragment>
        ))}
    </tbody>
    <tfoot className="sticky bottom-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
        <tr className="bg-[#050B14] border-t border-slate-700/50 text-white font-black">
            {/* Textos del footer más grandes y con bordes a juego */}
            <td colSpan={2} className="p-4 text-[13px] uppercase tracking-widest text-center border-r border-slate-700/50 text-slate-200">TOTAL</td>
            <td className="p-4 text-[13px] text-center font-black text-cyan-400 border-r border-slate-700/50">{totals.cuentas.toLocaleString()}</td>
            <td className="p-4 text-[13px] text-right font-mono border-r border-slate-700/50">${totals.meta.toLocaleString()}</td>
            <td className="p-4 text-[13px] text-right font-mono text-emerald-400 border-r border-slate-700/50">${totals.recaudo.toLocaleString()}</td>
            <td className="p-4 text-[13px] text-right font-mono text-red-400 border-r border-slate-700/50">${totals.faltante.toLocaleString()}</td>
           <td className="p-4">
    <div className="flex items-center gap-2 w-full justify-center">
        <span 
            className="text-[13px] font-black w-12 text-right transition-colors duration-300"
            style={{ color: getDynamicColor(totals.cumplimiento) }}
        >
            {totals.cumplimiento.toFixed(1)}%
        </span>
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                    width: `${Math.min(totals.cumplimiento, 100)}%`,
                    backgroundColor: getDynamicColor(totals.cumplimiento) 
                }}
            ></div>
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

// ============= RANKING TABLE =============
const RankingTable = ({ data = [], title, jobId }) => {
    const safeData = Array.isArray(data) ? data : [];

    const getDynamicColor = (val) => {
        if (val <= 20) return '#ef4444'; // Rojo
        if (val <= 40) return '#f59e0b'; // Naranja
        if (val <= 60) return '#eab308'; // Amarillo
        if (val <= 80) return '#10b981'; // Verde
        return '#8b5cf6';                // Morado
    };
    
    const [currentPage, setCurrentPage] = React.useState(1);
    const rowsPerPage = 10;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [safeData.length]);

    const totalPages = Math.max(1, Math.ceil(safeData.length / rowsPerPage));
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    
    const indexOfLastRow = validPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = safeData.slice(indexOfFirstRow, indexOfLastRow);

    
    // Función para truncar a 2 decimales exactos SIN aproximar
    const truncateTwoDecimals = (num) => {
        return (Math.trunc(num * 100) / 100).toFixed(2);
    };
    const dataLimpiaParaExcel = safeData.map(fila => ({
        "Empresa": fila.Empresa,
        "Call Center": fila.CALL_CENTER_FILTRO,
        "Regional": fila.Regional_Cobro,
        "Zona": fila.Zona,
        "Estado Vigencia": fila.Estado_Vigencia,
        "Cobrador": fila.Cobrador,
        "Meta Total": fila.Meta_Total,
        "Recaudo Total": fila.Recaudo_Total,
        "Cumplimiento %": fila['Cumplimiento_%'],
        "Faltante Calculado": fila.Faltante_Calc
    }));

    return (
       <div className="bg-[#0A192F] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden w-full mt-8 transition-all duration-300">
            <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-indigo-900/30 to-transparent flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-3">
                    <Trophy size={20} className="text-amber-400"/>
                    <h3 className="text-[13px] font-black text-slate-200 uppercase tracking-widest drop-shadow">{title}</h3>
                </div>
                {/* Contenedor del Botón de Excel integrado */}
                <div className="h-8 flex items-stretch min-w-[100px]">
                    <ExportExcel 
        filtros={{ 
            datos_tabla: dataLimpiaParaExcel, 
            titulo: "RANKING DE COBRADORES",
            job_id: jobId 
        }}
        fileName="Ranking_Cobradores.xlsx"
        tableTitle="Ranking de Cobradores" 
        
        // 2. CAMBIA ESTO TAMBIÉN A safeData
        isAvailable={safeData && safeData.length > 0} 
    />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-transparent">
                    <thead>
                        <tr className="border-b border-slate-700/50 bg-white/5">
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Regional</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Zona</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Cobrador</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Meta T.R ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Recaudo ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Faltante ($)</th>
                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider w-48 text-center">Cumplimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {currentRows.length > 0 ? (
                            currentRows.map((row, idx) => {
                                const cump = parseFloat(row['Cumplimiento_%'] || 0);
                                return (
                                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-[10px] font-bold text-slate-300 uppercase">{row.Regional_Cobro || 'S/D'}</td>
                                        <td className="p-3 text-[11px] font-black text-slate-200">{row.Zona || 'S/D'}</td>
                                        <td className="p-3 text-[10px] font-bold text-cyan-200 uppercase">{row.Cobrador || 'S/D'}</td>
                                        <td className="p-3 text-[10px] font-semibold text-slate-300 text-right font-mono">${(Number(row.Meta_Total) || 0).toLocaleString()}</td>
                                        <td className="p-3 text-[10px] font-bold text-emerald-400 text-right font-mono">${(Number(row.Recaudo_Total) || 0).toLocaleString()}</td>
                                        <td className="p-3 text-[10px] font-black text-red-400 text-right font-mono">${(Number(row.Faltante_Calc) > 0 ? Number(row.Faltante_Calc) : 0).toLocaleString()}</td>
                                        <td className="p-3 align-middle">
    <div className="flex items-center gap-2 w-full justify-center">
        <span 
            className="text-xs font-bold w-12 text-right transition-colors duration-300"
            style={{ color: getDynamicColor(cump) }}
        >
            {cump.toFixed(1)}%
        </span>
        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
                className="h-full rounded-full transition-all duration-500" 
                style={{ 
                    width: `${Math.min(cump, 100)}%`,
                    backgroundColor: getDynamicColor(cump) 
                }}
            ></div>
        </div>
    </div>
</td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="7" className="p-8 text-center text-xs font-bold text-slate-500 uppercase">
                                    No hay datos para mostrar
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-white/[0.02] border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                    Viendo {safeData.length > 0 ? indexOfFirstRow + 1 : 0} - {Math.min(indexOfLastRow, safeData.length)} de {safeData.length} registros
                </span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={validPage === 1 || safeData.length === 0} 
                        className="p-2 rounded-lg border border-slate-700/50 bg-[#112240] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={validPage === totalPages || safeData.length === 0} 
                        className="p-2 rounded-lg border border-slate-700/50 bg-[#112240] hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============= MAIN COMPONENT =============
export default function Resultados({ data, selectedFilters, apiClient, jobId }) {
    const [localZona, setLocalZona] = useState("");
    const [showFilters, setShowFilters] = useState(false);

    const processedData = useMemo(() => {
        if (!data) return null;

        const rawResultadosZona = data.resultados_zona || (data.data && data.data.resultados_zona) || [];
        const rawResultadosCobrador = data.resultados_cobrador || (data.data && data.data.resultados_cobrador) || [];

        if (!Array.isArray(rawResultadosZona) || rawResultadosZona.length === 0) return null;

        // ── FILTRO DE NOVEDADES (idéntico a Cartera.jsx applyFilters) ───────────
        // FilterSidebar emite 'Con Novedad' / 'Sin Novedad' bajo selectedFilters.Novedades.
        // Se evalúa fila por fila igual que Cartera para evitar fallos con datos agregados.
        const globalNovedades   = selectedFilters?.Novedades || [];
        const wantsConNovedad   = globalNovedades.some(v => String(v).toLowerCase().includes('con') || parseInt(v) > 0);
        const wantsSinNovedad   = globalNovedades.some(v => String(v).toLowerCase().includes('sin') || String(v) === '0' || parseInt(v) === 0);
        const hayFiltroNovedades = globalNovedades.length > 0;

        // Helper reutilizable — mismo criterio que Cartera.jsx
        const matchesNovedadesFilter = (row) => {
            if (!hayFiltroNovedades) return true;

            const cantNovedades = row['Cantidad_Novedades'] !== undefined
                ? row['Cantidad_Novedades']
                : row['cantidad_novedades'];
            const tipoNovedad = row['Tipo_Novedad'] !== undefined
                ? row['Tipo_Novedad']
                : row['tipo_novedad'];

            // Fila sin campo de novedad (datos agregados) → pasa siempre, igual que Cartera
            if (cantNovedades === undefined && tipoNovedad === undefined) return true;

            let filaTieneNovedad = false;
            if (cantNovedades !== undefined && cantNovedades !== null) {
                filaTieneNovedad = parseInt(cantNovedades) > 0;
            } else if (tipoNovedad !== undefined && tipoNovedad !== null) {
                filaTieneNovedad = String(tipoNovedad).trim().toUpperCase() !== 'SIN NOVEDAD';
            }

            if (wantsConNovedad && filaTieneNovedad)  return true;
            if (wantsSinNovedad && !filaTieneNovedad) return true;
            return false;
        };
        // ────────────────────────────────────────────────────────────────────────

        const gaugeDataFiltered = rawResultadosZona.filter(item => {
            const isCallCenter = item.Zona?.toUpperCase().includes('CALL CENTER');
            if (isCallCenter) return false;

            const globalZonas       = selectedFilters?.Zona || [];
            const globalRegionales  = selectedFilters?.Regional_Cobro || [];
            const globalEmpresas    = selectedFilters?.Empresa || [];
            const globalVigencias   = selectedFilters?.Estado_Vigencia || [];
            const globalFranjas     = selectedFilters?.Franja_Cartera || [];
            const globalCallCenters = selectedFilters?.CALL_CENTER_FILTRO || [];

            const matchesGlobalZona       = globalZonas.length === 0       || globalZonas.includes(item.Zona);
            const matchesGlobalRegional   = globalRegionales.length === 0  || globalRegionales.includes(item.Regional_Cobro);
            const matchesGlobalEmpresa    = globalEmpresas.length === 0    || globalEmpresas.includes(item.Empresa);
            const matchesGlobalVigencia   = globalVigencias.length === 0   || globalVigencias.includes(item.Estado_Vigencia);
            const matchesGlobalFranja     = globalFranjas.length === 0     || globalFranjas.includes(item.Franja_Meta);
            const matchesGlobalCallCenter = globalCallCenters.length === 0 || globalCallCenters.includes(item.CALL_CENTER_FILTRO);
            const matchesLocal            = !localZona || item.Zona === localZona;

            // Aplica el helper de novedades (igual que Cartera: pasa si no tiene el campo)
            const matchesNovedades = matchesNovedadesFilter(item);

            return matchesGlobalZona && matchesGlobalRegional && matchesGlobalEmpresa
                && matchesGlobalVigencia && matchesGlobalFranja && matchesGlobalCallCenter
                && matchesNovedades && matchesLocal;
        });

        const franjasGauges = FRANJAS_CONFIG.map(config => {
            const registros = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );

            const meta = registros.reduce((sum, item) => sum + (Number(item.Meta_Total) || 0), 0);
            const recaudo = registros.reduce((sum, item) => sum + (Number(item.Recaudo_Total) || 0), 0);
            const percent = meta > 0 ? (recaudo / meta) * 100 : 0;

            return {
                ...config,
                value: percent,
                meta: meta,
                recaudo: recaudo,
                faltante: meta > recaudo ? meta - recaudo : 0
            };
        });

        const gRecaudoMetaSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Meta_Total) || 0), 0);
        const gMetaTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Meta_Total) || 0), 0);
        const gRecaudoTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Total) || 0), 0);
        
        const globalStats = {
            value: gRecaudoMetaSum > 0 ? (gRecaudoTotalSum / gRecaudoMetaSum) * 100 : 0,
            metaGauge: gRecaudoMetaSum, 
            metaCards: gMetaTotalSum,   
            recaudo: gRecaudoTotalSum,
            faltante: Math.max(0, gMetaTotalSum - gRecaudoTotalSum),
            cumplimientoCards: gMetaTotalSum > 0 ? (gRecaudoTotalSum / gMetaTotalSum) * 100 : 0,
            cuentasTotal: gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Cuentas || item.Total_Cuentas || 0)), 0)
        };

        const availableZonas = [...new Set(rawResultadosZona
            .filter(z => !z.Zona?.toUpperCase().includes('CALL CENTER'))
            .map(item => item.Zona)
        )].sort();

        const rankingData = rawResultadosCobrador
    .filter(row => {
        const globalZonas       = selectedFilters?.Zona || [];
        const globalRegionales  = selectedFilters?.Regional_Cobro || [];
        const globalEmpresas    = selectedFilters?.Empresa || [];
        const globalVigencias   = selectedFilters?.Estado_Vigencia || [];
        const globalFranjas     = selectedFilters?.Franja_Cartera || [];
        const globalCallCenters = selectedFilters?.CALL_CENTER_FILTRO || [];

        const matchesZona       = globalZonas.length === 0       || globalZonas.includes(row.Zona);
        const matchesRegional   = globalRegionales.length === 0  || globalRegionales.includes(row.Regional_Cobro);
        const matchesEmpresa    = globalEmpresas.length === 0    || globalEmpresas.includes(row.Empresa);
        const matchesVigencia   = globalVigencias.length === 0   || globalVigencias.includes(row.Estado_Vigencia);
        const matchesFranja     = globalFranjas.length === 0     || globalFranjas.includes(row.Franja_Meta);
        const matchesCallCenter = globalCallCenters.length === 0 || globalCallCenters.includes(row.CALL_CENTER_FILTRO);
        const matchesLocal      = !localZona || row.Zona === localZona;

        // Lógica de Novedades para el Ranking (mismo helper que gauges, igual que Cartera)
        const matchesGlobalNovedades = matchesNovedadesFilter(row);

        return matchesZona && matchesRegional && matchesEmpresa && matchesVigencia && matchesFranja && matchesCallCenter && matchesLocal && matchesGlobalNovedades;
    })
            .map(row => {
                const metaVal = Number(row.Meta_Total) || 0;
                const recaudoVal = Number(row.Recaudo_Total) || 0;
                return {
                    ...row,
                    Regional_Cobro: row.Regional_Cobro || 'SIN REGIONAL',
                    Zona: row.Zona || 'SIN ZONA',
                    Cobrador: row.Ejecutivo || row.Cobrador || row.Nombre || 'SIN NOMBRE',
                    'Cumplimiento_%': row['Cumplimiento_%'] !== undefined ? Number(row['Cumplimiento_%']) : (metaVal > 0 ? (recaudoVal / metaVal) : 0),
                    Meta_Total: metaVal,
                    Recaudo_Total: recaudoVal,
                    Faltante_Calc: Math.max(0, metaVal - recaudoVal)
                };
            })
            .sort((a, b) => b['Cumplimiento_%'] - a['Cumplimiento_%']);

        const zonesByFranjaTemp = {};
        FRANJAS_CONFIG.forEach(config => {
            const regs = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );
            
            const agrupados = {};
            regs.forEach(r => {
                const key = `${r.Regional_Cobro || 'SIN REGIONAL'}-${r.Zona || 'SIN ZONA'}`;
                if (!agrupados[key]) agrupados[key] = { 
                    Regional_Cobro: r.Regional_Cobro || 'SIN REGIONAL', 
                    Zona: r.Zona || 'SIN ZONA', 
                    Meta_Total: 0, 
                    Recaudo_Total: 0,
                    Cuentas: 0, 
                };
                agrupados[key].Meta_Total += Number(r.Meta_Total) || 0;
                agrupados[key].Recaudo_Total += Number(r.Recaudo_Total) || 0;
                agrupados[key].Cuentas += Number(r.Cuentas || r.Total_Cuentas || 1);
            });

            zonesByFranjaTemp[config.key] = Object.values(agrupados)
                .map(item => {
                    const metaVal = item.Meta_Total || 0;
                    const recaudoVal = item.Recaudo_Total || 0;
                    return {
                        Regional_Cobro: item.Regional_Cobro,
                        Zona: item.Zona,
                        Cuentas: item.Cuentas,
                        'Cumplimiento_%': metaVal > 0 ? (recaudoVal / metaVal) * 100 : 0,
                        Meta_Total: metaVal,
                        Recaudo_Total: recaudoVal,
                        Faltante_Calc: Math.max(0, metaVal - recaudoVal)
                    };
                })
                .sort((a, b) => b.Faltante_Calc - a.Faltante_Calc);
        });

        return { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas };
    }, [data, localZona, selectedFilters]);

    if (!processedData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-gradient-to-br from-[#041830] to-[#0b2241] rounded-2xl shadow-xl border border-white/10 w-full">
                <AlertCircle size={32} className="mb-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Cargando Resultados...</span>
            </div>
        );
    }

    const { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas } = processedData;

    return (
        <div className="space-y-6 w-full animate-in fade-in duration-700 p-4 md:p-6 bg-gradient-to-br from-[#041223] via-[#081527] to-[#0A192F] min-h-screen rounded-3xl text-slate-200">
            
            {/* Filtro Local */}
            <div className="bg-[#0A192F] rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden transition-all duration-300">
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-cyan-400" />
                        <span className="font-black text-white uppercase tracking-wide text-sm drop-shadow">Filtrar por Zona</span>
                        {localZona && <span className="text-cyan-300 font-black text-xs ml-2">{localZona}</span>}
                    </div>
                    <ChevronDown 
                        size={20} 
                        className={`text-slate-400 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} 
                    />
                </button>

                {showFilters && (
                    <div className="border-t border-slate-700/50 px-6 py-4 bg-[#112240] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="relative flex-1 w-full sm:w-auto">
                            <select 
                                onChange={(e) => setLocalZona(e.target.value)}
                                value={localZona}
                                className="w-full appearance-none bg-[#0A192F] border border-slate-700/50 text-white text-xs font-bold rounded-lg px-3 py-2.5 outline-none cursor-pointer uppercase focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 transition-all"
                            >
                                <option value="" className="text-white">TODAS LAS ZONAS</option>
                                {availableZonas.map(zona => (
                                    <option key={zona} value={zona} className="text-white">{zona}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        {localZona && (
                            <button 
                                onClick={() => setLocalZona("")} 
                                className="text-red-400 hover:text-red-300 font-bold uppercase text-xs tracking-wider transition-colors flex items-center gap-1"
                            >
                                <XCircle size={16} /> Limpiar
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Grid de Velocímetros */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                
                <div className="flex flex-col gap-4 lg:gap-6 w-full h-full">
                    <GaugeWithDetailsCard {...franjasGauges[0]} />
                    <GaugeWithDetailsCard {...franjasGauges[1]} />
                </div>

                <div className="flex w-full h-full">
                    <GaugeWithDetailsCard 
                        title="Cumplimiento T.R (Total)" 
                        value={globalStats.value}
                        meta={globalStats.metaGauge} 
                        recaudo={globalStats.recaudo}
                        faltante={globalStats.faltante}
                        isMain={true} 
                    />
                </div>

                <div className="flex flex-col gap-4 lg:gap-6 w-full h-full">
                    <GaugeWithDetailsCard {...franjasGauges[2]} />
                    <GaugeWithDetailsCard {...franjasGauges[3]} />
                </div>

            </div>

           {/* Cards de Resumen Global */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 w-full">
                
                {/* 1. Meta */}
                <div className="bg-[#0A192F]/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 md:p-5 flex flex-col justify-center relative overflow-hidden group hover:border-slate-500/40 transition-all duration-300">
                    <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 drop-shadow-sm truncate">Meta Total Filtrada</p>
                    <p className="text-xl lg:text-2xl font-black text-white truncate">${globalStats.metaCards.toLocaleString()}</p>
                </div>
                
                {/* 2. Recaudo */}
                <div className="bg-[#0A192F]/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 md:p-5 flex flex-col justify-center relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
                    <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 drop-shadow-sm truncate">Recaudo Total</p>
                    <p className="text-xl lg:text-2xl font-black text-emerald-400 truncate">${globalStats.recaudo.toLocaleString()}</p>
                </div>

                {/* 3. Faltante */}
                <div className="bg-[#0A192F]/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 md:p-5 flex flex-col justify-center relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
                    <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 drop-shadow-sm truncate">Faltante Total</p>
                    <p className="text-xl lg:text-2xl font-black text-red-400 truncate">${globalStats.faltante.toLocaleString()}</p>
                </div>
                
                {/* 4. Cumplimiento */}
                <div className="bg-[#0A192F]/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 md:p-5 flex flex-col justify-center relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
                    <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 drop-shadow-sm truncate">Cumplimiento</p>
                    <p className="text-xl lg:text-2xl font-black text-cyan-400 truncate">
                        {globalStats.cumplimientoCards ? globalStats.cumplimientoCards.toFixed(1) : 0}%
                    </p>
                </div>

                {/* 5. Cuentas */}
                <div className="bg-[#0A192F]/90 backdrop-blur-sm rounded-xl border border-slate-700/50 shadow-lg p-4 md:p-5 flex flex-col justify-center relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
                    <p className="text-[9px] md:text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1 drop-shadow-sm truncate">Cuentas Total</p>
                    <p className="text-xl lg:text-2xl font-black text-amber-400 truncate">
                        {globalStats.cuentasTotal ? globalStats.cuentasTotal.toLocaleString() : 0}
                    </p>
                </div>

            </div>

            {/* Desglose por Franja */}
            <div className="pt-2">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-[#112240] rounded-lg border border-slate-700/50 text-cyan-400"><Layers size={18} /></div>
                    <h3 className="text-sm md:text-base font-black text-white uppercase tracking-wide drop-shadow">Desglose Detallado por Franja</h3>
                </div>
                <div className="grid grid-cols-1 gap-5">
                    {FRANJAS_CONFIG.map(f => (
                        <ZoneMiniTable 
                            key={f.key} 
                            title={f.title} 
                            data={zonesByFranjaTemp[f.key] || []} 
                            count={(zonesByFranjaTemp[f.key] || []).length} 
                            jobId={jobId}
                        />
                    ))}
                </div>
            </div>

            {/* Ranking de Cobradores */}
            <div className="pt-2">
                <RankingTable 
        data={rankingData} 
        title="RANKING DE COBRADORES" 
        jobId={jobId} // <-- AGREGAR ESTA LÍNEA
    />
            </div>
            
        </div>
    );
}