import React, { useMemo, useState } from 'react';
import { Layers, Filter, XCircle, ChevronDown, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { GaugeWithDetailsCard, RankingTable, ZoneMiniTable, COLOR_MAP } from './DashboardComponents';

const FRANJAS_CONFIG = [
    { key: '1 A 30', title: '1 A 30 DÍAS', color: COLOR_MAP['1 A 30'] }, 
    { key: '31 A 90', title: '31 A 90 DÍAS', color: COLOR_MAP['31 A 90'] },
    { key: '91 A 180', title: '91 A 180 DÍAS', color: COLOR_MAP['91 A 180'] }, 
    { key: '181 A 360', title: '181 A 360 DÍAS', color: COLOR_MAP['181 A 360'] }
];

export default function Resultados({ data, selectedFilters }) {
    // Estado para el filtro de zona interno del componente (Dropdown local)
    const [localZona, setLocalZona] = useState("");

    const processedData = useMemo(() => {
        if (!data) return null;

        const rawResultadosZona = 
            data.resultados_zona || 
            (data.data && data.data.resultados_zona) || 
            [];

        const rawResultadosCobrador = 
            data.resultados_cobrador || 
            (data.data && data.data.resultados_cobrador) || 
            [];

        if (!Array.isArray(rawResultadosZona) || rawResultadosZona.length === 0) return null;

        // --- 1. LÓGICA DE FILTRADO INTEGRAL (SIDEBAR GLOBAL + SELECTOR LOCAL) ---
        const gaugeDataFiltered = rawResultadosZona.filter(item => {
            // Excluir Call Center de las métricas de resultados
            const isCallCenter = item.Zona?.toUpperCase().includes('CALL CENTER');
            if (isCallCenter) return false;

            // A. Filtros desde el Sidebar (Global)
            const globalZonas = selectedFilters?.Zona || [];
            const globalRegionales = selectedFilters?.Regional_Cobro || [];
            const globalEmpresas = selectedFilters?.Empresa || [];
            
            const matchesGlobalZona = globalZonas.length === 0 || globalZonas.includes(item.Zona);
            const matchesGlobalRegional = globalRegionales.length === 0 || globalRegionales.includes(item.Regional_Cobro);
            const matchesGlobalEmpresa = globalEmpresas.length === 0 || globalEmpresas.includes(item.Empresa);

            // B. Filtro desde el Dropdown (Local)
            const matchesLocal = !localZona || item.Zona === localZona;

            return matchesGlobalZona && matchesGlobalRegional && matchesGlobalEmpresa && matchesLocal;
        });

        // --- 2. CÁLCULO DE FRANJAS (VELOCÍMETROS PEQUEÑOS - BASADOS EN META_TOTAL) ---
        const franjasGauges = FRANJAS_CONFIG.map(config => {
            const registros = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && 
                item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );

            const meta = registros.reduce((sum, item) => sum + (parseFloat(item.Meta_Total) || 0), 0);
            const recaudo = registros.reduce((sum, item) => sum + (parseFloat(item.Recaudo_Total) || 0), 0);
            const percent = meta > 0 ? (recaudo / meta) * 100 : 0;

            return {
                ...config,
                value: percent,
                meta,
                recaudo,
                faltante: meta > recaudo ? meta - recaudo : 0
            };
        });

        // --- 3. CÁLCULO GLOBAL (VELOCÍMETRO CENTRAL Y TARJETAS) ---
        const gRecaudoMetaSum = gaugeDataFiltered.reduce((sum, item) => sum + (parseFloat(item.Recaudo_Meta_Total) || 0), 0);
        const gMetaTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (parseFloat(item.Meta_Total) || 0), 0);
        const gRecaudoTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (parseFloat(item.Recaudo_Total) || 0), 0);
        
        const globalStats = {
            value: gRecaudoMetaSum > 0 ? (gRecaudoTotalSum / gRecaudoMetaSum) * 100 : 0,
            metaGauge: gRecaudoMetaSum, 
            metaCards: gMetaTotalSum,   
            recaudo: gRecaudoTotalSum,
            faltante: gMetaTotalSum > gRecaudoTotalSum ? gMetaTotalSum - gRecaudoTotalSum : 0
        };

        // --- 4. ZONAS DISPONIBLES PARA EL SELECTOR LOCAL ---
        const availableZonas = [...new Set(rawResultadosZona
            .filter(z => !z.Zona?.toUpperCase().includes('CALL CENTER'))
            .map(item => item.Zona)
        )].sort();

        // --- 5. RANKING DE COBRADORES (FILTRADO POR GLOBAL + LOCAL) ---
        const rankingData = rawResultadosCobrador
            .filter(item => {
                const globalZonas = selectedFilters?.Zona || [];
                const matchesGlobal = globalZonas.length === 0 || globalZonas.includes(item.Zona);
                const matchesLocal = !localZona || item.Zona === localZona;
                return matchesGlobal && matchesLocal;
            })
            .map(row => ({
                ...row,
                Meta_Total: parseFloat(row.Meta_Total) || 0,
                Recaudo_Total: parseFloat(row.Recaudo_Total) || 0,
                Faltante_Calc: Math.max(0, (parseFloat(row.Meta_Total) || 0) - (parseFloat(row.Recaudo_Total) || 0)),
                'Cumplimiento_%': (parseFloat(row.Meta_Total) || 0) > 0 ? ((parseFloat(row.Recaudo_Total) || 0) / (parseFloat(row.Meta_Total) || 0)) * 100 : 0
            })).sort((a, b) => b.Faltante_Calc - a.Faltante_Calc);

        // --- 6. TABLAS POR FRANJA (DETALLE) ---
        const zonesByFranjaTemp = {};
        FRANJAS_CONFIG.forEach(config => {
            const regs = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );
            const agrupados = {};
            regs.forEach(r => {
                const key = `${r.Regional_Cobro || 'S/D'}-${r.Zona || 'S/D'}`;
                if (!agrupados[key]) agrupados[key] = { ...r, Meta_Total: 0, Recaudo_Total: 0 };
                agrupados[key].Meta_Total += parseFloat(r.Meta_Total) || 0;
                agrupados[key].Recaudo_Total += parseFloat(r.Recaudo_Total) || 0;
            });

            // CORRECCIÓN: Usamos Faltante_Calc para que coincida con lo que espera el componente de tabla
            zonesByFranjaTemp[config.key] = Object.values(agrupados)
                .map(item => {
                    const meta = item.Meta_Total || 0;
                    const recaudo = item.Recaudo_Total || 0;
                    const faltante = meta > recaudo ? meta - recaudo : 0;
                    return {
                        ...item,
                        Faltante_Calc: faltante,
                        'Cumplimiento_%': meta > 0 ? (recaudo / meta) * 100 : 0
                    };
                })
                .sort((a, b) => b.Faltante_Calc - a.Faltante_Calc);
        });

        return { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas };
    }, [data, localZona, selectedFilters]);

    if (!processedData) return null;
    const { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas } = processedData;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-20">
            
            {/* SELECTOR DE ZONA LOCAL */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><Filter size={18} /></div>
                        <div>
                            <h2 className="text-[11px] font-black text-slate-800 uppercase italic tracking-widest">Análisis Detallado</h2>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Sincronizado con Sidebar Global</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative min-w-[250px]">
                            <select 
                                onChange={(e) => setLocalZona(e.target.value)}
                                value={localZona}
                                className="w-full appearance-none bg-slate-50 border border-slate-100 text-slate-700 text-[11px] font-black uppercase rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
                            >
                                <option value="">TODAS LAS ZONAS FILTRADAS</option>
                                {availableZonas.map(zona => (
                                    <option key={zona} value={zona}>{zona}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                        {localZona && (
                            <button onClick={() => setLocalZona("")} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <XCircle size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* GRÁFICOS DE VELOCÍMETROS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {franjasGauges.slice(0, 2).map(f => (
                        <GaugeWithDetailsCard key={f.key} {...f} />
                    ))}
                </div>

                <div className="lg:col-span-6">
                    <GaugeWithDetailsCard 
                        title="CUMPLIMIENTO GLOBAL (VS RECAUDO META)" 
                        value={globalStats.value}
                        meta={globalStats.metaGauge} 
                        recaudo={globalStats.recaudo}
                        faltante={globalStats.faltante}
                        isMain={true} 
                    />
                </div>

                <div className="lg:col-span-3 flex flex-col gap-6">
                    {franjasGauges.slice(2, 4).map(f => (
                        <GaugeWithDetailsCard key={f.key} {...f} />
                    ))}
                </div>
            </div>

            {/* TARJETAS DE RESUMEN */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Target size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Total Filtrada</p>
                        <p className="text-xl font-black text-slate-800">${globalStats.metaCards.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><TrendingUp size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recaudo Total Filtrado</p>
                        <p className="text-xl font-black text-slate-800">${globalStats.recaudo.toLocaleString()}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl"><AlertCircle size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faltante Total Filtrado</p>
                        <p className="text-xl font-black text-red-600">${globalStats.faltante.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* TABLAS DETALLE POR FRANJA */}
            <div className="space-y-4 pt-6">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers size={18} /></div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Desglose por Franja Seleccionada</h3>
                </div>
                {/* MODIFICACIÓN AQUÍ: Se eliminó lg:grid-cols-2 para que siempre sea una columna */}
                <div className="grid grid-cols-1 gap-6">
                    {FRANJAS_CONFIG.map(f => (
                        <ZoneMiniTable 
                            key={f.key} 
                            title={f.title} 
                            data={zonesByFranjaTemp[f.key] || []} 
                            count={(zonesByFranjaTemp[f.key] || []).length} 
                        />
                    ))}
                </div>
            </div>

            <RankingTable data={rankingData} title="Ranking de Cobradores (Filtrado)" />
        </div>
    );
}