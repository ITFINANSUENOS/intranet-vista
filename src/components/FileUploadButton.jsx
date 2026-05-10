import React, { useState, useRef } from 'react';
import { RefreshCw, UploadCloud } from 'lucide-react';
import { apiClient as defaultApiClient } from '../context/AuthContext';

const FileUploadButton = ({ 
    apiClient: propApiClient, 
    onUploadStart, 
    onUploadSuccess, 
    onUploadError,
    className = "",
    iconOnly = false
}) => {
    // Usamos el cliente pasado por prop o el global por defecto
    const apiClient = propApiClient || defaultApiClient;
    
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Reset del input para permitir subir el mismo archivo si falló antes
        event.target.value = ''; 

        setIsUploading(true);
        if (onUploadStart) onUploadStart();

        try {
            // --- PASO 1: Obtener URL firmada ---
            console.log(`[Upload] Iniciando solicitud para: ${file.name} (${file.size} bytes)`);
            
            // Enviamos file_size para que Python valide ANTES de intentar subir nada
            const { data: signRes } = await apiClient.post('/reportes/generar-url', { 
                filename: file.name, 
                content_type: file.type,
                file_size: file.size 
            });

            console.log("[Upload] URL firmada recibida correctamente.");

            // --- PASO 2: Subida directa a S3 vía XHR ---
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signRes.upload_url);
            xhr.setRequestHeader('Content-Type', file.type);
            
            xhr.onload = async () => {
                if (xhr.status === 200) {
                    console.log("[Upload] Archivo subido a S3 exitosamente.");
                    
                    try {
                        // --- PASO 3: Iniciar procesamiento (Worker) ---
                        const { data: procRes } = await apiClient.post('/reportes/iniciar-procesamiento', { 
                            file_key: signRes.file_key, 
                            empresa: 'FINANSUENOS' 
                        });
                        
                        console.log("[Upload] Procesamiento iniciado. Job ID:", procRes.job_id);
                        setIsUploading(false);
                        if (onUploadSuccess) onUploadSuccess(procRes.job_id);

                    } catch (procError) {
                        // Error en el Paso 3
                        console.error("[Error] Fallo al iniciar procesamiento en Python:", procError);
                        setIsUploading(false);
                        
                        // Mensaje para el usuario
                        const msg = procError.response?.data?.detail || 'El archivo se subió, pero falló el inicio del procesamiento.';
                        if (onUploadError) onUploadError(msg);
                    }
                } else {
                    // Error en el Paso 2 (S3 rechaza la subida)
                    console.error(`[Error] S3 rechazó la subida. Status: ${xhr.status}`, xhr.responseText);
                    setIsUploading(false);
                    if (onUploadError) onUploadError('Error al transferir el archivo a la nube.');
                }
            };

            xhr.onerror = () => {
                // Error de red en el Paso 2
                console.error("[Error] Fallo de red (XHR) durante la subida a S3.");
                setIsUploading(false);
                if (onUploadError) onUploadError('Error de conexión al intentar subir el archivo.');
            };

            xhr.send(file);

        } catch (error) {
            // Error en el Paso 1 (Validación inicial, tamaño, nombre, etc.)
            setIsUploading(false);
            
            const status = error.response ? error.response.status : 500;
            console.error(`[Error] Fallo al solicitar URL (Status ${status}):`, error);

            if (status === 400) {
                // Aquí capturamos el mensaje específico de Python (ej: "El archivo excede 25MB")
                // Laravel suele encapsular la respuesta de Python, buscamos el mensaje exacto.
                const backendMsg = error.response?.data?.detail || error.response?.data?.message || 'Archivo inválido.';
                if (onUploadError) onUploadError(backendMsg);
            } else if (status === 422) {
                // Errores de validación de Laravel (ej: falta parámetro)
                console.error("Detalles de validación:", error.response?.data?.errors);
                if (onUploadError) onUploadError('Error de validación en los datos del archivo.');
            } else {
                if (onUploadError) onUploadError('Archivo invalido');
            }
        }
    };

    const baseClasses = `flex items-center justify-center gap-2 transition-colors disabled:opacity-70 ${className}`;
    const defaultClasses = "bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black hover:bg-indigo-700";

    return (
        <>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".xlsx" 
            />
            <button 
                onClick={() => fileInputRef.current.click()} 
                disabled={isUploading} 
                className={className ? baseClasses : `${defaultClasses} ${baseClasses}`}
                title="Cargar base de datos"
            >
                {isUploading ? (
                    <RefreshCw className="animate-spin" size={iconOnly ? 18 : 14}/>
                ) : (
                    <UploadCloud size={iconOnly ? 18 : 14}/>
                )} 
                
                {!iconOnly && (isUploading ? 'SUBIENDO...' : 'CARGAR BASE')}
            </button>
        </>
    );
};

export default FileUploadButton;