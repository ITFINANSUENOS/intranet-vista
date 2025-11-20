import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'; // O layouts/AuthenticatedLayout
import { useAuth } from '../context/AuthContext';
import { UsersIcon, DocumentTextIcon, CubeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

// ... StatCard, GoalCard y demás componentes auxiliares se quedan igual ...
// Solo asegúrate de copiarlos aquí o importarlos

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
            <Icon className={`w-8 h-8 ${colorClass}`} />
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
);

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <AuthenticatedLayout title="Dashboard Principal">
            <div className="space-y-8">
                {/* Bienvenida */}
                <div className="p-6 bg-white rounded-2xl shadow border-l-8 border-indigo-600">
                    <h1 className="text-2xl font-bold text-gray-800">
                        ¡Hola, {user?.name || user?.name_user}!
                    </h1>
                    <p className="text-gray-500">Resumen de actividades del sistema.</p>
                </div>

                {/* Estadísticas (Ejemplo estático) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Clientes" value="1,245" icon={UsersIcon} colorClass="text-green-500" />
                    <StatCard title="Inventario" value="256" icon={CubeIcon} colorClass="text-indigo-500" />
                    {/* Más cartas... */}
                </div>
                
                {/* Aquí iría el resto de tu UI de dashboard */}
            </div>
        </AuthenticatedLayout>
    );
}