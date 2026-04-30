import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, Check, AlertCircle } from 'lucide-react';
import './LocalClientSearch.css';

interface Cliente {
    id: string;
    valor: string;
    cardCode: string;
    cardName: string;
    rfc?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
}

interface LocalClientSearchProps {
    clientes: Cliente[];
    value?: string;
    codigoCliente?: string;
    onChange: (cliente: { id: string; valor: string; cardCode: string; cardName: string } | null) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    mostrarDetalles?: boolean;
    permitirTextoLibre?: boolean;
}

export const LocalClientSearch: React.FC<LocalClientSearchProps> = ({
    clientes,
    value,
    codigoCliente,
    onChange,
    placeholder = "Buscar cliente por código o nombre...",
    disabled = false,
    required = false,
    mostrarDetalles = false,
    permitirTextoLibre = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredClients, setFilteredClients] = useState<Cliente[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selectedClient = useMemo(() => {
        if (!clientes.length) return null;
        if (codigoCliente) {
            return clientes.find(c => 
                c.id === codigoCliente || 
                c.cardCode === codigoCliente ||
                c.cardCode?.toUpperCase() === codigoCliente.toUpperCase()
            ) || null;
        }
        if (value) {
            return clientes.find(c => 
                c.valor === value || 
                c.cardName === value ||
                c.cardName?.toUpperCase().includes(value.toUpperCase())
            ) || null;
        }
        return null;
    }, [clientes, codigoCliente, value]);

    useEffect(() => {
        if (!clientes.length) {
            setFilteredClients([]);
            return;
        }
        if (!searchTerm.trim()) {
            setFilteredClients(clientes.slice(0, 50));
            setSelectedIndex(-1);
        } else {
            const term = searchTerm.toLowerCase().trim();
            const filtered = clientes.filter(c => {
                const searchableText = [
                    c.cardCode,
                    c.cardName,
                    c.rfc,
                    c.valor
                ].filter(Boolean).join(' ').toLowerCase();
                return searchableText.includes(term);
            });
            setFilteredClients(filtered.slice(0, 100));
            setSelectedIndex(-1);
        }
    }, [searchTerm, clientes]);

    useEffect(() => {
        if (selectedIndex >= 0 && listRef.current) {
            const items = listRef.current.children;
            if (items[selectedIndex]) {
                items[selectedIndex].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedIndex]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                setIsOpen(true);
                e.preventDefault();
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => prev < filteredClients.length - 1 ? prev + 1 : prev);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && filteredClients[selectedIndex]) {
                    handleSelect(filteredClients[selectedIndex]);
                } else if (permitirTextoLibre && searchTerm.trim()) {
                    handleTextOnly(searchTerm);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                setSearchTerm('');
                break;
            case 'Tab':
                setIsOpen(false);
                break;
        }
    };

    const handleSelect = (cliente: Cliente) => {
        onChange({
            id: cliente.cardCode,
            valor: `${cliente.cardCode} - ${cliente.cardName}`,
            cardCode: cliente.cardCode,
            cardName: cliente.cardName
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleTextOnly = (text: string) => {
        onChange({
            id: text,
            valor: text,
            cardCode: text,
            cardName: text
        });
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        onChange(null);
        setSearchTerm('');
    };

    const handleFocus = () => {
        if (!disabled) {
            setIsOpen(true);
        }
    };

    return (
        <div className={`local-client-search ${disabled ? 'disabled' : ''} ${isOpen ? 'open' : ''}`} ref={wrapperRef}>
            <div 
                className={`client-search-input ${disabled ? 'disabled' : ''} ${isOpen ? 'focus' : ''}`}
                onClick={handleFocus}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {selectedClient ? (
                    <div className="selected-client">
                        <span className="client-code-badge">{selectedClient.cardCode}</span>
                        <span className="client-name">{selectedClient.cardName}</span>
                        {!disabled && (
                            <button 
                                type="button"
                                className="clear-client-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleClear();
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="search-placeholder">
                        <Search size={18} className="search-icon" />
                        <span>{placeholder}</span>
                    </div>
                )}
            </div>

            {isOpen && !disabled && (
                <div className="client-dropdown">
                    <div className="client-search-box">
                        <Search size={18} className="search-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe para buscar..."
                            autoFocus
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    
                    <div className="client-list" ref={listRef} role="listbox">
                        {filteredClients.length === 0 ? (
                            permitirTextoLibre && searchTerm ? (
                                <div 
                                    className="text-only-option"
                                    onClick={() => handleTextOnly(searchTerm)}
                                    role="option"
                                >
                                    <AlertCircle size={16} className="warning-icon" />
                                    <span>Usar: <strong>"{searchTerm}"</strong></span>
                                </div>
                            ) : (
                                <div className="no-results">
                                    No se encontraron clientes
                                </div>
                            )
                        ) : (
                            <>
                                {filteredClients.map((cliente, index) => (
                                    <div
                                        key={cliente.id}
                                        className={`client-item ${selectedClient?.id === cliente.id ? 'selected' : ''} ${index === selectedIndex ? 'highlighted' : ''}`}
                                        onClick={() => handleSelect(cliente)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                        role="option"
                                        aria-selected={selectedClient?.id === cliente.id}
                                    >
                                        <div className="client-info">
                                            <span className="client-code">{cliente.cardCode}</span>
                                            <span className="client-name">{cliente.cardName}</span>
                                        </div>
                                        {selectedClient?.id === cliente.id && (
                                            <Check size={18} className="check-icon" />
                                        )}
                                        {mostrarDetalles && cliente.rfc && (
                                            <div className="client-details">
                                                RFC: {cliente.rfc}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {clientes.length > filteredClients.length && (
                                    <div className="more-results">
                                        Mostrando {filteredClients.length} de {clientes.length} clientes
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};