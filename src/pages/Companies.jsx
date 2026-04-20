// src/pages/Companies.jsx
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useCompanies } from '../hooks/useCompanies'; // Importamos nuestro hook

const PRIMARY_COLOR_CLASS = 'bg-[rgba(5,25,49)]'; 
const PRIMARY_TEXT_COLOR_CLASS = 'text-[rgba(5,25,49)]';

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO PARA EMPRESAS
// ===============================================
const CompanyFormModal = ({ isOpen, onClose, companyToEdit, onSave, loading, error }) => {
    const [formData, setFormData] = useState({
        name_company: '',
        ubication: '',
    });

    useEffect(() => {
        setFormData({
            name_company: companyToEdit?.name_company || '',
            ubication: companyToEdit?.ubication || '',
        });
    }, [companyToEdit, isOpen]);

    if (!isOpen) return null;

    const isEditing = !!companyToEdit;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                <h3 className={`text-2xl font-bold ${PRIMARY_TEXT_COLOR_CLASS} mb-4 border-b pb-2`}>
                    {isEditing ? 'Editar Empresa' : 'Registrar Empresa'}
                </h3>
                
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                        <input 
                            type="text" 
                            name="name_company"
                            value={formData.name_company}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-[rgba(5,25,49)] focus:border-[rgba(5,25,49)]"
                            placeholder="Ej: Mi Empresa S.A.S"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ubicación / Ciudad</label>
                        <input
                            type="text" 
                            name="ubication"
                            value={formData.ubication}
                            onChange={handleChange}
                            className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-[rgba(5,25,49)] focus:border-[rgba(5,25,49)]"
                            placeholder="Ej: Bogotá, Colombia"
                            required
                        />
                    </div>

                    <button 
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 text-white rounded-md shadow-sm text-sm font-bold ${PRIMARY_COLOR_CLASS} hover:opacity-90 disabled:bg-gray-400 transition`}
                    >
                        {loading ? 'Procesando...' : (isEditing ? 'Actualizar Datos' : 'Guardar Empresa')}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// 2. COMPONENTE PRINCIPAL: Companies
// ===============================================
export default function Companies() {
    // Extraemos todo del hook en lugar de declarar estados localmente
    const {
        companies,
        loading,
        error,
        isModalOpen,
        editingCompany,
        formLoading,
        formError,
        openCreateModal,
        openEditModal,
        closeModal,
        saveCompany,
        deleteCompany
    } = useCompanies();

    return (
        <AuthenticatedLayout title="Gestión de Empresas">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <BuildingOfficeIcon className="w-6 h-6 mr-2 text-gray-500" />
                        Directorio de Empresas
                    </h2>
                    <p className="text-gray-500 text-sm">Administra la información básica de las empresas registradas en el sistema.</p>
                </div>
                
                <button 
                    onClick={openCreateModal}
                    className={`flex items-center px-5 py-2.5 ${PRIMARY_COLOR_CLASS} text-white rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-1 font-semibold`}
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Añadir Empresa
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[rgba(5,25,49)]"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">{error}</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={`px-6 py-4 text-left text-xs font-bold ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>ID</th>
                                    <th className={`px-6 py-4 text-left text-xs font-bold ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Nombre de Empresa</th>
                                    <th className={`px-6 py-4 text-left text-xs font-bold ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Ubicación</th>
                                    <th className={`px-6 py-4 text-right text-xs font-bold ${PRIMARY_TEXT_COLOR_CLASS} uppercase tracking-wider`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {companies.length > 0 ? (
                                    companies.map((company) => (
                                        <tr key={company.id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                                                #{company.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">
                                                {company.name_company}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 italic">
                                                {company.ubication}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => openEditModal(company)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteCompany(company.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        title="Eliminar"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                            No hay empresas registradas actualmente.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            <CompanyFormModal 
                isOpen={isModalOpen}
                onClose={closeModal}
                companyToEdit={editingCompany}
                onSave={saveCompany}
                loading={formLoading}
                error={formError}
            />
        </AuthenticatedLayout>
    );
}