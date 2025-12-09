import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, ClipboardIcon, BriefcaseIcon, 
    ArchiveBoxIcon, DocumentTextIcon, LifebuoyIcon, 
    ArrowLeftEndOnRectangleIcon, ChartBarIcon, 
    MapPinIcon, Cog6ToothIcon, UserCircleIcon, 
    ChevronDownIcon, ChevronRightIcon, 
    PencilSquareIcon 
} from '@heroicons/react/24/outline';

const DARK_COLOR = 'rgba(4, 24, 48)';

// --- LÓGICA DE ACCESO CON PASE MAESTRO (CORREGIDA) ---
// Esta función verifica si el usuario puede acceder a una vista específica
const canAccess = (user, permissionName) => {
    if (!user) return false;
    
    // Obtener los nombres de roles para la verificación (Ej: ['Administrador'])
    const userRoleNames = Array.isArray(user.roles) 
        ? user.roles.map(r => typeof r === 'string' ? r : r.name)
        : [];
        
    // 1. PASE MAESTRO: Si el usuario tiene el rol 'Administrador', darle acceso total
    if (userRoleNames.includes('Administrador')) {
        return true;
    }

    // 2. Verificación estándar por permisos
    // Tu UserController.php envía 'permissions' como un array de strings (Ej: ['view_users'])
    if (user.permissions && Array.isArray(user.permissions)) {
        return user.permissions.includes(permissionName);
    }
    
    // Si no es Administrador y no tiene el permiso específico, no accede
    return false; 
};

// Componente para los sub-ítems del Sidebar
const SubNavItem = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    
    return (
        <Link 
            to={to} 
            className={`flex items-center p-2 pl-6 transition-all duration-200 text-sm rounded-lg w-full ${
                isActive 
                    ? 'font-semibold bg-gray-200' 
                    : 'text-gray-700 hover:bg-gray-100'
            }`}
            style={{ color: isActive ? DARK_COLOR : undefined }}
        >
            {children}
        </Link>
    );
};

// Componente principal del ítem de navegación
const NavItem = ({ to, children, icon: Icon, isCollapsed, subItems = [] }) => {
    const location = useLocation();
    const isAccordion = subItems.length > 0;
    const initialOpen = isAccordion && subItems.some(item => location.pathname.startsWith(item.to));
    const [isOpen, setIsOpen] = useState(initialOpen);

    const isActive = location.pathname.startsWith(to) && !isAccordion;
    const hasActiveSubItem = isAccordion && subItems.some(item => location.pathname.startsWith(item.to));
    const itemIsActive = isActive || hasActiveSubItem;
    
    const textColor = itemIsActive ? 'white' : DARK_COLOR;
    const backgroundColor = itemIsActive ? DARK_COLOR : 'transparent';

    const handleClick = () => {
        if (isAccordion) setIsOpen(!isOpen);
    };
    
    const Component = isAccordion ? 'button' : Link;
    const navProps = isAccordion ? { onClick: handleClick } : { to };
    const elementId = `nav-item-${children.replace(/\s/g, '-')}`;

    return (
        <div className="relative group">
            <div className={`rounded-lg transition-colors duration-300 ${elementId}`}>
                <Component 
                    {...navProps}
                    className={`flex items-center transition-all duration-300 rounded-lg p-3 w-full 
                                ${isCollapsed ? 'justify-center' : ''} 
                                ${itemIsActive ? 'text-white' : 'text-gray-600'} 
                                ${isAccordion ? 'font-bold' : 'font-medium'}`}
                    style={{ backgroundColor, color: textColor }}
                >
                    <Icon className="w-6 h-6 flex-shrink-0" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                    
                    {!isCollapsed && (
                        <span className="ml-4 text-sm tracking-wide flex-grow text-left" style={{ color: itemIsActive ? 'white' : DARK_COLOR }}>
                            {children}
                        </span>
                    )}
                    
                    {isAccordion && !isCollapsed && (
                        isOpen 
                            ? <ChevronDownIcon className="w-4 h-4 ml-auto" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                            : <ChevronRightIcon className="w-4 h-4 ml-auto" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                    )}
                </Component>
            </div>

            {/* Estilos dinámicos para hover */}
            <style jsx>{`
                .${elementId}:hover > * { 
                    background-color: ${DARK_COLOR} !important;
                    color: white !important;
                }
                .${elementId}:hover > * svg { color: white !important; }
            `}</style>

            {/* Sub-menú (desplegado) */}
            {isAccordion && !isCollapsed && (
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-2' : 'max-h-0'}`}>
                    <div className="space-y-1">
                        {subItems.map((item, index) => (
                            <SubNavItem key={index} to={item.to}>{item.label}</SubNavItem>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Sub-menú (colapsado - hover) */}
            {isAccordion && isCollapsed && (
                <div className={`absolute left-full top-0 ml-2 w-56 p-2 bg-white rounded-xl shadow-2xl border border-gray-100 transition-opacity duration-300 origin-left z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible`}>
                    <div className='p-1 font-bold text-gray-700' style={{ color: DARK_COLOR }}>{children}</div>
                    <div className="space-y-1">
                        {subItems.map((item, index) => (
                            <SubNavItem key={index} to={item.to}>{item.label}</SubNavItem>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const isCollapsed = !isHovered; 

    const handleLogout = () => {
        logout(() => navigate('/login'));
    };
    
    // ==========================================================
    // CONFIGURACIÓN DE RUTAS BASADA EN PERMISOS (USANDO canAccess)
    // ==========================================================
    
    // 1. Opciones de Configuración
    const configSubItems = [
        canAccess(user, 'view_users') && { label: 'Gestión de Usuarios', to: '/users' },
        canAccess(user, 'view_roles') && { label: 'Roles y Permisos', to: '/roles' },
        canAccess(user, 'view_companies') && { label: 'Empresas Asociadas', to: '/companies' },
        canAccess(user, 'view_positions') && { label: 'Puestos de Trabajo', to: '/positions' },
        canAccess(user, 'view_regionals') && { label: 'Regionalización', to: '/regionals' },
        canAccess(user, 'view_cost_centers') && { label: 'Centros de Costo', to: '/cost-centers' },
    ].filter(Boolean); // Elimina los valores 'false'
    
    // 2. Opciones de Publicación
    const publishSubItems = [
        canAccess(user, 'view_objectives') && { label: 'Objetivos', to: '/objectives' },
        canAccess(user, 'view_events') && { label: 'Eventos', to: '/events' },
        canAccess(user, 'view_news') && { label: 'Noticias', to: '/news' },
    ].filter(Boolean);

    // 3. Opciones de Operaciones
    const operationalSubItems = [
        canAccess(user, 'view_datacredito') && { label: 'Análisis DataCrédito', to: '/reportes/datacredito' },
        canAccess(user, 'view_inventory') && { label: 'Control de Inventario', to: '/inventario' },
        canAccess(user, 'view_documents') && { label: 'Repositorio Documental', to: '/documentos' },
    ].filter(Boolean);
    
    // Opciones de Soporte
    const supportSubItems = [
        canAccess(user, 'view_help_desk') && { label: 'Mesa de Ayuda', to: '/ayuda' },
        canAccess(user, 'view_api_docs') && { label: 'Documentación API', to: '/api-docs' },
    ].filter(Boolean);
    
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

    return (
        <aside
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed top-0 left-0 h-screen ${sidebarWidth} bg-white text-gray-800 flex flex-col p-3 shadow-2xl z-50 transition-all duration-300 ease-in-out group`}
            style={{ borderRight: `1px solid rgba(4, 24, 48, 0.1)` }}
        >
            {/* Logo */}
            <div className={`flex-shrink-0 mb-8 mt-2 pb-4 ${isCollapsed ? 'justify-center' : 'border-b border-gray-200'}`}>
               <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    {/* Reemplaza esta línea con tu logo */}
                    <img src="../public/images/logos/logo.png" alt="Logo" className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-60 h-25'}`} />
                </div>
            </div>

            {/* Navegación */}
            <nav className="flex-grow space-y-2 overflow-y-auto custom-scrollbar-hidden"> 
                {/* Dashboard: Verifica permiso view_dashboard */}
                {canAccess(user, 'view_dashboard') && (
                    <NavItem to="/dashboard" icon={HomeIcon} isCollapsed={isCollapsed}>
                        Dashboard
                    </NavItem>
                )}
                
                {/* Si hay ítems de publicación accesibles, muestra el menú */}
                {publishSubItems.length > 0 && (
                     <NavItem to="/publicar" icon={PencilSquareIcon} isCollapsed={isCollapsed} subItems={publishSubItems}>
                        Publicar
                    </NavItem>
                )}
                
                {/* Si hay ítems de operaciones accesibles, muestra el menú */}
                {operationalSubItems.length > 0 && (
                     <NavItem to="/operaciones" icon={ClipboardIcon} isCollapsed={isCollapsed} subItems={operationalSubItems}>
                        Operaciones
                    </NavItem>
                )}
                
                {/* Si hay ítems de soporte accesibles, muestra el menú */}
                {supportSubItems.length > 0 && (
                    <NavItem to="/soporte" icon={LifebuoyIcon} isCollapsed={isCollapsed} subItems={supportSubItems}>
                        Soporte
                    </NavItem>
                )}
            </nav>

            {/* Configuración y Perfil */}
            <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200">
                {/* Si hay ítems de configuración accesibles, muestra el menú */}
                {configSubItems.length > 0 && (
                    <div className="mb-3">
                        <NavItem to="/configuracion" icon={Cog6ToothIcon} isCollapsed={isCollapsed} subItems={configSubItems}>
                            Configuración
                        </NavItem>
                    </div>
                )}

                <div className={`flex items-center p-3 mb-3 rounded-xl border border-gray-200 cursor-pointer transition-colors duration-300 profile-card`} style={{ '--dark-color': DARK_COLOR }}>
                    <UserCircleIcon className="w-6 h-6 flex-shrink-0" style={{ color: DARK_COLOR }} />
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold truncate" style={{ color: DARK_COLOR }}>{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">{user?.roles?.[0] || 'Rol'}</p> {/* Asumiendo que roles es un array de strings */}
                        </div>
                    )}
                     <style jsx>{`
                        .profile-card:hover { background-color: ${DARK_COLOR} !important; border-color: ${DARK_COLOR} !important; }
                        .profile-card:hover p, .profile-card:hover svg { color: white !important; }
                    `}</style>
                </div>
                
                <button onClick={handleLogout} className={`w-full flex items-center p-3 text-red-500 transition-all duration-200 rounded-xl logout-button ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                    {!isCollapsed && <span className="font-semibold text-sm ml-3" style={{ color: DARK_COLOR }}>Cerrar Sesión</span>}
                    <style jsx>{`
                        .logout-button:hover { background-color: ${DARK_COLOR} !important; }
                        .logout-button:hover span, .logout-button:hover svg { color: white !important; }
                    `}</style>
                </button>
            </div>
        </aside>
    );
}