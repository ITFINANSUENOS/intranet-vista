import React, { useState } from 'react';
import { CreditCardIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon, TrashIcon, CloudArrowUpIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import AuthenticatedLayout from '../../layouts/AuthenticatedLayout';
import { useDataCreditoProcess } from '../../context/useDataCreditoProcess'; 

// Sub-componente para el Input de Archivo - Minimalista
const FileInput = ({ label, accept, onChange, disabled, file }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
    <div className="flex items-center space-x-3">
        <input
            type="file"
            accept={accept}
            onChange={(e) => onChange(e.target.files[0])}
            disabled={disabled}
            // Estilos minimalistas para el input de tipo file
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white hover:file:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            key={file?.name || 'file-input'}
        />
        {/* Mostrar nombre del archivo si existe */}
        {file && (
            <span className="text-sm text-gray-500 truncate max-w-[150px]">
                {file.name}
            </span>
        )}
    </div>
  </div>
);

// Componente Principal
export default function DatacreditoProcessingPage() {
    // 1. Consumir el hook con toda la lógica de la API/Estado
    const {
        processDatacreditoFiles,
        status,
        error,
        downloadUrl,
        isLoading,
        resetProcess,
        isPolling,
        isLocked
    } = useDataCreditoProcess();

    // 2. Estado de archivos y empresa (se mantienen en el componente de UI)
    const [planoFile, setPlanoFile] = useState(null);
    const [correccionesFile, setCorreccionesFile] = useState(null);
    const [empresa, setEmpresa] = useState('FINANSUEÑOS');

    // 3. Función de reinicio completo (limpia hook + archivos)
    const handleFullReset = () => {
        resetProcess();
        setPlanoFile(null);
        setCorreccionesFile(null);
    };

    // 4. Función de envío
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!planoFile || !correccionesFile) {
            alert('Por favor, selecciona ambos archivos.');
            return;
        }

        // Llamar a la función principal del hook
        await processDatacreditoFiles({ planoFile, correccionesFile, empresa });
    };

    // Icono principal según el estado
    const renderHeaderIcon = () => {
        switch (status) {
            case 'completed':
                return <CheckCircleIcon className="w-8 h-8 text-green-600" />;
            case 'uploading':
            case 'processing:start':
                return <CloudArrowUpIcon className="w-8 h-8 text-gray-900" />;
            case 'polling':
                return <ClockIcon className="w-8 h-8 text-yellow-600" />;
            case 'error':
                return <TrashIcon className="w-8 h-8 text-red-600" />;
            default:
                // Uso del icono principal del color solicitado: rgba(5, 25, 49) -> gray-900
                return <CreditCardIcon className="w-8 h-8 text-gray-900" />; 
        }
    }


    // El Layout se mantiene, enfocando el estilo en el div interno.
    return (
        <AuthenticatedLayout>
            <div className="container mx-auto p-6 min-h-screen bg-gray-50"> {/* Fondo ligero */}
                <div className="bg-white p-8 rounded-lg border border-gray-200 relative max-w-lg mx-auto">
                    
                    {/* Encabezado Minimalista */}
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                        <div className="flex items-center space-x-4">
                            <div className="p-2 bg-gray-100 rounded-full">
                                {renderHeaderIcon()}
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-gray-900">Carga DATACREDITO</h3>
                                <p className="text-sm text-gray-500">Proceso asíncrono de generación de reporte.</p>
                            </div>
                        </div>
                        
                        {/* Botón de Reinicio (Más discreto) */}
                        {(status !== 'idle' && status !== 'uploading') && (
                            <button 
                                onClick={handleFullReset}
                                className="text-xs font-medium text-gray-500 hover:text-red-600 transition-colors flex items-center"
                                title="Cancelar / Nuevo Proceso"
                            >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* FORMULARIO */}
                    <form onSubmit={handleSubmit}> 
                        
                        {/* INPUTS - Deshabilitados si el proceso está activo */}
                        <div className={`space-y-6 transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                            
                            {/* Selector de Empresa */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">1. Empresa</label>
                                <select
                                    value={empresa}
                                    onChange={(e) => setEmpresa(e.target.value)}
                                    disabled={isLocked}
                                    className="block w-full px-3 py-2 text-base border border-gray-300 focus:outline-none focus:ring-gray-900 focus:border-gray-900 sm:text-sm rounded-lg transition-all"
                                >
                                    <option>FINANSUEÑOS</option>
                                    <option>ARPESOD</option>
                                </select>
                            </div>

                            <FileInput 
                                label="2. Archivo Plano (.txt)" 
                                accept=".txt"
                                onChange={setPlanoFile}
                                disabled={isLocked}
                                file={planoFile}
                            />
                            <FileInput 
                                label="3. Archivo de Correcciones (.xlsx)" 
                                accept=".xlsx"
                                onChange={setCorreccionesFile}
                                disabled={isLocked}
                                file={correccionesFile}
                            />
                        </div>

                        {/* --- ZONA DE ESTADO Y FEEDBACK --- */}
                        <div className="mt-8">
                            
                            {/* ERROR */}
                            {error && (
                                <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-medium mb-4">
                                    {error}
                                </div>
                            )}

                            {/* BOTÓN INICIAL (Color Principal: gray-900) */}
                            {status === 'idle' && (
                                <button 
                                    type="submit" 
                                    disabled={!planoFile || !correccionesFile}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-base font-bold text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
                                >
                                    Iniciar Proceso
                                </button>
                            )}

                            {/* ESTADO: SUBIENDO / INICIANDO (Feedback sutil) */}
                            {(status === 'uploading' || status === 'processing:start') && (
                                <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border border-gray-200 animate-fadeIn">
                                    <ArrowPathIcon className="w-10 h-10 text-gray-700 animate-spin mb-3" />
                                    <span className="text-lg font-bold text-gray-900">
                                        {status === 'uploading' ? 'Subiendo archivos a S3...' : 'Iniciando tarea asíncrona...'}
                                    </span>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {status === 'uploading' ? 'Paso 2/4: Subida directa a la nube.' : 'Paso 3/4: Solicitando al servidor iniciar el procesamiento.'}
                                    </p>
                                </div>
                            )}

                            {/* ESTADO: PROCESANDO (Polling) */}
                            {isPolling && status !== 'processing:start' && (
                                <div className="flex flex-col items-center justify-center py-8 bg-yellow-50 rounded-lg border border-yellow-300 animate-fadeIn">
                                    <ClockIcon className="w-12 h-12 text-yellow-600 animate-pulse mb-3" />
                                    <span className="text-lg font-bold text-yellow-800">Procesando datos...</span>
                                    <p className="text-sm text-yellow-700 mt-2 text-center max-w-xs">
                                        Paso 4/4: **El proceso es en segundo plano.** Puedes recargar o salir.
                                    </p>
                                </div>
                            )}

                            {/* ESTADO: COMPLETADO (Verde) */}
                            {status === 'completed' && (
                                <div className="flex flex-col items-center justify-center py-8 bg-green-50 rounded-lg border border-green-300 animate-fadeIn">
                                    <DocumentArrowDownIcon className="w-14 h-14 text-green-600 mb-3" />
                                    <span className="text-xl font-bold text-green-800">¡Reporte Generado!</span>
                                    <p className="text-sm text-green-700 mb-6">El archivo está listo para descargar.</p>
                                    
                                    <a 
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        // Botón de descarga con color principal: gray-900
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 transition-all"
                                    >
                                        Descargar Resultado (.xlsx)
                                    </a>
                                    
                                    <button 
                                        onClick={handleFullReset}
                                        className="mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
                                    >
                                        Procesar otro archivo
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}