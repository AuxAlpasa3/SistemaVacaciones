import React, { useEffect, useState } from 'react';
import { X, Calendar, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService } from '../../api/apiService';
import { formatDateForDisplay } from '../../helpers/date';

interface VacacionesPersonal {
    IdPersonalVacaciones: number;
    IdPersonal: number;
    Año: number;
    DiasGenera: number;
    DiasDisfrutados: number;
    DiasDisponibles: number;
    DiasVencidos: number;
}

interface ApiResponse {
    status: boolean;
    data: VacacionesPersonal | VacacionesPersonal[];
}

interface ModalVacacionesProps {
    visible: boolean;
    onClose: () => void;
    idPersonal: number;
    nombrePersonal: string;
    noEmpleado: number;
}

export const ModalVacaciones: React.FC<ModalVacacionesProps> = ({
    visible,
    onClose,
    idPersonal,
    nombrePersonal,
    noEmpleado
}) => {
    const [vacaciones, setVacaciones] = useState<VacacionesPersonal[]>([]);
    const [loading, setLoading] = useState(false);
    const [infoPersonal, setInfoPersonal] = useState<{
        FechaIngreso: string;
        AniosAntiguedad: number;
        ProximoAniversario: string;
    }>({
        FechaIngreso: '',
        AniosAntiguedad: 0,
        ProximoAniversario: ''
    });

    const cargarTodasVacaciones = async () => {
        try {
            setLoading(true);
            const response = await apiService.get(`/Personal/Vacaciones.php?IdPersonal=${idPersonal}`) as unknown as ApiResponse;
            if (response && response.status && response.data) {
                const datos = Array.isArray(response.data) ? response.data : [response.data];
                datos.sort((a, b) => b.Año - a.Año);
                setVacaciones(datos);
            } else {
                setVacaciones([]);
            }
        } catch (error) {
            console.error('Error cargando vacaciones:', error);
            setVacaciones([]);
        } finally {
            setLoading(false);
        }
    };

    const cargarInfoPersonal = async () => {
        try {
            const response = await apiService.get(`/personal/ObtenerInfoPersonal.php?IdPersonal=${idPersonal}`) as unknown as ApiResponse;
            if (response && response.status && response.data) {
                const data: any = response.data;
                setInfoPersonal({
                    FechaIngreso: data.FechaIngreso || '',
                    AniosAntiguedad: data.AniosAntiguedad || 0,
                    ProximoAniversario: data.ProximoAniversario || ''
                });
            }
        } catch (error) {
            console.error('Error cargando información personal:', error);
        }
    };

    useEffect(() => {
        if (visible && idPersonal) {
            cargarTodasVacaciones();
            cargarInfoPersonal();
        }
    }, [visible, idPersonal]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (!visible) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '700px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        Historial de Vacaciones
                        <span style={{ fontSize: '14px', fontWeight: 'normal', marginLeft: '12px', color: '#666' }}>
                            {nombrePersonal} (No. {noEmpleado})
                        </span>
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(3, 1fr)', 
                        gap: '12px', 
                        marginBottom: '20px',
                        padding: '12px',
                        backgroundColor: '#FFF5E6',
                        borderRadius: '8px',
                        border: '1px solid #FFE0B5'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#E85C0D', marginBottom: '4px' }}>Fecha de Ingreso</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{formatDate(infoPersonal.FechaIngreso)}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#E85C0D', marginBottom: '4px' }}>Años de Antigüedad</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#E85C0D' }}>{infoPersonal.AniosAntiguedad} años</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '11px', color: '#E85C0D', marginBottom: '4px' }}>Próximo Aniversario</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#E85C0D' }}>{formatDateForDisplay(infoPersonal.ProximoAniversario)}</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            className="btn btn-secondary"
                            onClick={cargarTodasVacaciones}
                            style={{ padding: '6px 12px', fontSize: '12px' }}
                            disabled={loading}
                        >
                            <RefreshCw size={14} style={{ marginRight: '4px' }} />
                            Actualizar
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                            <p>Cargando información de vacaciones...</p>
                        </div>
                    ) : vacaciones.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                            <AlertCircle size={48} />
                            <p style={{ marginTop: '12px' }}>No hay información de vacaciones registrada</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#FFF5E6', borderBottom: '2px solid #FFE0B5' }}>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Año</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Días Aplicables</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Días Disfrutados</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Días Disponibles</th>
                                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Días Vencidos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vacaciones.map((vac, index) => (
                                        <tr 
                                            key={vac.IdPersonalVacaciones} 
                                            style={{ 
                                                borderBottom: '1px solid #FFE0B5',
                                                backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FFFBF5'
                                            }}
                                        >
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>{vac.Año}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{vac.DiasGenera}</td>
                                            <td style={{ padding: '12px', textAlign: 'center',
                                                         fontWeight: vac.DiasDisfrutados !== 0 ? 'bold' : 'normal' }}>{vac.DiasDisfrutados}</td>
                                            <td style={{ padding: '12px', textAlign: 'center',
                                                         color: vac.DiasDisponibles !== 0 ? 'green' : 'inherit', 
                                                         fontWeight: vac.DiasDisponibles !== 0 ? 'bold' : 'normal'}}>{vac.DiasDisponibles}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', 
                                                         color: vac.DiasVencidos !== 0 ? 'red' : 'inherit', 
                                                         fontWeight: vac.DiasVencidos !== 0 ? 'bold' : 'normal'}}>{vac.DiasVencidos}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px', borderTop: '1px solid #FFE0B5' }}>
                    <button
                        type="button"
                        className="btn btn-primary orange-button"
                        onClick={onClose}
                        style={{
                            backgroundColor: '#E85C0D',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};