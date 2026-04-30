import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Eye,Edit, Trash2, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './vacaciones.css';
// INTERFACES
import type { InterfaceVacaciones } from '../../interfaces/Vacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
// HELPERS
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
// API
import { apiService } from '../../api/apiService';

// Componente memoizado para los botones de acción
const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onEdit,
    onDelete,
    onView
}: {
    row: InterfaceVacaciones;
    openActionDropdown: number | null;
    setOpenActionDropdown: (id: number | null) => void;
    onEdit: (row: InterfaceVacaciones) => void;
    onDelete: (row: InterfaceVacaciones) => void;
    onView?: (row: InterfaceVacaciones) => void;
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdVacaciones ? null : row.IdVacaciones)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row.IdVacaciones && (
            <div className="actions-dropdown-menu">
                {onView && (
                    <>
                        <button className="actions-dropdown-item view-action" onClick={() => { onView(row); setOpenActionDropdown(null); }}>
                            <Eye size={14} />
                            <span>Ver</span>
                        </button>
                        <div className="actions-dropdown-divider"></div>
                    </>
                )}
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

MemoizedActionButtons.displayName = 'MemoizedActionButtons';

export const Vacaciones: React.FC = () => {
    const [vacacionesForm, setVacacionesForm] = useState<Partial<InterfaceVacaciones>>({
        IdVacaciones: 0,
        FechaSolicitud: '',
        UsuarioSolicita: '',
        NoEmpleado: '',
        NombreCompleto: '',
        Departamento: '',
        Cargo: '',
        FechaIngreso: '',
        FechaInicio: '',
        FechaFin: '',
        DiasTomar: '',
        FechaRetornoLabores: '',
        FechaAutoriza: '',
        UsuarioAutoriza: ''
    });
    
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [vacaciones, setVacaciones] = useState<InterfaceVacaciones[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'Agregar' | 'Modificar' | 'Ver'>('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<number | null>(null);

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdVacaciones',
            title: 'ID',
            sortable: true,
            searchable: true,
            width: '80px',
            align: 'center'
        },
        {
            key: 'NoEmpleado',
            title: 'No. Empleado',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center'
        },
        {
            key: 'NombreCompleto',
            title: 'Empleado',
            sortable: true,
            searchable: true,
            width: '250px',
            align: 'left'
        },
        {
            key: 'Departamento',
            title: 'Departamento',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'left'
        },
        {
            key: 'FechaInicio',
            title: 'Fecha Inicio',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center',
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        {
            key: 'FechaFin',
            title: 'Fecha Fin',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center',
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
        {
            key: 'DiasTomar',
            title: 'Días',
            sortable: true,
            searchable: true,
            width: '80px',
            align: 'center'
        },
        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '100px',
            align: 'center',
            render: (_, row) => (
                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            )
        }
    ], [openActionDropdown]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setVacacionesForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchVacaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/vacaciones/ObtenerListado.php');
            
            if (response.status && response.data) {
                const vacacionesData = response.data as InterfaceVacaciones[];
                setVacaciones(vacacionesData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar vacaciones',
                    type: 'error',
                    autoClose: 1500
                });
                setVacaciones([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar vacaciones',
                type: 'error',
                autoClose: 1500
            });
            setVacaciones([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const validateForm = useCallback((): boolean => {
        if (!vacacionesForm.NoEmpleado?.trim()) {
            showToast({ text: 'El número de empleado es requerido', type: 'error' });
            return false;
        }
        if (!vacacionesForm.NombreCompleto?.trim()) {
            showToast({ text: 'El nombre completo es requerido', type: 'error' });
            return false;
        }
        if (!vacacionesForm.FechaInicio) {
            showToast({ text: 'La fecha de inicio es requerida', type: 'error' });
            return false;
        }
        if (!vacacionesForm.FechaFin) {
            showToast({ text: 'La fecha de fin es requerida', type: 'error' });
            return false;
        }
        if (!vacacionesForm.DiasTomar || Number(vacacionesForm.DiasTomar) <= 0) {
            showToast({ text: 'Los días a tomar son requeridos y deben ser mayores a 0', type: 'error' });
            return false;
        }
        
        // Validar que fecha fin sea mayor o igual a fecha inicio
        const fechaInicio = new Date(vacacionesForm.FechaInicio);
        const fechaFin = new Date(vacacionesForm.FechaFin);
        
        if (fechaFin < fechaInicio) {
            showToast({ text: 'La fecha de fin debe ser mayor o igual a la fecha de inicio', type: 'error' });
            return false;
        }
        
        return true;
    }, [vacacionesForm]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            setSubmitting(true);
            
            const fechaFin = new Date(vacacionesForm.FechaFin!);
            const fechaRetorno = new Date(fechaFin);
            fechaRetorno.setDate(fechaRetorno.getDate() + 1);
            
            const datosNormalizados = {
                ...vacacionesForm,
                FechaRetornoLabores: fechaRetorno.toISOString().split('T')[0],
                FechaAutoriza: new Date().toISOString().split('T')[0],
                UsuarioSolicita: usuarioSesion?.IdUsuario || ''
            };

            const isUpdate = (vacacionesForm.IdVacaciones || 0) !== 0;
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(
                    `/vacaciones/crud.php?IdVacaciones=${vacacionesForm.IdVacaciones}&IdUsuario=${usuarioSesion?.IdUsuario}`, 
                    datosNormalizados
                );
            } else {
                response = await apiService.postForm<RespuestaAPI>(
                    `/vacaciones/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, 
                    datosNormalizados
                );
            }
            
            showToast({
                text: response.message || (isUpdate ? 'Vacaciones actualizadas correctamente' : 'Solicitud de vacaciones guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchVacaciones();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar la solicitud de vacaciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [vacacionesForm, usuarioSesion, fetchVacaciones, validateForm]);

    const handleEdit = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Modificar');
        setVacacionesForm(vacacion);
        setShowForm(true);
    }, []);

    const handleView = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Ver');
        setVacacionesForm(vacacion);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback(async (vacacion: InterfaceVacaciones) => {
        if (window.confirm(`¿Está seguro de que desea eliminar la solicitud de vacaciones de ${vacacion.NombreCompleto}?`)) {
            try {
                const response = await apiService.delete<RespuestaAPI>(
                    `/vacaciones/crud.php?IdVacaciones=${vacacion.IdVacaciones}&IdUsuario=${usuarioSesion?.IdUsuario}`
                );

                if (response.status) {
                    showToast({
                        text: 'Solicitud de vacaciones eliminada correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchVacaciones();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar la solicitud de vacaciones',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar la solicitud de vacaciones',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [usuarioSesion, fetchVacaciones]);

    const resetForm = useCallback(() => {
        setVacacionesForm({
            IdVacaciones: 0,
            FechaSolicitud: '',
            UsuarioSolicita: '',
            NoEmpleado: '',
            NombreCompleto: '',
            Departamento: '',
            Cargo: '',
            FechaIngreso: '',
            FechaInicio: '',
            FechaFin: '',
            DiasTomar: '',
            FechaRetornoLabores: '',
            FechaAutoriza: '',
            UsuarioAutoriza: ''
        });
    }, []);

    useEffect(() => {
        fetchVacaciones();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchVacaciones]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionDropdown !== null && !(event.target as HTMLElement).closest('.actions-dropdown-container')) {
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
                handleShowForm();
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

    const isViewMode = tipoFormulario === 'Ver';

    return (
        <div className="vacaciones-container">
            <div className="vacaciones-header">
                <h1 className="page-title-vacaciones">Gestión de Solicitudes de Vacaciones</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nueva Solicitud
                    </button>
                </div>
            </div>

            <div className="vacaciones-content">
                <Tabla
                    columns={tableColumns}
                    data={vacaciones}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron solicitudes de vacaciones"
                    className="full-height-table"
                    loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-vacaciones-modal-overlay">
                    <div className="form-vacaciones-modal">
                        <div className="form-vacaciones-modal-header">
                            <h2 className="form-vacaciones-modal-title">
                                {tipoFormulario === 'Modificar' ? 'Editar Solicitud de Vacaciones' : 
                                 tipoFormulario === 'Ver' ? 'Ver Solicitud de Vacaciones' : 
                                 'Nueva Solicitud de Vacaciones'}
                            </h2>
                            <button 
                                className="close-button" 
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                    setTipoFormulario('Agregar');
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-vacaciones-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-vacaciones-row">
                                    <div className="form-vacaciones-group">
                                        <label htmlFor='NoEmpleado' className="form-vacaciones-label">Número de Empleado:</label>
                                        <input
                                            type="text"
                                            id="NoEmpleado"
                                            name="NoEmpleado"
                                            value={vacacionesForm.NoEmpleado || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            placeholder="Número de empleado"
                                            disabled={isViewMode}
                                            required
                                        />
                                    </div>

                                    <div className="form-vacaciones-group">
                                        <label htmlFor='NombreCompleto' className="form-vacaciones-label">Nombre Completo:</label>
                                        <input
                                            type="text"
                                            id="NombreCompleto"
                                            name="NombreCompleto"
                                            value={vacacionesForm.NombreCompleto || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            placeholder="Nombre completo del empleado"
                                            disabled={isViewMode}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-vacaciones-row">
                                    <div className="form-vacaciones-group">
                                        <label htmlFor='Departamento' className="form-vacaciones-label">Departamento:</label>
                                        <input
                                            type="text"
                                            id="Departamento"
                                            name="Departamento"
                                            value={vacacionesForm.Departamento || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            placeholder="Departamento"
                                            disabled={isViewMode}
                                        />
                                    </div>

                                    <div className="form-vacaciones-group">
                                        <label htmlFor='Cargo' className="form-vacaciones-label">Cargo:</label>
                                        <input
                                            type="text"
                                            id="Cargo"
                                            name="Cargo"
                                            value={vacacionesForm.Cargo || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            placeholder="Cargo"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>

                                <div className="form-vacaciones-row">
                                    <div className="form-vacaciones-group">
                                        <label htmlFor='FechaIngreso' className="form-vacaciones-label">Fecha de Ingreso:</label>
                                        <input
                                            type="date"
                                            id="FechaIngreso"
                                            name="FechaIngreso"
                                            value={vacacionesForm.FechaIngreso || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            disabled={isViewMode}
                                        />
                                    </div>

                                    <div className="form-vacaciones-group">
                                        <label htmlFor='FechaSolicitud' className="form-vacaciones-label">Fecha de Solicitud:</label>
                                        <input
                                            type="date"
                                            id="FechaSolicitud"
                                            name="FechaSolicitud"
                                            value={vacacionesForm.FechaSolicitud || new Date().toISOString().split('T')[0]}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            disabled={isViewMode}
                                        />
                                    </div>
                                </div>

                                <div className="form-vacaciones-row">
                                    <div className="form-vacaciones-group">
                                        <label htmlFor='FechaInicio' className="form-vacaciones-label">Fecha de Inicio:</label>
                                        <input
                                            type="date"
                                            id="FechaInicio"
                                            name="FechaInicio"
                                            value={vacacionesForm.FechaInicio || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            disabled={isViewMode}
                                            required
                                        />
                                    </div>

                                    <div className="form-vacaciones-group">
                                        <label htmlFor='FechaFin' className="form-vacaciones-label">Fecha de Fin:</label>
                                        <input
                                            type="date"
                                            id="FechaFin"
                                            name="FechaFin"
                                            value={vacacionesForm.FechaFin || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            disabled={isViewMode}
                                            required
                                        />
                                    </div>

                                    <div className="form-vacaciones-group">
                                        <label htmlFor='DiasTomar' className="form-vacaciones-label">Días a Tomar:</label>
                                        <input
                                            type="number"
                                            id="DiasTomar"
                                            name="DiasTomar"
                                            value={vacacionesForm.DiasTomar || ''}
                                            onChange={handleInputChange}
                                            className="form-vacaciones-input"
                                            placeholder="Días"
                                            disabled={isViewMode}
                                            required
                                            min="1"
                                        />
                                    </div>
                                </div>

                                {isViewMode && vacacionesForm.FechaRetornoLabores && (
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label htmlFor='FechaRetornoLabores' className="form-vacaciones-label">Fecha de Retorno:</label>
                                            <input
                                                type="text"
                                                id="FechaRetornoLabores"
                                                value={new Date(vacacionesForm.FechaRetornoLabores).toLocaleDateString()}
                                                className="form-vacaciones-input"
                                                disabled
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-vacaciones-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                            setTipoFormulario('Agregar');
                                        }}
                                    >
                                        {isViewMode ? 'Cerrar' : 'Cancelar'}
                                    </button>
                                    {!isViewMode && (
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={submitting}
                                        >
                                            <FileText size={16} />
                                            {submitting ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Vacaciones;