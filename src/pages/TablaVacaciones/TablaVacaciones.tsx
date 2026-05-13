import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './tablaVacaciones.css';
// INTERFACES
import type { InterfacetablaVacaciones } from '../../interfaces/tablaVacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { CatalogoUsuario} from '../../interfaces/Usuario';
// HELPERS
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
// API
import { apiService } from '../../api/apiService';

// Función para formatear antigüedad
const formatAntiguedad = (antiguedad: string | number): string => {
    const años = parseInt(String(antiguedad));
    if (isNaN(años)) return String(antiguedad);
    return años === 1 ? `${años} año` : `${años} años`;
};

// Función para formatear días
const formatDias = (dias: string | number): string => {
    const cantidad = parseInt(String(dias));
    if (isNaN(cantidad)) return String(dias);
    return `${cantidad} ${cantidad === 1 ? 'día' : 'días'}`;
};

// Componente memoizado para los botones de acción
const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onEdit,
    onDelete
}: {
    row: any,
    openActionDropdown: string | null,
    setOpenActionDropdown: (IdtablaVacaciones: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdtablaVacaciones ? null : row.IdtablaVacaciones)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdtablaVacaciones && (
            <div className="actions-dropdown-menu">
                <button className="actions-dropdown-item edit-action" onClick={() => { onEdit(row); setOpenActionDropdown(null); }}>
                    <Edit size={14} />
                    <span>Editar</span>
                </button>
                <div className="actions-dropdown-divider"></div>
                <button className="actions-dropdown-item delete-action" onClick={() => { onDelete(row); setOpenActionDropdown(null); }}>
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                </button>
            </div>
        )}
    </div>
));

export const TablaVacaciones: React.FC = () => {

    const [tablaVacacionesForm, settablaVacacionesForm] = useState<InterfacetablaVacaciones>({
        IdTablaVacaciones: '',
        Antiguedad: '',
        Dias: ''
    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [tablaVacaciones, settablaVacaciones] = useState<InterfacetablaVacaciones[]>([]);

    const [listadotablaVacaciones, setListadotablaVacaciones] = useState<InterfacetablaVacaciones[] | []>([]);
    const [loading, setLoading] = useState(false);
    const [TipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);

    useEffect(() => {
        const fetchtablaVacacionesListado = async () => {
            try {
                if (tablaVacacionesForm.IdTablaVacaciones != '') {
                    const listadotablaVacacioness = await obtenertablaVacaciones();
                    setListadotablaVacaciones(listadotablaVacacioness as InterfacetablaVacaciones[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de tablaVacaciones', type: 'error' });
            }
        }

        fetchtablaVacacionesListado();
    }, [tablaVacacionesForm.IdTablaVacaciones]);

    const obtenertablaVacaciones = async () => {
        try {
            const config = {};
            const listadotablaVacaciones: any = await apiService.get<RespuestaAPI>('/tablaVacaciones/Crud.php?IdTablaVacaciones=' + tablaVacacionesForm.IdTablaVacaciones, config);

            return listadotablaVacaciones || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdTablaVacaciones',
            title: 'ID tablaVacaciones',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'Antiguedad',
            title: 'Antigüedad',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center',
            render: (value, row) => formatAntiguedad(value) // Formato aplicado aquí
        },
        {
            key: 'Dias',
            title: 'Días',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center',
            render: (value, row) => formatDias(value) // Formato aplicado aquí
        },
        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '120px',
            align: 'center',
            render: (_, row) => (
                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    onEdit={handleEditSolicitud}
                    onDelete={handleDeleteSolicitud}
                />
            )
        }
    ], [openActionDropdown]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        settablaVacacionesForm((prev: any) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchtablaVacaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/tablaVacaciones/obtenerListado.php');
            if (response.status && response.data) {
                const tablaVacacionesData = response.data as InterfacetablaVacaciones[];
                settablaVacaciones(tablaVacacionesData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar tablaVacaciones',
                    type: 'error',
                    autoClose: 1500
                });
                settablaVacaciones([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar tablaVacaciones',
                type: 'error',
                autoClose: 1500
            });
            settablaVacaciones([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const datosNormalizados = {
                ...tablaVacacionesForm,
                Antiguedad: tablaVacacionesForm.Antiguedad.trim().toUpperCase(),
                Dias: tablaVacacionesForm.Dias.trim().toUpperCase()
            };

            const isUpdate = tablaVacaciones.some(p => p.IdTablaVacaciones === tablaVacacionesForm.IdTablaVacaciones);
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/tablaVacaciones/crud.php?IdTablaVacaciones=${tablaVacacionesForm.IdTablaVacaciones}&IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/tablaVacaciones/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            }
            showToast({
                text: response.message || (isUpdate ? 'tablaVacaciones actualizada correctamente' : 'tablaVacaciones guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchtablaVacaciones();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el tablaVacaciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [tablaVacacionesForm, fetchtablaVacaciones]);

    const handleEditSolicitud = useCallback((tablaVacaciones: InterfacetablaVacaciones) => {
        setTipoFormulario('Modificar');
        settablaVacacionesForm(tablaVacaciones);
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (tablaVacaciones: InterfacetablaVacaciones) => {
        if (window.confirm('¿Está seguro de que desea eliminar este tablaVacaciones?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/tablaVacaciones/crud.php?IdTablaVacaciones=${tablaVacaciones.IdTablaVacaciones}&IdUsuario=${usuarioSesion?.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'tablaVacaciones eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchtablaVacaciones();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar tablaVacaciones',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar tablaVacaciones',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchtablaVacaciones]);

    const resetForm = useCallback(() => {
        settablaVacacionesForm({
            IdTablaVacaciones: '',
            Antiguedad: '',
            Dias: ''
        });
    }, []);

    useEffect(() => {
        fetchtablaVacaciones();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchtablaVacaciones]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionDropdown && !(event.target as HTMLElement).closest('.actions-dropdown-container')) {
                setOpenActionDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openActionDropdown]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !showForm) {
                event.preventDefault();
                setShowForm(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    useEffect(() => {
        document.body.style.overflow = showForm ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm]);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
    }, [resetForm]);

    return (
        <div className="tablaVacaciones-container">
            <div className="tablaVacaciones-header">
                <h1 className="page-title-tablaVacaciones">Catálogo de tablaVacaciones</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo tablaVacaciones
                    </button>
                </div>
            </div>

            <div className="tablaVacaciones-content">
                <Tabla
                    columns={tableColumns}
                    data={tablaVacaciones}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron tablaVacaciones"
                    className="full-height-table"
                />
            </div>

            {showForm && (
                <div className="form-tablaVacaciones-modal-overlay">
                    <div className="form-tablaVacaciones-modal">
                        <div className="form-tablaVacaciones-modal-header">
                            <h2 className="form-tablaVacaciones-modal-title">
                                {TipoFormulario === 'Modificar' ? 'Editar tablaVacaciones' : 'Registro de tablaVacaciones'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-tablaVacaciones-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-tablaVacaciones-row">
                                    <div className="form-tablaVacaciones-group">
                                        <label htmlFor='Antiguedad' className="form-tablaVacaciones-label">Antigüedad (años):</label>
                                        <input
                                            type="number"
                                            name="Antiguedad"
                                            value={tablaVacacionesForm.Antiguedad}
                                            onChange={handleInputChange}
                                            className="form-tablaVacaciones-input"
                                            placeholder="Ej: 1, 2, 3..."
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                </div>

                                <div className="form-tablaVacaciones-row">
                                    <div className="form-tablaVacaciones-group">
                                        <label htmlFor='Dias' className="form-tablaVacaciones-label">Días:</label>
                                        <input
                                            type="number"
                                            name="Dias"
                                            value={tablaVacacionesForm.Dias}
                                            onChange={handleInputChange}
                                            className="form-tablaVacaciones-input"
                                            placeholder="Ej: 12, 15, 20..."
                                            min="0"
                                            step="1"
                                        />
                                    </div>
                                </div>

                                <div className="form-tablaVacaciones-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                            setTipoFormulario('Agregar');
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        <FileText size={16} />
                                        {submitting ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};