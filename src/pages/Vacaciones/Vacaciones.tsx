import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Filter, ChevronDown, Eye, CheckCircle, XCircle } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import './vacaciones.css';
import type { InterfaceVacaciones, FiltrosVacaciones, OpcionSelect } from '../../interfaces/Vacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { CatalogoUsuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer, formatDateForInput } from '../../helpers/date';
import { apiService } from '../../api/apiService';

interface EmpleadoResponse {
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    IdPersonal: number;
}

type TabType = 'solicitadas' | 'validadas';

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
    actionType: 'validate' | 'cancel' | 'cancelValidated';
}> = ({ visible, onClose, vacacion, onConfirm, loading = false, actionType }) => {
    if (!visible) return null;

    const isValidate = actionType === 'validate';
    const isCancelValidated = actionType === 'cancelValidated';
    const title = isValidate ? 'Confirmar Validación' : (isCancelValidated ? 'Confirmar Cancelación de Vacación Validada' : 'Confirmar Cancelación');
    const message = isValidate 
        ? '¿Está seguro de que desea validar esta solicitud de vacaciones?'
        : (isCancelValidated 
            ? '¿Está seguro de que desea CANCELAR esta solicitud de vacaciones YA VALIDADA? Esta acción cambiará el estatus a Cancelado.'
            : '¿Está seguro de que desea cancelar esta solicitud de vacaciones?');
    const confirmText = isValidate ? 'Validar' : 'Cancelar';
    const confirmClass = isValidate ? 'btn-success' : 'btn-warning';

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
                    {isCancelValidated && (
                        <p style={{ fontSize: '14px', color: '#DC3545', marginTop: '12px', fontWeight: 'bold' }}>
                            Advertencia: Esta acción no se puede deshacer. La vacación quedará como Cancelada.
                        </p>
                    )}
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

const StatusBadge: React.FC<{ estatus: number }> = ({ estatus }) => {
    if (estatus === 0) {
        return <span className="status-badge status-pending">Pendiente de Validar</span>;
    } else if (estatus === 1) {
        return <span className="status-badge status-validated">Validado</span>;
    } else if (estatus === 2) {
        return <span className="status-badge status-cancelled">Cancelado</span>;
    }
    return <span className="status-badge">Desconocido</span>;
};

const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onView,
    onEdit,
    onDelete,
    onValidate,
    onCancel,
    onCancelValidated,
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
    onValidate: (row: InterfaceVacaciones) => void;
    onCancel: (row: InterfaceVacaciones) => void;
    onCancelValidated: (row: InterfaceVacaciones) => void;
    idRolUsuario: number;
    canEditDelete: boolean;
    activeTab: TabType;
}) => {

    const showValidateButton = (idRolUsuario === 2 || idRolUsuario === 1) && 
                               row.Estatus === 0 &&
                               activeTab === 'solicitadas';
    
   const showCancelButton = (idRolUsuario ===  1 || idRolUsuario === 2|| idRolUsuario === 3) && 
                             row.Estatus === 0 &&
                             activeTab === 'solicitadas';
    
    const showCancelValidatedButton = (idRolUsuario === 1 || idRolUsuario === 2) && 
                                      row.Estatus === 1 &&
                                      activeTab === 'validadas';
    
   const showEditDeleteButtons = canEditDelete && 
                                  row.Estatus === 0 &&
                                  activeTab === 'solicitadas';

    if (idRolUsuario === 3) {
        const showEditDeleteButtons = canEditDelete && 
                                  row.Estatus === 0 &&
                                  activeTab === 'solicitadas';
    }

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
                    
                    {showValidateButton && (
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

                    {showCancelValidatedButton && (
                        <>
                            <div className="actions-dropdown-divider"></div>
                            <button 
                                className="actions-dropdown-item cancel-validated-action" 
                                onClick={() => { 
                                    onCancelValidated(row); 
                                    setOpenActionDropdown(null); 
                                }}
                            >
                                <XCircle size={14} />
                                <span>Cancelar Vacación</span>
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
        Estatus: 0
    });
    
    const [fechaInicioInput, setFechaInicioInput] = useState('');
    const [fechaFinInput, setFechaFinInput] = useState('');
    const [fechaIngresoInput, setFechaIngresoInput] = useState('');
    const [fechaSolicitudInput, setFechaSolicitudInput] = useState('');
    
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
    const [loadingOptions, setLoadingOptions] = useState(false);
    
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [vacacionAEliminar, setVacacionAEliminar] = useState<InterfaceVacaciones | null>(null);
    const [eliminando, setEliminando] = useState(false);
    
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [vacacionAccion, setVacacionAccion] = useState<InterfaceVacaciones | null>(null);
    const [actionType, setActionType] = useState<'validate' | 'cancel' | 'cancelValidated'>('validate');
    const [accionEnProceso, setAccionEnProceso] = useState(false);
    
    const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>('');
    
    const today = new Date().toISOString().split('T')[0];
    const [filtroFecha, setFiltroFecha] = useState<string>(today);
    
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

    const idRolUsuario = Number(usuarioSesion?.rol) || 0;
    const isHRorAdmin = idRolUsuario === 2 || idRolUsuario === 1 || idRolUsuario === 3;
    const canEditDelete = isHRorAdmin;

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

        if (activeTab === 'solicitadas') {
            filtrados = filtrados.filter(v => v.Estatus === 0);
        } else {
            filtrados = filtrados.filter(v => v.Estatus === 1|| v.Estatus === 2) ;
        }
        

        if (filtroFecha && filtroFecha.trim() !== '') {
            filtrados = filtrados.filter(v => {
                const fechaSolicitud = v.FechaSolicitud?.split(' ')[0] || '';
                return fechaSolicitud === filtroFecha;
            });
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

        setVacacionesFiltrados(filtrados);
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
            FechaInicioVacaciones: '',
            FechaFinVacaciones: '',
            Supervisor: '',
            FechaIngreso: '',
            FechaSolicitud: '',
            Estatus: 0
        });
        setFiltroFecha(today);
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
                    FechaInicio: item.FechaInicio ? item.FechaInicio.split(' ')[0] : '',
                    FechaFin: item.FechaFin ? item.FechaFin.split(' ')[0] : '',
                    FechaSolicitud: item.FechaSolicitud ? item.FechaSolicitud.split(' ')[0] : '',
                    FechaRetornoLabores: item.FechaRetornoLabores ? item.FechaRetornoLabores.split(' ')[0] : '',
                    FechaAutoriza: item.FechaAutoriza ? item.FechaAutoriza.split(' ')[0] : '',
                    FechaIngreso: item.FechaIngreso ? item.FechaIngreso.split(' ')[0] : '',
                    NoEmpleado: item.NoEmpleado?.toString() || '',
                    NombreCompleto: item.NombreCompleto || '',
                    Departamento: item.Departamento || '',
                    Cargo: item.Cargo || '',
                    UsuarioSolicita: item.UsuarioSolicita || '',
                    UsuarioAutoriza: item.UsuarioAutoriza || ''
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
                FechaAutoriza: vacacionesForm.Estatus === 1 ? new Date().toISOString().split('T')[0] : '',
                UsuarioSolicita: usuarioSesion?.IdUsuario?.toString() || '',
                UsuarioAutoriza: vacacionesForm.Estatus === 1 ? usuarioSesion?.IdUsuario?.toString() : '',
                Estatus: vacacionesForm.Estatus || 0
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

    const handleCancelValidated = useCallback((vacacion: InterfaceVacaciones) => {
        setVacacionAccion(vacacion);
        setActionType('cancelValidated');
        setActionModalVisible(true);
    }, []);

    const confirmAction = useCallback(async () => {
        if (!vacacionAccion) return;
        
        try {
            setAccionEnProceso(true);
            
            let newStatus: number;
            if (actionType === 'validate') {
                newStatus = 1;
            } else {
                newStatus = 2;
            }
            
            const url = `/vacaciones/cambiarEstatus.php?IdVacaciones=${vacacionAccion.IdVacaciones}&Estatus=${newStatus}&IdUsuario=${usuarioSesion?.IdUsuario}`;
            
            const response = await apiService.put<RespuestaAPI>(url, {});
            
            if (response.status) {
                let message = '';
                if (actionType === 'validate') {
                    message = 'Solicitud de vacaciones validada correctamente';
                } else if (actionType === 'cancelValidated') {
                    message = 'Solicitud de vacaciones CANCELADA correctamente';
                } else {
                    message = 'Solicitud de vacaciones cancelada correctamente';
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
                    text: response.message || `Error al ${actionType === 'validate' ? 'validar' : 'cancelar'} la solicitud`,
                    type: 'error',
                    autoClose: 1500
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast({
                text: `Error al ${actionType === 'validate' ? 'validar' : 'cancelar'} la solicitud de vacaciones`,
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
            Estatus: 0
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
        const todayDate = new Date().toISOString().split('T')[0];
        setFechaSolicitudInput(todayDate);
        setVacacionesForm(prev => ({ ...prev, FechaSolicitud: todayDate, Estatus: 0 }));
    }, [resetForm]);

    const solicitadasColumns: Column[] = useMemo(() => [
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
            key: 'UsuarioSolicita',
            title: 'Usuario Solicita',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'Estatus',
            title: 'Estatus',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => <StatusBadge estatus={value} />
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
                    onValidate={handleValidate}
                    onCancel={handleCancel}
                    onCancelValidated={handleCancelValidated}
                    idRolUsuario={idRolUsuario}
                    canEditDelete={canEditDelete}
                    activeTab={activeTab}
                />
            )
        }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleValidate, handleCancel, handleCancelValidated, idRolUsuario, canEditDelete, activeTab]);

    const validadasColumns: Column[] = useMemo(() => [
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
            key: 'UsuarioAutoriza',
            title: 'Usuario Autoriza',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'FechaAutoriza',
            title: 'Fecha Autorización',
            sortable: true,
            searchable: false,
            width: '130px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string) => value ? formatDateForServer(value) : '-'
        },
        {
            key: 'Estatus',
            title: 'Estatus',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => <StatusBadge estatus={value} />
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
                    onValidate={handleValidate}
                    onCancel={handleCancel}
                    onCancelValidated={handleCancelValidated}
                    idRolUsuario={idRolUsuario}
                    canEditDelete={canEditDelete}
                    activeTab={activeTab}
                />
            )
        }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick, handleValidate, handleCancel, handleCancelValidated, idRolUsuario, canEditDelete, activeTab]);

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setOpenActionDropdown(null);
    };

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

            <div className="vacaciones-tabs">
                <button
                    className={`tab-button ${activeTab === 'solicitadas' ? 'active' : ''}`}
                    onClick={() => handleTabChange('solicitadas')}
                >
                    <FileText size={16} />
                    Solicitadas
                    <span className="tab-count">
                        {vacaciones.filter(v => v.Estatus === 0).length}
                    </span>
                </button>
                <button
                    className={`tab-button ${activeTab === 'validadas' ? 'active' : ''}`}
                    onClick={() => handleTabChange('validadas')}
                >
                    <CheckCircle size={16} />
                    Validadas
                    <span className="tab-count">
                        {vacaciones.filter(v => v.Estatus === 1 || v.Estatus === 2).length}  
                    </span>
                </button>
            </div>

            <div className="filtros-container">
                <div className="filtros-basicos">
                    <div className="filtro-group">
                        <label className="filtro-label">Fecha Solicitud:</label>
                        <input
                            type="date"
                            className="filtro-input"
                            value={filtroFecha}
                            onChange={(e) => setFiltroFecha(e.target.value)}
                        />
                    </div>
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
                    columns={activeTab === 'solicitadas' ? solicitadasColumns : validadasColumns}
                    data={vacacionesFiltrados}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage={activeTab === 'solicitadas' 
                        ? "No hay solicitudes pendientes de validar" 
                        : "No hay solicitudes validadas"}
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
                                                disabled={isViewMode || !isHRorAdmin}
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
                                                disabled={isViewMode || !isHRorAdmin}
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
                                                disabled={isViewMode || !isHRorAdmin}
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
                                                disabled={isViewMode || !isHRorAdmin}
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
                                                disabled={isViewMode || !isHRorAdmin}
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
                                    {!isViewMode && isHRorAdmin && (
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