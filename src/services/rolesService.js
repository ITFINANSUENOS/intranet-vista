import { apiClient } from '../api/apiClient';

export const roleService = {
    getRoles: async () => {
        const response = await apiClient.get('/roles');
        return response.data;
    },
    
    getPermissions: async () => {
        const response = await apiClient.get('/permissions');
        return response.data;
    },
    
    createRole: async (data) => {
        const response = await apiClient.post('/roles', data);
        return response.data;
    },
    
    updateRole: async (id, data) => {
        const response = await apiClient.put(`/roles/${id}`, data);
        return response.data;
    },
    
    deleteRole: async (id) => {
        const response = await apiClient.delete(`/roles/${id}`);
        return response.data;
    },
    
    createPermission: async (data) => {
        const response = await apiClient.post('/permissions', data);
        return response.data;
    }
};