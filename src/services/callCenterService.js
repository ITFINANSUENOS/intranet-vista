
/**
 * Obtiene datos paginados de la tabla de Call Center desde la API.
 *
 * @param {object} apiClient     - Instancia de axios (u otro cliente HTTP)
 * @param {object} payload       - Cuerpo de la petición (job_id, origen, page, filtros, etc.)
 * @returns {{ items: object[], meta: object }}
 */
export const fetchPaginatedCallCenter = async (apiClient, payload) => {
    const response = await apiClient.post('/wallet/buscar', payload);
    return {
        items: response.data?.data || [],
        meta:  response.data?.meta || {}
    };
};

/**
 * Construye el payload para la tabla "Detalle de Operación Call Center"
 * (TablaRemotaCallCenter).
 *
 * @param {string}  jobId
 * @param {string}  origen
 * @param {number}  page
 * @param {object}  localFilters   - { Rodamiento, Estado_Gestion, Estado_Pago, Tipo_Novedad }
 * @param {object}  selectedFilters - Filtros globales { Empresa[], CALL_CENTER_FILTRO[] }
 * @param {number}  [pageSize=15]
 */
export const buildPayloadCallCenter = (jobId, origen, page, localFilters, selectedFilters, pageSize = 15) => {
    const payload = {
        job_id:    jobId,
        origen,
        page,
        page_size: pageSize
    };

    if (localFilters.Rodamiento)    payload.rodamiento     = [localFilters.Rodamiento];
    if (localFilters.Estado_Gestion) payload.estado_gestion = [localFilters.Estado_Gestion];
    if (localFilters.Estado_Pago)   payload.estado_pago    = [localFilters.Estado_Pago];
    if (localFilters.Tipo_Novedad)  payload.Tipo_Novedad   = [localFilters.Tipo_Novedad];

    if (selectedFilters?.Empresa?.length)           payload.empresa      = selectedFilters.Empresa;
    if (selectedFilters?.CALL_CENTER_FILTRO?.length) payload.call_center  = selectedFilters.CALL_CENTER_FILTRO;

    return payload;
};

/**
 * Construye el payload para la tabla "Call Center – Gestión y Novedades"
 * (TablaRemotaCallCenterGestion).
 *
 * @param {string}  jobId
 * @param {string}  origen
 * @param {number}  page
 * @param {object}  localFiltersCG  - { CALL_CENTER_FILTRO, Estado_Gestion, Tipo_Novedad }
 * @param {object}  selectedFilters - Filtros globales { Empresa[], CALL_CENTER_FILTRO[] }
 * @param {number}  [pageSize=10]
 */
export const buildPayloadCallCenterGestion = (jobId, origen, page, localFiltersCG, selectedFilters, pageSize = 10) => {
    const payload = {
        job_id:    jobId,
        origen,
        page,
        page_size: pageSize
    };

    if (localFiltersCG.Estado_Gestion) payload.estado_gestion = [localFiltersCG.Estado_Gestion];
    if (localFiltersCG.Tipo_Novedad)   payload.novedades      = [localFiltersCG.Tipo_Novedad];

    if (selectedFilters?.Empresa?.length)           payload.empresa     = selectedFilters.Empresa;
    if (selectedFilters?.CALL_CENTER_FILTRO?.length) payload.call_center = selectedFilters.CALL_CENTER_FILTRO;

    return payload;
};

/**
 * Construye el payload de exportación para la tabla Detalle de Operación.
 */
export const buildExportPayloadCallCenter = (jobId, origen, visibleColumns, localFilters) => {
    const payload = {
        job_id:            jobId,
        origen,
        page:              1,
        page_size:         100000,
        columnas_visibles: visibleColumns
    };

    if (localFilters.Rodamiento)     payload.rodamiento     = [localFilters.Rodamiento];
    if (localFilters.Estado_Gestion) payload.estado_gestion = [localFilters.Estado_Gestion];
    if (localFilters.Estado_Pago)    payload.estado_pago    = [localFilters.Estado_Pago];
    if (localFilters.Tipo_Novedad)   payload.Tipo_Novedad   = [localFilters.Tipo_Novedad];

    return payload;
};

/**
 * Construye el payload de exportación para la tabla Gestión y Novedades.
 */
export const buildExportPayloadCallCenterGestion = (jobId, origen, visibleColumnsCG, localFiltersCG) => {
    const payload = {
        job_id:            jobId,
        origen,
        page:              1,
        page_size:         100000,
        columnas_visibles: visibleColumnsCG
    };

    if (localFiltersCG.Estado_Gestion) payload.estado_gestion = [localFiltersCG.Estado_Gestion];
    if (localFiltersCG.Tipo_Novedad)   payload.novedades      = [localFiltersCG.Tipo_Novedad];

    return payload;
};