import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, AlertCircle } from 'lucide-react';
import { TableWithColumnSelector } from './DashboardComponents';

/**
 * Componente Reutilizable para cargar tablas desde el backend
 */
const TablaRemota = ({ titulo, origen, apiClient, jobId, selectedFilters }) => {
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [meta, setMeta] = useState({ total_paginas: 0, total_registros: 0 });
    const [error, setError] = useState(null);

    const fetchData = async () => {
        if (!jobId) return;
        
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post('/wallet/buscar', {
                job_id: jobId,
                origen: origen, 
                page: page,
                page_size: 20,
                ...selectedFilters 
            });
            
            // --- CORRECCIÓN CLAVE AQUÍ ---
            // 1. Accedemos directamente a la lista de registros
            const items = response.data?.data || [];
            
            // 2. Accedemos a los metadatos de paginación
            // Tu controlador PHP devuelve "meta" con keys: "total", "pages", etc.
            const metaInfo = response.data?.meta || {};

            setData(items);
            setMeta({
                total_paginas: metaInfo.pages || 0,     // PHP devuelve 'pages'
                total_registros: metaInfo.total || 0    // PHP devuelve 'total'
            });

            // Generar columnas dinámicamente basadas en el primer registro
            if (items.length > 0) {
                // Filtramos columnas internas que no queremos mostrar si es necesario
                const colKeys = Object.keys(items[0]).filter(key => key !== '__index_level_0__');
                setColumns(colKeys);
            }
        } catch (err) {
            console.error(`Error cargando tabla ${origen}:`, err);
            setError("No se pudieron cargar los datos. Verifica que el archivo exista.");
        } finally {
            setLoading(false);
        }
    };

    // Reiniciar a página 1 si cambian los filtros globales
    useEffect(() => {
        setPage(1);
    }, [JSON.stringify(selectedFilters), jobId]);

    // Cargar datos al cambiar página, job o filtros
    useEffect(() => {
        fetchData();
    }, [page, jobId, JSON.stringify(selectedFilters)]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
            {error ? (
                <div className="p-8 flex flex-col items-center justify-center text-red-400">
                    <AlertCircle className="mb-2" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            ) : (
                <>
                    <TableWithColumnSelector 
                        title={titulo}
                        data={data}
                        columns={columns}
                        currentPage={page}
                        totalPages={meta.total_paginas}
                        onPageChange={setPage}
                        loading={loading}
                    />
                    {/* Footer de información de la tabla */}
                    {!loading && data.length > 0 && (
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                                Total Registros: {meta.total_registros.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                                Archivo: {origen}.parquet
                            </span>
                        </div>
                    )}
                    {!loading && data.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            No se encontraron registros con los filtros actuales.
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

/**
 * Vista Principal: Datos Detallados
 */
const DatosDetallados = ({ apiClient, jobId, selectedFilters }) => {
    
    if (!jobId) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <RefreshCw className="animate-spin mb-2" />
                <p className="text-sm font-bold uppercase">Esperando identificador de reporte...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
                    <Database size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        Explorador de Datos Maestro
                    </h2>
                   
                </div>
            </div>

            {/* IMPORTANTE: He quitado el prefijo "data/" en la propiedad origen.
               Generalmente los archivos se guardan como {job_id}/detallados_cartera.parquet 
               Si tu estructura real incluye la carpeta data, agrégalo de nuevo, pero 
               la causa principal del error era el parsing del JSON arriba.
            */}

            {/* TABLA 1: CARTERA */}
            <TablaRemota 
                titulo="Detallado de Cartera"
                origen="detallados_cartera" 
                apiClient={apiClient}
                jobId={jobId}
                selectedFilters={selectedFilters}
            />

            {/* TABLA 2: NOVEDADES */}
            <TablaRemota 
                titulo="Detallado de Novedades"
                origen="detallados_novedades"
                apiClient={apiClient}
                jobId={jobId}
                selectedFilters={selectedFilters}
            />
            
            <div className="text-center pb-10 opacity-40">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">
                    Motor de Búsqueda Polars
                </p>
            </div>
        </div>
    );
};

export default DatosDetallados;