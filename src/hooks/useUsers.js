import { useState, useCallback, useEffect } from 'react';
import { userService } from '../services/userService';

export const useUsers = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({});
    const [selectOptions, setSelectOptions] = useState({});
    const [loading, setLoading] = useState(true);
    const [optionsLoading, setOptionsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [selectedRegional, setSelectedRegional] = useState('');
    const [selectedCostCenter, setSelectedCostCenter] = useState('');
    const [selectedPosition, setSelectedPosition] = useState('');

    const fetchUsers = useCallback(async (pageUrl = null) => {
        setLoading(true);
        try {
            // Sincronización exacta con los $request->filled() del backend
            const params = { 
                search: searchTerm, 
                role_id: selectedRole, 
                company_id: selectedCompany,
                regional_id: selectedRegional,
                cost_center_id: selectedCostCenter,
                position_id: selectedPosition 
            };
            
            const endpoint = pageUrl ? pageUrl.replace(import.meta.env.VITE_API_URL || 'http://localhost:8000/api', '') : '/users';
            const responseData = await userService.getUsers(endpoint, params);
            
            setUsers(responseData.data || responseData); 
            setPagination(responseData);
        } catch (error) {
            console.error("Error cargando usuarios:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, selectedRole, selectedCompany, selectedRegional, selectedCostCenter, selectedPosition]);

    const fetchOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const options = await userService.getFormOptions();
            setSelectOptions(options);
        } catch (error) {
            console.error("Error cargando opciones:", error);
        } finally {
            setOptionsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchOptions();
    }, [fetchUsers, fetchOptions]);

    const deleteUser = async (id) => {
        await userService.deleteUser(id);
        fetchUsers(); 
    };

    const saveUser = async (formData, id) => {
        await userService.saveUser(formData, id);
        fetchUsers(); 
    };

    return {
        users, pagination, selectOptions, 
        loading, optionsLoading,
        searchTerm, setSearchTerm,
        selectedRole, setSelectedRole,
        selectedCompany, setSelectedCompany,
        selectedRegional, setSelectedRegional,
        selectedCostCenter, setSelectedCostCenter,
        selectedPosition, setSelectedPosition,
        fetchUsers, deleteUser, saveUser
    };
};