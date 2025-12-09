// src/pages/Regionals.jsx - CÓDIGO FINAL CON ESTILOS AJUSTADOS

import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// Define la clase de Tailwind para el nuevo color
// Nota: Tailwind CSS a veces requiere configuración para colores rgba literales, 
// pero usar la sintaxis `bg-[...]` funciona bien para integración rápida.
const PRIMARY_COLOR_CLASS = 'bg-[rgba(5,25,49)]'; 
const PRIMARY_TEXT_COLOR_CLASS = 'text-[rgba(5,25,49)]';

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO PARA REGIONALES
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
    const { apiClient } = useAuth();

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
        
        try {
            const dataToSend = {
                name_regional: formData.name_regional.trim(),
                ubication_regional: formData.ubication_regional.trim()
            };
            
            if (!isEditing) {
                dataToSend.id = formData.id.trim();
            }

            const url = isEditing ? `/regionals/${regionalToEdit.id}` : '/regionals';
            const method = isEditing ? apiClient.put : apiClient.post;
            
            const response = await method(url, dataToSend);
            
            onSave(response.data.data || response.data);
            onClose();

        } catch (err) {
            console.error("Error al guardar regional:", err.response?.data || err);
            const apiErrors = err.response?.data?.errors;
            let errorMessage = err.response?.data?.message || "Error al guardar la regional.";
            
            if (apiErrors) {
                 errorMessage += ": " + Object.keys(apiErrors).map(key => apiErrors[key].join(', ')).join(' | ');
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                
                {/* TÍTULO DEL MODAL CON EL NUEVO COLOR DE TEXTO */}
                <h3 className={`text-2xl font-bold ${PRIMARY_TEXT_COLOR_CLASS} mb-4 border-b pb-2`}>
                    {isEditing ? 'Editar Regional' : 'Crear Nueva Regional'}
                </h3>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    
                    {/* Input ID */}
                    <div className="mb-4">
                        <label htmlFor="id" className="block text-sm font-medium text-gray-700">ID / Código</label>
                        <input 
                            type="text" 
                            id="id"
                            name="id"
                            value={formData.id}
                            onChange={handleChange}
                            disabled={isEditing} 
                            className={`mt-1 block w-full p-3 border rounded-md shadow-sm ${isEditing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                            placeholder="Ej: 101"
                            required
                        />
                         {isEditing && <p className="text-xs text-gray-500 mt-1">El ID no se puede modificar una vez creado.</p>}
                    </div>

                    {/* Input Nombre */}
                    <div className="mb-4">
                        <label htmlFor="name_regional" className="block text-sm font-medium text-gray-700">Nombre de la Regional</label>
                        <input 
                            type="text" 
                            id="name_regional"
                            name="name_regional"
                            value={formData.name_regional}
                            onChange={handleChange}
                            // Usar el nuevo color para el enfoque (focus:border) si se desea acentuar, sino se deja indigo
                            className={`mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[rgba(5,25,49)] focus:border-[rgba(5,25,49)]`}
                            required
                        />
                    </div>
                    
                    {/* Input Ubicación */}
                    <div className="mb-6">
                        <label htmlFor="ubication_regional" className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <input
                            type="text" 
                            id="ubication_regional"
                            name="ubication_regional"
                            value={formData.ubication_regional}
                            onChange={handleChange}
                            // Usar el nuevo color para el enfoque
                            className={`mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-[rgba(5,25,49)] focus:border-[rgba(5,25,49)]`}
                            required
                        />
                    </div>

                    {/* BOTÓN SUBMIT CON EL NUEVO COLOR DE FONDO */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${PRIMARY_COLOR_CLASS} hover:bg-gray-800 disabled:bg-gray-400 transition font-bold`}
                    >
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar Regional' : 'Crear Regional')}
                    </button>
                </form>
            </div>
        </div>
    );
};


// ===============================================
// 2. COMPONENTE PRINCIPAL Regionals
// ===============================================

export default function Regionals() {
    const { apiClient } = useAuth();
    const [regionals, setRegionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegional, setEditingRegional] = useState(null);

    // ... (Lógica de fetchRegionals y CRUD se mantiene igual)

    const fetchRegionals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/regionals');
            setRegionals(response.data.data || response.data); 
        } catch (err) {
            setError('Error al cargar las regionales. Asegúrate de que el backend esté corriendo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiClient]);

    useEffect(() => {
        fetchRegionals();
    }, [fetchRegionals]);

    const handleCreateClick = () => {
        setEditingRegional(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (regional) => {
        setEditingRegional(regional);
        setIsModalOpen(true);
    };

    const handleSave = (savedRegional) => {
        if (editingRegional) {
            setRegionals(regionals.map(r => r.id === savedRegional.id ? savedRegional : r));
        } else {
            setRegionals([savedRegional, ...regionals]);
        }
        setEditingRegional(null);
    };
    
    const handleDeleteClick = async (regionalId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta regional ten encuenta que se puede eliminar el centro de costo?")) return;

        try {
            await apiClient.delete(`/regionals/${regionalId}`);
            setRegionals(regionals.filter(r => r.id !== regionalId));
        } catch (err) {
            setError('Error al eliminar la regional.');
            console.error(err);
        }
    };


    return (
        <AuthenticatedLayout title="Gestión de Regionales">
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Listado y administración de sedes regionales.</p>
                {/* BOTÓN PRINCIPAL CON EL NUEVO COLOR DE FONDO */}
                <button 
                    onClick={handleCreateClick}
                    className={`flex items-center px-4 py-2 ${PRIMARY_COLOR_CLASS} text-white rounded-lg hover:bg-gray-800 transition shadow-md`}
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Regional
                </button>
            </div>

            {loading && <div className="text-center py-10">Cargando regionales...</div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded mb-4">{error}</div>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* TEXTO DEL ENCABEZADO CON EL NUEVO COLOR */}
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>ID / Código</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Regional</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Ubicación</th>
                                    <th className={`px-6 py-3 text-right text-xs font-medium ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {regionals.length > 0 ? (
                                    regionals.map((regional) => (
                                        <tr key={regional.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {regional.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {regional.name_regional}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {regional.ubication_regional}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {/* Botones de acción mantienen colores que destacan sobre fondo claro */}
                                                <button 
                                                    onClick={() => handleEditClick(regional)}
                                                    className={`text-indigo-600 hover:${PRIMARY_TEXT_COLOR_CLASS} mr-3`}
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(regional.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                            No se encontraron regionales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modal de Formulario */}
            <RegionalFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                regionalToEdit={editingRegional}
                onSave={handleSave}
            />

        </AuthenticatedLayout>
    );
}