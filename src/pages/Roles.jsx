import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
// Importa useAuth, asumiendo que tiene expuesta la función fetchUser
import { useAuth } from '../context/AuthContext'; 
import { FaEdit, FaTrash, FaTimes, FaCheck, FaLayerGroup } from 'react-icons/fa';

const PRIMARY_COLOR = 'rgba(5, 25, 49)';

// --- MAPA DE MÓDULOS DE VISTA (DEBE COINCIDIR CON Sidebar.jsx) ---
const VIEW_MODULES = [
    {
        category: 'Acceso General',
        items: [
            { label: 'Ver Dashboard Principal', permission: 'view_dashboard' },
        ]
    },
    {
        category: 'Módulo: Administración',
        items: [
            { label: 'Gestión de Usuarios', permission: 'view_users' },
            { label: 'Roles y Permisos', permission: 'view_roles' }, 
            { label: 'Empresas', permission: 'view_companies' },
            { label: 'Puestos de Trabajo', permission: 'view_positions' },
            { label: 'Regionalización', permission: 'view_regionals' },
            { label: 'Centros de Costo', permission: 'view_cost_centers' },
        ]
    },
    {
        category: 'Módulo: Publicación',
        items: [
            { label: 'Objetivos', permission: 'view_objectives' },
            { label: 'Eventos', permission: 'view_events' }, // <-- Permiso para la vista de eventos
            { label: 'Noticias', permission: 'view_news' },
        ]
    },
    {
        category: 'Módulo: Operaciones',
        items: [
            { label: 'Inventario', permission: 'view_inventory' },
            { label: 'Documentos', permission: 'view_documents' },
            { label: 'Análisis DataCrédito', permission: 'view_datacredito' },
        ]
    },
    {
        category: 'Módulo: Soporte',
        items: [
            { label: 'Mesa de Ayuda', permission: 'view_help_desk' },
        ]
    }
];

export default function Roles() {
    // CORRECCIÓN 1: Obtener fetchUser del contexto de autenticación
    const { apiClient, fetchUser } = useAuth();
    
    // Estados generales
    const [roles, setRoles] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]); 
    
    // Estados Creación
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]); 
    const [roleMessage, setRoleMessage] = useState('');
    const [roleError, setRoleError] = useState('');
    const [roleLoading, setRoleLoading] = useState(false);
    
    // Estados Permiso Manual (opcional)
    const [permissionName, setPermissionName] = useState('');
    const [permissionMessage, setPermissionMessage] = useState('');
    const [permissionLoading, setPermissionLoading] = useState(false);

    // Estados Edición
    const [editingRole, setEditingRole] = useState(null); 
    const [editRoleName, setEditRoleName] = useState('');
    const [editSelectedPermissions, setEditSelectedPermissions] = useState([]);
    const [editLoading, setEditLoading] = useState(false);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await apiClient.get('/roles');
            setRoles(response.data);
        } catch (error) { console.error(error); }
    };
    
    const fetchPermissions = async () => {
        try {
            const response = await apiClient.get('/permissions');
            setAvailablePermissions(response.data);
        } catch (error) { console.error(error); }
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
        setRoleLoading(true); setRoleError('');
        const permissionsToSend = availablePermissions.filter(p => selectedPermissions.includes(p.id)).map(p => p.name);
        try {
            await apiClient.post('/roles', { name: roleName, permissions: permissionsToSend });
            setRoleMessage('Rol creado correctamente.'); setRoleName(''); setSelectedPermissions([]); fetchRoles();
            // Opcional: Si el usuario se crea un rol a sí mismo, actualizar la sesión.
            if (typeof fetchUser === 'function') {
                await fetchUser(); 
            }
        } catch (error) { setRoleError('Error al crear rol.'); }
        setRoleLoading(false);
    };

    const updateRole = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        const permissionsToSend = availablePermissions.filter(p => editSelectedPermissions.includes(p.id)).map(p => p.name);
        try {
            await apiClient.put(`/roles/${editingRole.id}`, { name: editRoleName, permissions: permissionsToSend });
            setEditingRole(null); 
            fetchRoles();
            
            // CORRECCIÓN 2: Llama a fetchUser() para recargar el perfil y los permisos del usuario
            // ESTE ES EL PASO CRÍTICO para que los cambios se reflejen inmediatamente en Sidebar y ProtectedRoute.
            if (typeof fetchUser === 'function') {
                await fetchUser(); 
            }

        } catch (error) { console.error(error); }
        setEditLoading(false);
    };

    const deleteRole = async (id) => {
        if(confirm('¿Seguro que deseas eliminar este rol?')) {
            try {
                await apiClient.delete(`/roles/${id}`);
                fetchRoles();
                // Opcional: Forzar recarga de permisos si el usuario se elimina su propio rol
                if (typeof fetchUser === 'function') {
                    await fetchUser(); 
                }
            } catch(error) {
                console.error("Error al eliminar rol", error);
            }
        }
    };
    
    // Función de creación de permiso (opcional - no estaba completa en el snippet)
    const createPermission = async (e) => {
        e.preventDefault();
        setPermissionLoading(true);
        try {
            await apiClient.post('/permissions', { name: permissionName });
            setPermissionMessage('Permiso creado.'); setPermissionName(''); fetchPermissions();
        } catch (error) { console.error(error); }
        setPermissionLoading(false);
    };


    // --- COMPONENTE DE SELECCIÓN DE PERMISOS AGRUPADOS ---
    const PermissionsSelector = ({ selectedIds, toggleFn }) => (
        <div className="space-y-4 border border-gray-200 rounded-md p-4 bg-gray-50 h-96 overflow-y-auto">
            {VIEW_MODULES.map((module, idx) => (
                <div key={idx} className="bg-white p-3 rounded shadow-sm border border-gray-100">
                    <h5 className="font-bold text-gray-700 text-sm mb-2 flex items-center">
                        <FaLayerGroup className="mr-2 text-blue-900"/> {module.category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {module.items.map(item => {
                            const permId = getPermissionIdByName(item.permission);
                            const exists = !!permId;
                            return (
                                <label key={item.permission} className={`flex items-center space-x-2 text-sm p-1 rounded transition ${!exists ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50'}`}>
                                    <input
                                        type="checkbox"
                                        disabled={!exists}
                                        checked={exists && selectedIds.includes(permId)}
                                        onChange={() => exists && toggleFn(permId)}
                                        className="rounded focus:ring-blue-900 text-blue-900"
                                    />
                                    <span className={exists ? 'text-gray-700' : 'text-red-400 italic'}>
                                        {item.label} {exists ? '' : `(Falta: ${item.permission})`}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
            {/* Otros Permisos (los que no están mapeados en VIEW_MODULES) */}
            <div className="bg-white p-3 rounded shadow-sm border border-gray-100 mt-4">
                <h5 className="font-bold text-gray-700 text-sm mb-2">Otros Permisos del Sistema</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availablePermissions
                        .filter(p => !VIEW_MODULES.some(m => m.items.some(i => i.permission === p.name)))
                        .map(p => (
                            <label key={p.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => toggleFn(p.id)}
                                    className="rounded text-gray-600"
                                />
                                <span className="text-gray-600 truncate">{p.name}</span>
                            </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout title="Roles y Permisos">
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* CREAR ROL */}
                    <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow border-l-4" style={{ borderColor: PRIMARY_COLOR }}>
                        <h3 className="text-2xl font-bold mb-4" style={{ color: PRIMARY_COLOR }}>➕ Crear Nuevo Rol</h3>
                        <form onSubmit={createRole} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Rol</label>
                                <input 
                                    type="text" value={roleName} onChange={e => setRoleName(e.target.value)} 
                                    className="w-full border-gray-300 rounded-md p-2 border" required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Asignar Acceso a Vistas</label>
                                <PermissionsSelector selectedIds={selectedPermissions} toggleFn={(id) => togglePermission(id, false)} />
                            </div>

                            {roleMessage && <p className="text-green-600 bg-green-100 p-2 rounded">{roleMessage}</p>}
                            {roleError && <p className="text-red-600 bg-red-100 p-2 rounded">{roleError}</p>}
                            
                            <button type="submit" disabled={roleLoading} className="w-full py-3 bg-blue-900 text-white rounded hover:bg-blue-800 disabled:opacity-50">
                                {roleLoading ? 'Creando...' : 'Guardar Rol'}
                            </button>
                        </form>
                    </div>

                    {/* CREAR PERMISO RÁPIDO */}
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-xl font-bold text-green-700 mb-4">🔑 Crear Permiso Faltante</h3>
                        <p className="text-xs text-gray-500 mb-3">Si una vista sale como "Falta:...", escribe su nombre técnico (ej: <b>view_events</b>) y créalo.</p>
                        <form onSubmit={createPermission} className="space-y-3">
                            <input 
                                type="text" value={permissionName} onChange={e => setPermissionName(e.target.value)}
                                className="w-full border p-2 rounded" placeholder="Ej: view_users" required
                            />
                            {permissionMessage && <p className="text-green-600 text-xs">{permissionMessage}</p>}
                            <button type="submit" disabled={permissionLoading} className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700">
                                {permissionLoading ? 'Creando...' : 'Crear Permiso'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* LISTA DE ROLES */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <h3 className="text-xl font-bold mb-4">Roles Existentes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roles.map(role => (
                            <div key={role.id} className="border p-4 rounded hover:shadow-md bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-lg text-blue-900">{role.name}</h4>
                                    <div>
                                        <button onClick={() => {
                                            setEditingRole(role);
                                            setEditRoleName(role.name);
                                            setEditSelectedPermissions(role.permissions.map(p => p.id));
                                        }} className="text-blue-500 mr-2"><FaEdit /></button>
                                        <button onClick={() => deleteRole(role.id)} className="text-red-500"><FaTrash /></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {/* Muestra los nombres de los permisos del rol */}
                                    {role.permissions.slice(0, 5).map(p => (
                                        <span key={p.id} className="text-xs bg-gray-200 px-2 py-1 rounded">{p.name}</span>
                                    ))}
                                    {role.permissions.length > 5 && <span className="text-xs text-gray-500">+{role.permissions.length - 5} más...</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL EDICIÓN */}
            {editingRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto">
                        <div className="p-4 border-b bg-blue-900 text-white flex justify-between">
                            <h3 className="font-bold">Editar Rol: {editingRole.name}</h3>
                            <button onClick={() => setEditingRole(null)}><FaTimes /></button>
                        </div>
                        <form onSubmit={updateRole} className="p-6 space-y-4">
                            <input type="text" value={editRoleName} onChange={e => setEditRoleName(e.target.value)} className="w-full border p-2 rounded" />
                            <PermissionsSelector selectedIds={editSelectedPermissions} toggleFn={(id) => togglePermission(id, true)} />
                            <div className="flex justify-end gap-2 pt-4">
                                <button type="button" onClick={() => setEditingRole(null)} className="px-4 py-2 border rounded">Cancelar</button>
                                <button type="submit" disabled={editLoading} className="px-4 py-2 bg-blue-900 text-white rounded">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}