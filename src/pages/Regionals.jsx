// src/pages/Regionals.jsx

import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { 
    PencilIcon, 
    TrashIcon, 
    PlusIcon, 
    XMarkIcon, 
    BuildingOfficeIcon, 
    MapPinIcon,
    MagnifyingGlassIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { useRegionals } from '../hooks/useRegionals';

// ===============================================
// CONSTANTES DE ESTILO CORPORATIVO
// ===============================================
const BRAND_COLOR = 'rgba(5,25,49)';
const BRAND_BG = 'bg-[rgba(5,25,49)]';
const BRAND_TEXT = 'text-[rgba(5,25,49)]';
const BRAND_RING = 'focus:ring-[rgba(5,25,49)] focus:border-[rgba(5,25,49)]';
const BRAND_HOVER_BG = 'hover:bg-[rgba(15,40,70)]'; 

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO
// ===============================================
const RegionalFormModal = ({ isOpen, onClose, regionalToEdit, onSave }) => {
    if (!isOpen) return null;

    const isEditing = !!regionalToEdit;
    
    const [formData, setFormData] = useState({
        id: regionalToEdit?.id || '', 
        name_regional: regionalToEdit?.name_regional || '',
        ubication_regional: regionalToEdit?.ubication_regional || '',
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        setFormData({
            id: regionalToEdit?.id || '',
            name_regional: regionalToEdit?.name_regional || '',
            ubication_regional: regionalToEdit?.ubication_regional || '',
        });
        setError(null);
    }, [regionalToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.name_regional.trim()) {
            setError('El nombre de la regional es obligatorio.');
            setLoading(false);
            return;
        }

        if (!isEditing && !formData.id.trim()) {
            setError('El ID de la regional es obligatorio para crear.');
            setLoading(false);
            return;
        }
        
        const result = await onSave(formData, isEditing);
        
        if (!result.success) {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className={`${BRAND_BG} px-6 py-4 flex justify-between items-center`}>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                        <BuildingOfficeIcon className="w-6 h-6 text-indigo-100" />
                        {isEditing ? 'Editar Regional' : 'Nueva Regional'}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="text-indigo-100 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="mb-6 p-4 text-sm font-medium text-red-800 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="id" className="block text-sm font-semibold text-gray-700 mb-1">
                                ID / Código de Regional
                            </label>
                            <input 
                                type="text" 
                                id="id"
                                name="id"
                                value={formData.id}
                                onChange={handleChange}
                                disabled={isEditing} 
                                className={`block w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all ${isEditing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : `focus:bg-white focus:ring-2 ${BRAND_RING} focus:border-transparent`}`}
                                placeholder="Ej: 101"
                                required
                            />
                            {isEditing && <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1"><MapPinIcon className="w-3 h-3"/> El ID es un identificador único y no puede modificarse.</p>}
                        </div>

                        <div>
                            <label htmlFor="name_regional" className="block text-sm font-semibold text-gray-700 mb-1">
                                Nombre de la Regional
                            </label>
                            <input 
                                type="text" 
                                id="name_regional"
                                name="name_regional"
                                value={formData.name_regional}
                                onChange={handleChange}
                                className={`block w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all focus:bg-white focus:ring-2 ${BRAND_RING} focus:border-transparent`}
                                placeholder="Ej: Popayán Centro"
                                required
                            />
                        </div>
                        
                        <div>
                            <label htmlFor="ubication_regional" className="block text-sm font-semibold text-gray-700 mb-1">
                                Ubicación Geográfica
                            </label>
                            <input
                                type="text" 
                                id="ubication_regional"
                                name="ubication_regional"
                                value={formData.ubication_regional}
                                onChange={handleChange}
                                className={`block w-full p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm transition-all focus:bg-white focus:ring-2 ${BRAND_RING} focus:border-transparent`}
                                placeholder="Ej: Cauca"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex gap-3">
                            <button 
                                type="button"
                                onClick={onClose}
                                className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-md text-white font-semibold ${BRAND_BG} ${BRAND_HOVER_BG} disabled:opacity-70 disabled:cursor-not-allowed transition-all flex justify-center items-center gap-2`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Guardando...
                                    </span>
                                ) : (
                                    isEditing ? 'Actualizar Regional' : 'Guardar Regional'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// 2. COMPONENTE PRINCIPAL VISTA
// ===============================================
export default function Regionals() {
    const {
        regionals,
        filteredRegionals,
        loading,
        error,
        isModalOpen,
        editingRegional,
        searchTerm,
        setSearchTerm,
        filterName,
        setFilterName,
        filterUbication,
        setFilterUbication,
        uniqueNames,
        uniqueUbications,
        handleCreateClick,
        handleEditClick,
        closeModal,
        saveRegional,
        deleteRegional
    } = useRegionals();

    return (
        <AuthenticatedLayout title="Gestión de Regionales">
            
            {/* Header de la vista */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${BRAND_TEXT}`}>Directorio regionales</h1>
                </div>
                
                <button 
                    onClick={handleCreateClick}
                    className={`group flex items-center px-5 py-2.5 ${BRAND_BG} text-white font-medium rounded-lg ${BRAND_HOVER_BG} transition-all shadow-md hover:shadow-lg whitespace-nowrap`}
                >
                    <PlusIcon className="w-5 h-5 mr-2 transform group-hover:rotate-90 transition-transform" />
                    Registrar Regional
                </button>
            </div>

            {/* SECCIÓN DE FILTROS PREMIUM */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                
                {/* Barra de Búsqueda */}
                <div className="relative w-full md:w-1/3">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por ID, nombre o ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 ${BRAND_RING} sm:text-sm transition-colors`}
                    />
                </div>

                {/* Filtros Selectores */}
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <FunnelIcon className={`h-5 w-5 ${BRAND_TEXT} opacity-70`} />
                        <select
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            className={`block w-full sm:w-48 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 ${BRAND_RING} sm:text-sm rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border`}
                        >
                            <option value="">Todas las Regionales</option>
                            {uniqueNames.map((name, idx) => (
                                <option key={idx} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <MapPinIcon className={`h-5 w-5 ${BRAND_TEXT} opacity-70`} />
                        <select
                            value={filterUbication}
                            onChange={(e) => setFilterUbication(e.target.value)}
                            className={`block w-full sm:w-48 pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 ${BRAND_RING} sm:text-sm rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border`}
                        >
                            <option value="">Todas las Ubicaciones</option>
                            {uniqueUbications.map((ubic, idx) => (
                                <option key={idx} value={ubic}>{ubic}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Manejo de Estados: Loading y Error */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <svg className={`animate-spin h-10 w-10 ${BRAND_TEXT} mb-4`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <p className="text-gray-500 font-medium">Cargando información del directorio...</p>
                </div>
            )}
            
            {error && (
                <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-xl shadow-sm flex items-start gap-3">
                    <XMarkIcon className="w-6 h-6 text-red-500 mt-0.5" />
                    <div>
                        <h3 className="text-red-800 font-bold">Error de conexión</h3>
                        <p className="text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Contenedor Principal de la Tabla */}
            {!loading && !error && (
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* Cabecera Corporativa */}
                            <thead className={`${BRAND_BG}`}>
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        ID / Código
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Regional
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        Ubicación
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredRegionals.length > 0 ? (
                                    filteredRegionals.map((regional) => (
                                        <tr key={regional.id} className="hover:bg-slate-50/80 transition-colors duration-200 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-bold bg-slate-100 ${BRAND_TEXT}`}>
                                                    {regional.id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-8 w-8 rounded-full ${BRAND_BG} bg-opacity-10 flex items-center justify-center mr-3`}>
                                                        <BuildingOfficeIcon className={`h-4 w-4 ${BRAND_TEXT}`} />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {regional.name_regional}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                                                    {regional.ubication_regional}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => handleEditClick(regional)}
                                                        className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-transparent hover:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                        title="Editar regional"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteRegional(regional.id)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-transparent hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                                                        title="Eliminar regional"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    /* Estado Vacío de Búsqueda */
                                    <tr>
                                        <td colSpan="4" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className={`h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4`}>
                                                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900">No se encontraron resultados</h3>
                                                <p className="mt-1 text-sm text-gray-500 max-w-sm">
                                                    Intenta ajustar los filtros de búsqueda o cambiar los términos ingresados.
                                                </p>
                                                {(searchTerm || filterName || filterUbication) && (
                                                    <button
                                                        onClick={() => {
                                                            setSearchTerm('');
                                                            setFilterName('');
                                                            setFilterUbication('');
                                                        }}
                                                        className={`mt-4 text-sm font-medium ${BRAND_TEXT} hover:underline`}
                                                    >
                                                        Limpiar todos los filtros
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <RegionalFormModal 
                isOpen={isModalOpen}
                onClose={closeModal}
                regionalToEdit={editingRegional}
                onSave={saveRegional}
            />

        </AuthenticatedLayout>
    );
}