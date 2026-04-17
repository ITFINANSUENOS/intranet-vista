// src/services/authService.js
import { apiClient } from '../api/apiClient';

export const authService = {
    async login(email, password) {
        try {
            const response = await apiClient.post('/users/login', { email, password });
            return response.data;
        } catch (error) {
            throw this.formatError(error);
        }
    },
    
    // RESTAURADO: Método para verificar el token contra el servidor
    async verifySession() {
        const response = await apiClient.get('/me');
        return response.data.data || response.data;
    },

    cleanSession() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const dashboardKeys = ['activeTab', 'jobId', 'lastUpdate', 'moduleData', 'visitedTabs'];
        dashboardKeys.forEach(key => sessionStorage.removeItem(`dashboard_${key}`));
    },

    formatError(error) {
        if (!error.response) return { type: 'connection', userMessage: 'No hay conexión.' };
        const status = error.response.status;
        const msg = error.response.data?.error || 'Error en credenciales';
        if (status === 404) return { type: 'email', userMessage: msg };
        if (status === 401) return { type: 'password', userMessage: msg };
        if (status === 422) return { type: 'email', userMessage: 'Revisa el formato.' };
        return { type: 'general', userMessage: 'Error del servidor.' };
    }
};