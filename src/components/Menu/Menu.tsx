import React, { useState, useEffect, type ReactElement, useCallback } from 'react';
import { 
    Clock, 
    CheckCircle, 
    Calendar, 
    RefreshCw,
    AlertCircle,
    Users,
    Search,
    User,
    Calendar as CalendarIcon,
    Filter,
    ChevronDown,
    X
} from 'lucide-react';
import './Menu.css';
import { formatDateForDisplay,formatDateForServer } from '../../helpers/date';
import { apiService } from '../../api/apiService';

interface Vacacion {
    IdVacaciones: number;
    IdPersonal: string;
    NoEmpleado?: string;
    NombreCompleto?: string;
    FechaSolicitud: string;
    FechaInicio: string;
    FechaFin: string;
    FechaRetornoLabores: string;
    DiasTomar: number;
    UsuarioSolicita: number;
    UsuarioAutoriza?: number;
    FechaAutoriza?: string;
    Estatus: number;
    Departamento?: string;
    Empresa?: string;
    JefeInmediato?: string;
}

interface PersonaVacaciones {
    IdVacaciones: number;
    IdPersonal: string;
    NoEmpleado?: string;
    NombreCompleto: string;
    FechaInicio: string;
    FechaFin: string;
    DiasTomar: number;
}

interface VacacionesResponse {
    status: boolean;
    data?: {
        pendientes: Vacacion[];
        validadas: Vacacion[];
        todasVacaciones: Vacacion[];
        personalVacacionesHoy: PersonaVacaciones[];
        resumen: {
            totalPendientes: number;
            totalValidadas: number;
            personalVacacionesHoy: number;
        };
    };
    message?: string;
    error?: string;
}

interface OpcionSelect {
    id: string;
    valor: string;
}

const obtenerFechaActual = (): string => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const Menu = (): ReactElement => {
    const [todasVacaciones, setTodasVacaciones] = useState<Vacacion[]>([]);
    const [vacacionesPendientes, setVacacionesPendientes] = useState<Vacacion[]>([]);
    const [vacacionesValidadas, setVacacionesValidadas] = useState<Vacacion[]>([]);
    const [personalVacacionesHoy, setPersonalVacacionesHoy] = useState<PersonaVacaciones[]>([]);
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    
    const [fechaInicio, setFechaInicio] = useState<string>(() => obtenerFechaActual());
    const [fechaFin, setFechaFin] = useState<string>(() => obtenerFechaActual());
    
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState<boolean>(false);
    const [filtroNoEmpleado, setFiltroNoEmpleado] = useState<string>('');
    const [filtroNombreCompleto, setFiltroNombreCompleto] = useState<string>('');
    const [filtroDepartamento, setFiltroDepartamento] = useState<string>('');
    const [filtroEmpresa, setFiltroEmpresa] = useState<string>('');
    const [filtroJefeInmediato, setFiltroJefeInmediato] = useState<string>('');
    const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
    
    const [departamentos, setDepartamentos] = useState<OpcionSelect[]>([]);
    const [empresas, setEmpresas] = useState<OpcionSelect[]>([]);
    const [jefes, setJefes] = useState<OpcionSelect[]>([]);

    const fetchVacaciones = useCallback(async (isRefresh: boolean = false): Promise<void> => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            
            const params = new URLSearchParams();
            params.append('fechaInicio', fechaInicio);
            params.append('fechaFin', fechaFin);
            
            if (filtroNoEmpleado) {
                params.append('noEmpleado', filtroNoEmpleado);
            }
            if (filtroNombreCompleto) {
                params.append('nombreCompleto', filtroNombreCompleto);
            }
            if (filtroDepartamento && filtroDepartamento !== '') {
                params.append('departamento', filtroDepartamento);
            }
            if (filtroEmpresa && filtroEmpresa !== '') {
                params.append('empresa', filtroEmpresa);
            }
            if (filtroJefeInmediato && filtroJefeInmediato !== '') {
                params.append('jefeInmediato', filtroJefeInmediato);
            }
            if (filtroEstatus !== 'todos') {
                params.append('estatus', filtroEstatus);
            }
            
            const response = await apiService.get<VacacionesResponse>(`Menu.php?${params.toString()}`);
            
            if (response.status && response.data) {
                setTodasVacaciones(response.data.todasVacaciones || []);
                setVacacionesPendientes(response.data.pendientes || []);
                setVacacionesValidadas(response.data.validadas || []);
                setPersonalVacacionesHoy(response.data.personalVacacionesHoy || []);
            } else {
                throw new Error(response.message || 'Error al cargar las vacaciones');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar las vacaciones';
            setError(errorMessage);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [fechaInicio, fechaFin, filtroNoEmpleado, filtroNombreCompleto, filtroDepartamento, filtroEmpresa, filtroJefeInmediato, filtroEstatus]);

    const personalVacacionesFiltrado = personalVacacionesHoy.filter(persona => {
        const vacacionCompleta = todasVacaciones.find(v => v.IdVacaciones === persona.IdVacaciones);
        
        if (!vacacionCompleta) return true;
        
        if (filtroNoEmpleado && !vacacionCompleta.IdPersonal.toLowerCase().includes(filtroNoEmpleado.toLowerCase()) && !vacacionCompleta.NoEmpleado?.toLowerCase().includes(filtroNoEmpleado.toLowerCase())) {
            return false;
        }
        
        if (filtroNombreCompleto && !vacacionCompleta.NombreCompleto?.toLowerCase().includes(filtroNombreCompleto.toLowerCase())) {
            return false;
        }
        
        if (filtroDepartamento && filtroDepartamento !== '' && vacacionCompleta.Departamento !== filtroDepartamento) {
            return false;
        }
        
        if (filtroEmpresa && filtroEmpresa !== '' && vacacionCompleta.Empresa !== filtroEmpresa) {
            return false;
        }
        
        if (filtroJefeInmediato && filtroJefeInmediato !== '' && vacacionCompleta.JefeInmediato !== filtroJefeInmediato) {
            return false;
        }
        
        if (filtroEstatus !== 'todos') {
            const estatusMap: { [key: string]: number } = {
                'pendiente': 0,
                'validada': 1,
                'rechazada': 2
            };
            const estatusNumerico = estatusMap[filtroEstatus];
            if (vacacionCompleta.Estatus !== estatusNumerico) {
                return false;
            }
        }
        
        const fechaInicioPersona = new Date(persona.FechaInicio);
        const fechaFinPersona = new Date(persona.FechaFin);
        const rangoInicio = new Date(fechaInicio);
        const rangoFin = new Date(fechaFin);
        
        return fechaInicioPersona <= rangoFin && fechaFinPersona >= rangoInicio;
    });

    const resumen = {
        totalPendientes: vacacionesPendientes.length,
        totalValidadas: vacacionesValidadas.length,
        personalVacacionesHoy: personalVacacionesFiltrado.length
    };

    const cargarOpcionesFiltros = useCallback(async () => {
        try {
            const [deptosResponse, empresasResponse, jefesResponse] = await Promise.all([
                apiService.get<{status: boolean; data: any[]}>('/personal/opciones/ObtenerDepartamentos.php'),
                apiService.get<{status: boolean; data: any[]}>('/personal/opciones/ObtenerEmpresas.php'),
                apiService.get<{status: boolean; data: any[]}>('/personal/opciones/ObtenerSupervisores.php')
            ]);
            
            if (deptosResponse.status && deptosResponse.data) {
                const deptosData = Array.isArray(deptosResponse.data) ? deptosResponse.data : [];
                setDepartamentos(deptosData.map(d => ({ 
                    id: d.id?.toString() || d.IdDepartamento?.toString() || '', 
                    valor: d.Departamento || d.valor || d.descripcion || '' 
                })));
            }
            
            if (empresasResponse.status && empresasResponse.data) {
                const empresasData = Array.isArray(empresasResponse.data) ? empresasResponse.data : [];
                setEmpresas(empresasData.map(e => ({ 
                    id: e.id?.toString() || e.IdEmpresa?.toString() || '', 
                    valor: e.Empresa || e.valor || e.descripcion || '' 
                })));
            }
            
            if (jefesResponse.status && jefesResponse.data) {
                const jefesData = Array.isArray(jefesResponse.data) ? jefesResponse.data : [];
                setJefes(jefesData.map(j => ({ 
                    id: j.id || j.IdPersonal || '', 
                    valor: j.NombreCompleto || j.valor || j.descripcion || '' 
                })));
            }
        } catch (error) {
            console.error('Error cargando opciones para filtros:', error);
        }
    }, []);

    const limpiarFiltrosAvanzados = () => {
        const fechaActual = obtenerFechaActual();
        setFiltroNoEmpleado('');
        setFiltroNombreCompleto('');
        setFiltroDepartamento('');
        setFiltroEmpresa('');
        setFiltroJefeInmediato('');
        setFiltroEstatus('todos');
        setFechaInicio(fechaActual);
        setFechaFin(fechaActual);
    };

    useEffect(() => {
        fetchVacaciones();
        cargarOpcionesFiltros();
    }, []);

    useEffect(() => {
        if (!loading && !refreshing) {
            const timeoutId = setTimeout(() => {
                fetchVacaciones();
            }, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [fechaInicio, fechaFin, filtroNoEmpleado, filtroNombreCompleto, filtroDepartamento, filtroEmpresa, filtroJefeInmediato, filtroEstatus]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando sistema de vacaciones...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <AlertCircle size={48} className="error-icon" />
                <h4>Error al cargar datos</h4>
                <p className="error-message">{error}</p>
                <button onClick={() => fetchVacaciones()} className="btn btn-primary mt-3">
                    <RefreshCw size={16} className="me-2" />
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <div className="content-header">
                <div className="container-fluid">
                    <div className="row mb-4">
                        <div className="col-md-12">
                            <div className="filtros-avanzados-container">
                                <button
                                    className="filtros-avanzados-toggle"
                                    onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
                                >
                                    <Filter size={18} />
                                    <span>Filtros Avanzados</span>
                                    <ChevronDown size={16} style={{ 
                                        transform: showFiltrosAvanzados ? 'rotate(180deg)' : 'rotate(0deg)', 
                                        transition: 'transform 0.2s' 
                                    }} />
                                </button>

                                {showFiltrosAvanzados && (
                                    <div className="filtros-avanzados-content">
                                        <div className="filtros-avanzados-grid">
                                            <div className="filtro-avanzado-group">
                                                <label>Fecha Inicio</label>
                                                <input
                                                    type="date"
                                                    value={fechaInicio}
                                                    onChange={(e) => setFechaInicio(e.target.value)}
                                                />
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Fecha Fin</label>
                                                <input
                                                    type="date"
                                                    value={fechaFin}
                                                    onChange={(e) => setFechaFin(e.target.value)}
                                                />
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>No. Empleado</label>
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por número..."
                                                    value={filtroNoEmpleado}
                                                    onChange={(e) => setFiltroNoEmpleado(e.target.value)}
                                                />
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    placeholder="Buscar por nombre..."
                                                    value={filtroNombreCompleto}
                                                    onChange={(e) => setFiltroNombreCompleto(e.target.value)}
                                                />
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Departamento</label>
                                                <select
                                                    value={filtroDepartamento}
                                                    onChange={(e) => setFiltroDepartamento(e.target.value)}
                                                >
                                                    <option value="">TODOS</option>
                                                    {departamentos.map(depto => (
                                                        <option key={depto.id} value={depto.id}>
                                                            {depto.valor}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Empresa</label>
                                                <select
                                                    value={filtroEmpresa}
                                                    onChange={(e) => setFiltroEmpresa(e.target.value)}
                                                >
                                                    <option value="">TODOS</option>
                                                    {empresas.map(emp => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.valor}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Jefe Inmediato</label>
                                                <select
                                                    value={filtroJefeInmediato}
                                                    onChange={(e) => setFiltroJefeInmediato(e.target.value)}
                                                >
                                                    <option value="">TODOS</option>
                                                    {jefes.map(jefe => (
                                                        <option key={jefe.id} value={jefe.id}>
                                                            {jefe.valor}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="filtro-avanzado-group">
                                                <label>Estatus</label>
                                                <select 
                                                    value={filtroEstatus}
                                                    onChange={(e) => setFiltroEstatus(e.target.value)}
                                                >
                                                    <option value="todos">Todos los estatus</option>
                                                    <option value="pendiente">Pendientes</option>
                                                    <option value="validada">Validadas</option>
                                                    <option value="rechazada">Rechazadas</option>
                                                </select>
                                            </div>
                                        </div>
                                        
                                        <div className="filtros-avanzados-actions">
                                            <button
                                                className="btn-limpiar-filtros"
                                                onClick={limpiarFiltrosAvanzados}
                                            >
                                                <X size={14} />
                                                Limpiar Filtros
                                            </button>
                                            <button
                                                className="btn-aplicar-filtros"
                                                onClick={() => fetchVacaciones()}
                                            >
                                                <Search size={14} />
                                                Aplicar Filtros
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="dashboard-grid">
                        <div className="dashboard-card pendientes-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <Clock size={28} />
                                </div>
                                <div className="card-stats">
                                    <h2>{resumen.totalPendientes}</h2>
                                    <p>Solicitudes Pendientes</p>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="stat-detail">
                                    <span>Esperando autorización</span>
                                    <span className="badge" style={{ backgroundColor: '#ffc107', color: '#000' }}>Pendiente</span>
                                </div>
                                {vacacionesPendientes.length > 0 ? (
                                    <div className="mini-lista">
                                        {vacacionesPendientes.slice(0, 3).map(v => (
                                            <div key={v.IdVacaciones} className="mini-item">
                                                <span>{v.NombreCompleto || `Personal #${v.IdPersonal}`}</span>
                                                <small>{formatDateForServer(v.FechaInicio)} - {formatDateForServer(v.FechaFin)}</small>
                                            </div>
                                        ))}
                                        {vacacionesPendientes.length > 3 && (
                                            <div className="text-muted small mt-2">
                                                +{vacacionesPendientes.length - 3} más...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-muted text-center mt-2 small">
                                        No hay solicitudes pendientes
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-card validadas-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <CheckCircle size={28} />
                                </div>
                                <div className="card-stats">
                                    <h2>{resumen.totalValidadas}</h2>
                                    <p>Solicitudes Validadas</p>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="stat-detail">
                                    <span>Autorizadas en el período</span>
                                    <span className="badge" style={{ backgroundColor: '#28a745', color: '#fff' }}>Validada</span>
                                </div>
                                {vacacionesValidadas.length > 0 ? (
                                    <div className="mini-lista">
                                        {vacacionesValidadas.slice(0, 3).map(v => (
                                            <div key={v.IdVacaciones} className="mini-item">
                                                <span>{v.NombreCompleto || `Personal #${v.IdPersonal}`}</span>
                                                <small>{v.DiasTomar} días</small>
                                            </div>
                                        ))}
                                        {vacacionesValidadas.length > 3 && (
                                            <div className="text-muted small mt-2">
                                                +{vacacionesValidadas.length - 3} más...
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-muted text-center mt-2 small">
                                        No hay solicitudes validadas
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="dashboard-card hoy-card">
                            <div className="card-header">
                                <div className="card-icon">
                                    <Users size={28} />
                                </div>
                                <div className="card-stats">
                                    <h2>{resumen.personalVacacionesHoy}</h2>
                                    <p>En Vacaciones</p>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="stat-detail">
                                    <span>Personal disfrutando sus vacaciones</span>
                                    <span className="badge bg-info">
                                        {fechaInicio === fechaFin ? formatDateForDisplay(fechaInicio) : `${formatDateForDisplay(fechaInicio)} al ${formatDateForDisplay(fechaFin)}`}
                                    </span>
                                </div>
                                
                                {personalVacacionesFiltrado.length > 0 ? (
                                    <div className="personas-vacaciones-lista mt-3">
                                        <div className="fw-bold mb-2 small text-muted">
                                            <User size={12} className="me-1" />
                                            PERSONAS EN VACACIONES:
                                        </div>
                                        {personalVacacionesFiltrado.map(persona => {
                                            const vacacionCompleta = todasVacaciones.find(v => v.IdVacaciones === persona.IdVacaciones);
                                            return (
                                                <div key={persona.IdVacaciones} className="persona-item mb-2 p-2 bg-light rounded">
                                                    <div className="d-flex align-items-start gap-2">
                                                        <div className="flex-grow-1">
                                                            <div className="fw-bold">
                                                                {persona.NombreCompleto}
                                                                {vacacionCompleta && (
                                                                    <span className="ms-2 text-muted small">
        {vacacionCompleta.NoEmpleado ? `#${vacacionCompleta.NoEmpleado}` : `#${vacacionCompleta.IdPersonal}`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="small text-muted">
                                                                <CalendarIcon size={10} className="me-1" />
                                                                {formatDateForServer(persona.FechaInicio)} - {formatDateForServer(persona.FechaFin)}
                                                                <span className="ms-2 badge bg-info badge-sm">
                                                                    {persona.DiasTomar} días
                                                                </span>
                                                            </div>
                                                            {vacacionCompleta && (vacacionCompleta.Departamento || vacacionCompleta.Empresa) && (
                                                                <div className="small text-muted mt-1">
                                                                    {vacacionCompleta.Departamento && <span>{vacacionCompleta.Departamento}</span>}
                                                                    {vacacionCompleta.Departamento && vacacionCompleta.Empresa && <span> - </span>}
                                                                    {vacacionCompleta.Empresa && <span>{vacacionCompleta.Empresa}</span>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="alert alert-light text-center mt-3 mb-0 py-2">
                                        <small className="text-muted">
                                            No hay personal en vacaciones en el período seleccionado con los filtros aplicados
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="table-container card mt-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <Calendar size={20} className="me-2" />
                                Registro Completo de Vacaciones
                            </h5>
                            <div className="text-muted small">
                                <Filter size={14} className="me-1" />
                                Filtros aplicados: {filtroEstatus !== 'todos' && `${filtroEstatus} `}
                                {filtroNoEmpleado && `· No. ${filtroNoEmpleado} `}
                                {filtroNombreCompleto && `· ${filtroNombreCompleto} `}
                                {filtroDepartamento && `· Depto ${filtroDepartamento} `}
                                {filtroEmpresa && `· Empresa ${filtroEmpresa} `}
                                {filtroJefeInmediato && `· Jefe ${filtroJefeInmediato} `}
                                {fechaInicio !== fechaFin && `· ${formatDateForDisplay(fechaInicio)} al ${formatDateForDisplay(fechaFin)}`}
                                {fechaInicio === fechaFin && `· ${formatDateForDisplay(fechaInicio)}`}
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>No. Empleado</th>
                                            <th>Nombre Completo</th>
                                            <th>Departamento</th>
                                            <th>Empresa</th>
                                            <th>Fecha Solicitud</th>
                                            <th>Fecha Inicio</th>
                                            <th>Fecha Fin</th>
                                            <th>Días</th>
                                            <th>Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todasVacaciones.length > 0 ? (
                                            todasVacaciones.map((vacacion) => (
                                                <tr key={vacacion.IdVacaciones}>
                                                    <td>{vacacion.IdVacaciones}</td>
                                                    <td>{vacacion.NoEmpleado || vacacion.IdPersonal}</td>
                                                    <td>{vacacion.NombreCompleto || '---'}</td>
                                                    <td>{vacacion.Departamento || '---'}</td>
                                                    <td>{vacacion.Empresa || '---'}</td>
                                                    <td>{formatDateForServer(vacacion.FechaSolicitud)}</td>
                                                    <td>{formatDateForServer(vacacion.FechaInicio)}</td>
                                                    <td>{formatDateForServer(vacacion.FechaFin)}</td>
                                                    <td className="text-center">{vacacion.DiasTomar}</td>
                                                    <td>
                                                        {vacacion.Estatus == 0 ? (
                                                            <span className="badge" style={{ backgroundColor: '#ffc107', color: '#000' }}>Pendiente</span>
                                                        ) : vacacion.Estatus == 1 ? (
                                                            <span className="badge" style={{ backgroundColor: '#28a745', color: '#fff' }}>Validada</span>
                                                        ) : vacacion.Estatus == 2 ? ( 
                                                            <span className="badge" style={{ backgroundColor: '#dc3545', color: '#fff' }}>Rechazada</span>
                                                        ) : vacacion.Estatus == 3 ? (
                                                            <span className="badge" style={{ backgroundColor: '#6c757d', color: '#fff' }}>Cancelada</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Desconocido</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={10} className="text-center py-4">
                                                    <div className="text-muted">
                                                        <AlertCircle size={32} className="mb-2" />
                                                        <p>No se encontraron registros de vacaciones</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="card-footer text-muted">
                            Mostrando {todasVacaciones.length} registros
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};