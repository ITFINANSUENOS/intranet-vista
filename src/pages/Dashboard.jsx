import React, { useState, useEffect } from 'react';
import AuthenticatedLayout from '../layouts/AuthenticatedLayout';
import { useAuth } from '../context/AuthContext';
import { 
    UsersIcon, DocumentTextIcon, CubeIcon, ChartBarIcon, 
    BriefcaseIcon, TrophyIcon, MegaphoneIcon, CakeIcon, 
    CalendarIcon, CurrencyDollarIcon, PlayIcon, SparklesIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

// -------------------------------------------------------------------------------------
// --- Lógica de Carga de Datos (Simulada) ---
const fetchData = async () => {
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return {
        stats: {
            users: "1,245",
            inventoryCount: "256",
            inventoryValue: "$85,000", 
            documents: "89",
            salesToday: "$5,120",
        },
        news: [
            { id: 1, headline: "¡Nuevo Cliente Mayor!", summary: "Hemos cerrado un acuerdo estratégico con 'Global Corp' para los próximos 3 años.", date: "15 Nov 2025" },
            { id: 2, headline: "Capacitación en React", summary: "Próxima sesión de entrenamiento en React y Tailwind CSS el 2 de Diciembre.", date: "20 Nov 2025" },
        ],
        birthdays: [
            { name: "Ana P. (Ventas)", date: "28 Nov" },
            { name: "Juan M. (IT)", date: "3 Dic" },
        ],
        events: [
            { title: "Reunión General de Fin de Mes", date: "29 Nov", time: "10:00 AM" },
            { title: "Almuerzo de Equipo", date: "6 Dic", time: "1:00 PM" },
        ],
        infoImages: [
            { id: 1, src: 'https://via.placeholder.com/300x150/06b6d4/ffffff?text=Proyecto+X', alt: 'Cronograma del Proyecto', caption: 'Revisa el nuevo cronograma del proyecto X.' },
            { id: 2, src: 'https://via.placeholder.com/300x150/10b981/ffffff?text=Políticas+RRHH', alt: 'Políticas de RRHH', caption: 'Actualización de políticas internas. ¡Léelas!' },
            { id: 3, src: 'https://via.placeholder.com/300x150/6366f1/ffffff?text=Ventas+Q4', alt: 'Resultados de Ventas', caption: 'Ventas del Q4: ¡Hemos superado las expectativas!' },
            { id: 4, src: 'https://via.placeholder.com/300x150/f59e0b/ffffff?text=Próxima+Meta', alt: 'Próxima Meta', caption: 'Nuevo objetivo de expansión de mercado para Enero.' },
            { id: 5, src: 'https://via.placeholder.com/300x150/ef4444/ffffff?text=TIPS+de+Productividad', alt: 'Tips de Productividad', caption: '5 claves para una semana laboral más eficiente.' },
        ]
    };
};

// -------------------------------------------------------------------------------------
// --- Componentes Auxiliares (Estilo Minimalista) ---

const VideoHero = () => (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative bg-white rounded-xl overflow-hidden shadow-md h-64 md:h-96 w-full group cursor-pointer border border-gray-100"
    >
        <div className="absolute inset-0 bg-gray-100 rounded-xl overflow-hidden">
           <video
                autoPlay loop muted playsInline 
                className="w-full h-full object-cover opacity-80"
            >
                <source src="/videos/intranet-bg.mp4" type="video/mp4" />
                Tu navegador no soporta la etiqueta de video.
            </video>
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="p-5 rounded-full bg-white/70 backdrop-blur-sm text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 transform"
                >
                    <PlayIcon className="w-10 h-10" />
                </motion.div>
            </div>
            <p className="absolute bottom-4 left-6 text-gray-500 text-sm font-light italic">Mensaje de bienvenida y visión.</p>
        </div>
    </motion.div>
);

const UserRoleSection = ({ role, company }) => (
    <motion.div 
        whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)" }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer" 
    >
        <div className="flex items-center space-x-3 text-cyan-600 mb-4 border-b border-gray-100 pb-2">
            <BriefcaseIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Mi Puesto</h2>
        </div>
        <div className="space-y-3 pt-2">
            <div className="p-3 bg-cyan-50 rounded-lg">
                <p className="text-gray-700">
                    <span className="font-semibold text-cyan-700">Puesto:</span> {role || "No asignado"}
                </p>
                <p className="text-gray-700 mt-1">
                    <span className="font-semibold text-cyan-700">Empresa:</span> {company || "N/A"}
                </p>
            </div>
        </div>
    </motion.div>
);

const NewsCarousel = ({ news }) => {
    return (
        <motion.div 
            whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)" }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer" 
        >
            <div className="flex items-center space-x-3 text-red-600 mb-4 border-b border-gray-100 pb-2">
                <MegaphoneIcon className="w-6 h-6" />
                <h2 className="text-xl font-semibold text-gray-800">Noticias</h2>
            </div>
            <div className="space-y-4 pt-2">
                {news.slice(0, 2).map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-lg border-l-4 border-red-300 hover:bg-red-50 transition-colors">
                        <h4 className="font-bold text-gray-800">{item.headline}</h4>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.summary}</p>
                        <span className="text-xs text-gray-400 mt-2 block">{item.date}</span>
                    </div>
                ))}
            </div>
            <p className="text-right text-sm text-red-600 mt-4 cursor-pointer hover:text-red-800 font-medium">Ver todas &rarr;</p>
        </motion.div>
    );
};

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <motion.div 
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 transform cursor-pointer"
    >
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
            <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
);

const ImageCarousel = ({ images }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1));
        }, 5000); 
        return () => clearInterval(interval);
    }, []);

    const itemWidth = 33.33; 
    const transformX = -(currentIndex * itemWidth);
    const carouselImages = [...images, ...images]; 

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer"
        >
            <div className="flex items-center space-x-3 text-indigo-600 mb-4 border-b border-gray-100 pb-2">
                <ChartBarIcon className="w-6 h-6" /> 
                <h2 className="text-xl font-semibold text-gray-800">Información Visual</h2>
            </div>
            
            <div className="flex overflow-hidden relative">
                <motion.div
                    animate={{ x: `${transformX}%` }}
                    transition={{ type: 'tween', duration: 0.8 }} 
                    onAnimationComplete={() => {
                        if (currentIndex >= images.length) {
                            setCurrentIndex(0); 
                        }
                    }}
                    className="flex space-x-6 pb-2"
                    style={{ width: `${carouselImages.length * itemWidth}%` }}
                >
                    {carouselImages.map((image, index) => (
                        <div 
                            key={index}
                            style={{ flexShrink: 0, width: `${itemWidth}%` }}
                            className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 hover:shadow-md transition-shadow"
                        >
                            <img src={image.src} alt={image.alt} className="w-full h-28 object-cover" />
                            <div className="p-3">
                                <p className="text-sm font-medium text-gray-700 line-clamp-2">{image.caption}</p>
                            </div>
                        </div>
                    ))} 
                </motion.div>
            </div>
        </motion.div>
    );
};

const BirthdayCalendar = ({ birthdays }) => (
    <motion.div 
        whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)" }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer" 
    >
        <div className="flex items-center space-x-3 text-pink-600 mb-4 border-b border-gray-100 pb-2">
            <CakeIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Cumpleaños</h2>
        </div>
        <ul className="space-y-2 pt-2">
            {birthdays.map((person, index) => (
                <li key={index} className="flex justify-between items-center text-gray-700 p-2 bg-pink-50 rounded-md hover:bg-pink-100 transition-colors">
                    <span className="flex items-center"><SparklesIcon className="w-4 h-4 mr-2 text-pink-500"/>{person.name}</span>
                    <span className="font-medium text-pink-600 text-sm">{person.date}</span>
                </li>
            ))}
            {birthdays.length === 0 && <p className="text-gray-500 italic">¡Nadie cumple años este mes!</p>}
        </ul>
    </motion.div>
);

const MonthlyEvents = ({ events }) => (
    <motion.div 
        whileHover={{ y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)" }}
        transition={{ type: "spring", stiffness: 300 }}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer" 
    >
        <div className="flex items-center space-x-3 text-emerald-600 mb-4 border-b border-gray-100 pb-2">
            <CalendarIcon className="w-6 h-6" />
            <h2 className="text-xl font-semibold text-gray-800">Eventos</h2>
        </div>
        <ul className="space-y-2 pt-2">
            {events.map((event, index) => (
                <li key={index} className="p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                    <h4 className="font-semibold text-gray-800">{event.title}</h4>
                    <p className="text-sm text-gray-600">{event.date} - <span className="font-bold text-emerald-600">{event.time}</span></p>
                </li>
            ))}
            {events.length === 0 && <p className="text-gray-500 italic">No hay eventos programados.</p>}
        </ul>
    </motion.div>
);


// -------------------------------------------------------------------------------------
// --- Componente Principal DASHBOARD ---

export default function Dashboard() {
    const { user } = useAuth();
    
    const [dashboardData, setDashboardData] = useState({
        stats: {},
        news: [],
        birthdays: [],
        events: [],
        infoImages: [],
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchData(); 
                setDashboardData(data);
            } catch (error) {
                console.error("Error al cargar datos del dashboard:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []); 

    const mockUserData = {
        role: "Gerente de Proyectos",
        company: "Innovación Digital S.A.S."
    };
    const userData = { ...user, ...mockUserData }; 
    
    const { stats, news, birthdays, events, infoImages } = dashboardData;

    if (isLoading) {
        return (
            <AuthenticatedLayout title="Dashboard Principal">
                <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center text-gray-600">
                    <div className="flex flex-col items-center">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                            className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"
                        ></motion.div>
                        <p className="text-lg font-light animate-pulse">Cargando información...</p>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }
    
    return (
        <AuthenticatedLayout title="Dashboard Principal">
            {/* [SOLUCIÓN]: 'w-full' para asegurar el ancho correcto dentro del layout fijo */}
            <div className="w-full p-6 md:p-12"> 
                <div className="space-y-12 max-w-7xl mx-auto">
                    
                    {/* 1. Bienvenida y Video */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-6"
                    >
                        {/* Tarjeta de Bienvenida */}
                        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">
                                ¡Hola, {userData?.name || userData?.name_user || 'Usuario'}!
                            </h1>
                            <p className="text-gray-500 mt-2 text-lg">
                                Tu resumen ejecutivo.
                            </p>
                            <div className="mt-4 flex items-center text-base font-semibold text-gray-700">
                                <div className="flex items-center text-indigo-600">
                                    <BriefcaseIcon className="w-5 h-5 mr-2" />
                                    <span className="font-normal">**Rol:** {userData.role}</span>
                                </div>
                            </div>
                        </div>

                        {/* Video de Bienvenida */}
                        <VideoHero />
                    </motion.div>

                    {/* 2. Estadísticas (Fila 2) */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <StatCard title="Usuarios Totales" value={stats.users} icon={UsersIcon} colorClass="text-indigo-600" />
                        <StatCard title="Inventario (Unidades)" value={stats.inventoryCount} icon={CubeIcon} colorClass="text-cyan-600" />
                        <StatCard title="Valor Inventario" value={stats.inventoryValue} icon={CurrencyDollarIcon} colorClass="text-emerald-600" />
                        <StatCard title="Documentos Activos" value={stats.documents} icon={DocumentTextIcon} colorClass="text-yellow-600" />
                        <StatCard title="Ventas Hoy" value={stats.salesToday} icon={ChartBarIcon} colorClass="text-red-600" />
                    </div>
                    
                    {/* 3. Carrusel de Imágenes (Fila 3) */}
                    <ImageCarousel images={infoImages} />
                    
                    {/* 4. Contenido Dinámico (Fila 4) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <UserRoleSection role={userData.role} company={userData.company} /> 
                        <NewsCarousel news={news} />
                    </div>

                    {/* Fila 5: Calendario y Eventos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BirthdayCalendar birthdays={birthdays} />
                        <MonthlyEvents events={events} />
                    </div>
                    
                </div>
            </div>
        </AuthenticatedLayout>
    );
}