import { apiClient } from '../api/apiClient';

export const userService = {
    async getUsers(url = '/users', params = {}) {
        const response = await apiClient.get(url, { params });
        return response.data;
    },
    
    // Consumimos las entidades individuales de forma concurrente
    async getFormOptions() {
        const [roles, companies, regionals, costCenters, positions] = await Promise.all([
            apiClient.get('/roles'),
            apiClient.get('/companies'),
            apiClient.get('/regionals'),
            apiClient.get('/cost-centers'),
            apiClient.get('/positions')
        ]);
        
        return {
            roles: roles.data.data || roles.data || [],
            companies: companies.data.data || companies.data || [],
            regionals: regionals.data.data || regionals.data || [],
            cost_centers: costCenters.data.data || costCenters.data || [],
            positions: positions.data.data || positions.data || []
        };
    },
    
    async saveUser(formData, id = null) {
        const url = id ? `/users/${id}?_method=PUT` : '/users';
        const response = await apiClient.post(url, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    
    async deleteUser(id) {
        const response = await apiClient.delete(`/users/${id}`);
        return response.data;
    }
};