import React, { useState, useEffect, useCallback } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaSpinner, FaMapMarkerAlt, FaHashtag } from 'react-icons/fa';

// ===============================================
// CLASES DE ESTILO
// ===============================================

// Color principal: rgba(5, 25, 49)
const ACCENT_COLOR_CLASS = 'text-[rgba(5,25,49)]'; 
const ACCENT_BG_CLASS = 'bg-[rgba(5,25,49)]';
const ACCENT_HOVER_BG_CLASS = 'hover:bg-gray-800'; 

// Clase para errores llamativos: Rojo fuerte, texto blanco, sombra (para el error de la vista principal)
const ERROR_CLASS_MAIN = 'p-4 font-bold text-white bg-red-700 rounded-lg shadow-xl border-2 border-red-800';
// Clase para errores del modal (más discreto, pero aún visible)
const ERROR_CLASS_MODAL = 'p-3 font-semibold text-red-800 bg-red-100 rounded-lg border border-red-300'; 


export default function CostCenterPage() {
    const { apiClient } = useAuth();
    const [costCenters, setCostCenters] = useState([]);
    const [regionals, setRegionals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // isEditingMode nos ayuda a saber si estamos editando, independientemente del valor del ID en el form
    const [isEditingMode, setIsEditingMode] = useState(false); 
    const [originalId, setOriginalId] = useState(null); // Guardamos el ID original para la URL del PUT

    const [formData, setFormData] = useState({ 
        id: '', 
        cost_center_name: '', 
        regional_id: '' 
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modalError, setModalError] = useState(null);

    // --- Carga de Datos ---
    const fetchCostCenters = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get('/cost-centers');
            setCostCenters(response.data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar datos.");
        } finally {
            setLoading(false);
        }
    }, [apiClient]);

    const fetchRegionals = useCallback(async () => {
        try {
            const response = await apiClient.get('/regionals');
            // Nota: Aquí se asume que la respuesta es un array de regionales, ajustar si es necesario (ej: response.data.data)
            setRegionals(response.data); 
        } catch (err) { 
            console.error(err); 
        }
    }, [apiClient]);

    useEffect(() => {
        fetchCostCenters();
        fetchRegionals();
    }, [fetchCostCenters, fetchRegionals]);

    // --- Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const openCreateModal = () => {
        setFormData({ id: '', cost_center_name: '', regional_id: '' });
        setIsEditingMode(false);
        setOriginalId(null);
        setModalError(null);
        setIsModalOpen(true);
    };

    const openEditModal = (center) => {
        setFormData({
            id: center.id,
            cost_center_name: center.cost_center_name,
            regional_id: center.regional_id
        });
        setIsEditingMode(true);
        setOriginalId(center.id); // Guardamos el ID original para saber a cuál hacer update
        setModalError(null);
        setIsModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError(null);

        // Si estamos editando usamos el originalId para la ruta, si no, es post a la raíz
        const url = isEditingMode ? `/cost-centers/${originalId}` : `/cost-centers`;
        const method = isEditingMode ? 'put' : 'post';
        
        try {
            await apiClient[method](url, formData);
            setIsModalOpen(false);
            fetchCostCenters();
        } catch (err) {
            const message = err.response?.data?.message || "Error al guardar.";
            if (err.response?.data?.errors) {
                // Muestra errores detallados (ej: ID duplicado)
                const validationErrors = Object.values(err.response.data.errors).flat().join(' | ');
                setModalError(`Errores de validación: ${validationErrors}`);
            } else {
                setModalError(message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Eliminar este Centro de Costo?")) return;
        try {
            await apiClient.delete(`/cost-centers/${id}`);
            fetchCostCenters();
        } catch (err) { alert("Error al eliminar."); }
    };

    // --- Render ---
    if (loading && costCenters.length === 0) return <div className="p-8"><FaSpinner className="animate-spin" /> Cargando...</div>;

    return (
        <AuthenticatedLayout title="Gestión de Centros de Costo">
            <div className="p-8">
                <div className="flex justify-end mb-6">
                    {/* BOTÓN PRINCIPAL CON COLOR DE ACENTO */}
                    <button 
                        onClick={openCreateModal} 
                        className={`${ACCENT_BG_CLASS} text-white px-4 py-2 rounded-lg shadow ${ACCENT_HOVER_BG_CLASS} flex items-center transition`}
                    >
                        <FaPlus className="mr-2" /> Nuevo Centro
                    </button>
                </div>

                {/* MENSAJE DE ERROR LLAMATIVO EN LA VISTA PRINCIPAL */}
                {error && <div className={ERROR_CLASS_MAIN}>🚨 {error}</div>}
                
                <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* ENCABEZADOS DE TABLA CON COLOR DE ACENTO */}
                                <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase`}>ID / Código</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase`}>Nombre</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase`}>Regional</th>
                                <th className={`px-6 py-3 text-left text-xs font-medium ${ACCENT_COLOR_CLASS} uppercase`}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {costCenters.map((center) => (
                                <tr key={center.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-900">{center.id}</td>
                                    <td className="px-6 py-4 text-gray-700">{center.cost_center_name}</td>
                                    <td className="px-6 py-4 text-gray-700">{center.regional?.name_regional || 'N/A'}</td>
                                    <td className="px-6 py-4 flex gap-3">
                                        {/* BOTONES DE ACCIÓN (Mantenemos índigo/rojo por contraste sobre fondo blanco) */}
                                        <button onClick={() => openEditModal(center)} className="text-indigo-600 hover:text-indigo-900 transition"><FaEdit /></button>
                                        <button onClick={() => handleDelete(center.id)} className="text-red-600 hover:text-red-900 transition"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                        {/* TÍTULO DEL MODAL CON COLOR DE ACENTO */}
                        <h3 className={`text-xl font-semibold mb-4 border-b pb-2 ${ACCENT_COLOR_CLASS}`}>
                            {isEditingMode ? 'Editar Centro de Costo' : 'Crear Nuevo Centro'}
                        </h3>
                        
                        {/* MENSAJE DE ERROR LLAMATIVO EN EL MODAL */}
                        {modalError && <div className={ERROR_CLASS_MODAL}>{modalError}</div>}

                        <form onSubmit={handleSave}>
                            {/* CAMPO ID */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">ID / Código</label>
                                <div className="flex items-center border rounded shadow-sm">
                                    <div className="pl-3 text-gray-500"><FaHashtag /></div>
                                    <input
                                        type="text" 
                                        name="id"
                                        value={formData.id}
                                        onChange={handleInputChange}
                                        disabled={isEditingMode} 
                                        className={`w-full py-2 px-3 focus:outline-none ${isEditingMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                        placeholder="Ej: 1050 o CC-01"
                                        required
                                    />
                                </div>
                                {isEditingMode && <p className="text-xs text-gray-500 mt-1">El ID no se puede modificar una vez creado.</p>}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Nombre</label>
                                <input
                                    type="text"
                                    name="cost_center_name"
                                    value={formData.cost_center_name}
                                    onChange={handleInputChange}
                                    className="shadow border rounded w-full py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Regional</label>
                                <div className="flex items-center border rounded shadow-sm">
                                    <div className="pl-3 text-gray-500"><FaMapMarkerAlt /></div>
                                    <select
                                        name="regional_id"
                                        value={formData.regional_id}
                                        onChange={handleInputChange}
                                        className="w-full py-2 px-3 focus:outline-none bg-transparent"
                                        required
                                    >
                                        <option value="">Selecciona una Regional...</option>
                                        {regionals.map(r => (
                                            <option key={r.id} value={r.id}>
                                                {r.name_regional} - {r.ubication_regional}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancelar</button>
                                {/* BOTÓN DE GUARDAR CON COLOR DE ACENTO */}
                                <button type="submit" disabled={isSubmitting} className={`${ACCENT_BG_CLASS} text-white px-4 py-2 rounded ${ACCENT_HOVER_BG_CLASS} flex items-center transition`}>
                                    {isSubmitting && <FaSpinner className="animate-spin mr-2" />}
                                    {isEditingMode ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}