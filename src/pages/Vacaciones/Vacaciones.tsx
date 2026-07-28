import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
    const showAuthorizeButton = (idRolUsuario === 2 || idRolUsuario === 3) && row.Estatus === 0 && activeTab === 'solicitadas';
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
    const [noContarDomingos, setNoContarDomingos] = useState(false);
    const [diasSinDomingos, setDiasSinDomingos] = useState(0);
    
    const [usuarioSesion, setUsuarioSesion] = useState<CatalogoUsuario | null>(null);
    const [vacaciones, setVacaciones] = useState<InterfaceVacaciones[]>([]);
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
    const [filtroFecha, setFiltroFecha] = useState<string>('');
    
    const [filtros, setFiltros] = useState<FiltrosVacaciones>({
        NoEmpleado: 0,
        NombreCompleto: '',
        Departamento: '',
        FechaInicioVacaciones: '',
        FechaFinVacaciones: '',
        JefeInmediato: '',
        FechaIngreso: '',
        FechaSolicitud: '',
        Estatus: 0,
        Anio: 0
    });

    const [filtrosAplicados, setFiltrosAplicados] = useState(false);
    
    const [periodosVacaciones, setPeriodosVacaciones] = useState<PeriodoVacaciones[]>([]);
    const [aniosDisponibles, setAniosDisponibles] = useState<OpcionSelect[]>([]);
    const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
    const [diasDisponiblesPeriodo, setDiasDisponiblesPeriodo] = useState<number>(0);
    const [cargandoPeriodos, setCargandoPeriodos] = useState(false);
    const [saldoRestante, setSaldoRestante] = useState<number>(0);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoVacaciones | null>(null);
    const [advertenciaAnticipacion, setAdvertenciaAnticipacion] = useState<string>('');
    const [advertenciaViernes, setAdvertenciaViernes] = useState<string>('');
    const [advertenciaRetornoDomingo, setAdvertenciaRetornoDomingo] = useState<string>('');
    const [advertenciaInicioDomingo, setAdvertenciaInicioDomingo] = useState<string>('');
    const [advertenciaFinDomingo, setAdvertenciaFinDomingo] = useState<string>('');

    const filtroTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const idRolUsuario = Number(usuarioSesion?.rol) || 0;
    const isHRorAdmin = idRolUsuario === 1 || idRolUsuario === 2 || idRolUsuario === 3;
    const canEditDelete = isHRorAdmin;
    const isAuthorizer = idRolUsuario === 3 || idRolUsuario === 2;
    const isValidator = idRolUsuario === 2;

    const esDomingo = useCallback((fecha: string) => {
        if (!fecha) return false;
        const date = new Date(fecha + 'T00:00:00');
        return date.getDay() === 0;
    }, []);

    const verificarRetornoDomingo = useCallback(() => {
        const fechaRetorno = vacacionesForm.FechaRetornoLabores;
        const departamento = vacacionesForm.Departamento || '';
        
        if (!fechaRetorno) {
            setAdvertenciaRetornoDomingo('');
            return;
        }
        
        const esAdministracion = departamento === 'Administración' || departamento === '1';
        
        if (!esAdministracion) {
            setAdvertenciaRetornoDomingo('');
            return;
        }
        
        const retorno = new Date(fechaRetorno + 'T00:00:00');
        const esDomingoDay = retorno.getDay() === 0;
        
        if (esDomingoDay) {
            setAdvertenciaRetornoDomingo("ADVERTENCIA: Para el departamento de Administración, la fecha de retorno no puede ser domingo. Debe ajustar la fecha.");
        } else {
            setAdvertenciaRetornoDomingo('');
        }
    }, [vacacionesForm.FechaRetornoLabores, vacacionesForm.Departamento]);

    const esSabado = useCallback((fecha: string) => {
        if (!fecha) return false;
        const date = new Date(fecha + 'T00:00:00');
        return date.getDay() === 6;
    }, []);

    const contarDiasHabiles = useCallback((fechaInicio: string, fechaFin: string, excluirDomingos: boolean) => {
        if (!fechaInicio || !fechaFin) return 0;
        
        const inicio = new Date(fechaInicio + 'T00:00:00');
        const fin = new Date(fechaFin + 'T00:00:00');
        
        if (fin < inicio) return 0;
        
        let contador = 0;
        const fechaActual = new Date(inicio);
        
        while (fechaActual <= fin) {
            const diaSemana = fechaActual.getDay();
            if (!excluirDomingos || diaSemana !== 0) {
                contador++;
            }
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
        
        return contador;
    }, []);

    const calcularFechaFin = useCallback((
        fechaInicio: string,
        dias: number,
        excluirDomingos: boolean
    ) => {
        if (!fechaInicio || dias <= 0) return '';

        const fecha = new Date(fechaInicio + 'T00:00:00');
        let diasContados = 0;

        if (excluirDomingos && fecha.getDay() === 0) {
            fecha.setDate(fecha.getDate() + 1);
        }

        while (diasContados < dias) {
            if (!excluirDomingos || fecha.getDay() !== 0) {
                diasContados++;
            }
            if (diasContados < dias) {
                fecha.setDate(fecha.getDate() + 1);
            }
        }

        if (excluirDomingos && fecha.getDay() === 0) {
            fecha.setDate(fecha.getDate() + 1);
        }

        return fecha.toISOString().split('T')[0];
    }, []);

    const calcularFechaRetorno = useCallback((
        fechaFin: string,
        excluirDomingos: boolean
    ) => {
        if (!fechaFin) return '';

        const retorno = new Date(fechaFin + 'T00:00:00');
        retorno.setDate(retorno.getDate() + 1);

        if (excluirDomingos) {
            while (retorno.getDay() === 0) {
                retorno.setDate(retorno.getDate() + 1);
            }
        }

        return retorno.toISOString().split('T')[0];
    }, []);

    const recalcularTodo = useCallback((fechaInicio: string, dias: number, excluirDomingos: boolean) => {
        if (!fechaInicio || !dias || dias <= 0) {
            setFechaFinInput('');
            setFechaRetornoInput('');
            setDiasSinDomingos(0);
            setVacacionesForm(prev => ({ 
                ...prev, 
                FechaFin: '', 
                FechaRetornoLabores: '',
                DiasTomar: 0
            }));
            return;
        }
        
        if (excluirDomingos && esDomingo(fechaInicio)) {
            setAdvertenciaInicioDomingo("ADVERTENCIA: La fecha de inicio no puede ser domingo cuando no se cuentan domingos.");
            const fecha = new Date(fechaInicio + 'T00:00:00');
            fecha.setDate(fecha.getDate() + 1);
            const nuevaFechaInicio = fecha.toISOString().split('T')[0];
            setFechaInicioInput(nuevaFechaInicio);
            setVacacionesForm(prev => ({ ...prev, FechaInicio: nuevaFechaInicio }));
            setTimeout(() => {
                recalcularTodo(nuevaFechaInicio, dias, excluirDomingos);
            }, 50);
            return;
        } else {
            setAdvertenciaInicioDomingo('');
        }
        
        const fechaFin = calcularFechaFin(fechaInicio, dias, excluirDomingos);
        setFechaFinInput(fechaFin);
        setVacacionesForm(prev => ({ ...prev, FechaFin: fechaFin }));
        
        const diasContados = contarDiasHabiles(fechaInicio, fechaFin, excluirDomingos);
        setDiasSinDomingos(diasContados);
        setVacacionesForm(prev => ({ ...prev, DiasTomar: diasContados }));
        
        const nuevoSaldo = diasDisponiblesPeriodo - diasContados;
        setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
        
        const fechaRetorno = calcularFechaRetorno(fechaFin, excluirDomingos);
        setFechaRetornoInput(fechaRetorno);
        setVacacionesForm(prev => ({ ...prev, FechaRetornoLabores: fechaRetorno }));
        
        if (excluirDomingos && esDomingo(fechaFin)) {
            setAdvertenciaFinDomingo(`La fecha de fin no puede ser domingo. Se ajustó automáticamente a ${fechaFin}`);
        } else {
            setAdvertenciaFinDomingo('');
        }
        
        setTimeout(() => {
            verificarRetornoDomingo();
        }, 50);
    }, [diasDisponiblesPeriodo, esDomingo, calcularFechaFin, calcularFechaRetorno, contarDiasHabiles, verificarRetornoDomingo]);

    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
             
            const usuario = usuarioSesion;
            const departamentoUsuario = usuario?.Departamento?.toString() || '';
            const esAdministracion = departamentoUsuario === '1' || departamentoUsuario === 'Administración';
             
            let url = `/vacaciones/opciones/ObtenerEmpleados.php?idusuario=${usuarioSesion?.IdUsuario}`;
             
            if (esAdministracion) {
                url += `&departamento=1&soloAsignados=true`;
            }
            
            const [empleadosResponse, departamentosResponse] = await Promise.all([
                apiService.get<RespuestaAPI>(url),
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
    }, [usuarioSesion]);

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
                            SaldoDias: periodo.DiasDisponibles,
                            Anio: periodo.Año
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
                    SaldoDias: 0,
                    Anio: 0
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
            SaldoDias: 0,
            Anio: 0
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

    const resetForm = useCallback(() => {
        const todayStr = new Date().toISOString().split('T')[0];
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
        setAdvertenciaRetornoDomingo('');
        setAdvertenciaInicioDomingo('');
        setAdvertenciaFinDomingo('');
        setNoContarDomingos(false);
        setDiasSinDomingos(0);
    }, []);

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
                    SaldoDias: periodo.DiasDisponibles,
                    Anio: periodo.Año
                }));
            }
        } else {
            setPeriodoSeleccionado(null);
            setDiasDisponiblesPeriodo(0);
            setSaldoRestante(0);
            setVacacionesForm(prev => ({
                ...prev,
                DiasCorresponden: 0,
                Antiguedad: 0,
                SaldoDias: 0,
                Anio: 0
            }));
        }
    }, [periodosVacaciones, vacacionesForm.DiasTomar]);


    const verificarAnticipacionSolicitud = useCallback(() => {
        const fechaSolicitud = vacacionesForm.FechaSolicitud;
        const fechaInicio = vacacionesForm.FechaInicio;
        const diasTomar = vacacionesForm.DiasTomar || 0;
        
        if (!fechaSolicitud || !fechaInicio || diasTomar === 0) {
            setAdvertenciaAnticipacion('');
            return;
        }
        
        const solicitud = new Date(fechaSolicitud + 'T00:00:00');
        const inicio = new Date(fechaInicio + 'T00:00:00');
        
        const diffTime = inicio.getTime() - solicitud.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diasTomar >= 1 && diasTomar <= 3) {
            if (diffDays < 3) {
                setAdvertenciaAnticipacion("ADVERTENCIA: Para solicitudes de 1 a 3 días, se requiere mínimo 3 días de anticipación.");
            } else {
                setAdvertenciaAnticipacion('');
            }
        } else if (diasTomar >= 4) {
            if (diffDays < 14) {
                setAdvertenciaAnticipacion("ADVERTENCIA: Para solicitudes de 4 o más días, se requiere mínimo 2 semanas de anticipación.");
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
        
        const inicio = new Date(fechaInicio + 'T00:00:00');
        const esViernes = inicio.getDay() === 5;
        
        if (esViernes) {
            setAdvertenciaViernes("ADVERTENCIA: La solicitud comienza en viernes. Si el sábado estaba planeado como home office, deberá asistir a la oficina o solicitar ese día también.");
        } else {
            setAdvertenciaViernes('');
        }
    }, [vacacionesForm.FechaInicio]);

    const handleNoContarDomingosChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;
        setNoContarDomingos(checked);
        
        const fechaInicio = vacacionesForm.FechaInicio;
        const diasTomar = vacacionesForm.DiasTomar;
        
        if (fechaInicio && diasTomar && diasTomar > 0) {
            recalcularTodo(fechaInicio, diasTomar, checked);
        } else if (fechaInicio && vacacionesForm.FechaFin) {
            const diasHabiles = contarDiasHabiles(fechaInicio, vacacionesForm.FechaFin, checked);
            setDiasSinDomingos(diasHabiles);
            setVacacionesForm(prev => ({ ...prev, DiasTomar: diasHabiles }));
            
            const nuevoSaldo = diasDisponiblesPeriodo - diasHabiles;
            setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
            
            const fechaRetorno = calcularFechaRetorno(vacacionesForm.FechaFin, checked);
            setFechaRetornoInput(fechaRetorno);
            setVacacionesForm(prev => ({ ...prev, FechaRetornoLabores: fechaRetorno }));
            
            if (checked && esDomingo(fechaInicio)) {
                setAdvertenciaInicioDomingo("ADVERTENCIA: La fecha de inicio no puede ser domingo cuando no se cuentan domingos.");
            } else {
                setAdvertenciaInicioDomingo('');
            }
            
            if (checked && esDomingo(vacacionesForm.FechaFin)) {
                const nuevaFechaFin = calcularFechaFin(fechaInicio, diasHabiles, checked);
                setFechaFinInput(nuevaFechaFin);
                setVacacionesForm(prev => ({ ...prev, FechaFin: nuevaFechaFin }));
                setAdvertenciaFinDomingo(`La fecha de fin no puede ser domingo. Se ajustó automáticamente a ${nuevaFechaFin}`);
            } else {
                setAdvertenciaFinDomingo('');
            }
        }
    }, [vacacionesForm.FechaInicio, vacacionesForm.FechaFin, vacacionesForm.DiasTomar, diasDisponiblesPeriodo, esDomingo, contarDiasHabiles, calcularFechaRetorno, calcularFechaFin, recalcularTodo]);

    const handleFechaInicioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaInicioInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaInicio: isoDate }));
        
        if (noContarDomingos && esDomingo(isoDate)) {
            setAdvertenciaInicioDomingo("ADVERTENCIA: La fecha de inicio no puede ser domingo cuando no se cuentan domingos.");
            return;
        } else {
            setAdvertenciaInicioDomingo('');
        }
        
        const diasTomar = vacacionesForm.DiasTomar;
        
        if (diasTomar && diasTomar > 0) {
            recalcularTodo(isoDate, diasTomar, noContarDomingos);
        }
        
        verificarViernes();
        verificarAnticipacionSolicitud();
    }, [vacacionesForm.DiasTomar, noContarDomingos, esDomingo, recalcularTodo, verificarViernes, verificarAnticipacionSolicitud]);

    const handleFechaFinChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const isoDate = value || '';

            if (noContarDomingos && esDomingo(isoDate)) {
                showToast({
                    text: 'La fecha fin no puede ser domingo.',
                    type: 'warning',
                    autoClose: 2000
                });
                return;
            }

            setAdvertenciaFinDomingo('');
            setFechaFinInput(value);

            setVacacionesForm(prev => ({
                ...prev,
                FechaFin: isoDate
            }));

            if (vacacionesForm.FechaInicio) {
                const dias = contarDiasHabiles(
                    vacacionesForm.FechaInicio,
                    isoDate,
                    noContarDomingos
                );

                setDiasSinDomingos(dias);

                setVacacionesForm(prev => ({
                    ...prev,
                    DiasTomar: dias
                }));

                setSaldoRestante(
                    Math.max(diasDisponiblesPeriodo - dias, 0)
                );
            }

            const retorno = calcularFechaRetorno(
                isoDate,
                noContarDomingos
            );

            setFechaRetornoInput(retorno);

            setVacacionesForm(prev => ({
                ...prev,
                FechaRetornoLabores: retorno
            }));
        },
        [
            vacacionesForm.FechaInicio,
            noContarDomingos,
            diasDisponiblesPeriodo,
            contarDiasHabiles,
            calcularFechaRetorno,
            esDomingo
        ]);

    const handleDiasTomarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const dias = value ? Number(value) : 0;
        
        if (dias < 0) {
            showToast({
                text: 'Los días no pueden ser negativos',
                type: 'error',
                autoClose: 2000
            });
            return;
        }
        
        if (dias > diasDisponiblesPeriodo && diasDisponiblesPeriodo > 0) {
            showToast({
                text: `Los días solicitados no pueden exceder los días disponibles (${diasDisponiblesPeriodo} días)`,
                type: 'error',
                autoClose: 3000
            });
            return;
        }
        
        setVacacionesForm(prev => ({ ...prev, DiasTomar: dias }));
        setDiasSinDomingos(dias);
        
        const nuevoSaldo = diasDisponiblesPeriodo - dias;
        setSaldoRestante(nuevoSaldo >= 0 ? nuevoSaldo : 0);
        
        if (vacacionesForm.FechaInicio && dias > 0) {
            recalcularTodo(vacacionesForm.FechaInicio, dias, noContarDomingos);
        } else if (dias === 0) {
            setFechaFinInput('');
            setFechaRetornoInput('');
            setVacacionesForm(prev => ({ ...prev, FechaFin: '', FechaRetornoLabores: '' }));
            setDiasSinDomingos(0);
        }
        
        verificarAnticipacionSolicitud();
    }, [vacacionesForm.FechaInicio, diasDisponiblesPeriodo, noContarDomingos, recalcularTodo, verificarAnticipacionSolicitud]);

    const handleFechaSolicitudChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFechaSolicitudInput(value);
        const isoDate = value || '';
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: isoDate }));
        verificarAnticipacionSolicitud();
    }, [verificarAnticipacionSolicitud]);

    const handleFechaRetornoChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            const isoDate = value || '';

            if (noContarDomingos && esDomingo(isoDate)) {
                showToast({
                    text: 'La fecha de reintegración no puede ser domingo.',
                    type: 'warning',
                    autoClose: 2000
                });
                return;
            }

            setFechaRetornoInput(value);

            setVacacionesForm(prev => ({
                ...prev,
                FechaRetornoLabores: isoDate
            }));
        },
        [
            noContarDomingos,
            esDomingo
        ]);

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
        if (!selectedAnio && !vacacionesForm.Anio) {
            showToast({ text: 'Debe seleccionar el año del período de vacaciones', type: 'error' });
            return false;
        }
        if (!vacacionesForm.FechaSolicitud) {
            showToast({ text: 'La fecha de solicitud es requerida', type: 'error' });
            return false;
        }
        
        const fechaInicio = new Date(vacacionesForm.FechaInicio + 'T00:00:00');
        const fechaFin = new Date(vacacionesForm.FechaFin + 'T00:00:00');
        
        if (fechaFin < fechaInicio) {
            showToast({ text: 'La fecha de fin debe ser mayor o igual a la fecha de inicio', type: 'error' });
            return false;
        }

        if (noContarDomingos) {
            if (esDomingo(vacacionesForm.FechaInicio)) {
                showToast({ text: 'La fecha de inicio no puede ser domingo cuando no se cuentan domingos', type: 'error' });
                return false;
            }
            if (esDomingo(vacacionesForm.FechaFin)) {
                showToast({ text: 'La fecha de fin no puede ser domingo cuando no se cuentan domingos', type: 'error' });
                return false;
            }
        }

        const diasTomar = noContarDomingos ? diasSinDomingos : vacacionesForm.DiasTomar;
        if (diasTomar > diasDisponiblesPeriodo && diasDisponiblesPeriodo > 0) {
            showToast({ text: `No hay suficientes días disponibles. Máximo: ${diasDisponiblesPeriodo} días`, type: 'error' });
            return false;
        }
        
        return true;
    }, [vacacionesForm, selectedAnio, diasDisponiblesPeriodo, noContarDomingos, diasSinDomingos, esDomingo]);

    const fetchVacaciones = useCallback(async () => {
        try {
            setLoading(true);
            
            const params = new URLSearchParams();
            
            if (filtroFecha) {
                params.append('fechaSolicitud', filtroFecha);
            }
            
            if (filtros.NoEmpleado && filtros.NoEmpleado !== 0) {
                params.append('noEmpleado', filtros.NoEmpleado.toString());
            }
            
            if (filtros.NombreCompleto) {
                params.append('nombreCompleto', filtros.NombreCompleto);
            }
            
            if (filtros.Departamento) {
                params.append('departamento', filtros.Departamento);
            }
            
            if (filtros.FechaInicioVacaciones) {
                params.append('fechaInicioVacaciones', filtros.FechaInicioVacaciones);
            }
            
            if (filtros.FechaFinVacaciones) {
                params.append('fechaFinVacaciones', filtros.FechaFinVacaciones);
            }
            
            if (filtros.FechaIngreso) {
                params.append('fechaIngreso', filtros.FechaIngreso);
            }
            
            if (filtros.Anio && filtros.Anio !== 0) {
                params.append('anio', filtros.Anio.toString());
            }
            
            const url = `/vacaciones/ObtenerListado.php${params.toString() ? '?' + params.toString() : ''}`;
            
            const response = await apiService.get<RespuestaAPI>(url);
            
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
                    NoContarDomingos: Number(item.NoContarDomingos) || 0,
                    FechaInicio: item.FechaInicio || '',
                    FechaFin: item.FechaFin || '',
                    FechaSolicitud: item.FechaSolicitud || '',
                    FechaRetornoLabores: item.FechaRetornoLabores || '',
                    FechaAutoriza: item.FechaAutoriza || '',
                    FechaValidado: item.FechaValidado || '',
                    FechaIngreso: item.FechaIngreso || '',
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
                setFiltrosAplicados(true);
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
    }, [filtroFecha, filtros]);

    const handleFiltroChange = (campo: keyof FiltrosVacaciones, valor: string | number) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
        
        if (filtroTimeoutRef.current) {
            clearTimeout(filtroTimeoutRef.current);
        }
        
        filtroTimeoutRef.current = setTimeout(() => {
            fetchVacaciones();
        }, 500);
    };

    const handleFiltroFechaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFiltroFecha(value);
        
        if (filtroTimeoutRef.current) {
            clearTimeout(filtroTimeoutRef.current);
        }
        
        filtroTimeoutRef.current = setTimeout(() => {
            fetchVacaciones();
        }, 500);
    };

    const handleAnioFiltroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value ? Number(e.target.value) : 0;
        setFiltros(prev => ({
            ...prev,
            Anio: value
        }));
        
        if (filtroTimeoutRef.current) {
            clearTimeout(filtroTimeoutRef.current);
        }
        
        filtroTimeoutRef.current = setTimeout(() => {
            fetchVacaciones();
        }, 500);
    };

    const limpiarFiltros = () => {
        setFiltros({
            NoEmpleado: 0,
            NombreCompleto: '',
            Departamento: '',
            FechaInicioVacaciones: '',
            FechaFinVacaciones: '',
            JefeInmediato: '',
            FechaIngreso: '',
            FechaSolicitud: '',
            Estatus: 0,
            Anio: 0
        });
        setFiltroFecha('');
        setFiltrosAplicados(false);
        
        if (filtroTimeoutRef.current) {
            clearTimeout(filtroTimeoutRef.current);
        }
        
        fetchVacaciones();
        
        showToast({
            text: 'Filtros limpiados',
            type: 'info',
            autoClose: 1500
        });
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        const diasTomarFinal = noContarDomingos ? diasSinDomingos : vacacionesForm.DiasTomar;
        const formData = {
            ...vacacionesForm,
            DiasTomar: diasTomarFinal
        };
        
        setVacacionesForm(formData);
        
        if (!validateForm()) {
            return;
        }
        
        try {
            setSubmitting(true);
            
            const esActualizacion = (vacacionesForm.IdVacaciones || 0) !== 0;
            const anioParaEnviar = selectedAnio || vacacionesForm.Anio;
            
            if (!anioParaEnviar) {
                showToast({ text: 'No se puede determinar el año de vacaciones', type: 'error' });
                setSubmitting(false);
                return;
            }
            
            let estatusInicial = 0;
            if (!esActualizacion && (isAuthorizer || isValidator)) {
                estatusInicial = 1;
            }
            
            let datosNormalizados: any = {
                ...vacacionesForm,
                IdPersonal: vacacionesForm.IdPersonal,
                Anio: anioParaEnviar,
                DiasTomar: diasTomarFinal,
                FechaRetornoLabores: vacacionesForm.FechaRetornoLabores,
                SaldoDias: vacacionesForm.SaldoDias || diasDisponiblesPeriodo,
                DiasCorresponden: vacacionesForm.DiasCorresponden || 0,
                Antiguedad: vacacionesForm.Antiguedad || 0,
                NoContarDomingos: noContarDomingos ? 1 : 0
            };
            
            const usuarioSolicitaId = vacacionesForm.IdPersonal?.toString() || '';
            const usuarioAutorizaId = usuarioSesion?.IdUsuario?.toString() || '';
            const esMismoUsuario = usuarioSolicitaId === usuarioAutorizaId;
            
            if (!esActualizacion) {
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
    }, [vacacionesForm, usuarioSesion, validateForm, selectedAnio, isAuthorizer, isValidator, fetchVacaciones, resetForm, diasDisponiblesPeriodo, noContarDomingos, diasSinDomingos]);

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
                    let usuarioAutoriza = usuarioSesion?.IdUsuario?.toString() || '';
                    
                    if (idRolUsuario === 1) {
                        try {
                            const response = await apiService.get<RespuestaAPI>(
                                `/vacaciones/ObtenerJefeInmediato.php?IdPersonal=${vacacionAccion.IdPersonal}`
                            );
                            
                            if (response.status && response.data) {
                                usuarioAutoriza = usuarioSesion?.IdUsuario?.toString() || '';
                            }
                        } catch (error) {
                            console.error('Error al obtener jefe inmediato:', error);
                            usuarioAutoriza = usuarioSesion?.IdUsuario?.toString() || '';
                        }
                    }
                    
                    datosActualizacion = {
                        ...datosActualizacion,
                        Estatus: newStatus,
                        UsuarioAutoriza: usuarioAutoriza,
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
    }, [vacacionAccion, actionType, usuarioSesion, idRolUsuario, fetchVacaciones]);

    const handleEdit = useCallback(async (vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Modificar');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setFechaRetornoInput(formatDateForInput(vacacion.FechaRetornoLabores || ''));
        
        setNoContarDomingos(vacacion.NoContarDomingos === 1);
        if (vacacion.NoContarDomingos === 1 && vacacion.FechaInicio && vacacion.FechaFin) {
            const diasHabiles = contarDiasHabiles(vacacion.FechaInicio, vacacion.FechaFin, true);
            setDiasSinDomingos(diasHabiles);
        }
        
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
                            setVacacionesForm(prev => ({
                                ...prev,
                                Anio: periodo.Año
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
            verificarRetornoDomingo();
        }, 100);
    }, [verificarAnticipacionSolicitud, verificarViernes, verificarRetornoDomingo, buscarEmpleado, contarDiasHabiles]);

    const handleView = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Ver');
        setVacacionesForm(vacacion);
        setSelectedEmpleadoId(vacacion.NoEmpleado?.toString() || '');
        setFechaInicioInput(formatDateForInput(vacacion.FechaInicio || ''));
        setFechaFinInput(formatDateForInput(vacacion.FechaFin || ''));
        setFechaIngresoInput(formatDateForInput(vacacion.FechaIngreso || ''));
        setFechaSolicitudInput(formatDateForInput(vacacion.FechaSolicitud || ''));
        setFechaRetornoInput(formatDateForInput(vacacion.FechaRetornoLabores || ''));
        
        setNoContarDomingos(vacacion.NoContarDomingos === 1);
        
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

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
    }, [resetForm]);

    useEffect(() => {
        verificarAnticipacionSolicitud();
        verificarViernes();
        verificarRetornoDomingo();
    }, [vacacionesForm.FechaInicio, vacacionesForm.FechaSolicitud, vacacionesForm.DiasTomar, vacacionesForm.FechaRetornoLabores, vacacionesForm.Departamento, verificarAnticipacionSolicitud, verificarViernes, verificarRetornoDomingo]);

    const solicitadasColumns: Column[] = useMemo(() => [
        { key: 'IdVacaciones', title: 'ID', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'NoEmpleado', title: 'No. Empleado', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center' },
        { key: 'NombreCompleto', title: 'Empleado', sortable: true, searchable: false, width: '250px', align: 'left', headerAlign: 'center' },
        { key: 'Departamento', title: 'Departamento', sortable: true, searchable: false, width: '150px', align: 'left', headerAlign: 'center' },
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
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
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'UsuarioSolicita', title: 'Usuario Solicita', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'UsuarioAutoriza', title: 'Usuario Autoriza', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaAutoriza', title: 'Fecha Autorización', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? value : '-' },
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
        { key: 'FechaInicio', title: 'Fecha Inicio', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'FechaFin', title: 'Fecha Fin', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'DiasTomar', title: 'Días', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'Anio', title: 'Año', sortable: true, searchable: false, width: '80px', align: 'center', headerAlign: 'center' },
        { key: 'FechaSolicitud', title: 'Fecha Solicitud', sortable: true, searchable: false, width: '120px', align: 'center', headerAlign: 'center', render: (value: string) => value || '-' },
        { key: 'UsuarioSolicita', title: 'Usuario Solicita', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'UsuarioAutoriza', title: 'Usuario Autoriza', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaAutoriza', title: 'Fecha Autorización', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? value : '-' },
        { key: 'UsuarioValida', title: 'Usuario Valida', sortable: true, searchable: false, width: '150px', align: 'center', headerAlign: 'center' },
        { key: 'FechaValidado', title: 'Fecha Validación', sortable: true, searchable: false, width: '130px', align: 'center', headerAlign: 'center', render: (value: string) => value ? value : '-' },
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
        cargarOpcionesCatalogos();
        fetchVacaciones();
    }, []);

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

    useEffect(() => {
        return () => {
            if (filtroTimeoutRef.current) {
                clearTimeout(filtroTimeoutRef.current);
            }
        };
    }, []);

    const isViewMode = tipoFormulario === 'Ver';
    const currentColumns = activeTab === 'solicitadas' ? solicitadasColumns : (activeTab === 'autorizadas' ? autorizadasColumns : validadasColumns);
    
    const datosFiltrados = useMemo(() => {
        if (activeTab === 'solicitadas') {
            return vacaciones.filter(v => v.Estatus === 0);
        } else if (activeTab === 'autorizadas') {
            return vacaciones.filter(v => v.Estatus === 1 || v.Estatus === 4);
        } else {
            return vacaciones.filter(v => v.Estatus === 3 || v.Estatus === 2);
        }
    }, [vacaciones, activeTab]);

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
                    <span className="tab-count">{vacaciones.filter(v => v.Estatus === 0).length}</span>
                </button>
                <button className={`tab-button ${activeTab === 'autorizadas' ? 'active' : ''}`} onClick={() => handleTabChange('autorizadas')}>
                    <CheckCircle size={16} /> Autorizadas 
                    <span className="tab-count">{vacaciones.filter(v => v.Estatus === 1 || v.Estatus === 4).length}</span>
                </button>
                <button className={`tab-button ${activeTab === 'validadas' ? 'active' : ''}`} onClick={() => handleTabChange('validadas')}>
                    <CheckCircle size={16} /> Validadas / Canceladas 
                    <span className="tab-count">{vacaciones.filter(v => v.Estatus === 3 || v.Estatus === 2).length}</span>
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
                        <input type="date" className="filtro-input" value={filtroFecha} onChange={handleFiltroFechaChange} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">No. Empleado:</label>
                        <input type="text" className="filtro-input" placeholder="Buscar por número..." value={filtros.NoEmpleado || ''} onChange={(e) => handleFiltroChange('NoEmpleado', e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Nombre Completo:</label>
                        <input type="text" className="filtro-input" placeholder="Buscar por nombre..." value={filtros.NombreCompleto} onChange={(e) => handleFiltroChange('NombreCompleto', e.target.value)} />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Año:</label>
                        <select className="filtro-input" value={filtros.Anio || ''} onChange={handleAnioFiltroChange}>
                            <option value="">Todos</option>
                            {Array.from(new Set(vacaciones.map(v => v.Anio).filter(a => a > 0))).sort((a,b) => b - a).map(anio => (<option key={anio} value={anio}>{anio}</option>))}
                        </select>
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
                <Tabla 
                    columns={currentColumns} 
                    data={datosFiltrados} 
                    pageSize={10} 
                    pageSizeOptions={[5, 10, 25, 50]} 
                    emptyMessage={activeTab === 'solicitadas' ? "No hay solicitudes pendientes" : (activeTab === 'autorizadas' ? "No hay solicitudes autorizadas o en revisión" : "No hay solicitudes validadas/canceladas")} 
                    className="full-height-table" 
                    loading={loading} 
                />
            </div>

            {showForm && (
                <div className="form-vacaciones-modal-overlay">
                    <div className="form-vacaciones-modal">
                        <div className="form-vacaciones-modal-header">
                            <h2 className="form-vacaciones-modal-title">{tipoFormulario === 'Modificar' ? 'Editar Solicitud de Vacaciones' : tipoFormulario === 'Ver' ? 'Ver Solicitud de Vacaciones' : 'Nueva Solicitud de Vacaciones'}</h2>
                            <button className="close-button" onClick={() => { setShowForm(false); resetForm(); setTipoFormulario('Agregar'); }}><X size={20} /></button>
                        </div>
                        <div className="form-vacaciones-modal-body">
                            {(advertenciaAnticipacion || advertenciaViernes || advertenciaRetornoDomingo || advertenciaInicioDomingo || advertenciaFinDomingo) && (
                                <div className="advertencias-container" style={{ backgroundColor: '#FFF3CD', borderLeft: '4px solid #FFC107', padding: '12px 16px', marginBottom: '20px', borderRadius: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><AlertCircle size={18} color="#856404" /><strong style={{ color: '#856404' }}>Advertencias:</strong></div>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
                                        {advertenciaAnticipacion && <li>{advertenciaAnticipacion}</li>}
                                        {advertenciaViernes && <li>{advertenciaViernes}</li>}
                                        {advertenciaRetornoDomingo && <li>{advertenciaRetornoDomingo}</li>}
                                        {advertenciaInicioDomingo && <li>{advertenciaInicioDomingo}</li>}
                                        {advertenciaFinDomingo && <li>{advertenciaFinDomingo}</li>}
                                    </ul>
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
                                    <div className="form-vacaciones-row">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={noContarDomingos} 
                                                    onChange={handleNoContarDomingosChange}
                                                    disabled={isViewMode || !isHRorAdmin || !selectedAnio}
                                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                />
                                                No contar domingos en los días de vacaciones
                                            </label>
                                            {noContarDomingos && (
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                                    Los domingos no se contarán como días de vacaciones. Días hábiles: {diasSinDomingos}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="form-vacaciones-row three-columns">
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Fecha de Inicio</label>
                                            <input 
                                                type="date" 
                                                value={fechaInicioInput} 
                                                onChange={handleFechaInicioChange} 
                                                className="form-vacaciones-input" 
                                                disabled={isViewMode || !isHRorAdmin || !selectedAnio} 
                                                required 
                                            />
                                            {fechaInicioInput && (
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                                    {new Date(fechaInicioInput + 'T00:00:00').toLocaleDateString('es-MX', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label required">Fecha de Fin</label>
                                            <input 
                                                type="date" 
                                                value={fechaFinInput} 
                                                onChange={handleFechaFinChange} 
                                                className="form-vacaciones-input" 
                                                disabled={isViewMode || !isHRorAdmin || !selectedAnio} 
                                                required 
                                            />
                                            {fechaFinInput && (
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                                    {new Date(fechaFinInput + 'T00:00:00').toLocaleDateString('es-MX', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="form-vacaciones-group">
                                            <label className="form-vacaciones-label">Fecha de Reintegración a Labores</label>
                                            <input 
                                                type="date" 
                                                value={fechaRetornoInput} 
                                                onChange={handleFechaRetornoChange} 
                                                className="form-vacaciones-input" 
                                                disabled={isViewMode || !isHRorAdmin || !selectedAnio} 
                                            />
                                            {fechaRetornoInput && (
                                                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '4px' }}>
                                                    {new Date(fechaRetornoInput + 'T00:00:00').toLocaleDateString('es-MX', { 
                                                        weekday: 'long', 
                                                        year: 'numeric', 
                                                        month: 'long', 
                                                        day: 'numeric' 
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {fechaInicioInput && fechaFinInput && (
                                        <div className="date-range-indicator" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: '#FFF8E1', borderRadius: '8px', border: '1px solid #FFE0B2', marginTop: '8px' }}>
                                            <div className="date-pill" style={{ background: 'white', padding: '4px 12px', borderRadius: '16px', border: '1px solid #FFE0B2', fontSize: '13px', fontWeight: '500' }}>
                                                <strong>Inicio:</strong> {new Date(fechaInicioInput + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <span className="range-arrow" style={{ color: '#F57C00', fontWeight: 'bold', fontSize: '18px' }}>→</span>
                                            <div className="date-pill" style={{ background: 'white', padding: '4px 12px', borderRadius: '16px', border: '1px solid #FFE0B2', fontSize: '13px', fontWeight: '500' }}>
                                                <strong>Fin:</strong> {new Date(fechaFinInput + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </div>
                                            <div className="date-pill" style={{ background: '#F57C00', color: 'white', padding: '4px 12px', borderRadius: '16px', border: '1px solid #F57C00', fontSize: '13px', fontWeight: '500' }}>
                                                <strong>Total:</strong> {noContarDomingos ? diasSinDomingos : vacacionesForm.DiasTomar} días
                                                {noContarDomingos && <span style={{ marginLeft: '4px' }}>(sin domingos)</span>}
                                            </div>
                                        </div>
                                    )}
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
                                    {!isViewMode && isHRorAdmin && (
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary orange-button" 
                                            disabled={submitting || cargandoPeriodos || (!selectedAnio && !vacacionesForm.Anio)}
                                        >
                                            {submitting ? 'Guardando...' : 'Guardar'}
                                        </button>
                                    )}
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