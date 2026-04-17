export const FILTER_KEY_MAP = {};

export const VIGENCIA_VALUE_MAP = {
    'VIGENTE':           'VIGENTES',
    'VIGENTES':          'VIGENTES',
    'EXPIRADA':          'VIGENCIA EXPIRADA',
    'VIGENCIA EXPIRADA': 'VIGENCIA EXPIRADA',
    'DIAS 1-10':         'DIAS 1-10',
    'DIAS 11-20':        'DIAS 11-20',
    'DIAS 21+':          'DIAS 21+',
};

export const resolveNovedadesPayload = (novedadesArray) => {
    if (!novedadesArray || novedadesArray.length === 0) return {};

    const wantsConNovedad = novedadesArray.some(
        v => String(v).toLowerCase().includes('con') || parseInt(v) > 0
    );
    const wantsSinNovedad = novedadesArray.some(
        v => String(v).toLowerCase().includes('sin') || String(v) === '0' || parseInt(v) === 0
    );

    if (wantsConNovedad && wantsSinNovedad) return {};
    if (wantsConNovedad) return { con_novedad: true };
    if (wantsSinNovedad) return { con_novedad: false };
    return {};
};

export const buildGlobalFilterPayload = (gf) => {
    const KEY_MAP = {
        Empresa:            'empresa',
        Zona:               'zona',
        Regional_Cobro:     'regional_cobro',
        Franja_Cartera:     'franja',
        CALL_CENTER_FILTRO: 'call_center_filtro',
        Estado_Vigencia:    'estado_vigencia',
    };
    const UPPERCASE_KEYS = new Set(['Empresa', 'Zona', 'Regional_Cobro', 'CALL_CENTER_FILTRO']);
    const result = {};

    Object.entries(gf || {}).forEach(([key, value]) => {
        if (key === 'Novedades') {
            Object.assign(result, resolveNovedadesPayload(Array.isArray(value) ? value : [value]));
            return; 
        }

        if (Array.isArray(value) && value.length > 0) {
            const backendKey = KEY_MAP[key] ?? key.toLowerCase();
            if (key === 'Estado_Vigencia') {
                result[backendKey] = value.map(v => {
                    const upper = String(v).toUpperCase().trim();
                    return VIGENCIA_VALUE_MAP[upper] || upper;
                });
            } else if (UPPERCASE_KEYS.has(key)) {
                result[backendKey] = value.map(v => String(v).toUpperCase().trim());
            } else {
                result[backendKey] = value;
            }
        }
    });
    return result;
};

export const buildChartGetParams = (filters) => {
    const params = {};
    Object.entries(filters || {}).forEach(([key, value]) => {
        if (key === 'Novedades') {
            Object.assign(params, resolveNovedadesPayload(Array.isArray(value) ? value : [value]));
            return;
        }
        if (Array.isArray(value) && value.length > 0) {
            params[key] = value;
        }
    });
    return params;
};

export const findKeyInObject = (obj, targetKey) => {
    if (!obj || typeof obj !== 'object') return null;
    if (Object.prototype.hasOwnProperty.call(obj, targetKey)) return obj[targetKey];
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const result = findKeyInObject(obj[key], targetKey);
            if (result) return result;
        }
    }
    return null;
};

export const processRawData = (rawData) => {
    if (!rawData || rawData.length === 0) return {
        processedData: [], uniqueStates: [], totals: {},
        uniqueSellers: [], uniqueRegionals: [], uniqueActivos: [], uniqueAnalistas: []
    };

    const statesSet = new Set(), sellersSet = new Set(), regionalsSet = new Set();
    const activosSet = new Set(), analistasSet = new Set();
    const grouped = {};

    rawData.forEach(item => {
        const vendedor = String(item.Nombre_Vendedor || item.nombre_vendedor || 'SIN VENDEDOR').trim();
        const estado = String(item.Estado || item.estado || 'SIN ESTADO').toUpperCase().trim();
        const regional = String(item.Regional_Venta || item.regional_venta || item.Regional || item.regional || item.Regional_Cobro || item.regional_cobro || '').trim();
        const activo = String(item.Vendedor_Activo || item.vendedor_activo || '').trim();
        const analista = String(item.Analista_Asociado || item.analista_asociado || '').trim();

        if (estado) statesSet.add(estado);
        if (vendedor) sellersSet.add(vendedor);
        if (regional) regionalsSet.add(regional);
        if (activo) activosSet.add(activo);
        if (analista) analistasSet.add(analista);

        if (!grouped[vendedor]) grouped[vendedor] = { name: vendedor, total: 0 };
        grouped[vendedor][estado] = (grouped[vendedor][estado] || 0) + 1;
        grouped[vendedor].total += 1;
    });

    const uniqueStates = Array.from(statesSet).sort();
    const processedData = Object.values(grouped).sort((a, b) => b.total - a.total);

    const totals = { total: 0 };
    uniqueStates.forEach(s => totals[s] = 0);
    processedData.forEach(row => {
        totals.total += row.total;
        uniqueStates.forEach(s => { if (row[s]) totals[s] += row[s]; });
    });

    return { 
        processedData, uniqueStates, totals, 
        uniqueSellers: Array.from(sellersSet).sort(), 
        uniqueRegionals: Array.from(regionalsSet).sort(), 
        uniqueActivos: Array.from(activosSet).sort(), 
        uniqueAnalistas: Array.from(analistasSet).sort() 
    };
};

export const comercialApiService = {
    fetchResumen: async (apiClient, jobId, chartParams) => {
        const response = await apiClient.get(`/wallet/init/comercial`, { 
            params: { job_id: jobId, ...chartParams } 
        });
        return response.data;
    },
    fetchTabla: async (apiClient, payload) => {
        const response = await apiClient.post('/wallet/buscar', payload);
        return {
            data: response.data?.data || [],
            meta: response.data?.meta || {}
        };
    }
};