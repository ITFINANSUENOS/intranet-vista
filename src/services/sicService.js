import { apiClient } from '../api/apiClient';
import axios from 'axios';

export const sicService = {
    /**
     * Obtiene el listado de documentos filtrado
     */
    getDocuments: async (params = {}) => {
        const response = await apiClient.get('/sic/documents', { params });
        return response.data;
    },

    /**
     * Paso 1: Pedir permiso a Laravel para subir a S3
     */
    requestUpload: async (payload) => {
        const response = await apiClient.post('/sic/documents/request-upload', payload);
        return response.data;
    },

    /**
     * Paso 2: Subida real a AWS S3 (Binario)
     */
    uploadFileToS3: async (uploadUrl, file) => {
        console.warn("BLOQUEO DE SEGURIDAD: Subida a S3 desactivada en Local.");
        return new Promise((resolve) => setTimeout(resolve, 500)); 
    },

    /**
     * Paso 3: Confirmar registro en la DB
     */
    confirmUpload: async (payload) => {
        const response = await apiClient.post('/sic/documents/confirm-upload', payload);
        return response.data;
    },

    /**
     * Paso Especial: Registrar nueva versión
     */
    addVersion: async (documentId, payload) => {
        const response = await apiClient.post(`/sic/documents/${documentId}/versions`, payload);
        return response.data;
    },

    /**
     * Paso Calidad: Publicar oficialmente
     */
    publishDocument: async (documentId) => {
        const response = await apiClient.post(`/sic/documents/${documentId}/publish`);
        return response.data;
    },

    /**
     * Obtener URL de descarga
     */
    getDownloadUrl: async (documentId) => {
        const response = await apiClient.get(`/sic/documents/${documentId}/download`);
        return response.data.download_url;
    }
};
