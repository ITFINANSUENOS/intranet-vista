import { useMemo, useState, useEffect, useCallback } from 'react';
import {
    fetchPaginatedCallCenter,
    buildPayloadCallCenter,
    buildPayloadCallCenterGestion,
    buildExportPayloadCallCenter,
    buildExportPayloadCallCenterGestion
} from '../services/callCenterService';

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES DE FORMATO (reutilizables en la UI)
// ─────────────────────────────────────────────────────────────────────────────

export const PIE_COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#eab308'];

export const getDynamicColor = (val) => {
    if (val <= 20) return '#ef4444';
    if (val <= 40) return '#f59e0b';
    if (val <= 60) return '#eab308';
    if (val <= 80) return '#10b981';
    return '#8b5cf6';
};

export const formatCurrency = (value) => {
    if (!value || isNaN(value)) return '$0';
    return new Intl.NumberFormat('es-CO', {
        style:                 'currency',
        currency:              'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
};

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 1: Gestión de pestañas (Llamadas / Mensajerías / Novedades)
// ─────────────────────────────────────────────────────────────────────────────

export function useCallCenterTabs(defaultTab = 'llamadas') {
    const [activeTab, setActiveTab] = useState(defaultTab);
    return { activeTab, setActiveTab };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 2: Procesamiento de datos para gráficos y tabla de resumen
// ─────────────────────────────────────────────────────────────────────────────

export function useCallCenterCharts(data, selectedFilters) {
    // Gráfico de barras: rendimiento por asesor
    const chartData = useMemo(() => {
        let reporteRaw = [];
        if (Array.isArray(data))                             reporteRaw = data;
        else if (Array.isArray(data?.reporte_raw))           reporteRaw = data.reporte_raw;
        else if (Array.isArray(data?.data?.reporte_raw))     reporteRaw = data.data.reporte_raw;

        if (selectedFilters) {
            reporteRaw = reporteRaw.filter(item => {
                const matchEmpresa = !selectedFilters.Empresa?.length || selectedFilters.Empresa.includes(item.Empresa);
                const matchCall    = !selectedFilters.CALL_CENTER_FILTRO?.length || selectedFilters.CALL_CENTER_FILTRO.includes(item.CALL_CENTER);
                return matchEmpresa && matchCall;
            });
        }

        return reporteRaw.map(item => {
            let val = item.Cumplimiento;
            if (typeof val === 'string') val = val.replace(',', '.');
            const cumplimientoNum = Number(val) || 0;
            const pct = (cumplimientoNum * 100).toFixed(2);
            return {
                ...item,
                CALL_CENTER: item.CALL_CENTER || 'Desconocido',
                porcentaje:  Number(pct)
            };
        }).sort((a, b) => b.porcentaje - a.porcentaje);
    }, [data, selectedFilters]);

    // Gráfico circular: distribución de rodamiento
    const pieData = useMemo(() => {
        let rawData = [];
        if (Array.isArray(data?.rodamiento_data))       rawData = data.rodamiento_data;
        else if (Array.isArray(data?.data?.rodamiento_data)) rawData = data.data.rodamiento_data;

        if (!rawData.length) return [];

        const total = rawData.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

        return rawData.map(item => ({
            ...item,
            count:      Number(item.count) || 0,
            percentage: total > 0 ? ((Number(item.count) || 0) / total * 100).toFixed(2) : 0
        })).sort((a, b) => b.count - a.count);
    }, [data]);

    // Totales para las tarjetas de resumen
    const tableTotals = useMemo(() => {
        const totals = chartData.reduce((acc, curr) => {
            acc.meta     += Number(curr['META_$'])      || 0;
            acc.recaudo  += Number(curr.Recaudo_Meta)   || 0;
            acc.faltante += Number(curr.Faltante)       || 0;
            return acc;
        }, { meta: 0, recaudo: 0, faltante: 0 });

        const cumplimientoTotal = totals.meta > 0
            ? ((totals.recaudo / totals.meta) * 100).toFixed(2)
            : 0;

        return { ...totals, cumplimientoTotal };
    }, [chartData]);

    return { chartData, pieData, tableTotals };
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDAD INTERNA: genera columnas desde las claves de un item
// ─────────────────────────────────────────────────────────────────────────────
const buildColumns = (item) =>
    Object.keys(item)
        .filter(k => k !== 'id' && !k.startsWith('_'))
        .map(k => ({ key: k, label: k.replace(/_/g, ' ') }));

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 3: Tabla remota "Detalle de Operación Call Center"
// ─────────────────────────────────────────────────────────────────────────────

export function useTablaRemotaCallCenter(apiClient, jobId, origen, selectedFilters) {
    const [data, setData]               = useState([]);
    const [allColumns, setAllColumns]   = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [loading, setLoading]         = useState(false);
    const [pagination, setPagination]   = useState({ current: 1, total_pages: 0, total_records: 0 });

    const [localFilters, setLocalFilters] = useState({
        Rodamiento:     '',
        Estado_Gestion: '',
        Estado_Pago:    '',
        Tipo_Novedad:   ''
    });

    const fetchData = useCallback(async (pageToFetch = 1) => {
        if (!jobId || !apiClient) return;
        setLoading(true);
        try {
            const payload = buildPayloadCallCenter(jobId, origen, pageToFetch, localFilters, selectedFilters);
            const { items, meta } = await fetchPaginatedCallCenter(apiClient, payload);

            setData(items);
            setPagination({
                current:       meta.page  || pageToFetch,
                total_pages:   meta.pages || 0,
                total_records: meta.total || 0
            });

            if (items.length > 0 && allColumns.length === 0) {
                const cols = buildColumns(items[0]);
                setAllColumns(cols);
                setVisibleColumns(cols.slice(0, 5).map(c => c.key));
            }
        } catch (error) {
            console.error('Error cargando tabla de Call Center:', error);
        } finally {
            setLoading(false);
        }
    }, [apiClient, jobId, origen, allColumns.length, localFilters, selectedFilters]);

    useEffect(() => {
        fetchData(1);
    }, [jobId, localFilters, selectedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChange = useCallback((filterName, value) => {
        setLocalFilters(prev => ({ ...prev, [filterName]: value }));
    }, []);

    const handlePageChange = useCallback((newPage) => {
        fetchData(newPage);
    }, [fetchData]);

    const toggleColumn = useCallback((key) => {
        setVisibleColumns(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const filtrosExport = useMemo(
        () => buildExportPayloadCallCenter(jobId, origen, visibleColumns, localFilters),
        [jobId, origen, visibleColumns, localFilters]
    );

    const columnsToRender = useMemo(
        () => allColumns.filter(col => visibleColumns.includes(col.key)),
        [allColumns, visibleColumns]
    );

    return {
        data,
        allColumns,
        visibleColumns,
        loading,
        pagination,
        localFilters,
        columnsToRender,
        filtrosExport,
        handleFilterChange,
        handlePageChange,
        toggleColumn
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK 4: Tabla remota "Call Center – Gestión y Novedades"
// ─────────────────────────────────────────────────────────────────────────────

export function useTablaRemotaCallCenterGestion(apiClient, jobId, origen, selectedFilters) {
    const [dataCG, setDataCG]               = useState([]);
    const [allColumnsCG, setAllColumnsCG]   = useState([]);
    const [visibleColumnsCG, setVisibleColumnsCG] = useState([]);
    const [loadingCG, setLoadingCG]         = useState(false);
    const [paginationCG, setPaginationCG]   = useState({ current: 1, total_pages: 0, total_records: 0 });

    const [localFiltersCG, setLocalFiltersCG] = useState({
        CALL_CENTER_FILTRO: '',
        Estado_Gestion:     '',
        Tipo_Novedad:       ''
    });

    const fetchDataCG = useCallback(async (pageToFetch = 1) => {
        if (!jobId || !apiClient) return;
        setLoadingCG(true);
        try {
            const payload = buildPayloadCallCenterGestion(jobId, origen, pageToFetch, localFiltersCG, selectedFilters);
            let { items, meta } = await fetchPaginatedCallCenter(apiClient, payload);

            // Filtro del lado cliente por CALL_CENTER
            if (localFiltersCG.CALL_CENTER_FILTRO) {
                const cc = localFiltersCG.CALL_CENTER_FILTRO.toUpperCase();
                items = items.filter(row => {
                    const val = (row.CALL_CENTER || row.call_center || '').toString().toUpperCase();
                    return val === cc || val.includes(cc);
                });
            }

            setDataCG(items);
            setPaginationCG({
                current:       meta.page    || pageToFetch,
                total_pages:   meta.pages   || 0,
                total_records: items.length || 0
            });

            if (items.length > 0 && allColumnsCG.length === 0) {
                const cols = buildColumns(items[0]);
                setAllColumnsCG(cols);
                setVisibleColumnsCG(cols.slice(0, 8).map(c => c.key));
            }
        } catch (error) {
            console.error('Error cargando tabla Call Center Gestión:', error);
        } finally {
            setLoadingCG(false);
        }
    }, [apiClient, jobId, origen, allColumnsCG.length, localFiltersCG, selectedFilters]);

    useEffect(() => {
        fetchDataCG(1);
    }, [jobId, localFiltersCG, selectedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleFilterChangeCG = useCallback((filterName, value) => {
        setLocalFiltersCG(prev => ({ ...prev, [filterName]: value }));
    }, []);

    const handlePageChangeCG = useCallback((newPage) => {
        fetchDataCG(newPage);
    }, [fetchDataCG]);

    const toggleColumnCG = useCallback((key) => {
        setVisibleColumnsCG(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }, []);

    const filtrosExportCG = useMemo(
        () => buildExportPayloadCallCenterGestion(jobId, origen, visibleColumnsCG, localFiltersCG),
        [jobId, origen, visibleColumnsCG, localFiltersCG]
    );

    const columnsToRenderCG = useMemo(
        () => allColumnsCG.filter(col => visibleColumnsCG.includes(col.key)),
        [allColumnsCG, visibleColumnsCG]
    );

    return {
        dataCG,
        allColumnsCG,
        visibleColumnsCG,
        loadingCG,
        paginationCG,
        localFiltersCG,
        columnsToRenderCG,
        filtrosExportCG,
        handleFilterChangeCG,
        handlePageChangeCG,
        toggleColumnCG
    };
}