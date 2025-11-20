// src/components/Sidebar.jsx

import React from 'react';
// CAMBIO CLAVE: Importar useNavigate
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, ClipboardIcon, BriefcaseIcon, 
    ArchiveBoxIcon, DocumentTextIcon, LifebuoyIcon, 
    ArrowLeftEndOnRectangleIcon, ChartBarIcon 
} from '@heroicons/react/24/outline'; 

// Definición de roles (Ajusta estos valores si tu API usa nombres diferentes)
const R_ADMIN = 'Administrador';
const R_GESTOR = 'Gestor';
const R_ADMINISTRATIVO = 'Administrativo';
const R_ASESOR = 'Asesor';


// Helper de roles
const hasAnyRole = (user, rolesRequired) => {
    if (!user || !user.roles) return false; 
    const userRoles = user.roles.map(r => r.name || r); 
    const required = Array.isArray(rolesRequired) ? rolesRequired : [rolesRequired];
    return userRoles.some(role => required.includes(role));
};

const NavItem = ({ to, children, icon: Icon }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    
    return (
        <Link 
            to={to} 
            className={`flex items-center p-3 my-2 transition-colors duration-200 rounded-lg group ${isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-200 hover:bg-indigo-600 hover:text-white'}`}
        >
            <Icon className={`w-6 h-6 mr-3 transition-colors duration-200 ${isActive ? 'text-white' : 'text-indigo-400 group-hover:text-white'}`} />
            <span className="font-semibold text-sm">{children}</span>
        </Link>
    );
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    // CAMBIO CLAVE: Llamada a useNavigate en el componente
    const navigate = useNavigate(); 

    // Función que maneja el logout y la redirección
    const handleLogout = () => {
        // Llama a logout y pasa el navigate como callback de éxito
        logout(() => {
            navigate('/login');
        });
    };

    return (
        <aside className="h-full bg-violet-900 flex flex-col p-4 shadow-xl">
            <div className="flex-shrink-0 text-white text-2xl font-black mb-6">
                <span className="tracking-widest border-l-4 border-red-600 pl-3">INTRANET</span>
            </div>

            <nav className="flex-grow space-y-2 overflow-y-auto">
                {/* ... (Contenido de navegación) ... */}
                <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">General</div>
                <NavItem to="/dashboard" icon={HomeIcon}>Dashboard</NavItem>
                
                {hasAnyRole(user, [R_ADMIN]) && (
                    <>
                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Administración</div>
                        <NavItem to="/users" icon={UsersIcon}>Usuarios</NavItem>
                        <NavItem to="/roles" icon={ClipboardIcon}>Roles & Permisos</NavItem>
                        <NavItem to="/companies" icon={BriefcaseIcon}>Empresas</NavItem>
                    </>
                )}

                {hasAnyRole(user, [R_ADMIN, R_GESTOR]) && (
                    <>
                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Gestión</div>
                        <NavItem to="/reports" icon={ChartBarIcon}>Reportes</NavItem>
                    </>
                )}
                
                {hasAnyRole(user, [R_ADMIN, R_GESTOR, R_ADMINISTRATIVO, R_ASESOR]) && (
                    <>
                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Operaciones</div>
                        <NavItem to="/inventario" icon={ArchiveBoxIcon}>Inventario</NavItem>
                        <NavItem to="/documentos" icon={DocumentTextIcon}>Documentos</NavItem>
                    </>
                )}
                
                <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Soporte</div>
                <NavItem to="/ayuda" icon={LifebuoyIcon}>Mesa de Ayuda</NavItem>

            </nav>

            <div className="mt-auto pt-4 border-t border-indigo-500/50">
                <div className="p-3 my-2 text-indigo-100 border border-indigo-700/50 rounded-lg text-sm">
                    Hola, <span className="font-bold text-yellow-300">{user?.name || user?.name_user || 'Usuario'}</span>
                </div>
                
                <button
                    // CAMBIO CLAVE: Llama a handleLogout
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 text-red-300 transition-colors duration-200 rounded-lg hover:bg-red-700 hover:text-white group"
                >
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6 mr-3" />
                    <span className="font-semibold text-sm">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}