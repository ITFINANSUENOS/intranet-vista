// src/services/regionalsService.js

import { apiClient } from '../api/apiClient';

export const regionalsService = {
    getAll: async () => {
        const response = await apiClient.get('/regionals');
        // Soporta la estructura donde Axios anida los datos, o si vienen directo
        return response.data.data || response.data;
    },

    create: async (data) => {
        const response = await apiClient.post('/regionals', data);
        return response.data.data || response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/regionals/${id}`, data);
        return response.data.data || response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/regionals/${id}`);
        return response.data;
    }
};