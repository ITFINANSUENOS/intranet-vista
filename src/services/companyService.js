// src/services/companyService.js
import { apiClient } from '../api/apiClient';

export const companyService = {
    getAll: async () => {
        const response = await apiClient.get('/companies');
        return response.data.data || [];
    },

    create: async (data) => {
        const response = await apiClient.post('/companies', data);
        return response.data.data || response.data;
    },

    update: async (id, data) => {
        const response = await apiClient.put(`/companies/${id}`, data);
        return response.data.data || response.data;
    },

    delete: async (id) => {
        const response = await apiClient.delete(`/companies/${id}`);
        return response.data;
    }
};