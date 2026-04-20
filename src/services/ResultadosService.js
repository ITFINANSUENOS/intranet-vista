import { COLOR_MAP } from '../pages/analisis_datos/DashboardComponents';

export const FRANJAS_CONFIG = [
    { key: '1 A 30', title: '1 A 30 DÍAS', color: COLOR_MAP?.['1 A 30'] || '#10b981' }, 
    { key: '31 A 90', title: '31 A 90 DÍAS', color: COLOR_MAP?.['31 A 90'] || '#f59e0b' },
    { key: '91 A 180', title: '91 A 180 DÍAS', color: COLOR_MAP?.['91 A 180'] || '#ef4444' }, 
    { key: '181 A 360', title: '181 A 360 DÍAS', color: COLOR_MAP?.['181 A 360'] || '#8b5cf6' }
];

export const GAUGE_COLORS = [
    { value: 20, color: '#ef4444' }, // Rojo
    { value: 20, color: '#f59e0b' }, // Naranja
    { value: 20, color: '#eab308' }, // Amarillo
    { value: 20, color: '#10b981' }, // Verde
    { value: 20, color: '#8b5cf6' }, // Morado
];

export const ColorService = {
    getDynamicColor: (val) => {
        if (val <= 20) return '#ef4444';
        if (val <= 40) return '#f59e0b';
        if (val <= 60) return '#eab308';
        if (val <= 80) return '#10b981';
        return '#8b5cf6';
    }
};

export const FilterService = {
    matchesNovedades: (row, globalNovedades = []) => {
        if (!globalNovedades || globalNovedades.length === 0) return true;

        const wantsConNovedad = globalNovedades.some(v => String(v).toLowerCase().includes('con') || parseInt(v) > 0);
        const wantsSinNovedad = globalNovedades.some(v => String(v).toLowerCase().includes('sin') || String(v) === '0' || parseInt(v) === 0);

        const cantNovedades = row['Cantidad_Novedades'] !== undefined ? row['Cantidad_Novedades'] : row['cantidad_novedades'];
        const tipoNovedad = row['Tipo_Novedad'] !== undefined ? row['Tipo_Novedad'] : row['tipo_novedad'];

        if (cantNovedades === undefined && tipoNovedad === undefined) return true;

        let filaTieneNovedad = false;
        if (cantNovedades !== undefined && cantNovedades !== null) {
            filaTieneNovedad = parseInt(cantNovedades) > 0;
        } else if (tipoNovedad !== undefined && tipoNovedad !== null) {
            filaTieneNovedad = String(tipoNovedad).trim().toUpperCase() !== 'SIN NOVEDAD';
        }

        if (wantsConNovedad && filaTieneNovedad) return true;
        if (wantsSinNovedad && !filaTieneNovedad) return true;
        return false;
    },

    matchesGenerales: (item, filters, localZona) => {
        const globalZonas = filters?.Zona || [];
        const globalRegionales = filters?.Regional_Cobro || [];
        const globalEmpresas = filters?.Empresa || [];
        const globalVigencias = filters?.Estado_Vigencia || [];
        const globalFranjas = filters?.Franja_Cartera || [];
        const globalCallCenters = filters?.CALL_CENTER_FILTRO || [];

        const matchesZona = globalZonas.length === 0 || globalZonas.includes(item.Zona);
        const matchesRegional = globalRegionales.length === 0 || globalRegionales.includes(item.Regional_Cobro);
        const matchesEmpresa = globalEmpresas.length === 0 || globalEmpresas.includes(item.Empresa);
        const matchesVigencia = globalVigencias.length === 0 || globalVigencias.includes(item.Estado_Vigencia);
        const matchesFranja = globalFranjas.length === 0 || globalFranjas.includes(item.Franja_Meta);
        const matchesCallCenter = globalCallCenters.length === 0 || globalCallCenters.includes(item.CALL_CENTER_FILTRO);
        const matchesLocal = !localZona || item.Zona === localZona;

        return matchesZona && matchesRegional && matchesEmpresa && 
               matchesVigencia && matchesFranja && matchesCallCenter && matchesLocal;
    }
};

export const AggregationService = {
    calculateGlobalStats: (gaugeDataFiltered) => {
        const gRecaudoMetaSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Meta_Total) || 0), 0);
        const gMetaTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Meta_Total) || 0), 0);
        const gRecaudoTotalSum = gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Recaudo_Total) || 0), 0);
        
        return {
            value: gRecaudoMetaSum > 0 ? (gRecaudoTotalSum / gRecaudoMetaSum) * 100 : 0,
            metaGauge: gRecaudoMetaSum, 
            metaCards: gMetaTotalSum,   
            recaudo: gRecaudoTotalSum,
            faltante: Math.max(0, gMetaTotalSum - gRecaudoTotalSum),
            cumplimientoCards: gMetaTotalSum > 0 ? (gRecaudoTotalSum / gMetaTotalSum) * 100 : 0,
            cuentasTotal: gaugeDataFiltered.reduce((sum, item) => sum + (Number(item.Cuentas || item.Total_Cuentas || 0)), 0)
        };
    },
    
    formatExcelData: (data) => data.map(fila => ({
        "Regional": fila.Regional_Cobro,
        "Zona": fila.Zona,
        "Cuentas": fila.Cuentas,
        "Cumplimiento %": fila['Cumplimiento_%'],
        "Meta Total": fila.Meta_Total,
        "Recaudo": fila.Recaudo_Total,
        "Faltante": fila.Faltante_Calc
    }))
};