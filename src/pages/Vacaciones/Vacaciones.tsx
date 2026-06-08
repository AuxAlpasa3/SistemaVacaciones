import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Filter, ChevronDown, Eye, CheckCircle, XCircle, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import './vacaciones.css';
import type { InterfaceVacaciones, FiltrosVacaciones, OpcionSelect, PeriodoVacaciones } from '../../interfaces/Vacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { CatalogoUsuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer, formatDateForInput } from '../../helpers/date';
import { apiService } from '../../api/apiService';
import { VacacionesPDFButton } from '../../components/Vacaciones/VacacionesPDF';

interface EmpleadoResponse {
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    IdPersonal: number;
}

type TabType = 'solicitadas' | 'autorizadas' | 'validadas';

const StatusBadge: React.FC<{ estatus: number }> = ({ estatus }) => {
    switch (estatus) {
        case 0:
            return <span className="status-badge status-pending">Solicitada</span>;
        case 1:
            return <span className="status-badge status-authorized">Autorizada</span>;
        case 2:
            return <span className="status-badge status-validated">Validada</span>;
        case 3:
            return <span className="status-badge status-cancelled">Cancelada</span>;
        case 4:
            return <span className="status-badge status-review">En Revisión</span>;
        default:
            return <span className="status-badge">Desconocido</span>;
    }
};

const ActionConfirmationModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    vacacion: InterfaceVacaciones | null;
    onConfirm: (comentarios?: string) => void;
    loading?: boolean;
    actionType: 'authorize' | 'validate' | 'cancel' | 'review' | 'reauthorize' | 'returnToReview';
}> = ({ visible, onClose, vacacion, onConfirm, loading = false, actionType }) => {
    const [comentarios, setComentarios] = useState('');

    if (!visible) return null;

    const getConfig = () => {
        switch (actionType) {
            case 'authorize':
                return {
                    title: 'Confirmar Autorización',
                    message: '¿Está seguro de que desea AUTORIZAR esta solicitud de vacaciones?',
                    confirmText: 'Autorizar',
                    confirmClass: 'btn-success',
                    requiresComentarios: false
                };
            case 'validate':
                return {
                    title: 'Confirmar Validación',
                    message: '¿Está seguro de que desea VALIDAR esta solicitud de vacaciones?',
                    confirmText: 'Validar',
                    confirmClass: 'btn-primary',
                    requiresComentarios: false
                };
            case 'cancel':
                return {
                    title: 'Confirmar Cancelación',
                    message: '¿Está seguro de que desea CANCELAR esta solicitud de vacaciones?',
                    confirmText: 'Cancelar',
                    confirmClass: 'btn-warning',
                    requiresComentarios: true
                };
            case 'review':
                return {
                    title: 'Enviar a Revisión',
                    message: '¿Está seguro de que desea enviar esta solicitud a REVISIÓN? Deberá agregar un comentario.',
                    confirmText: 'Enviar a Revisión',
                    confirmClass: 'btn-info',
                    requiresComentarios: true
                };
            case 'reauthorize':
                return {
                    title: 'Re-Autorizar Solicitud',
                    message: '¿Está seguro de que desea RE-AUTORIZAR esta solicitud? Podrá modificar los datos si es necesario.',
                    confirmText: 'Re-Autorizar',
                    confirmClass: 'btn-success',
                    requiresComentarios: true
                };
            case 'returnToReview':
                return {
                    title: 'Regresar a Revisión',
                    message: '¿Está seguro de que desea REGRESAR esta solicitud a REVISIÓN? Deberá agregar un comentario explicando el motivo.',
                    confirmText: 'Regresar a Revisión',
                    confirmClass: 'btn-warning',
                    requiresComentarios: true
                };
            default:
                return {
                    title: 'Confirmar Acción',
                    message: '¿Está seguro de realizar esta acción?',
                    confirmText: 'Confirmar',
                    confirmClass: 'btn-primary',
                    requiresComentarios: false
                };
        }
    };

    const config = getConfig();

    const handleLocalConfirm = () => {
        if (config.requiresComentarios && !comentarios.trim()) {
            showToast({ text: 'Debe agregar un comentario para continuar', type: 'error' });
            return;
        }
        onConfirm(comentarios);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{config.title}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p style={{ marginBottom: '16px' }}>{config.message}</p>
                    <div style={{ 
                        backgroundColor: '#FFF3E0', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '16px'
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
                    
                    {config.requiresComentarios && (
                        <div className="form-group" style={{ marginTop: '16px' }}>
                            <label className="form-label required">Comentarios:</label>
                            <textarea
                                className="form-textarea"
                                value={comentarios}
                                onChange={(e) => setComentarios(e.target.value)}
                                placeholder="Explique el motivo de esta acción..."
                                rows={3}
                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                disabled={loading}
                            />
                        </div>
                    )}

                    {actionType === 'cancel' && (
                        <p style={{ fontSize: '14px', color: '#DC3545', marginTop: '12px', fontWeight: 'bold' }}>
                            Advertencia: Esta acción no se puede deshacer.
                        </p>
                    )}
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className={`btn ${config.confirmClass}`}
                        onClick={handleLocalConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Procesando...' : config.confirmText}
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
    onValidate,
    onCancel,
    onReview,
    onReauthorize,
    onReturnToReview,
    idRolUsuario,
    canEditDelete = false,
    activeTab
}: {
    row: InterfaceVacaciones;
    openActionDropdown: number | null;
    setOpenActionDropdown: (IdVacaciones: number | null) => void;
    onView: (row: InterfaceVacaciones) => void;
    onEdit: (row: InterfaceVacaciones) => void;
    onDelete: (row: InterfaceVacaciones) => void;
    onAuthorize: (row: InterfaceVacaciones) => void;
    onValidate: (row: InterfaceVacaciones) => void;
    onCancel: (row: InterfaceVacaciones) => void;
    onReview: (row: InterfaceVacaciones) => void;
    onReauthorize: (row: InterfaceVacaciones) => void;
    onReturnToReview: (row: InterfaceVacaciones) => void;
    idRolUsuario: number;
    canEditDelete: boolean;
    activeTab: TabType;
}) => {
    const showAuthorizeButton = idRolUsuario === 3 && row.Estatus === 0 && activeTab === 'solicitadas';
    const showValidateButtons = idRolUsuario === 2 && row.Estatus === 1 && activeTab === 'autorizadas';
    const showReauthorizeButton = (idRolUsuario === 2 || idRolUsuario === 3) && row.Estatus === 4 && activeTab === 'autorizadas';
    const showEditButtons = canEditDelete && (row.Estatus === 0 || row.Estatus === 1 || row.Estatus === 4) && activeTab !== 'validadas';
    const showDeleteButton = canEditDelete && row.Estatus === 0 && activeTab === 'solicitadas';
    const showCancelButton = (idRolUsuario === 1 || idRolUsuario === 2 || idRolUsuario === 3) && 
                             (row.Estatus === 0 || row.Estatus === 1) &&
                             activeTab !== 'validadas';
    const showReturnToReviewButton = idRolUsuario === 2 && row.Estatus === 2 && activeTab === 'validadas';

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
                    
                    {showValidateButtons && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item validate-action" 
                                onClick={() => { 
                                    onValidate(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <CheckCircle size={14} />
                                <span>Validar</span>
                            </button>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item review-action" 
                                onClick={() => { 
                                    onReview(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <AlertCircle size={14} />
                                <span>Revisar</span>
                            </button>
                        </>
                    )}

                    {showReauthorizeButton && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item reauthorize-action" 
                                onClick={() => { 
                                    onReauthorize(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <RefreshCw size={14} />
                                <span>Re-Autorizar</span>
                            </button>
                        </>
                    )}
                    
                    {showReturnToReviewButton && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item return-review-action" 
                                onClick={() => { 
                                    onReturnToReview(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <RefreshCw size={14} />
                                <span>Regresar a Revisión</span>
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
                    
                    {showEditButtons && (
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
                        </>
                    )}

                    {showDeleteButton && (
                        <>
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
        DiasTomar: 0,
        FechaRetornoLabores: '',
        FechaAutoriza: '',
        UsuarioAutoriza: '',
        UsuarioValida: '',
        FechaValidado: '',
        Estatus: 0,
        Anio: 0,
        SaldoDias: 0,
        DiasCorresponden: 0,
        Antiguedad: 0,
        Comentarios: null
    });
    
    const [fechaInicioInput, setFechaInicioInput] = useState('');
    const [fechaFinInput, setFechaFinInput] = useState('');
    const [fechaIngresoInput, setFechaIngresoInput] = useState('');
    const [fechaSolicitudInput, setFechaSolicitudInput] = useState('');
    const [fechaRetornoInput, setFechaRetornoInput] = useState('');
    
    const [usuarioSesion, setUsuarioSesion] = useState<CatalogoUsuario | null>(null);
    const [vacaciones, setVacaciones] = useState<InterfaceVacaciones[]>([]);
    const [vacacionesFiltrados, setVacacionesFiltrados] = useState<InterfaceVacaciones[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'Agregar' | 'Modificar' | 'Ver'>('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<number | null>(null);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('solicitadas');
    
    const [empleados, setEmpleados] = useState<OpcionSelect[]>([]);
    const [departamentos, setDepartamentos] = useState<OpcionSelect[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [vacacionAEliminar, setVacacionAEliminar] = useState<InterfaceVacaciones | null>(null);
    const [eliminando, setEliminando] = useState(false);
    
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [vacacionAccion, setVacacionAccion] = useState<InterfaceVacaciones | null>(null);
    const [actionType, setActionType] = useState<'authorize' | 'validate' | 'cancel' | 'review' | 'reauthorize' | 'returnToReview'>('authorize');
    const [accionEnProceso, setAccionEnProceso] = useState(false);
    
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
    
    const today = new Date().toISOString().split('T')[0];
    const [filtroFecha, setFiltroFecha] = useState<string>(today);
    
    const [filtros, setFiltros] = useState<FiltrosVacaciones>({
        NoEmpleado: 0,
        NombreCompleto: '',
        Departamento: '',
        FechaInicioVacaciones: '',
        FechaFinVacaciones: '',
        Supervisor: '',
        FechaIngreso: '',
        FechaSolicitud: '',
        Estatus: 0,
        Anio: 0
    });

    const [filtrosAplicados, setFiltrosAplicados] = useState(false);
    
    const [cantidadesFiltradas, setCantidadesFiltradas] = useState({
        solicitadas: 0,
        autorizadas: 0,
        validadas: 0
    });
    
    const [periodosVacaciones, setPeriodosVacaciones] = useState<PeriodoVacaciones[]>([]);
    const [aniosDisponibles, setAniosDisponibles] = useState<OpcionSelect[]>([]);
    const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
    const [diasDisponiblesPeriodo, setDiasDisponiblesPeriodo] = useState<number>(0);
    const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
    const [saldoRestante, setSaldoRestante] = useState<number>(0);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoVacaciones | null>(null);
    const [advertenciaAnticipacion, setAdvertenciaAnticipacion] = useState<string>('');
    const [advertenciaViernes, setAdvertenciaViernes] = useState<string>('');

    const idRolUsuario = Number(usuarioSesion?.rol) || 0;
    const isHRorAdmin = idRolUsuario === 1 || idRolUsuario === 2 || idRolUsuario === 3;
    const canEditDelete = isHRorAdmin;
    const isAuthorizer = idRolUsuario === 3;
    const isValidator = idRolUsuario === 2;

    const verificarAnticipacionSolicitud = useCallback(() => {
        const fechaSolicitud = vacacionesForm.FechaSolicitud;
        const fechaInicio = vacacionesForm.FechaInicio;
        const diasTomar = vacacionesForm.DiasTomar || 0;
        
        if (!fechaSolicitud || !fechaInicio || diasTomar === 0) {
            setAdvertenciaAnticipacion('');
            return;
        }
        
        const solicitud = new Date(fechaSolicitud);
        const inicio = new Date(fechaInicio);
        
        const diffTime = inicio.getTime() - solicitud.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diasTomar >= 1 && diasTomar <= 3) {
            if (diffDays < 3) {
                setAdvertenciaAnticipacion("ADVERTENCIA: Para solicitudes de 1 a 3 días, se requiere mínimo 3 días de anticipación. Su solicitud podría ser rechazada o cancelada.");
            } else {
                setAdvertenciaAnticipacion('');
            }
        } else if (diasTomar >= 4) {
            if (diffDays < 14) {
                setAdvertenciaAnticipacion("ADVERTENCIA: Para solicitudes de 4 o más días, se requiere mínimo 2 semanas de anticipación. Su solicitud podría ser rechazada o cancelada.");
            } else {
                setAdvertenciaAnticipacion('');
            }
        } else {
            setAdvertenciaAnticipacion('');
        }
    }, [vacacionesForm.FechaSolicitud, vacacionesForm.FechaInicio, vacacionesForm.DiasTomar]);

    const verificarViernes = useCallback(() => {
        const fechaInicio = vacacionesForm.FechaInicio;
        if (!fechaInicio) {
            setAdvertenciaViernes('');
            return;
        }
        
        const inicio = new Date(fechaInicio);
        const esViernes = inicio.getDay() === 5;
        
        if (esViernes) {
            setAdvertenciaViernes("ADVERTENCIA: La solicitud comienza en viernes. Si el sábado estaba planeado como home office, deberá asistir a la oficina o solicitar ese día también. Esto podría ser motivo de rechazo o cancelación.");
        } else {
            setAdvertenciaViernes('');
        }
    }, [vacacionesForm.FechaInicio]);

    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
            
            const [empleadosResponse, departamentosResponse] = await Promise.all([
                apiService.get<RespuestaAPI>(`/vacaciones/opciones/ObtenerEmpleados.php?idusuario=${usuarioSesion?.IdUsuario}`),
                apiService.get<RespuestaAPI>('/vacaciones/opciones/ObtenerDepartamentos.php')
            ]);

            if (empleadosResponse.status && empleadosResponse.data) {
                const empleadosData = Array.isArray(empleadosResponse.data) ? empleadosResponse.data : [];
                setEmpleados(empleadosData.map((e: any) => ({ 
                    id: e.NoEmpleado?.toString() || e.id?.toString() || '', 
                    valor: e.NombreCompleto || e.valor || '' 
                })));
            }

            if (departamentosResponse.status && departamentosResponse.data) {
                const departamentosData = Array.isArray(departamentosResponse.data) ? departamentosResponse.data : [];
                setDepartamentos(departamentosData.map((d: any) => ({ 
                    id: d.Departamento?.toString() || d.id?.toString() || '', 
                    valor: d.Departamento || d.valor || '' 
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

    const cargarPeriodosVacaciones = useCallback(async (idPersonal: number, anioSeleccionado?: number) => {
        if (!idPersonal || idPersonal === 0) {
            return;
        }
        
        try {
            setCargandoPeriodos(true);
            const response = await apiService.get<RespuestaAPI>(
                `/vacaciones/ObtenerPeriodosVacaciones.php?IdPersonal=${idPersonal}`
            );
            
            if (response.status && response.data && Array.isArray(response.data) && response.data.length > 0) {
                const periodos = response.data as PeriodoVacaciones[];
                setPeriodosVacaciones(periodos);
                
                const aniosConDias = periodos.map(p => ({
                    id: p.Año.toString(),
                    valor: p.Año.toString()
                }));
                
                setAniosDisponibles(aniosConDias);
                
                let anioParaSeleccionar = anioSeleccionado;
                if (!anioParaSeleccionar && periodos.length > 0) {
                    anioParaSeleccionar = Math.min(...periodos.map(p => p.Año));
                }
                
                if (anioParaSeleccionar) {
                    setSelectedAnio(anioParaSeleccionar);
                    const periodo = periodos.find(p => p.Año === anioParaSeleccionar);
                    if (periodo) {
                        setPeriodoSeleccionado(periodo);
                        setDiasDisponiblesPeriodo(periodo.DiasDisponibles);
                        const diasActuales = vacacionesForm.DiasTomar || 0;
                        setSaldoRestante(periodo.DiasDisponibles - diasActuales);
                        
                        setVacacionesForm(prev => ({
                            ...prev,
                            DiasCorresponden: periodo.DiasGenera,
                            Antiguedad: periodo.AñosAntiguedad,
                            SaldoDias: periodo.DiasDisponibles
                        }));
                    }
                }
            } else {
                setPeriodosVacaciones([]);
                setAniosDisponibles([]);
                setSelectedAnio(null);
                setDiasDisponiblesPeriodo(0);
                setSaldoRestante(0);
                setPeriodoSeleccionado(null);
                
                setVacacionesForm(prev => ({
                    ...prev,
                    DiasCorresponden: 0,
                    Antiguedad: 0,
                    SaldoDias: 0
                }));
                
                if (!anioSeleccionado) {
                    showToast({
                        text: 'No se encontraron períodos de vacaciones para este empleado',
                        type: 'warning',
                        autoClose: 3000
                    });
                }
            }
        } catch (error) {
            console.error('Error cargando períodos:', error);
            showToast({
                text: 'Error al cargar los períodos de vacaciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setCargandoPeriodos(false);
        }
    }, [vacacionesForm.DiasTomar]);

    const resetEmpleadoData = useCallback(() => {
        setVacacionesForm(prev => ({
            ...prev,
            NoEmpleado: '',
            NombreCompleto: '',
            Departamento: '',
            Cargo: '',
            FechaIngreso: '',
            IdPersonal: 0,
            DiasCorresponden: 0,
            Antiguedad: 0,
            SaldoDias: 0
        }));
        setSelectedEmpleadoId('');
        setFechaIngresoInput('');
        setPeriodosVacaciones([]);
        setAniosDisponibles([]);
        setSelectedAnio(null);
        setDiasDisponiblesPeriodo(0);
        setSaldoRestante(0);
        setPeriodoSeleccionado(null);
    }, []);

    const buscarEmpleado = useCallback(async (noEmpleado: string, anioParaCargar?: number) => {
        if (!noEmpleado || noEmpleado.length < 3) return;
        
        try {
            setLoadingOptions(true);
            const response = await apiService.get<RespuestaAPI>(
                `/vacaciones/BuscarEmpleadoPorId.php?NoEmpleado=${noEmpleado}&idusuario=${usuarioSesion?.IdUsuario}`
            );
            
            if (response.status && response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
                const empleado = response.data as EmpleadoResponse;
                const idPersonal = empleado.IdPersonal || 0;
                
                setVacacionesForm(prev => ({
                    ...prev,
                    NoEmpleado: empleado.NoEmpleado?.toString() || '0',
                    NombreCompleto: empleado.NombreCompleto || '',
                    Departamento: empleado.Departamento?.toString() || '',
                    Cargo: empleado.Cargo?.toString() || '',
                    FechaIngreso: empleado.FechaIngreso || '',
                    IdPersonal: idPersonal
                }));
                
                setSelectedEmpleadoId(empleado.NoEmpleado?.toString() || '');
                
                if (empleado.FechaIngreso) {
                    setFechaIngresoInput(formatDateForInput(empleado.FechaIngreso));
                }
                
                if (idPersonal > 0) {
                    await cargarPeriodosVacaciones(idPersonal, anioParaCargar);
                } else {
                    showToast({
                        text: 'El empleado no tiene un IdPersonal válido',
                        type: 'warning',
                        autoClose: 3000
                    });
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
                resetEmpleadoData();
            }
        } catch (error) {
            console.error('Error buscando empleado:', error);
            showToast({
                text: 'Error al buscar empleado',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setLoadingOptions(false);
        }
    }, [usuarioSesion?.IdUsuario, cargarPeriodosVacaciones, resetEmpleadoData]);

    const handleEmpleadoChange = useCallback((selectedId: string) => {
        if (tipoFormulario === 'Modificar') {
            showToast({
                text: 'No se puede cambiar el empleado en modo edición',
                type: 'warning',
                autoClose: 2000
            });
            return;
        }
        
        setSelectedEmpleadoId(selectedId);
        if (selectedId) {
            buscarEmpleado(selectedId);
        } else {
            resetEmpleadoData();
        }
    }, [buscarEmpleado, resetEmpleadoData, tipoFormulario]);

    const handleAnioChange = useCallback((value: string) => {
        const anio = value ? parseInt(value) : null;
        setSelectedAnio(anio);
        
        if (anio) {
            const periodo = periodosVacaciones.find(p => p.Año === anio);
            if (periodo) {
                setPeriodoSeleccionado(periodo);
                setDiasDisponiblesPeriodo(periodo.DiasDisponibles);
                const diasActuales = vacacionesForm.DiasTomar || 0;
                setSaldoRestante(periodo.DiasDisponibles - diasActuales);
                
                setVacacionesForm(prev => ({
                    ...prev,
                    DiasCorresponden: periodo.DiasGenera,
                    Antiguedad: periodo.AñosAntiguedad,
                    SaldoDias: periodo.DiasDisponibles
                }));
                
                if (diasActuales > periodo.DiasDisponibles) {
                    showToast({
                        text: `Los días solicitados exceden los disponibles (${periodo.DiasDisponibles} días)`,
                        type: 'warning',
                        autoClose: 3000
                    });
                }
            }
        } else {
            setPeriodoSeleccionado(null);
            setDiasDisponiblesPeriodo(0);
            setSaldoRestante(0);
            setVacacionesForm(prev => ({
                ...prev,
                DiasCorresponden: 0,
                Antiguedad: 0,
                SaldoDias: 0
            }));
        }
    }, [periodosVacaciones, vacacionesForm.DiasTomar]);

    const calcularFechaRetorno = useCallback((fechaFin: string, dias: number) => {
        if (!fechaFin) return;
        
        const fin = new Date(fechaFin);
        const retorno = new Date(fin);
        retorno.setDate(fin.getDate() + 1);
        
        const fechaRetornoStr = retorno.toISOString().split('T')[0];
        setFechaRetornoInput(fechaRetornoStr);
        setVacacionesForm(prev => ({ ...prev, FechaRetornoLabores: fechaRetornoStr }));
    }, []);

    const calcularDiasDesdeFechas = useCallback((fechaInicio: string, fechaFin: string) => {
        if (!fechaInicio || !fechaFin) return;
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        if (fin < inicio) return;
        
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        setVacacionesForm(prev => ({ ...prev, DiasTomar: diffDays }));
        
        const nuevoSaldo = diasDisponiblesPeriodo - diffDays;
        setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
        
        calcularFechaRetorno(fechaFin, diffDays);
    }, [diasDisponiblesPeriodo, calcularFechaRetorno]);

    const calcularFechaFinDesdeDias = useCallback((fechaInicio: string, dias: number) => {
        if (!fechaInicio || !dias || dias <= 0) return;
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(inicio);
        fin.setDate(inicio.getDate() + (dias - 1));
        
        const fechaFinStr = fin.toISOString().split('T')[0];
        setFechaFinInput(fechaFinStr);
        setVacacionesForm(prev => ({ ...prev, FechaFin: fechaFinStr }));
        
        const nuevoSaldo = diasDisponiblesPeriodo - dias;
        setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
        
        calcularFechaRetorno(fechaFinStr, dias);
    }, [diasDisponiblesPeriodo, calcularFechaRetorno]);

    const handleFechaInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaInicioInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaInicio: isoDate }));
        
        const diasTomar = vacacionesForm.DiasTomar;
        const fechaFin = vacacionesForm.FechaFin;
        
        if (diasTomar && diasTomar > 0) {
            calcularFechaFinDesdeDias(isoDate, diasTomar);
        } else if (fechaFin) {
            calcularDiasDesdeFechas(isoDate, fechaFin);
        }
        
        verificarViernes();
        verificarAnticipacionSolicitud();
    }, [vacacionesForm.DiasTomar, vacacionesForm.FechaFin, calcularFechaFinDesdeDias, calcularDiasDesdeFechas, verificarViernes, verificarAnticipacionSolicitud]);

    const handleFechaFinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaFinInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaFin: isoDate }));
        
        if (vacacionesForm.FechaInicio) {
            calcularDiasDesdeFechas(vacacionesForm.FechaInicio, isoDate);
        } else {
            calcularFechaRetorno(isoDate, vacacionesForm.DiasTomar || 0);
        }
        
        verificarAnticipacionSolicitud();
    }, [vacacionesForm.FechaInicio, vacacionesForm.DiasTomar, calcularDiasDesdeFechas, calcularFechaRetorno, verificarAnticipacionSolicitud]);

    const handleDiasTomarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const dias = value ? Number(value) : 0;
        
        if (dias > diasDisponiblesPeriodo && diasDisponiblesPeriodo > 0) {
            showToast({
                text: `Los días solicitados no pueden exceder los días disponibles (${diasDisponiblesPeriodo} días)`,
                type: 'error',
                autoClose: 3000
            });
            return;
        }
        
        setVacacionesForm(prev => ({ ...prev, DiasTomar: dias }));
        
        const nuevoSaldo = diasDisponiblesPeriodo - dias;
        setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
        
        if (vacacionesForm.FechaInicio && dias > 0) {
            calcularFechaFinDesdeDias(vacacionesForm.FechaInicio, dias);
        } else if (dias === 0) {
            setFechaFinInput('');
            setFechaRetornoInput('');
            setVacacionesForm(prev => ({ ...prev, FechaFin: '', FechaRetornoLabores: '' }));
        }
        
        verificarAnticipacionSolicitud();
    }, [vacacionesForm.FechaInicio, diasDisponiblesPeriodo, calcularFechaFinDesdeDias, verificarAnticipacionSolicitud]);

    const handleFechaSolicitudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaSolicitudInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: isoDate }));
        verificarAnticipacionSolicitud();
    }, [verificarAnticipacionSolicitud]);

    const handleFechaRetornoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaRetornoInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaRetornoLabores: isoDate }));
    }, []);

    const aplicarFiltros = useCallback(() => {
        let filtrados = [...vacaciones];

        if (filtroFecha && filtroFecha.trim() !== '') {
            filtrados = filtrados.filter(v => {
                const fechaSolicitud = v.FechaSolicitud?.split(' ')[0] || '';
                return fechaSolicitud === filtroFecha;
            });
        }

        if (activeTab === 'solicitadas') {
            filtrados = filtrados.filter(v => v.Estatus === 0);
        } else if (activeTab === 'autorizadas') {
            filtrados = filtrados.filter(v => v.Estatus === 1 || v.Estatus === 4);
        } else {
            filtrados = filtrados.filter(v => v.Estatus === 2 || v.Estatus === 3);
        }

        if (filtros.NoEmpleado && filtros.NoEmpleado !== 0 && filtros.NoEmpleado.toString().trim() !== '') {
            const busquedaNoEmpleado = filtros.NoEmpleado.toString().toLowerCase();
            filtrados = filtrados.filter(v => 
                v.NoEmpleado?.toString().toLowerCase().includes(busquedaNoEmpleado)
            );
        }

        if (filtros.NombreCompleto && filtros.NombreCompleto.trim() !== '') {
            const busquedaNombre = filtros.NombreCompleto.toLowerCase();
            filtrados = filtrados.filter(v => 
                v.NombreCompleto?.toLowerCase().includes(busquedaNombre)
            );
        }

        if (filtros.Departamento && filtros.Departamento.trim() !== '') {
            const busquedaDepartamento = filtros.Departamento.toLowerCase();
            filtrados = filtrados.filter(v => 
                v.Departamento?.toLowerCase().includes(busquedaDepartamento)
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

        if (filtros.FechaIngreso) {
            filtrados = filtrados.filter(v => 
                v.FechaIngreso && v.FechaIngreso >= filtros.FechaIngreso
            );
        }

        if (filtros.Anio && filtros.Anio !== 0) {
            filtrados = filtrados.filter(v => v.Anio === filtros.Anio);
        }

        setVacacionesFiltrados(filtrados);
        setFiltrosAplicados(true);
        
        const cantidades = {
            solicitadas: filtrados.filter(v => v.Estatus === 0).length,
            autorizadas: filtrados.filter(v => v.Estatus === 1 || v.Estatus === 4).length,
            validadas: filtrados.filter(v => v.Estatus === 2 || v.Estatus === 3).length
        };
        setCantidadesFiltradas(cantidades);
    }, [vacaciones, filtros, activeTab, filtroFecha]);

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
            Departamento: '',
            FechaInicioVacaciones: '',
            FechaFinVacaciones: '',
            Supervisor: '',
            FechaIngreso: '',
            FechaSolicitud: '',
            Estatus: 0,
            Anio: 0
        });
        setVacacionesFiltrados([]);
        setFiltrosAplicados(false);
        setCantidadesFiltradas({ solicitadas: 0, autorizadas: 0, validadas: 0 });
        showToast({
            text: 'Filtros limpiados',
            type: 'info',
            autoClose: 1500
        });
    };

    const fetchVacaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/vacaciones/ObtenerListado.php');
            
            if (response.status && response.data) {
                const vacacionesData = (response.data as any[]).map(item => ({
                    ...item,
                    IdVacaciones: Number(item.IdVacaciones),
                    IdPersonal: Number(item.IdPersonal),
                    DiasTomar: item.DiasTomar ? Number(item.DiasTomar) : 0,
                    Estatus: Number(item.Estatus),
                    Anio: Number(item.Anio) || 0,
                    SaldoDias: Number(item.SaldoDias) || 0,
                    DiasCorresponden: Number(item.DiasCorresponden) || 0,
                    Antiguedad: Number(item.Antiguedad) || 0,
                    FechaInicio: item.FechaInicio ? item.FechaInicio.split(' ')[0] : '',
                    FechaFin: item.FechaFin ? item.FechaFin.split(' ')[0] : '',
                    FechaSolicitud: item.FechaSolicitud ? item.FechaSolicitud.split(' ')[0] : '',
                    FechaRetornoLabores: item.FechaRetornoLabores ? item.FechaRetornoLabores.split(' ')[0] : '',
                    FechaAutoriza: item.FechaAutoriza ? item.FechaAutoriza.split(' ')[0] : '',
                    FechaValidado: item.FechaValidado ? item.FechaValidado.split(' ')[0] : '',
                    FechaIngreso: item.FechaIngreso ? item.FechaIngreso.split(' ')[0] : '',
                    NoEmpleado: item.NoEmpleado?.toString() || '',
                    NombreCompleto: item.NombreCompleto || '',
                    Departamento: item.Departamento || '',
                    Cargo: item.Cargo || '',
                    UsuarioSolicita: item.UsuarioSolicita || '',
                    UsuarioAutoriza: item.UsuarioAutoriza || '',
                    UsuarioValida: item.UsuarioValida || '',
                    Comentarios: item.Comentarios || null
                })) as InterfaceVacaciones[];
                
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
            console.error('Error fetching vacations:', error);
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
        if (!vacacionesForm.DiasTomar || vacacionesForm.DiasTomar <= 0) {
            showToast({ text: 'Los días a solicitar son requeridos y deben ser mayores a 0', type: 'error' });
            return false;
        }
        if (!selectedAnio) {
            showToast({ text: 'Debe seleccionar el año del período de vacaciones', type: 'error' });
            return false;
        }
        if (vacacionesForm.DiasTomar > diasDisponiblesPeriodo) {
            showToast({ text: `No hay suficientes días disponibles. Máximo: ${diasDisponiblesPeriodo} días`, type: 'error' });
            return false;
        }
        
        // Validación de fecha de solicitud
        if (!vacacionesForm.FechaSolicitud) {
            showToast({ text: 'La fecha de solicitud es requerida', type: 'error' });
            return false;
        }
        
        // Validar que la fecha de solicitud no sea futura
        const fechaSolicitud = new Date(vacacionesForm.FechaSolicitud);
        const fechaActual = new Date();
        fechaActual.setHours(0, 0, 0, 0);
        
        if (fechaSolicitud > fechaActual) {
            showToast({ text: 'La fecha de solicitud no puede ser mayor a la fecha actual', type: 'error' });
            return false;
        }
        
        // Validar que la fecha de solicitud no sea muy antigua (opcional - 1 año)
        const fechaLimite = new Date();
        fechaLimite.setFullYear(fechaLimite.getFullYear() - 1);
        if (fechaSolicitud < fechaLimite) {
            showToast({ text: 'La fecha de solicitud no puede ser mayor a 1 año atrás', type: 'error' });
            return false;
        }
        
        const fechaInicio = new Date(vacacionesForm.FechaInicio);
        const fechaFin = new Date(vacacionesForm.FechaFin);
        
        if (fechaFin < fechaInicio) {
            showToast({ text: 'La fecha de fin debe ser mayor o igual a la fecha de inicio', type: 'error' });
            return false;
        }
        
        return true;
    }, [vacacionesForm, selectedAnio, diasDisponiblesPeriodo]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        try {
            setSubmitting(true);
            
            const esActualizacion = (vacacionesForm.IdVacaciones || 0) !== 0;
            
            let estatusInicial = 0;
            if (!esActualizacion && (isAuthorizer || isValidator)) {
                estatusInicial = 1;
            }
            
            let datosNormalizados: any = {
                ...vacacionesForm,
                IdPersonal: vacacionesForm.IdPersonal,
                Anio: selectedAnio,
                DiasTomar: vacacionesForm.DiasTomar,
                FechaRetornoLabores: vacacionesForm.FechaRetornoLabores,
                SaldoDias: vacacionesForm.SaldoDias,
                DiasCorresponden: vacacionesForm.DiasCorresponden,
                Antiguedad: vacacionesForm.Antiguedad
            };
            
            const usuarioSolicitaId = vacacionesForm.IdPersonal?.toString() || '';
            const usuarioAutorizaId = usuarioSesion?.IdUsuario?.toString() || '';
            const esMismoUsuario = usuarioSolicitaId === usuarioAutorizaId;
            
            if (!esActualizacion) {
                // Usar la fecha de solicitud seleccionada por el usuario, no la fecha actual
                const fechaSolicitudSeleccionada = vacacionesForm.FechaSolicitud || new Date().toISOString().split('T')[0];
                
                datosNormalizados = {
                    ...datosNormalizados,
                    FechaSolicitud: fechaSolicitudSeleccionada,
                    UsuarioSolicita: usuarioSolicitaId,
                    Estatus: estatusInicial,
                    UsuarioAutoriza: esMismoUsuario ? '' : usuarioAutorizaId,
                    FechaAutoriza: esMismoUsuario ? null : new Date().toISOString().split('T')[0],
                    UsuarioValida: '',
                    FechaValidado: null
                };
            } else {
                const estatusActual = vacacionesForm.Estatus;
                let nuevoEstatus = estatusActual;
                let usuarioAutoriza = vacacionesForm.UsuarioAutoriza || '';
                let fechaAutoriza = vacacionesForm.FechaAutoriza;
                
                if (estatusActual === 0 && !esMismoUsuario && (!usuarioAutoriza || usuarioAutoriza === '')) {
                    usuarioAutoriza = usuarioAutorizaId;
                    fechaAutoriza = new Date().toISOString().split('T')[0];
                    nuevoEstatus = 1;
                }
                
                datosNormalizados = {
                    ...datosNormalizados,
                    FechaSolicitud: vacacionesForm.FechaSolicitud,
                    UsuarioSolicita: usuarioSolicitaId,
                    Estatus: nuevoEstatus,
                    UsuarioAutoriza: usuarioAutoriza,
                    FechaAutoriza: fechaAutoriza || null,
                };
            }
            
            let response: RespuestaAPI;
            
            if (esActualizacion) {
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
                text: response.message || (esActualizacion ? 'Vacaciones actualizadas correctamente' : 'Solicitud de vacaciones guardada correctamente'),
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
    }, [vacacionesForm, usuarioSesion, fetchVacaciones, validateForm, selectedAnio, isAuthorizer, isValidator]);

    const handleAuthorize = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('authorize');
        setActionModalVisible(true);
    }, []);

    const handleValidate = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('validate');
        setActionModalVisible(true);
    }, []);

    const handleCancel = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('cancel');
        setActionModalVisible(true);
    }, []);

    const handleReview = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('review');
        setActionModalVisible(true);
    }, []);

    const handleReauthorize = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('reauthorize');
        setActionModalVisible(true);
    }, []);

    const handleReturnToReview = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('returnToReview');
        setActionModalVisible(true);
    }, []);

    const confirmAction = useCallback(async (comentarios?: string) => {
        if (!vacacionAccion) return;
        
        try {
            setAccionEnProceso(true);
            
            let newStatus: number;
            let datosActualizacion: any = {
                Comentarios: comentarios || vacacionAccion.Comentarios || null
            };
            
            switch (actionType) {
                case 'authorize':
                    newStatus = 1;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus,
                        UsuarioAutoriza: usuarioSesion?.IdUsuario?.toString() || '',
                        FechaAutoriza: new Date().toISOString().split('T')[0]
                    };
                    break;
                case 'validate':
                    newStatus = 2;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus,
                        UsuarioValida: usuarioSesion?.IdUsuario?.toString() || '',
                        FechaValidado: new Date().toISOString().split('T')[0]
                    };
                    break;
                case 'cancel':
                    newStatus = 3;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus
                    };
                    break;
                case 'review':
                    newStatus = 4;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus
                    };
                    break;
                case 'reauthorize':
                    newStatus = 1;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus,
                        UsuarioAutoriza: usuarioSesion?.IdUsuario?.toString() || '',
                        FechaAutoriza: new Date().toISOString().split('T')[0]
                    };
                    break;
                case 'returnToReview':
                    newStatus = 4;
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus
                    };
                    break;
                default:
                    return;
            }
            
            const response = await apiService.put<RespuestaAPI>(
                `/vacaciones/cambiarEstatus.php?IdVacaciones=${vacacionAccion.IdVacaciones}&Estatus=${newStatus}&IdUsuario=${usuarioSesion?.IdUsuario}`,
                datosActualizacion
            );
            
            if (response.status) {
                let message = '';
                switch (actionType) {
                    case 'authorize':
                        message = 'Solicitud de vacaciones autorizada correctamente';
                        break;
                    case 'validate':
                        message = 'Solicitud de vacaciones validada correctamente';
                        break;
                    case 'cancel':
                        message = 'Solicitud de vacaciones cancelada correctamente';
                        break;
                    case 'review':
                        message = 'Solicitud enviada a revisión';
                        break;
                    case 'reauthorize':
                        message = 'Solicitud re-autorizada correctamente';
                        break;
                    case 'returnToReview':
                        message = 'Solicitud regresada a revisión correctamente';
                        break;
                }
                    
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
                    text: response.message || `Error al realizar la acción`,
                    type: 'error',
                    autoClose: 1500
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast({
                text: `Error al realizar la acción`,
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setAccionEnProceso(false);
        }
    }, [vacacionAccion, actionType, usuarioSesion, fetchVacaciones]);

    const handleEdit = useCallback(async (vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Modificar');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setFechaRetornoInput(formatDateForInput(vacacion.FechaRetornoLabores || ''));
        
        const idPersonal = vacacion.IdPersonal || 0;
        const anioVacacion = vacacion.Anio || 0;
        
        if (idPersonal > 0) {
            setCargandoPeriodos(true);
            try {
                const response = await apiService.get<RespuestaAPI>(
                    `/vacaciones/ObtenerPeriodosVacaciones.php?IdPersonal=${idPersonal}`
                );
                
                if (response.status && response.data && Array.isArray(response.data) && response.data.length > 0) {
                    const periodos = response.data as PeriodoVacaciones[];
                    setPeriodosVacaciones(periodos);
                    
                    const aniosConDias = periodos.map(p => ({
                        id: p.Año.toString(),
                        valor: p.Año.toString()
                    }));
                    setAniosDisponibles(aniosConDias);
                    
                    let anioParaSeleccionar = anioVacacion;
                    if (!anioParaSeleccionar && periodos.length > 0) {
                        anioParaSeleccionar = periodos[0].Año;
                    }
                    
                    if (anioParaSeleccionar) {
                        setSelectedAnio(anioParaSeleccionar);
                        const periodo = periodos.find(p => p.Año === anioParaSeleccionar);
                        if (periodo) {
                            setPeriodoSeleccionado(periodo);
                            setDiasDisponiblesPeriodo(periodo.DiasDisponibles);
                            setSaldoRestante(periodo.DiasDisponibles - (vacacion.DiasTomar || 0));
                        }
                    }
                } else {
                    setPeriodosVacaciones([]);
                    setAniosDisponibles([]);
                    setSelectedAnio(null);
                    setDiasDisponiblesPeriodo(0);
                    setSaldoRestante(0);
                    setPeriodoSeleccionado(null);
                }
            } catch (error) {
                console.error('Error cargando períodos:', error);
                showToast({
                    text: 'Error al cargar los períodos de vacaciones',
                    type: 'error',
                    autoClose: 1500
                });
            } finally {
                setCargandoPeriodos(false);
            }
        } else if (idPersonal > 0) {
            await buscarEmpleado(vacacion.NoEmpleado?.toString() || '', anioVacacion);
        }
        
        setShowForm(true);
        setTimeout(() => {
            verificarAnticipacionSolicitud();
            verificarViernes();
        }, 100);
    }, [verificarAnticipacionSolicitud, verificarViernes, buscarEmpleado]);

    const handleView = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Ver');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setFechaRetornoInput(formatDateForInput(vacacion.FechaRetornoLabores || ''));
        
        const idPersonal = vacacion.IdPersonal || 0;
        const anioVacacion = vacacion.Anio || 0;
        
        if (idPersonal > 0) {
            cargarPeriodosVacaciones(idPersonal, anioVacacion);
        }
        
        setShowForm(true);
    }, [cargarPeriodosVacaciones]);

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
            DiasTomar: 0,
            FechaRetornoLabores: '',
            FechaAutoriza: '',
            UsuarioAutoriza: '',
            UsuarioValida: '',
            FechaValidado: '',
            Estatus: 0,
            Anio: 0,
            SaldoDias: 0,
            DiasCorresponden: 0,
            Antiguedad: 0,
            Comentarios: null
        });
        setFechaInicioInput('');
        setFechaFinInput('');
        setFechaIngresoInput('');
        setFechaSolicitudInput('');
        setFechaRetornoInput('');
        setSelectedEmpleadoId('');
        setPeriodosVacaciones([]);
        setAniosDisponibles([]);
        setSelectedAnio(null);
        setDiasDisponiblesPeriodo(0);
        setSaldoRestante(0);
        setPeriodoSeleccionado(null);
        setAdvertenciaAnticipacion('');
        setAdvertenciaViernes('');
    }, []);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
        // Inicializar el campo de fecha de solicitud como vacío en lugar de la fecha actual
        // El usuario deberá seleccionar la fecha manualmente
        setFechaSolicitudInput('');
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: '', Estatus: 0 }));
    }, [resetForm]);

    useEffect(() => {
        verificarAnticipacionSolicitud();
        verificarViernes();
    }, [vacacionesForm.FechaInicio, vacacionesForm.FechaSolicitud, vacacionesForm.DiasTomar, verificarAnticipacionSolicitud, verificarViernes]);

    const solicitadasColumns: Column[] = useMemo(() => [
        { key: 'IdVacaciones', title: 'ID', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'NoEmpleado', title: 'No. Empleado', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center' },
        { key: 'NombreCompleto', title: 'Empleado', sortable: true, searchable: false, width: '250px', align: 'left', headerAlign: 'center' },
        { key: 'Departamento', title: 'Departamento', sortable: true, searchable: false, width: '150px', align: 'left', headerAlign: 'center' },
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'UsuarioSolicita', title: 'Usuario Solicita', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'Estatus', title: 'Estatus', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center', render: (value: number) => <StatusBadge estatus={value} /> },
        { key: 'actions', title: 'Acciones', sortable: false, searchable: false, width: '160px', align: 'center', headerAlign: 'center', render: (_, row) => (
            <MemoizedActionButtons row={row} openActionDropdown={openActionDropdown} setOpenActionDropdown={setOpenActionDropdown} onView={handleView} onEdit={handleEdit} onDelete={handleDeleteClick} onAuthorize={handleAuthorize} onValidate={handleValidate} onCancel={handleCancel} onReview={handleReview} onReauthorize={handleReauthorize} onReturnToReview={handleReturnToReview} idRolUsuario={idRolUsuario} canEditDelete={canEditDelete} activeTab={activeTab} />
        ) }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleAuthorize, handleValidate, handleCancel, handleReview, handleReauthorize, handleReturnToReview, idRolUsuario, canEditDelete, activeTab]);

    const autorizadasColumns: Column[] = useMemo(() => [
        { key: 'IdVacaciones', title: 'ID', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'NoEmpleado', title: 'No. Empleado', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center' },
        { key: 'NombreCompleto', title: 'Empleado', sortable: true, searchable: false, width: '250px', align: 'left', headerAlign: 'center' },
        { key: 'Departamento', title: 'Departamento', sortable: true, searchable: false, width: '150px', align: 'left', headerAlign: 'center' },
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'UsuarioSolicita', title: 'Usuario Solicita', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'UsuarioAutoriza', title: 'Usuario Autoriza', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaAutoriza', title: 'Fecha Autorización', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? formatDateForServer(value) : '-' },
        { key: 'Estatus', title: 'Estatus', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center', render: (value: number) => <StatusBadge estatus={value} /> },
        { key: 'Comentarios', title: 'Comentarios', sortable: false, searchable: false, width: '200px', align: 'left', headerAlign: 'center', render: (value: string) => value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '-' },
        { key: 'actions', title: 'Acciones', sortable: false, searchable: false, width: '160px', align: 'center', headerAlign: 'center', render: (_, row) => (
            <MemoizedActionButtons row={row} openActionDropdown={openActionDropdown} setOpenActionDropdown={setOpenActionDropdown} onView={handleView} onEdit={handleEdit} onDelete={handleDeleteClick} onAuthorize={handleAuthorize} onValidate={handleValidate} onCancel={handleCancel} onReview={handleReview} onReauthorize={handleReauthorize} onReturnToReview={handleReturnToReview} idRolUsuario={idRolUsuario} canEditDelete={canEditDelete} activeTab={activeTab} />
        ) }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleAuthorize, handleValidate, handleCancel, handleReview, handleReauthorize, handleReturnToReview, idRolUsuario, canEditDelete, activeTab]);

    const validadasColumns: Column[] = useMemo(() => [
        { key: 'IdVacaciones', title: 'ID', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'NoEmpleado', title: 'No. Empleado', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center' },
        { key: 'NombreCompleto', title: 'Empleado', sortable: true, searchable: false, width: '250px', align: 'left', headerAlign: 'center' },
        { key: 'Departamento', title: 'Departamento', sortable: true, searchable: false, width: '150px', align: 'left', headerAlign: 'center' },
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => formatDateForServer(value) },
        { key: 'UsuarioSolicita', title: 'Usuario Solicita', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'UsuarioAutoriza', title: 'Usuario Autoriza', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaAutoriza', title: 'Fecha Autorización', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? formatDateForServer(value) : '-' },
        { key: 'UsuarioValida', title: 'Usuario Valida', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaValidado', title: 'Fecha Validación', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? formatDateForServer(value) : '-' },
        { key: 'Estatus', title: 'Estatus', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center', render: (value: number) => <StatusBadge estatus={value} /> },
        { key: 'Comentarios', title: 'Comentarios', sortable: false, searchable: false, width: '200px', align: 'left', headerAlign: 'center', render: (value: string) => value ? (value.length > 30 ? value.substring(0, 30) + '...' : value) : '-' },
        { key: 'actions', title: 'Acciones', sortable: false, searchable: false, width: '220px', align: 'center', headerAlign: 'center', render: (_, row) => (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                <MemoizedActionButtons row={row} openActionDropdown={openActionDropdown} setOpenActionDropdown={setOpenActionDropdown} onView={handleView} onEdit={handleEdit} onDelete={handleDeleteClick} onAuthorize={handleAuthorize} onValidate={handleValidate} onCancel={handleCancel} onReview={handleReview} onReauthorize={handleReauthorize} onReturnToReview={handleReturnToReview} idRolUsuario={idRolUsuario} canEditDelete={canEditDelete} activeTab={activeTab} />
                {row.Estatus === 2 && (
                    <VacacionesPDFButton 
                        idVacaciones={row.IdVacaciones}
                        onSuccess={(fileName) => console.log('PDF generado:', fileName)}
                        onError={(error) => console.error('Error:', error)}
                        buttonText="PDF"
                    />
                )}
            </div>
        ) }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleAuthorize, handleValidate, handleCancel, handleReview, handleReauthorize, handleReturnToReview, idRolUsuario, canEditDelete, activeTab]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setOpenActionDropdown(null);
    };

    useEffect(() => {
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
        fetchVacaciones();
        cargarOpcionesCatalogos();
    }, [fetchVacaciones, cargarOpcionesCatalogos]);

    useEffect(() => {
        if (vacaciones.length > 0 && filtroFecha) {
            aplicarFiltros();
        }
    }, [vacaciones, activeTab, filtroFecha, aplicarFiltros]);

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
            if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !showForm && isHRorAdmin) {
                event.preventDefault();
                handleShowForm();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showForm, handleShowForm, isHRorAdmin]);

    useEffect(() => {
        document.body.style.overflow = showForm ? 'hidden' : 'auto';
        return () => { document.body.style.overflow = 'auto'; };
    }, [showForm]);

    const isViewMode = tipoFormulario === 'Ver';
    const currentColumns = activeTab === 'solicitadas' ? solicitadasColumns : (activeTab === 'autorizadas' ? autorizadasColumns : validadasColumns);

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

            <div className="vacaciones-tabs">
                <button className={`tab-button ${activeTab === 'solicitadas' ? 'active' : ''}`} onClick={() => handleTabChange('solicitadas')}>
                    <FileText size={16} /> Solicitadas 
                    <span className="tab-count">
                        {filtrosAplicados ? cantidadesFiltradas.solicitadas : vacaciones.filter(v => v.Estatus === 0).length}
                    </span>
                </button>
                <button className={`tab-button ${activeTab === 'autorizadas' ? 'active' : ''}`} onClick={() => handleTabChange('autorizadas')}>
                    <CheckCircle size={16} /> Autorizadas 
                    <span className="tab-count">
                        {filtrosAplicados ? cantidadesFiltradas.autorizadas : vacaciones.filter(v => v.Estatus === 1 || v.Estatus === 4).length}
                    </span>
                </button>
                <button className={`tab-button ${activeTab === 'validadas' ? 'active' : ''}`} onClick={() => handleTabChange('validadas')}>
                    <CheckCircle size={16} /> Validadas / Canceladas 
                    <span className="tab-count">
                        {filtrosAplicados ? cantidadesFiltradas.validadas : vacaciones.filter(v => v.Estatus === 2 || v.Estatus === 3).length}
                    </span>
                </button>
            </div>

            {filtrosAplicados && (
                <div className="filtros-activos-indicator" style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '16px',
                    padding: '8px 12px',
                    backgroundColor: '#FFF3E0',
                    borderRadius: '4px',
                    fontSize: '13px'
                }}>
                    <span>
                        <Info size={14} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
                        Mostrando resultados con filtros aplicados
                    </span>
                    <button 
                        onClick={limpiarFiltros}
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#F57C00', 
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontSize: '12px'
                        }}
                    >
                        Limpiar filtros
                    </button>
                </div>
            )}

            <div className="filtros-container">
                <div className="filtros-basicos">
                    <div className="filtro-group">
                        <label className="filtro-label">Fecha Solicitud:</label>
                        <input type="date" className="filtro-input" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">No. Empleado:</label>
                        <input type="text" className="filtro-input" placeholder="Buscar por número..." value={filtros.NoEmpleado} onChange={(e) => handleFiltroChange('NoEmpleado', e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Nombre Completo:</label>
                        <input type="text" className="filtro-input" placeholder="Buscar por nombre..." value={filtros.NombreCompleto} onChange={(e) => handleFiltroChange('NombreCompleto', e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Año:</label>
                        <select className="filtro-input" value={filtros.Anio || ''} onChange={(e) => handleFiltroChange('Anio', e.target.value ? Number(e.target.value) : 0)}>
                            <option value="">Todos</option>
                            {Array.from(new Set(vacaciones.map(v => v.Anio).filter(a => a > 0))).sort((a,b) => b - a).map(anio => (<option key={anio} value={anio}>{anio}</option>))}
                        </select>
                    </div>
                    <div className="filtro-group">
                        <button type="button" className="btn btn-primary buscar-btn" onClick={aplicarFiltros} style={{ marginTop: '24px', backgroundColor: '#F57C00', border: 'none', color: 'white', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}>Buscar</button>
                    </div>
                    <button className="filtros-avanzados-btn" onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}>
                        <Filter size={16} /> <span>Filtros Avanzados</span> <ChevronDown size={16} className={`chevron ${showFiltrosAvanzados ? 'rotated' : ''}`} />
                    </button>
                </div>

                {showFiltrosAvanzados && (
                    <div className="filtros-avanzados">
                        <div className="filtros-avanzados-grid">
                            <div className="filtro-group">
                                <label className="filtro-label">Departamento:</label>
                                <SelectConBusqueda options={departamentos} value={filtros.Departamento || ''} onChange={(value) => handleFiltroChange('Departamento', value)} placeholder="Seleccione un departamento..." />
                            </div>
                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Inicio Vacaciones:</label>
                                <input type="date" className="filtro-input" value={filtros.FechaInicioVacaciones} onChange={(e) => handleFiltroChange('FechaInicioVacaciones', e.target.value)} />
                            </div>
                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Fin Vacaciones:</label>
                                <input type="date" className="filtro-input" value={filtros.FechaFinVacaciones} onChange={(e) => handleFiltroChange('FechaFinVacaciones', e.target.value)} />
                            </div>
                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Ingreso:</label>
                                <input type="date" className="filtro-input" value={filtros.FechaIngreso} onChange={(e) => handleFiltroChange('FechaIngreso', e.target.value)} />
                            </div>
                        </div>
                        <div className="filtros-avanzados-actions">
                            <button className="btn btn-secondary" onClick={limpiarFiltros}>Limpiar Filtros</button>
                        </div>
                    </div>
                )}
            </div>

            <div className="vacaciones-content">
                {loadingOptions && (<div className="loading-options"><span>Cargando opciones...</span></div>)}
                <Tabla columns={currentColumns} data={vacacionesFiltrados} pageSize={10} pageSizeOptions={[5, 10, 25, 50]} emptyMessage={!filtrosAplicados ? "Aplique filtros y presione 'Buscar' para ver las solicitudes" : (activeTab === 'solicitadas' ? "No hay solicitudes pendientes que coincidan con los filtros" : (activeTab === 'autorizadas' ? "No hay solicitudes autorizadas que coincidan con los filtros" : "No hay solicitudes validadas/canceladas que coincidan con los filtros"))} className="full-height-table" loading={loading} />
            </div>

            {showForm && (
                <div className="form-vacaciones-modal-overlay">
                    <div className="form-vacaciones-modal">
                        <div className="form-vacaciones-modal-header">
                            <h2 className="form-vacaciones-modal-title">{tipoFormulario === 'Modificar' ? 'Editar Solicitud de Vacaciones' : tipoFormulario === 'Ver' ? 'Ver Solicitud de Vacaciones' : 'Nueva Solicitud de Vacaciones'}</h2>
                            <button className="close-button" onClick={() => { setShowForm(false); resetForm(); setTipoFormulario('Agregar'); }}><X size={20} /></button>
                        </div>
                        <div className="form-vacaciones-modal-body">
                            {(advertenciaAnticipacion || advertenciaViernes) && (
                                <div className="advertencias-container" style={{ backgroundColor: '#FFF3CD', borderLeft: '4px solid #FFC107', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><AlertCircle size={18} color="#856404" /><strong style={{ color: '#856404' }}>Advertencias:</strong></div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>{advertenciaAnticipacion && <li>{advertenciaAnticipacion}</li>}{advertenciaViernes && <li>{advertenciaViernes}</li>}</ul>
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="form-section">
                                    <h3 className="form-section-title">Información del Empleado</h3>
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">No. Empleado</label>
                                            <SelectConBusqueda 
                                                options={empleados} 
                                                value={selectedEmpleadoId} 
                                                onChange={handleEmpleadoChange} 
                                                placeholder="Seleccione un empleado..." 
                                                disabled={isViewMode || tipoFormulario === 'Modificar' || !isHRorAdmin} 
                                                required 
                                            />
                                            {tipoFormulario === 'Modificar' && (
                                                <div style={{ fontSize: '12px', color: '#F57C00', marginTop: '4px' }}>
                                                    <Info size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                    No se puede cambiar el empleado en modo edición
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Departamento</label><input type="text" value={vacacionesForm.Departamento || ''} className="form-vacaciones-input" disabled={true} /></div>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Cargo</label><input type="text" value={vacacionesForm.Cargo || ''} className="form-vacaciones-input" disabled={true} /></div>
                                    </div>
                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Fecha de Ingreso</label><input type="date" value={fechaIngresoInput} className="form-vacaciones-input" disabled={true} /></div>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Antigüedad</label><input type="text" value={`${vacacionesForm.Antiguedad || 0} años`} className="form-vacaciones-input" disabled={true} /></div>
                                    </div>
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Fecha de Solicitud</label>
                                            <input 
                                                type="date" 
                                                value={fechaSolicitudInput} 
                                                onChange={handleFechaSolicitudChange} 
                                                className="form-vacaciones-input" 
                                                disabled={isViewMode || !isHRorAdmin} 
                                                required 
                                                max={new Date().toISOString().split('T')[0]}
                                            />
                                            {!isViewMode && isHRorAdmin && (
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                                    Seleccione la fecha en que se realiza la solicitud
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-section">
                                    <h3 className="form-section-title">Período de Vacaciones</h3>
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Año del Período</label>
                                            <SelectConBusqueda 
                                                options={aniosDisponibles} 
                                                value={selectedAnio?.toString() || ''} 
                                                onChange={handleAnioChange} 
                                                placeholder="Seleccione el año del período..." 
                                                disabled={isViewMode || !isHRorAdmin || cargandoPeriodos || aniosDisponibles.length === 0} 
                                                required 
                                            />
                                            {aniosDisponibles.length === 0 && !cargandoPeriodos && selectedEmpleadoId && (<div className="info-message" style={{ marginTop: '8px', fontSize: '12px', color: '#DC3545', display: 'flex', alignItems: 'center', gap: '8px' }}><span>No hay períodos con días disponibles para este empleado</span></div>)}
                                        </div>
                                    </div>
                                    {(tipoFormulario === 'Modificar' || tipoFormulario === 'Ver') && vacacionesForm.Anio && vacacionesForm.Anio > 0 && (
                                        <div className="form-vacaciones-row" style={{ marginTop: '8px' }}>
                                            <div className="form-vacaciones-group">
                                                <label className="form-vacaciones-label">Año Original de la Solicitud</label>
                                                <input 
                                                    type="text" 
                                                    value={`${vacacionesForm.Anio}`} 
                                                    className="form-vacaciones-input" 
                                                    disabled={true} 
                                                    style={{ backgroundColor: '#e9ecef', fontWeight: '500', color: '#F57C00' }}
                                                />
                                                {vacacionesForm.Anio !== selectedAnio && selectedAnio && (
                                                    <div style={{ fontSize: '12px', color: '#F57C00', marginTop: '4px' }}>
                                                        <strong>Nota:</strong> El período seleccionado ({selectedAnio}) es diferente al año original de la solicitud ({vacacionesForm.Anio})
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {periodoSeleccionado && (
                                        <div className="form-vacaciones-row" style={{ marginTop: '16px' }}>
                                            <div className="form-vacaciones-group">
                                                <label className="form-vacaciones-label">Información del Período Seleccionado</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '8px' }}>
                                                    <div className="info-card-readonly"><label className="info-label-small">Días que Corresponden</label><input type="text" value={`${periodoSeleccionado.DiasGenera || 0} días`} className="form-vacaciones-input" disabled={true} readOnly style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', color: '#F57C00' }} /></div>
                                                    <div className="info-card-readonly"><label className="info-label-small">Saldo de Días</label><input type="text" value={`${diasDisponiblesPeriodo} días`} className="form-vacaciones-input" disabled={true} readOnly style={{ backgroundColor: '#f5f5f5', fontWeight: 'bold', color: '#F57C00' }} /></div>
                                                    <div className="info-card-readonly"><label className="info-label-small">Días Disfrutados</label><input type="text" value={`${periodoSeleccionado.DiasDisfrutados || 0} días`} className="form-vacaciones-input" disabled={true} readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="form-vacaciones-row three-columns" style={{ marginTop: '20px' }}>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label required">Días a Solicitar</label><input type="number" name="DiasTomar" value={vacacionesForm.DiasTomar || ''} onChange={handleDiasTomarChange} className="form-vacaciones-input" placeholder="Días a solicitar" disabled={isViewMode || !isHRorAdmin || !selectedAnio} required min="1" max={diasDisponiblesPeriodo || undefined} /></div>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Saldo Restante</label><input type="text" value={`${saldoRestante} días`} className="form-vacaciones-input" disabled={true} readOnly style={{ backgroundColor: '#f5f5f5' }} /></div>
                                    </div>
                                    <div className="form-vacaciones-row three-columns">
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label required">Fecha de Inicio</label><input type="date" value={fechaInicioInput} onChange={handleFechaInicioChange} className="form-vacaciones-input" disabled={isViewMode || !isHRorAdmin || !selectedAnio} required /></div>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label required">Fecha de Fin</label><input type="date" value={fechaFinInput} onChange={handleFechaFinChange} className="form-vacaciones-input" disabled={isViewMode || !isHRorAdmin || !selectedAnio} required /></div>
                                        <div className="form-vacaciones-group"><label className="form-vacaciones-label">Fecha de Reintegración a Labores<span style={{ marginLeft: '8px', cursor: 'help' }} title="Puede modificar esta fecha si es necesario (ej. si cae en fin de semana)"><Info size={14} style={{ display: 'inline', verticalAlign: 'middle', color: '#6c757d' }} /></span></label><input type="date" value={fechaRetornoInput} onChange={handleFechaRetornoChange} className="form-vacaciones-input" disabled={isViewMode || !isHRorAdmin || !selectedAnio} /></div>
                                    </div>
                                    {isViewMode && vacacionesForm.UsuarioAutoriza && (
                                        <div className="form-vacaciones-row two-columns">
                                            <div className="form-vacaciones-group"><label className="form-vacaciones-label">Usuario que Autorizó</label><input type="text" value={vacacionesForm.UsuarioAutoriza} className="form-vacaciones-input" disabled /></div>
                                            <div className="form-vacaciones-group"><label className="form-vacaciones-label">Fecha de Autorización</label><input type="date" value={formatDateForInput(vacacionesForm.FechaAutoriza || '')} className="form-vacaciones-input" disabled /></div>
                                        </div>
                                    )}
                                    {isViewMode && vacacionesForm.UsuarioValida && (
                                        <div className="form-vacaciones-row two-columns">
                                            <div className="form-vacaciones-group"><label className="form-vacaciones-label">Usuario que Validó</label><input type="text" value={vacacionesForm.UsuarioValida} className="form-vacaciones-input" disabled /></div>
                                            <div className="form-vacaciones-group"><label className="form-vacaciones-label">Fecha de Validación</label><input type="date" value={formatDateForInput(vacacionesForm.FechaValidado || '')} className="form-vacaciones-input" disabled /></div>
                                        </div>
                                    )}
                                    {isViewMode && vacacionesForm.Comentarios && (
                                        <div className="form-vacaciones-row">
                                            <div className="form-vacaciones-group"><label className="form-vacaciones-label">Comentarios</label><textarea value={vacacionesForm.Comentarios} className="form-vacaciones-textarea" disabled rows={3} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} /></div>
                                        </div>
                                    )}
                                </div>
                                <div className="form-vacaciones-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => { setShowForm(false); resetForm(); setTipoFormulario('Agregar'); }}>{isViewMode ? 'Cerrar' : 'Cancelar'}</button>
                                    {!isViewMode && isHRorAdmin && (<button type="submit" className="btn btn-primary orange-button" disabled={submitting || cargandoPeriodos || aniosDisponibles.length === 0 || !selectedAnio}>{submitting ? 'Guardando...' : 'Guardar'}</button>)}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <DeleteConfirmationModal visible={deleteModalVisible} onClose={() => { setDeleteModalVisible(false); setVacacionAEliminar(null); }} vacacion={vacacionAEliminar} onConfirm={handleConfirmDelete} loading={eliminando} />
            <ActionConfirmationModal visible={actionModalVisible} onClose={() => { setActionModalVisible(false); setVacacionAccion(null); }} vacacion={vacacionAccion} onConfirm={confirmAction} loading={accionEnProceso} actionType={actionType} />
        </div>
    );
};

export default Vacaciones;