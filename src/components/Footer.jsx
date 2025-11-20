import React from 'react';
// Usamos Link de react-router-dom para la navegación interna
import { Link } from 'react-router-dom'; 
// Importamos iconos de utilidad/sociales (Asegúrate de tener instalado react-icons)
import { FaFacebook, FaInstagram, FaYoutube, FaLinkedin, FaSearch, FaCogs, FaSitemap } from 'react-icons/fa'; 

// Sub-componente simple para los enlaces en el footer
// Cambiamos 'href' a 'to' para que funcione con Link de react-router-dom
const FooterLink = ({ to, children }) => (
    <li>
        <Link 
            to={to} 
            className="text-gray-400 hover:text-yellow-300 transition duration-200 ease-in-out text-sm block py-1"
        >
            {children}
        </Link>
    </li>
);

// Componente para los iconos de utilidad/sociales
const IconWrapper = ({ children }) => (
    <span 
        className="p-3 border border-violet-800 rounded-full text-lg cursor-pointer 
                   hover:bg-red-600 hover:text-white transition duration-300"
    >
        {children}
    </span>
);

export default function Footer() {
    return (
        // Fondo oscuro violeta/negro
        <footer className="bg-violet-950 text-white pt-12 pb-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* 1. Logo y Redes Sociales */}
                <div className="flex flex-col md:flex-row justify-between items-center border-b border-violet-800 pb-8 mb-8">
                    <span className="text-3xl font-black text-white tracking-widest border-l-8 border-red-600 pl-4 mb-4 md:mb-0">
                        INTRANET
                    </span>
                    
                    <div className="flex space-x-4">
                        <IconWrapper><FaFacebook /></IconWrapper>
                        <IconWrapper><FaInstagram /></IconWrapper>
                        <IconWrapper><FaYoutube /></IconWrapper>
                        <IconWrapper><FaLinkedin /></IconWrapper>
                    </div>
                </div>

                {/* 2. Columnas de Enlaces */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    
                    {/* Columna 1: Módulos Principales (Usando rutas de ejemplo) */}
                    <div>
                        <h4 className="text-white font-bold mb-4 border-b border-red-600 pb-1 inline-block">Módulos Principales</h4>
                        <ul className="space-y-1">
                            {/* Estas rutas pueden llevar a la vista de Login si no está autenticado */}
                            <FooterLink to="/dashboard">Dashboard</FooterLink>
                            <FooterLink to="/inventario">Inventario</FooterLink>
                            <FooterLink to="/cartera">Cartera</FooterLink>
                            <FooterLink to="/mesa_ayuda">Mesa de Ayuda</FooterLink>
                        </ul>
                    </div>
                    
                    {/* Columna 2: Herramientas (Usando rutas de ejemplo) */}
                    <div>
                        <h4 className="text-white font-bold mb-4 border-b border-red-600 pb-1 inline-block">Herramientas</h4>
                        <ul className="space-y-1">
                            <FooterLink to="/search"><FaSearch className="inline mr-2" />Buscador Global</FooterLink>
                            <FooterLink to="/config"><FaCogs className="inline mr-2" />Configuración</FooterLink>
                            <FooterLink to="/sitemap"><FaSitemap className="inline mr-2" />Mapa del Sitio</FooterLink>
                        </ul>
                    </div>

                    {/* Columna 3: Soporte (Usando rutas de ejemplo) */}
                    <div>
                        <h4 className="text-white font-bold mb-4 border-b border-red-600 pb-1 inline-block">Soporte</h4>
                        <ul className="space-y-1">
                            <FooterLink to="/manual">Manual de Usuario</FooterLink>
                            <FooterLink to="/contact">Contacto TI</FooterLink>
                            <FooterLink to="/faq">Preguntas Frecuentes</FooterLink>
                            <FooterLink to="/incident">Reportar un Incidente</FooterLink>
                        </ul>
                    </div>

                    {/* Columna 4: Legal y Ubicación (Usando rutas de ejemplo) */}
                    <div>
                        <h4 className="text-white font-bold mb-4 border-b border-red-600 pb-1 inline-block">Legal y Ubicación</h4>
                        <ul className="space-y-1">
                            <FooterLink to="/terms">Términos y Condiciones</FooterLink>
                            <FooterLink to="/privacy">Política de Privacidad</FooterLink>
                            <FooterLink to="/hr-contact">Contactar Talento Humano</FooterLink>
                            <FooterLink to="/offices">Sedes y Oficinas</FooterLink>
                        </ul>
                    </div>
                </div>

                {/* Copyright/Derechos */}
                <div className="mt-12 text-center text-gray-500 text-xs border-t border-violet-800 pt-6">
                    &copy; {new Date().getFullYear()} Intranet Corporativa. Todos los derechos reservados. Desarrollado con Laravel & React.
                </div>
            </div>
        </footer>
    );
}