import React, { useEffect, useState, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { 
    PencilIcon, TrashIcon, PlusIcon, XMarkIcon, 
    MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon, 
    InformationCircleIcon, UserGroupIcon, MapPinIcon, BriefcaseIcon
} from '@heroicons/react/24/outline'; 

const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 
const ACCENT_COLOR = '#3b82f6';
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-50 rounded-lg border border-red-200 flex items-center gap-2'; 

// ===============================================
// 1. MODAL DE FORMULARIO (CREAR/EDITAR)
// ===============================================
const UserFormModal = ({ isOpen, onClose, userToEdit, onSave, selectOptions, isLoadingOptions }) => {
    if (!isOpen) return null;
    
    if (isLoadingOptions) return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4" style={{ borderColor: PRIMARY_COLOR, borderTopColor: 'transparent' }}></div>
                <p className="text-gray-600 font-medium">Cargando configuración...</p>
            </div>
        </div>
    );

    const isEditing = !!userToEdit;
    const { apiClient } = useAuth();
    const { roles, companies, regionals, positions, costCenters } = selectOptions;
    const [filteredCostCenters, setFilteredCostCenters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
        company_id: '', regional_id: '', position_id: '', cost_center_id: '',
        password: '', confirm_password: '', role_name: ''
    });

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                ...userToEdit,
                birthdate: userToEdit.birthdate?.split('T')[0] || '',
                password: '', confirm_password: '',
                role_name: userToEdit.roles?.[0]?.name || roles[0]?.name || ''
            });
        } else {
            setFormData({
                name_user: '', last_name_user: '', birthdate: '', email: '', number_document: '',
                company_id: companies[0]?.id || '', regional_id: regionals[0]?.id || '',
                position_id: positions[0]?.id || '', cost_center_id: '',
                password: '', confirm_password: '', role_name: roles[0]?.name || ''
            });
        }
    }, [userToEdit, isOpen, roles, companies, regionals, positions]);

    useEffect(() => {
        const regId = parseInt(formData.regional_id);
        setFilteredCostCenters(costCenters.filter(cc => cc.regional_id === regId));
    }, [formData.regional_id, costCenters]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (formData.password !== formData.confirm_password) return setError("Las contraseñas no coinciden");
        
        setLoading(true);
        try {
            if (isEditing) {
                await apiClient.put(`/users/${userToEdit.id}`, formData);
            } else {
                await apiClient.post('/users', formData);
            }
            onSave();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Ocurrió un error al procesar la solicitud");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">
                            {isEditing ? 'Actualizar Colaborador' : 'Registrar Nuevo Colaborador'}
                        </h3>
                        <p className="text-sm text-gray-500">Complete la información técnica y personal.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    {error && <div className={ERROR_CLASS_MODAL}><InformationCircleIcon className="w-5 h-5"/> {error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <section className="space-y-4">
                            <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">Datos Personales</h4>
                            <input type="text" name="name_user" placeholder="Nombres" value={formData.name_user} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                            <input type="text" name="last_name_user" placeholder="Apellidos" value={formData.last_name_user} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                            <input type="email" name="email" placeholder="Correo Electrónico" value={formData.email} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                            <input type="text" name="number_document" placeholder="Documento de Identidad" value={formData.number_document} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                        </section>

                        <section className="space-y-4">
                            <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">Asignación Laboral</h4>
                            <select name="company_id" value={formData.company_id} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                                <option value="">Seleccione Empresa</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name_company || c.name}</option>)}
                            </select>
                            <select name="regional_id" value={formData.regional_id} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                                <option value="">Seleccione Regional</option>
                                {regionals.map(r => <option key={r.id} value={r.id}>{r.name_regional || r.name}</option>)}
                            </select>
                            <select name="cost_center_id" value={formData.cost_center_id} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                                <option value="">Sin Centro de Costo</option>
                                {filteredCostCenters.map(cc => <option key={cc.id} value={cc.id}>{cc.cost_center_name || cc.name}</option>)}
                            </select>
                            <select name="position_id" value={formData.position_id} onChange={handleChange} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                                <option value="">Seleccione Cargo</option>
                                {positions.map(p => <option key={p.id} value={p.id}>{p.name_position || p.name}</option>)}
                            </select>
                        </section>

                        <section className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                            <div className="md:col-span-3"><h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">Seguridad y Acceso</h4></div>
                            <select name="role_name" value={formData.role_name} onChange={handleChange} className="p-2.5 border rounded-lg bg-white" required>
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                            </select>
                            <input type="password" name="password" placeholder="Nueva Contraseña" onChange={handleChange} className="p-2.5 border rounded-lg bg-white" required={!isEditing} />
                            <input type="password" name="confirm_password" placeholder="Repetir Contraseña" onChange={handleChange} className="p-2.5 border rounded-lg bg-white" required={!isEditing} />
                        </section>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancelar</button>
                        <button type="submit" disabled={loading} className="flex-[2] py-3 text-white rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: PRIMARY_COLOR }}>
                            {loading ? 'Procesando...' : isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ===============================================
// 2. MODAL DE DETALLES (ESTILIZADO)
// ===============================================
const UserDetailsModal = ({ isOpen, onClose, user }) => {
    if (!isOpen || !user) return null;

    const InfoRow = ({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            {Icon && <Icon className="w-5 h-5 text-gray-400 mt-0.5" />}
            <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{label}</p>
                <p className="text-sm font-semibold text-gray-700">{value || 'No definido'}</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="relative h-24 bg-gradient-to-r from-slate-800 to-slate-900" style={{ backgroundColor: PRIMARY_COLOR }}>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white"><XMarkIcon className="w-6 h-6" /></button>
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center border-4 border-white">
                            <UserGroupIcon className="w-10 h-10 text-slate-400" />
                        </div>
                    </div>
                </div>
                
                <div className="pt-12 p-6">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-gray-800">{user.name_user} {user.last_name_user}</h3>
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                            {user.roles?.[0]?.name || 'Usuario'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1">
                        <InfoRow label="Correo Electrónico" value={user.email} />
                        <InfoRow label="Documento" value={user.number_document} />
                        <div className="h-px bg-gray-100 my-2"></div>
                        <InfoRow label="Empresa" value={user.company?.name_company} icon={BriefcaseIcon} />
                        <InfoRow label="Regional" value={user.regional?.name_regional} icon={MapPinIcon} />
                        <InfoRow label="Centro de Costo" value={user.cost_center?.cost_center_name} />
                        <InfoRow label="Cargo Actual" value={user.position?.name_position} icon={BriefcaseIcon} />
                    </div>

                    <button onClick={onClose} className="w-full mt-8 py-3 rounded-xl text-white font-bold transition-transform active:scale-95 shadow-md" style={{ backgroundColor: PRIMARY_COLOR }}>
                        Cerrar Detalle
                    </button>
                </div>
            </div>
        </div>
    );
};

// ===============================================
// 3. COMPONENTE PRINCIPAL
// ===============================================
export default function Users() {
    const { apiClient, logOut } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [viewingUser, setViewingUser] = useState(null);
    
    // Filtros ampliados
    const [filters, setFilters] = useState({ 
        search: '', 
        company_id: '', 
        regional_id: '', 
        position_id: '' 
    });

    const [selectOptions, setSelectOptions] = useState({ 
        roles: [], companies: [], regionals: [], positions: [], costCenters: [] 
    });
    const [optionsLoading, setOptionsLoading] = useState(false);

    const fetchOptions = useCallback(async () => {
        setOptionsLoading(true);
        try {
            const [c, r, p, ro, cc] = await Promise.all([
                apiClient.get('/companies'), apiClient.get('/regionals'),
                apiClient.get('/positions'), apiClient.get('/roles'), apiClient.get('/cost-centers')
            ]);
            setSelectOptions({
                companies: c.data.data || c.data, 
                regionals: r.data.data || r.data,
                positions: p.data.data || p.data, 
                roles: ro.data.data || ro.data,
                costCenters: cc.data.data || cc.data
            });
        } catch (e) { console.error("Error al cargar opciones:", e); }
        finally { setOptionsLoading(false); }
    }, [apiClient]);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, per_page: 10, ...filters });
            const res = await apiClient.get(`/users?${params.toString()}`);
            setUsers(res.data.data);
            setPagination({ 
                current_page: res.data.current_page, 
                last_page: res.data.last_page, 
                total: res.data.total 
            });
        } catch (e) {
            if (e.response?.status === 401) logOut();
            setError("Error al conectar con el servidor");
        } finally { setLoading(false); }
    }, [apiClient, filters, logOut]);

    useEffect(() => { 
        fetchUsers(); 
        fetchOptions(); 
    }, [fetchUsers, fetchOptions]);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Está seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;
        try {
            await apiClient.delete(`/users/${id}`);
            fetchUsers(pagination?.current_page || 1);
        } catch (e) { alert("Error al eliminar el registro."); }
    };

    const clearFilters = () => {
        setFilters({ search: '', company_id: '', regional_id: '', position_id: '' });
    };

    return (
        <AuthenticatedLayout title="Gestión de Usuarios">
            <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-800 uppercase">Colaboradores</h2>
                        <p className="text-slate-500 text-sm">Administre el acceso y la información de su equipo de trabajo.</p>
                    </div>
                    <button 
                        onClick={() => { setEditingUser(null); setIsModalOpen(true); }} 
                        className="flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] transition-all font-bold"
                        style={{ backgroundColor: PRIMARY_COLOR }}
                    >
                        <PlusIcon className="w-5 h-5" /> Nuevo Registro
                    </button>
                </div>

                {/* Filtros Estilizados */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="lg:col-span-1 space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Búsqueda Libre</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                            <input 
                                type="text" placeholder="Nombre, email..." 
                                value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} 
                                className="w-full pl-10 p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Regional</label>
                        <select 
                            value={filters.regional_id} 
                            onChange={e => setFilters({...filters, regional_id: e.target.value})} 
                            className="w-full p-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="">Todas las Regionales</option>
                            {selectOptions.regionals.map(r => <option key={r.id} value={r.id}>{r.name_regional || r.name}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Cargo / Puesto</label>
                        <select 
                            value={filters.position_id} 
                            onChange={e => setFilters({...filters, position_id: e.target.value})} 
                            className="w-full p-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        >
                            <option value="">Todos los Cargos</option>
                            {selectOptions.positions.map(p => <option key={p.id} value={p.id}>{p.name_position || p.name}</option>)}
                        </select>
                    </div>

                    <div className="lg:col-span-2 flex gap-2">
                        <button 
                            onClick={() => fetchUsers(1)} 
                            className="flex-1 flex items-center justify-center gap-2 text-white rounded-xl py-2.5 font-bold transition-all hover:shadow-md"
                            style={{ backgroundColor: PRIMARY_COLOR }}
                        >
                            <FunnelIcon className="w-4 h-4" /> Aplicar Filtros
                        </button>
                        <button 
                            onClick={clearFilters} 
                            className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all"
                            title="Limpiar"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Tabla de Usuarios */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-20 space-y-4">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-blue-600"></div>
                            <p className="text-slate-500 font-medium">Actualizando listado...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Colaborador</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Cargo & Ubicación</th>
                                        <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Rol Sistema</th>
                                        <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length > 0 ? users.map(u => (
                                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                        {u.name_user.charAt(0)}{u.last_name_user.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-800">{u.name_user} {u.last_name_user}</div>
                                                        <div className="text-xs text-slate-400 font-medium">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-slate-700">{u.position?.name_position || 'Sin Cargo'}</div>
                                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                                    <MapPinIcon className="w-3 h-3" /> {u.regional?.name_regional || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 text-[10px] font-black rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tighter">
                                                    {u.roles?.[0]?.name || 'User'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <button onClick={() => setViewingUser(u)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors" title="Ver Detalles">
                                                        <InformationCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDelete(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-slate-400 italic">No se encontraron usuarios con los filtros seleccionados.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* Paginación */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-500">
                        <div className="flex items-center gap-2">
                            Mostrando <span className="text-slate-800">{users.length}</span> de <span className="text-slate-800">{pagination?.total || 0}</span> colaboradores
                        </div>
                        <div className="flex items-center gap-1">
                            <button 
                                disabled={pagination?.current_page === 1} 
                                onClick={() => fetchUsers(pagination.current_page - 1)} 
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
                            >
                                Anterior
                            </button>
                            <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg">
                                Página {pagination?.current_page} <span className="text-slate-300 mx-1">/</span> {pagination?.last_page}
                            </div>
                            <button 
                                disabled={pagination?.current_page === pagination?.last_page} 
                                onClick={() => fetchUsers(pagination.current_page + 1)} 
                                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white disabled:opacity-40 hover:bg-slate-50"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            <UserFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                userToEdit={editingUser} 
                onSave={() => fetchUsers(pagination?.current_page || 1)} 
                selectOptions={selectOptions} 
                isLoadingOptions={optionsLoading} 
            />
            
            <UserDetailsModal 
                isOpen={!!viewingUser} 
                onClose={() => setViewingUser(null)} 
                user={viewingUser} 
            />
        </AuthenticatedLayout>
    );
}