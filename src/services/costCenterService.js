// src/services/costCenterService.js

// IMPORTANTE: Cambia esta ruta para apuntar al archivo donde ya tienes exportado tu apiClient
import { apiClient } from '../api/apiClient';

export const costCenterService = {
    getCostCenters: async () => {
        const response = await apiClient.get('/cost-centers');
        return response.data;
    },

    getRegionals: async () => {
        const response = await apiClient.get('/regionals');
        return response.data;
    },

    createCostCenter: async (data) => {
        const response = await apiClient.post('/cost-centers', data);
        return response.data;
    },

    updateCostCenter: async (id, data) => {
        const response = await apiClient.put(`/cost-centers/${id}`, data);
        return response.data;
    },

    deleteCostCenter: async (id) => {
        const response = await apiClient.delete(`/cost-centers/${id}`);
        return response.data;
    }
};