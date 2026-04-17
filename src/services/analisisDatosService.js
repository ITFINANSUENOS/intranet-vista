import { apiClient } from '../api/apiClient';

export const analisisDatosService = {
    /**
     * Obtiene el reporte o trabajo activo del sistema
     */
    async getActiveJob() {
        try {
            const response = await apiClient.get('/reportes/activo');
            const data = response.data?.data || response.data;
            
            return {
                id: data?.active_job_id || data?.job_id,
                fecha: data?.fecha_actualizacion || data?.updated_at || data?.created_at
            };
        } catch (error) {
            console.error("Error en analisisDatosService.getActiveJob:", error);
            throw error;
        }
    },

    /**
     * Obtiene los datos específicos de una pestaña/módulo
     */
    async getModuleData(tab, jobId, signal) {
        try {
            const response = await apiClient.get(`/wallet/init/${tab}?job_id=${jobId}`, { signal });
            // Retornamos la estructura de datos que esperan tus subcomponentes
            return response.data?.data?.data || response.data?.data || response.data;
        } catch (error) {
            if (error.name === 'CanceledError') return null;
            throw error;
        }
    }
};