// callCenterService.js

export const callCenterService = {
    /**
     * Obtiene los datos detallados de la tabla desde el endpoint de wallet.
     * @param {Object} apiClient - Instancia del cliente HTTP (axios u similar).
     * @param {Object} payload   - Cuerpo de la petición con filtros y paginación.
     * @returns {{ data: Array, meta: Object, error: any }}
     */
    buscarDatosWallet: async (apiClient, payload) => {
        try {
            const response = await apiClient.post('/wallet/buscar', payload);
            return {
                data: response.data?.data || [],
                meta: response.data?.meta || {},
                error: null
            };
        } catch (error) {
            console.error("Error en callCenterService.buscarDatosWallet:", error);
            return { data: [], meta: {}, error };
        }
    }
};