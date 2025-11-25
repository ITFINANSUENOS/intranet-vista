import { useState, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext'; // <--- Importamos el hook que proporciona apiClient

// RUTA BASE para los endpoints de Laravel (se asume que es la base de apiClient)
const PROCESAMIENTO_ENDPOINT = 'procesamiento'; 
const POLLING_INTERVAL = 5000; // 5 segundos
const STORAGE_KEY = 'datacredito_active_job'; // Clave para persistencia local

export const useDataCreditoProcess = () => {
    // 1. Obtener apiClient del contexto de autenticación
    const { apiClient } = useAuth();
    
    // 2. Estados principales
    const [status, setStatus] = useState(() => {
        const savedKey = localStorage.getItem(STORAGE_KEY);
        // El estado se inicializa desde localStorage para reanudar el polling
        return savedKey ? `processing:${savedKey}` : 'idle';
    });
    
    const [error, setError] = useState('');
    const [downloadUrl, setDownloadUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const pollingIntervalRef = useRef(null);

    // --- Lógica de Polling ---

    const clearPolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const checkStatus = async (outputKey) => {
        try {
            // PASO 4: Consulta al endpoint de Laravel (autenticado): /api/procesamiento/estado
            const res = await apiClient.get(`/${PROCESAMIENTO_ENDPOINT}/estado`, { 
                params: { key: outputKey }
            });

            if (res.data.status === 'completed') {
                setStatus('completed');
                setDownloadUrl(res.data.download_url);
                localStorage.removeItem(STORAGE_KEY);
                clearPolling();
                return true;
            }
            return false;
        } catch (err) {
            // Si Laravel/Python devuelve 404 (NoSuchKey), es el estado 'processing' y es normal.
            if (err.response?.status !== 404) { 
                const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
                console.error("Error en polling (Crítico)", errorMsg);
                setError('Error al verificar el estado del proceso: ' + errorMsg);
                setStatus('error');
                localStorage.removeItem(STORAGE_KEY);
                clearPolling();
                throw err; 
            }
            return false;
        }
    };

    const startPolling = async (outputKey) => {
        clearPolling();
        // Iniciar la verificación inmediatamente y luego cada 5 segundos
        await checkStatus(outputKey);

        const intervalId = setInterval(async () => {
            await checkStatus(outputKey);
        }, POLLING_INTERVAL);

        pollingIntervalRef.current = intervalId;
    };


    // useEffect para reanudar el polling si se recarga la página
    useEffect(() => {
        if (status.startsWith('processing:')) {
            const outputKey = status.split(':')[1];
            startPolling(outputKey); 
        }

        return () => clearPolling(); // Limpiar al desmontar
    }, [status]);


    // --- Lógica de Subida y Procesamiento ---

    // Función auxiliar para subir a S3 (no necesita apiClient)
    const uploadFileToS3 = async (url, file, contentType) => {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': contentType },
            body: file,
        });
        
        if (!response.ok) {
            // Esto es crucial para CORS o errores de permisos
            throw new Error(`Fallo la subida a S3 con código: ${response.status}. Revise CORS/IAM en AWS.`);
        }
    };

    // Función principal que ejecuta todo el flujo
    const processDatacreditoFiles = async ({ planoFile, correccionesFile, empresa }) => {
        
        if (status !== 'idle') return;

        setError('');
        setIsLoading(true);
        setStatus('uploading'); 

        try {
            // --- PASO 1: Obtener URLs pre-firmadas (Usa apiClient) ---
            const urlPayload = {
                plano_filename: planoFile.name,
                correcciones_filename: correccionesFile.name,
                plano_content_type: planoFile.type || 'text/plain',
                correcciones_content_type: correccionesFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            };
            // LLamada Autenticada a /api/procesamiento/generar-urls
            const urlsResponse = await apiClient.post(`/${PROCESAMIENTO_ENDPOINT}/generar-urls`, urlPayload);
            const { plano, correcciones } = urlsResponse.data;

            // --- PASO 2: Subir directamente a S3 (fetch) ---
            await Promise.all([
                uploadFileToS3(plano.upload_url, planoFile, urlPayload.plano_content_type),
                uploadFileToS3(correcciones.upload_url, correccionesFile, urlPayload.correcciones_content_type)
            ]);

            // --- PASO 3: Iniciar Proceso Asíncrono (Usa apiClient) ---
            setStatus('processing:start'); // Estado intermedio para mejor feedback
            const processPayload = {
                plano_key: plano.key,
                correcciones_key: correcciones.key,
                empresa: empresa
            };
            // Llamada Autenticada a /api/procesamiento/iniciar
            const inicioResponse = await apiClient.post(`/${PROCESAMIENTO_ENDPOINT}/iniciar`, processPayload);
            const outputKey = inicioResponse.data.output_key;

            // Iniciar Polling (Paso 4)
            localStorage.setItem(STORAGE_KEY, outputKey);
            setStatus(`processing:${outputKey}`); 
            
        } catch (err) {
            clearPolling();
            const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message || 'Error de red desconocido.';
            console.error("Fallo el flujo completo:", err);
            setError('Error en el flujo: ' + errorMsg);
            setStatus('idle');
            localStorage.removeItem(STORAGE_KEY);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para reiniciar todos los estados
    const resetProcess = () => {
        clearPolling();
        localStorage.removeItem(STORAGE_KEY);
        setStatus('idle');
        setDownloadUrl(null);
        setError('');
        setIsLoading(false);
    };

    // Retornar solo lo necesario para la UI
    return {
        processDatacreditoFiles,
        status,
        error,
        downloadUrl,
        isLoading,
        resetProcess,
        isPolling: status.startsWith('processing:'),
        // Bandera para bloquear inputs
        isLocked: status !== 'idle' && status !== 'completed' && status !== 'error', 
    };
};