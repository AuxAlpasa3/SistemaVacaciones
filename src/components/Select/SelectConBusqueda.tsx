import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react'; 

import './SelectConBusqueda.css';
export interface OpcionSelectBusqueda {
    id: string | number; 
    valor: string;
}


interface SelectConBusquedaProps {
    options: OpcionSelectBusqueda[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    showClearButton?: boolean; 
    onClear?: () => void;
}

export const SelectConBusqueda: React.FC<SelectConBusquedaProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Seleccionar...',
    required = false,
    disabled = false,
    showClearButton = false,
    onClear 
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLabel, setSelectedLabel] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter(option =>
        option.valor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const compareIds = (id1: string | number, id2: string | number): boolean => {
        return String(id1) === String(id2);
    };

    useEffect(() => {
        if (value) {
            const selectedOption = options.find(option => 
                compareIds(option.id, value)
            );
            setSelectedLabel(selectedOption ? selectedOption.valor : '');
        } else {
            setSelectedLabel('');
        }
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (option: OpcionSelectBusqueda) => {
        onChange(String(option.id));
        setIsOpen(false);
        setSearchTerm('');
        if (inputRef.current) {
            inputRef.current.blur();
        }
    };

    const handleClear = () => {
        onChange('');
        setSearchTerm('');
        setSelectedLabel('');
        setIsOpen(false);
        
        if (onClear) {
            onClear();
        }
        
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleInputFocus = () => {
        setIsOpen(true);
        setSearchTerm('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    return (
        <div className="select-con-busqueda-container" ref={dropdownRef}>
            <div className="select-con-busqueda-input-wrapper">
                <div className="select-con-busqueda-input-container">
                    <input
                        ref={inputRef}
                        type="text"
                        value={isOpen ? searchTerm : selectedLabel}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        placeholder={selectedLabel || placeholder}
                        className="select-con-busqueda-input"
                        disabled={disabled}
                        required={required}
                    />
                    <div className="select-con-busqueda-icons">
                        {showClearButton && value && !disabled && (
                            <button
                                type="button"
                                className="clear-button"
                                onClick={handleClear}
                                title="Limpiar selección"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
                
                {isOpen && (
                    <div className="select-con-busqueda-dropdown">
                        {filteredOptions.length === 0 ? (
                            <div className="select-con-busqueda-no-results">
                                No se encontraron resultados
                            </div>
                        ) : (
                            <div className="select-con-busqueda-options">
                                {filteredOptions.map(option => {
                                    const isSelected = compareIds(option.id, value);
                                    return (
                                        <div
                                            key={String(option.id)} // Usar string como key
                                            className={`select-con-busqueda-option ${
                                                isSelected ? 'selected' : ''
                                            }`}
                                            onClick={() => handleSelect(option)}
                                        >
                                            {option.valor}
                                            {isSelected && (
                                                <span className="selected-indicator">✓</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};