import React, { useEffect, useState } from 'react';
import { X, AlertCircle, RefreshCw, Edit, CheckCircle } from 'lucide-react';
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
    FechaInicioPeriodo?: string;
}

interface ApiResponse {
    status: boolean;
    data: VacacionesPersonal | VacacionesPersonal[];
    message?: string;
}

interface ModalVacacionesProps {
    visible: boolean;
    onClose: () => void;
    idPersonal: number;
    nombrePersonal: string;
    noEmpleado: number;
    usuarioId: number;
    usuarioNombre?: string;
}

export const ModalVacaciones: React.FC<ModalVacacionesProps> = ({
    visible,
    onClose,
    idPersonal,
    nombrePersonal,
    noEmpleado,
    usuarioId,
    usuarioNombre = 'Sistema'
}) => {
    const [vacaciones, setVacaciones] = useState<VacacionesPersonal[]>([]);
    const [loading, setLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number | null>(null);
    const [selectedVacacion, setSelectedVacacion] = useState<VacacionesPersonal | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    
    const [nuevaVacacion, setNuevaVacacion] = useState({
        FechaInicio: '',
        FechaFin: '',
        DiasTomar: 0,
        Comentarios: '',
        NoContarDomingos: 1
    });

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

    const handleEditarVacacion = (vacacion: VacacionesPersonal) => {
        if (vacacion.DiasDisponibles <= 0) {
            alert('No hay días disponibles para este año');
            return;
        }
        
        setSelectedYear(vacacion.Año);
        setSelectedVacacion(vacacion);
        
        let fechaInicioPredeterminada = '';
        if (vacacion.FechaInicioPeriodo) {
            const fecha = new Date(vacacion.FechaInicioPeriodo);
            fechaInicioPredeterminada = fecha.toISOString().split('T')[0];
        }
        
        setNuevaVacacion({
            DiasTomar: 0,
            FechaInicio: fechaInicioPredeterminada,
            FechaFin: '',
            Comentarios: `Vacación correspondiente al año ${vacacion.Año} - Solicitada por: ${usuarioNombre}`,
            NoContarDomingos: 1
        });
        setShowEditModal(true);
    };

    const contarDiasHabiles = (fechaInicio: string, fechaFin: string, excluirDomingos: boolean) => {
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
    };

    const calcularFechaFin = (fechaInicio: string, dias: number, excluirDomingos: boolean) => {
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
    };

    useEffect(() => {
        if (nuevaVacacion.FechaInicio && nuevaVacacion.DiasTomar > 0) {
            const fechaFin = calcularFechaFin(
                nuevaVacacion.FechaInicio,
                nuevaVacacion.DiasTomar,
                nuevaVacacion.NoContarDomingos === 1
            );
            setNuevaVacacion(prev => ({ ...prev, FechaFin: fechaFin }));
        }
    }, [nuevaVacacion.FechaInicio, nuevaVacacion.DiasTomar, nuevaVacacion.NoContarDomingos]);

    const handleAgregarVacacion = async () => {
        if (!nuevaVacacion.FechaInicio || !nuevaVacacion.FechaFin) {
            alert('Por favor selecciona las fechas de inicio y fin');
            return;
        }
        
        if (nuevaVacacion.DiasTomar <= 0) {
            alert('Los días a tomar deben ser mayores a 0');
            return;
        }

        if (selectedVacacion && nuevaVacacion.DiasTomar > selectedVacacion.DiasDisponibles) {
            alert(`No puedes tomar más de ${selectedVacacion.DiasDisponibles} días disponibles para el año ${selectedVacacion.Año}`);
            return;
        }

        const fechaInicio = new Date(nuevaVacacion.FechaInicio);
        const fechaFin = new Date(nuevaVacacion.FechaFin);
        
        if (fechaFin < fechaInicio) {
            alert('La fecha de fin no puede ser anterior a la fecha de inicio');
            return;
        }

        try {
            setEditLoading(true);
            
            const fechaRetorno = new Date(fechaFin);
            fechaRetorno.setDate(fechaRetorno.getDate() + 1);

            let diasTomar = nuevaVacacion.DiasTomar;
            if (nuevaVacacion.NoContarDomingos === 1) {
                let diasHabiles = 0;
                let fechaActual = new Date(fechaInicio);
                while (fechaActual <= fechaFin) {
                    if (fechaActual.getDay() !== 0) {
                        diasHabiles++;
                    }
                    fechaActual.setDate(fechaActual.getDate() + 1);
                }
                diasTomar = diasHabiles;
            }

            const payload = {
                IdPersonal: idPersonal,
                FechaSolicitud: new Date().toISOString().split('T')[0],
                FechaInicio: nuevaVacacion.FechaInicio,
                FechaFin: nuevaVacacion.FechaFin,
                FechaRetornoLabores: fechaRetorno.toISOString().split('T')[0],
                DiasTomar: diasTomar,
                UsuarioSolicita: usuarioId,
                UsuarioAutoriza: usuarioId,
                FechaAutoriza: new Date().toISOString().split('T')[0],
                Estatus: 2,
                Comentarios: nuevaVacacion.Comentarios || '',
                UsuarioValida: usuarioId,
                FechaValidado: new Date().toISOString().split('T')[0],
                Anio: fechaInicio.getFullYear(),
                NoContarDomingos: nuevaVacacion.NoContarDomingos
            };
            
            const response = await apiService.post('/Vacaciones/AgregarVacacion.php', payload) as unknown as ApiResponse;
            
            if (response && response.status) {
                alert(`Vacación agregada correctamente para el año ${selectedYear}`);
                setShowEditModal(false);
                setNuevaVacacion({
                    FechaInicio: '',
                    FechaFin: '',
                    DiasTomar: 0,
                    Comentarios: '',
                    NoContarDomingos: 1
                });
                setSelectedVacacion(null);
                setSelectedYear(null);
                await cargarTodasVacaciones();
                await cargarInfoPersonal();
            } else {
                alert(response.message || 'Error al agregar la vacación');
            }
        } catch (error) {
            console.error('Error agregando vacación:', error);
            alert('Error al agregar la vacación');
        } finally {
            setEditLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '900px', maxWidth: '95vw' }}>
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

                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                                <strong>Usuario que registra:</strong> {usuarioNombre} (ID: {usuarioId})
                            </div>
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
                                            <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#E85C0D', fontWeight: 'bold' }}>Acciones</th>
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
                                                             color: vac.DiasDisponibles !== 0 ? '#28a745' : 'inherit', 
                                                             fontWeight: vac.DiasDisponibles !== 0 ? 'bold' : 'normal'}}>{vac.DiasDisponibles}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', 
                                                             color: vac.DiasVencidos !== 0 ? '#dc3545' : 'inherit', 
                                                             fontWeight: vac.DiasVencidos !== 0 ? 'bold' : 'normal'}}>{vac.DiasVencidos}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => handleEditarVacacion(vac)}
                                                        style={{
                                                            background: vac.DiasDisponibles > 0 ? '#E85C0D' : '#ccc',
                                                            border: 'none',
                                                            color: 'white',
                                                            cursor: vac.DiasDisponibles > 0 ? 'pointer' : 'not-allowed',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            opacity: vac.DiasDisponibles > 0 ? 1 : 0.5
                                                        }}
                                                        title={vac.DiasDisponibles > 0 ? `Registrar vacación para ${vac.Año}` : 'No hay días disponibles'}
                                                        disabled={vac.DiasDisponibles === 0}
                                                    >
                                                        <Edit size={14} />
                                                        Registrar
                                                    </button>
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

            {showEditModal && selectedVacacion && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '550px', maxWidth: '90vw' }}>
                        <div className="modal-header" style={{ borderBottom: '2px solid #28a745' }}>
                            <h3 className="modal-title" style={{ color: '#28a745' }}>
                                <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px' }} />
                                Registrar Vacación - Año {selectedYear}
                            </h3>
                            <button className="modal-close" onClick={() => setShowEditModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div style={{ 
                                backgroundColor: '#E3F2FD', 
                                padding: '10px', 
                                borderRadius: '6px', 
                                marginBottom: '16px',
                                border: '1px solid #BBDEFB'
                            }}>
                                <div style={{ fontSize: '13px', color: '#1565C0' }}>
                                    <strong>Registrado por:</strong> {usuarioNombre} (ID: {usuarioId})
                                </div>
                            </div>

                            <div style={{ 
                                backgroundColor: '#E8F5E9', 
                                padding: '12px', 
                                borderRadius: '8px', 
                                marginBottom: '16px',
                                border: '1px solid #C8E6C9'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div><strong>Año:</strong> {selectedVacacion.Año}</div>
                                    <div><strong>Días Aplicables:</strong> {selectedVacacion.DiasGenera}</div>
                                    <div><strong>Días Disponibles:</strong> <span style={{ color: '#2E7D32', fontWeight: 'bold' }}>{selectedVacacion.DiasDisponibles}</span></div>
                                    <div><strong>Días Disfrutados:</strong> {selectedVacacion.DiasDisfrutados}</div>
                                </div>
                                {selectedVacacion.FechaInicioPeriodo && (
                                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                                        <strong>Inicio del periodo:</strong> {formatDate(selectedVacacion.FechaInicioPeriodo)}
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Fecha de Inicio *
                                    {selectedVacacion.FechaInicioPeriodo && (
                                        <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                            (Periodo: {formatDate(selectedVacacion.FechaInicioPeriodo)})
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="date"
                                    value={nuevaVacacion.FechaInicio}
                                    onChange={(e) => setNuevaVacacion({...nuevaVacacion, FechaInicio: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Días a Tomar * 
                                    <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
                                        (Máximo: {selectedVacacion.DiasDisponibles} días)
                                    </span>
                                </label>
                                <input
                                    type="number"
                                    value={nuevaVacacion.DiasTomar}
                                    onChange={(e) => {
                                        const valor = Number(e.target.value);
                                        if (valor <= selectedVacacion.DiasDisponibles) {
                                            setNuevaVacacion({...nuevaVacacion, DiasTomar: valor});
                                        } else {
                                            alert(`El número de días no puede exceder los ${selectedVacacion.DiasDisponibles} días disponibles`);
                                        }
                                    }}
                                    min="1"
                                    max={selectedVacacion.DiasDisponibles}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Fecha de Fin (Calculada automáticamente)
                                </label>
                                <input
                                    type="date"
                                    value={nuevaVacacion.FechaFin}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        backgroundColor: '#f5f5f5'
                                    }}
                                    readOnly
                                />
                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                    * Se calcula automáticamente según los días a tomar
                                </div>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    <input
                                        type="checkbox"
                                        checked={nuevaVacacion.NoContarDomingos === 1}
                                        onChange={(e) => setNuevaVacacion({...nuevaVacacion, NoContarDomingos: e.target.checked ? 1 : 0})}
                                        style={{ marginRight: '8px' }}
                                    />
                                    No contar domingos
                                </label>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                                    Comentarios
                                </label>
                                <textarea
                                    value={nuevaVacacion.Comentarios}
                                    onChange={(e) => setNuevaVacacion({...nuevaVacacion, Comentarios: e.target.value})}
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            <div style={{ 
                                backgroundColor: '#E8F5E9', 
                                padding: '10px', 
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                border: '1px solid #C8E6C9'
                            }}>
                                <CheckCircle size={18} color="#2E7D32" style={{ marginRight: '8px' }} />
                                <span style={{ color: '#2E7D32', fontWeight: '500' }}>
                                    Esta vacación se registrará como VALIDADA automáticamente
                                    <br />
                                    <span style={{ fontSize: '12px', fontWeight: 'normal' }}>
                                        por: {usuarioNombre} (ID: {usuarioId})
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px', borderTop: '1px solid #FFE0B5' }}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    border: '1px solid #ddd',
                                    borderRadius: '6px',
                                    backgroundColor: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAgregarVacacion}
                                disabled={editLoading || nuevaVacacion.DiasTomar === 0}
                                style={{
                                    padding: '8px 16px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    cursor: nuevaVacacion.DiasTomar === 0 ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    opacity: nuevaVacacion.DiasTomar === 0 ? 0.6 : 1
                                }}
                            >
                                {editLoading ? (
                                    'Guardando...'
                                ) : (
                                    <>
                                        <CheckCircle size={16} style={{ marginRight: '6px' }} />
                                        Guardar Vacación (Validada)
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};