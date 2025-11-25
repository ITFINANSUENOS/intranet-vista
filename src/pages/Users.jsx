// src/pages/Users.jsx - MODIFICADO

import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- ROLES MANTENIDOS COMO DATO LOCAL (HARDCODED) ---
const HARDCODED_ROLES = ['Administrador', 'Gestor', 'Administrativo', 'Asesor'];

// ELIMINACIÓN DE MOCK_DATA: Se reemplaza por la carga de API

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO (ACTUALIZADO)
// ===============================================

// Acepta 'selectOptions' como una nueva prop para las listas dinámicas
const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions }) => {
    if (!isOpen) return null;

    const isEditing = !!userToEdit;
    const { apiClient } = useAuth();
    
    // Desestructurar los datos de opciones pasados por props
    const { roles, companies, regionals, positions } = selectOptions;
    
    // Inicializa los IDs de empresa/regional/posición con valores predeterminados seguros
    const defaultCompanyId = companies[0]?.id || '';
    const defaultRegionalId = regionals[0]?.id || '';
    const defaultPositionId = positions[0]?.id || '';
    
    const [formData, setFormData] = useState({
        name_user: userToEdit?.name_user || '',
        last_name_user: userToEdit?.last_name_user || '',
        birthdate: userToEdit?.birthdate || '',
        email: userToEdit?.email || '',
        number_document: userToEdit?.number_document || '',
        // Usar los IDs existentes o los primeros de las listas cargadas
        company_id: userToEdit?.company_id || defaultCompanyId,
        regional_id: userToEdit?.regional_id || defaultRegionalId,
        position_id: userToEdit?.position_id || defaultPositionId,
        password: '',
        role_name: userToEdit?.roles?.[0]?.name || roles[0],
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Reinicia el formulario cuando el modal se abre o el usuario a editar cambia
        if (userToEdit) {
            setFormData({
                name_user: userToEdit.name_user || '',
                last_name_user: userToEdit.last_name_user || '',
                birthdate: userToEdit.birthdate?.split('T')[0] || '', // Formatea fecha
                email: userToEdit.email || '',
                number_document: userToEdit.number_document || '',
                // Usar IDs existentes o los primeros de las opciones cargadas
                company_id: userToEdit.company_id || defaultCompanyId,
                regional_id: userToEdit.regional_id || defaultRegionalId,
                position_id: userToEdit.position_id || defaultPositionId,
                password: '',
                role_name: userToEdit.roles?.[0]?.name || roles[0],
            });
        } else {
            // Limpia el formulario para crear, usando los primeros IDs de las opciones cargadas
            setFormData({
                name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
                company_id: defaultCompanyId,
                regional_id: defaultRegionalId,
                position_id: defaultPositionId,
                password: '',
                role_name: roles[0],
            });
        }
        setError(null);
        // Dependencias actualizadas para asegurar que el formulario use las últimas opciones cargadas
    }, [userToEdit, isOpen, roles, companies, regionals, positions]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        // Convertir IDs a números (para los campos Company, Regional, Position)
        const val = ['company_id', 'regional_id', 'position_id'].includes(name) ? parseInt(value) : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const dataToSend = { ...formData };
        
        // Regla para la contraseña al editar: si está vacía, no la envíes
        if (isEditing && !dataToSend.password) {
            delete dataToSend.password;
        }

        try {
            let response;
            if (isEditing) {
                // Endpoint para actualizar: PUT/PATCH /users/{id}
                response = await apiClient.put(`/users/${userToEdit.id}`, dataToSend);
            } else {
                // Endpoint para crear: POST /users
                response = await apiClient.post('/users', dataToSend);
            }
            
            // Llama a onSave con el usuario actualizado/creado
            onSave(response.data.data || response.data); 
            onClose();
        } catch (err) {
            console.error("Error al guardar usuario:", err.response?.data || err);
            // Muestra errores detallados si Laravel los envía en la propiedad 'errors'
            const apiErrors = err.response?.data?.errors;
            let errorMessage = err.response?.data?.message || "Error al guardar. Verifica los datos.";
            
            if (apiErrors) {
                errorMessage += ": " + Object.keys(apiErrors).map(key => apiErrors[key].join(', ')).join(' | ');
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Datos Personales y Contacto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input 
                                type="text" 
                                name="name_user"
                                value={formData.name_user}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input 
                                type="text" 
                                name="last_name_user"
                                value={formData.last_name_user}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input 
                                type="email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">N° Documento</label>
                            <input 
                                type="text" 
                                name="number_document"
                                value={formData.number_document}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                required
                            />
                        </div>
                    </div>
                    
                    {/* Sección 2: Datos Organizacionales (Usa datos de selectOptions) */}
                    <h4 className="text-lg font-semibold text-gray-800 my-4 border-t pt-4">Datos Organizacionales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Dropdown Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Empresa</label>
                            <select
                                name="company_id"
                                value={formData.company_id}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                                disabled={companies.length === 0} // Deshabilitar si no hay datos
                            >
                                {/* 💡 Usa companies de props */}
                                {companies.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                            {companies.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando empresas...</p>}
                        </div>
                        {/* Dropdown Regional */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Regional</label>
                            <select
                                name="regional_id"
                                value={formData.regional_id}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                                disabled={regionals.length === 0} // Deshabilitar si no hay datos
                            >
                                {/* 💡 Usa regionals de props */}
                                {regionals.map(item => (
                                    <option key={item.id} value={item.id}>{item.name_regional || item.name}</option>
                                ))}
                            </select>
                            {regionals.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando regionales...</p>}
                        </div>
                        {/* Dropdown Posición */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Posición</label>
                            <select
                                name="position_id"
                                value={formData.position_id}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                                disabled={positions.length === 0} // Deshabilitar si no hay datos
                            >
                                {/* 💡 Usa positions de props */}
                                {positions.map(item => (
                                    <option key={item.id} value={item.id}>{item.name_position || item.name}</option>
                                ))}
                            </select>
                            {positions.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando puestos...</p>}
                        </div>
                    </div>

                    {/* Sección 3: Rol y Contraseña */}
                    <h4 className="text-lg font-semibold text-gray-800 my-4 border-t pt-4">Seguridad y Rol</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                            <input 
                                type="date" 
                                name="birthdate"
                                value={formData.birthdate}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        {/* Dropdown Rol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select
                                name="role_name"
                                value={formData.role_name}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                            >
                                {/* 💡 Usa roles de props (HARDCODED_ROLES) */}
                                {roles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </div>
                        {/* Campo Contraseña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Contraseña {isEditing && "(Dejar vacío para no cambiar)"}
                            </label>
                            <input 
                                type="password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                required={!isEditing}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <button 
                            type="submit"
                            disabled={loading || companies.length === 0 || regionals.length === 0 || positions.length === 0}
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition font-bold"
                        >
                            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Usuario' : 'Crear Usuario')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// ===============================================
// 2. COMPONENTE PRINCIPAL Users (ACTUALIZADO: Carga de Datos)
// ===============================================

export default function Users() {
    const { apiClient } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); // Carga de usuarios
    const [error, setError] = useState(null);
    
    // Estados para el modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // NUEVOS ESTADOS para almacenar los datos de los dropdowns
    const [selectOptions, setSelectOptions] = useState({
        roles: HARDCODED_ROLES, // Usar los roles hardcodeados
        companies: [],
        regionals: [],
        positions: [],
    });
    const [optionsLoading, setOptionsLoading] = useState(true); // Carga de opciones

    // **********************************
    // 2.1 FUNCIÓN DE CARGA DE OPCIONES
    // **********************************
    
    // Función para obtener los datos de los dropdowns (Empresas, Regionales, Puestos)
    const fetchSelectOptions = async () => {
        setOptionsLoading(true);
        try {
            // Cargar datos en paralelo para mejorar la velocidad
            const [companiesRes, regionalsRes, positionsRes] = await Promise.all([
                apiClient.get('/companies'), 
                apiClient.get('/regionals'), 
                apiClient.get('/positions'), 
            ]);

            setSelectOptions(prev => ({
                ...prev,
                // Asumo que el API puede devolver los datos directamente o anidados en 'data'
                companies: companiesRes.data.data || companiesRes.data,
                regionals: regionalsRes.data.data || regionalsRes.data,
                positions: positionsRes.data.data || positionsRes.data,
            }));
        } catch (err) {
            console.error('Error al cargar datos de opciones para el formulario:', err);
            // Muestra un error más genérico si la API falla
            setError('Error al cargar datos de Empresas, Regionales o Puestos. Verifica la conexión con el servidor.');
        } finally {
            setOptionsLoading(false);
        }
    };
    
    // Función de carga de usuarios (código existente, ligeramente adaptado para la estructura de roles)
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/users');
            const fetchedUsers = (response.data.data || response.data).map(u => ({
                 ...u,
                 // Normaliza la estructura de roles: debe ser un array de objetos con propiedad 'name'
                 roles: Array.isArray(u.roles) ? u.roles : (u.roles ? [{ name: u.roles[0] }] : [{ name: 'Sin rol' }])
            }));
            setUsers(fetchedUsers);
        } catch (err) {
            setError('Error al cargar los usuarios. Revisa la consola y tu endpoint /users.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Carga los usuarios y las opciones del formulario al inicio
        fetchUsers();
        fetchSelectOptions(); 
    }, [apiClient]);

    // **********************************
    // 2.2 MANEJO DE ACCIONES CRUD
    // **********************************

    const handleCreateClick = () => {
        setEditingUser(null); 
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    // Actualiza la lista de usuarios después de crear/editar (Trigger para que el listado se actualice)
    const handleSave = (savedUser) => {
        // Asegura que el usuario guardado tenga la estructura de roles correcta
        const userWithRoles = {
             ...savedUser,
             roles: Array.isArray(savedUser.roles) ? savedUser.roles : (savedUser.roles ? [{ name: savedUser.roles[0] }] : [{ name: savedUser.role_name || 'Sin rol' }])
        };

        if (editingUser) {
            // Actualizar
            setUsers(users.map(u => u.id === userWithRoles.id ? userWithRoles : u));
        } else {
            // Crear (añadir al inicio)
            setUsers([userWithRoles, ...users]);
        }
        setEditingUser(null);
    };
    
    // Función para eliminar un usuario
    const handleDeleteClick = async (userId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

        try {
            await apiClient.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            setError('Error al eliminar el usuario.');
            console.error(err);
        }
    };


    return (
        <AuthenticatedLayout title="Gestión de Usuarios">
            {/* Cabecera con botón de crear */}
            <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">Listado general de usuarios del sistema.</p>
                <button 
                    onClick={handleCreateClick}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Nuevo Usuario
                </button>
            </div>

            {/* Manejo de Estados de Carga/Error */}
            {(loading || optionsLoading) && <div className="text-center py-10">Cargando datos del sistema...</div>}
            {error && <div className="text-red-500 bg-red-100 p-4 rounded mb-4">{error}</div>}

            {/* Tabla */}
            {!(loading || optionsLoading) && !error && (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length > 0 ? (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                        {(user.name || user.name_user || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {user.name || user.name_user}
                                                            {user.last_name_user && <span className="text-gray-500 ml-1">({user.last_name_user})</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        user.roles.map((role, index) => (
                                                            <span key={index} className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {role.name || role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-gray-400">Sin rol</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button 
                                                    onClick={() => handleEditClick(user)}
                                                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                                                >
                                                    <PencilIcon className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClick(user.id)}
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
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modal de Formulario */}
            <UserFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userToEdit={editingUser}
                onSave={handleSave}
                selectOptions={selectOptions} // 👈 Se pasan los datos cargados dinámicamente
            />

        </AuthenticatedLayout>
    );
}