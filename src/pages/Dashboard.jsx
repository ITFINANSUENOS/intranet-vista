import React from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { UsersIcon, DocumentTextIcon, CubeIcon, ChartBarIcon, BriefcaseIcon, TrophyIcon, MegaphoneIcon, CakeIcon, CalendarIcon } from '@heroicons/react/24/outline';

// --- Componentes Auxiliares (Simulados) ---

// Componente para mostrar los Objetivos de la Empresa
const GoalsSection = ({ goals }) => (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <div className="flex items-center space-x-3 text-indigo-600 mb-4">
            <TrophyIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Objetivos Estratégicos</h2>
        </div>
        <ul className="space-y-3">
            {goals.map((goal, index) => (
                <li key={index} className="p-3 bg-indigo-50/50 rounded-lg flex items-start space-x-3">
                    <span className="text-indigo-500 font-bold">{index + 1}.</span>
                    <p className="text-gray-700">
                        <span className="font-medium">{goal.title}:</span> {goal.description}
                    </p>
                </li>
            ))}
        </ul>
    </div>
);

// Componente para el Carrusel de Noticias de la Empresa
// NOTA: Para un carrusel funcional, necesitarías una librería como Flowbite React o un componente custom.
const NewsCarousel = ({ news }) => {
    // Implementación simple de un "carrusel" simulado como lista de tarjetas. 
    // Para un carrusel real de React/Tailwind, se requeriría lógica adicional (como el estado del slide, botones, etc.).
    // Referencia de componentes de carrusel: Flowbite React Carousel, DaisyUI
    return (
        <div className="bg-white p-6 rounded-2xl shadow border border-gray-100 overflow-hidden">
            <div className="flex items-center space-x-3 text-red-600 mb-4">
                <MegaphoneIcon className="w-6 h-6" />
                <h2 className="text-xl font-semibold text-gray-800">Noticias de la Empresa</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {news.slice(0, 2).map((item) => ( // Muestra solo las primeras 2 noticias para el ejemplo
                    <div key={item.id} className="p-4 bg-red-50/50 rounded-lg border-l-4 border-red-500">
                        <h4 className="font-semibold text-red-700">{item.headline}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.summary}</p>
                        <span className="text-xs text-gray-400 mt-2 block">{item.date}</span>
                    </div>
                ))}
            </div>
            <p className="text-right text-sm text-red-600 mt-4 cursor-pointer hover:text-red-800">Ver todas las noticias &rarr;</p>
        </div>
    );
};

// Componente para el Calendario de Cumpleaños
// NOTA: Este es un componente simulado. Un calendario real requeriría una librería (como React DayPicker o FullCalendar)
const BirthdayCalendar = ({ birthdays }) => (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <div className="flex items-center space-x-3 text-pink-600 mb-4">
            <CakeIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Cumpleaños del Mes</h2>
        </div>
        <ul className="space-y-2">
            {birthdays.map((person, index) => (
                <li key={index} className="flex justify-between items-center text-gray-700 border-b pb-1">
                    <span>{person.name}</span>
                    <span className="font-medium text-pink-500">{person.date}</span>
                </li>
            ))}
            {birthdays.length === 0 && <p className="text-gray-500 italic">¡Nadie cumple años este mes!</p>}
        </ul>
    </div>
);

// Componente para los Eventos del Mes
const MonthlyEvents = ({ events }) => (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <div className="flex items-center space-x-3 text-yellow-600 mb-4">
            <CalendarIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Eventos del Mes</h2>
        </div>
        <ul className="space-y-2">
            {events.map((event, index) => (
                <li key={index} className="p-3 bg-yellow-50/50 rounded-lg border-l-4 border-yellow-500">
                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.date} - {event.time}</p>
                </li>
            ))}
            {events.length === 0 && <p className="text-gray-500 italic">No hay eventos programados.</p>}
        </ul>
    </div>
);

// Componente original StatCard
const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow border border-gray-100">
        <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500 uppercase">{title}</h3>
            <Icon className={`w-8 h-8 ${colorClass}`} />
        </div>
        <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
);


// Datos simulados (deberían venir de una API real)
const mockUserData = {
    role: "Gerente de Proyectos",
    company: "Innovación Digital S.A.S."
};

const mockGoals = [
    { title: "Expansión de Mercado", description: "Aumentar la cuota de mercado en un 15% durante el próximo trimestre." },
    { title: "Optimización", description: "Reducir los costos operativos en un 5% para fin de año." },
];

const mockNews = [
    { id: 1, headline: "¡Nuevo Cliente Mayor!", summary: "Hemos cerrado un acuerdo estratégico con 'Global Corp' para los próximos 3 años.", date: "15 Nov 2025" },
    { id: 2, headline: "Capacitación en React", summary: "Próxima sesión de entrenamiento en React y Tailwind CSS el 2 de Diciembre.", date: "20 Nov 2025" },
];

const mockBirthdays = [
    { name: "Ana P. (Ventas)", date: "28 Nov" },
    { name: "Juan M. (IT)", date: "3 Dic" },
];

const mockEvents = [
    { title: "Reunión General de Fin de Mes", date: "29 Nov", time: "10:00 AM" },
    { title: "Almuerzo de Equipo", date: "6 Dic", time: "1:00 PM" },
];


export default function Dashboard() {
    const { user } = useAuth();
    const userData = { ...user, ...mockUserData }; // Combina el usuario logeado con los datos simulados de rol/empresa

    return (
        <AuthenticatedLayout title="Dashboard Principal">
            <div className="space-y-8">
                {/* Bienvenida y Datos de Usuario/Empresa */}
                <div className="p-6 bg-white rounded-2xl shadow border-l-8 border-indigo-600">
                    <h1 className="text-2xl font-bold text-gray-800">
                        ¡Hola, {userData?.name || userData?.name_user || 'Usuario'}!
                    </h1>
                    <p className="text-gray-500">
                        Resumen de actividades del sistema en **{userData.company}**.
                    </p>
                    <div className="mt-3 flex items-center space-x-4 text-sm font-medium text-gray-600">
                        <div className="flex items-center">
                            <BriefcaseIcon className="w-5 h-5 mr-2 text-indigo-500" />
                            <span>**Rol:** {userData.role}</span>
                        </div>
                    </div>
                </div>

                {/* Estadísticas (Ejemplo estático) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Clientes" value="1,245" icon={UsersIcon} colorClass="text-green-500" />
                    <StatCard title="Inventario" value="256" icon={CubeIcon} colorClass="text-indigo-500" />
                    <StatCard title="Documentos" value="89" icon={DocumentTextIcon} colorClass="text-blue-500" />
                    <StatCard title="Ventas Hoy" value="$5,120" icon={ChartBarIcon} colorClass="text-red-500" />
                </div>
                
                {/* Contenido Dinámico: Objetivos, Noticias, Cumpleaños y Eventos */}
                
                {/* Fila 1: Objetivos y Noticias */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <GoalsSection goals={mockGoals} />
                    <NewsCarousel news={mockNews} />
                </div>

                {/* Fila 2: Calendario y Eventos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BirthdayCalendar birthdays={mockBirthdays} />
                    <MonthlyEvents events={mockEvents} />
                </div>
                
            </div>
        </AuthenticatedLayout>
    );
}