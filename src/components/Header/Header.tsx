import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Menu,
    User,
    LogOut,
    Settings,
    UserCircle,
    Expand,
    Shrink
} from 'lucide-react';
import './Header.css';
import { eliminarLocalStorageKey } from '../../helpers/localStorage';
import { useNavigate } from 'react-router-dom';
import type { Usuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';

interface HeaderProps {
    onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
    const navigate = useNavigate();
    const [fullScreen, setFullScreen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);

    const userDropdownRef = useRef<HTMLDivElement>(null);

    const toggleUserDropdown = useCallback(() => {
        setUserDropdownOpen(prev => !prev);
    }, []);

    const closeUserDropdown = useCallback(() => {
        setUserDropdownOpen(false);
    }, []);

    const handleLogout = useCallback(() => {
        eliminarLocalStorageKey('zk1dp');
        navigate('/');
        closeUserDropdown();
    }, [navigate, closeUserDropdown]);

    const toggleFullScreen = useCallback(() => {
        const element = document.documentElement;

        if (!document.fullscreenElement) {
            element.requestFullscreen()
                .then(() => setFullScreen(true))
                .catch(err => {
                    console.error(`Error al intentar pantalla completa: ${err.message}`);
                });
        } else {
            document.exitFullscreen()
                .then(() => setFullScreen(false))
                .catch(err => {
                    console.error(`Error al salir de pantalla completa: ${err.message}`);
                });
        }
    }, []);

    // Effects
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
                closeUserDropdown();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [closeUserDropdown]);

    useEffect(() => {
        const handleFullScreenChange = () => {
            setFullScreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, []);

    useEffect(() => {
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, []);

    // User dropdown component
    const UserDropdown = () => (
        <div className="user-dropdown">
            <div className="user-dropdown-header">
                <div className="user-dropdown-avatar">
                    <UserCircle size={32} />
                </div>
                <div className="user-dropdown-info">
                    <h4>{usuarioSesion?.Usuario || 'Usuario'}</h4>
                </div>
            </div>

            {/* <div className="user-dropdown-divider"></div> */}

            <div className="user-dropdown-menu">
               {/*  <button 
                    className="user-dropdown-item" 
                    onClick={() => 
                    aria-label="Perfil"
                >
                    <Settings size={16} />
                    <span>Perfil</span>
                </button>
 */}
                <button 
                    className="user-dropdown-item logout-item" 
                    onClick={handleLogout}
                    aria-label="Cerrar sesión"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );

    return (
    <header className="header header-extra-compact">
            <div className="header-left">
                <button 
                    className="menu-toggle" 
                    onClick={onMenuToggle}
                    aria-label="Alternar menú"
                >
                    <Menu size={20} />
                </button>
            </div>

            <div className="header-right">
                {/* Fullscreen Toggle */}
                <button 
                    className="notification-btn" 
                    onClick={toggleFullScreen}
                    aria-label={fullScreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                    {fullScreen ? <Shrink size={20} /> : <Expand size={20} />}
                </button>

                {/* User Dropdown */}
                <div className="user-dropdown-container" ref={userDropdownRef}>
                    <button
                        className={`notification-btn user-btn ${userDropdownOpen ? 'active' : ''}`}
                        onClick={toggleUserDropdown}
                        aria-label="Menú de usuario"
                        aria-expanded={userDropdownOpen}
                    >
                        <User size={20} />
                    </button>

                    {userDropdownOpen && <UserDropdown />}
                </div>
            </div>
        </header>
    );
};