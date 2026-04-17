import { apiClient } from '../api/apiClient';

export const dashboardService = {
    // Método para obtener las noticias o datos iniciales del dashboard
    async getNews() {
        try {
            const response = await apiClient.get('/news');
            return response.data;
        } catch (error) {
            console.error("Error obteniendo datos del dashboard:", error);
            throw error; // Puedes formatear el error aquí si es necesario
        }
    }
};