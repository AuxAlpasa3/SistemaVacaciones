import React, { useState, useRef, useEffect } from 'react';
import { Eye, Pen, Trash2, Key, MoreVertical } from 'lucide-react';
import './Dropdown.css';

interface ActionDropdownProps {
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onPasswordChange?: () => void;
    customActions?: {
        label: string;
        icon?: React.ReactNode;
        action: () => void;
        variant?: 'default' | 'danger' | 'warning';
    }[];
    align?: 'left' | 'right';
    triggerIcon?: React.ReactNode;
}

const CustomDropdown: React.FC<ActionDropdownProps> = ({
    onEdit,
    onDelete,
    onView,
    onPasswordChange,
    customActions = [],
    align = 'right',
    triggerIcon,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleAction = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    const actions = [
        { 
            condition: onView, 
            icon: <Eye size={16} />, 
            label: 'Ver', 
            action: onView,
            variant: 'default' as const
        },
        { 
            condition: onEdit, 
            icon: <Pen size={16} />, 
            label: 'Editar', 
            action: onEdit,
            variant: 'default' as const
        },
        { 
            condition: onPasswordChange, 
            icon: <Key size={16} />, 
            label: 'Cambiar Contraseña', 
            action: onPasswordChange,
            variant: 'warning' as const
        },
        ...customActions.map(ca => ({ 
            condition: true, 
            icon: ca.icon, 
            label: ca.label, 
            action: ca.action,
            variant: ca.variant || 'default',
            isCustom: true 
        })),
        { 
            condition: onDelete, 
            icon: <Trash2 size={16} />, 
            label: 'Eliminar', 
            action: onDelete, 
            variant: 'danger' as const
        },
    ].filter(item => item.condition);

    const getItemClassName = (variant: string) => {
        const baseClass = 'dropdown-item';
        if (variant === 'danger') return `${baseClass} dropdown-item--danger`;
        if (variant === 'warning') return `${baseClass} dropdown-item--warning`;
        return baseClass;
    };

    return (
        <div className="action-dropdown" ref={dropdownRef}>
            <button 
                className="dropdown-toggle" 
                onClick={toggleDropdown}
                aria-expanded={isOpen}
                aria-haspopup="true"
                aria-label="Menú de acciones"
            >
                {triggerIcon || <MoreVertical size={18} />}
            </button>

            {isOpen && (
                <div className={`dropdown-menu dropdown-menu--${align}`} role="menu">
                    {actions.map((action, index) => (
                        <React.Fragment key={action.label || `action-${index}`}>
                            <button 
                                className={getItemClassName(action.variant)}
                                onClick={() => handleAction(action.action!)}
                                role="menuitem"
                                type="button"
                            >
                                <span className="dropdown-icon">
                                    {action.icon}
                                </span>
                                <span className="dropdown-label">
                                    {action.label}
                                </span>
                            </button>
                            {index < actions.length - 1 && (
                                <hr className="dropdown-divider" />
                            )}
                        </React.Fragment>
                    ))}
                    
                    {actions.length === 0 && (
                        <div className="dropdown-empty">
                            No hay acciones disponibles
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;