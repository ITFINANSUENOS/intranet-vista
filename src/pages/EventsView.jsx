// src/views/EventsView.jsx
import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';

const ENDPOINT = '/events';
const PRIMARY_COLOR = 'rgba(5, 25, 49)'; 

export default function EventsView() {
    const { apiClient } = useAuth();

    const [events, setEvents] = useState([]);
    const [formData, setFormData] = useState({ 
        title_event: '',      
        description_event: '',
        event_date: '' 
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(ENDPOINT);
            setEvents(response.data);
        } catch (err) {
            // Este error puede saltar si la API deniega el acceso por falta de permisos
            setError('Error al cargar eventos. Verifique su rol y conexión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const resetForm = () => {
        setFormData({ 
            title_event: '', 
            description_event: '', 
            event_date: '' 
        }); 
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                title_event: formData.title_event,
                description_event: formData.description_event,
                event_date: formData.event_date
            };
            
            if (editingId) {
                await apiClient.put(`${ENDPOINT}/${editingId}`, dataToSend);
                alert('Evento actualizado exitosamente!');
            } else {
                await apiClient.post(ENDPOINT, dataToSend);
                alert('Evento creado exitosamente!');
            }
            resetForm();
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al guardar el evento.');
            console.error(err);
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        const date = new Date(event.event_date);
        const formattedDate = date.toISOString().slice(0, 16);
        setFormData({
            title_event: event.title_event,       
            description_event: event.description_event, 
            event_date: formattedDate,
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que quieres eliminar este evento?')) return;
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            alert('Evento eliminado!');
            fetchEvents();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar el evento.');
            console.error(err);
        }
    };

    return (
        <AuthenticatedLayout title="Gestión de Eventos">
            <div className="p-6">
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6">
                    {editingId ? '✍️ Editar Evento' : '✨ Crear Nuevo Evento'}
                </h3>
                
                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 shadow-md">¡Error! {error}</div>}

                {/* Formulario */}
                <form 
                    onSubmit={handleSubmit} 
                    className="bg-white p-8 rounded-xl shadow-2xl hover:shadow-3xl transition-shadow duration-500 mb-10 border border-gray-50/50"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Campo Título */}
                        <div className="md:col-span-1">
                            <label htmlFor="title_event" className="block text-sm font-medium text-gray-700 mb-1">Título del Evento</label>
                            <input 
                                id="title_event"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 placeholder-gray-400 shadow-sm" 
                                name="title_event" 
                                value={formData.title_event} 
                                onChange={handleChange} 
                                placeholder="Ej: Conferencia Anual de Tecnología" 
                                required 
                            />
                        </div>
                        
                        {/* Campo Fecha y Hora */}
                        <div className="md:col-span-1">
                            <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora del Evento</label>
                            <input 
                                id="event_date"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 shadow-sm" 
                                type="datetime-local" 
                                name="event_date" 
                                value={formData.event_date} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        
                        {/* Campo Descripción (Ocupa ambas columnas) */}
                        <div className="md:col-span-2">
                            <label htmlFor="description_event" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea 
                                id="description_event"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 placeholder-gray-400 shadow-sm" 
                                name="description_event" 
                                value={formData.description_event} 
                                onChange={handleChange} 
                                placeholder="Detalles importantes sobre el evento..."
                                rows="4"
                            ></textarea>
                        </div>
                    </div>
                    
                    {/* Botones de Acción */}
                    <div className="flex gap-4 pt-6 justify-end">
                        {editingId && (
                            <button 
                                type="button" 
                                onClick={resetForm} 
                                className="bg-gray-200 text-gray-700 py-3 px-6 rounded-full font-semibold hover:bg-gray-300 transition duration-300 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                            >
                                ❌ Cancelar
                            </button>
                        )}
                        <button 
                            type="submit" 
                            style={{ backgroundColor: PRIMARY_COLOR }} 
                            className="text-white py-3 px-8 rounded-full font-bold shadow-xl hover:shadow-2xl transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            {editingId ? '💾 Actualizar Evento' : '🚀 Crear Evento'}
                        </button>
                    </div>
                </form>

                <hr className="my-8 border-t border-gray-200" /> 
                
                {/* Lista de Eventos */}
                <h3 className="text-2xl font-light text-gray-800 border-b pb-2 mb-6">
                    🗓️ Listado de Eventos
                </h3>
                {loading ? (
                    <p className="text-gray-500 py-10 text-center">Cargando eventos...</p>
                ) : (
                    <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100 overflow-x-auto">
                         <table className="min-w-full divide-y divide-gray-200">
                            <thead style={{ backgroundColor: PRIMARY_COLOR, color: 'white' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider rounded-tl-xl">Título</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Descripción</th>
                                    <th className="px-6 py-3 text-center rounded-tr-xl">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {events.map((event) => (
                                    <tr key={event.id} className="hover:bg-indigo-50/30 transition">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{event.title_event}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(event.event_date).toLocaleString()}</td>
                                        {/* CORRECCIÓN CRÍTICA PARA EVITAR TypeError */}
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {(event.description_event || '').substring(0, 50)}
                                            {(event.description_event || '').length > 50 ? '...' : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <button 
                                                onClick={() => handleEdit(event)} 
                                                className="text-indigo-600 hover:text-indigo-800 mr-3 font-medium transition duration-150"
                                                title="Editar Evento"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(event.id)} 
                                                className="text-red-600 hover:text-red-800 font-medium transition duration-150"
                                                title="Eliminar Evento"
                                            >
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}