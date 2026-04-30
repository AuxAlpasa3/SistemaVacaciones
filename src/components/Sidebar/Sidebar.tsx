import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { 
    FaMapMarkerAlt, 
    FaBoxes, 
    FaBox, 
    FaTrailer, 
    FaWarehouse,
    FaUsers,
    FaUserFriends,
    FaUserCheck,
    FaTruck,
    FaCogs,
    FaWeightHanging,
    FaBuilding,
    FaShieldAlt
} from "react-icons/fa";
import { PiTruckTrailerDuotone } from "react-icons/pi";
import Seguridad from '../../assets/LogoCredencial.png';
import './Sidebar.css';
import type { Usuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { 
    filtrarMenuPorRol, 
    normalizarRolId, 
    MENU_CONFIG,
    obtenerNombreRol,
    type MenuSection 
} from '../../constants/rolesPermissions';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

// Mapeo de nombres de íconos a componentes
const iconMap: { [key: string]: React.ElementType } = {
    // Lucide React icons
    Truck: Icons.Truck,
    LibraryBig: Icons.LibraryBig,
    Settings: Icons.Settings,
    Tickets: Icons.Tickets,
    FileText: Icons.FileText,
    Ship: Icons.Ship,
    Users: Icons.Users,
    Home: Icons.Home,
    ChevronDown: Icons.ChevronDown,
    ChevronRight: Icons.ChevronRight,
    HelpCircle: Icons.HelpCircle,
    // React Icons
    FaMapMarkerAlt: FaMapMarkerAlt,
    FaBoxes: FaBoxes,
    FaBox: FaBox,
    FaTrailer: FaTrailer,
    FaWarehouse: FaWarehouse,
    PiTruckTrailerDuotone: PiTruckTrailerDuotone,
    FaUsers: FaUsers,
    FaUserFriends: FaUserFriends,
    FaUserCheck: FaUserCheck,
    FaTruck: FaTruck,
    FaCogs: FaCogs,
    FaWeightHanging: FaWeightHanging,
    FaBuilding: FaBuilding,
    FaShieldAlt: FaShieldAlt
};

// Componente para renderizar íconos dinámicamente
const DynamicIcon = ({ iconName, size = 18 }: { iconName: string; size?: number }) => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
        console.warn(`Icono no encontrado: ${iconName}`);
        return <Icons.HelpCircle size={size} />;
    }
    return <IconComponent size={size} />;
};

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    
    // Filtrar el menú basado en el rol del usuario
    const menuSections = useMemo(() => {
        if (!usuarioSesion) {
            console.log('No hay usuario sesión');
            return [];
        }
        
        const rolIdNormalizado = normalizarRolId(usuarioSesion.IdRolUsuario);
        console.log('Generando menú para rol:', rolIdNormalizado, obtenerNombreRol(rolIdNormalizado));
        
        // Si es administrador (ID 1), mostrar todo el menú
        if (rolIdNormalizado === 1) {
            console.log('Usuario ADMINISTRADOR - Mostrando menú completo');
            return MENU_CONFIG;
        }
        
        // Para otros roles, filtrar según permisos
        const seccionesFiltradas = filtrarMenuPorRol(usuarioSesion);
        console.log(`Menú filtrado: ${seccionesFiltradas.length} secciones`);
        return seccionesFiltradas;
    }, [usuarioSesion]);
    
    const [expandedSections, setExpandedSections] = useState<string[]>([]);

    // Actualizar expandedSections cuando cambia el menú
    useEffect(() => {
        if (menuSections.length > 0 && expandedSections.length === 0) {
            const currentSection = location.pathname.split('/')[1].toLowerCase();
            const activeSection = menuSections.find(section => 
                section.id === currentSection
            );
            if (activeSection) {
                setExpandedSections([activeSection.id]);
            } else if (menuSections.length > 0) {
                setExpandedSections([menuSections[0].id]);
            }
        }
    }, [menuSections, location.pathname]);

    const toggleSection = useCallback((sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(s => s !== sectionId)
                : [...prev, sectionId]
        );
    }, []);

    const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);
    
    const isSectionExpanded = useCallback((sectionId: string) => 
        expandedSections.includes(sectionId), [expandedSections]);

    const handleNavClick = useCallback(() => {
        if (window.innerWidth <= 768) {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (window.innerWidth > 768 || !isOpen) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        const currentPath = location.pathname;
        const activeSection = menuSections.find(section => 
            section.subItems.some(item => item.path === currentPath)
        );
        
        if (activeSection && !expandedSections.includes(activeSection.id)) {
            setExpandedSections(prev => [...prev, activeSection.id]);
        }
    }, [location.pathname, menuSections]);

    useEffect(() => {
        const usuario = obtenerUsuarioSesion();
        console.log('Usuario cargado desde sesión:', usuario);
        
        if (usuario) {
            const rolIdNormalizado = normalizarRolId(usuario.IdRolUsuario);
            console.log('Detalles del usuario:', {
                nombre: usuario.Usuario,
                idRol: usuario.IdRolUsuario,
                tipoIdRol: typeof usuario.IdRolUsuario,
                rolNombre: usuario.RolUsuario,
                idRolNormalizado: rolIdNormalizado,
                nombreRol: obtenerNombreRol(rolIdNormalizado)
            });
        }
        
        setUsuarioSesion(usuario);
    }, []);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isOpen, onClose]);

    const renderNavigation = () => {
        if (!usuarioSesion) {
            return (
                <div className="nav-message">
                    <div className="spinner"></div>
                    <p>Cargando información de usuario...</p>
                </div>
            );
        }

        if (menuSections.length === 0) {
            const rolIdNormalizado = normalizarRolId(usuarioSesion.IdRolUsuario);
            return (
                <div className="nav-message">
                    <Icons.Shield size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No tienes acceso a ninguna opción</p>
                    <div className="debug-info">
                        <p><strong>Información:</strong></p>
                        <p>Usuario: {usuarioSesion.Usuario}</p>
                        <p>Rol ID: {usuarioSesion.IdRolUsuario} ({typeof usuarioSesion.IdRolUsuario})</p>
                        <p>Rol: {usuarioSesion.RolUsuario || obtenerNombreRol(rolIdNormalizado)}</p>
                        <p className="nav-submessage">Contacta al administrador para solicitar permisos</p>
                    </div>
                </div>
            );
        }

        return menuSections.map((section) => (
            <div key={section.id} className="sidebar-section">
                <button
                    className={`nav-item expandable ${isSectionExpanded(section.id) ? 'has-submenu' : ''}`}
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={isSectionExpanded(section.id)}
                    aria-controls={`submenu-${section.id}`}
                >
                    <div className="nav-item-content">
                        <DynamicIcon iconName={section.icon} size={18} />
                        <span>{section.title}</span>
                    </div>
                    {isSectionExpanded(section.id) ? 
                        <Icons.ChevronDown size={16} /> : 
                        <Icons.ChevronRight size={16} />
                    }
                </button>

                {isSectionExpanded(section.id) && section.subItems.length > 0 && (
                    <div 
                        id={`submenu-${section.id}`}
                        className="nav-submenu"
                        role="region"
                        aria-label={`${section.title} submenu`}
                    >
                        {section.subItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                                onClick={handleNavClick}
                                aria-current={isActive(item.path) ? 'page' : undefined}
                            >
                                <DynamicIcon iconName={item.icon} size={16} />
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        ));
    };

    const getAvatarColor = () => {
        const rolId = normalizarRolId(usuarioSesion?.IdRolUsuario);
        switch (rolId) {
            case 1: return '#ff6b6b'; // Administrador - Rojo
            case 2: return '#4ecdc4'; // Operaciones - Turquesa
            case 3: return '#45b7d1'; // Recursos Humanos - Azul
            case 4: return '#96ceb4'; // Báscula - Verde
            case 5: return '#feca57'; // Administrativo - Amarillo
            case 6: return '#a29bfe'; // Comercial - Morado
            default: return '#a8e6cf';
        }
    };

    const getRolInfo = () => {
        if (!usuarioSesion?.IdRolUsuario) {
            return { nombre: 'Sin rol', id: 'N/A', idNormalizado: null };
        }
        
        const rolIdNormalizado = normalizarRolId(usuarioSesion.IdRolUsuario);
        const rolNombre = usuarioSesion.RolUsuario || obtenerNombreRol(rolIdNormalizado);
        
        return {
            nombre: rolNombre,
            id: usuarioSesion.IdRolUsuario,
            idNormalizado: rolIdNormalizado
        };
    };

    const rolInfo = getRolInfo();

    return (
        <>
            {isOpen && window.innerWidth <= 768 && (
                <div 
                    className="sidebar-overlay" 
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            
            <div 
                ref={sidebarRef} 
                className={`sidebar ${!isOpen ? 'hidden' : ''}`}
                role="navigation"
                aria-label="Navegación principal"
            >
                <div className="sidebar-header">
                    <div className="logo">
                        <Link 
                            to="/menu" 
                            onClick={() => {
                                if (window.innerWidth <= 768 && isOpen) {
                                    onClose();
                                }
                            }}
                            style={{ display: 'block' }}
                            aria-label="Ir al inicio"
                        >
                            <img src={Seguridad} alt="ALPASA Logo" width={200} />
                        </Link>
                    </div>
                </div>

                <div className="user-section">
                    <div 
                        className="user-avatar"
                        style={{ backgroundColor: getAvatarColor() }}
                    >
                        {usuarioSesion?.Usuario?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <h3>{usuarioSesion?.Usuario || 'Usuario'}</h3>
                        <p>{usuarioSesion?.Descripcion || 'Cargando...'}</p>
                    </div>
                </div>

                <nav className="sidebar-nav" aria-label="Menú de navegación">
                    {renderNavigation()}
                </nav>
            </div>
        </>
    );
};