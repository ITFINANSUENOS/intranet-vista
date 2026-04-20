import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { roleService } from '../services/rolesService'; // Ajusta la ruta según la ubicación de tu servicio

export const useRoles = () => {
    // Solo traemos fetchUser del AuthContext, ya no necesitamos apiClient de aquí
    const { fetchUser } = useAuth();
    
    // Estados generales
    const [roles, setRoles] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]); 
    
    // Estados Creación
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]); 
    const [roleMessage, setRoleMessage] = useState('');
    const [roleError, setRoleError] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);
    
    // Estados Permiso Manual
    const [permissionName, setPermissionName] = useState('');
    const [permissionMessage, setPermissionMessage] = useState('');
    const [permissionLoading, setPermissionLoading] = useState(false);

    // Estados Edición
    const [editingRole, setEditingRole] = useState(null); 
    const [editRoleName, setEditRoleName] = useState('');
    const [editSelectedPermissions, setEditSelectedPermissions] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    // Al montar el componente, traemos la data sin depender de apiClient en el arreglo de dependencias
    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await roleService.getRoles();
            setRoles(data);
        } catch (error) { 
            console.error("Error al obtener roles:", error); 
        }
    };
    
    const fetchPermissions = async () => {
        try {
            const data = await roleService.getPermissions();
            setAvailablePermissions(data);
        } catch (error) { 
            console.error("Error al obtener permisos:", error); 
        }
    };

    const togglePermission = (permId, isEdit = false) => {
        const setFn = isEdit ? setEditSelectedPermissions : setSelectedPermissions;
        setFn(prev => prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]);
    };

    const getPermissionIdByName = (name) => {
        const perm = availablePermissions.find(p => p.name === name);
        return perm ? perm.id : null;
    };

    const createRole = async (e) => {
        e.preventDefault();
        setRoleLoading(true); 
        setRoleError('');
        const permissionsToSend = availablePermissions
            .filter(p => selectedPermissions.includes(p.id))
            .map(p => p.name);
            
        try {
            await roleService.createRole({ name: roleName, permissions: permissionsToSend });
            setRoleMessage('Rol creado correctamente.'); 
            setRoleName(''); 
            setSelectedPermissions([]); 
            await fetchRoles();
            
            if (typeof fetchUser === 'function') {
                await fetchUser(); 
            }
        } catch (error) { 
            setRoleError('Error al crear rol.'); 
            console.error(error);
        } finally {
            setRoleLoading(false);
        }
    };

    const updateRole = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        const permissionsToSend = availablePermissions
            .filter(p => editSelectedPermissions.includes(p.id))
            .map(p => p.name);
            
        try {
            await roleService.updateRole(editingRole.id, { name: editRoleName, permissions: permissionsToSend });
            setEditingRole(null); 
            await fetchRoles();
            
            if (typeof fetchUser === 'function') {
                await fetchUser(); 
            }
        } catch (error) { 
            console.error(error); 
        } finally {
            setEditLoading(false);
        }
    };

    const deleteRole = async (id) => {
        if(window.confirm('¿Seguro que deseas eliminar este rol?')) {
            try {
                await roleService.deleteRole(id);
                await fetchRoles();
                
                if (typeof fetchUser === 'function') {
                    await fetchUser(); 
                }
            } catch(error) {
                console.error("Error al eliminar rol", error);
            }
        }
    };
    
    const createPermission = async (e) => {
        e.preventDefault();
        setPermissionLoading(true);
        setPermissionMessage('');
        try {
            await roleService.createPermission({ name: permissionName });
            setPermissionMessage('Permiso creado.'); 
            setPermissionName(''); 
            await fetchPermissions();
        } catch (error) { 
            console.error(error); 
        } finally {
            setPermissionLoading(false);
        }
    };

    const openEditModal = (role) => {
        setEditingRole(role);
        setEditRoleName(role.name);
        setEditSelectedPermissions(role.permissions.map(p => p.id));
    };

    const closeEditModal = () => {
        setEditingRole(null);
    };

    return {
        roles, availablePermissions,
        roleName, setRoleName, selectedPermissions,
        roleMessage, roleError, roleLoading,
        permissionName, setPermissionName, permissionMessage, permissionLoading,
        editingRole, editRoleName, setEditRoleName, editSelectedPermissions, editLoading,
        togglePermission, getPermissionIdByName, createRole, updateRole, deleteRole,
        createPermission, openEditModal, closeEditModal
    };
};