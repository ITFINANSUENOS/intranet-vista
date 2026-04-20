import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// Asegúrate de que la ruta coincida con la ubicación de tu archivo service
import { detalladoService } from '../services/detalladoService';

// Función auxiliar privada dentro del hook para estandarizar los filtros
const buildMappedFilters = (selectedFilters, isExport = false) => {
    const filtroNovedades = selectedFilters?.Novedades || [];
    const tieneSinNovedad = filtroNovedades.some(n => n.toLowerCase().includes('sin novedad'));
    const tieneConNovedad = filtroNovedades.some(n => n.toLowerCase().includes('con novedad'));
    
    let cantidadNovedades = undefined;
    if (tieneSinNovedad && !tieneConNovedad) {
        cantidadNovedades = isExport ? 0 : [0]; // 0 numérico para exportar, arreglo para buscar
    } else if (tieneConNovedad && !tieneSinNovedad) {
        cantidadNovedades = isExport ? 1 : [1]; // 1 numérico para exportar, arreglo para buscar
    }

    const mappedFilters = {
        empresa: selectedFilters?.Empresa || [],
        call_center_filtro: selectedFilters?.CALL_CENTER_FILTRO || [],
        zona: selectedFilters?.Zona || [],
        regional_cobro: selectedFilters?.Regional_Cobro || [],
        franja: selectedFilters?.Franja_Cartera || [],
        estado_vigencia: selectedFilters?.Estado_Vigencia || []
    };

    if (cantidadNovedades !== undefined) {
        mappedFilters.Cantidad_Novedades = cantidadNovedades;
    }

    // Limpiar claves nulas o vacías conservando los ceros válidos
    Object.keys(mappedFilters).forEach(key => {
        const value = mappedFilters[key];
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            delete mappedFilters[key];
        }
    });

    return mappedFilters;
};

export const useTablaRemota = ({ apiClient, jobId, origen, selectedFilters }) => {
    const [data, setData] = useState([]);
    const [allColumns, setAllColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [pagination, setPagination] = useState({ current: 1, total_pages: 0, total_records: 0 });
    
    const debounceSearch = useRef(null);

    const fetchData = useCallback(async (pageToFetch = 1, searchTerm = search) => {
        if (!jobId) return;
        
        setLoading(true);
        try {
            const mappedFilters = buildMappedFilters(selectedFilters, false);
            const payload = {
                job_id: jobId,
                origen: origen, 
                page: pageToFetch,
                page_size: 20,
                search_term: searchTerm,
                ...mappedFilters 
            };
            
            // CORRECCIÓN AQUÍ: detalladoService (con doble 'L')
            const result = await detalladoService.buscar(apiClient, payload);
            
            setData(result.data);
            setPagination({
                current: result.meta.page || pageToFetch,
                total_pages: result.meta.pages || 0,
                total_records: result.meta.total || 0
            });

            // Generación dinámica de columnas
            if (result.data.length > 0 && allColumns.length === 0) {
                const keys = Object.keys(result.data[0]).filter(k => k !== 'id' && !k.startsWith('_'));
                const generatedCols = keys.map(k => ({ key: k, label: k.replace(/_/g, ' ') }));
                setAllColumns(generatedCols);
                setVisibleColumns(generatedCols.slice(0, 5).map(c => c.key));
            }

        } catch (error) {
            console.error("Error cargando tabla remota:", error);
        } finally {
            setLoading(false);
        }
    }, [apiClient, jobId, origen, selectedFilters, allColumns.length, search]);

    useEffect(() => {
        fetchData(1, search);
    }, [fetchData, selectedFilters, jobId]);

    const handleSearch = useCallback((value) => {
        setSearch(value);
        clearTimeout(debounceSearch.current);
        debounceSearch.current = setTimeout(() => {
            fetchData(1, value);
        }, 350);
    }, [fetchData]);

    const handlePageChange = useCallback((newPage) => {
        fetchData(newPage, search);
    }, [fetchData, search]);

    const toggleColumn = useCallback((key) => {
        setVisibleColumns(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }, []);

    const filtrosExport = useMemo(() => {
        const mappedFilters = buildMappedFilters(selectedFilters, true);
        return {
            job_id: jobId,
            origen: origen,
            search_term: search || '',
            page: 1,
            page_size: 100000,
            columnas_visibles: visibleColumns,
            ...mappedFilters
        };
    }, [jobId, origen, search, visibleColumns, selectedFilters]);

    const columnsToRender = useMemo(() => {
        return allColumns.filter(col => visibleColumns.includes(col.key));
    }, [allColumns, visibleColumns]);

    return {
        data,
        allColumns,
        visibleColumns,
        columnsToRender,
        loading,
        search,
        pagination,
        filtrosExport,
        handleSearch,
        handlePageChange,
        toggleColumn
    };
};