// src/pages/Companies.jsx

import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO
// ===============================================

const CompanyFormModal = ({ isOpen, onClose, companyToEdit, onSave }) => {
    if (!isOpen) return null;

    const isEditing = !!companyToEdit;
    const { apiClient } = useAuth();
    const [formData, setFormData] = useState({
        name_company: companyToEdit?.name_company || '',
        ubication: companyToEdit?.ubication || '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let response;
            if (isEditing) {
                // Actualizar
                response = await apiClient.put(`/companies/${companyToEdit.id}`, formData);
            } else {
                // Crear
                response = await apiClient.post('/companies', formData);
            }
            
            onSave(response.data); // Llama a la función de guardado para actualizar la lista
            onClose(); // Cierra el modal
        } catch (err) {
            console.error('Error al guardar la empresa:', err);
            // Manejo de errores de validación de Laravel (422) o de la red
            if (err.response && err.response.status === 422) {
                // Muestra un mensaje de error legible de Laravel
                setError("Error de validación. Verifica los campos.");
                // O muestra errores detallados si es necesario:
                // setError(Object.values(err.response.data.errors).flat().join(' ')); 
            } else {
                setError("Hubo un error al procesar la solicitud.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 flex justify-center items-center">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                        {isEditing ? 'Editar Empresa' : 'Crear Nueva Empresa'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                    {error && <p className="text-red-600 bg-red-100 p-2 rounded-lg text-sm">{error}</p>}
                    
                    <div>
                        <label htmlFor="name_company" className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                        <input
                            type="text"
                            id="name_company"
                            name="name_company"
                            value={formData.name_company}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>

                    <div>
                        <label htmlFor="ubication" className="block text-sm font-medium text-gray-700">Ubicación</label>
                        <input
                            type="text"
                            id="ubication"
                            name="ubication"
                            value={formData.ubication}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    
                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="mr-3 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                            disabled={loading}
                        >
                            {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Empresa')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// 2. COMPONENTE PRINCIPAL DE EMPRESAS
// ===============================================

export default function Companies() {
    const { apiClient } = useAuth();
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);

    // --- Lógica de LISTADO (Read) ---
    const fetchCompanies = async () => {
        setLoading(true);
        try {
            // Endpoint de Listado: GET /companies
            const response = await apiClient.get('/companies');
            setCompanies(response.data.data || response.data); // Maneja paginación (response.data.data) o listado directo (response.data)
        } catch (error) {
            console.error('Error al cargar empresas:', error);
            // Aquí podrías mostrar una notificación de error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    // --- Lógica de Creación/Edición (Update/Create) ---
    const handleAddClick = () => {
        setEditingCompany(null); // Abre el modal en modo Creación
        setIsModalOpen(true);
    };

    const handleEditClick = (company) => {
        setEditingCompany(company); // Abre el modal en modo Edición
        setIsModalOpen(true);
    };

    const handleSave = (savedCompany) => {
        // Actualiza la lista de empresas después de una Creación o Edición
        if (editingCompany) {
            // Edición: Reemplaza la empresa editada en la lista
            setCompanies(companies.map(c => c.id === savedCompany.id ? savedCompany : c));
        } else {
            // Creación: Añade la nueva empresa al inicio de la lista
            setCompanies([savedCompany, ...companies]);
        }
    };

    // --- Lógica de Eliminación (Delete) ---
    const handleDeleteClick = async (companyId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta empresa?")) {
            return;
        }

        try {
            // Endpoint de Eliminación: DELETE /companies/{id}
            await apiClient.delete(`/companies/${companyId}`);
            
            // Elimina la empresa de la lista del estado local
            setCompanies(companies.filter(c => c.id !== companyId));
            // Aquí podrías mostrar una notificación de éxito
        } catch (error) {
            console.error('Error al eliminar empresa:', error);
            alert("Error al eliminar la empresa. Verifica si está siendo utilizada.");
        }
    };

    return (
        <AuthenticatedLayout title="Gestión de Empresas">
            <div className="p-6 bg-white rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Listado de Empresas</h2>
                    <button
                        onClick={handleAddClick}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Agregar Empresa
                    </button>
                </div>

                {loading ? (
                    <p className="text-gray-600">Cargando empresas...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {companies.length > 0 ? (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.name_company}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{company.ubication}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-3">
                                                <button 
                                                    onClick={() => handleEditClick(company)}
                                                    className="text-indigo-600 hover:text-indigo-900"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(company.id)}
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
                                            No se encontraron empresas registradas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Formulario */}
            <CompanyFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                companyToEdit={editingCompany}
                onSave={handleSave}
            />
        </AuthenticatedLayout>
    );
}