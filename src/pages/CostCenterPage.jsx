// src/pages/CostCenterPage.jsx
import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useCostCenter } from '../hooks/useCostCenter';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaMapMarkerAlt, FaHashtag, FaSearch } from 'react-icons/fa';

// ===============================================
// PALETA CORPORATIVA PREMIUM: rgba(5,25,49)
// ===============================================
const CORP_BG = 'bg-[rgba(5,25,49)]';
const CORP_TEXT = 'text-[rgba(5,25,49)]';
const CORP_HOVER_BG = 'hover:bg-[rgba(10,40,75)]'; // Un tono sutilmente más claro para interacción
const CORP_FOCUS_RING = 'focus:ring-2 focus:ring-[rgba(5,25,49)]/30 focus:border-[rgba(5,25,49)]';
const CORP_BADGE_BG = 'bg-[rgba(5,25,49)]/10';
const CORP_BADGE_RING = 'ring-[rgba(5,25,49)]/20';

export default function CostCenterPage() {
    const {
        costCenters, 
        filteredCostCenters,
        regionals, 
        loading, 
        error,
        searchTerm,
        setSearchTerm,
        isModalOpen, 
        isEditingMode, 
        isSubmitting, 
        modalError, 
        formData,
        handleInputChange, 
        openCreateModal, 
        openEditModal, 
        closeModal, 
        handleSave, 
        handleDelete
    } = useCostCenter();

    if (loading && costCenters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <FaSpinner className={`animate-spin text-4xl ${CORP_TEXT} opacity-90`} />
                <span className="mt-4 text-sm font-semibold text-slate-500 tracking-wide uppercase">Cargando información...</span>
            </div>
        );
    }

    return (
        <AuthenticatedLayout title="Gestión de Centros de Costo">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* CABECERA Y ACCIONES */}
                <div className="sm:flex sm:items-center sm:justify-between mb-8">
                    <div>
                        <h1 className={`text-2xl font-extrabold ${CORP_TEXT} tracking-tight`}>Centros de Costo</h1>
                        
                    </div>
                    
                    <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4 items-center">
                        {/* BARRA DE BÚSQUEDA */}
                        <div className="relative w-full sm:w-80">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <FaSearch className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar por centro o regional..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 sm:text-sm sm:leading-6 transition-all ${CORP_FOCUS_RING} shadow-sm`}
                            />
                        </div>

                        {/* BOTÓN CREAR */}
                        <button 
                            onClick={openCreateModal} 
                            className={`${CORP_BG} text-white w-full sm:w-auto px-5 py-2.5 rounded-lg shadow-md ${CORP_HOVER_BG} flex items-center justify-center text-sm font-semibold transition-all duration-200 active:scale-95 hover:shadow-lg`}
                        >
                            <FaPlus className="mr-2.5 text-xs opacity-90" /> 
                            Nuevo Centro
                        </button>
                    </div>
                </div>

                {/* ALERTAS DE ERROR GLOBALES */}
                {error && (
                    <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm animate-fade-in">
                        <div className="flex">
                            <div className="flex-shrink-0 text-red-400">🚨</div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">{error}</h3>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* CONTENEDOR PRINCIPAL DE LA TABLA */}
                <div className="bg-white shadow-sm ring-1 ring-slate-200 sm:rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50/80">
                                <tr>
                                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${CORP_TEXT} uppercase tracking-wider`}>
                                        Código
                                    </th>
                                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${CORP_TEXT} uppercase tracking-wider`}>
                                        Nombre del Centro
                                    </th>
                                    <th scope="col" className={`px-6 py-4 text-left text-xs font-bold ${CORP_TEXT} uppercase tracking-wider`}>
                                        Regional Asociada
                                    </th>
                                    <th scope="col" className={`px-6 py-4 text-center text-xs font-bold ${CORP_TEXT} uppercase tracking-wider relative`}>
                                        <span className="sr-only">Acciones</span>
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {filteredCostCenters.map((center) => (
                                    <tr key={center.id} className="hover:bg-slate-50/70 transition-colors duration-150 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-bold text-slate-900">{center.id}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-slate-700 font-medium">{center.cost_center_name}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {center.regional?.name_regional ? (
                                                <span className={`inline-flex items-center rounded-md ${CORP_BADGE_BG} px-2.5 py-1 text-xs font-bold ${CORP_TEXT} ring-1 ring-inset ${CORP_BADGE_RING}`}>
                                                    {center.regional.name_regional}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-inset ring-slate-500/10">
                                                    Sin asignar
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex justify-center items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openEditModal(center)} 
                                                    className={`p-2 text-slate-400 hover:${CORP_TEXT} hover:${CORP_BADGE_BG} rounded-full transition-all duration-200`}
                                                    title="Editar"
                                                >
                                                    <FaEdit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(center.id)} 
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                                                    title="Eliminar"
                                                >
                                                    <FaTrash size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* ESTADOS VACÍOS */}
                                {filteredCostCenters.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm font-medium">
                                            {searchTerm 
                                                ? `No se encontraron resultados para "${searchTerm}"` 
                                                : "No se encontraron centros de costo registrados."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL CORPORATIVO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Fondo oscuro con desenfoque */}
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        {/* Contenedor del Modal */}
                        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg ring-1 ring-slate-200">
                            
                            {/* Borde superior decorativo corporativo */}
                            <div className={`h-2 w-full ${CORP_BG}`}></div>

                            <div className="bg-white px-4 pb-4 pt-5 sm:p-8 sm:pb-6">
                                <div className="sm:flex sm:items-start w-full">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className={`text-xl font-bold leading-6 ${CORP_TEXT} mb-6 border-b border-slate-100 pb-4`}>
                                            {isEditingMode ? 'Actualizar Información' : 'Registrar Nuevo Centro'}
                                        </h3>
                                        
                                        {modalError && (
                                            <div className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200 font-medium">
                                                {modalError}
                                            </div>
                                        )}

                                        <form onSubmit={handleSave} className="space-y-6">
                                            {/* Input Código */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                                    Código Identificador
                                                </label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <FaHashtag className="text-slate-400 sm:text-sm" />
                                                    </div>
                                                    <input
                                                        type="text" 
                                                        name="id"
                                                        value={formData.id}
                                                        onChange={handleInputChange}
                                                        disabled={isEditingMode} 
                                                        className={`block w-full rounded-md border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 sm:text-sm sm:leading-6 transition-all ${CORP_FOCUS_RING} ${isEditingMode ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                                                        placeholder="Ej: 10101"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            {/* Input Nombre */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                                    Nombre Descriptivo
                                                </label>
                                                <input
                                                    type="text"
                                                    name="cost_center_name"
                                                    value={formData.cost_center_name}
                                                    onChange={handleInputChange}
                                                    className={`block w-full rounded-md border-0 py-2.5 px-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 sm:text-sm sm:leading-6 transition-all shadow-sm ${CORP_FOCUS_RING}`}
                                                    placeholder="Ej: Popayan principal"
                                                    required
                                                />
                                            </div>
                                            
                                            {/* Select Regional */}
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">
                                                    Ubicación / Regional
                                                </label>
                                                <div className="relative rounded-md shadow-sm">
                                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <FaMapMarkerAlt className="text-slate-400 sm:text-sm" />
                                                    </div>
                                                    <select
                                                        name="regional_id"
                                                        value={formData.regional_id}
                                                        onChange={handleInputChange}
                                                        className={`block w-full rounded-md border-0 py-2.5 pl-10 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 sm:text-sm sm:leading-6 transition-all bg-white shadow-sm cursor-pointer ${CORP_FOCUS_RING}`}
                                                        required
                                                    >
                                                        <option value="" disabled className="text-slate-500">Seleccione una regional...</option>
                                                        {regionals.map(r => (
                                                            <option key={r.id} value={r.id}>
                                                                {r.name_regional} {r.ubication_regional ? `(${r.ubication_regional})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Acciones del Modal */}
                                            <div className="mt-8 pt-5 border-t border-slate-100 sm:flex sm:flex-row-reverse">
                                                <button 
                                                    type="submit" 
                                                    disabled={isSubmitting} 
                                                    className={`inline-flex w-full justify-center rounded-lg ${CORP_BG} px-5 py-2.5 text-sm font-bold text-white shadow-md ${CORP_HOVER_BG} sm:ml-3 sm:w-auto transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
                                                >
                                                    {isSubmitting ? (
                                                        <><FaSpinner className="animate-spin mr-2 mt-0.5" /> Procesando...</>
                                                    ) : (
                                                        isEditingMode ? 'Guardar Cambios' : 'Crear Registro'
                                                    )}
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={closeModal} 
                                                    className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}