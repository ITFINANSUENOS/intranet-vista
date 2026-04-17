import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { analisisDatosService } from '../services/analisisDatosService';

const readSession = (key, fallback) => {
    try {
        const v = sessionStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
};

const writeSession = (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } 
    catch (e) { console.error("Error saving session", e); }
};

// Hook personalizado para alto rendimiento en grandes datasets
function useStateRef(initialValue) {
    const [state, setState] = useState(initialValue);
    const ref = useRef(state);
    const dispatch = useCallback((value) => {
        ref.current = typeof value === 'function' ? value(ref.current) : value;
        setState(ref.current);
    }, []);
    return [state, dispatch, ref];
}

export const useAnalisisDatos = () => {
    const [activeTab, setActiveTab] = useState(() => readSession('dashboard_activeTab', 'cartera'));
    const [visitedTabs, setVisitedTabs] = useState(() => readSession('dashboard_visitedTabs', { cartera: true }));
    const [loading, setLoading] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(() => readSession('dashboard_jobId', null));
    const [lastUpdateDate, setLastUpdateDate] = useState(() => readSession('dashboard_lastUpdate', null));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [notification, setNotification] = useState(null);

    const [moduleData, setModuleData, moduleDataRef] = useStateRef(() => readSession('dashboard_moduleData', { 
        cartera: null, seguimientos: null, resultados: null, call_center: null, comercial: null 
    }));

    const [selectedFilters, setSelectedFilters] = useState({
        Empresa: [], CALL_CENTER_FILTRO: [], Zona: [], Regional_Cobro: [], 
        Franja_Cartera: [], Estado_Vigencia: [], Novedades: [], Tipo_Novedad: []
    });

    // Escáner robusto para asegurar que las opciones se extraigan sin importar la anidación
    const filterOptions = useMemo(() => {
        const options = {
            Empresa: new Set(), CALL_CENTER_FILTRO: new Set(), Zona: new Set(),
            Regional_Cobro: new Set(), Franja_Cartera: new Set(), Estado_Vigencia: new Set(),
            Novedades: new Set(), Tipo_Novedad: new Set()
        };

        Object.values(moduleData).forEach(currentData => {
            if (!currentData) return;

            // Búsqueda del arreglo real (soporta estructuras de Laravel Paginator)
            let dataArray = [];
            if (Array.isArray(currentData)) {
                dataArray = currentData;
            } else if (currentData.data && Array.isArray(currentData.data)) {
                dataArray = currentData.data;
            } else if (currentData.data?.data && Array.isArray(currentData.data.data)) {
                dataArray = currentData.data.data;
            } else if (typeof currentData === 'object') {
                // Caso extremo: si el arreglo está bajo otras llaves
                const arraysFound = Object.values(currentData).filter(val => Array.isArray(val));
                if (arraysFound.length > 0) dataArray = arraysFound[0];
            }

            if (Array.isArray(dataArray) && dataArray.length > 0) {
                dataArray.forEach(item => {
                    // Verificación segura para cada propiedad
                    if (item?.Empresa) options.Empresa.add(String(item.Empresa));
                    if (item?.CALL_CENTER_FILTRO) options.CALL_CENTER_FILTRO.add(String(item.CALL_CENTER_FILTRO));
                    if (item?.Zona) options.Zona.add(String(item.Zona));
                    if (item?.Regional_Cobro) options.Regional_Cobro.add(String(item.Regional_Cobro));
                    if (item?.Franja_Cartera) options.Franja_Cartera.add(String(item.Franja_Cartera));
                    if (item?.Estado_Vigencia) options.Estado_Vigencia.add(String(item.Estado_Vigencia));
                    if (item?.Novedades) options.Novedades.add(String(item.Novedades));
                    if (item?.Tipo_Novedad) options.Tipo_Novedad.add(String(item.Tipo_Novedad));
                });
            }
        });

        // Convertir y limpiar valores vacíos
        const result = {};
        for (const key in options) {
            result[key] = Array.from(options[key]).filter(val => val && String(val).trim() !== '').sort();
        }
        return result;
    }, [moduleData]);

    useEffect(() => {
        if (selectedJobId) return;
        let isMounted = true;
        analisisDatosService.getActiveJob().then((data) => {
            if (!isMounted) return;
            if (data?.id) {
                setSelectedJobId(data.id);
                writeSession('dashboard_jobId', data.id);
                const date = new Date(data.fecha || Date.now()).toLocaleString('es-ES', { 
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                });
                setLastUpdateDate(date);
                writeSession('dashboard_lastUpdate', date);
            }
        }).catch(err => console.error(err));
        return () => { isMounted = false; };
    }, [selectedJobId]);

    useEffect(() => {
        if (!selectedJobId) return;
        let isMounted = true;
        const abortController = new AbortController();

        const fetchData = async () => {
            if (['cartera', 'seguimientos', 'resultados', 'call_center', 'comercial'].includes(activeTab)) {
                if (!moduleDataRef.current[activeTab]) {
                    setLoading(true);
                    try {
                        const data = await analisisDatosService.getModuleData(activeTab, selectedJobId, abortController.signal);
                        if (isMounted && data) {
                            setModuleData(prev => {
                                const next = { ...prev, [activeTab]: data };
                                writeSession('dashboard_moduleData', next);
                                return next;
                            });
                        }
                    } catch (err) {
                        if (isMounted && err.name !== 'CanceledError') {
                            setNotification({ type: 'error', message: `Error al cargar ${activeTab}` });
                        }
                    } finally {
                        if (isMounted) setLoading(false);
                    }
                }
            }
        };

        fetchData();
        return () => { isMounted = false; abortController.abort(); };
    }, [activeTab, selectedJobId, setModuleData, moduleDataRef]);

    const changeTab = (tab) => {
        setActiveTab(tab);
        writeSession('dashboard_activeTab', tab);
        setVisitedTabs(prev => {
            const next = { ...prev, [tab]: true };
            writeSession('dashboard_visitedTabs', next);
            return next;
        });
    };

    const handleUploadSuccess = () => {
        setNotification({ type: 'success', message: 'Datos actualizados. Recargando...' });
        sessionStorage.clear();
        setTimeout(() => window.location.reload(), 1500);
    };

    return {
        state: { 
            activeTab, visitedTabs, loading, selectedJobId, lastUpdateDate, 
            moduleData, isSidebarOpen, notification, selectedFilters, filterOptions 
        },
        actions: { 
            changeTab, setIsSidebarOpen, setNotification, setSelectedFilters, handleUploadSuccess 
        }
    };
};