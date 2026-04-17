// useCartera.js
import { useState, useMemo, useCallback } from 'react';
import { processGeneric, buildSunburstData } from '../services/carteraService';

export const useCartera = (data, selectedFilters) => {
    const [focusedNode, setFocusedNode] = useState(null);

    // Parsear filtros de UI a un formato consumible por el servicio
    const activeFilters = useMemo(() => {
        if (!selectedFilters) return [];
        return Object.entries(selectedFilters).filter(
            ([_, values]) => values && Array.isArray(values) && values.length > 0
        );
    }, [selectedFilters]);

    // Calcular gráficos usando los servicios puros
    const charts = useMemo(() => {
        if (!data) return null;
        try {
            return {
                regional: processGeneric(data?.cubo_regional, activeFilters, 'Regional_Venta', 'Franja_Meta', 'count'),
                cobro: processGeneric(data?.cubo_cobro, activeFilters, 'Eje_X_Cobro', 'Franja_Meta', 'count'),
                desembolsos: processGeneric(data?.cubo_desembolso, activeFilters, 'Año_Desembolso', 'Franja_Meta', 'Valor_Desembolso', true),
                vigencia: buildSunburstData(data?.cubo_vigencia, activeFilters, 'Estado_Vigencia_Agrupado', 'Sub_Estado_Vigencia', 'count')
            };
        } catch (error) {
            console.error("Error procesando gráficos:", error);
            return null;
        }
    }, [data, activeFilters]);

    // Manejador de eventos de la vista
    const handleNodeClick = useCallback((nodeData) => {
        const targetName = nodeData.parentName || nodeData.name;
        setFocusedNode(prev => prev?.name === targetName ? null : { name: targetName });
    }, []);

    return {
        charts,
        focusedNode,
        handleNodeClick
    };
};