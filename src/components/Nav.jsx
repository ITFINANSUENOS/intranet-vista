import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Cambiado
import { FaHome, FaComments, FaClipboardList, FaInfoCircle, FaPhone, FaSignInAlt } from 'react-icons/fa';

const NavLink = ({ to, children, icon: Icon }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    const classes = isActive
        ? 'inline-flex items-center px-4 py-3 border-b-4 border-violet-600 text-lg font-black leading-5 text-yellow-300 bg-violet-800/10 transition duration-300'
        : 'inline-flex items-center px-4 py-3 border-b-4 border-transparent text-lg font-bold leading-5 text-gray-700 hover:text-violet-700 hover:border-red-600 transition duration-300';
    
    return (
        <Link to={to} className={classes}>
            {Icon && <Icon className="mr-3 text-xl" />} 
            {children}
        </Link>
    );
};

export default function Nav() {
    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 hover:shadow-2xl hover:shadow-violet-900/15">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-24"> 
                    <div className="flex items-center">
                        <Link to="/">
                            <span className="text-4xl font-black text-violet-900 tracking-widest border-l-8 border-red-600 pl-4 transition-colors duration-300 hover:text-red-600">
                                INTRANET
                            </span>
                        </Link>
                    </div>

                    <div className="hidden space-x-2 sm:-my-px sm:ml-10 sm:flex items-center">
                        <NavLink to="/" icon={FaHome}>Inicio</NavLink>
                        <NavLink to="/chat" icon={FaComments}>Chat</NavLink>
                        <NavLink to="/docs" icon={FaClipboardList}>Documentos</NavLink>
                        <NavLink to="/about" icon={FaInfoCircle}>Acerca de</NavLink>
                        <NavLink to="/support" icon={FaPhone}>Soporte</NavLink>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link 
                            to="/login"
                            className="inline-flex items-center px-8 py-3 border border-transparent text-xl font-black rounded-full text-white bg-red-600 hover:bg-red-700 shadow-xl shadow-red-500/60 transition duration-300 ease-in-out transform hover:scale-110 ring-4 ring-red-300/50"
                        >
                            <FaSignInAlt className="mr-3 text-yellow-300 text-2xl" />
                            INGRESAR
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}