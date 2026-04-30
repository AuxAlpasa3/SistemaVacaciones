import React, { useState, useEffect, type ReactElement, useCallback } from 'react';
import { 
    Clock, 
    Truck, 
    CheckCircle, 
    Inbox, 
    Calendar, 
    TrendingUp,
    RefreshCw,
    AlertCircle,
    Scale
} from 'lucide-react';
import './Menu.css';
import { formatDate } from '../../helpers/date';
import { apiService } from '../../api/apiService';

interface MenuStatsResponse {
    status: boolean;
    data?: {
        pendientesHoy: {
            count: number;
            detalles?: BoletaResumen[];
        };
        pendientesEnvio: {
            count: number;
            detalles?: BoletaResumen[];
        };
        enviadosHoy: {
            count: number;
            detalles?: BoletaResumen[];
        };
        recibidosMes: {
            count: number;
        };
        enviadosSemana: {
            count: number;
        };
        enviadosMes: {
            count: number;
        };
    };
    message?: string;
    error?: string;
}

interface MenuStats {
    pendientesHoy: number;
    pendientesEnvio: number;
    enviadosHoy: number;
    recibidosMes: number;
    enviadosSemana: number;
    enviadosMes: number;
}

interface BoletaResumen {
    id: number;
    folio: string;
    cliente: string;
    fecha: string;
    estatus: string;
    peso?: number;
}

export const Menu = (): ReactElement => {
    const [MenuStats, setMenuStats] = useState<MenuStats>({
        pendientesHoy: 0,
        pendientesEnvio: 0,
        enviadosHoy: 0,
        recibidosMes: 0,
        enviadosSemana: 0,
        enviadosMes: 0
    });

    const [detalleBoletas, setDetalleBoletas] = useState<{
        pendientesHoy: BoletaResumen[];
        pendientesEnvio: BoletaResumen[];
        enviadosHoy: BoletaResumen[];
    }>({
        pendientesHoy: [],
        pendientesEnvio: [],
        enviadosHoy: []
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const [showDetallesPendientes, setShowDetallesPendientes] = useState(false);
    const [showDetallesPendientesEnvio, setShowDetallesPendientesEnvio] = useState(false);
    const [showDetallesEnviados, setShowDetallesEnviados] = useState(false);

    const fetchMenuStats = useCallback(async (isRefresh: boolean = false): Promise<void> => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            setError(null);
            
            const response = await apiService.get<MenuStatsResponse>('/Menu.php');
            
            if (response.status && response.data) {
                const data = response.data;
                
                setMenuStats({
                    pendientesHoy: parseInt(data.pendientesHoy?.count?.toString() || '0'),
                    pendientesEnvio: parseInt(data.pendientesEnvio?.count?.toString() || '0'),
                    enviadosHoy: parseInt(data.enviadosHoy?.count?.toString() || '0'),
                    recibidosMes: parseInt(data.recibidosMes?.count?.toString() || '0'),
                    enviadosSemana: parseInt(data.enviadosSemana?.count?.toString() || '0'),
                    enviadosMes: parseInt(data.enviadosMes?.count?.toString() || '0')
                });

                setDetalleBoletas({
                    pendientesHoy: data.pendientesHoy?.detalles || [],
                    pendientesEnvio: data.pendientesEnvio?.detalles || [],
                    enviadosHoy: data.enviadosHoy?.detalles || []
                });

                const updateTime = new Date().toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                setLastUpdate(updateTime);
                
            } else {
                throw new Error(response.message || 'Error al cargar las estadísticas');
            }
            
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al cargar las estadísticas';
            setError(errorMessage);
            
            setMenuStats({
                pendientesHoy: 15,
                pendientesEnvio: 8,
                enviadosHoy: 10,
                recibidosMes: 150,
                enviadosSemana: 45,
                enviadosMes: 120
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchMenuStats();
        
        const interval = setInterval(() => {
            fetchMenuStats(true);
        }, 300000);
        
        return () => {
            clearInterval(interval);
        };
    }, [fetchMenuStats]);

    const totalOperacionesHoy = MenuStats.pendientesHoy + MenuStats.enviadosHoy;
    const porcentajeEficienciaHoy = totalOperacionesHoy > 0 
        ? Math.round((MenuStats.enviadosHoy / totalOperacionesHoy) * 100)
        : 0;

    const promedioDiario = Math.round(MenuStats.enviadosMes / new Date().getDate());
    const eficienciaMensual = MenuStats.recibidosMes > 0 
        ? Math.round((MenuStats.enviadosMes / MenuStats.recibidosMes) * 100)
        : 0;

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando estadísticas del sistema...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <AlertCircle size={48} className="error-icon" />
                <h4>Error al cargar estadísticas</h4>
                <p className="error-message">{error}</p>
                <p className="text-muted mt-3">
                    Mostrando datos de ejemplo para pruebas
                </p>
                <button 
                    onClick={() => fetchMenuStats()} 
                    className="btn btn-primary mt-3"
                >
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
                            <p className="text-muted mb-0">
                                Resumen de operaciones y estadísticas del sistema
                            </p>
                        </div>
                        <div className="col-sm-6 text-end">
                            <button 
                                onClick={() => fetchMenuStats(true)}
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
                </div>
            </div>

            <section className="content">
                <div className="container-fluid">
                    <div className="Menu-grid">
                        <div className="Menu-card" style={{ borderTop: '4px solid #f59e0b' }}>
                            <div className="card-icon" style={{ backgroundColor: '#fef3c7', color: '#f59e0b' }}>
                                <Clock size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.pendientesHoy.toLocaleString()}</h3>
                                <p>Boletas Pendientes Hoy</p>
                                {detalleBoletas.pendientesHoy.length > 0 && (
                                    <button 
                                        className="detalles-btn"
                                        onClick={() => setShowDetallesPendientes(!showDetallesPendientes)}
                                    >
                                        {showDetallesPendientes ? 'Ocultar detalles' : 'Ver detalles'}
                                    </button>
                                )}
                            </div>
                            {showDetallesPendientes && detalleBoletas.pendientesHoy.length > 0 && (
                                <div className="detalles-container">
                                    <h5>Detalles:</h5>
                                    <div className="detalles-grid">
                                        {detalleBoletas.pendientesHoy.map((boleta, index) => (
                                            <div key={index} className="detalle-card">
                                                <div className="detalle-folio">
                                                    <strong>{boleta.folio}</strong>
                                                </div>
                                                <div className="detalle-cliente">{boleta.cliente}</div>
                                                <div className="detalle-fecha">{formatDate(boleta.fecha)}</div>
                                                {boleta.peso && (
                                                    <div className="detalle-peso">
                                                        <span className="peso-label">Peso:</span>
                                                        <span className="peso-value">{boleta.peso.toLocaleString()} kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="Menu-card" style={{ borderTop: '4px solid #3b82f6' }}>
                            <div className="card-icon" style={{ backgroundColor: '#dbeafe', color: '#3b82f6' }}>
                                <Truck size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.pendientesEnvio.toLocaleString()}</h3>
                                <p>Pendientes de Envío</p>
                                {detalleBoletas.pendientesEnvio.length > 0 && (
                                    <button 
                                        className="detalles-btn"
                                        onClick={() => setShowDetallesPendientesEnvio(!showDetallesPendientesEnvio)}
                                    >
                                        {showDetallesPendientesEnvio ? 'Ocultar detalles' : 'Ver detalles'}
                                    </button>
                                )}
                            </div>
                            {showDetallesPendientesEnvio && detalleBoletas.pendientesEnvio.length > 0 && (
                                <div className="detalles-container">
                                    <h5>Detalles:</h5>
                                    <div className="detalles-grid">
                                        {detalleBoletas.pendientesEnvio.map((boleta, index) => (
                                            <div key={index} className="detalle-card">
                                                <div className="detalle-folio">
                                                    <strong>{boleta.folio}</strong>
                                                </div>
                                                <div className="detalle-cliente">{boleta.cliente}</div>
                                                <div className="detalle-fecha">{formatDate(boleta.fecha)}</div>
                                                {boleta.peso && (
                                                    <div className="detalle-peso">
                                                        <span className="peso-label">Peso:</span>
                                                        <span className="peso-value">{boleta.peso.toLocaleString()} kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="Menu-card" style={{ borderTop: '4px solid #10b981' }}>
                            <div className="card-icon" style={{ backgroundColor: '#d1fae5', color: '#10b981' }}>
                                <CheckCircle size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.enviadosHoy.toLocaleString()}</h3>
                                <p>Enviados Hoy</p>
                                {detalleBoletas.enviadosHoy.length > 0 && (
                                    <button 
                                        className="detalles-btn"
                                        onClick={() => setShowDetallesEnviados(!showDetallesEnviados)}
                                    >
                                        {showDetallesEnviados ? 'Ocultar detalles' : 'Ver detalles'}
                                    </button>
                                )}
                            </div>
                            {showDetallesEnviados && detalleBoletas.enviadosHoy.length > 0 && (
                                <div className="detalles-container">
                                    <h5>Detalles:</h5>
                                    <div className="detalles-grid">
                                        {detalleBoletas.enviadosHoy.map((boleta, index) => (
                                            <div key={index} className="detalle-card">
                                                <div className="detalle-folio">
                                                    <strong>{boleta.folio}</strong>
                                                </div>
                                                <div className="detalle-cliente">{boleta.cliente}</div>
                                                <div className="detalle-fecha">{formatDate(boleta.fecha)}</div>
                                                {boleta.peso && (
                                                    <div className="detalle-peso">
                                                        <span className="peso-label">Peso:</span>
                                                        <span className="peso-value">{boleta.peso.toLocaleString()} kg</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="Menu-grid">
                        <div className="Menu-card" style={{ borderTop: '4px solid #8b5cf6' }}>
                            <div className="card-icon" style={{ backgroundColor: '#ede9fe', color: '#8b5cf6' }}>
                                <Inbox size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.recibidosMes.toLocaleString()}</h3>
                                <p>Recibidos Este Mes</p>
                            </div>
                        </div>

                        <div className="Menu-card" style={{ borderTop: '4px solid #ec4899' }}>
                            <div className="card-icon" style={{ backgroundColor: '#fce7f3', color: '#ec4899' }}>
                                <Calendar size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.enviadosSemana.toLocaleString()}</h3>
                                <p>Enviados Esta Semana</p>
                            </div>
                        </div>

                        <div className="Menu-card" style={{ borderTop: '4px solid #1e293b' }}>
                            <div className="card-icon" style={{ backgroundColor: '#f1f5f9', color: '#1e293b' }}>
                                <TrendingUp size={24} />
                            </div>
                            <div className="card-content">
                                <h3>{MenuStats.enviadosMes.toLocaleString()}</h3>
                                <p>Enviados Este Mes</p>
                            </div>
                        </div>
                     </div>
{/*
                    <div className="summary-card">
                        <div className="summary-header">
                            <h5><TrendingUp className="me-2" /> Resumen de Eficiencia</h5>
                            <span className="summary-update">
                                Actualizado: {lastUpdate}
                            </span>
                        </div>
                        <div className="efficiency-grid">
                            <div className="efficiency-item">
                                <div className="efficiency-label">
                                    <Clock size={16} className="me-2" />
                                    Eficiencia Hoy
                                </div>
                                <div className="efficiency-value">
                                    <div className="progress">
                                        <div 
                                            className="progress-bar bg-success" 
                                            style={{ width: `${porcentajeEficienciaHoy}%` }}
                                        ></div>
                                    </div>
                                    <span className="percentage">{porcentajeEficienciaHoy}%</span>
                                </div>
                                <div className="efficiency-detail">
                                    {MenuStats.enviadosHoy} de {totalOperacionesHoy} boletas procesadas
                                </div>
                            </div>
                            
                            <div className="efficiency-item">
                                <div className="efficiency-label">
                                    <Calendar size={16} className="me-2" />
                                    Promedio Diario
                                </div>
                                <div className="efficiency-value">
                                    <h3>{promedioDiario.toLocaleString()}</h3>
                                    <span className="efficiency-sub">boletas/día</span>
                                </div>
                                <div className="efficiency-detail">
                                    {MenuStats.enviadosMes} boletas este mes
                                </div>
                            </div>
                            
                            <div className="efficiency-item">
                                <div className="efficiency-label">
                                    <TrendingUp size={16} className="me-2" />
                                    Eficiencia Mensual
                                </div>
                                <div className="efficiency-value">
                                    <div className="progress">
                                        <div 
                                            className="progress-bar bg-primary" 
                                            style={{ width: `${eficienciaMensual}%` }}
                                        ></div>
                                    </div>
                                    <span className="percentage">{eficienciaMensual}%</span>
                                </div>
                                <div className="efficiency-detail">
                                    {MenuStats.enviadosMes} de {MenuStats.recibidosMes} procesadas
                                </div>
                            </div>
                        </div>
                    </div> */}

                    <div className="system-info-card">
                        <div className="system-info-header">
                            <h6><Scale size={18} className="me-2" /> Información del Sistema</h6>
                        </div>
                        <div className="system-info-grid">
                            <div className="system-info-item">
                                <span className="info-label">Total Operaciones Hoy:</span>
                                <span className="info-value">{totalOperacionesHoy}</span>
                            </div>
                            <div className="system-info-item">
                                <span className="info-label">Pendientes por Procesar:</span>
                                <span className="info-value">{MenuStats.pendientesHoy + MenuStats.pendientesEnvio}</span>
                            </div>
                            <div className="system-info-item">
                                <span className="info-label">Mes Actual:</span>
                                <span className="info-value">
                                    {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="system-info-item">
                                <span className="info-label">Estado del Sistema:</span>
                                <span className="info-value status-active">
                                    <span className="status-dot"></span>
                                    Activo
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};