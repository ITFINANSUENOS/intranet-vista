// src/hooks/useCompanies.js
import { useState, useCallback, useEffect } from 'react';
import { companyService } from '../services/companyService';

export const useCompanies = () => {
    // Estados generales
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Estados del modal y formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState(null);

    const fetchCompanies = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await companyService.getAll();
            setCompanies(data);
        } catch (err) {
            setError('No se pudieron cargar las empresas. Verifique la conexión con el servidor.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // Controladores del Modal
    const openCreateModal = () => {
        setEditingCompany(null);
        setFormError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (company) => {
        setEditingCompany(company);
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCompany(null);
    };

    // Acciones CRUD
    const saveCompany = async (formData) => {
        setFormLoading(true);
        setFormError(null);
        
        try {
            const isEditing = !!editingCompany;
            const dataToSend = {
                name_company: formData.name_company.trim(),
                ubication: formData.ubication.trim()
            };

            let savedCompany;
            if (isEditing) {
                savedCompany = await companyService.update(editingCompany.id, dataToSend);
                setCompanies(companies.map(c => c.id === savedCompany.id ? savedCompany : c));
            } else {
                savedCompany = await companyService.create(dataToSend);
                setCompanies([savedCompany, ...companies]);
            }
            closeModal();
        } catch (err) {
            console.error("Error al guardar empresa:", err.response?.data || err);
            setFormError(err.response?.data?.message || "Error al procesar la solicitud.");
        } finally {
            setFormLoading(false);
        }
    };

    const deleteCompany = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.")) return;

        try {
            await companyService.delete(id);
            setCompanies(companies.filter(c => c.id !== id));
        } catch (err) {
            alert('Error al intentar eliminar el registro.');
            console.error(err);
        }
    };

    return {
        // Datos
        companies,
        loading,
        error,
        // UI Modal
        isModalOpen,
        editingCompany,
        formLoading,
        formError,
        // Acciones
        openCreateModal,
        openEditModal,
        closeModal,
        saveCompany,
        deleteCompany
    };
};