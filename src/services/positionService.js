import { apiClient } from '../api/apiClient';

export const positionService = {
    getAll: async () => {
        const response = await apiClient.get('/positions');
        return response.data.data || response.data;
    },
    create: async (data) => {
        const response = await apiClient.post('/positions', data);
        return response.data.data || response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.put(`/positions/${id}`, data);
        return response.data.data || response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/positions/${id}`);
    }
};