import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, ClipboardIcon, BriefcaseIcon, 
    ArchiveBoxIcon, DocumentTextIcon, LifebuoyIcon, 
    ArrowLeftEndOnRectangleIcon, ChartBarIcon, 
    MapPinIcon
} from '@heroicons/react/24/outline';

// Definición de roles
const R_ADMIN = 'Administrador';
const R_GESTOR = 'Gestor';
const R_ADMINISTRATIVO = 'Administrativo';
const R_ASESOR = 'Asesor';


// Helper de roles
const hasAnyRole = (user, rolesRequired) => {
    if (!user || !user.roles) return false; 
    // Mapeamos los roles, ya que podrían venir como objetos {id: 1, name: '...'} o solo strings
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
            className={`flex items-center p-3 transition-colors duration-200 rounded-lg group ${
                isActive 
                    ? 'bg-indigo-700 text-white shadow-lg' 
                    : 'text-indigo-200 hover:bg-indigo-600'
            }`}
        >
            <Icon className="w-6 h-6 mr-3" />
            <span className="font-medium">{children}</span>
        </Link>
    );
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(() => {
            navigate('/login');
        });
    };

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-indigo-800 text-white flex flex-col p-4 shadow-2xl z-20">
            <div className="flex-shrink-0 mb-8">
                <h1 className="text-2xl font-extrabold tracking-wider uppercase text-yellow-300">
                    FinanSueños
                </h1>
            </div>

            <nav className="flex-grow space-y-2 overflow-y-auto">
                {/* General */}
                <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">General</div>
                <NavItem to="/dashboard" icon={HomeIcon}>Dashboard</NavItem>

                {/* Sección de Administración */}
                {hasAnyRole(user, [R_ADMIN]) && (
                    <>
                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Administración</div>
                        <NavItem to="/users" icon={UsersIcon}>Usuarios</NavItem>
                        <NavItem to="/roles" icon={ClipboardIcon}>Roles y Permisos</NavItem>
                        <NavItem to="/companies" icon={BriefcaseIcon}>Empresas</NavItem>
                        {/* 👇 NUEVOS ÍTEMS PARA PUESTOS Y REGIONALES */}
                        <NavItem to="/positions" icon={BriefcaseIcon}>Puestos</NavItem>
                        <NavItem to="/regionals" icon={MapPinIcon}>Regionales</NavItem>
                    </>
                )}

                {/* Sección de Gestión y Operaciones */}
                {hasAnyRole(user, [R_ADMIN, R_GESTOR, R_ADMINISTRATIVO, R_ASESOR]) && (
                    <>
                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Gestión</div>
                        
                        {/* El procesamiento de DataCrédito solo para Administradores (por seguridad de la API) */}
                        {hasAnyRole(user, [R_ADMIN]) && (
                            // 👈 NUEVO ITEM DE SIDEBAR
                            <NavItem to="/reportes/datacredito" icon={ChartBarIcon}>
                                Procesar DataCrédito
                            </NavItem>
                        )}

                        <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Operaciones</div>
                        <NavItem to="/inventario" icon={ArchiveBoxIcon}>Inventario</NavItem>
                        <NavItem to="/documentos" icon={DocumentTextIcon}>Documentos</NavItem>
                    </>
                )}
                
                {/* Soporte */}
                <div className="text-xs font-bold uppercase text-indigo-300 pt-4 pb-1">Soporte</div>
                <NavItem to="/ayuda" icon={LifebuoyIcon}>Mesa de Ayuda</NavItem>

            </nav>

            <div className="mt-auto pt-4 border-t border-indigo-500/50">
                <div className="p-3 my-2 text-indigo-100 border border-indigo-700/50 rounded-lg text-sm">
                    Hola, <span className="font-bold text-yellow-300">{user?.name || user?.name_user || 'Usuario'}</span>
                </div>
                
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center p-3 text-red-300 transition-colors duration-200 rounded-lg hover:bg-red-700 hover:text-white group"
                >
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6 mr-3" />
                    <span className="font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}