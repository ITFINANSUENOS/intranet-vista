import { useState, useCallback } from 'react';
import { sicService } from '../services/sicService';

export const useSic = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchDocuments = useCallback(async (params) => {
        setLoading(true);
        setError(null);
        try {
            const data = await sicService.getDocuments(params);
            setDocuments(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar documentos');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDownload = async (id) => {
        try {
            const url = await sicService.getDownloadUrl(id);
            window.open(url, '_blank');
        } catch (err) {
            alert('No se pudo generar la URL de descarga.');
        }
    };

    return {
        documents,
        loading,
        error,
        fetchDocuments,
        handleDownload
    };
};
