import React, { useState } from 'react';
import axios from 'axios'; // Mantenemos este para la subida a S3/Cloud externa
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
// 💡 IMPORTANTE: Importar useAuth para acceder al apiClient
import { useAuth } from '../context/AuthContext'; 

export default function Reports() {
    // 💡 1. Obtener apiClient del hook useAuth
    const { apiClient } = useAuth(); 

    // --- ESTADOS ---
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [status, setStatus] = useState('idle'); 
    const [message, setMessage] = useState('');
    const [resultData, setResultData] = useState(null); 

    // --- MANEJO DE ARCHIVOS ---
    const handleFile1Change = (e) => setFile1(e.target.files[0]);
    const handleFile2Change = (e) => setFile2(e.target.files[0]);

    const handleProcess = async () => {
        if (!file1 || !file2) {
            setMessage('Por favor selecciona ambos archivos para continuar.');
            return;
        }

        setMessage('');
        setStatus('uploading');
        setResultData(null);

        try {
            // ---------------------------------------------------------
            // PASO 1: Obtener URLs firmadas para ambos archivos
            // 💡 USAR apiClient para peticiones a nuestro backend (Laravel)
            // Ya no necesitamos authHeaders aquí, apiClient los inyecta automáticamente.
            // ---------------------------------------------------------
            setMessage('Solicitando permisos de subida...');

            const payloadInfo = {
                files: [
                    { name: file1.name, type: file1.type },
                    { name: file2.name, type: file2.type }
                ]
            };

            // Endpoint: /procesamiento/generar-urls
            const { data: responseUrl } = await apiClient.post('/procesamiento/generar-urls', payloadInfo);

            const uploadUrls = responseUrl.upload_urls; 
            const sessionKey = responseUrl.process_key || responseUrl.key;

            if (!uploadUrls || uploadUrls.length < 2) {
                throw new Error('La API no devolvió suficientes rutas de subida.');
            }

            // ---------------------------------------------------------
            // PASO 2: Subir archivos directamente a la nube (S3/Storage)
            // 💡 USAR axios BASE para peticiones externas a la URL FIRMADA.
            // ---------------------------------------------------------
            setMessage('Subiendo archivos a la nube...');

            await Promise.all([
                axios.put(uploadUrls[0].url, file1, { headers: { 'Content-Type': file1.type } }),
                axios.put(uploadUrls[1].url, file2, { headers: { 'Content-Type': file2.type } })
            ]);

            // ---------------------------------------------------------
            // PASO 3: Iniciar Procesamiento en Python
            // 💡 USAR apiClient.post
            // ---------------------------------------------------------
            setStatus('processing');
            setMessage('Archivos cargados. Iniciando procesamiento...');

            // Endpoint: /procesamiento/iniciar
            await apiClient.post('/procesamiento/iniciar', { key: sessionKey });

            // ---------------------------------------------------------
            // PASO 4: Polling (Verificar estado recursivamente)
            // ---------------------------------------------------------
            setStatus('polling');
            pollStatus(sessionKey);

        } catch (error) {
            console.error("Error en el flujo:", error);
            setStatus('error');
            
            // Si el error es 403 (Proviene de Laravel por falta de ROL)
            if (error.response && error.response.status === 403) {
                setMessage('Acceso denegado: Tu usuario no tiene el rol de Administrador.');
            } else {
                // Leer el mensaje de error
                const serverMsg = error.response?.data?.message || error.message;
                setMessage(`Ocurrió un error: ${serverMsg}`);
            }
        }
    };

    // Función recursiva para consultar estado
    const pollStatus = async (key) => {
        try {
            // 💡 USAR apiClient.get
            // Endpoint: /procesamiento/estado
            const { data } = await apiClient.get(`/procesamiento/estado?key=${key}`);

            const currentStatus = (data.status || data.estado || '').toUpperCase();

            if (currentStatus === 'COMPLETED' || currentStatus === 'FINALIZADO') {
                setStatus('completed');
                setMessage('¡Procesamiento completado con éxito!');
                setResultData(data); 
            } else if (currentStatus === 'ERROR' || currentStatus === 'FAILED' || currentStatus === 'FALLIDO') {
                setStatus('error');
                setMessage(`El procesamiento falló: ${data.error_message || 'Error desconocido'}`);
            } else {
                setMessage(`Procesando: ${data.message || 'Analizando datos...'} (Espere...)`);
                setTimeout(() => pollStatus(key), 3000);
            }

        } catch (error) {
            setStatus('error');
            setMessage('Error de conexión al verificar el estado del trabajo.');
        }
    };

    return (
        <AuthenticatedLayout title="Reportes y Procesamiento DataCredito">
            {/* ... El resto del JSX se mantiene igual ... */}
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 py-12">
                <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
                    
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">
                        Procesamiento de Archivos DataCredito
                    </h2>
                    
                    {/* Contenedor del Formulario */}
                    <div className="border-2 border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center bg-gray-50">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-6">
                            {/* Input Archivo 1 */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">Archivo 1 (Base)</label>
                                <input 
                                    type="file" 
                                    onChange={handleFile1Change}
                                    disabled={status !== 'idle' && status !== 'error' && status !== 'completed'}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100
                                        bg-white border border-gray-200 rounded-lg"
                                />
                            </div>

                            {/* Input Archivo 2 */}
                            <div className="flex flex-col">
                                <label className="text-sm font-medium text-gray-700 mb-2">Archivo 2 (Complemento)</label>
                                <input 
                                    type="file" 
                                    onChange={handleFile2Change}
                                    disabled={status !== 'idle' && status !== 'error' && status !== 'completed'}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-blue-50 file:text-blue-700
                                        hover:file:bg-blue-100
                                        bg-white border border-gray-200 rounded-lg"
                                />
                            </div>
                        </div>

                        {/* Botón de Acción */}
                        <button
                            onClick={handleProcess}
                            disabled={!file1 || !file2 || (status !== 'idle' && status !== 'error' && status !== 'completed')}
                            className={`px-8 py-3 rounded-md text-white font-semibold transition shadow-sm w-full max-w-xs
                                ${(!file1 || !file2 || (status !== 'idle' && status !== 'error' && status !== 'completed')) 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {status === 'idle' || status === 'completed' || status === 'error' ? 'Iniciar Procesamiento' : 
                             status === 'uploading' ? 'Subiendo Archivos...' : 
                             status === 'processing' ? 'Iniciando Motor...' :
                             'Procesando Datos...'}
                        </button>
                    </div>

                    {/* Área de Feedback y Estado */}
                    <div className="mt-6 max-w-3xl mx-auto">
                        {message && (
                            <div className={`p-4 rounded-md text-center font-medium border
                                ${status === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 
                                  status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                  'bg-blue-50 text-blue-800 border-blue-200'}`}>
                                {message}
                                {status === 'polling' && <span className="animate-pulse ml-2">...</span>}
                            </div>
                        )}

                        {/* Resultado Final: Botón de descarga o JSON */}
                        {status === 'completed' && resultData && (
                            <div className="mt-6 p-4 bg-gray-50 rounded border border-gray-200 text-center">
                                <p className="text-gray-600 mb-3">El proceso ha finalizado correctamente.</p>
                                
                                {resultData.download_url ? (
                                    <a 
                                        href={resultData.download_url} 
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        ⬇ Descargar Reporte Generado
                                    </a>
                                ) : (
                                    <div className="text-left bg-white p-3 rounded overflow-auto max-h-60 border text-xs font-mono">
                                        {JSON.stringify(resultData, null, 2)}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}