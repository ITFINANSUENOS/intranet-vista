// src/pages/Positions.jsx - MODIFICADO

import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO PARA PUESTOS
// ===============================================

const PositionFormModal = ({ isOpen, onClose, positionToEdit, onSave }) => {
    if (!isOpen) return null;

    const isEditing = !!positionToEdit;
    
    // 💡 AHORA USAMOS LOS NOMBRES DEL CONTROLADOR (name_position, description_position)
    const [formData, setFormData] = useState({
        name_position: positionToEdit?.name_position || '',
        description_position: positionToEdit?.description_position || '',
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { apiClient } = useAuth();


    // Sincroniza el estado cuando el modal se abre o el elemento a editar cambia
    useEffect(() => {
        setFormData({
            name_position: positionToEdit?.name_position || '',
            description_position: positionToEdit?.description_position || '',
        });
        setError(null);
    }, [positionToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        // Validación básica (mejor si Laravel la maneja, pero buena práctica aquí)
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

            let response;
            if (isEditing) {
                response = await apiClient.put(`/positions/${positionToEdit.id}`, dataToSend);
            } else {
                response = await apiClient.post('/positions', dataToSend);
            }

            onSave(response.data.data || response.data);
            onClose();

        } catch (err) {
            console.error("Error al guardar puesto:", err.response?.data || err);
            const apiErrors = err.response?.data?.errors;
            let errorMessage = err.response?.data?.message || "Error al guardar el puesto.";
            
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
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    {isEditing ? 'Editar Puesto' : 'Crear Nuevo Puesto'}
                </h3>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="name_position" className="block text-sm font-medium text-gray-700">Nombre del Puesto</label>
                        <input 
                            type="text" 
                            id="name_position"
                            name="name_position"
                            value={formData.name_position}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    {/* 💡 CAMPO DE DESCRIPCIÓN AÑADIDO */}
                    <div className="mb-6">
                        <label htmlFor="description_position" className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            id="description_position"
                            name="description_position"
                            value={formData.description_position}
                            onChange={handleChange}
                            rows="3"
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition font-bold"
                    >
                        {loading ? 'Guardando...' : (isEditing ? 'Actualizar Puesto' : 'Crear Puesto')}
                    </button>
                </form>
            </div>
        </div>
    );
};


// ===============================================
// 2. COMPONENTE PRINCIPAL Positions (ACTUALIZADO)
// ===============================================

export default function Positions() {
    const { apiClient } = useAuth();
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);

    // Función para cargar los puestos desde el API
    const fetchPositions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Endpoint CRUD: /positions
            const response = await apiClient.get('/positions');
            // Asegúrate de que response.data sea un array o tenga una propiedad data que sea un array
            setPositions(response.data.data || response.data); 
        } catch (err) {
            setError('Error al cargar los puestos. Asegúrate de que el backend esté corriendo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, [apiClient]);

    // Lógica CRUD (Actualizada para manejar los nuevos campos)
    const handleCreateClick = () => {
        setEditingPosition(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (position) => {
        setEditingPosition(position);
        setIsModalOpen(true);
    };

    const handleSave = (savedPosition) => {
        if (editingPosition) {
            setPositions(positions.map(p => p.id === savedPosition.id ? savedPosition : p));
        } else {
            setPositions([savedPosition, ...positions]);
        }
        setEditingPosition(null);
    };
    
    const handleDeleteClick = async (positionId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este puesto?")) return;

        try {
            await apiClient.delete(`/positions/${positionId}`);
            setPositions(positions.filter(p => p.id !== positionId));
        } catch (err) {
            setError('Error al eliminar el puesto.');
            console.error(err);
        }
    };


    return (
        <AuthenticatedLayout title="Gestión de Puestos">
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Listado y administración de puestos de trabajo.</p>
                <button 
                    onClick={handleCreateClick}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Puesto
                </button>
            </div>

            {loading && <div className="text-center py-10">Cargando puestos...</div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded mb-4">{error}</div>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* 💡 COLUMNAS ACTUALIZADAS */}
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puesto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {positions.length > 0 ? (
                                    positions.map((position) => (
                                        <tr key={position.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {/* 💡 CAMPO ACTUALIZADO */}
                                                {position.name_position}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {/* 💡 CAMPO AÑADIDO */}
                                                {position.description_position || 'Sin descripción'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleEditClick(position)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(position.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                                            No se encontraron puestos.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modal de Formulario */}
            <PositionFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                positionToEdit={editingPosition}
                onSave={handleSave}
            />

        </AuthenticatedLayout>
    );
}