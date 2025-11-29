import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; 
import { useAuth } from '../context/AuthContext';
import { 
    HomeIcon, UsersIcon, ClipboardIcon, BriefcaseIcon, 
    ArchiveBoxIcon, DocumentTextIcon, LifebuoyIcon, 
    ArrowLeftEndOnRectangleIcon, ChartBarIcon, 
    MapPinIcon, Cog6ToothIcon, UserCircleIcon, 
    ChevronDownIcon, ChevronRightIcon // Iconos para el despliegue
} from '@heroicons/react/24/outline';

// Define el color oscuro personalizado (para hover y texto)
const DARK_COLOR = 'rgba(4, 24, 48)';


// Definición de roles
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


// Componente para los sub-ítems (elementos finales, dentro de los acordeones)
const SubNavItem = ({ to, children }) => {
    const location = useLocation();
    const isActive = location.pathname.startsWith(to);
    
    // El hover de los sub-ítems se mantiene sutil (bg-gray-100) para no competir con los principales
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


// Componente para los ítems principales (que pueden ser links o toggles de acordeón)
const NavItem = ({ to, children, icon: Icon, isCollapsed, subItems = [] }) => {
    const location = useLocation();
    
    // Lógica para determinar si es un acordeón
    const isAccordion = subItems.length > 0;
    
    // Mantenemos el estado local solo para los acordeones
    const initialOpen = isAccordion && subItems.some(item => location.pathname.startsWith(item.to));
    const [isOpen, setIsOpen] = useState(initialOpen); // Estado para el acordeón (despliegue hacia abajo)

    // Determinar si el ítem (o alguno de sus sub-ítems) está activo
    const isActive = location.pathname.startsWith(to) && !isAccordion;
    const hasActiveSubItem = isAccordion && subItems.some(item => location.pathname.startsWith(item.to));
    const itemIsActive = isActive || hasActiveSubItem;
    
    // Colores para el estado activo
    const textColor = itemIsActive ? 'white' : DARK_COLOR;
    const backgroundColor = itemIsActive ? DARK_COLOR : 'transparent';

    const handleClick = () => {
        if (isAccordion) {
            setIsOpen(!isOpen); // Si es un acordeón, cambia el estado de abierto/cerrado
        }
        // Si no es un acordeón, la navegación se maneja automáticamente por el componente Link
    };
    
    // El ítem principal puede ser un botón (para acordeón) o un Link
    const Component = isAccordion ? 'button' : Link;

    const navProps = isAccordion 
        ? { onClick: handleClick } 
        : { to };
    
    // Identificador para los estilos dinámicos de hover
    const elementId = `nav-item-${children.replace(/\s/g, '-')}`;

    return (
        <div className="relative">
            {/* El div actúa como contenedor para aplicar el hover correcto en modo colapsado */}
            <div className={`rounded-lg transition-colors duration-300 ${elementId}`}>
                <Component 
                    {...navProps}
                    className={`flex items-center transition-all duration-300 rounded-lg p-3 w-full 
                                ${isCollapsed ? 'justify-center' : ''} 
                                ${itemIsActive ? 'text-white' : 'text-gray-600'} 
                                ${isAccordion ? 'font-bold' : 'font-medium'}`}
                    style={{ 
                        backgroundColor: backgroundColor,
                        color: textColor,
                    }}
                >
                    <Icon className="w-6 h-6 flex-shrink-0" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                    
                    {/* Texto visible solo en modo expandido */}
                    {!isCollapsed && (
                        <span className="ml-4 text-sm tracking-wide flex-grow text-left" style={{ color: itemIsActive ? 'white' : DARK_COLOR }}>
                            {children}
                        </span>
                    )}
                    
                    {/* Indicador de despliegue para Acordeón (solo en modo expandido) */}
                    {isAccordion && !isCollapsed && (
                        isOpen 
                            ? <ChevronDownIcon className="w-4 h-4 ml-auto" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                            : <ChevronRightIcon className="w-4 h-4 ml-auto" style={{ color: itemIsActive ? 'white' : DARK_COLOR }} />
                    )}
                </Component>
            </div>

            {/* Estilos para el hover: Aplica DARK_COLOR al fondo y blanco al texto/icono. Esto garantiza que las letras no se pierdan. */}
            <style jsx>{`
                .${elementId}:hover > * { 
                    background-color: ${DARK_COLOR} !important;
                    color: white !important; /* Asegura que la letra sea blanca */
                }
                .${elementId}:hover > * svg {
                    color: white !important; /* Asegura que el icono sea blanco */
                }
            `}</style>

            {/* Sub-menú Desplegable Hacia Abajo (Acordeón, visible solo si NO está colapsado) */}
            {isAccordion && !isCollapsed && (
                <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 py-2' : 'max-h-0'}`}
                >
                    <div className="space-y-1">
                        {subItems.map((item, index) => (
                            <SubNavItem key={index} to={item.to}>
                                {item.label}
                            </SubNavItem>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Menú Desplegable lateral (solo si SÍ está colapsado) */}
            {isAccordion && isCollapsed && (
                <div 
                    // Usamos un grupo para que el submenú se muestre al pasar el ratón sobre el icono colapsado
                    className={`absolute left-full top-0 ml-2 w-56 p-2 bg-white rounded-xl shadow-2xl border border-gray-100 transition-opacity duration-300 origin-left z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible`}
                >
                    <div className='p-1 font-bold text-gray-700' style={{ color: DARK_COLOR }}>{children}</div>
                    {subItems.map((item, index) => (
                        <SubNavItem key={index} to={item.to}>
                            {item.label}
                        </SubNavItem>
                    ))}
                </div>
            )}
        </div>
    );
};


export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    // Estado para controlar si la barra lateral está colapsada/expandida (se controla con hover en CSS)
    const [isHovered, setIsHovered] = useState(false);
    // isCollapsed es TRUE por defecto (barra pequeña) y FALSE al hacer hover (barra grande)
    const isCollapsed = !isHovered; 

    const handleLogout = () => {
        logout(() => {
            navigate('/login');
        });
    };
    
    // Opciones de Configuración (visible solo para Admin)
    const configSubItems = hasAnyRole(user, [R_ADMIN]) ? [
        { label: 'Gestión de Usuarios', to: '/users' },
        { label: 'Roles y Permisos', to: '/roles' },
        { label: 'Empresas Asociadas', to: '/companies' },
        { label: 'Puestos de Trabajo', to: '/positions' },
        { label: 'Regionalización', to: '/regionals' },
    ] : [];

    // Opciones de Operaciones (filtradas por rol)
    const operationalSubItems = [
        hasAnyRole(user, [R_ADMIN]) && { 
            label: 'Análisis DataCrédito', 
            to: '/reportes/datacredito', 
            icon: ChartBarIcon 
        },
        hasAnyRole(user, [R_ADMIN, R_GESTOR, R_ADMINISTRATIVO, R_ASESOR]) && { 
            label: 'Control de Inventario', 
            to: '/inventario', 
            icon: ArchiveBoxIcon 
        },
        hasAnyRole(user, [R_ADMIN, R_GESTOR, R_ADMINISTRATIVO, R_ASESOR]) && { 
            label: 'Repositorio Documental', 
            to: '/documentos', 
            icon: DocumentTextIcon 
        },
    ].filter(Boolean); // Filtrar nulls/falses
    
    // Opciones de Soporte
    const supportSubItems = [
        { label: 'Mesa de Ayuda', to: '/ayuda' },
        { label: 'Documentación API', to: '/api-docs' },
    ];
    
    
    // Estilos dinámicos
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
    const transitionClass = 'transition-all duration-300 ease-in-out';

    return (
        <aside
            // Controla el estado colapsado/expandido basado en el estado local de hover
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed top-0 left-0 h-screen ${sidebarWidth} bg-white text-gray-800 flex flex-col p-3 shadow-2xl z-50 ${transitionClass} group`}
            style={{ borderRight: `1px solid rgba(4, 24, 48, 0.1)` }} // Borde sutil del color oscuro
        >
            
            {/* Logo Grande (sin texto) con tamaño dinámico y transición */}
            <div className={`flex-shrink-0 mb-8 mt-2 pb-4 ${isCollapsed ? 'justify-center' : 'border-b border-gray-200'}`}>
               <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    <img 
                        src="../public/images/logos/logo.png" 
                        alt="Logo" 
                        // [CORRECCIÓN CLAVE]: w-10 h-10 es más seguro que w-16 h-16 dentro de un w-20.
                        className={`object-contain transition-all duration-300 ${isCollapsed ? 'w-10 h-10' : 'w-60 h-25'}`} 
                    />
                </div>
            </div>

            {/* Navegación Principal (Sección que se desplaza y crece) */}
            <nav className="flex-grow space-y-2 overflow-y-auto custom-scrollbar-hidden"> 
                
                {/* Ítem: Dashboard (Link simple) */}
                <NavItem to="/dashboard" icon={HomeIcon} isCollapsed={isCollapsed}>
                    Dashboard
                </NavItem>
                
                {/* Ítem: Operaciones (Acordeón/Dropdown) */}
                {operationalSubItems.length > 0 && (
                     <NavItem 
                        to="/operaciones" 
                        icon={ClipboardIcon} 
                        isCollapsed={isCollapsed}
                        subItems={operationalSubItems}
                    >
                        Operaciones
                    </NavItem>
                )}
                
                {/* Ítem: Soporte (Acordeón/Dropdown) */}
                <NavItem 
                    to="/soporte" 
                    icon={LifebuoyIcon} 
                    isCollapsed={isCollapsed}
                    subItems={supportSubItems}
                >
                    Soporte
                </NavItem>
                
            </nav>

            {/* Sección Inferior: Configuración, Perfil y Cerrar Sesión (Fija en la parte inferior) */}
            <div className="flex-shrink-0 mt-auto pt-4 border-t border-gray-200">
                
                {/* Ítem: Configuración (MOVIDO Y AJUSTADO AQUÍ ABAJO) */}
                {configSubItems.length > 0 && (
                    <div className="mb-3">
                        <NavItem 
                            to="/configuracion" 
                            icon={Cog6ToothIcon} 
                            isCollapsed={isCollapsed}
                            subItems={configSubItems}
                        >
                            Configuración
                        </NavItem>
                    </div>
                )}

                {/* Tarjeta de Perfil */}
                <div 
                    className={`flex items-center p-3 mb-3 rounded-xl border border-gray-200 cursor-pointer transition-colors duration-300 profile-card`}
                    style={{ '--dark-color': DARK_COLOR }}
                >
                    <UserCircleIcon className="w-6 h-6 flex-shrink-0" style={{ color: DARK_COLOR }} />
                    
                    {!isCollapsed && (
                        <div className="ml-3 overflow-hidden">
                            <p className="text-sm font-semibold truncate" style={{ color: DARK_COLOR }}>{user?.name || 'Usuario'}</p>
                            <p className="text-xs text-gray-500">{user?.roles?.[0]?.name || 'Rol'}</p>
                        </div>
                    )}

                     {/* Estilos para el hover de la tarjeta de perfil */}
                    <style jsx>{`
                        .profile-card:hover {
                            background-color: ${DARK_COLOR} !important;
                            border-color: ${DARK_COLOR} !important;
                        }
                        .profile-card:hover p {
                            color: white !important;
                        }
                        .profile-card:hover svg {
                            color: white !important;
                        }
                    `}</style>
                </div>
                
                {/* Botón de Cerrar Sesión */}
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center p-3 text-red-500 transition-all duration-200 rounded-xl logout-button ${isCollapsed ? 'justify-center' : 'justify-start'}`}
                >
                    <ArrowLeftEndOnRectangleIcon className="w-6 h-6 flex-shrink-0" />
                    {!isCollapsed && (
                        <span className="font-semibold text-sm ml-3" style={{ color: DARK_COLOR }}>Cerrar Sesión</span>
                    )}

                    {/* Estilos para el hover del botón de cerrar sesión */}
                    <style jsx>{`
                        .logout-button:hover {
                            background-color: ${DARK_COLOR} !important;
                        }
                        .logout-button:hover span {
                            color: white !important;
                        }
                        .logout-button:hover svg {
                            color: white !important;
                        }
                    `}</style>
                </button>
            </div>
        </aside>
    );
}