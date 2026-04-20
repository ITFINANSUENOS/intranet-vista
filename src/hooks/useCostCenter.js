// src/hooks/useCostCenter.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { costCenterService } from '../services/costCenterService';

export const useCostCenter = () => {
    // Estados de datos y carga
    const [costCenters, setCostCenters] = useState([]);
    const [regionals, setRegionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para la búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Estados del Modal y Formulario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [originalId, setOriginalId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [formData, setFormData] = useState({ 
        id: '', 
        cost_center_name: '', 
        regional_id: '' 
    });

    // Carga inicial de datos
    const fetchCostCenters = useCallback(async () => {
        setLoading(true);
        try {
            const data = await costCenterService.getCostCenters();
            setCostCenters(data);
        } catch (err) {
            setError("Error al cargar los centros de costo.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRegionals = useCallback(async () => {
        try {
            const data = await costCenterService.getRegionals();
            setRegionals(data);
        } catch (err) {
            console.error("Error al cargar regionales:", err);
        }
    }, []);

    useEffect(() => {
        fetchCostCenters();
        fetchRegionals();
    }, [fetchCostCenters, fetchRegionals]);

    // Lógica de Filtro de Búsqueda
    const filteredCostCenters = useMemo(() => {
        if (!searchTerm) return costCenters;
        
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        return costCenters.filter(center => {
            const nameMatch = center.cost_center_name?.toLowerCase().includes(lowerCaseSearch);
            const regionalMatch = center.regional?.name_regional?.toLowerCase().includes(lowerCaseSearch);
            
            return nameMatch || regionalMatch;
        });
    }, [costCenters, searchTerm]);

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setFormData({ id: '', cost_center_name: '', regional_id: '' });
        setIsEditingMode(false);
        setOriginalId(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (center) => {
        setFormData({
            id: center.id,
            cost_center_name: center.cost_center_name,
            regional_id: center.regional_id
        });
        setIsEditingMode(true);
        setOriginalId(center.id);
        setModalError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError(null);

        try {
            if (isEditingMode) {
                await costCenterService.updateCostCenter(originalId, formData);
            } else {
                await costCenterService.createCostCenter(formData);
            }
            closeModal();
            fetchCostCenters();
        } catch (err) {
            const message = err.response?.data?.message || "Error al guardar los cambios.";
            if (err.response?.data?.errors) {
                const validationErrors = Object.values(err.response.data.errors).flat().join(' | ');
                setModalError(`Errores de validación: ${validationErrors}`);
            } else {
                setModalError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar este Centro de Costo?")) return;
        try {
            await costCenterService.deleteCostCenter(id);
            fetchCostCenters();
        } catch (err) {
            alert("No se pudo eliminar el registro.");
            console.error(err);
        }
    };

    return {
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
    };
};