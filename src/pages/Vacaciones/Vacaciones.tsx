import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Filter, ChevronDown, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import './vacaciones.css';
import type { InterfaceVacaciones, FiltrosVacaciones, OpcionSelect } from '../../interfaces/Vacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer, formatDateForInput } from '../../helpers/date';
import { apiService } from '../../api/apiService';

// Interfaces faltantes
interface EmpleadoResponse {
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    IdPersonal: number;
}

const DeleteConfirmationModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    vacacion: InterfaceVacaciones | null;
    onConfirm: () => void;
    loading?: boolean;
}> = ({ visible, onClose, vacacion, onConfirm, loading = false }) => {
    if (!visible) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '450px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Confirmar Eliminación</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px' }}>
                        ¿Está seguro de que desea eliminar la solicitud de vacaciones de?
                    </p>
                    <div style={{ 
                        backgroundColor: '#FFF3E0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '8px'
                    }}>
                        <p style={{ marginBottom: '4px', fontWeight: '500' }}>
                            <strong>Empleado:</strong> {vacacion?.NombreCompleto}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                            <strong>No. Empleado:</strong> {vacacion?.NoEmpleado}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                            <strong>Período:</strong> {formatDateForServer(vacacion?.FechaInicio || '')} al {formatDateForServer(vacacion?.FechaFin || '')}
                        </p>
                        <p>
                            <strong>Días:</strong> {vacacion?.DiasTomar}
                        </p>
                    </div>
                    <p style={{ fontSize: '14px', color: '#DC3545', marginTop: '12px' }}>
                        Esta acción no se puede deshacer.
                    </p>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={onConfirm}
                        disabled={loading}
                        style={{ background: '#DC3545' }}
                    >
                        {loading ? 'Eliminando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ActionConfirmationModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    vacacion: InterfaceVacaciones | null;
    onConfirm: () => void;
    loading?: boolean;
    actionType: 'authorize' | 'cancel';
}> = ({ visible, onClose, vacacion, onConfirm, loading = false, actionType }) => {
    if (!visible) return null;

    const isAuthorize = actionType === 'authorize';
    const title = isAuthorize ? 'Confirmar Autorización' : 'Confirmar Cancelación';
    const message = isAuthorize 
        ? '¿Está seguro de que desea autorizar esta solicitud de vacaciones?'
        : '¿Está seguro de que desea cancelar esta solicitud de vacaciones?';
    const confirmText = isAuthorize ? 'Autorizar' : 'Cancelar';
    const confirmClass = isAuthorize ? 'btn-success' : 'btn-warning';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '450px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px' }}>{message}</p>
                    <div style={{ 
                        backgroundColor: '#FFF3E0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '8px'
                    }}>
                        <p style={{ marginBottom: '4px', fontWeight: '500' }}>
                            <strong>Empleado:</strong> {vacacion?.NombreCompleto}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                            <strong>No. Empleado:</strong> {vacacion?.NoEmpleado}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                            <strong>Período:</strong> {formatDateForServer(vacacion?.FechaInicio || '')} al {formatDateForServer(vacacion?.FechaFin || '')}
                        </p>
                        <p>
                            <strong>Días:</strong> {vacacion?.DiasTomar}
                        </p>
                    </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`btn ${confirmClass}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onView,
    onEdit,
    onDelete,
    onAuthorize,
    onCancel,
    canAuthorize = false,
    canCancel = false
}: {
    row: InterfaceVacaciones;
    openActionDropdown: number | null;
    setOpenActionDropdown: (IdVacaciones: number | null) => void;
    onView: (row: InterfaceVacaciones) => void;
    onEdit: (row: InterfaceVacaciones) => void;
    onDelete: (row: InterfaceVacaciones) => void;
    onAuthorize: (row: InterfaceVacaciones) => void;
    onCancel: (row: InterfaceVacaciones) => void;
    canAuthorize: boolean;
    canCancel: boolean;
}) => {
    const showAuthorizeButton = canAuthorize && row.Estatus === 1;
    const showCancelButton = canCancel && row.Estatus === 1;
    const showEditDeleteButtons = row.Estatus !== 2; // No mostrar editar/eliminar si está autorizado

    return (
        <div className="actions-dropdown-container">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    className="actions-dropdown-trigger"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionDropdown(openActionDropdown === row.IdVacaciones ? null : row.IdVacaciones);
                    }}
                    title="Más acciones"
                >
                    <MoreVertical size={16} color='black' />
                </button>
            </div>

            {openActionDropdown === row.IdVacaciones && (
                <div className="actions-dropdown-menu">
                    <button 
                        className="actions-dropdown-item view-action" 
                        onClick={() => { 
                            onView(row); 
                            setOpenActionDropdown(null); 
                        }}
                    >
                        <Eye size={14} />
                        <span>Ver</span>
                    </button>
                    
                    {showAuthorizeButton && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item authorize-action" 
                                onClick={() => { 
                                    onAuthorize(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <CheckCircle size={14} />
                                <span>Autorizar</span>
                            </button>
                        </>
                    )}
                    
                    {showCancelButton && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item cancel-action" 
                                onClick={() => { 
                                    onCancel(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <XCircle size={14} />
                                <span>Cancelar</span>
                            </button>
                        </>
                    )}
                    
                    {showEditDeleteButtons && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item edit-action" 
                                onClick={() => { 
                                    onEdit(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <Edit size={14} />
                                <span>Editar</span>
                            </button>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item delete-action" 
                                onClick={() => { 
                                    onDelete(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <Trash2 size={14} />
                                <span>Eliminar</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
});

MemoizedActionButtons.displayName = 'MemoizedActionButtons';

export const Vacaciones: React.FC = () => {
    const [vacacionesForm, setVacacionesForm] = useState<Partial<InterfaceVacaciones>>({
        IdVacaciones: 0,
        FechaSolicitud: '',
        UsuarioSolicita: '',
        IdPersonal: 0,
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
        UsuarioAutoriza: '',
        Estatus: 1
    });
    
    const [fechaInicioInput, setFechaInicioInput] = useState('');
    const [fechaFinInput, setFechaFinInput] = useState('');
    const [fechaIngresoInput, setFechaIngresoInput] = useState('');
    const [fechaSolicitudInput, setFechaSolicitudInput] = useState('');
    
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [vacaciones, setVacaciones] = useState<InterfaceVacaciones[]>([]);
    const [vacacionesFiltrados, setVacacionesFiltrados] = useState<InterfaceVacaciones[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'Agregar' | 'Modificar' | 'Ver'>('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<number | null>(null);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    
    const [empleados, setEmpleados] = useState<OpcionSelect[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [vacacionAEliminar, setVacacionAEliminar] = useState<InterfaceVacaciones | null>(null);
    const [eliminando, setEliminando] = useState(false);
    
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [vacacionAccion, setVacacionAccion] = useState<InterfaceVacaciones | null>(null);
    const [actionType, setActionType] = useState<'authorize' | 'cancel'>('authorize');
    const [accionEnProceso, setAccionEnProceso] = useState(false);
    
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
    
    const [filtros, setFiltros] = useState<FiltrosVacaciones>({
        NoEmpleado: 0,
        NombreCompleto: '',
        FechaInicioVacaciones: '',
        FechaFinVacaciones: '',
        Supervisor: '',
        FechaIngreso: '',
        FechaSolicitud: '',
        Estatus: 0
    });

    // Verificar roles del usuario
    const userRole = usuarioSesion?.RolUsuario || '';
    const isHR = userRole === 'Recursos Humanos';
    const isAdmin = userRole === 'Administrador';
    const isSupervisor = userRole === 'Supervisor';
    
    const canAuthorize = isHR || isAdmin; 
    const canCancel = isHR || isAdmin || isSupervisor;

    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
            
            const empleadosResponse = await apiService.get<RespuestaAPI>(`/vacaciones/opciones/ObtenerEmpleados.php?idusuario=${usuarioSesion?.IdUsuario}`);

            if (empleadosResponse.status && empleadosResponse.data) {
                const empleadosData = Array.isArray(empleadosResponse.data) ? empleadosResponse.data : [];
                setEmpleados(empleadosData.map((e: any) => ({ 
                    id: e.NoEmpleado?.toString() || e.id?.toString() || '', 
                    valor: e.NombreCompleto || e.valor || '' 
                })));
            }
        } catch (error) {
            console.error('Error cargando opciones:', error);
            showToast({
                text: 'Error al cargar opciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setLoadingOptions(false);
        }
    }, [usuarioSesion?.IdUsuario]);

    const buscarEmpleado = useCallback(async (noEmpleado: string) => {
        if (!noEmpleado || noEmpleado.length < 3) return;
        
        try {
            const response = await apiService.get<RespuestaAPI>(
                `/vacaciones/BuscarEmpleadoPorId.php?NoEmpleado=${noEmpleado}&idusuario=${usuarioSesion?.IdUsuario}`
            );
            
            if (response.status && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                const empleado = response.data as EmpleadoResponse; 
                setVacacionesForm(prev => ({
                    ...prev,
                    NoEmpleado: empleado.NoEmpleado?.toString() || '0',
                    NombreCompleto: empleado.NombreCompleto || '',
                    Departamento: empleado.Departamento?.toString() || '',
                    Cargo: empleado.Cargo?.toString() || '',
                    FechaIngreso: empleado.FechaIngreso || '',
                    IdPersonal: empleado.IdPersonal || 0
                }));
                
                setSelectedEmpleadoId(empleado.NoEmpleado?.toString() || '');
                
                if (empleado.FechaIngreso) {
                    setFechaIngresoInput(formatDateForInput(empleado.FechaIngreso));
                }
                
                showToast({
                    text: 'Empleado encontrado',
                    type: 'success',
                    autoClose: 1500
                });
            } else {
                showToast({
                    text: response.message || 'Empleado no encontrado',
                    type: 'error',
                    autoClose: 1500
                });
                setVacacionesForm(prev => ({
                    ...prev,
                    NoEmpleado: '',
                    NombreCompleto: '',
                    Departamento: '',
                    Cargo: '',
                    FechaIngreso: '',
                    IdPersonal: 0
                }));
                setSelectedEmpleadoId('');
                setFechaIngresoInput('');
            }
        } catch (error) {
            console.error('Error buscando empleado:', error);
            showToast({
                text: 'Error al buscar empleado',
                type: 'error',
                autoClose: 1500
            });
        }
    }, [usuarioSesion?.IdUsuario]);

    const handleEmpleadoChange = useCallback((selectedId: string) => {
        setSelectedEmpleadoId(selectedId);
        if (selectedId) {
            buscarEmpleado(selectedId);
        } else {
            setVacacionesForm(prev => ({
                ...prev,
                NoEmpleado: '',
                NombreCompleto: '',
                Departamento: '',
                Cargo: '',
                FechaIngreso: '',
                IdPersonal: 0
            }));
            setFechaIngresoInput('');
        }
    }, [buscarEmpleado]);

    const calcularDiasDesdeFechas = useCallback((fechaInicio: string, fechaFin: string) => {
        if (!fechaInicio || !fechaFin) return;
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        if (fin < inicio) return;
        
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        setVacacionesForm(prev => ({
            ...prev,
            DiasTomar: diffDays.toString()
        }));
    }, []);

    const calcularFechaFinDesdeDias = useCallback((fechaInicio: string, dias: number) => {
        if (!fechaInicio || !dias || dias <= 0) return;
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + (dias - 1));
        
        const fechaFinStr = fin.toISOString().split('T')[0];
        setFechaFinInput(fechaFinStr);
        setVacacionesForm(prev => ({ ...prev, FechaFin: fechaFinStr }));
    }, []);

    const handleFechaInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaInicioInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaInicio: isoDate }));
        
        const diasTomar = vacacionesForm.DiasTomar;
        const fechaFin = vacacionesForm.FechaFin;
        
        if (diasTomar && Number(diasTomar) > 0) {
            calcularFechaFinDesdeDias(isoDate, Number(diasTomar));
        } else if (fechaFin) {
            calcularDiasDesdeFechas(isoDate, fechaFin);
        }
    }, [vacacionesForm.DiasTomar, vacacionesForm.FechaFin, calcularFechaFinDesdeDias, calcularDiasDesdeFechas]);

    const handleFechaFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaFinInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaFin: isoDate }));
        
        if (vacacionesForm.FechaInicio) {
            calcularDiasDesdeFechas(vacacionesForm.FechaInicio, isoDate);
        }
    }, [vacacionesForm.FechaInicio, calcularDiasDesdeFechas]);

    const handleDiasTomarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const dias = value ? Number(value) : 0;
        
        setVacacionesForm(prev => ({ ...prev, DiasTomar: value }));
        
        if (vacacionesForm.FechaInicio && dias > 0) {
            calcularFechaFinDesdeDias(vacacionesForm.FechaInicio, dias);
        } else if (dias === 0) {
            setFechaFinInput('');
            setVacacionesForm(prev => ({ ...prev, FechaFin: '' }));
        }
    }, [vacacionesForm.FechaInicio, calcularFechaFinDesdeDias]);

    const handleFechaSolicitudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaSolicitudInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: isoDate }));
    }, []);

    const aplicarFiltros = useCallback(() => {
        let filtrados = [...vacaciones];

        if (filtros.NoEmpleado && filtros.NoEmpleado !== 0) {
            filtrados = filtrados.filter(v => 
                v.NoEmpleado?.toString().toLowerCase().includes(filtros.NoEmpleado.toString().toLowerCase())
            );
        }

        if (filtros.NombreCompleto) {
            filtrados = filtrados.filter(v => 
                v.NombreCompleto?.toLowerCase().includes(filtros.NombreCompleto.toLowerCase())
            );
        }

        if (filtros.FechaInicioVacaciones) {
            filtrados = filtrados.filter(v => 
                v.FechaInicio && v.FechaInicio >= filtros.FechaInicioVacaciones
            );
        }

        if (filtros.FechaFinVacaciones) {
            filtrados = filtrados.filter(v => 
                v.FechaFin && v.FechaFin <= filtros.FechaFinVacaciones
            );
        }

        if (filtros.FechaSolicitud) {
            filtrados = filtrados.filter(v => 
                v.FechaSolicitud === filtros.FechaSolicitud
            );
        }

        setVacacionesFiltrados(filtrados);
    }, [vacaciones, filtros]);

    const handleFiltroChange = (campo: keyof FiltrosVacaciones, valor: string | number) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            NoEmpleado: 0,
            NombreCompleto: '',
            FechaInicioVacaciones: '',
            FechaFinVacaciones: '',
            Supervisor: '',
            FechaIngreso: '',
            FechaSolicitud: '',
            Estatus: 0
        });
        setVacacionesFiltrados(vacaciones);
    };

    const fetchVacaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/vacaciones/ObtenerListado.php');
            
            if (response.status && response.data) {
                const vacacionesData = response.data as InterfaceVacaciones[];
                setVacaciones(vacacionesData);
                setVacacionesFiltrados(vacacionesData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar vacaciones',
                    type: 'error',
                    autoClose: 1500
                });
                setVacaciones([]);
                setVacacionesFiltrados([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar vacaciones',
                type: 'error',
                autoClose: 1500
            });
            setVacaciones([]);
            setVacacionesFiltrados([]);
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
                FechaAutoriza: vacacionesForm.Estatus === 2 ? new Date().toISOString().split('T')[0] : '',
                UsuarioSolicita: usuarioSesion?.IdUsuario?.toString() || '',
                UsuarioAutoriza: vacacionesForm.Estatus === 2 ? usuarioSesion?.IdUsuario?.toString() : '',
                Estatus: vacacionesForm.Estatus || 1
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
            console.error('Error:', error);
            showToast({
                text: 'Error al guardar la solicitud de vacaciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [vacacionesForm, usuarioSesion, fetchVacaciones, validateForm]);

    const handleAuthorize = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('authorize');
        setActionModalVisible(true);
    }, []);

    const handleCancel = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('cancel');
        setActionModalVisible(true);
    }, []);

    const confirmAction = useCallback(async () => {
        if (!vacacionAccion) return;
        
        try {
            setAccionEnProceso(true);
            
            const newStatus = actionType === 'authorize' ? 2 : 3;
            const url = `/vacaciones/cambiarEstatus.php?IdVacaciones=${vacacionAccion.IdVacaciones}&Estatus=${newStatus}&IdUsuario=${usuarioSesion?.IdUsuario}`;
            
            const response = await apiService.put<RespuestaAPI>(url, {});
            
            if (response.status) {
                const message = actionType === 'authorize' 
                    ? 'Solicitud de vacaciones autorizada correctamente'
                    : 'Solicitud de vacaciones cancelada correctamente';
                    
                showToast({
                    text: message,
                    type: 'success',
                    autoClose: 1500
                });
                
                fetchVacaciones();
                setActionModalVisible(false);
                setVacacionAccion(null);
            } else {
                showToast({
                    text: response.message || `Error al ${actionType === 'authorize' ? 'autorizar' : 'cancelar'} la solicitud`,
                    type: 'error',
                    autoClose: 1500
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast({
                text: `Error al ${actionType === 'authorize' ? 'autorizar' : 'cancelar'} la solicitud de vacaciones`,
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setAccionEnProceso(false);
        }
    }, [vacacionAccion, actionType, usuarioSesion?.IdUsuario, fetchVacaciones]);

    const handleEdit = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Modificar');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setShowForm(true);
    }, []);

    const handleView = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Ver');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setShowForm(true);
    }, []);

    const handleDeleteClick = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAEliminar(vacacion);
        setDeleteModalVisible(true);
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!vacacionAEliminar) return;
        
        try {
            setEliminando(true);
            const response = await apiService.delete<RespuestaAPI>(
                `/vacaciones/crud.php?IdVacaciones=${vacacionAEliminar.IdVacaciones}&IdUsuario=${usuarioSesion?.IdUsuario}`
            );

            if (response.status) {
                showToast({
                    text: 'Solicitud de vacaciones eliminada correctamente',
                    type: 'success',
                    autoClose: 1500
                });
                fetchVacaciones();
                setDeleteModalVisible(false);
                setVacacionAEliminar(null);
            } else {
                showToast({
                    text: response.message || 'Error al eliminar la solicitud de vacaciones',
                    type: 'error',
                    autoClose: 1500
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast({
                text: 'Error al eliminar la solicitud de vacaciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setEliminando(false);
        }
    }, [vacacionAEliminar, usuarioSesion?.IdUsuario, fetchVacaciones]);

    const resetForm = useCallback(() => {
        setVacacionesForm({
            IdVacaciones: 0,
            FechaSolicitud: '',
            UsuarioSolicita: '',
            IdPersonal: 0,
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
            UsuarioAutoriza: '',
            Estatus: 1
        });
        setFechaInicioInput('');
        setFechaFinInput('');
        setFechaIngresoInput('');
        setFechaSolicitudInput('');
        setSelectedEmpleadoId('');
    }, []);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
        const today = new Date().toISOString().split('T')[0];
        setFechaSolicitudInput(today);
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: today, Estatus: 1 }));
    }, [resetForm]);

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdVacaciones',
            title: 'ID',
            sortable: true,
            searchable: false,
            width: '80px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'NoEmpleado',
            title: 'No. Empleado',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'NombreCompleto',
            title: 'Empleado',
            sortable: true,
            searchable: false,
            width: '250px',
            align: 'left',
            headerAlign: 'center'
        },
        {
            key: 'Departamento',
            title: 'Departamento',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'left',
            headerAlign: 'center'
        },
        {
            key: 'FechaInicio',
            title: 'Fecha Inicio',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string) => formatDateForServer(value)
        },
        {
            key: 'FechaFin',
            title: 'Fecha Fin',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string) => formatDateForServer(value)
        },
        {
            key: 'DiasTomar',
            title: 'Días',
            sortable: true,
            searchable: false,
            width: '80px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'FechaSolicitud',
            title: 'Fecha Solicitud',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string) => formatDateForServer(value)
        }, 
        {
            key: 'Estatus',
            title: 'Estatus',
            sortable: true,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => {
                switch(value) {
                    case 1:
                        return <span className="status-badge status-pending">Pendiente</span>;
                    case 2:
                        return <span className="status-badge status-authorized">Autorizado</span>;
                    case 3:
                        return <span className="status-badge status-cancelled">Cancelado</span>;
                    default:
                        return <span className="status-badge">Desconocido</span>;
                }
            }
        },
        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '160px',
            align: 'center',
            headerAlign: 'center',
            render: (_, row) => (
                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onAuthorize={handleAuthorize}
                    onCancel={handleCancel}
                    canAuthorize={canAuthorize}
                    canCancel={canCancel}
                />
            )
        }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleAuthorize, handleCancel, canAuthorize, canCancel]);

    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    useEffect(() => {
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
        fetchVacaciones();
        cargarOpcionesCatalogos();
    }, [fetchVacaciones, cargarOpcionesCatalogos]);

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
    }, [showForm, handleShowForm]);

    useEffect(() => {
        document.body.style.overflow = showForm ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm]);

    const isViewMode = tipoFormulario === 'Ver';

    return (
        <div className="vacaciones-container">
            <div className="vacaciones-header">
                <h1 className="page-title-vacaciones">Gestión de Solicitudes de Vacaciones</h1>
                <div className="action-buttons">
                    <button className="action-btn orange-button" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nueva Solicitud
                    </button>
                </div>
            </div>

            <div className="filtros-container">
                <div className="filtros-basicos">
                    <div className="filtro-group">
                        <label className="filtro-label">No. Empleado:</label>
                        <input
                            type="text"
                            className="filtro-input"
                            placeholder="Buscar por número..."
                            value={filtros.NoEmpleado}
                            onChange={(e) => handleFiltroChange('NoEmpleado', e.target.value)}
                        />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Nombre Completo:</label>
                        <input
                            type="text"
                            className="filtro-input"
                            placeholder="Buscar por nombre..."
                            value={filtros.NombreCompleto}
                            onChange={(e) => handleFiltroChange('NombreCompleto', e.target.value)}
                        />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Fecha Solicitud:</label>
                        <input
                            type="date"
                            className="filtro-input"
                            value={filtros.FechaSolicitud}
                            onChange={(e) => handleFiltroChange('FechaSolicitud', e.target.value)}
                        />
                    </div>

                    <button
                        className="filtros-avanzados-btn"
                        onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
                    >
                        <Filter size={16} />
                        <span>Filtros Avanzados</span>
                        <ChevronDown size={16} className={`chevron ${showFiltrosAvanzados ? 'rotated' : ''}`} />
                    </button>
                </div>

                {showFiltrosAvanzados && (
                    <div className="filtros-avanzados">
                        <div className="filtros-avanzados-grid">
                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Inicio Vacaciones:</label>
                                <input
                                    type="date"
                                    className="filtro-input"
                                    value={filtros.FechaInicioVacaciones}
                                    onChange={(e) => handleFiltroChange('FechaInicioVacaciones', e.target.value)}
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Fin Vacaciones:</label>
                                <input
                                    type="date"
                                    className="filtro-input"
                                    value={filtros.FechaFinVacaciones}
                                    onChange={(e) => handleFiltroChange('FechaFinVacaciones', e.target.value)}
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Ingreso:</label>
                                <input
                                    type="date"
                                    className="filtro-input"
                                    value={filtros.FechaIngreso}
                                    onChange={(e) => handleFiltroChange('FechaIngreso', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filtros-avanzados-actions">
                            <button className="btn btn-secondary" onClick={limpiarFiltros}>
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="vacaciones-content">
                {loadingOptions && (
                    <div className="loading-options">
                        <span>Cargando opciones...</span>
                    </div>
                )}
                <Tabla
                    columns={tableColumns}
                    data={vacacionesFiltrados}
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
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-vacaciones-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-section">
                                    <h3 className="form-section-title">Información del Empleado</h3>
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">No. Empleado *</label>
                                            <SelectConBusqueda
                                                options={empleados}
                                                value={selectedEmpleadoId}
                                                onChange={handleEmpleadoChange}
                                                placeholder="Seleccione un empleado..."
                                                disabled={isViewMode}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label">Departamento</label>
                                            <input
                                                type="text"
                                                value={vacacionesForm.Departamento || ''}
                                                className="form-vacaciones-input"
                                                disabled={true}
                                                placeholder="Departamento del empleado"
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label">Cargo</label>
                                            <input
                                                type="text"
                                                value={vacacionesForm.Cargo || ''}
                                                className="form-vacaciones-input"
                                                disabled={true}
                                                placeholder="Cargo del empleado"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label">Fecha de Ingreso</label>
                                            <input
                                                type="date"
                                                value={fechaIngresoInput}
                                                className="form-vacaciones-input"
                                                disabled={true}
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label">Fecha de Solicitud</label>
                                            <input
                                                type="date"
                                                value={fechaSolicitudInput}
                                                onChange={handleFechaSolicitudChange}
                                                className="form-vacaciones-input"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Período de Vacaciones</h3>
                                    <div className="form-vacaciones-row three-columns">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Fecha de Inicio *</label>
                                            <input
                                                type="date"
                                                value={fechaInicioInput}
                                                onChange={handleFechaInicioChange}
                                                className="form-vacaciones-input"
                                                disabled={isViewMode}
                                                required
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Fecha de Fin *</label>
                                            <input
                                                type="date"
                                                value={fechaFinInput}
                                                onChange={handleFechaFinChange}
                                                className="form-vacaciones-input"
                                                disabled={isViewMode}
                                                required
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Días a Tomar *</label>
                                            <input
                                                type="number"
                                                name="DiasTomar"
                                                value={vacacionesForm.DiasTomar || ''}
                                                onChange={handleDiasTomarChange}
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
                                                <label className="form-vacaciones-label">Fecha de Retorno</label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(vacacionesForm.FechaRetornoLabores)}
                                                    className="form-vacaciones-input"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isViewMode && vacacionesForm.FechaAutoriza && (
                                        <div className="form-vacaciones-row">
                                            <div className="form-vacaciones-group">
                                                <label className="form-vacaciones-label">Fecha de Autorización</label>
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(vacacionesForm.FechaAutoriza)}
                                                    className="form-vacaciones-input"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

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
                                            className="btn btn-primary orange-button"
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

            <DeleteConfirmationModal
                visible={deleteModalVisible}
                onClose={() => {
                    setDeleteModalVisible(false);
                    setVacacionAEliminar(null);
                }}
                vacacion={vacacionAEliminar}
                onConfirm={handleConfirmDelete}
                loading={eliminando}
            />

            <ActionConfirmationModal
                visible={actionModalVisible}
                onClose={() => {
                    setActionModalVisible(false);
                    setVacacionAccion(null);
                }}
                vacacion={vacacionAccion}
                onConfirm={confirmAction}
                loading={accionEnProceso}
                actionType={actionType}
            />
        </div>
    );
};

export default Vacaciones;