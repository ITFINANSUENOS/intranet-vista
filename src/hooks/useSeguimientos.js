import { useState, useMemo, useCallback, useEffect } from 'react';
import { applyLocalFilters } from '../services/seguimientosService';

// Constantes de columnas extraídas de tu documento original
export const ALL_COLUMNS_RODAMIENTO = [
    { key: 'Cedula_Cliente', label: 'Cédula Cliente' }, 
    { key: 'Celular', label: 'Celular' }, 
    { key: 'Codeudor1', label: 'Codeudor 1' },
    { key: 'Obligacion', label: 'Obligación' },
    { key: 'Nombre', label: 'Nombre' }, 
    { key: 'Rodamiento', label: 'Rodamiento' },
    { key: 'Estado_Gestion', label: 'Estado de Gestión' }, 
    { key: 'Estado_Pago', label: 'Estado Pago' },
    { key: 'Total_Pagar', label: 'Total' }
];

export const ALL_COLUMNS_GESTION = [
    { key: 'Call_Center', label: 'Call Center' },
    { key: 'Cedula_Cliente', label: 'Cédula Cliente' },
    { key: 'Fecha_Gestion', label: 'Fecha Gestión' },
    { key: 'Tipo_Gestion', label: 'Tipo Gestión' },
    { key: 'Acuerdo_Pago', label: 'Acuerdo Pago' }
];

export const useSeguimientos = (data, jobId) => {
    // ─── ESTADOS DEL GRÁFICO ──────────────────────────────────────────────────
    const [focusedNode, setFocusedNode] = useState(null);

    // ─── ESTADOS DE LA TABLA DE GESTIÓN ───────────────────────────────────────
    const [gestionTable, setGestionTable] = useState({
        data: [], loading: false, search: '', pagination: { currentPage: 1, totalPages: 1 }
    });
    const [localFiltersGestion, setLocalFiltersGestion] = useState({});
    const [showLocalFiltersGestion, setShowLocalFiltersGestion] = useState(false);
    const [visibleColsGestion, setVisibleColsGestion] = useState(ALL_COLUMNS_GESTION.map(c => c.key));

    // ─── ESTADOS DE LA TABLA DE RODAMIENTOS ───────────────────────────────────
    const [rodamientoTable, setRodamientoTable] = useState({
        data: [], loading: false, search: '', pagination: { currentPage: 1, totalPages: 1 }
    });
    const [localFiltersRodamiento, setLocalFiltersRodamiento] = useState({});
    const [showLocalFiltersRodamiento, setShowLocalFiltersRodamiento] = useState(false);
    const [visibleColsRodamiento, setVisibleColsRodamiento] = useState(ALL_COLUMNS_RODAMIENTO.map(c => c.key));

    // ─── MANEJADORES DE GESTIÓN ───────────────────────────────────────────────
    const toggleFiltersGestion = useCallback(() => setShowLocalFiltersGestion(prev => !prev), []);
    
    const handleFilterGestion = useCallback((key, value) => {
        setLocalFiltersGestion(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSearchGestion = useCallback((value) => {
        setGestionTable(prev => ({ ...prev, search: value, pagination: { ...prev.pagination, currentPage: 1 } }));
    }, []);

    const toggleColGestion = useCallback((key) => {
        setVisibleColsGestion(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
    }, []);

    const pageGestion = useCallback((page) => {
        setGestionTable(prev => ({ ...prev, pagination: { ...prev.pagination, currentPage: page } }));
    }, []);

    // ─── MANEJADORES DE RODAMIENTO ────────────────────────────────────────────
    const toggleFiltersRodamiento = useCallback(() => setShowLocalFiltersRodamiento(prev => !prev), []);
    
    const handleFilterRodamiento = useCallback((key, value) => {
        setLocalFiltersRodamiento(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSearchRodamiento = useCallback((value) => {
        setRodamientoTable(prev => ({ ...prev, search: value, pagination: { ...prev.pagination, currentPage: 1 } }));
    }, []);

    const toggleColRodamiento = useCallback((key) => {
        setVisibleColsRodamiento(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
    }, []);

    const pageRodamiento = useCallback((page) => {
        setRodamientoTable(prev => ({ ...prev, pagination: { ...prev.pagination, currentPage: page } }));
    }, []);

    // ─── PROCESAMIENTO DE DATOS ───────────────────────────────────────────────
    // Aquí puedes incluir la lógica de la llamada al servidor o procesamiento local si los datos ya vienen por prop `data`
    useEffect(() => {
        if (data && data.gestion) {
            const filtered = applyLocalFilters(data.gestion, localFiltersGestion);
            setGestionTable(prev => ({ ...prev, data: filtered }));
        }
        if (data && data.rodamientos) {
            const filtered = applyLocalFilters(data.rodamientos, localFiltersRodamiento);
            setRodamientoTable(prev => ({ ...prev, data: filtered }));
        }
    }, [data, localFiltersGestion, localFiltersRodamiento]);

    return {
        state: {
            focusedNode,
            gestionTable, localFiltersGestion, showLocalFiltersGestion, visibleColsGestion,
            rodamientoTable, localFiltersRodamiento, showLocalFiltersRodamiento, visibleColsRodamiento
        },
        actions: {
            setFocusedNode,
            toggleFiltersGestion, handleFilterGestion, handleSearchGestion, toggleColGestion, pageGestion,
            toggleFiltersRodamiento, handleFilterRodamiento, handleSearchRodamiento, toggleColRodamiento, pageRodamiento
        }
    };
};