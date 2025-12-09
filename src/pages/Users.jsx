import React, { useEffect, useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

// --- CLASES DE ESTILO Y COLOR ---
const PRIMARY_COLOR = 'rgba(5, 25, 49)'; // Color corporativo: #051931

// Clase para errores llamativos: Rojo fuerte, texto blanco, sombra (para el error de la vista principal)
const ERROR_CLASS_MAIN = 'p-4 font-bold text-white bg-red-700 rounded-lg shadow-xl border-2 border-red-800';
// Clase para errores del modal (más discreto, pero aún visible)
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-100 rounded-lg border border-red-300'; 

// --- ROLES MANTENIDOS COMO DATO LOCAL (HARDCODED) ---
const HARDCODED_ROLES = ['Administrador', 'Gestor', 'Administrativo', 'Asesor']; 

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO
// ===============================================

const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions }) => {
    if (!isOpen) return null;

    const isEditing = !!userToEdit;
    const { apiClient } = useAuth();
    
    // 🚨 NUEVOS: Incluimos costCenters de las opciones
    const { roles, companies, regionals, positions, costCenters } = selectOptions; 
    
    // Inicializa IDs con valores predeterminados seguros
    const defaultCompanyId = companies[0]?.id || ''; 
    const defaultRegionalId = regionals[0]?.id || '';
    const defaultPositionId = positions[0]?.id || '';
    // 🚨 NUEVO: Valor predeterminado para Centro de Costo
    const defaultCostCenterId = costCenters[0]?.id || ''; 
    const defaultRoleName = roles[0]?.name || HARDCODED_ROLES[0]; 
    
    // Estado para la lista filtrada de Centros de Costo
    const [filteredCostCenters, setFilteredCostCenters] = useState([]);


    const [formData, setFormData] = useState({
        name_user: userToEdit?.name_user || '',
        last_name_user: userToEdit?.last_name_user || '',
        birthdate: userToEdit?.birthdate || '',
        email: userToEdit?.email || '',
        number_document: userToEdit?.number_document || '',
        company_id: userToEdit?.company_id || defaultCompanyId,
        regional_id: userToEdit?.regional_id || defaultRegionalId,
        position_id: userToEdit?.position_id || defaultPositionId,
        cost_center_id: userToEdit?.cost_center_id || defaultCostCenterId, // 🚨 NUEVO CAMPO
        password: '',
        confirm_password: '', 
        role_name: userToEdit?.roles?.[0]?.name || defaultRoleName,
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);


    // --- EFECTO 1: Inicialización y Reseteo del Formulario ---
    useEffect(() => {
        const currentDefaultRoleName = roles[0]?.name || HARDCODED_ROLES[0];
        
        // Buscamos el ID del Centro de Costo si estamos editando
        const userCostCenterId = userToEdit?.cost_center_id || defaultCostCenterId;
        const userRegionalId = userToEdit?.regional_id || defaultRegionalId;

        if (userToEdit) {
            setFormData({
                name_user: userToEdit.name_user || '',
                last_name_user: userToEdit.last_name_user || '',
                birthdate: userToEdit.birthdate?.split('T')[0] || '', 
                email: userToEdit.email || '',
                number_document: userToEdit.number_document || '',
                company_id: userToEdit.company_id || defaultCompanyId,
                regional_id: userRegionalId,
                position_id: userToEdit.position_id || defaultPositionId,
                cost_center_id: userCostCenterId, // Usamos el valor del usuario
                password: '', // Se resetea para edición
                confirm_password: '', // Se resetea para edición
                role_name: userToEdit.roles?.[0]?.name || currentDefaultRoleName,
            });
        } else {
            setFormData({
                name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
                company_id: defaultCompanyId,
                regional_id: defaultRegionalId,
                position_id: defaultPositionId,
                cost_center_id: defaultCostCenterId, // Usamos el valor por defecto
                password: '',
                confirm_password: '',
                role_name: currentDefaultRoleName,
            });
        }
        setError(null);
    // Añadimos costCenters a las dependencias para que se reinicie el formulario
    // si las opciones cambian, lo cual es útil si las opciones se cargan después.
    }, [userToEdit, isOpen, roles, companies, regionals, positions, costCenters, defaultCompanyId, defaultRegionalId, defaultPositionId, defaultCostCenterId]);


    // --- EFECTO 2: Filtrado de Centros de Costo al cambiar la Regional ---
    useEffect(() => {
        const regionalId = parseInt(formData.regional_id);

        if (costCenters.length > 0 && regionalId) {
            const filtered = costCenters.filter(cc => cc.regional_id === regionalId);
            setFilteredCostCenters(filtered);

            // Si el Centro de Costo actual NO pertenece a la nueva Regional, lo reseteamos.
            const currentCCId = parseInt(formData.cost_center_id);
            if (currentCCId && !filtered.some(cc => cc.id === currentCCId)) {
                setFormData(prev => ({ ...prev, cost_center_id: '' }));
            }
        } else {
            setFilteredCostCenters([]);
            // Si no hay regional seleccionada o no hay centros de costo, forzar el reseteo
            setFormData(prev => ({ ...prev, cost_center_id: '' })); 
        }
    }, [formData.regional_id, costCenters]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Mapea los campos de ID a enteros o cadena vacía si es necesario
        const val = ['company_id', 'regional_id', 'position_id', 'cost_center_id'].includes(name) 
                    ? (value === '' ? '' : parseInt(value)) 
                    : value;
        
        let newFormData = { ...formData, [name]: val };

        // 🚨 Lógica específica al cambiar la Regional
        if (name === 'regional_id') {
            // Cuando cambia la regional, el centro de costo debe resetearse.
            newFormData.cost_center_id = '';
            
            // Forzar el useEffect de filtrado (aunque React ya lo maneja por dependencia)
            const newRegionalId = parseInt(val);
            if (costCenters.length > 0 && newRegionalId) {
                const filtered = costCenters.filter(cc => cc.regional_id === newRegionalId);
                setFilteredCostCenters(filtered);
            } else {
                setFilteredCostCenters([]);
            }
        }
        
        setFormData(newFormData);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const dataToSend = { ...formData };
        
        const isPasswordProvided = !!dataToSend.password;

        // 🚨 VALIDACIÓN DE CONTRASEÑAS (Mantenemos tu lógica)
        if (isPasswordProvided || (!isEditing && dataToSend.confirm_password)) {
            if (dataToSend.password !== dataToSend.confirm_password) {
                setError("La contraseña y la confirmación de contraseña no coinciden.");
                setLoading(false);
                return;
            }
        } else if (!isEditing) {
             setError("La contraseña es obligatoria para la creación de un nuevo usuario.");
             setLoading(false);
             return;
        }

        // Limpieza de datos antes de enviar al API
        delete dataToSend.confirm_password; 

        // Regla para la contraseña al editar: si está vacía, no la envíes
        if (isEditing && !isPasswordProvided) {
            delete dataToSend.password;
        }
        
        // Aseguramos que los IDs son enteros
        dataToSend.company_id = parseInt(dataToSend.company_id);
        dataToSend.regional_id = parseInt(dataToSend.regional_id);
        dataToSend.position_id = parseInt(dataToSend.position_id);
        // 🚨 NUEVO: Aseguramos que el ID de Centro de Costo es un entero (o null/undefined si no se selecciona)
        if (dataToSend.cost_center_id) {
             dataToSend.cost_center_id = parseInt(dataToSend.cost_center_id);
        } else {
             delete dataToSend.cost_center_id; // Para enviar null o no enviar el campo si está vacío
        }


        try {
            let response;
            if (isEditing) {
                response = await apiClient.put(`/users/${userToEdit.id}`, dataToSend);
            } else {
                // 🚀 Esta ruta POST /users ahora es la que usa el administrador
                // gracias a la modificación en api.php.
                response = await apiClient.post('/users', dataToSend);
            }
            
            // Añadir el Centro de Costo a la respuesta para actualizar la lista (si es necesario)
            onSave(response.data.data || response.data); 
            onClose();
        } catch (err) {
            console.error("Error al guardar usuario:", err.response?.data || err);
            const apiErrors = err.response?.data?.errors;
            
            // 🚨 MENSAJE DE ERROR EN ESPAÑOL
            let errorMessage = err.response?.data?.message || "Error al guardar. Verifique los datos e inténtelo de nuevo.";
            
            if (apiErrors) {
                // Si hay errores de validación, los adjuntamos
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
                
                {/* TÍTULO CON COLOR CORPORATIVO */}
                <h3 className="text-2xl font-bold mb-4 border-b pb-2" style={{ color: PRIMARY_COLOR }}>
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {/* 🚨 MENSAJE DE ERROR LLAMATIVO */}
                {error && <div className={ERROR_CLASS_MODAL}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Datos Personales y Contacto */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2" style={{ color: PRIMARY_COLOR }}>Datos Personales y Contacto</h4>
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
                    </div>
                    
                    {/* Sección 2: Datos Organizacionales */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2 pt-4" style={{ color: PRIMARY_COLOR }}>Datos Organizacionales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        {/* Dropdown Empresa */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Empresa</label>
                            <select
                                name="company_id"
                                value={formData.company_id}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                                disabled={companies.length === 0}
                            >
                                <option value="" disabled>Selecciona una empresa</option> 
                                {companies.map(item => (
                                    <option key={item.id} value={item.id}>{item.name_company || item.name}</option>
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
                                disabled={regionals.length === 0}
                            >
                                <option value="" disabled>Selecciona una regional</option>
                                {regionals.map(item => (
                                    <option key={item.id} value={item.id}>{item.name_regional || item.name}</option>
                                ))}
                            </select>
                            {regionals.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando regionales...</p>}
                        </div>
                         {/* Dropdown Centro de Costo (¡NUEVO!) */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Centro de Costo</label>
                            <select
                                name="cost_center_id"
                                value={formData.cost_center_id}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                // No es required si lo hiciste nullable en la DB
                                disabled={!formData.regional_id || filteredCostCenters.length === 0}
                            >
                                <option value="">(Opcional / Sin asignar)</option>
                                {filteredCostCenters.map(item => (
                                    <option key={item.id} value={item.id}>{item.cost_center_name || item.name}</option>
                                ))}
                            </select>
                            {!formData.regional_id && <p className="text-xs text-red-500 mt-1">Selecciona una Regional primero.</p>}
                            {formData.regional_id && filteredCostCenters.length === 0 && <p className="text-xs text-red-500 mt-1">No hay Centros de Costo para esta Regional.</p>}
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
                                disabled={positions.length === 0}
                            >
                                <option value="" disabled>Selecciona una posición</option>
                                {positions.map(item => (
                                    <option key={item.id} value={item.id}>{item.name_position || item.name}</option>
                                ))}
                            </select>
                            {positions.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando puestos...</p>}
                        </div>
                    </div>

                    {/* Sección 3: Rol y Contraseña */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2 pt-4" style={{ color: PRIMARY_COLOR }}>Seguridad y Rol</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        
                        {/* Dropdown Rol */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select
                                name="role_name"
                                value={formData.role_name}
                                onChange={handleChange}
                                className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                required
                                disabled={roles.length === 0}
                            >
                                <option value="" disabled>Selecciona un rol</option>
                                {roles.map(role => (
                                    <option key={role.id} value={role.name}>{role.name}</option>
                                ))}
                            </select>
                            {roles.length === 0 && <p className="text-xs text-red-500 mt-1">Cargando roles...</p>}
                        </div>
                        
                        {/* Campos Contraseña y Confirmación */}
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                            
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

                            {/* Campo Confirmar Contraseña (NUEVO) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Confirmar Contraseña
                                </label>
                                <input 
                                    type="password" 
                                    name="confirm_password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                    // Se requiere si es una creación O si el campo password tiene contenido.
                                    required={!isEditing || !!formData.password}
                                />
                            </div>
                        </div>

                    </div>

                    <div className="border-t pt-6">
                        {/* BOTÓN SUBMIT CON COLOR CORPORATIVO */}
                        <button 
                            type="submit"
                            disabled={loading || companies.length === 0 || regionals.length === 0 || positions.length === 0 || roles.length === 0} 
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition font-bold disabled:opacity-50"
                            style={{ backgroundColor: PRIMARY_COLOR, transition: 'background-color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(5, 25, 49, 0.9)'}
                            onMouseOut={e => e.currentTarget.style.backgroundColor = PRIMARY_COLOR}
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
// 2. COMPONENTE PRINCIPAL Users
// ===============================================

export default function Users() {
    const { apiClient } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const [selectOptions, setSelectOptions] = useState({
        roles: [],
        companies: [],
        regionals: [],
        positions: [],
        costCenters: [], // 🚨 NUEVO: Lista para Centros de Costo
    });
    const [optionsLoading, setOptionsLoading] = useState(true);

    // FUNCIÓN DE CARGA DE OPCIONES
    const fetchSelectOptions = async () => {
        setOptionsLoading(true);
        try {
            // 🚨 NUEVO: Solicitud para Centros de Costo
            const [companiesRes, regionalsRes, positionsRes, rolesRes, costCentersRes] = await Promise.all([
                apiClient.get('/companies'), 
                apiClient.get('/regionals'), 
                apiClient.get('/positions'), 
                apiClient.get('/roles'),
                apiClient.get('/cost-centers'), // 🚨 NUEVO ENDPOINT
            ]);

            setSelectOptions(prev => ({
                ...prev,
                companies: companiesRes.data.data || companiesRes.data,
                regionals: regionalsRes.data.data || regionalsRes.data,
                positions: positionsRes.data.data || positionsRes.data,
                roles: rolesRes.data.data || rolesRes.data, 
                costCenters: costCentersRes.data.data || costCentersRes.data, // 🚨 NUEVO: Guardar C. de Costo
            }));
        } catch (err) {
            console.error('Error al cargar datos de opciones para el formulario:', err.response?.data || err);
            // 🚨 MENSAJE DE ERROR EN ESPAÑOL
            setError('Error al cargar datos del sistema (Roles, Empresas, Regionales, Puestos o Centros de Costo). Verifique la conexión con el servidor.');
            setSelectOptions(prev => ({ ...prev, roles: [], costCenters: [] })); // Reseteamos también Centros de Costo
        } finally {
            setOptionsLoading(false);
        }
    };
    
    // Función de carga de usuarios (Mantenida)
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            // 🚨 SOLUCIÓN: Usamos el parámetro included para cargar las relaciones.
            // Para listar, se necesita la relación 'costCenter' para la nueva columna.
            const response = await apiClient.get('/users?included=roles,costCenter'); 
            const fetchedUsers = (response.data.data || response.data).map(u => ({
                 ...u,
                 roles: Array.isArray(u.roles) ? u.roles : (u.roles ? [{ name: u.roles[0] }] : [{ name: 'Sin rol' }])
            }));
            setUsers(fetchedUsers);
        } catch (err) {
            // 🚨 MENSAJE DE ERROR EN ESPAÑOL
            setError('Error al cargar los usuarios. Revise la consola y el endpoint /users.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchSelectOptions(); 
    }, [apiClient]);

    const getCompanyName = (companyId) => {
        const company = selectOptions.companies.find(c => c.id === companyId);
        return company ? (company.name_company || company.name) : 'N/A';
    };
    
    // 🚨 NUEVO: Obtener el nombre del Centro de Costo
    const getCostCenterName = (costCenterId) => {
        const cc = selectOptions.costCenters.find(c => c.id === costCenterId);
        return cc ? (cc.cost_center_name || cc.name) : 'N/A';
    };


    const handleCreateClick = () => {
        setEditingUser(null); 
        setIsModalOpen(true);
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSave = (savedUser) => {
        const userWithRoles = {
             ...savedUser,
             company_id: savedUser.company_id || (savedUser.company_id === 0 ? savedUser.company_id : selectOptions.companies[0]?.id),
             roles: Array.isArray(savedUser.roles) ? savedUser.roles : (savedUser.roles ? [{ name: savedUser.roles[0] }] : [{ name: savedUser.role_name || 'Sin rol' }])
        };

        if (editingUser) {
            setUsers(users.map(u => u.id === userWithRoles.id ? userWithRoles : u));
        } else {
            setUsers([userWithRoles, ...users]);
        }
        setEditingUser(null);
    };
    
    const handleDeleteClick = async (userId) => {
        // 🚨 CONFIRMACIÓN EN ESPAÑOL
        if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

        try {
            await apiClient.delete(`/users/${userId}`);
            setUsers(users.filter(u => u.id !== userId));
        } catch (err) {
            // 🚨 MENSAJE DE ERROR EN ESPAÑOL
            setError('Error al eliminar el usuario. Es posible que tenga registros asociados.');
            console.error(err);
        }
    };


    return (
        <AuthenticatedLayout title="Gestión de Usuarios">
            <div className="p-8">
                {/* Cabecera con botón de crear */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">Listado general de usuarios del sistema.</p>
                    {/* BOTÓN NUEVO USUARIO CON COLOR CORPORATIVO */}
                    <button 
                        onClick={handleCreateClick}
                        className="flex items-center px-4 py-2 text-white rounded-lg transition shadow-md"
                        style={{ backgroundColor: PRIMARY_COLOR, transition: 'background-color 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(5, 25, 49, 0.9)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = PRIMARY_COLOR}
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Usuario
                    </button>
                </div>

                {/* Manejo de Estados de Carga/Error */}
                {(loading || optionsLoading) && <div className="text-center py-10" style={{ color: PRIMARY_COLOR }}>Cargando datos del sistema...</div>}
                
                {/* 🚨 ERROR LLAMATIVO */}
                {error && <div className={ERROR_CLASS_MAIN}>🚨 ¡Error! {error}</div>}

                {/* Tabla */}
                {!(loading || optionsLoading) && !error && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {/* ENCABEZADOS DE TABLA CON COLOR DE ACENTO */}
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Nombre</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Email</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Empresa</th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>C. Costo</th> {/* 🚨 NUEVA COLUMNA */}
                                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Roles</th>
                                        <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user.id} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        {/* AVATAR CON COLOR DE ACENTO */}
                                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold" style={{ backgroundColor: 'rgba(5, 25, 49, 0.1)', color: PRIMARY_COLOR }}>
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
                                                    <div className="text-sm text-gray-900">
                                                        {getCompanyName(user.company_id)}
                                                    </div>
                                                </td>
                                                {/* 🚨 NUEVA CELDA para Centro de Costo */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {/* SOLUCIÓN: Primero intenta usar el objeto cost_center cargado por la relación, si no, lo busca por ID. */}
                                                    <div className="text-sm text-gray-900">
                                                        {user.cost_center?.cost_center_name || user.cost_center?.name || getCostCenterName(user.cost_center_id)}
                                                    </div>
                                                </td>
                                                {/* Fin de NUEVA CELDA */}
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
                                                    {/* BOTÓN EDITAR CON COLOR CORPORATIVO */}
                                                    <button 
                                                        onClick={() => handleEditClick(user)}
                                                        className="hover:text-gray-900 mr-3"
                                                        style={{ color: PRIMARY_COLOR }}
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
                                            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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
                    selectOptions={selectOptions}
                />
            </div>
        </AuthenticatedLayout>
    );
}