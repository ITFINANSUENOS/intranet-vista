// src/pages/Regionals.jsx - CÓDIGO FINAL CON ESTILOS ACTUALIZADOS

import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ===============================================
// CLASES DE ESTILO
// ===============================================

// Color principal: rgba(5, 25, 49)
const ACCENT_COLOR_CLASS = 'text-[rgba(5,25,49)]'; 
const ACCENT_BG_CLASS = 'bg-[rgba(5,25,49)]';
const ACCENT_HOVER_BG_CLASS = 'hover:bg-gray-800'; // Un gris muy oscuro para el hover

// Clase para errores llamativos: Rojo fuerte, texto blanco, sombra
const ERROR_CLASS = 'p-4 font-bold text-white bg-red-700 rounded-lg shadow-xl border-2 border-red-800'; 

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO PARA REGIONALES
// ===============================================

const RegionalFormModal = ({ isOpen, onClose, regionalToEdit, onSave }) => {
    if (!isOpen) return null;

    const isEditing = !!regionalToEdit;
    
    const [formData, setFormData] = useState({
        // Campo ID
        id: regionalToEdit?.id || '', 
        name_regional: regionalToEdit?.name_regional || '',
        ubication_regional: regionalToEdit?.ubication_regional || '',
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { apiClient } = useAuth();

    // Sincroniza el estado cuando el modal se abre o el elemento a editar cambia
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
            
            // Enviamos el ID solo si estamos creando
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
        // El fondo negro semi-transparente del modal asegura que la vista detrás (blanca) se vea
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                
                {/* TÍTULO CON COLOR DE ACENTO */}
                <h3 className={`text-2xl font-bold ${ACCENT_COLOR_CLASS} mb-4 border-b pb-2`}>
                    {isEditing ? 'Editar Regional' : 'Crear Nueva Regional'}
                </h3>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* MENSAJE DE ERROR LLAMATIVO */}
                {error && <div className={ERROR_CLASS}>
                    🚨 Error: {error}
                </div>}

                <form onSubmit={handleSubmit}>
                    
                    {/* CAMPO ID / CÓDIGO (Etiquetas mantienen el color por defecto, inputs sin cambio estético) */}
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

                    <div className="mb-4">
                        <label htmlFor="name_regional" className="block text-sm font-medium text-gray-700">Nombre de la Regional</label>
                        <input 
                            type="text" 
                            id="name_regional"
                            name="name_regional"
                            value={formData.name_regional}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    
                    <div className="mb-6">
                        <label htmlFor="ubication_regional" className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <input
                            type="text" 
                            id="ubication_regional"
                            name="ubication_regional"
                            value={formData.ubication_regional}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>

                    {/* BOTÓN SUBMIT CON COLOR DE ACENTO */}
                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${ACCENT_BG_CLASS} ${ACCENT_HOVER_BG_CLASS} disabled:bg-gray-400 transition font-bold`}
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

    // Función para cargar las regionales
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

    // Lógica CRUD
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
            // Añadir el nuevo registro al inicio de la lista
            setRegionals([savedRegional, ...regionals]);
        }
        setEditingRegional(null);
    };
    
    const handleDeleteClick = async (regionalId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta regional?")) return;

        try {
            await apiClient.delete(`/regionals/${regionalId}`);
            setRegionals(regionals.filter(r => r.id !== regionalId));
        } catch (err) {
            setError('Error al eliminar la regional.');
            console.error(err);
        }
    };


    return (
        // El contenido de la vista se renderiza por defecto sobre un fondo blanco del AuthenticatedLayout
        <AuthenticatedLayout title="Gestión de Regionales">
            <div className="flex justify-between items-center mb-6">
                {/* Texto descriptivo con color de acento */}
                <p className={`text-lg ${ACCENT_COLOR_CLASS}`}>Listado y administración de sedes regionales.</p>
                
                {/* BOTÓN PRINCIPAL CON COLOR DE ACENTO */}
                <button 
                    onClick={handleCreateClick}
                    className={`flex items-center px-4 py-2 ${ACCENT_BG_CLASS} text-white rounded-lg ${ACCENT_HOVER_BG_CLASS} transition shadow-md`}
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nueva Regional
                </button>
            </div>

            {loading && <div className="text-center py-10 text-gray-500">Cargando regionales...</div>}
            
            {/* MENSAJE DE ERROR LLAMATIVO */}
            {error && <div className={`${ERROR_CLASS} mb-4`}>
                 🚨 ¡Error en la carga! {error}
            </div>}

            {!loading && !error && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    {/* ENCABEZADOS DE TABLA CON COLOR DE ACENTO */}
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase tracking-wider`}>ID / Código</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase tracking-wider`}>Regional</th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase tracking-wider`}>Ubicación</th>
                                    <th className={`px-6 py-3 text-right text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase tracking-wider`}>Acciones</th>
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
                                                {/* Botones de acción (mantienen colores estándar para contraste) */}
                                                <button 
                                                    onClick={() => handleEditClick(regional)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
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