import { useState, useMemo, useEffect } from 'react';
import { FilterService, AggregationService, FRANJAS_CONFIG } from '../services/ResultadosService';

export const usePagination = (data, rowsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
    const validPage = Math.min(Math.max(1, currentPage), totalPages);
    
    const indexOfLastRow = validPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = data.slice(indexOfFirstRow, indexOfLastRow);

    return {
        currentPage: validPage,
        totalPages,
        currentRows,
        indexOfFirstRow,
        indexOfLastRow,
        nextPage: () => setCurrentPage(prev => Math.min(prev + 1, totalPages)),
        prevPage: () => setCurrentPage(prev => Math.max(prev - 1, 1))
    };
};

export const useZoneTableData = (data) => {
    return useMemo(() => {
        const groups = {};
        let totalMeta = 0, totalRecaudo = 0, totalFaltante = 0, totalCuentas = 0;

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
                meta: totalMeta, recaudo: totalRecaudo, faltante: totalFaltante, cuentas: totalCuentas,
                cumplimiento: totalMeta > 0 ? (totalRecaudo / totalMeta) * 100 : 0
            }
        };
    }, [data]);
};

export const useDashboardData = (data, selectedFilters, localZona) => {
    return useMemo(() => {
        if (!data) return null;

        const rawResultadosZona = data.resultados_zona || (data.data && data.data.resultados_zona) || [];
        const rawResultadosCobrador = data.resultados_cobrador || (data.data && data.data.resultados_cobrador) || [];

        if (!Array.isArray(rawResultadosZona) || rawResultadosZona.length === 0) return null;

        const gaugeDataFiltered = rawResultadosZona.filter(item => {
            if (item.Zona?.toUpperCase().includes('CALL CENTER')) return false;
            const passesGenerales = FilterService.matchesGenerales(item, selectedFilters, localZona);
            const passesNovedades = FilterService.matchesNovedades(item, selectedFilters?.Novedades);
            return passesGenerales && passesNovedades;
        });

        const franjasGauges = FRANJAS_CONFIG.map(config => {
            const registros = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );
            const meta = registros.reduce((sum, item) => sum + (Number(item.Meta_Total) || 0), 0);
            const recaudo = registros.reduce((sum, item) => sum + (Number(item.Recaudo_Total) || 0), 0);
            return {
                ...config,
                value: meta > 0 ? (recaudo / meta) * 100 : 0,
                meta, recaudo, faltante: Math.max(0, meta - recaudo)
            };
        });

        const globalStats = AggregationService.calculateGlobalStats(gaugeDataFiltered);

        const rankingData = rawResultadosCobrador.filter(row => {
            const passesGenerales = FilterService.matchesGenerales(row, selectedFilters, localZona);
            const passesNovedades = FilterService.matchesNovedades(row, selectedFilters?.Novedades);
            return passesGenerales && passesNovedades;
        }).map(row => {
            const metaVal = Number(row.Meta_Total) || 0;
            const recaudoVal = Number(row.Recaudo_Total) || 0;
            return {
                ...row,
                Regional_Cobro: row.Regional_Cobro || 'SIN REGIONAL',
                Zona: row.Zona || 'SIN ZONA',
                Cobrador: row.Ejecutivo || row.Cobrador || row.Nombre || 'SIN NOMBRE',
                'Cumplimiento_%': row['Cumplimiento_%'] !== undefined ? Number(row['Cumplimiento_%']) : (metaVal > 0 ? (recaudoVal / metaVal) : 0),
                Meta_Total: metaVal, Recaudo_Total: recaudoVal,
                Faltante_Calc: Math.max(0, metaVal - recaudoVal)
            };
        }).sort((a, b) => b['Cumplimiento_%'] - a['Cumplimiento_%']);

        const zonesByFranjaTemp = {};
        FRANJAS_CONFIG.forEach(config => {
            const regs = gaugeDataFiltered.filter(item => 
                item.Franja_Meta && item.Franja_Meta.toString().trim().toUpperCase() === config.key
            );
            
            const agrupados = {};
            regs.forEach(r => {
                const key = `${r.Regional_Cobro || 'SIN REGIONAL'}-${r.Zona || 'SIN ZONA'}`;
                if (!agrupados[key]) agrupados[key] = { 
                    Regional_Cobro: r.Regional_Cobro || 'SIN REGIONAL', Zona: r.Zona || 'SIN ZONA', 
                    Meta_Total: 0, Recaudo_Total: 0, Cuentas: 0, 
                };
                agrupados[key].Meta_Total += Number(r.Meta_Total) || 0;
                agrupados[key].Recaudo_Total += Number(r.Recaudo_Total) || 0;
                agrupados[key].Cuentas += Number(r.Cuentas || r.Total_Cuentas || 1);
            });

            zonesByFranjaTemp[config.key] = Object.values(agrupados).map(item => {
                const metaVal = item.Meta_Total || 0;
                const recaudoVal = item.Recaudo_Total || 0;
                return {
                    ...item,
                    'Cumplimiento_%': metaVal > 0 ? (recaudoVal / metaVal) * 100 : 0,
                    Faltante_Calc: Math.max(0, metaVal - recaudoVal)
                };
            }).sort((a, b) => b.Faltante_Calc - a.Faltante_Calc);
        });

        const availableZonas = [...new Set(rawResultadosZona
            .filter(z => !z.Zona?.toUpperCase().includes('CALL CENTER'))
            .map(item => item.Zona)
        )].sort();

        return { franjasGauges, globalStats, rankingData, zonesByFranjaTemp, availableZonas };
    }, [data, localZona, selectedFilters]);
};