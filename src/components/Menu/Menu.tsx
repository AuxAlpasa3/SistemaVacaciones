import React, { useState, useEffect, type ReactElement, useCallback } from 'react';
import { 
    Clock, 
    CheckCircle, 
    Calendar, 
    RefreshCw,
    AlertCircle,
    Users,
    Search
} from 'lucide-react';
import './Menu.css';
import { formatDate } from '../../helpers/date';
import { apiService } from '../../api/apiService';

interface Vacacion {
    IdVacaciones: number;
    IdPersonal: string;
    NombrePersonal?: string;
    FechaSolicitud: string;
    FechaInicio: string;
    FechaFin: string;
    FechaRetornoLabores: string;
    DiasTomar: number;
    UsuarioSolicita: number;
    UsuarioAutoriza?: number;
    FechaAutoriza?: string;
    Estatus: number;
}

interface VacacionesResponse {
    status: boolean;
    data?: {
        pendientes: Vacacion[];
        validadas: Vacacion[];
        todasVacaciones: Vacacion[];
        resumen: {
            totalPendientes: number;
            totalValidadas: number;
            personalVacacionesHoy: number;
        };
    };
    message?: string;
    error?: string;
}

export const Menu = (): ReactElement => {
    const [vacacionesPendientes, setVacacionesPendientes] = useState<Vacacion[]>([]);
    const [vacacionesValidadas, setVacacionesValidadas] = useState<Vacacion[]>([]);
    const [todasVacaciones, setTodasVacaciones] = useState<Vacacion[]>([]);
    const [resumen, setResumen] = useState({
        totalPendientes: 0,
        totalValidadas: 0,
        personalVacacionesHoy: 0
    });
    
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');
    
    const [fechaInicio, setFechaInicio] = useState<string>(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });
    const [fechaFin, setFechaFin] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() + 1);
        date.setDate(0);
        return date.toISOString().split('T')[0];
    });
    const [filtroPersonal, setFiltroPersonal] = useState<string>('');
    const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');

    const fetchVacaciones = useCallback(async (isRefresh: boolean = false): Promise<void> => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            
            const response = await apiService.get<VacacionesResponse>(`Menu.php?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            
            if (response.status && response.data) {
                setVacacionesPendientes(response.data.pendientes || []);
                setVacacionesValidadas(response.data.validadas || []);
                setTodasVacaciones(response.data.todasVacaciones || []);
                setResumen(response.data.resumen || {
                    totalPendientes: 0,
                    totalValidadas: 0,
                    personalVacacionesHoy: 0
                });
                
                const updateTime = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                setLastUpdate(updateTime);
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
    }, [fechaInicio, fechaFin]);

    useEffect(() => {
        fetchVacaciones();
    }, [fetchVacaciones]);

    const vacacionesFiltradas = todasVacaciones.filter(vacacion => {
        const cumplePersonal = filtroPersonal === '' || 
            vacacion.IdPersonal.toString().includes(filtroPersonal);
        
        const cumpleEstatus = filtroEstatus === 'todos' || 
            (filtroEstatus === 'pendiente' && vacacion.Estatus === 0) ||
            (filtroEstatus === 'validada' && vacacion.Estatus === 1)  ||
            (filtroEstatus === 'rechazada' && vacacion.Estatus === 2);
        
        return cumplePersonal && cumpleEstatus;
    });

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
                        <div className="col-sm-6">
                            <h4>Dashboard de Vacaciones</h4>
                            <p className="text-muted mb-0">
                                Gestión y seguimiento de solicitudes de vacaciones
                            </p>
                        </div>
                        <div className="col-sm-6 text-end">
                            <button 
                                onClick={() => fetchVacaciones(true)}
                                className="btn btn-outline-primary"
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Actualizando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={16} className="me-2" />
                                        Actualizar
                                    </>
                                )}
                            </button>
                            <div className="last-update mt-2">
                                <small className="text-muted">
                                    Última actualización: {lastUpdate}
                                </small>
                            </div>
                        </div>
                    </div>

                    <div className="row mb-4">
                        <div className="col-md-12">
                            <div className="filtros-container card p-3">
                                <div className="row align-items-end">
                                    <div className="col-md-4">
                                        <label className="form-label">Fecha Inicio</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">Fecha Fin</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <button 
                                            className="btn btn-primary w-100"
                                            onClick={() => fetchVacaciones()}
                                        >
                                            <Search size={16} className="me-2" />
                                            Aplicar Filtro
                                        </button>
                                    </div>
                                </div>
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
                                    <span className="badge bg-warning">Pendiente</span>
                                </div>
                                {vacacionesPendientes.length > 0 && (
                                    <div className="mini-lista">
                                        {vacacionesPendientes.slice(0, 3).map(v => (
                                            <div key={v.IdVacaciones} className="mini-item">
                                                <span>Personal #{v.IdPersonal}</span>
                                                <small>{formatDate(v.FechaInicio)} - {formatDate(v.FechaFin)}</small>
                                            </div>
                                        ))}
                                        {vacacionesPendientes.length > 3 && (
                                            <div className="text-muted small mt-2">
                                                +{vacacionesPendientes.length - 3} más...
                                            </div>
                                        )}
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
                                    <span className="badge bg-success">Validada</span>
                                </div>
                                {vacacionesValidadas.length > 0 && (
                                    <div className="mini-lista">
                                        {vacacionesValidadas.slice(0, 3).map(v => (
                                            <div key={v.IdVacaciones} className="mini-item">
                                                <span>Personal #{v.IdPersonal}</span>
                                                <small>{v.DiasTomar} días</small>
                                            </div>
                                        ))}
                                        {vacacionesValidadas.length > 3 && (
                                            <div className="text-muted small mt-2">
                                                +{vacacionesValidadas.length - 3} más...
                                            </div>
                                        )}
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
                                    <p>En Vacaciones Hoy</p>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="stat-detail">
                                    <span>Personal disfrutando sus vacaciones</span>
                                    <span className="badge bg-info">Hoy</span>
                                </div>
                                <div className="fecha-actual">
                                    <small>{new Date().toLocaleDateString('es-ES')}</small>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="table-container card mt-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">
                                <Calendar size={20} className="me-2" />
                                Registro Completo de Vacaciones
                            </h5>
                            <div className="filtros-table d-flex gap-2">
                                <div className="input-group input-group-sm" style={{ width: '250px' }}>
                                    <span className="input-group-text">
                                        <Search size={14} />
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Buscar por personal..."
                                        value={filtroPersonal}
                                        onChange={(e) => setFiltroPersonal(e.target.value)}
                                    />
                                </div>
                                <select 
                                    className="form-select form-select-sm"
                                    style={{ width: '150px' }}
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
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>ID</th>
                                            <th>Personal ID</th>
                                            <th>Fecha Solicitud</th>
                                            <th>Fecha Inicio</th>
                                            <th>Fecha Fin</th>
                                            <th>Retorno Laboral</th>
                                            <th>Días</th>
                                            <th>Fecha Autorización</th>
                                            <th>Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vacacionesFiltradas.length > 0 ? (
                                            vacacionesFiltradas.map((vacacion) => (
                                                <tr key={vacacion.IdVacaciones}>
                                                    <td>{vacacion.IdVacaciones}</td>
                                                    <td> #{vacacion.IdPersonal}</td>
                                                    <td>{formatDate(vacacion.FechaSolicitud)}</td>
                                                    <td>{formatDate(vacacion.FechaInicio)}</td>
                                                    <td>{formatDate(vacacion.FechaFin)}</td>
                                                    <td>{formatDate(vacacion.FechaRetornoLabores)}</td>
                                                    <td className="text-center">{vacacion.DiasTomar}</td>
                                                    <td>{vacacion.FechaAutoriza ? formatDate(vacacion.FechaAutoriza) : '---'}</td>
                                                    <td>
                                                        {vacacion.Estatus == 0 ? (
                                                            <span className="badge bg-warning">Pendiente</span>
                                                        ) : vacacion.Estatus == 1 ? (
                                                            <span className="badge bg-success">Validada</span>
                                                        ) : vacacion.Estatus == 2 ? ( 
                                                            <span className="badge bg-danger">Rechazada</span>
                                                        ) : (
                                                            <span className="badge bg-secondary">Desconocido</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={9} className="text-center py-4">
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
                            Mostrando {vacacionesFiltradas.length} de {todasVacaciones.length} registros
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};