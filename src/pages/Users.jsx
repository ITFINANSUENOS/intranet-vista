import React, { useState } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks/useUsers'; 
import { 
    PencilIcon, TrashIcon, PlusIcon, XMarkIcon, 
    MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, 
    InformationCircleIcon, UserGroupIcon, MapPinIcon, BriefcaseIcon,
    IdentificationIcon, BuildingOfficeIcon  // ✅ BuildingOfficeIcon AÑADIDO
} from '@heroicons/react/24/outline'; 

const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2'; 

// ===============================================
// 1. MODAL DE FORMULARIO (CREAR/EDITAR)
// ===============================================
const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions = {}, isLoadingOptions }) => {
    if (!isOpen) return null;
    
    if (isLoadingOptions) return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[rgba(5,25,49)] mb-4"></div>
                <p className="text-slate-600 font-medium">Cargando opciones del formulario...</p>
            </div>
        </div>
    );

    const [formData, setFormData] = useState({
        cedula: userToEdit?.number_document || '',
        name_user: userToEdit?.name_user || '', 
        last_name_user: userToEdit?.last_name_user || '',
        email: userToEdit?.email || '', 
        password: '', 
        password_confirmation: '',
        role_id: userToEdit?.roles?.[0]?.id || userToEdit?.role_id || '', 
        company_id: userToEdit?.company_id || '', 
        regional_id: userToEdit?.regional_id || '', 
        cost_center_id: userToEdit?.cost_center_id || '', 
        position_id: userToEdit?.position_id || ''
    });
    
    const [formErrors, setFormErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [generalError, setGeneralError] = useState(null);

    const optionsData = selectOptions?.data || selectOptions || {};

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});
        setGeneralError(null);
        setIsSaving(true);

        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== '') {
                if (key === 'role_id') {
                    const selectedRole = (optionsData.roles || []).find(r => String(r.id) === String(formData.role_id));
                    if (selectedRole) {
                        dataToSend.append('role_name', selectedRole.name);
                    }
                    dataToSend.append('role_id', formData.role_id);
                } else {
                    dataToSend.append(key, formData[key]);
                }
            }
        });

        try {
            await onSave(dataToSend, userToEdit?.id);
            onClose();
        } catch (error) {
            console.error("Error al guardar usuario:", error);
            if (error.response?.status === 422) {
                setFormErrors(error.response.data.errors || {});
                setGeneralError("Por favor, corrige los errores en el formulario.");
            } else {
                setGeneralError(error.response?.data?.message || "Ocurrió un error inesperado al guardar.");
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-0 overflow-y-auto">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden my-8 border border-slate-100">
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {userToEdit ? 'Editar Información del Usuario' : 'Registrar Nuevo Usuario'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Completa los campos obligatorios marcados con *</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {generalError && (
                        <div className={ERROR_CLASS_MODAL}>
                            <InformationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">{generalError}</p>
                        </div>
                    )}

                    <form id="userForm" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4 text-slate-400" />
                                Información Personal
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cédula *</label>
                                    <input type="text" name="number_document" value={formData.number_document} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm" placeholder="Ej. 1023456789" />
                                    {formErrors.number_document && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.number_document[0]}</p>}
                                </div>
                                <div className="hidden md:block"></div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nombres *</label>
                                    <input type="text" name="name_user" value={formData.name_user} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm" placeholder="Ej. Juan Carlos" />
                                    {formErrors.name_user && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.name_user[0]}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Apellidos *</label>
                                    <input type="text" name="last_name_user" value={formData.last_name_user} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm" placeholder="Ej. Pérez Gómez" />
                                    {formErrors.last_name_user && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.last_name_user[0]}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Correo Electrónico *</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm" placeholder="ejemplo@empresa.com" />
                                    {formErrors.email && <p className="text-red-500 text-xs mt-1 font-medium">{formErrors.email[0]}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Contraseña {userToEdit && <span className="text-slate-400 font-normal">(Opcional)</span>}</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required={!userToEdit} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm placeholder-slate-300" placeholder="••••••••" minLength="8" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirmar Contraseña</label>
                                    <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required={!userToEdit && !!formData.password} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm placeholder-slate-300" placeholder="••••••••" minLength="8" />
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />
                        
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <BriefcaseIcon className="w-4 h-4 text-slate-400" />
                                Asignación Corporativa
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rol del Sistema *</label>
                                    <select name="role_id" value={formData.role_id} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none">
                                        <option value="">Seleccione un rol</option>
                                        {(optionsData.roles || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Compañía *</label>
                                    <select name="company_id" value={formData.company_id} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none">
                                        <option value="">Seleccione compañía</option>
                                        {(optionsData.companies || []).map(c => <option key={c.id} value={c.id}>{c.name_company}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Regional *</label>
                                    <select name="regional_id" value={formData.regional_id} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none">
                                        <option value="">Seleccione regional</option>
                                        {(optionsData.regionals || []).map(r => <option key={r.id} value={r.id}>{r.name_regional}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Centro de Costo *</label>
                                    <select name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none">
                                        <option value="">Seleccione centro de costo</option>
                                        {(optionsData.cost_centers || []).map(c => <option key={c.id} value={c.id}>{c.id} - {c.cost_center_name}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cargo *</label>
                                    <select name="position_id" value={formData.position_id} onChange={handleChange} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm appearance-none">
                                        <option value="">Seleccione cargo</option>
                                        {(optionsData.positions || []).map(p => <option key={p.id} value={p.id}>{p.name_position}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                    <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50">
                        Cancelar
                    </button>
                    <button type="submit" form="userForm" disabled={isSaving} style={{ backgroundColor: PRIMARY_COLOR }} className="px-6 py-2.5 text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-all active:scale-95 flex items-center gap-2">
                        {isSaving ? 'Guardando...' : (userToEdit ? 'Actualizar Usuario' : 'Crear Usuario')}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// 2. MODAL DE DETALLES
// ===============================================
// ===============================================
// 2. MODAL DE DETALLES
// ===============================================
const UserDetailsModal = ({ isOpen, onClose, user, getRoleName, getCompanyName, getRegionalName, getPositionName, getCostCenterCode }) => {
    if (!isOpen || !user) return null;

    // Función para capitalizar correctamente el nombre
    const formatName = (name) => {
        if (!name) return '';
        return name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    };

    const fullName = formatName(`${user.name_user} ${user.last_name_user}`);

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative">
                
                {/* Cabecera Estética - Gradiente profesional */}
                <div 
                    className="h-32 w-full relative"
                    style={{ background: 'linear-gradient(135deg, rgba(4,24,48,1) 0%, rgba(15,39,70,1) 100%)' }}
                >
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur transition-colors">
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                    
                    {/* Avatar superpuesto */}
                    <div className="absolute -bottom-10 left-8">
                        <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-white flex items-center justify-center">
                            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center">
                                <UserGroupIcon className="w-10 h-10 text-slate-300" />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Cuerpo del Modal */}
                <div className="px-8 pb-8 pt-16">
                    <div className="mb-8 flex flex-wrap items-center gap-4">
                        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {fullName}
                        </h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 uppercase tracking-wider">
                            <BriefcaseIcon className="w-3.5 h-3.5" />
                            {getRoleName(user)}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tarjeta de Información Personal */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5 pb-2 border-b border-slate-200 flex items-center gap-2">
                                <IdentificationIcon className="w-4 h-4 text-slate-400" />
                                Datos Personales
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cédula</p>
                                    <p className="text-slate-900 font-medium text-base">{user.number_document || 'No registrada'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</p>
                                    <p className="text-slate-900 font-medium text-base break-all">{user.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta de Información Corporativa */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-5 pb-2 border-b border-slate-200 flex items-center gap-2">
                                <BuildingOfficeIcon className="w-4 h-4 text-slate-400" />
                                Datos Corporativos
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Compañía / Regional</p>
                                    <p className="text-slate-900 font-medium text-base">{getCompanyName(user)} — {getRegionalName(user)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cargo y C. Costo</p>
                                    <p className="text-slate-900 font-medium text-base">{getPositionName(user)}</p>
                                    <p className="text-slate-500 font-medium text-sm mt-0.5">CC: {getCostCenterCode(user)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// 3. VISTA PRINCIPAL (USERS)
// ===============================================
export default function Users() {
    const { user } = useAuth(); 

    const { 
        users, pagination, selectOptions, 
        loading, optionsLoading,
        searchTerm, setSearchTerm,
        selectedRole, setSelectedRole,
        selectedCompany, setSelectedCompany,
        selectedRegional, setSelectedRegional,
        selectedCostCenter, setSelectedCostCenter,
        fetchUsers, deleteUser, saveUser
    } = useUsers();

    const safeUsers = Array.isArray(users) ? users : (Array.isArray(users?.data) ? users.data : []);
    const optionsData = selectOptions?.data || selectOptions || {};

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);

    const openCreateModal = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const openEditModal = (userData) => {
        setEditingUser(userData);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que deseas eliminar permanentemente este usuario?")) return;
        try {
            await deleteUser(id); 
        } catch (error) {
            alert("No se pudo eliminar el usuario.");
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedRole('');
        setSelectedCompany('');
        setSelectedRegional('');
        setSelectedCostCenter('');
        fetchUsers(null);
    };

    const getRoleName = (u) => {
        if (u.roles && u.roles[0]?.name) return u.roles[0].name;
        if (u.role_name) return u.role_name;
        const role = (optionsData.roles || []).find(r => String(r.id) === String(u.role_id));
        return role ? role.name : 'N/A';
    };

    const getCompanyName = (u) => {
        if (u.company && u.company.name_company) return u.company.name_company;
        const company = (optionsData.companies || []).find(c => String(c.id) === String(u.company_id));
        return company ? company.name_company : 'N/A';
    };

    const getRegionalName = (u) => {
        if (u.regional && u.regional.name_regional) return u.regional.name_regional;
        const regional = (optionsData.regionals || []).find(r => String(r.id) === String(u.regional_id));
        return regional ? regional.name_regional : 'N/A';
    };

    const getPositionName = (u) => {
        if (u.position && u.position.name_position) return u.position.name_position;
        const position = (optionsData.positions || []).find(p => String(p.id) === String(u.position_id));
        return position ? position.name_position : 'N/A';
    };

    const getCostCenterCode = (u) => {
        if (u.cost_center && u.cost_center.id) return u.cost_center.id;
        if (u.costCenter && u.costCenter.id) return u.costCenter.id;
        const cc = (optionsData.cost_centers || []).find(c => String(c.id) === String(u.cost_center_id));
        return cc ? cc.id : 'N/A';
    };

    return (
        <AuthenticatedLayout title="Gestión de Usuarios">
            <div className="p-4 sm:p-8 max-w-[95%] mx-auto font-sans">
                
                {/* Cabecera */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                                <UserGroupIcon className="w-8 h-8 text-slate-700" />
                            </div>
                            Directorio Corporativo
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">Administra los accesos y perfiles de la organización.</p>
                    </div>
                    
                    <button 
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-5 py-3 text-white rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all active:scale-95 font-bold"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        <PlusIcon className="w-5 h-5 stroke-2" />
                        Añadir Usuario
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    
                    {/* Filtros */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <form onSubmit={handleSearch} className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex-1 relative group">
                                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Buscar por nombre o correo..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium placeholder-slate-400 shadow-sm"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button type="submit" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold text-sm">
                                        Filtrar
                                    </button>
                                    {(searchTerm || selectedRole || selectedCompany || selectedRegional || selectedCostCenter) && (
                                        <button type="button" onClick={resetFilters} className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm flex items-center gap-2" title="Limpiar filtros">
                                            <ArrowPathIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full px-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium appearance-none shadow-sm">
                                        <option value="">Todos los Roles</option>
                                        {(optionsData.roles || []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="w-full px-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium appearance-none shadow-sm">
                                        <option value="">Todas las Compañías</option>
                                        {(optionsData.companies || []).map(c => <option key={c.id} value={c.id}>{c.name_company}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <select value={selectedRegional} onChange={(e) => setSelectedRegional(e.target.value)} className="w-full px-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium appearance-none shadow-sm">
                                        <option value="">Todas las Regionales</option>
                                        {(optionsData.regionals || []).map(r => <option key={r.id} value={r.id}>{r.name_regional}</option>)}
                                    </select>
                                </div>
                                <div className="relative">
                                    <select value={selectedCostCenter} onChange={(e) => setSelectedCostCenter(e.target.value)} className="w-full px-4 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm font-medium appearance-none shadow-sm">
                                        <option value="">Todos los C. Costos</option>
                                        {(optionsData.cost_centers || []).map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
                                    </select>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-[rgba(5,25,49)] mb-4"></div>
                                <p className="text-slate-500 font-medium">Cargando directorio...</p>
                            </div>
                        ) : safeUsers.length === 0 ? (
                            <div className="text-center p-20">
                                <UserGroupIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-700">No se encontraron usuarios</h3>
                                <p className="text-slate-500 mt-1">Intenta ajustando los filtros de búsqueda.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 uppercase text-xs font-extrabold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Contacto</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">Regional</th>
                                        <th className="px-6 py-4">Cargo</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {safeUsers.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
                                                    {u.name_user} {u.last_name_user}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600 font-medium text-xs truncate max-w-[150px]">{u.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md text-[11px]">
                                                    {getRoleName(u)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600 font-medium text-xs truncate max-w-[120px]">
                                                    {getRegionalName(u)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-600 font-medium text-xs truncate max-w-[120px]">
                                                    {getPositionName(u)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => setViewingUser(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Ver detalles">
                                                        <InformationCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => openEditModal(u)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Editar">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Eliminar">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-medium text-slate-500">
                            Mostrando <span className="font-bold text-slate-800">{safeUsers.length}</span> resultados
                            {pagination?.total ? ` de ${pagination.total}` : ''}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <button 
                                disabled={!pagination?.prev_page_url} 
                                onClick={() => fetchUsers(pagination.prev_page_url)} 
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
                            >
                                Anterior
                            </button>
                            <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                                Página {pagination?.current_page || 1} <span className="text-slate-300 mx-1">/</span> {pagination?.last_page || 1}
                            </div>
                            <button 
                                disabled={!pagination?.next_page_url} 
                                onClick={() => fetchUsers(pagination.next_page_url)} 
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50 transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <UserFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                userToEdit={editingUser} 
                onSave={saveUser} 
                selectOptions={selectOptions} 
                isLoadingOptions={optionsLoading} 
            />
            
            <UserDetailsModal 
                isOpen={!!viewingUser} 
                onClose={() => setViewingUser(null)} 
                user={viewingUser} 
                getRoleName={getRoleName}
                getCompanyName={getCompanyName}
                getRegionalName={getRegionalName}
                getPositionName={getPositionName}
                getCostCenterCode={getCostCenterCode}
            />
        </AuthenticatedLayout>
    );
}