export const detalladoService = {
    buscar: async (apiClient, payload) => {
        try {
            const response = await apiClient.post('/wallet/buscar', payload);
            return {
                data: response.data?.data || [],
                meta: response.data?.meta || {}
            };
        } catch (error) {
            console.error("Error en detalladoService.buscar:", error);
            throw error; // Se lanza para que el Hook pueda manejarlo si es necesario
        }
    }
};