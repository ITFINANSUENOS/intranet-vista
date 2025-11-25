import React, { useState } from 'react';
import { CreditCardIcon, ClockIcon, CheckCircleIcon, ArrowPathIcon, TrashIcon } from '@heroicons/react/24/outline';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
// Importamos el hook
import { useDataCreditoProcess } from '../context/useDataCreditoProcess'; 

// Sub-componente para el Input de Archivo
const FileInput = ({ label, accept, onChange, disabled, file }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      type="file"
      accept={accept}
      onChange={(e) => onChange(e.target.files[0])}
      disabled={disabled}
      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      key={file?.name || 'file-input'} // Resetear el input si se limpia el archivo
    />
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

    return (
        // *** Layout Solicitado ***
        <AuthenticatedLayout>
            <div className="container mx-auto p-6">
                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl relative overflow-hidden max-w-lg mx-auto">
                    
                    {/* Encabezado */}
                    <div className="flex items-center space-x-4 mb-6 border-b border-gray-100 pb-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                            <CreditCardIcon className="w-8 h-8 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">Cargar Archivo DATACREDITO</h3>
                            <p className="text-sm text-gray-500">Proceso asíncrono usando API autenticada.</p>
                        </div>
                        
                        {/* Botón de Reinicio (Disponible si no está en idle o uploading) */}
                        {(status !== 'idle' && status !== 'uploading') && (
                            <button 
                                onClick={handleFullReset}
                                className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-sm flex items-center"
                                title="Cancelar / Nuevo Proceso"
                            >
                                <TrashIcon className="w-4 h-4 mr-1" />
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* FORMULARIO */}
                    <form onSubmit={handleSubmit}> 
                        
                        {/* INPUTS - Se deshabilitan si el proceso está activo */}
                        <div className={`space-y-5 transition-opacity duration-300 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">1. Empresa</label>
                                <select
                                    value={empresa}
                                    onChange={(e) => setEmpresa(e.target.value)}
                                    disabled={isLocked}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">
                                    {error}
                                </div>
                            )}

                            {/* BOTÓN INICIAL */}
                            {status === 'idle' && (
                                <button 
                                    type="submit" 
                                    disabled={!planoFile || !correccionesFile}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
                                >
                                    Iniciar Proceso
                                </button>
                            )}

                            {/* ESTADO: SUBIENDO / INICIANDO */}
                            {(status === 'uploading' || status === 'processing:start') && (
                                <div className="flex flex-col items-center justify-center py-8 bg-blue-50 rounded-xl border border-blue-100 animate-fadeIn">
                                    <ArrowPathIcon className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                                    <span className="text-lg font-bold text-blue-800">
                                        {status === 'uploading' ? 'Subiendo archivos a S3...' : 'Iniciando tarea asíncrona...'}
                                    </span>
                                    <p className="text-sm text-blue-600 mt-1">
                                        {status === 'uploading' ? 'Paso 2/4: Subida directa a la nube.' : 'Paso 3/4: Solicitando al servidor iniciar el procesamiento.'}
                                    </p>
                                </div>
                            )}

                            {/* ESTADO: PROCESANDO (Polling) */}
                            {isPolling && status !== 'processing:start' && (
                                <div className="flex flex-col items-center justify-center py-8 bg-yellow-50 rounded-xl border border-yellow-100 animate-fadeIn">
                                    <ClockIcon className="w-12 h-12 text-yellow-500 animate-bounce mb-3" />
                                    <span className="text-lg font-bold text-yellow-800">Procesando datos...</span>
                                    <p className="text-sm text-yellow-700 mt-2 text-center max-w-xs">
                                        Paso 4/4: **El proceso es en segundo plano.** Puedes recargar o salir.
                                    </p>
                                </div>
                            )}

                            {/* ESTADO: COMPLETADO (Verde) */}
                            {status === 'completed' && (
                                <div className="flex flex-col items-center justify-center py-8 bg-green-50 rounded-xl border border-green-100 animate-fadeIn">
                                    <CheckCircleIcon className="w-14 h-14 text-green-500 mb-3" />
                                    <span className="text-xl font-bold text-green-800">¡Reporte Generado!</span>
                                    <p className="text-sm text-green-600 mb-6">El archivo está listo para descargar.</p>
                                    
                                    <a 
                                        href={downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                                    >
                                        Descargar Resultado (.xlsx)
                                    </a>
                                    
                                    <button 
                                        onClick={handleFullReset}
                                        className="mt-4 text-sm text-green-700 hover:underline"
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