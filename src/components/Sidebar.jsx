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
            className={`block p-3 pl-6 text-sm font-medium rounded-xl transition-all duration-300 border-l-2 ml-4 whitespace-nowrap ${
                isActive 
                ? 'text-blue-400 bg-blue-500/10 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
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
            relative flex flex-col md:flex-row items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group
            ${isActive 
                ? 'bg-gradient-to-r from-blue-600/20 to-transparent text-white border border-white/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'}
        `}>
            {isActive && (
                <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]" />
            )}

            <Icon className={`w-8 h-8 md:w-6 md:h-6 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
            
            <span className={`
                mt-2 md:mt-0 md:ml-3 font-medium text-sm md:text-base transition-all duration-300 overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100 w-full md:w-auto'}
            `}>
                {children}
            </span>

            {hasSubItems && !isCollapsed && (
                <div className="hidden md:block ml-auto">
                    <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            )}
        </div>
    );

    if (hasSubItems) {
        return (
            <div className="w-full">
                <div onClick={() => setIsOpen(!isOpen)}>{content}</div>
                {isOpen && !isCollapsed && (
                    <div className="mt-2 flex flex-col space-y-1 animate-in slide-in-from-top-2 duration-300 overflow-hidden">
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
                className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#041830] rounded-lg shadow-lg text-blue-400 border border-white/10"
            >
                <Bars3Icon className="w-6 h-6" />
            </button>

            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/70 z-50 md:hidden backdrop-blur-md transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside 
                className={`
                    fixed top-0 left-0 h-full bg-gradient-to-b from-[#061c37] to-[#041830] border-r border-white/5 z-[60] flex flex-col transition-all duration-500 ease-in-out shadow-2xl
                    overflow-x-hidden
                    ${isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
                    md:translate-x-0 
                    ${isCollapsed ? 'md:w-24' : 'md:w-64'}
                `}
                onMouseEnter={() => setIsCollapsed(false)}
                onMouseLeave={() => setIsCollapsed(true)}
            >
                {/* --- SECCIÓN DEL LOGO MODIFICADA --- */}
                <div className="p-4 md:p-6 flex justify-center items-center border-b border-white/5 flex-shrink-0 relative min-h-[100px]">
                    <div className={`
                        flex items-center justify-center transition-all duration-500 ease-in-out
                        ${!isCollapsed 
                            ? 'bg-white/5 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.15)] w-full' 
                            : 'p-1'
                        }
                    `}>
                        <img 
                            src="/images/logos/logo.png" 
                            alt="Logo" 
                            className={`object-contain transition-all duration-500 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] 
                            ${isCollapsed ? 'md:w-14 w-12' : 'w-48'}`} 
                        />
                    </div>
                    
                    <button 
                        onClick={() => setIsMobileOpen(false)}
                        className="absolute right-4 top-6 md:hidden text-gray-400 hover:text-red-400 bg-black/20 p-1.5 rounded-lg backdrop-blur-sm border border-white/5"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                {/* --- FIN DE LA SECCIÓN DEL LOGO --- */}

                <nav className="flex-grow space-y-3 overflow-y-auto overflow-x-hidden p-4 scrollbar-hide mt-4">
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

                <div className="p-4 border-t border-white/5 bg-black/10">
                    <button 
                        onClick={() => logout(() => navigate('/login'))}
                        className="w-full flex flex-col md:flex-row items-center p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group overflow-hidden"
                    >
                        <div className="p-2 rounded-lg group-hover:bg-red-500 group-hover:text-white transition-colors flex-shrink-0">
                            <ArrowLeftEndOnRectangleIcon className="w-6 h-6" />
                        </div>
                        <span className={`mt-2 md:mt-0 md:ml-3 font-semibold whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'md:opacity-0 md:w-0 md:hidden' : 'opacity-100'}`}>
                            Cerrar Sesión
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
}