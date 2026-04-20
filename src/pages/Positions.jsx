// src/pages/Positions.jsx
import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { usePositions } from '../hooks/usePositions';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, BriefcaseIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const PRIMARY_COLOR = 'rgba(5, 25, 49, 1)';

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO PARA PUESTOS
// ===============================================
const PositionFormModal = ({ isOpen, onClose, positionToEdit, onCreate, onUpdate }) => {
    const isEditing = !!positionToEdit;
    
    const [formData, setFormData] = useState({
        name_position: '',
        description_position: '',
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setFormData({
                name_position: positionToEdit?.name_position || '',
                description_position: positionToEdit?.description_position || '',
            });
            setError(null);
        }
    }, [positionToEdit, isOpen]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!formData.name_position.trim()) {
            setError('El nombre del puesto es obligatorio.');
            setLoading(false);
            return;
        }
        
        try {
            const dataToSend = {
                name_position: formData.name_position.trim(),
                description_position: formData.description_position.trim()
            };

            if (isEditing) {
                await onUpdate(positionToEdit.id, dataToSend);
            } else {
                await onCreate(dataToSend);
            }

            onClose();
        } catch (err) {
            console.error("Error al guardar puesto:", err.response?.data || err);
            const apiErrors = err?.response?.data?.errors;
            let errorMessage = err?.response?.data?.message || "Ocurrió un error al procesar la solicitud.";
            
            if (apiErrors) {
                 errorMessage += ": " + Object.keys(apiErrors).map(key => apiErrors[key].join(', ')).join(' | ');
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <h3 className="text-xl font-bold tracking-tight text-gray-900" style={{ color: PRIMARY_COLOR }}>
                        {isEditing ? 'Editar Puesto' : 'Crear Nuevo Puesto'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-50">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 bg-white">
                    {error && (
                        <div className="p-4 mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl font-medium">
                            {error}
                        </div>
                    )}

                    <div className="mb-6">
                        <label htmlFor="name_position" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Nombre del Puesto
                        </label>
                        <input 
                            type="text" 
                            id="name_position"
                            name="name_position"
                            value={formData.name_position}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-1 transition-all outline-none text-gray-800 shadow-sm"
                            style={{ '--tw-ring-color': PRIMARY_COLOR }}
                            placeholder="Ej. Desarrollador Senior"
                            required
                        />
                    </div>
                    
                    <div className="mb-8">
                        <label htmlFor="description_position" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Descripción
                        </label>
                        <textarea
                            id="description_position"
                            name="description_position"
                            value={formData.description_position}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-offset-1 transition-all outline-none resize-none text-gray-800 shadow-sm"
                            style={{ '--tw-ring-color': PRIMARY_COLOR }}
                            placeholder="Describe brevemente las funciones..."
                        />
                    </div>

                    <div className="flex gap-4 pt-2">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="w-1/3 py-3 px-4 rounded-xl text-gray-600 font-bold bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-2/3 py-3 px-4 rounded-xl text-white font-bold shadow-lg hover:opacity-90 transition-all disabled:opacity-50 active:scale-[0.98]"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            {loading ? 'Procesando...' : (isEditing ? 'Guardar Cambios' : 'Crear Puesto')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// 2. COMPONENTE PRINCIPAL Positions
// ===============================================
export default function Positions() {
    const { 
        positions, 
        loading, 
        error, 
        createPosition, 
        updatePosition, 
        deletePosition 
    } = usePositions();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const handleCreateClick = () => {
        setEditingPosition(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (position) => {
        setEditingPosition(position);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (positionId) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de forma permanente?")) return;
        try {
            await deletePosition(positionId);
        } catch (err) {
            alert('Error al eliminar el puesto.');
        }
    };

    const filteredPositions = positions.filter(p => 
        p.name_position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AuthenticatedLayout title="Estructura Organizacional">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight" style={{ color: PRIMARY_COLOR }}>Gestión de Puestos</h2>
                </div>
                
                <button 
                    onClick={handleCreateClick}
                    className="flex items-center justify-center px-6 py-3 text-white rounded-xl transition-all shadow-[0_4px_14px_0_rgba(5,25,49,0.39)] hover:shadow-[0_6px_20px_rgba(5,25,49,0.23)] active:scale-95 font-bold tracking-wide"
                    style={{ backgroundColor: PRIMARY_COLOR }}
                >
                    <PlusIcon className="w-5 h-5 mr-2 stroke-[3px]" />
                    Nuevo Puesto
                </button>
            </div>

            <div className="mb-8 relative group max-w-xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-gray-800 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar puesto por nombre..."
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl leading-5 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all shadow-sm text-gray-800 font-medium placeholder-gray-400"
                    style={{ '--tw-ring-color': PRIMARY_COLOR }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl font-medium">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="py-24 flex flex-col items-center justify-center space-y-5">
                        <div className="w-12 h-12 border-4 border-t-transparent animate-spin rounded-full" style={{ borderColor: `${PRIMARY_COLOR} transparent ${PRIMARY_COLOR} transparent` }}></div>
                        <p className="text-gray-500 font-bold tracking-wide">Sincronizando datos...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Información del Puesto</th>
                                    <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Descripción</th>
                                    <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredPositions.length > 0 ? (
                                    filteredPositions.map((position) => (
                                        <tr key={position.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-8 py-5 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:shadow-sm transition-all" style={{ color: PRIMARY_COLOR }}>
                                                        <BriefcaseIcon className="h-6 w-6 stroke-[1.5px]" />
                                                    </div>
                                                    <div className="ml-5">
                                                        <div className="text-sm font-bold text-gray-900">{position.name_position}</div>
                                                        <div className="text-xs text-gray-400 font-medium tracking-wide mt-0.5">ID: #{position.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-gray-600 max-w-md truncate font-medium">
                                                    {position.description_position || <span className="italic text-gray-300">Sin descripción registrada</span>}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-3">
                                                    <button 
                                                        onClick={() => handleEditClick(position)}
                                                        className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                                                        title="Editar Puesto"
                                                    >
                                                        <PencilIcon className="w-5 h-5 stroke-[2px]" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClick(position.id)}
                                                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Eliminar Puesto"
                                                    >
                                                        <TrashIcon className="w-5 h-5 stroke-[2px]" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-8 py-20 text-center">
                                            <div className="flex flex-col items-center">
                                                <div className="p-5 bg-gray-50 rounded-3xl mb-5 text-gray-300 border border-gray-100">
                                                    <BriefcaseIcon className="w-12 h-12 stroke-1" />
                                                </div>
                                                <p className="text-gray-800 font-bold text-lg mb-1">No hay puestos registrados</p>
                                                <p className="text-gray-500 font-medium text-sm">Crea un nuevo puesto para organizar tu equipo de trabajo.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <PositionFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                positionToEdit={editingPosition}
                onCreate={createPosition}
                onUpdate={updatePosition}
            />
        </AuthenticatedLayout>
    );
}