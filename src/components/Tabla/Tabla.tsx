import React, { useState, useMemo } from 'react';
import {
    ChevronUp,
    ChevronDown,
    Search,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    X,
    Filter,
    Download,
    Settings,
    Eye,
    EyeOff,
    RefreshCw,
    Edit,
    Trash2
} from 'lucide-react';
import { ImArrowLeft } from "react-icons/im";

import './Tabla.css';

export interface Column {
    key: string;
    title: string;
    sortable?: boolean;
    searchable?: boolean;
    filterable?: boolean;
    visible?: boolean;
    render?: (value: any, row: any, index: number) => React.ReactNode;
    width?: string | number;
    minWidth?: string | number;
    maxWidth?: string | number;
    align?: 'left' | 'center' | 'right';
    alignHeader?: 'left' | 'center' | 'right';
    cellClassName?: string;
    headerClassName?: string;
}

export interface DataTableProps {
    columns: Column[];
    data: any[];
    pageSize?: number;
    pageSizeOptions?: number[];
    className?: string;
    emptyMessage?: string;
    striped?: boolean;
    hoverable?: boolean;
    bordered?: boolean;
    compact?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
    showSearchSummary?: boolean;
    showColumnVisibility?: boolean;
    showExport?: boolean;
    showActions?: boolean;
    onEdit?: (row: any, index: number) => void;
    onDelete?: (row: any, index: number) => void;
    loading?: boolean;
    onRowClick?: (row: any, index: number) => void;
    rowClassName?: (row: any, index: number) => string;
    footerContent?: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortConfig {
    key: string;
    direction: SortDirection;
}

export const Tabla: React.FC<DataTableProps> = ({
    columns,
    data,
    pageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
    className = '',
    emptyMessage = 'No hay datos disponibles',
    striped = true,
    hoverable = true,
    bordered = false,
    compact = false,
    showHeader = true,
    showFooter = true,
    showSearchSummary = true,
    showColumnVisibility = false,
    showExport = false,
    showActions = true,
    onEdit,
    onDelete,
    loading = false,
    onRowClick,
    rowClassName,
    footerContent,
    title,
    subtitle,
    actions
}) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageSize, setCurrentPageSize] = useState(pageSize);
    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
        columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
    );
    const [showFilters, setShowFilters] = useState(false);

    const tableColumns = useMemo(() => {
        const baseColumns = [...columns];
        
        if (showActions && (onEdit || onDelete)) {
            const hasActionsColumn = baseColumns.some(col => col.key === '_actions');
            
            if (!hasActionsColumn) {
                baseColumns.push({
                    key: '_actions',
                    title: 'Acciones',
                    sortable: false,
                    searchable: false,
                    filterable: false,
                    visible: true,
                    width: '180px',
                    align: 'center',
                    alignHeader: 'center',
                    cellClassName: 'actions-cell',
                    headerClassName: 'actions-header',
                    render: (value: any, row: any, index: number) => (
                        <div className="actions-container">
                            {onEdit && (
                                <button 
                                    className="action-btn edit"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(row, index);
                                    }}
                                    title="Editar"
                                >
                                    <Edit size={16} />
                                    <span>Editar</span>
                                </button>
                            )}
                            {onDelete && (
                                <button 
                                    className="action-btn delete"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(row, index);
                                    }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={16} />
                                    <span>Eliminar</span>
                                </button>
                            )}
                        </div>
                    )
                });
            }
        }
        
        return baseColumns;
    }, [columns, showActions, onEdit, onDelete]);

    // Filter visible columns
    const visibleColumns = useMemo(() => 
        tableColumns.filter(col => columnVisibility[col.key] !== false),
        [tableColumns, columnVisibility]
    );

    // Filter data based on search terms
    const filteredData = useMemo(() => {
        return data.filter(row => {
            return Object.entries(searchTerms).every(([columnKey, searchTerm]) => {
                if (!searchTerm.trim()) return true;

                const value = row[columnKey];
                if (value === null || value === undefined) return false;

                return String(value).toLowerCase().includes(searchTerm.toLowerCase());
            });
        });
    }, [data, searchTerms]);

    // Sort filtered data
    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) {
            return filteredData;
        }

        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue);
            const bStr = String(bValue);
            const comparison = aStr.localeCompare(bStr);
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        });
    }, [filteredData, sortConfig]);

    // Paginate sorted data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * currentPageSize;
        return sortedData.slice(startIndex, startIndex + currentPageSize);
    }, [sortedData, currentPage, currentPageSize]);

    // Calculate pagination info
    const totalPages = Math.ceil(sortedData.length / currentPageSize);
    const startRecord = sortedData.length === 0 ? 0 : (currentPage - 1) * currentPageSize + 1;
    const endRecord = Math.min(currentPage * currentPageSize, sortedData.length);

    // Handlers
    const handleSort = (columnKey: string) => {
        const column = tableColumns.find(col => col.key === columnKey);
        if (!column?.sortable) return;

        setSortConfig(prev => {
            if (prev.key === columnKey) {
                if (prev.direction === 'asc') {
                    return { key: columnKey, direction: 'desc' };
                } else if (prev.direction === 'desc') {
                    return { key: '', direction: null };
                }
            }
            return { key: columnKey, direction: 'asc' };
        });
        setCurrentPage(1);
    };

    const handleSearch = (columnKey: string, value: string) => {
        setSearchTerms(prev => ({
            ...prev,
            [columnKey]: value
        }));
        setCurrentPage(1);
    };

    const clearSearch = (columnKey: string) => {
        setSearchTerms(prev => {
            const newTerms = { ...prev };
            delete newTerms[columnKey];
            return newTerms;
        });
        setCurrentPage(1);
    };

    const clearAllSearches = () => {
        setSearchTerms({});
        setCurrentPage(1);
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setCurrentPageSize(newPageSize);
        setCurrentPage(1);
    };

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const toggleColumnVisibility = (columnKey: string) => {
        setColumnVisibility(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const toggleAllColumns = () => {
        const allVisible = Object.values(columnVisibility).every(v => v);
        const newVisibility = tableColumns.reduce((acc, col) => ({
            ...acc,
            [col.key]: !allVisible
        }), {});
        setColumnVisibility(newVisibility);
    };

    const exportData = (format: 'csv' | 'json') => {
        const exportData = filteredData.map(row => {
            const obj: any = {};
            visibleColumns.forEach(col => {
                if (col.key !== '_actions') {
                    obj[col.title] = row[col.key];
                }
            });
            return obj;
        });

        if (format === 'csv') {
            const headers = visibleColumns
                .filter(col => col.key !== '_actions')
                .map(col => `"${col.title}"`)
                .join(',');
            const rows = exportData.map(row => 
                visibleColumns
                    .filter(col => col.key !== '_actions')
                    .map(col => `"${row[col.title] || ''}"`)
                    .join(',')
            ).join('\n');
            const csv = `${headers}\n${rows}`;
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `datos_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } else {
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `datos_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
        }
    };

    const getSortIcon = (columnKey: string) => {
        if (sortConfig.key !== columnKey) {
            return <ChevronUp size={14} className="sort-icon" />;
        }

        if (sortConfig.direction === 'asc') {
            return <ChevronUp size={14} className="sort-icon active" />;
        } else if (sortConfig.direction === 'desc') {
            return <ChevronDown size={14} className="sort-icon active" />;
        }

        return <ChevronUp size={14} className="sort-icon" />;
    };

    const hasActiveSearches = Object.values(searchTerms).some(term => term.trim().length > 0);
    const searchableColumns = tableColumns.filter(col => col.searchable && col.key !== '_actions');

    // Generate page numbers for display
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            if (currentPage <= 3) {
                end = 4;
            } else if (currentPage >= totalPages - 2) {
                start = totalPages - 3;
            }

            if (start > 2) pages.push('...');
            
            for (let i = start; i <= end; i++) pages.push(i);
            
            if (end < totalPages - 1) pages.push('...');
            if (totalPages > 1) pages.push(totalPages);
        }

        return pages;
    };

    return (
        <div className={`data-table-wrapper ${className} ${bordered ? 'bordered' : ''}`}>
            {/* Table Header with Title and Actions */}
            {(title || actions) && (
                <div className="table-header-section">
                    <div className="table-title-group">
                        {title && <h2 className="table-title">{title}</h2>}
                        {subtitle && <p className="table-subtitle">{subtitle}</p>}
                    </div>
                    {actions && <div className="table-actions">{actions}</div>}
                </div>
            )}

            {/* Toolbar */}
            <div className="table-toolbar">
                <div className="toolbar-left">
                    {showColumnVisibility && (
                        <div className="dropdown">
                            <button 
                                className="toolbar-btn"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Settings size={16} />
                                <span>Columnas</span>
                            </button>
                            {showFilters && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-header">
                                        <span>Visibilidad de Columnas</span>
                                        <button 
                                            className="dropdown-toggle-all"
                                            onClick={toggleAllColumns}
                                        >
                                            {Object.values(columnVisibility).every(v => v) ? 'Ocultar todas' : 'Mostrar todas'}
                                        </button>
                                    </div>
                                    {tableColumns.map((column) => (
                                        column.key !== '_actions' && (
                                            <label key={column.key} className="dropdown-item">
                                                <input
                                                    type="checkbox"
                                                    checked={columnVisibility[column.key] !== false}
                                                    onChange={() => toggleColumnVisibility(column.key)}
                                                />
                                                <span className="dropdown-item-label">{column.title}</span>
                                                {columnVisibility[column.key] !== false ? 
                                                    <Eye size={14} /> : 
                                                    <EyeOff size={14} />
                                                }
                                            </label>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {searchableColumns.length > 0 && (
                        <button 
                            className="toolbar-btn"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={16} />
                            <span>Filtros</span>
                            {hasActiveSearches && <span className="badge">{Object.keys(searchTerms).length}</span>}
                        </button>
                    )}

                    {showExport && (
                        <div className="dropdown">
                            <button className="toolbar-btn">
                                <Download size={16} />
                                <span>Exportar</span>
                            </button>
                            <div className="dropdown-menu">
                                <button className="dropdown-item" onClick={() => exportData('csv')}>
                                    CSV
                                </button>
                                <button className="dropdown-item" onClick={() => exportData('json')}>
                                    JSON
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="toolbar-right">
                    <div className="records-count">
                        {sortedData.length} registros
                    </div>
                    <button 
                        className="toolbar-btn icon-only"
                        onClick={clearAllSearches}
                        title="Limpiar filtros"
                        disabled={!hasActiveSearches}
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
            </div>

            {/* Search Filters */}
            {showFilters && searchableColumns.length > 0 && (
                <div className="search-filters-panel">
                    <div className="filters-header">
                        <h4>Filtros de Búsqueda</h4>
                        {hasActiveSearches && (
                            <button 
                                className="clear-all-btn"
                                onClick={clearAllSearches}
                            >
                                <X size={14} />
                                Limpiar todos
                            </button>
                        )}
                    </div>
                    <div className="filters-grid">
                        {searchableColumns.map((column) => (
                            <div key={`search-${column.key}`} className="filter-field">
                                <label className="filter-label">{column.title}</label>
                                <div className="input-with-icon">
                                    <Search size={14} />
                                    <input
                                        type="text"
                                        placeholder={`Buscar en ${column.title.toLowerCase()}...`}
                                        value={searchTerms[column.key] || ''}
                                        onChange={(e) => handleSearch(column.key, e.target.value)}
                                    />
                                    {searchTerms[column.key] && (
                                        <button 
                                            className="clear-input"
                                            onClick={() => clearSearch(column.key)}
                                        >
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Summary */}
            {showSearchSummary && hasActiveSearches && (
                <div className="search-summary">
                    <div className="summary-content">
                        <span className="summary-text">
                            <strong>{Object.keys(searchTerms).length}</strong> filtro(s) activo(s) - 
                            Mostrando <strong>{sortedData.length}</strong> de <strong>{data.length}</strong> registros
                        </span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Cargando datos...</p>
                </div>
            ) : (
                <>
                    {/* Table Container */}
                    <div className="table-container">
                        <div className="table-scroll">
                            <table className={`data-table ${striped ? 'striped' : ''} ${compact ? 'compact' : ''}`}>
                                {showHeader && (
                                    <thead>
                                        <tr>
                                            {visibleColumns.map((column) => (
                                                <th
                                                    key={column.key}
                                                    className={`table-header ${column.sortable ? 'sortable' : ''} ${column.headerClassName || ''}`}
                                                    style={{ 
                                                        width: column.width,
                                                        minWidth: column.minWidth,
                                                        maxWidth: column.maxWidth,
                                                        textAlign: column.alignHeader
                                                    }}
                                                    onClick={() => column.sortable && handleSort(column.key)}
                                                >
                                                    <div className="header-content">
                                                        <span className="header-title">{column.title}</span>
                                                        {column.sortable && getSortIcon(column.key)}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                )}

                                <tbody>
                                    {paginatedData.length === 0 ? (
                                        <tr>
                                            <td colSpan={visibleColumns.length} className="empty-state">
                                                <div className="empty-content">
                                                    <Search size={48} className="empty-icon" />
                                                    <p className="empty-message">{emptyMessage}</p>
                                                    {hasActiveSearches && (
                                                        <button
                                                            className="secondary-btn"
                                                            onClick={clearAllSearches}
                                                        >
                                                            Limpiar filtros
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedData.map((row, rowIndex) => {
                                            const globalIndex = (currentPage - 1) * currentPageSize + rowIndex;
                                            return (
                                                <tr 
                                                    key={globalIndex}
                                                    className={`
                                                        table-row 
                                                        ${hoverable ? 'hoverable' : ''}
                                                        ${rowClassName ? rowClassName(row, globalIndex) : ''}
                                                        ${onRowClick ? 'clickable' : ''}
                                                    `}
                                                    onClick={() => onRowClick && onRowClick(row, globalIndex)}
                                                >
                                                    {visibleColumns.map((column) => (
                                                        <td 
                                                            key={column.key} 
                                                            className={`table-cell ${column.cellClassName || ''}`}
                                                            style={{ textAlign: column.align || 'left' }}
                                                        >
                                                            {column.render
                                                                ? column.render(row[column.key], row, rowIndex)
                                                                : row[column.key] !== null && row[column.key] !== undefined 
                                                                    ? String(row[column.key])
                                                                    : '-'
                                                            }
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>

                                {showFooter && footerContent && (
                                    <tfoot>
                                        <tr>
                                            <td colSpan={visibleColumns.length}>
                                                {footerContent}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {sortedData.length > 0 && (
                        <div className="pagination-wrapper">
                            <div className="pagination-info">
                                <div className="page-size-control">
                                    <label>Mostrar:</label>
                                    <select
                                        value={currentPageSize}
                                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                    >
                                        {pageSizeOptions.map(size => (
                                            <option key={size} value={size}>{size}</option>
                                        ))}
                                    </select>
                                    <span>por página</span>
                                </div>

                                <div className="records-display">
                                    <span>
                                        {startRecord}-{endRecord} de {sortedData.length}
                                        {data.length !== sortedData.length && (
                                            <span className="filtered"> (filtrado de {data.length})</span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="pagination-controls">
                                <button
                                    className="pagination-btn first"
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                    title="Primera página"
                                >
                                    <ChevronsLeft size={20} className='paginationicon'/>
                                </button>

                                <button
                                    className="pagination-btn prev"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    title="Página anterior"
                                >
                                    <ChevronLeft size={20} className='paginationicon'/>
                                </button>

                                <div className="page-numbers">
                                    {getPageNumbers().map((page, index) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${index}`} className="page-ellipsis">...</span>
                                        ) : (
                                            <button
                                                key={page}
                                                className={`page-number ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => goToPage(Number(page))}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>

                                <button
                                    className="pagination-btn next"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    title="Página siguiente"
                                >
                                    <ChevronRight size={20} className='paginationicon'/>
                                </button>

                                <button
                                    className="pagination-btn last"
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    title="Última página"
                                >
                                    <ChevronsRight size={20} className='paginationicon'/>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};