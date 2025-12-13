import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { 
    PencilIcon, 
    TrashIcon, 
    PlusIcon, 
    XMarkIcon, 
    MagnifyingGlassIcon, 
    FunnelIcon, 
    ArrowPathIcon,
    InformationCircleIcon 
} from '@heroicons/react/24/outline'; 

// --- CLASES DE ESTILO Y COLOR ---
const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 

const ERROR_CLASS_MAIN = 'p-4 font-bold text-white bg-red-700 rounded-lg shadow-xl border-2 border-red-800';
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-100 rounded-lg border border-red-300'; 

const HARDCODED_ROLES = ['Administrador', 'Gestor', 'Administrativo', 'Asesor']; 

// ===============================================
// 1. COMPONENTE MODAL DE FORMULARIO (Mantenido)
// ===============================================

const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions, isLoadingOptions }) => {
    if (!isOpen) return null;

    if (isLoadingOptions) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" style={{ borderColor: PRIMARY_COLOR }}></div>
                    <p className="text-gray-600 font-semibold text-center">Cargando datos<br/>(Empresas, Roles, etc.)...</p>
                </div>
            </div>
        );
    }

    const isEditing = !!userToEdit;
    const { apiClient } = useAuth();
    
    const { roles, companies, regionals, positions, costCenters } = selectOptions; 
    
    const defaultCompanyId = companies[0]?.id || ''; 
    const defaultRegionalId = regionals[0]?.id || '';
    const defaultPositionId = positions[0]?.id || '';
    const defaultCostCenterId = costCenters[0]?.id || ''; 
    const defaultRoleName = roles[0]?.name || HARDCODED_ROLES[0]; 
    
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
        cost_center_id: userToEdit?.cost_center_id || defaultCostCenterId,
        password: '',
        confirm_password: '', 
        role_name: userToEdit?.roles?.[0]?.name || defaultRoleName,
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- EFECTO 1: Inicialización y Reseteo del Formulario ---
    useEffect(() => {
        const currentDefaultRoleName = roles[0]?.name || HARDCODED_ROLES[0];
        
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
                cost_center_id: userCostCenterId,
                password: '',
                confirm_password: '',
                role_name: userToEdit.roles?.[0]?.name || currentDefaultRoleName,
            });
        } else {
            setFormData({
                name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
                company_id: defaultCompanyId,
                regional_id: defaultRegionalId,
                position_id: defaultPositionId,
                cost_center_id: defaultCostCenterId,
                password: '',
                confirm_password: '',
                role_name: currentDefaultRoleName,
            });
        }
        setError(null);
    }, [userToEdit, isOpen, roles, companies, regionals, positions, costCenters, defaultCompanyId, defaultRegionalId, defaultPositionId, defaultCostCenterId]);


    // --- EFECTO 2: Filtrado de Centros de Costo al cambiar la Regional ---
    useEffect(() => {
        const regionalId = parseInt(formData.regional_id);

        if (costCenters.length > 0 && regionalId) {
            const filtered = costCenters.filter(cc => cc.regional_id === regionalId);
            setFilteredCostCenters(filtered);

            const currentCCId = parseInt(formData.cost_center_id);
            if (currentCCId && !filtered.some(cc => cc.id === currentCCId)) {
                setFormData(prev => ({ ...prev, cost_center_id: '' }));
            }

        } else {
            setFilteredCostCenters([]);
            if (regionalId && costCenters.length > 0 || !regionalId) {
                 setFormData(prev => ({ ...prev, cost_center_id: '' })); 
            }
        }
    }, [formData.regional_id, costCenters, formData.cost_center_id]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        
        const val = ['company_id', 'regional_id', 'position_id', 'cost_center_id'].includes(name) 
                    ? (value === '' ? '' : parseInt(value)) 
                    : value;
        
        let newFormData = { ...formData, [name]: val };

        if (name === 'regional_id') {
            newFormData.cost_center_id = '';
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

        delete dataToSend.confirm_password; 

        if (isEditing && !isPasswordProvided) {
            delete dataToSend.password;
        }
        
        dataToSend.company_id = parseInt(dataToSend.company_id);
        dataToSend.regional_id = parseInt(dataToSend.regional_id);
        dataToSend.position_id = parseInt(dataToSend.position_id);
        if (dataToSend.cost_center_id) {
             dataToSend.cost_center_id = parseInt(dataToSend.cost_center_id);
        } else {
             dataToSend.cost_center_id = null;
        }


        try {
            let response;
            if (isEditing) {
                response = await apiClient.put(`/users/${userToEdit.id}`, dataToSend);
            } else {
                response = await apiClient.post('/users', dataToSend);
            }
            onSave(response.data.data || response.data); 
            onClose();
        } catch (err) {
            console.error("Error al guardar usuario:", err.response?.data || err);
            const apiErrors = err.response?.data?.errors;
            let errorMessage = err.response?.data?.message || "Error al guardar. Verifique los datos e inténtelo de nuevo.";
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
                
                <h3 className="text-2xl font-bold mb-4 border-b pb-2" style={{ color: PRIMARY_COLOR }}>
                    {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                {error && <div className={ERROR_CLASS_MODAL}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Sección 1: Datos Personales y Contacto */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2" style={{ color: PRIMARY_COLOR }}>Datos Personales y Contacto</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input type="text" name="name_user" value={formData.name_user} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Apellido</label>
                            <input type="text" name="last_name_user" value={formData.last_name_user} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">N° Documento</label>
                            <input type="text" name="number_document" value={formData.number_document} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
                            <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    
                    {/* Sección 2: Datos Organizacionales */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2 pt-4" style={{ color: PRIMARY_COLOR }}>Datos Organizacionales</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Empresa</label>
                            <select name="company_id" value={formData.company_id} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white" required disabled={companies.length === 0}>
                                <option value="" disabled>Selecciona una empresa</option> 
                                {companies.map(item => (<option key={item.id} value={item.id}>{item.name_company || item.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Regional</label>
                            <select name="regional_id" value={formData.regional_id} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white" required disabled={regionals.length === 0}>
                                <option value="" disabled>Selecciona una regional</option>
                                {regionals.map(item => (<option key={item.id} value={item.id}>{item.name_regional || item.name}</option>))}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Centro de Costo</label>
                            <select name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white" disabled={!formData.regional_id || filteredCostCenters.length === 0}>
                                <option value="">(Opcional / Sin asignar)</option>
                                {filteredCostCenters.map(item => (<option key={item.id} value={item.id}>{item.cost_center_name || item.name}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Posición</label>
                            <select name="position_id" value={formData.position_id} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white" required disabled={positions.length === 0}>
                                <option value="" disabled>Selecciona una posición</option>
                                {positions.map(item => (<option key={item.id} value={item.id}>{item.name_position || item.name}</option>))}
                            </select>
                        </div>
                    </div>

                    {/* Sección 3: Rol y Contraseña */}
                    <h4 className="text-lg font-semibold my-4 border-b pb-2 pt-4" style={{ color: PRIMARY_COLOR }}>Seguridad y Rol</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Rol</label>
                            <select name="role_name" value={formData.role_name} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white" required disabled={roles.length === 0}>
                                <option value="" disabled>Selecciona un rol</option>
                                {roles.map(role => (<option key={role.id} value={role.name}>{role.name}</option>))}
                            </select>
                        </div>
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4"> 
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contraseña {isEditing && "(Dejar vacío para no cambiar)"}</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required={!isEditing} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Confirmar Contraseña</label>
                                <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} className="mt-1 w-full p-2 border border-gray-300 rounded-md" required={!isEditing || !!formData.password} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <button 
                            type="submit"
                            disabled={loading || companies.length === 0} 
                            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition font-bold disabled:opacity-50"
                            style={{ backgroundColor: PRIMARY_COLOR }}
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
// 2. COMPONENTE MODAL DE DETALLES (Actualizado para mostrar 'cargando...')
// ===============================================

const UserDetailsModal = ({ isOpen, onClose, user, getCompanyName, getCostCenterName, getPositionName }) => {
    if (!isOpen || !user) return null;

    const PRIMARY_COLOR = 'rgba(5, 25, 49)';
    
    // Si la información de las relaciones aún no está cargada, mostramos un spinner
    const isFullDataLoaded = user.company && user.regional && user.position;
    
    if (!isFullDataLoaded) {
         return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col items-center max-w-sm w-full">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4" style={{ borderColor: PRIMARY_COLOR }}></div>
                    <p className="text-gray-600 font-semibold text-center">Cargando detalles del usuario...</p>
                </div>
            </div>
        );
    }
    
    // Datos completos (solo disponibles si isFullDataLoaded es true)
    const positionName = user.position?.name_position || user.position?.name || getPositionName(user.position_id);
    const companyName = user.company?.name_company || user.company?.name || getCompanyName(user.company_id);
    const costCenterName = user.cost_center?.cost_center_name || user.cost_center?.name || getCostCenterName(user.cost_center_id);
    const birthdateValue = user.birthdate?.split('T')[0];
    const formattedBirthdate = birthdateValue ? new Date(birthdateValue).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const regionalName = user.regional?.name_regional || user.regional?.name || 'N/A';


    const dataSections = [
        {
            title: "Datos Personales",
            items: [
                { label: "Nombre Completo", value: `${user.name_user || user.name} ${user.last_name_user || ''}` },
                { label: "Email", value: user.email },
                { label: "N° Documento", value: user.number_document },
                { label: "F. Nacimiento", value: formattedBirthdate },
            ]
        },
        {
            title: "Datos Organizacionales",
            items: [
                { label: "Empresa", value: companyName },
                { label: "Regional", value: regionalName },
                { label: "Centro de Costo", value: costCenterName },
                { label: "Cargo/Puesto", value: positionName },
            ]
        },
        {
            title: "Seguridad y Roles",
            items: [
                { label: "Roles", value: user.roles.map(r => r.name).join(', ') || 'Sin rol' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
                <h3 className="text-2xl font-bold mb-4 border-b pb-2 flex items-center" style={{ color: PRIMARY_COLOR }}>
                    <InformationCircleIcon className="w-6 h-6 mr-2" />
                    Detalle de {user.name_user || user.name}
                </h3>
                
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="space-y-6">
                    {dataSections.map((section, index) => (
                        <div key={index} className="border p-4 rounded-lg bg-gray-50">
                            <h4 className="text-lg font-semibold mb-3 border-b pb-1" style={{ color: PRIMARY_COLOR }}>{section.title}</h4>
                            <dl className="space-y-2">
                                {section.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex flex-col">
                                        <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                                        <dd className="text-base font-semibold text-gray-900">{item.value || 'N/A'}</dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    ))}
                </div>

                <div className="border-t pt-4 mt-6">
                    <button 
                        onClick={onClose}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white transition font-bold"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(5, 25, 49, 0.9)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = PRIMARY_COLOR}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};


// ===============================================
// 3. COMPONENTE PRINCIPAL Users
// ===============================================

const Pagination = ({ meta, onPageChange }) => {
    if (!meta || meta.last_page <= 1) return null;

    const { current_page, last_page, total } = meta;
    const handlePageClick = (page) => {
        if (page >= 1 && page <= last_page && page !== current_page) {
            onPageChange(page);
        }
    };

    return (
        <div className="flex justify-between items-center py-3 px-4 bg-gray-50 border-t">
            <div className="text-sm text-gray-700">
                Mostrando página **{current_page}** de **{last_page}** (**{total}** registros en total)
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => handlePageClick(current_page - 1)} disabled={current_page === 1} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Anterior</button>
                <span className="px-3 py-1 text-sm font-bold text-white rounded-lg" style={{ backgroundColor: PRIMARY_COLOR }}>{current_page}</span>
                <button onClick={() => handlePageClick(current_page + 1)} disabled={current_page === last_page} className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50">Siguiente</button>
            </div>
        </div>
    );
};


export default function Users() {
    // IMPORTANTE: Asumimos que `logOut` existe en useAuth para cerrar sesión
    const { apiClient, logOut } = useAuth(); 
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [error, setError] = useState(null);
    
    const [paginationMeta, setPaginationMeta] = useState(null);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Estado para el modal de detalle: solo tiene el usuario base al inicio
    const [viewingUserDetail, setViewingUserDetail] = useState(null); 

    const [filters, setFilters] = useState({
        search: '', 
        company_id: '',
        cost_center_id: '',
        position_id: '',
    });
    const [filteredCostCenters, setFilteredCostCenters] = useState([]);

    const [selectOptions, setSelectOptions] = useState({
        roles: [], companies: [], regionals: [], positions: [], costCenters: [], 
    });
    
    const [optionsLoading, setOptionsLoading] = useState(false);
    const [optionsLoaded, setOptionsLoaded] = useState(false);

    // Función de carga de opciones (Mantenida)
    const fetchSelectOptions = useCallback(async () => {
        if (optionsLoaded || optionsLoading) return;
        setOptionsLoading(true);
        try {
            const [companiesRes, regionalsRes, positionsRes, rolesRes, costCentersRes] = await Promise.all([
                apiClient.get('/companies'), 
                apiClient.get('/regionals'), 
                apiClient.get('/positions'), 
                apiClient.get('/roles'),
                apiClient.get('/cost-centers'),
            ]);

            setSelectOptions({
                companies: companiesRes.data.data || companiesRes.data,
                regionals: regionalsRes.data.data || regionalsRes.data,
                positions: positionsRes.data.data || positionsRes.data,
                roles: rolesRes.data.data || rolesRes.data, 
                costCenters: costCentersRes.data.data || costCentersRes.data,
            });
            setOptionsLoaded(true);
        } catch (err) {
            console.error('Error al cargar datos de opciones:', err.response?.data || err);
            setError('Error al cargar opciones (Empresas, Roles, etc.). Verifica tu conexión.');
             // Manejo de Error 401: si la API falla aquí, es que el token expiró
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                 setError('Su sesión ha expirado. Redirigiendo al login...');
                 logOut(); // Llama a la función de logout para limpiar sesión y redirigir
            }
        } finally {
            setOptionsLoading(false);
        }
    }, [apiClient, optionsLoaded, optionsLoading, logOut]);
    
    // Función de carga de usuarios (Optimización y Error 401)
    const fetchUsers = useCallback(async (page = 1, currentFilters = filters) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: page,
                per_page: 10,
                // OPTIMIZACIÓN: Solo incluimos roles y position (puesto) para la tabla
                // Ya no es estrictamente necesario, pero lo mantenemos si el scope 'included' es custom
                included: 'roles,position', 
            });

            if (currentFilters.search) {
                queryParams.append('search', currentFilters.search);
            }
            if (currentFilters.company_id) {
                queryParams.append('company_id', currentFilters.company_id);
            }
            if (currentFilters.cost_center_id) {
                queryParams.append('cost_center_id', currentFilters.cost_center_id);
            }
            if (currentFilters.position_id) {
                queryParams.append('position_id', currentFilters.position_id);
            }

            const response = await apiClient.get(`/users?${queryParams.toString()}`); 
            
            const usersData = response.data.data;
            const paginationMeta = {
                current_page: response.data.current_page,
                last_page: response.data.last_page,
                total: response.data.total,
            };
            
            const formattedUsers = usersData.map(u => ({
                 ...u,
                 roles: Array.isArray(u.roles) ? u.roles : (u.roles ? [{ name: u.roles[0] }] : [{ name: 'Sin rol' }])
            }));
            
            setUsers(formattedUsers);
            setPaginationMeta(paginationMeta); 
        } catch (err) {
            // Manejo de Error 401: Si el API devuelve 401 o 403 (No autorizado/Prohibido)
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Su sesión ha expirado. Redirigiendo al login...');
                logOut(); // Llama a la función de logout para limpiar sesión y redirigir
            } else {
                setError('Error al cargar los usuarios. Revise la consola y el endpoint /users.');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiClient, filters, logOut]);


    useEffect(() => {
        fetchUsers();
        if (!optionsLoaded && !optionsLoading) {
            fetchSelectOptions();
        }
    }, [apiClient, fetchUsers, fetchSelectOptions, optionsLoaded, optionsLoading]);


    useEffect(() => {
        setFilteredCostCenters(selectOptions.costCenters);
    }, [filters.company_id, selectOptions.costCenters]);


    // --- HELPERS PARA LA TABLA Y MODAL (Mantenidos) ---
    const getCompanyName = (companyId) => {
        if (!optionsLoaded) return '...';
        const company = selectOptions.companies.find(c => c.id === companyId);
        return company ? (company.name_company || company.name) : 'N/A';
    };
    
    const getCostCenterName = (costCenterId) => {
        if (!optionsLoaded) return '...';
        const cc = selectOptions.costCenters.find(c => c.id === costCenterId);
        return cc ? (cc.cost_center_name || cc.name) : 'N/A';
    };

    const getPositionName = (positionId) => {
        if (!optionsLoaded) return '...';
        const position = selectOptions.positions.find(p => p.id === positionId);
        return position ? (position.name_position || position.name) : 'N/A';
    };

    // --- MANEJO DE EVENTOS (Mantenido) ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        
        const val = ['company_id', 'cost_center_id', 'position_id'].includes(name) 
                    ? (value === '' ? '' : parseInt(value)) 
                    : value;
        
        setFilters(prev => ({ ...prev, [name]: val }));
    };
    
    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers(1, filters); 
    };

    const handleClearFilters = () => {
        const defaultFilters = {
            search: '', company_id: '', cost_center_id: '', position_id: '',
        };
        setFilters(defaultFilters);
        fetchUsers(1, defaultFilters); 
    }

    const handleCreateClick = async () => {
        setEditingUser(null); 
        setIsModalOpen(true); 
        await fetchSelectOptions();
    };

    const handleEditClick = async (user) => {
        setEditingUser(user);
        setIsModalOpen(true);
        await fetchSelectOptions();
    };
    
    // --- OPTIMIZACIÓN: Manejo del Modal de Detalle (Carga de datos al abrir) ---
    const handleViewDetailsClick = async (user) => {
        // 1. Mostrar el modal con los datos básicos y spinner
        setViewingUserDetail(user); 
        
        try {
            // 2. Cargar el usuario completo. Se ELIMINA el parámetro 'included' 
            // y se confía en la carga ansiosa optimizada en UserController.php@show.
            const response = await apiClient.get(`/users/${user.id}`); // <--- OPTIMIZACIÓN AQUÍ
            const fullUserData = response.data; // Asume que el endpoint /users/{id} devuelve el objeto directamente
            
            // 3. Actualizar el estado con los datos completos
            setViewingUserDetail(prev => ({
                ...prev, 
                ...fullUserData, 
                // Asegurar que roles se mantiene o se actualiza si viene con la relación
                roles: Array.isArray(fullUserData.roles) ? fullUserData.roles : (fullUserData.roles ? [{ name: fullUserData.roles[0] }] : user.roles)
            }));
            
        } catch (err) {
             // Manejo de Error 401 en el detalle
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Su sesión ha expirado. Redirigiendo al login...');
                logOut();
            } else {
                 setError('Error al cargar los detalles completos del usuario.');
            }
            console.error(err);
            setViewingUserDetail(null); // Cerrar el modal si hay un error
        }
    };

    const handleCloseDetailsModal = () => {
        setViewingUserDetail(null);
    };

    const handleSave = () => {
        fetchUsers(paginationMeta?.current_page || 1, filters); 
        setEditingUser(null);
    };
    
    const handleDeleteClick = async (userId) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) return;

        try {
            await apiClient.delete(`/users/${userId}`);
            fetchUsers(paginationMeta?.current_page || 1, filters); 
        } catch (err) {
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Su sesión ha expirado. Redirigiendo al login...');
                logOut();
            } else {
                setError('Error al eliminar el usuario. Es posible que tenga registros asociados.');
            }
            console.error(err);
        }
    };

    const handlePageChange = (page) => {
        fetchUsers(page, filters);
    };


    return (
        <AuthenticatedLayout title="Gestión de Usuarios">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">Listado general de usuarios del sistema.</p>
                    <button 
                        onClick={handleCreateClick}
                        className="flex items-center px-4 py-2 text-white rounded-lg transition shadow-md"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(5, 25, 49, 0.9)'}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = PRIMARY_COLOR}
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nuevo Usuario
                    </button>
                </div>

                {/* --- SECCIÓN DE FILTROS (Mantenida) --- */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-200">
                    <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: PRIMARY_COLOR }}>
                        <FunnelIcon className="w-6 h-6 mr-2" />
                        Filtros de Búsqueda
                    </h3>
                    <form onSubmit={handleSearch}>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Buscar (Nombre/Apellido)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <input 
                                        type="text" 
                                        name="search" 
                                        value={filters.search} 
                                        onChange={handleFilterChange} 
                                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                        placeholder="Escribe nombre o apellido..." 
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Empresa</label>
                                <select 
                                    name="company_id" 
                                    value={filters.company_id} 
                                    onChange={handleFilterChange} 
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                >
                                    <option value="">Todas las Empresas</option> 
                                    {selectOptions.companies.map(item => (<option key={item.id} value={item.id}>{item.name_company || item.name}</option>))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Centro de Costo</label>
                                <select 
                                    name="cost_center_id" 
                                    value={filters.cost_center_id} 
                                    onChange={handleFilterChange} 
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                >
                                    <option value="">Todos los C. Costo</option>
                                    {selectOptions.costCenters.map(item => (<option key={item.id} value={item.id}>{item.cost_center_name || item.name}</option>))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Posición</label>
                                <select 
                                    name="position_id" 
                                    value={filters.position_id} 
                                    onChange={handleFilterChange} 
                                    className="mt-1 w-full p-2 border border-gray-300 rounded-md bg-white"
                                >
                                    <option value="">Todas las Posiciones</option>
                                    {selectOptions.positions.map(item => (<option key={item.id} value={item.id}>{item.name_position || item.name}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t border-gray-100">
                            <button 
                                type="button" 
                                onClick={handleClearFilters}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition"
                            >
                                <ArrowPathIcon className="w-5 h-5 mr-2" />
                                Limpiar Filtros
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="flex items-center px-4 py-2 text-white rounded-md shadow-sm text-sm font-medium transition disabled:opacity-50"
                                style={{ backgroundColor: PRIMARY_COLOR }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(5, 25, 49, 0.9)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = PRIMARY_COLOR}
                            >
                                <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                    </form>
                </div>
                {/* --- FIN SECCIÓN DE FILTROS --- */}

                {loading && !users.length ? (
                    <div className="text-center py-10" style={{ color: PRIMARY_COLOR }}>Cargando datos del sistema...</div>
                ) : (
                    <>
                        {error && <div className={ERROR_CLASS_MAIN}>🚨 ¡Error! {error}</div>}

                        {!error && (
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        {/* --- ENCABEZADOS DE TABLA ACTUALIZADOS --- */}
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Nombre</th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Email</th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Cargo/Puesto</th>
                                                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Rol</th>
                                                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider`} style={{ color: PRIMARY_COLOR }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {users.length > 0 ? (
                                                users.map((user) => (
                                                    <tr key={user.id} className="hover:bg-gray-50 transition">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
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
                                                        {/* --- CAMPO CARGO/PUESTO (Usamos la relación 'position' cargada por la optimización) --- */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">
                                                                {user.position?.name_position || user.position?.name || getPositionName(user.position_id)}
                                                            </div>
                                                        </td>
                                                        {/* --- CAMPO ROL (Principal) --- */}
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex flex-wrap gap-1">
                                                                {user.roles && user.roles.length > 0 ? (
                                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                        {user.roles[0].name || user.roles[0]}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-xs text-gray-400">Sin rol</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-3">
                                                            {/* --- BOTÓN VER MÁS --- */}
                                                            <button 
                                                                onClick={() => handleViewDetailsClick(user)}
                                                                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                                            >
                                                                Ver Más
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEditClick(user)}
                                                                className="hover:text-gray-900"
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
                                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                                        No se encontraron usuarios con los filtros aplicados.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination meta={paginationMeta} onPageChange={handlePageChange} />
                            </div>
                        )}
                    </>
                )}
                
                {/* Modal de Formulario */}
                <UserFormModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    userToEdit={editingUser}
                    onSave={handleSave}
                    selectOptions={selectOptions}
                    isLoadingOptions={optionsLoading} 
                />
                
                {/* Modal de Detalle de Usuario */}
                <UserDetailsModal
                    isOpen={!!viewingUserDetail}
                    onClose={handleCloseDetailsModal}
                    user={viewingUserDetail}
                    getCompanyName={getCompanyName}
                    getCostCenterName={getCostCenterName}
                    getPositionName={getPositionName}
                />
            </div>
        </AuthenticatedLayout>
    );
}