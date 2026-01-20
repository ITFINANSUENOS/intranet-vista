import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, 
    ClipboardIcon, 
    ArrowLeftEndOnRectangleIcon, 
    Cog6ToothIcon, 
    ChevronDownIcon, 
    ChevronRightIcon, 
    PencilSquareIcon 
} from '@heroicons/react/24/outline';

const DARK_BLUE = '#051931';

const canAccess = (user, permissionName) => {
    if (!user) return false;
    const userRoleNames = Array.isArray(user.roles) 
        ? user.roles.map(r => typeof r === 'string' ? r : r.name)
        : [];
    if (userRoleNames.includes('Super usuario')) return true;
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(permissionName);
    }
    return false; 
};

const SubNavItem = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <Link 
            to={to} 
            className={`block p-2 pl-11 text-sm font-medium rounded-lg transition-colors ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
        >
            {children}
        </Link>
    );
};

const NavItem = ({ to, icon: Icon, children, isCollapsed, subItems }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    
    const isActive = subItems 
        ? subItems.some(item => location.pathname === item.to)
        : location.pathname === to;

    const hasSubItems = subItems && subItems.length > 0;

    const content = (
        <div className={`flex items-center p-3 rounded-xl transition-all duration-200 cursor-pointer ${
            isActive ? 'bg-[#051931] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'
        }`}>
            <Icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            {!isCollapsed && (
                <>
                    <span className="ml-3 font-semibold flex-grow">{children}</span>
                    {hasSubItems && (
                        isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />
                    )}
                </>
            )}
        </div>
    );

    if (hasSubItems && !isCollapsed) {
        return (
            <div 
                onMouseEnter={() => setIsOpen(true)} 
                onMouseLeave={() => setIsOpen(false)}
            >
                <div onClick={() => setIsOpen(!isOpen)}>{content}</div>
                {isOpen && (
                    <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                        {subItems.map((item, index) => (
                            <SubNavItem key={index} to={item.to}>{item.label}</SubNavItem>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return <Link to={to}>{content}</Link>;
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(true);

    const hasToolsAccess = 
        canAccess(user, 'view_datacredito') || 
        canAccess(user, 'view_inventory') || 
        canAccess(user, 'view_documents') || 
        canAccess(user, 'view_help_desk');


    // LISTA COMPLETA DE CONFIGURACIÓN
    const configSubItems = [
        canAccess(user, 'view_users') && { label: 'Usuarios', to: '/users' },
        canAccess(user, 'view_roles') && { label: 'Roles', to: '/roles' },
        canAccess(user, 'view_companies') && { label: 'Empresas', to: '/companies' },
        canAccess(user, 'view_positions') && { label: 'Cargos', to: '/positions' },
        canAccess(user, 'view_regionals') && { label: 'Regionales', to: '/regionals' },
        canAccess(user, 'view_cost_centers') && { label: 'Centros de Costo', to: '/cost-centers' },
    ].filter(Boolean);

    return (
        <aside 
            className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}
            onMouseEnter={() => setIsCollapsed(false)}
            onMouseLeave={() => setIsCollapsed(true)}
        >
            <div className="p-6 flex justify-center border-b border-gray-100">
                <img src="../public/images/logos/logo.png" alt="Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-60 h-25'}`} />
            </div>

            <nav className="flex-grow space-y-2 overflow-y-auto p-3">
                {canAccess(user, 'view_dashboard') && (
                    <NavItem to="/dashboard" icon={HomeIcon} isCollapsed={isCollapsed}>Home</NavItem>
                )}

                {hasToolsAccess && (
                    <NavItem to="/herramientas" icon={ClipboardIcon} isCollapsed={isCollapsed}>
                        Herramientas
                    </NavItem>
                )}

            </nav>

            <div className="mt-auto p-3 border-t border-gray-200">
                {/* CONFIGURACIÓN COMPLETA */}
                {configSubItems.length > 0 && (
                    <NavItem to="/configuracion" icon={Cog6ToothIcon} isCollapsed={isCollapsed} subItems={configSubItems}>
                        Configuración
                    </NavItem>
                )}
                
                <button 
                    onClick={() => logout(() => navigate('/login'))}
                    className="w-full flex items-center p-3 text-red-600 hover:bg-red-50 rounded-xl mt-2 transition-colors"
                >
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                    {!isCollapsed && <span className="ml-3 font-semibold">Cerrar Sesión</span>}
                </button>
            </div>
        </aside>
    );
}