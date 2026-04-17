import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
    comercialApiService, buildGlobalFilterPayload, buildChartGetParams, 
    processRawData, findKeyInObject, FILTER_KEY_MAP 
} from '../services/comercialService';

export const useTablaRemota = ({ apiClient, jobId, origen, canLoad, onLoadComplete, initialColumns, filterConfig, globalFilters }) => {
    const [tableData, setTableData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, total_pages: 0, total_records: 0, page_size: 15 });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnSearch, setColumnSearch] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [tempFilters, setTempFilters] = useState({});
    const [dynamicOptions, setDynamicOptions] = useState({});

    const extractDynamicOptions = useCallback((data) => {
        if (!data || data.length === 0 || filterConfig.length === 0) return;
        const newOptions = {};
        filterConfig.forEach(({ key }) => {
            const valores = [...new Set(data.map(row => row[key]).filter(v => v !== null && v !== undefined && v !== ''))];
            valores.sort();
            newOptions[key] = valores;
        });
        setDynamicOptions(newOptions);
    }, [filterConfig]);

    const fetchData = useCallback(async (pageToLoad = 1, filtersToApply = activeFilters) => {
        if (!jobId) return;
        setLoading(true);
        try {
            const formattedFilters = {};
            Object.entries(filtersToApply).forEach(([key, value]) => {
                if (value && value !== "") {
                    const backendKey = FILTER_KEY_MAP[key] ?? key;
                    formattedFilters[backendKey] = Array.isArray(value) ? value : [value.trim()];
                }
            });

            const globalPayload = buildGlobalFilterPayload(globalFilters);
            const payload = {
                job_id: jobId, origen, search_term: "", page: pageToLoad, page_size: 15,
                ...globalPayload, ...formattedFilters
            };

            const { data: responseData, meta } = await comercialApiService.fetchTabla(apiClient, payload);

            if (responseData.length > 0 && columns.length === 0) {
                const detectedCols = Object.keys(responseData[0]);
                setColumns(detectedCols);
                if (initialColumns && initialColumns.length > 0) {
                    const orderedVisibleCols = initialColumns.filter(col => detectedCols.includes(col));
                    setVisibleColumns(orderedVisibleCols.length > 0 ? orderedVisibleCols : detectedCols);
                } else {
                    setVisibleColumns(detectedCols);
                }
                extractDynamicOptions(responseData);
            }

            setTableData(responseData);
            setPagination({
                current: meta.page || pageToLoad, total_pages: meta.pages || 0,
                total_records: meta.total || 0, page_size: meta.page_size || 15
            });
            setDataLoaded(true);
        } catch (err) {
            console.error(`Error cargando tabla ${origen}:`, err);
        } finally {
            setLoading(false);
            if (onLoadComplete) onLoadComplete();
        }
    }, [jobId, origen, apiClient, columns.length, initialColumns, onLoadComplete, extractDynamicOptions, globalFilters, activeFilters]);

    useEffect(() => {
        if (jobId && canLoad && !dataLoaded && !loading) fetchData(1, {});
    }, [jobId, canLoad, dataLoaded, loading, fetchData]);

    const globalFiltersKey = useMemo(() => JSON.stringify(globalFilters), [globalFilters]);
    useEffect(() => {
        if (dataLoaded) {
            setActiveFilters({});
            setTempFilters({});
            setPagination({ current: 1, total_pages: 0, total_records: 0, page_size: 15 });
            fetchData(1, {});
        }
    }, [globalFiltersKey]);

    const filtrosExport = useMemo(() => {
        const formattedFilters = {};
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) {
                const backendKey = FILTER_KEY_MAP[key] ?? key;
                formattedFilters[backendKey] = Array.isArray(value) ? value : [value.trim()];
            }
        });
        const globalPayload = buildGlobalFilterPayload(globalFilters);
        return { 
            job_id: jobId, origen, search_term: "", page: 1, page_size: 100000,
            ...globalPayload, ...formattedFilters,
            columnas_visibles: visibleColumns.length > 0 ? visibleColumns : columns
        };
    }, [jobId, origen, activeFilters, visibleColumns, columns, globalFilters]);

    return {
        state: { tableData, columns, visibleColumns, loading, dataLoaded, pagination, showColumnSelector, columnSearch, activeFilters, tempFilters, dynamicOptions },
        actions: { 
            setColumnSearch, setShowColumnSelector, toggleColumnVisibility: (col) => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]),
            handleMostrarTodas: () => setVisibleColumns(columns), handleOcultarTodas: () => setVisibleColumns([]),
            handlePageChange: (newPage) => { if (newPage >= 1 && newPage <= pagination.total_pages) fetchData(newPage, activeFilters); },
            handleFilterChange: (col, value) => {
                setTempFilters(prev => ({ ...prev, [col]: value }));
                const nextFilters = { ...activeFilters, [col]: value };
                if (!value || value === "") delete nextFilters[col];
                setActiveFilters(nextFilters);
                fetchData(1, nextFilters);
            },
            applyFilter: (col) => {
                const value = tempFilters[col];
                const newFilters = { ...activeFilters, [col]: value };
                if (!value) delete newFilters[col];
                setActiveFilters(newFilters);
                fetchData(1, newFilters);
            },
            clearFilters: () => { setTempFilters({}); setActiveFilters({}); fetchData(1, {}); }
        },
        derived: { filteredColumns: columns.filter(col => col.toLowerCase().includes(columnSearch.toLowerCase())), filtrosExport }
    };
};

export const useComercial = (apiClient, jobId, selectedFilters) => {
    const [data, setData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(false);
    const [error, setError] = useState(null);
    const [loadStep, setLoadStep] = useState(0);
    const [chartFilters, setChartFilters] = useState({ Estado: '', Analista_Asociado: '', Regional_Venta: '' });
    const prevJobIdRef = useRef(null);

    const filtersWithoutVigencia = useMemo(() => {
        const { Estado_Vigencia, ...rest } = selectedFilters || {};
        return rest;
    }, [selectedFilters]);

    useEffect(() => {
        if (!jobId) return;

        const isNewJob = prevJobIdRef.current !== jobId;
        prevJobIdRef.current = jobId;

        setLoadingCharts(true);
        setError(null);

        if (isNewJob) {
            setData([]);
            setLoadStep(0);
            setChartFilters({ Estado: '', Analista_Asociado: '', Regional_Venta: '' });
        }

        const chartParams = buildChartGetParams(filtersWithoutVigencia);

        comercialApiService.fetchResumen(apiClient, jobId, chartParams)
            .then(resData => {
                const foundData = findKeyInObject(resData, 'fnz_resumen');
                setData(Array.isArray(foundData) ? foundData : []);
            })
            .catch(err => {
                console.error("Error comercial:", err);
                setError("Error cargando resumen.");
            })
            .finally(() => {
                setLoadingCharts(false);
                setLoadStep(prev => (isNewJob ? 1 : (prev > 0 ? prev : 1)));
            });
    }, [jobId, apiClient, filtersWithoutVigencia]);

    const handleStepComplete = useCallback((currentStep) => {
        setLoadStep(prev => prev === currentStep ? prev + 1 : prev);
    }, []);

    const rawDataProcessed = useMemo(() => processRawData(data), [data]);

    const filteredData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.filter(item => {
            const estado = String(item.Estado || item.estado || '').toUpperCase().trim();
            const analista = String(item.Analista_Asociado || item.analista_asociado || '').trim();
            const regional = String(item.Regional_Venta || item.regional_venta || item.Regional || item.regional || item.Regional_Cobro || item.regional_cobro || '').trim();

            if (chartFilters.Estado && estado !== chartFilters.Estado.toUpperCase().trim()) return false;
            if (chartFilters.Analista_Asociado && analista !== chartFilters.Analista_Asociado.trim()) return false;
            if (chartFilters.Regional_Venta && regional !== chartFilters.Regional_Venta.trim()) return false;
            return true;
        });
    }, [data, chartFilters]);

    const filteredDataProcessed = useMemo(() => processRawData(filteredData), [filteredData]);
    const chartData = useMemo(() => filteredDataProcessed.processedData.slice(0, 15), [filteredDataProcessed.processedData]);

    return {
        state: { data, loadingCharts, error, loadStep, chartFilters, filtersWithoutVigencia },
        actions: { setChartFilters, clearChartFilters: () => setChartFilters({ Estado: '', Analista_Asociado: '', Regional_Venta: '' }), handleStepComplete },
        dataSets: { raw: rawDataProcessed, filtered: filteredDataProcessed, chartData, filteredDataList: filteredData }
    };
};