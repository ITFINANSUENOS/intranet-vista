import React from 'react';
import { Link } from 'react-router-dom'; // Importación clave para SPA
import GuestLayout from '../layouts/GuestLayout'; // Ruta relativa corregida
import AreaCard from '../components/AreaCard'; // Ruta relativa corregida
import { FaChartLine, FaHandshake, FaMoneyBillWave, FaUsers, FaCalculator, FaBuilding, FaGlobe, FaBriefcase, FaCode, FaMapMarkerAlt } from 'react-icons/fa';

// --- DATOS SIMULADOS ---
const areas = [
    { title: 'Analistas Financieros', description: 'Ayuda a nuestros clientes a tomar decisiones financieras clave para su futuro.', icon: <FaChartLine /> },
    { title: 'Comercial', description: 'Sé la cara de la empresa. Atrae nuevos clientes y gestiona relaciones existentes.', icon: <FaHandshake /> },
    { title: 'Cartera', description: 'Garantiza la gestión eficiente de los activos crediticios y la salud financiera.', icon: <FaMoneyBillWave /> },
    { title: 'Tesorería', description: 'Maneja el flujo de caja, las inversiones y los recursos monetarios.', icon: <FaCalculator /> },
    { title: 'Talento Humano', description: 'Construye y desarrolla el equipo de trabajo. Fomenta el crecimiento.', icon: <FaUsers /> },
    { title: 'Nómina', description: 'Asegura el pago correcto y a tiempo de todos nuestros colaboradores.', icon: <FaBuilding /> },
];

const empresas = [
    { 
        name: 'Finansueños', 
        logoUrl: '/images/logos/finansuenos.png', // Asegúrate de que este archivo exista en public/
        websiteUrl: 'https://www.finansueños.com', 
        description: 'Unimos la tecnología financiera y la experiencia humana para ofrecer soluciones ágiles.' 
    },
    { 
        name: 'ElectroCréditos del Cauca', 
        logoUrl: '/images/logos/electrocreditos.jpg', 
        websiteUrl: 'https://electrocreditosdelcaucamuebles.com', 
        description: 'Entidad líder en la región, enfocada en microcréditos para emprendedores.' 
    },
];

const ciudadesActivas = ['Popayán', 'Cali', 'Pasto', 'Neiva', 'Manizales', 'Pereira', 'Armenia', 'Bogotá'];

const metricas = [
    { value: '15+', label: 'Años de Experiencia', icon: <FaBriefcase className="text-4xl text-yellow-300 mb-3" /> },
    { value: '250M', label: 'Créditos Aprobados (USD)', icon: <FaMoneyBillWave className="text-4xl text-yellow-300 mb-3" /> },
    { value: '1.2K', label: 'Colaboradores Activos', icon: <FaUsers className="text-4xl text-yellow-300 mb-3" /> },
    { value: '2', label: 'Empresas Aliadas', icon: <FaGlobe className="text-4xl text-yellow-300 mb-3" /> },
];

export default function Home() {
    // Header Image (Opcional: si GuestLayout lo usa)
    const headerImage = (
        <img 
            src="/images/header-logo.png" 
            alt="Logo Intranet" 
            className="h-10 w-auto transition duration-300 hover:scale-110" 
        />
    );

    return (
        <GuestLayout headerImage={headerImage}>
            
            {/* 1. SECCIÓN HERO */}
            <section className="relative bg-violet-900 text-white flex items-center justify-center p-20 min-h-[600px] overflow-hidden shadow-2xl">
                {/* Fondo */}
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-40" 
                    style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-violet-900 via-transparent to-violet-900"></div>
                </div>

                {/* Contenido */}
                <div className="relative z-10 text-center max-w-4xl">
                    <h1 className="text-8xl font-black leading-tight mb-6 text-yellow-300 drop-shadow-lg animate-fade-in-up"> 
                        PORTAL LABORAL
                    </h1>
                    <h2 className="text-3xl font-semibold uppercase tracking-widest text-pink-400 mb-4 animate-fade-in-up">
                        INTRANET CENTRALIZADA
                    </h2>
                    
                    <p className="text-xl mb-10 font-light opacity-90 max-w-2xl mx-auto animate-fade-in-up">
                        Descubre tu próximo paso. Conecta con el equipo, gestiona tus documentos y accede a la bolsa de empleo interna.
                    </p>
                    
                    {/* Botón SPA hacia el Login */}
                    <Link 
                        to="/login"
                        className="inline-block bg-red-600 text-white py-4 px-16 text-2xl font-bold rounded-full 
                                   shadow-2xl hover:bg-red-700 transition duration-300 transform hover:scale-105 
                                   ring-4 ring-red-400/50 hover:ring-red-400 animate-pulse"
                    >
                        Acceso Rápido al Empleo
                    </Link>
                </div>
            </section>
            
            <hr className="border-gray-300" />
            
            {/* 4. SECCIÓN DE MÉTRICAS */}
            <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h3 className="text-2xl font-bold text-gray-700 text-center mb-10">Nuestro Impacto en Cifras</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {metricas.map((metric, index) => (
                            <div key={index} className="p-6 bg-white rounded-xl shadow-lg border-t-4 border-violet-600 transform hover:scale-105 transition duration-300">
                                <div className="flex justify-center">{metric.icon}</div>
                                <p className="text-4xl font-extrabold text-violet-900 mb-1">{metric.value}</p>
                                <p className="text-md font-medium text-gray-500">{metric.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            <hr className="border-gray-300" />
            
            {/* 2. SECCIÓN ÁREAS CLAVE */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-800 text-center mb-14">
                        <span className="border-b-4 border-yellow-400 pb-1">Tu Carrera Comienza Aquí</span> 
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {areas.map((area, index) => (
                            <div key={index} className="transition duration-500 ease-in-out transform hover:-translate-y-2 hover:shadow-2xl">
                                <AreaCard 
                                    title={area.title} 
                                    description={area.description} 
                                    icon={area.icon} 
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* 5. SECCIÓN DE CULTURA (Link interno corregido) */}
            <section className="bg-red-600 py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center text-white">
                    <FaCode className="text-6xl mx-auto mb-4 text-yellow-300" />
                    <h2 className="text-4xl font-black mb-4">¡Tecnología y Talento de la Mano!</h2>
                    <p className="text-xl font-light mb-8 opacity-90">
                        Nuestras empresas apuestan por la **innovación**. Únete a un ambiente que fomenta el aprendizaje continuo.
                    </p>
                    <Link 
                        to="/about" 
                        className="inline-block bg-violet-900 text-white py-3 px-8 text-lg font-bold rounded-full 
                                   shadow-lg hover:bg-violet-800 transition duration-300 transform hover:scale-105"
                    >
                        Conoce Nuestra Cultura
                    </Link>
                </div>
            </section>

            {/* 3. SECCIÓN EMPRESAS Y CIUDADES */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-gray-800 text-center mb-14">
                        <span className="border-b-4 border-yellow-400 pb-1">Nuestra Red de Aliados</span> 
                    </h2>
                    
                    <div className="flex flex-wrap justify-center gap-8 mb-16">
                        {empresas.map((empresa, index) => (
                            <a 
                                key={index} 
                                href={empresa.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full sm:w-[80%] lg:w-[45%] min-w-[300px] p-6 bg-white 
                                           rounded-xl shadow-lg border-t-4 border-red-500 
                                           text-center hover:shadow-2xl transition duration-300 transform hover:scale-[1.02]"
                            >
                                <img 
                                    src={empresa.logoUrl} 
                                    alt={`Logo de ${empresa.name}`}
                                    className="h-16 mx-auto mb-4 object-contain"
                                />
                                <h4 className="text-2xl font-bold text-violet-900 mb-2">{empresa.name}</h4>
                                <p className="text-gray-600 mb-4">{empresa.description}</p>
                                <span className="text-red-500 font-semibold text-sm hover:underline">
                                    Visitar sitio web &rarr;
                                </span>
                            </a>
                        ))}
                    </div>

                    <hr className="border-red-300 my-10" />

                    <div className="text-center">
                        <h3 className="text-3xl font-bold text-gray-800 mb-8 flex items-center justify-center">
                            <FaMapMarkerAlt className="text-red-500 mr-3" />
                            Ciudades donde estamos activos
                        </h3>
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            {ciudadesActivas.map((ciudad, index) => (
                                <span key={index} className="bg-violet-100 text-violet-800 text-lg font-semibold px-4 py-2 rounded-full shadow-md hover:bg-violet-200 transition duration-200">
                                    {ciudad}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </GuestLayout>
    );
}