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
    const [localZona, setLocalZona] = useState("");

    const processedData = useMemo(() => {
        if (!data) return null;

        const rawResultadosZona = data.resultados_zona || (data.data && data.data.resultados_zona) || [];
        const rawResultadosCobrador = data.resultados_cobrador || (data.data && data.data.resultados_cobrador) || [];

        if (!Array.isArray(rawResultadosZona) || rawResultadosZona.length === 0) return null;

        // FILTRADO OPTIMIZADO PARA LAS GRÁFICAS Y TABLAS
        const gaugeDataFiltered = rawResultadosZona.filter(item => {
            const isCallCenter = item.Zona?.toUpperCase().includes('CALL CENTER');
            if (isCallCenter) return false;

            const globalZonas = selectedFilters?.Zona || [];
            const globalRegionales = selectedFilters?.Regional_Cobro || [];
            const globalEmpresas = selectedFilters?.Empresa || [];
            
            const matchesGlobalZona = globalZonas.length === 0 || globalZonas.includes(item.Zona);
            const matchesGlobalRegional = globalRegionales.length === 0 || globalRegionales.includes(item.Regional_Cobro);
            const matchesGlobalEmpresa = globalEmpresas.length === 0 || globalEmpresas.includes(item.Empresa);
            const matchesLocal = !localZona || item.Zona === localZona;

            return matchesGlobalZona && matchesGlobalRegional && matchesGlobalEmpresa && matchesLocal;
        });

        // CÁLCULO VELOCÍMETROS PEQUEÑOS (FRANJAS)
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

        // CÁLCULO GLOBAL (VELOCÍMETRO GRANDE)
        const gRecaudoMetaSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Meta_Total) || 0), 0);
        const gMetaTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Meta_Total) || 0), 0);
        const gRecaudoTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Total) || 0), 0);
        
        const globalStats = {
            value: gRecaudoMetaSum > 0 ? (gRecaudoTotalSum / gRecaudoMetaSum) * 100 : 0,
            metaGauge: gRecaudoMetaSum, 
            metaCards: gMetaTotalSum,   
            recaudo: gRecaudoTotalSum,
            faltante: Math.max(0, gMetaTotalSum - gRecaudoTotalSum)
        };

        const availableZonas = [...new Set(rawResultadosZona
            .filter(z => !z.Zona?.toUpperCase().includes('CALL CENTER'))
            .map(item => item.Zona)
        )].sort();

        // CÁLCULO RANKING DE COBRADORES (Enviando las columnas exactas que tu código espera)
        const rankingData = rawResultadosCobrador
            .filter(item => {
                const globalZonas = selectedFilters?.Zona || [];
                const matchesGlobal = globalZonas.length === 0 || globalZonas.includes(item.Zona);
                const matchesLocal = !localZona || item.Zona === localZona;
                return matchesGlobal && matchesLocal;
            })
            .map(row => {
                const metaVal = Number(row.Meta_Total) || 0;
                const recaudoVal = Number(row.Recaudo_Total) || 0;
                return {
                    ...row,
                    Regional_Cobro: row.Regional_Cobro || 'SIN REGIONAL',
                    Zona: row.Zona || 'SIN ZONA',
                    Cobrador: row.Ejecutivo || row.Cobrador || row.Nombre || 'SIN NOMBRE',
                    'Cumplimiento_%': metaVal > 0 ? (recaudoVal / metaVal) * 100 : 0,
                    Meta_Total: metaVal,
                    Recaudo_Total: recaudoVal,
                    Faltante_Calc: Math.max(0, metaVal - recaudoVal)
                };
            })
            .sort((a, b) => b['Cumplimiento_%'] - a['Cumplimiento_%']);

        // CÁLCULO ZONAS POR FRANJA (Aplanadas para que tu ZoneMiniTable haga su propia agrupación)
        const zonesByFranjaTemp = {};
        FRANJAS_CONFIG.forEach(config => {
            const regs = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );
            
            // Agrupamos primero por Zona y Regional para consolidar las sumas de cada zona
            const agrupados = {};
            regs.forEach(r => {
                const key = `${r.Regional_Cobro || 'SIN REGIONAL'}-${r.Zona || 'SIN ZONA'}`;
                if (!agrupados[key]) agrupados[key] = { 
                    Regional_Cobro: r.Regional_Cobro || 'SIN REGIONAL', 
                    Zona: r.Zona || 'SIN ZONA', 
                    Meta_Total: 0, 
                    Recaudo_Total: 0 
                };
                agrupados[key].Meta_Total += Number(r.Meta_Total) || 0;
                agrupados[key].Recaudo_Total += Number(r.Recaudo_Total) || 0;
            });

            // Luego devolvemos un array plano, como requiere tu nueva ZoneMiniTable
            zonesByFranjaTemp[config.key] = Object.values(agrupados)
                .map(item => {
                    const metaVal = item.Meta_Total || 0;
                    const recaudoVal = item.Recaudo_Total || 0;
                    return {
                        Regional_Cobro: item.Regional_Cobro,
                        Zona: item.Zona,
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
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl shadow-sm border border-slate-100 w-full">
                <AlertCircle size={32} className="mb-4 text-indigo-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest">Cargando Resultados...</span>
            </div>
        );
    }

    const { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas } = processedData;

    return (
        <div className="space-y-8 w-full">
            
            {/* Filtro Local */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4">
                <Filter size={18} className="text-slate-500" />
                <div className="relative w-64">
                    <select 
                        onChange={(e) => setLocalZona(e.target.value)}
                        value={localZona}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-lg px-3 py-2 outline-none cursor-pointer uppercase"
                    >
                        <option value="">TODAS LAS ZONAS</option>
                        {availableZonas.map(zona => (
                            <option key={zona} value={zona}>{zona}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
                {localZona && (
                    <button onClick={() => setLocalZona("")} className="text-red-500 hover:text-red-600 transition-colors">
                        <XCircle size={18} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <GaugeWithDetailsCard 
                        title="CUMPLIMIENTO GLOBAL" 
                        value={globalStats.value}
                        meta={globalStats.metaGauge} 
                        recaudo={globalStats.recaudo}
                        faltante={globalStats.faltante}
                        isMain={true} 
                    />
                </div>
                <div className="space-y-6 flex flex-col justify-center">
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Meta Total Filtrada</p>
                        <p className="text-2xl font-black text-slate-800">${globalStats.metaCards.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Recaudo Total Filtrado</p>
                        <p className="text-2xl font-black text-emerald-600">${globalStats.recaudo.toLocaleString()}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black tracking-widest text-slate-500 uppercase">Faltante Total Filtrado</p>
                        <p className="text-2xl font-black text-red-600">${globalStats.faltante.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {franjasGauges.slice(0, 4).map(f => (
                    <GaugeWithDetailsCard key={f.key} {...f} />
                ))}
            </div>

            <div className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers size={18} /></div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Desglose por Franja Seleccionada</h3>
                </div>
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

            <div className="pt-6">
                <RankingTable data={rankingData} title="RANKING DE COBRADORES" />
            </div>
            
        </div>
    );
}