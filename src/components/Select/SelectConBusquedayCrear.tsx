import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X, Check } from 'lucide-react';
import './SelectConBusquedayCrear.css';

interface SelectConBusquedayCrearProps {
    options: Array<{ id: string; valor: string }>;
    value: string;
    onChange: (value: string, isNew?: boolean) => void;
    placeholder?: string;
    onCreateNew?: (newValue: string) => Promise<boolean>;
    loading?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowCreate?: boolean;
    forceUppercase?: boolean;
}

export const SelectConBusquedayCrear: React.FC<SelectConBusquedayCrearProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Buscar o agregar nuevo...',
    onCreateNew,
    loading = false,
    required = false,
    disabled = false,
    allowCreate = true,
    forceUppercase = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateOption, setShowCreateOption] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [pendingCreation, setPendingCreation] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find(opt => opt.id === value);

    const filteredOptions = options.filter(option =>
        option.valor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let newSearchTerm = e.target.value;
        
        if (forceUppercase) {
            newSearchTerm = newSearchTerm.toUpperCase();
        }
        
        setSearchTerm(newSearchTerm);
        
        const exactMatchExists = options.some(opt => 
            opt.valor.toLowerCase() === newSearchTerm.toLowerCase()
        );
        
        if (allowCreate && newSearchTerm.trim() && !exactMatchExists) {
            setShowCreateOption(true);
        } else {
            setShowCreateOption(false);
        }
    };

    const handleCreateNew = async () => {
        if (!searchTerm.trim() || !onCreateNew || isCreating) return;

        setIsCreating(true);
        const creationValue = searchTerm.trim();
        
        try {
            const formattedValue = forceUppercase ? creationValue.toUpperCase() : creationValue;
            const success = await onCreateNew(formattedValue);
            
            if (success) {
                setPendingCreation(creationValue);
                setSearchTerm('');
                setShowCreateOption(false);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error creando nuevo registro:', error);
        } finally {
            setIsCreating(false);
        }
    };

    useEffect(() => {
        if (pendingCreation && options.length > 0) {
            const newOption = options.find(opt => 
                opt.valor.toLowerCase() === pendingCreation.toLowerCase()
            );
            
            if (newOption) {
                onChange(newOption.id, true);
                setPendingCreation(null);
            }
        }
    }, [options, pendingCreation, onChange]);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
        setShowCreateOption(false);
    };

    const handleClear = () => {
        onChange('');
        setSearchTerm('');
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsOpen(false);
            setSearchTerm('');
            setShowCreateOption(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div className="searchable-select-container" ref={containerRef}>
            <div className="select-trigger" onClick={() => !disabled && setIsOpen(true)}>
                {selectedOption ? (
                    <div className="selected-value">
                        {forceUppercase ? selectedOption.valor.toUpperCase() : selectedOption.valor}
                        {!disabled && (
                            <button 
                                className="clear-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="placeholder">
                        {placeholder}
                        {required && <span className="required-star">*</span>}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="dropdown-container">
                    <div className="search-input-container">
                        <Search size={16} className="search-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Buscar..."
                            className="search-input"
                            disabled={disabled}
                            style={forceUppercase ? { textTransform: 'uppercase' } : undefined}
                        />
                        {loading && (
                            <div className="loading-indicator">
                                <div className="spinner-small"></div>
                            </div>
                        )}
                    </div>

                    <div className="options-list">
                        {filteredOptions.length > 0 && (
                            <>
                                {filteredOptions.map(option => (
                                    <div
                                        key={option.id}
                                        className={`option-item ${value === option.id ? 'selected' : ''}`}
                                        onClick={() => handleSelect(option.id)}
                                    >
                                        {forceUppercase ? option.valor.toUpperCase() : option.valor}
                                        {value === option.id && <Check size={14} className="check-icon" />}
                                    </div>
                                ))}
                            </>
                        )}
                        
                        {showCreateOption && allowCreate && (
                            <div 
                                className={`create-option ${isCreating ? 'creating' : ''}`}
                                onClick={!isCreating ? handleCreateNew : undefined}
                            >
                                <Plus size={14} />
                                <span>
                                    Crear: <strong>
                                        {forceUppercase ? searchTerm.toUpperCase() : searchTerm}
                                    </strong>
                                </span>
                                {isCreating && (
                                    <div className="creating-spinner"></div>
                                )}
                            </div>
                        )}
                        
                        {filteredOptions.length === 0 && !showCreateOption && searchTerm && (
                            <div className="no-results">
                                No se encontraron resultados
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};