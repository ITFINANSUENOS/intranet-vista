import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { FaEdit, FaTrash, FaTimes, FaLayerGroup, FaPlus, FaKey, FaShieldAlt } from 'react-icons/fa';
import { useRoles } from '../hooks/useRoles';

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
            { label: 'Eventos', permission: 'view_events' },
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
    const {
        roles, availablePermissions,
        roleName, setRoleName, selectedPermissions,
        roleMessage, roleError, roleLoading,
        permissionName, setPermissionName, permissionMessage, permissionLoading,
        editingRole, editRoleName, setEditRoleName, editSelectedPermissions, editLoading,
        togglePermission, getPermissionIdByName, createRole, updateRole, deleteRole,
        createPermission, openEditModal, closeEditModal
    } = useRoles();

    const PermissionsSelector = ({ selectedIds, toggleFn }) => (
        <div className="space-y-6 border border-gray-100 rounded-xl p-5 bg-gray-50/50 h-[28rem] overflow-y-auto custom-scrollbar shadow-inner">
            {VIEW_MODULES.map((module, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 hover:border-[#051931]/20 transition-colors">
                    <h5 className="font-semibold text-[#051931] text-xs uppercase tracking-wider mb-4 flex items-center border-b border-gray-100 pb-2">
                        <FaLayerGroup className="mr-2 opacity-80"/> {module.category}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {module.items.map(item => {
                            const permId = getPermissionIdByName(item.permission);
                            const exists = !!permId;
                            return (
                                <label key={item.permission} className={`flex items-start space-x-3 text-sm p-2 rounded-lg transition-all duration-200 ${!exists ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-[#051931]/5'}`}>
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            disabled={!exists}
                                            checked={exists && selectedIds.includes(permId)}
                                            onChange={() => exists && toggleFn(permId)}
                                            className="w-4 h-4 rounded border-gray-300 text-[#051931] focus:ring-[#051931] transition-colors cursor-pointer"
                                        />
                                    </div>
                                    <span className={`font-medium ${exists ? 'text-gray-700' : 'text-red-400 italic'}`}>
                                        {item.label} 
                                        {!exists && <span className="block text-xs mt-0.5 opacity-80">(Falta: {item.permission})</span>}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
            
            <div className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-gray-100 mt-6">
                <h5 className="font-semibold text-gray-500 text-xs uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center">
                    <FaShieldAlt className="mr-2" /> Otros Permisos del Sistema
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availablePermissions
                        .filter(p => !VIEW_MODULES.some(m => m.items.some(i => i.permission === p.name)))
                        .map(p => (
                            <label key={p.id} className="flex items-center space-x-3 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors border border-transparent hover:border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(p.id)}
                                    onChange={() => toggleFn(p.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-[#051931] focus:ring-[#051931]"
                                />
                                <span className="text-gray-600 truncate font-medium">{p.name}</span>
                            </label>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout title="Roles y Permisos">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 bg-white min-h-screen">
                
                {/* CABECERA Y FORMULARIOS DE CREACIÓN */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* CREAR ROL */}
                    <div className="lg:col-span-8 bg-white p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#051931]"></div>
                        <div className="flex items-center mb-6">
                            <div className="bg-[#051931]/10 p-3 rounded-lg mr-4">
                                <FaShieldAlt className="text-[#051931] text-xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Crear Nuevo Rol</h3>
                        </div>

                        <form onSubmit={createRole} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Rol</label>
                                <input 
                                    type="text" 
                                    value={roleName} 
                                    onChange={e => setRoleName(e.target.value)} 
                                    placeholder="Ej: Administrador Regional"
                                    className="w-full border border-gray-200 rounded-xl p-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#051931]/50 focus:border-transparent transition-all bg-gray-50 hover:bg-white" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Asignar Acceso a Vistas</label>
                                <PermissionsSelector selectedIds={selectedPermissions} toggleFn={(id) => togglePermission(id, false)} />
                            </div>

                            {roleMessage && (
                                <div className="flex items-center p-4 text-sm text-green-800 border border-green-200 rounded-xl bg-green-50">
                                    {roleMessage}
                                </div>
                            )}
                            {roleError && (
                                <div className="flex items-center p-4 text-sm text-red-800 border border-red-200 rounded-xl bg-red-50">
                                    {roleError}
                                </div>
                            )}
                            
                            <button 
                                type="submit" 
                                disabled={roleLoading} 
                                className="w-full py-3.5 px-4 bg-[#051931] text-white font-medium rounded-xl hover:bg-[#0a2950] focus:ring-4 focus:ring-[#051931]/30 transition-all duration-200 disabled:opacity-70 flex justify-center items-center shadow-lg shadow-[#051931]/20"
                            >
                                {roleLoading ? (
                                    <span className="flex items-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creando...</span>
                                ) : (
                                    <span className="flex items-center"><FaPlus className="mr-2" /> Guardar Rol</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* CREAR PERMISO RÁPIDO */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden h-full">
                            <div className="flex items-center mb-4">
                                <div className="bg-slate-200 p-2.5 rounded-lg mr-3">
                                    <FaKey className="text-slate-600" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700">Permiso Faltante</h3>
                            </div>
                            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                                Si una vista marca <span className="text-red-400 font-medium bg-red-50 px-1 rounded">Falta: ...</span>, escribe su nombre técnico exacto (ej: <span className="font-mono text-xs bg-white border px-1 rounded">view_events</span>) para registrarlo en la base de datos.
                            </p>
                            
                            <form onSubmit={createPermission} className="space-y-4 mt-auto">
                                <div>
                                    <input 
                                        type="text" 
                                        value={permissionName} 
                                        onChange={e => setPermissionName(e.target.value)}
                                        className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all bg-white" 
                                        placeholder="Nombre del permiso" 
                                        required
                                    />
                                </div>
                                {permissionMessage && <p className="text-emerald-600 text-sm font-medium bg-emerald-50 p-2 rounded-lg">{permissionMessage}</p>}
                                <button 
                                    type="submit" 
                                    disabled={permissionLoading} 
                                    className="w-full py-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 hover:border-slate-400 transition-all duration-200"
                                >
                                    {permissionLoading ? 'Registrando...' : 'Registrar Permiso'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* LISTA DE ROLES */}
                <div className="mt-12">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-2xl font-bold text-gray-800">Directorio de Roles</h3>
                        <span className="bg-[#051931]/10 text-[#051931] py-1 px-3 rounded-full text-sm font-semibold">
                            {roles.length} Roles Registrados
                        </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {roles.map(role => (
                            <div key={role.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="w-10 h-10 rounded-full bg-[#051931]/5 flex items-center justify-center text-[#051931] font-bold text-lg mr-3 group-hover:bg-[#051931] group-hover:text-white transition-colors">
                                            {role.name.charAt(0).toUpperCase()}
                                        </div>
                                        <h4 className="font-bold text-lg text-gray-800 leading-tight">{role.name}</h4>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openEditModal(role)} className="p-2 text-gray-400 hover:text-[#051931] hover:bg-[#051931]/10 rounded-lg transition-colors" title="Editar">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => deleteRole(role.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="mt-auto">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Permisos Asignados</p>
                                    <div className="flex flex-wrap gap-2">
                                        {role.permissions.slice(0, 4).map(p => (
                                            <span key={p.id} className="text-xs font-medium bg-gray-50 border border-gray-200 text-gray-600 px-2.5 py-1 rounded-md">
                                                {p.name}
                                            </span>
                                        ))}
                                        {role.permissions.length > 4 && (
                                            <span className="text-xs font-medium bg-[#051931]/5 text-[#051931] px-2.5 py-1 rounded-md">
                                                +{role.permissions.length - 4} más
                                            </span>
                                        )}
                                        {role.permissions.length === 0 && (
                                            <span className="text-xs italic text-gray-400">Sin permisos asignados</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MODAL EDICIÓN */}
            {editingRole && (
                <div className="fixed inset-0 bg-[#051931]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="px-6 py-4 bg-[#051931] text-white flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center">
                                <FaEdit className="mr-2 opacity-80" /> Editando Rol: <span className="ml-1 font-normal opacity-90">{editingRole.name}</span>
                            </h3>
                            <button type="button" onClick={closeEditModal} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors">
                                <FaTimes className="text-xl" />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar">
                            <form id="edit-role-form" onSubmit={updateRole} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Rol</label>
                                    <input 
                                        type="text" 
                                        value={editRoleName} 
                                        onChange={e => setEditRoleName(e.target.value)} 
                                        className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#051931]/50 bg-gray-50 focus:bg-white transition-all" 
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-3">Actualizar Permisos</label>
                                    <PermissionsSelector selectedIds={editSelectedPermissions} toggleFn={(id) => togglePermission(id, true)} />
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
                            <button 
                                type="button" 
                                onClick={closeEditModal} 
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="edit-role-form"
                                disabled={editLoading} 
                                className="px-6 py-2.5 bg-[#051931] text-white font-medium rounded-xl hover:bg-[#0a2950] shadow-md shadow-[#051931]/20 disabled:opacity-70 transition-all flex items-center"
                            >
                                {editLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}