import { getSafeColor } from '..//DashboardComponents';

// ─── PALETA DE COLORES ────────────────────────────────────────────────────────
export const MAPA_COLORES_IMAGEN = {
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

export const EMPTY_NAMES = new Set(['SIN ASIGNAR', 'SIN DATO', 'N/A', 'NULL', '']);
export const HIDDEN_NAMES = new Set(['SIN ASIGNAR', 'SIN GESTIÓN', 'SIN GESTION', 'N/A']);

// ─── FUNCIONES PURAS DE DOMINIO ───────────────────────────────────────────────
export const getChartColor = (name, _parentName = null) => {
    const upperName = String(name || '').toUpperCase().trim();
    if (EMPTY_NAMES.has(upperName)) return '#475569';
    if (MAPA_COLORES_IMAGEN[upperName]) return MAPA_COLORES_IMAGEN[upperName];
    return getSafeColor(upperName);
};

// Función pura para filtrar la data de las tablas basado en los selectores
export const applyLocalFilters = (dataSet, filters) => {
    if (!Array.isArray(dataSet) || dataSet.length === 0) return dataSet;
    const entries = Object.entries(filters);
    
    return dataSet.filter(item => 
        entries.every(([key, values]) => {
            if (!values || values.length === 0) return true;
            return String(item[key] || '').trim().toUpperCase() === String(values).toUpperCase();
        })
    );
};