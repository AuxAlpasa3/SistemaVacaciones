import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Filter, ChevronDown, FileDown, Printer, Download, Upload, Eye, RefreshCw, Calendar, User, Building, Briefcase, Phone, Mail, MapPin } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import { SelectConBusquedayCrear } from '../../components/Select/SelectConBusquedayCrear';
import './vacaciones.css';
import type { InterfaceVacaciones, FiltrosVacaciones, OpcionSelect } from '../../interfaces/Vacaciones';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer } from '../../helpers/date';
import { apiService } from '../../api/apiService';
import { useNavigate } from 'react-router-dom';

// Modal para confirmar eliminación
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

// Componente memoizado para los botones de acción
const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onView,
    onEdit,
    onDelete
}: {
    row: InterfaceVacaciones;
    openActionDropdown: number | null;
    setOpenActionDropdown: (IdVacaciones: number | null) => void;
    onView: (row: InterfaceVacaciones) => void;
    onEdit: (row: InterfaceVacaciones) => void;
    onDelete: (row: InterfaceVacaciones) => void;
}) => (
    <div className="actions-dropdown-container">
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
            </div>
        )}
    </div>
));

MemoizedActionButtons.displayName = 'MemoizedActionButtons';

export const Vacaciones: React.FC = () => {
    const navigate = useNavigate();

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
    
    // Estados para fechas display
    const [fechaInicioDisplay, setFechaInicioDisplay] = useState('');
    const [fechaFinDisplay, setFechaFinDisplay] = useState('');
    const [fechaIngresoDisplay, setFechaIngresoDisplay] = useState('');
    const [fechaSolicitudDisplay, setFechaSolicitudDisplay] = useState('');
    
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [vacaciones, setVacaciones] = useState<InterfaceVacaciones[]>([]);
    const [vacacionesFiltrados, setVacacionesFiltrados] = useState<InterfaceVacaciones[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState<'Agregar' | 'Modificar' | 'Ver'>('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<number | null>(null);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    
    // Estados para opciones de catálogos
    const [empleados, setEmpleados] = useState<OpcionSelect[]>([]);
    const [departamentos, setDepartamentos] = useState<OpcionSelect[]>([]);
    const [cargos, setCargos] = useState<OpcionSelect[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    
    // Estado para modal de eliminación
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [vacacionAEliminar, setVacacionAEliminar] = useState<InterfaceVacaciones | null>(null);
    const [eliminando, setEliminando] = useState(false);
    
    // Filtros
    const [filtros, setFiltros] = useState<FiltrosVacaciones>({
        NoEmpleado: 0,
        NombreCompleto: '',
        FechaInicioVacaciones: '',
        FechaFinVacaciones: '',
        Supervisor: '',
        FechaIngreso: '',
        FechaSolicitud: ''
    });

    // Sincronizar fechas display cuando cambian las fechas del formulario
    useEffect(() => {
        if (vacacionesForm.FechaInicio) {
            setFechaInicioDisplay(formatDateForServer(vacacionesForm.FechaInicio));
        } else {
            setFechaInicioDisplay('');
        }
    }, [vacacionesForm.FechaInicio]);

    useEffect(() => {
        if (vacacionesForm.FechaFin) {
            setFechaFinDisplay(formatDateForServer(vacacionesForm.FechaFin));
        } else {
            setFechaFinDisplay('');
        }
    }, [vacacionesForm.FechaFin]);

    useEffect(() => {
        if (vacacionesForm.FechaIngreso) {
            setFechaIngresoDisplay(formatDateForServer(vacacionesForm.FechaIngreso));
        } else {
            setFechaIngresoDisplay('');
        }
    }, [vacacionesForm.FechaIngreso]);

    useEffect(() => {
        if (vacacionesForm.FechaSolicitud) {
            setFechaSolicitudDisplay(formatDateForServer(vacacionesForm.FechaSolicitud));
        } else {
            setFechaSolicitudDisplay('');
        }
    }, [vacacionesForm.FechaSolicitud]);

    // Cargar opciones de catálogos
    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
            
            const [empleadosResponse, departamentosResponse, cargosResponse] = await Promise.all([
                apiService.get<RespuestaAPI>('/vacaciones/opciones/ObtenerEmpleados.php'),
                apiService.get<RespuestaAPI>('/vacaciones/opciones/ObtenerDepartamentos.php'),
                apiService.get<RespuestaAPI>('/vacaciones/opciones/ObtenerCargos.php')
            ]);

            if (empleadosResponse.status && empleadosResponse.data) {
                const empleadosData = Array.isArray(empleadosResponse.data) ? empleadosResponse.data : [];
                setEmpleados(empleadosData.map((e: any) => ({ 
                    id: e.NoEmpleado?.toString() || e.id?.toString() || '', 
                    valor: e.NombreCompleto || e.valor || '' 
                })));
            }

            if (departamentosResponse.status && departamentosResponse.data) {
                const deptosData = Array.isArray(departamentosResponse.data) ? departamentosResponse.data : [];
                setDepartamentos(deptosData.map((d: any) => ({ 
                    id: d.id?.toString() || d.IdDepartamento?.toString() || '', 
                    valor: d.Departamento || d.valor || '' 
                })));
            }

            if (cargosResponse.status && cargosResponse.data) {
                const cargosData = Array.isArray(cargosResponse.data) ? cargosResponse.data : [];
                setCargos(cargosData.map((c: any) => ({ 
                    id: c.id?.toString() || c.IdCargo?.toString() || '', 
                    valor: c.Cargo || c.valor || '' 
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
    }, []);

    // Buscar empleado por número
    const buscarEmpleado = useCallback(async (noEmpleado: string) => {
        if (!noEmpleado || noEmpleado.length < 3) return;
        
        try {
            const response = await apiService.get<RespuestaAPI>(`/vacaciones/BuscarEmpleado.php?NoEmpleado=${noEmpleado}`);
            if (response.status && response.data) {
                const empleado = response.data as any;
                setVacacionesForm(prev => ({
                    ...prev,
                    NoEmpleado: empleado.NoEmpleado?.toString() || '',
                    NombreCompleto: empleado.NombreCompleto || '',
                    Departamento: empleado.Departamento?.toString() || '',
                    Cargo: empleado.Cargo?.toString() || '',
                    FechaIngreso: empleado.FechaIngreso || ''
                }));
                if (empleado.FechaIngreso) {
                    setFechaIngresoDisplay(formatDateForServer(empleado.FechaIngreso));
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
            }
        } catch (error) {
            console.error('Error buscando empleado:', error);
            showToast({
                text: 'Error al buscar empleado',
                type: 'error',
                autoClose: 1500
            });
        }
    }, []);

    // Calcular días entre fechas
    const calcularDias = useCallback((fechaInicio: string, fechaFin: string) => {
        if (!fechaInicio || !fechaFin) return;
        
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        setVacacionesForm(prev => ({
            ...prev,
            DiasTomar: diffDays.toString()
        }));
    }, []);

    // Aplicar filtros
    const aplicarFiltros = useCallback(() => {
        let filtrados = [...vacaciones];

        if (filtros.NoEmpleado) {
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

    const handleFiltroChange = (campo: keyof FiltrosVacaciones, valor: string) => {
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
            FechaSolicitud: ''
        });
        setVacacionesFiltrados(vacaciones);
    };

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'FechaInicio') {
            if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value) && value !== '') {
                showToast({
                    text: 'Formato de fecha inválido. Use dd/mm/aaaa',
                    type: 'error',
                    autoClose: 3000
                });
                return;
            }
            setFechaInicioDisplay(value);
            const isoDate = formatDateForServer(value);
            setVacacionesForm(prev => ({ ...prev, [name]: isoDate }));
            if (vacacionesForm.FechaFin) {
                calcularDias(isoDate, vacacionesForm.FechaFin);
            }
        } else if (name === 'FechaFin') {
            if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value) && value !== '') {
                showToast({
                    text: 'Formato de fecha inválido. Use dd/mm/aaaa',
                    type: 'error',
                    autoClose: 3000
                });
                return;
            }
            setFechaFinDisplay(value);
            const isoDate = formatDateForServer(value);
            setVacacionesForm(prev => ({ ...prev, [name]: isoDate }));
            if (vacacionesForm.FechaInicio) {
                calcularDias(vacacionesForm.FechaInicio, isoDate);
            }
        } else if (name === 'NoEmpleado') {
            setVacacionesForm(prev => ({ ...prev, [name]: value }));
            if (value.length >= 3) {
                buscarEmpleado(value);
            }
        } else {
            setVacacionesForm(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }, [vacacionesForm.FechaInicio, vacacionesForm.FechaFin, calcularDias, buscarEmpleado]);

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
                FechaAutoriza: new Date().toISOString().split('T')[0],
                UsuarioSolicita: usuarioSesion?.IdUsuario?.toString() || ''
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

    const handleEdit = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Modificar');
        setVacacionesForm(vacacion);
        setFechaInicioDisplay(formatDateForServer(vacacion.FechaInicio || ''));
        setFechaFinDisplay(formatDateForServer(vacacion.FechaFin || ''));
        setFechaIngresoDisplay(formatDateForServer(vacacion.FechaIngreso || ''));
        setFechaSolicitudDisplay(formatDateForServer(vacacion.FechaSolicitud || ''));
        setShowForm(true);
    }, []);

    const handleView = useCallback((vacacion: InterfaceVacaciones) => {
        setTipoFormulario('Ver');
        setVacacionesForm(vacacion);
        setFechaInicioDisplay(formatDateForServer(vacacion.FechaInicio || ''));
        setFechaFinDisplay(formatDateForServer(vacacion.FechaFin || ''));
        setFechaIngresoDisplay(formatDateForServer(vacacion.FechaIngreso || ''));
        setFechaSolicitudDisplay(formatDateForServer(vacacion.FechaSolicitud || ''));
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
    }, [vacacionAEliminar, usuarioSesion, fetchVacaciones]);

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
        setFechaInicioDisplay('');
        setFechaFinDisplay('');
        setFechaIngresoDisplay('');
        setFechaSolicitudDisplay('');
    }, []);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
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
            width: '200px',
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
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '120px',
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
                />
            )
        }
    ], [openActionDropdown, handleView, handleEdit, handleDeleteClick]);

    // Efectos
    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    useEffect(() => {
        fetchVacaciones();
        cargarOpcionesCatalogos();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
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

            {/* Filtros */}
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

            {/* Formulario Modal */}
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
                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group">
                                            <label htmlFor='NoEmpleado' className="form-vacaciones-label required">No. Empleado *</label>
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
                                            <label htmlFor='NombreCompleto' className="form-vacaciones-label required">Nombre Completo *</label>
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

                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group">
                                            <label htmlFor='Departamento' className="form-vacaciones-label">Departamento</label>
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
                                            <label htmlFor='Cargo' className="form-vacaciones-label">Cargo</label>
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

                                    <div className="form-vacaciones-row two-columns">
                                        <div className="form-vacaciones-group">
                                            <label htmlFor='FechaIngreso' className="form-vacaciones-label">Fecha de Ingreso</label>
                                            <input
                                                type="text"
                                                id="FechaIngreso"
                                                name="FechaIngreso"
                                                value={fechaIngresoDisplay}
                                                onChange={handleInputChange}
                                                className="form-vacaciones-input"
                                                placeholder="dd/mm/aaaa"
                                                disabled={true}
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label htmlFor='FechaSolicitud' className="form-vacaciones-label">Fecha de Solicitud</label>
                                            <input
                                                type="text"
                                                id="FechaSolicitud"
                                                name="FechaSolicitud"
                                                value={fechaSolicitudDisplay || formatDateForServer(new Date().toISOString().split('T')[0])}
                                                onChange={handleInputChange}
                                                className="form-vacaciones-input"
                                                placeholder="dd/mm/aaaa"
                                                disabled={isViewMode}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3 className="form-section-title">Período de Vacaciones</h3>
                                    <div className="form-vacaciones-row three-columns">
                                        <div className="form-vacaciones-group">
                                            <label htmlFor='FechaInicio' className="form-vacaciones-label required">Fecha de Inicio *</label>
                                            <input
                                                type="text"
                                                id="FechaInicio"
                                                name="FechaInicio"
                                                value={fechaInicioDisplay}
                                                onChange={handleInputChange}
                                                className="form-vacaciones-input"
                                                placeholder="dd/mm/aaaa"
                                                disabled={isViewMode}
                                                required
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label htmlFor='FechaFin' className="form-vacaciones-label required">Fecha de Fin *</label>
                                            <input
                                                type="text"
                                                id="FechaFin"
                                                name="FechaFin"
                                                value={fechaFinDisplay}
                                                onChange={handleInputChange}
                                                className="form-vacaciones-input"
                                                placeholder="dd/mm/aaaa"
                                                disabled={isViewMode}
                                                required
                                            />
                                        </div>

                                        <div className="form-vacaciones-group">
                                            <label htmlFor='DiasTomar' className="form-vacaciones-label required">Días a Tomar *</label>
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
                                                <label htmlFor='FechaRetornoLabores' className="form-vacaciones-label">Fecha de Retorno</label>
                                                <input
                                                    type="text"
                                                    id="FechaRetornoLabores"
                                                    value={formatDateForServer(vacacionesForm.FechaRetornoLabores)}
                                                    className="form-vacaciones-input"
                                                    disabled
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {isViewMode && vacacionesForm.FechaAutoriza && (
                                        <div className="form-vacaciones-row">
                                            <div className="form-vacaciones-group">
                                                <label htmlFor='FechaAutoriza' className="form-vacaciones-label">Fecha de Autorización</label>
                                                <input
                                                    type="text"
                                                    id="FechaAutoriza"
                                                    value={formatDateForServer(vacacionesForm.FechaAutoriza)}
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

            {/* Modal de eliminación */}
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
        </div>
    );
};

export default Vacaciones;