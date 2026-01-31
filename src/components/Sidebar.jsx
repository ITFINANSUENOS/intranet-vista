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
    Bars3Icon, 
    XMarkIcon  
} from '@heroicons/react/24/outline';

const canAccess = (user, permissionName) => {
    if (!user) return false;
    const userRoleNames = Array.isArray(user.roles) 
        ? user.roles.map(r => typeof r === 'string' ? r : r.name)
        : [];
    if (userRoleNames.includes('Super_usuario')) return true;
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(permissionName);
    }
    return false; 
};

const SubNavItem = ({ to, children, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;
    
    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`block p-3 pl-4 text-sm font-medium rounded-lg transition-colors border-l-2 ml-4 ${
                isActive ? 'text-blue-600 bg-blue-50 border-blue-600' : 'text-gray-600 hover:bg-gray-100 border-transparent'
            }`}
        >
            {children}
        </Link>
    );
};

const NavItem = ({ to, icon: Icon, children, isCollapsed, subItems, onItemClick }) => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);
    
    const isActive = subItems 
        ? subItems.some(item => location.pathname === item.to)
        : location.pathname === to;

    const hasSubItems = subItems && subItems.length > 0;

    const content = (
        <div className={`
            flex flex-col md:flex-row items-center p-3 rounded-xl transition-all duration-200 cursor-pointer
            ${isActive ? 'bg-[#051931] text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}
        `}>
            {/* Icono centrado en móvil */}
            <Icon className={`w-8 h-8 md:w-6 md:h-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
            
            {/* Texto debajo del icono en móvil, al lado en desktop */}
            <span className={`
                mt-2 md:mt-0 md:ml-3 font-semibold text-center md:text-left transition-all duration-200
                ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100 w-full md:w-auto'}
            `}>
                {children}
            </span>

            {/* Indicador de submenú */}
            {hasSubItems && !isCollapsed && (
                <div className="hidden md:block ml-auto">
                    {isOpen ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
                </div>
            )}
            
            {/* Indicador visual para móvil si tiene submenú */}
            {hasSubItems && (
                <div className="md:hidden mt-1">
                    {isOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
                </div>
            )}
        </div>
    );

    if (hasSubItems) {
        return (
            <div className="w-full">
                <div onClick={() => setIsOpen(!isOpen)}>{content}</div>
                {isOpen && (
                    <div className="mt-2 flex flex-col space-y-1 animate-in slide-in-from-top-2 duration-300">
                        {subItems.map((item, index) => (
                            <SubNavItem key={index} to={item.to} onClick={onItemClick}>
                                {item.label}
                            </SubNavItem>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return <Link to={to} onClick={onItemClick} className="w-full">{content}</Link>;
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const hasToolsAccess = 
        canAccess(user, 'view_datacredito') || 
        canAccess(user, 'view_inventory') || 
        canAccess(user, 'view_documents') || 
        canAccess(user, 'view_help_desk');

    const configSubItems = [
        canAccess(user, 'view_users') && { label: 'Usuarios', to: '/users' },
        canAccess(user, 'view_roles') && { label: 'Roles', to: '/roles' },
        canAccess(user, 'view_companies') && { label: 'Empresas', to: '/companies' },
        canAccess(user, 'view_positions') && { label: 'Cargos', to: '/positions' },
        canAccess(user, 'view_regionals') && { label: 'Regionales', to: '/regionals' },
        canAccess(user, 'view_cost_centers') && { label: 'Centros de Costo', to: '/cost-centers' },
    ].filter(Boolean);

    const handleMobileLinkClick = () => {
        setIsMobileOpen(false);
    };

    return (
        <>
            <button 
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md text-gray-600 border border-gray-100"
            >
                <Bars3Icon className="w-6 h-6" />
            </button>

            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-50 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside 
                className={`
                    fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-[60] flex flex-col transition-all duration-300 ease-in-out
                    w-64 
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-20' : 'md:w-64'}
                `}
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}
            >
                <div className="p-6 flex justify-center items-center border-b border-gray-100 flex-shrink-0 relative">
                    <img 
                        src="/images/logos/logo.png" 
                        alt="Logo" 
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'md:w-10 md:h-10' : 'w-40 h-auto'}`} 
                    />
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="absolute right-4 top-6 md:hidden text-gray-500 hover:text-red-500"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-grow space-y-4 overflow-y-auto p-4 scrollbar-hide">
                    {canAccess(user, 'view_dashboard') && (
                        <NavItem 
                            to="/dashboard" 
                            icon={HomeIcon} 
                            isCollapsed={isCollapsed}
                            onItemClick={handleMobileLinkClick}
                        >
                            Home
                        </NavItem>
                    )}

                    {hasToolsAccess && (
                        <NavItem 
                            to="/herramientas" 
                            icon={ClipboardIcon} 
                            isCollapsed={isCollapsed}
                            onItemClick={handleMobileLinkClick}
                        >
                            Herramientas
                        </NavItem>
                    )}

                    {configSubItems.length > 0 && (
                        <NavItem 
                            to="#" 
                            icon={Cog6ToothIcon} 
                            isCollapsed={isCollapsed} 
                            subItems={configSubItems}
                            onItemClick={handleMobileLinkClick}
                        >
                            Configuración
                        </NavItem>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-200 flex-shrink-0">
                    <button 
                        onClick={() => logout(() => navigate('/login'))}
                        className="w-full flex flex-col md:flex-row items-center p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors group"
                    >
                        <ArrowLeftEndOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                        <span className={`mt-2 md:mt-0 md:ml-3 font-semibold transition-opacity duration-200 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}