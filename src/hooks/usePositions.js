// src/hooks/usePositions.js
import { useState, useEffect, useCallback } from 'react';
import { positionService } from '../services/positionService';

export const usePositions = () => {
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPositions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await positionService.getAll();
            setPositions(data);
        } catch (err) {
            setError('Error al cargar los puestos. Asegúrate de que el backend esté respondiendo.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPositions();
    }, [fetchPositions]);

    const createPosition = async (data) => {
        const newPosition = await positionService.create(data);
        setPositions((prev) => [newPosition, ...prev]);
        return newPosition;
    };

    const updatePosition = async (id, data) => {
        const updatedPosition = await positionService.update(id, data);
        setPositions((prev) => prev.map(p => p.id === id ? updatedPosition : p));
        return updatedPosition;
    };

    const deletePosition = async (id) => {
        await positionService.delete(id);
        setPositions((prev) => prev.filter(p => p.id !== id));
    };

    return {
        positions,
        loading,
        error,
        createPosition,
        updatePosition,
        deletePosition,
        refreshPositions: fetchPositions
    };
};