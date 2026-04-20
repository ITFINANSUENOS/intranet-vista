// useCallCenter.js
import { useState, useCallback, useEffect, useMemo } from 'react';
import { callCenterService } from '../services/callCenterService';

export const useCallCenterGestion = ({ origen, apiClient, jobId, selectedFilters }) => {

    // ─── ESTADO DE DATOS Y COLUMNAS ───
    const [dataCG, setDataCG] = useState([]);
    const [allColumnsCG, setAllColumnsCG] = useState([]);
    const [visibleColumnsCG, setVisibleColumnsCG] = useState([]);
    const [loadingCG, setLoadingCG] = useState(false);
    const [paginationCG, setPaginationCG] = useState({
        current: 1,
        total_pages: 0,
        total_records: 0
    });

    // ─── FILTROS LOCALES ───
    const [localFiltersCG, setLocalFiltersCG] = useState({
        Estado_Gestion: '',
        Tipo_Novedad: '',
        Rodamiento: ''
    });

    // ─── FETCH PRINCIPAL ───
    const fetchDataCG = useCallback(async (pageToFetch = 1) => {
        if (!jobId || !apiClient) return;
        setLoadingCG(true);
        try {
            const payload = {
                job_id: jobId,
                origen,
                page: pageToFetch,
                page_size: 10,
            };

            if (localFiltersCG.Estado_Gestion) payload.estado_gestion = [localFiltersCG.Estado_Gestion];
            if (localFiltersCG.Tipo_Novedad)   payload.novedades      = [localFiltersCG.Tipo_Novedad];
            if (localFiltersCG.Rodamiento)     payload.rodamiento     = [localFiltersCG.Rodamiento];

            if (selectedFilters?.Empresa?.length)             payload.empresa      = selectedFilters.Empresa;
            if (selectedFilters?.CALL_CENTER_FILTRO?.length)  payload.call_center  = selectedFilters.CALL_CENTER_FILTRO;

            const result = await callCenterService.buscarDatosWallet(apiClient, payload);

            // Inicializar columnas solo la primera vez que llegan datos
            if (result.data.length > 0 && allColumnsCG.length === 0) {
                const cols = Object.keys(result.data[0]).map(key => ({
                    key,
                    label: key.replace(/_/g, ' ')
                }));
                setAllColumnsCG(cols);
                setVisibleColumnsCG(cols.map(c => c.key));
            }

            setDataCG(result.data);
            setPaginationCG({
                current: result.meta.current_page || pageToFetch,
                total_pages: result.meta.last_page  || 0,
                total_records: result.meta.total    || 0
            });
        } catch (error) {
            console.error("Error en useCallCenterGestion:", error);
        } finally {
            setLoadingCG(false);
        }
    }, [jobId, apiClient, origen, localFiltersCG, selectedFilters, allColumnsCG.length]);

    // Re-fetch automático ante cambios de dependencias
    useEffect(() => { fetchDataCG(1); }, [fetchDataCG]);

    // ─── HANDLERS ───
    const handlePageChangeCG = (newPage) => fetchDataCG(newPage);

    const toggleColumnCG = (key) =>
        setVisibleColumnsCG(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );

    // ─── COLUMNAS VISIBLES (MEMO) ───
    const columnsToRenderCG = useMemo(
        () => allColumnsCG.filter(col => visibleColumnsCG.includes(col.key)),
        [allColumnsCG, visibleColumnsCG]
    );

    // ─── FILTROS PARA EXPORTACIÓN (MEMO) ───
    const filtrosExportCG = useMemo(() => ({
        job_id: jobId,
        origen,
        ...(localFiltersCG.Estado_Gestion && { estado_gestion: [localFiltersCG.Estado_Gestion] }),
        ...(localFiltersCG.Tipo_Novedad   && { novedades:      [localFiltersCG.Tipo_Novedad] }),
        ...(localFiltersCG.Rodamiento     && { rodamiento:     [localFiltersCG.Rodamiento] }),
        ...(selectedFilters?.Empresa?.length            && { empresa:      selectedFilters.Empresa }),
        ...(selectedFilters?.CALL_CENTER_FILTRO?.length && { call_center:  selectedFilters.CALL_CENTER_FILTRO }),
    }), [jobId, origen, localFiltersCG, selectedFilters]);

    // ─── API PÚBLICA DEL HOOK ───
    return {
        dataCG,
        loadingCG,
        paginationCG,
        visibleColumnsCG,
        allColumnsCG,
        localFiltersCG,
        setLocalFiltersCG,
        handlePageChangeCG,
        toggleColumnCG,
        columnsToRenderCG,
        filtrosExportCG,
    };
};