// src/hooks/useRegionals.js

import { useState, useEffect, useCallback, useMemo } from 'react';
import { regionalsService } from '../services/regionalsService';

export const useRegionals = () => {
    const [regionals, setRegionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRegional, setEditingRegional] = useState(null);

    // Estados para Búsqueda y Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filterName, setFilterName] = useState('');
    const [filterUbication, setFilterUbication] = useState('');

    // Cargar las regionales
    const fetchRegionals = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await regionalsService.getAll();
            setRegionals(data);
        } catch (err) {
            setError('Error al cargar las regionales. Asegúrate de que el backend esté corriendo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRegionals();
    }, [fetchRegionals]);

    // Opciones únicas para los selectores de filtros
    const uniqueNames = useMemo(() => {
        return [...new Set(regionals.map(r => r.name_regional))].sort();
    }, [regionals]);

    const uniqueUbications = useMemo(() => {
        return [...new Set(regionals.map(r => r.ubication_regional))].sort();
    }, [regionals]);

    // Lógica de filtrado combinado
    const filteredRegionals = useMemo(() => {
        return regionals.filter(regional => {
            const matchesSearch = 
                regional.id.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
                regional.name_regional.toLowerCase().includes(searchTerm.toLowerCase()) ||
                regional.ubication_regional.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesName = filterName ? regional.name_regional === filterName : true;
            const matchesUbication = filterUbication ? regional.ubication_regional === filterUbication : true;

            return matchesSearch && matchesName && matchesUbication;
        });
    }, [regionals, searchTerm, filterName, filterUbication]);

    // Lógica para abrir/cerrar modal
    const handleCreateClick = () => {
        setEditingRegional(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (regional) => {
        setEditingRegional(regional);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRegional(null);
    };

    // Lógica para guardar (Crear o Actualizar)
    const saveRegional = async (formData, isEditing) => {
        try {
            const dataToSend = {
                name_regional: formData.name_regional.trim(),
                ubication_regional: formData.ubication_regional.trim()
            };

            let savedRegional;

            if (!isEditing) {
                dataToSend.id = formData.id.trim();
                savedRegional = await regionalsService.create(dataToSend);
                setRegionals([savedRegional, ...regionals]);
            } else {
                savedRegional = await regionalsService.update(editingRegional.id, dataToSend);
                setRegionals(regionals.map(r => r.id === savedRegional.id ? savedRegional : r));
            }
            
            closeModal();
            return { success: true };

        } catch (err) {
            console.error("Error al guardar regional:", err.response?.data || err);
            const apiErrors = err.response?.data?.errors;
            let errorMessage = err.response?.data?.message || "Error al guardar la regional.";
            
            if (apiErrors) {
                 errorMessage += ": " + Object.keys(apiErrors).map(key => apiErrors[key].join(', ')).join(' | ');
            }
            return { success: false, error: errorMessage };
        }
    };

    // Lógica para eliminar
    const deleteRegional = async (regionalId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta regional?")) return;

        try {
            await regionalsService.delete(regionalId);
            setRegionals(regionals.filter(r => r.id !== regionalId));
        } catch (err) {
            setError('Error al eliminar la regional.');
            console.error(err);
        }
    };

    return {
        regionals,
        filteredRegionals, // Exportamos la lista filtrada
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
    };
};