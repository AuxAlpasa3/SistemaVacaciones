import React, { useState } from 'react';
import { Page, Text, View, Document, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import { apiService } from '../../api/apiService';
import LOGO_ALPASA from '../../assets/LogoCredencial.png'; 

interface DiaNoLaborable {
    Fecha: string;
    Descripcion: string;
    Tipo: 'Festivo' | 'Domingo' | string;
}

interface DiaFestivo {
    IdDiaFestivo: number;
    Anio: number;
    Fecha: string;
    Nombre: string;
    Descripcion: string;
    Tipo: string;
}

interface VacacionData {
    IdVacaciones: number;
    Anio: number;
    FechaSolicitud: string;
    UsuarioSolicitaId?: number;
    UsuarioSolicita: string;
    NoEmpleado: string;
    IdPersonal: number;
    NombreCompleto: string;
    Departamento: string;
    departamento?: number;
    Cargo: string;
    FechaIngreso: string;
    FechaInicio: string;
    FechaFin: string;
    DiasTomar: number;
    FechaRetornoLabores: string;
    Estatus: number;
    UsuarioAutorizaId?: number;
    SaldoDias: number;
    DiasCorresponden: number;
    Antiguedad: string;
    UsuarioAutoriza: string;
    FechaAutoriza: string;
    UsuarioValidaId?: number;
    UsuarioValida: string;
    FechaValidado: string;
    Comentarios?: string;
    // Días no laborables
    DiasFestivos?: DiaFestivo[];
    DiasNoLaborables?: DiaNoLaborable[];
} 
const ORANGE_COLOR = '#D97706';
const ORANGE_DARK = '#B45309';
const BORDER_COLOR = '#d1d5db';
const TEXT_COLOR = '#1f2937';
const LIGHT_ORANGE = '#FFF7ED';
 
const formatFechaCompleta = (fechaStr?: string | null): string => {
    if (!fechaStr) return 'No especificada';

    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return 'Fecha inválida';

    const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const diaSemana = diasSemana[fecha.getDay()];
    const dia = fecha.getDate();
    const mes = meses[fecha.getMonth()];
    const anio = fecha.getFullYear();

    return `${diaSemana} ${dia} de ${mes} de ${anio}`;
};

const formatFechaCorta = (fechaStr?: string | null): string => {
    if (!fechaStr) return '-';
    const fecha = new Date(fechaStr);
    if (isNaN(fecha.getTime())) return '-';
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
};

const formatFechaSegura = (fecha: string | undefined | null, defaultValue = 'No especificada'): string => {
    if (!fecha) return defaultValue;
    return formatFechaCompleta(fecha);
};
 

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: TEXT_COLOR,
    },
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `2px solid ${ORANGE_COLOR}`,
        paddingBottom: 10,
    },
    logoContainer: {
        width: 60,
        height: 60,
        padding: 5,
    },
    logoImage: {
        width: '250%',
        height: '250%',
        objectFit: 'contain',
    },
    titleSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    titleMain: {
        fontSize: 16,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        color: ORANGE_COLOR,
    },
    titleSub: {
        fontSize: 10,
        color: '#666',
    },
    infoSection: {
        marginBottom: 15,
        marginTop: 10,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
        paddingBottom: 6,
    },
    label: {
        width: 140,
        fontWeight: 'bold',
        fontSize: 9,
    },
    value: {
        flex: 1,
        fontSize: 9,
    },
    grid2: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 15,
    },
    gridItem: {
        flex: 1,
    },
    periodSection: {
        marginTop: 15,
        marginBottom: 15,
        backgroundColor: LIGHT_ORANGE,
        padding: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: ORANGE_COLOR,
    },
    periodTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: ORANGE_COLOR,
        marginBottom: 10,
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    periodRow: {
        flexDirection: 'row',
        marginBottom: 6,
        paddingVertical: 2,
    },
    periodLabel: {
        width: 200,
        fontSize: 9,
        fontWeight: 'bold',
    },
    periodValue: {
        flex: 1,
        fontSize: 9,
    },
    summaryTable: {
        marginTop: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: BORDER_COLOR,
    },
    summaryHeader: {
        flexDirection: 'row',
        backgroundColor: ORANGE_COLOR,
        padding: 8,
    },
    summaryHeaderCell: {
        flex: 1,
        color: 'white',
        fontWeight: 'bold',
        fontSize: 9,
        textAlign: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: BORDER_COLOR,
        padding: 6,
    },
    summaryCell: {
        flex: 1,
        fontSize: 9,
        textAlign: 'left',
        paddingLeft: 10,
    },
    summaryCellBold: {
        flex: 1,
        fontSize: 9,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    commentsBox: {
        marginTop: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: ORANGE_COLOR,
        padding: 10,
        backgroundColor: LIGHT_ORANGE,
    },
    commentsTitle: {
        fontWeight: 'bold',
        marginBottom: 5,
        color: ORANGE_COLOR,
        fontSize: 9,
    },
    commentsText: {
        fontSize: 8,
        color: '#374151',
    },
    signatureSection: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: BORDER_COLOR,
        paddingTop: 30,
    },
    signatureBox: {
        width: '30%',
        alignItems: 'center',
    },
    signatureLine: {
        borderTopWidth: 1,
        borderTopColor: '#000',
        width: '100%',
        marginBottom: 8,
        paddingTop: 8,
    },
    signatureTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    signatureName: {
        fontSize: 8,
        marginBottom: 2,
        textAlign: 'center',
    },
    signatureStatus: {
        fontSize: 7,
        color: '#666',
        textAlign: 'center',
    },
    bold: {
        fontWeight: 'bold',
    },
    orangeText: {
        color: ORANGE_COLOR,
    },
    divider: {
        borderBottomWidth: 2,
        borderBottomColor: ORANGE_COLOR,
        marginVertical: 10,
    },

    // ---------- Tabla días no laborables ----------
    noLaborablesSection: {
        marginTop: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#9CA3AF',
        borderRadius: 4,
    },
    noLaborablesHeaderTitle: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderBottomWidth: 1,
        borderBottomColor: '#D1D5DB',
    },
    noLaborablesTitle: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#374151',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    noLaborablesHeader: {
        flexDirection: 'row',
        backgroundColor: '#6B7280',
        padding: 6,
    },
    noLaborablesHeaderCell: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 8,
        textAlign: 'center',
    },
    noLaborablesRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 5,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    noLaborablesRowAlt: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        padding: 5,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    noLaborablesCell: {
        fontSize: 8,
        textAlign: 'center',
    },
    noLaborablesCellLeft: {
        fontSize: 8,
        textAlign: 'left',
        paddingLeft: 8,
    },
    badgeFestivo: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    badgeDomingo: {
        backgroundColor: '#DBEAFE',
        color: '#1E40AF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 7,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    noLaborablesSummary: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 6,
        backgroundColor: '#F3F4F6',
        borderTopWidth: 1,
        borderTopColor: '#D1D5DB',
    },
    noLaborablesSummaryText: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
    },
    warningBox: {
        backgroundColor: '#FEE2E2',
        padding: 5,
        marginTop: 5,
        marginBottom: 10,
    },
    warningText: {
        color: '#991B1B',
        fontSize: 8,
    },
});

// ============================================================
//  Componente PDF
// ============================================================

interface VacacionesPDFContentProps {
    vacacion: VacacionData;
}

const VacacionesPDFContent: React.FC<VacacionesPDFContentProps> = ({ vacacion }) => {
    if (!vacacion || !vacacion.IdVacaciones) {
        return (
            <Document>
                <Page size="LETTER">
                    <View style={{ padding: 50 }}>
                        <Text>Error: No se encontraron datos de la solicitud de vacaciones</Text>
                    </View>
                </Page>
            </Document>
        );
    }

    // ----- Fechas -----
    const fechaSolicitud = formatFechaSegura(vacacion.FechaSolicitud, formatFechaCompleta(new Date().toISOString()));
    const fechaInicio = formatFechaSegura(vacacion.FechaInicio);
    const fechaFin = formatFechaSegura(vacacion.FechaFin);
    const fechaRetorno = formatFechaSegura(vacacion.FechaRetornoLabores);
    const fechaIngreso = formatFechaSegura(vacacion.FechaIngreso);
    const fechaAutorizacion = formatFechaSegura(vacacion.FechaAutoriza);
    const fechaValidacion = formatFechaSegura(vacacion.FechaValidado);

    // ----- Días -----
    const diasCorresponden = vacacion.DiasCorresponden || 0;
    const saldoDias = vacacion.SaldoDias || 0;
    const diasTomar = vacacion.DiasTomar || 0;
    const saldoRestante = saldoDias - diasTomar;

    // ----- Antigüedad: ya viene formateada del SQL ("X Año(s) Y Mes(es)") -----
    const antiguedadTexto = vacacion.Antiguedad || 'No especificada';

    // ----- Nombres -----
    const nombreJefeInmediato = vacacion.UsuarioAutoriza || 'Pendiente de autorización';
    const nombreRecursosHumanos = vacacion.UsuarioValida || 'Pendiente de validación';
    const nombreSolicitante = vacacion.UsuarioSolicita || vacacion.NombreCompleto || 'No especificado';

    // ----- Días no laborables -----
    const diasNoLaborables: DiaNoLaborable[] = vacacion.DiasNoLaborables || [];
    const hayDiasNoLaborables = diasNoLaborables.length > 0;
    const totalFestivos = diasNoLaborables.filter(d => d.Tipo === 'Festivo').length;
    const totalDomingos = diasNoLaborables.filter(d => d.Tipo === 'Domingo').length;

    return (
        <Document>
            <Page size="LETTER" orientation="portrait" style={styles.page}>
                {/* ---------- Encabezado ---------- */}
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Image src={LOGO_ALPASA} style={styles.logoImage} />
                    </View>
                    <View style={styles.titleSection}>
                        <Text style={styles.titleMain}>SOLICITUD DE VACACIONES</Text>
                        <Text style={styles.titleSub}>Formato RH-VAC-001</Text>
                    </View>
                </View>

                {/* ---------- Información general ---------- */}
                <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Fecha de Solicitud:</Text>
                        <Text style={styles.value}>{fechaSolicitud}</Text>
                        <Text style={[styles.label, { width: 100 }]}>N° Empleado:</Text>
                        <Text style={[styles.value, { width: 120 }]}>{vacacion.NoEmpleado || ''}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Nombre del Empleado:</Text>
                        <Text style={[styles.value, styles.bold]}>{vacacion.NombreCompleto || ''}</Text>
                    </View>

                    <View style={styles.grid2}>
                        <View style={styles.gridItem}>
                            <Text style={styles.label}>Departamento:</Text>
                            <Text style={styles.value}>{vacacion.Departamento || ''}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.label}>Puesto:</Text>
                            <Text style={styles.value}>{vacacion.Cargo || ''}</Text>
                        </View>
                    </View>

                    <View style={styles.grid2}>
                        <View style={styles.gridItem}>
                            <Text style={styles.label}>Fecha de Ingreso:</Text>
                            <Text style={styles.value}>{fechaIngreso}</Text>
                        </View>
                        <View style={styles.gridItem}>
                            <Text style={styles.label}>Antigüedad:</Text>
                            <Text style={styles.value}>{antiguedadTexto}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* ---------- Periodo vacacional ---------- */}
                <View style={styles.periodSection}>
                    <Text style={styles.periodTitle}>Información del Periodo Vacacional</Text>
                    <View style={styles.periodRow}>
                        <Text style={styles.periodLabel}>Periodo Solicitud:</Text>
                        <Text style={[styles.periodValue, styles.bold]}>{vacacion.Anio || 0}</Text>
                    </View>
                    <View style={styles.periodRow}>
                        <Text style={styles.periodLabel}>Días que le corresponden:</Text>
                        <Text style={[styles.periodValue, styles.bold]}>{diasCorresponden} días</Text>
                    </View>
                    <View style={styles.periodRow}>
                        <Text style={styles.periodLabel}>Saldo de días Previos Disponibles:</Text>
                        <Text style={[styles.periodValue, styles.bold, styles.orangeText]}>{saldoDias} días</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* ---------- Tabla resumen ---------- */}
                <View style={styles.summaryTable}>
                    <View style={styles.summaryHeader}>
                        <Text style={styles.summaryHeaderCell}>Detalle</Text>
                        <Text style={styles.summaryHeaderCell}>Información</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Fecha de Inicio:</Text>
                        <Text style={styles.summaryCellBold}>{fechaInicio}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Fecha de Terminación:</Text>
                        <Text style={styles.summaryCellBold}>{fechaFin}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Fecha de Retorno:</Text>
                        <Text style={styles.summaryCellBold}>{fechaRetorno}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Días Aplica:</Text>
                        <Text style={[styles.summaryCellBold, styles.orangeText]}>{diasCorresponden} días</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Días a tomar:</Text>
                        <Text style={[styles.summaryCellBold, styles.orangeText]}>{diasTomar} días</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryCell}>Saldo disponible después de esta solicitud:</Text>
                        <Text style={[styles.summaryCellBold, styles.orangeText]}>{saldoRestante.toFixed(0)} días</Text>
                    </View>
                </View>

                {/* ---------- Tabla días no laborables (condicional) ---------- */}
                {hayDiasNoLaborables && (
                    <View style={styles.noLaborablesSection}>
                        <View style={styles.noLaborablesHeaderTitle}>
                            <Text style={styles.noLaborablesTitle}>
                                Días No Laborables en el Periodo
                            </Text>
                        </View>

                        <View style={styles.noLaborablesHeader}>
                            <Text style={[styles.noLaborablesHeaderCell, { flex: 0.8 }]}>#</Text>
                            <Text style={[styles.noLaborablesHeaderCell, { flex: 1.5 }]}>Fecha</Text>
                            <Text style={[styles.noLaborablesHeaderCell, { flex: 2.5, textAlign: 'left', paddingLeft: 8 }]}>
                                Descripción
                            </Text>
                            <Text style={[styles.noLaborablesHeaderCell, { flex: 1 }]}>Tipo</Text>
                        </View>

                        {diasNoLaborables.map((dia, index) => (
                            <View
                                key={`${dia.Fecha}-${index}`}
                                style={index % 2 === 0 ? styles.noLaborablesRow : styles.noLaborablesRowAlt}
                            >
                                <Text style={[styles.noLaborablesCell, { flex: 0.8 }]}>{index + 1}</Text>
                                <Text style={[styles.noLaborablesCell, { flex: 1.5 }]}>{formatFechaCorta(dia.Fecha)}</Text>
                                <Text style={[styles.noLaborablesCellLeft, { flex: 2.5 }]}>
                                    {dia.Descripcion || 'Día no laborable'}
                                </Text>
                                <View style={[styles.noLaborablesCell, { flex: 1, alignItems: 'center' }]}>
                                    <Text style={dia.Tipo === 'Domingo' ? styles.badgeDomingo : styles.badgeFestivo}>
                                        {dia.Tipo || 'Festivo'}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        <View style={styles.noLaborablesSummary}>
                            <Text style={styles.noLaborablesSummaryText}>
                                Total: {diasNoLaborables.length}
                                {totalFestivos > 0 && `  |  Festivos: ${totalFestivos}`}
                                {totalDomingos > 0 && `  |  Domingos: ${totalDomingos}`}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ---------- Advertencia saldo negativo ---------- */}
                {saldoRestante < 0 && (
                    <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                            ⚠️ Advertencia: El saldo resultante es negativo ({saldoRestante.toFixed(0)} días)
                        </Text>
                    </View>
                )}

                {/* ---------- Comentarios ---------- */}
                {vacacion.Comentarios && vacacion.Comentarios.trim() !== '' && (
                    <View style={styles.commentsBox}>
                        <Text style={styles.commentsTitle}>Comentarios:</Text>
                        <Text style={styles.commentsText}>{vacacion.Comentarios}</Text>
                    </View>
                )}

                {/* ---------- Firmas ---------- */}
                <View style={styles.signatureSection}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureTitle}>Jefe Inmediato</Text>
                        <Text style={styles.signatureName}>{nombreJefeInmediato}</Text>
                        {fechaAutorizacion !== 'No especificada' && (
                            <Text style={styles.signatureStatus}>Fecha: {fechaAutorizacion}</Text>
                        )}
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureTitle}>Recursos Humanos</Text>
                        <Text style={styles.signatureName}>{nombreRecursosHumanos}</Text>
                        {fechaValidacion !== 'No especificada' && (
                            <Text style={styles.signatureStatus}>Fecha: {fechaValidacion}</Text>
                        )}
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureTitle}>Solicitante</Text>
                        <Text style={styles.signatureName}>{nombreSolicitante}</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

// ============================================================
//  Botón que genera el PDF
// ============================================================

interface VacacionesPDFButtonProps {
    idVacaciones: number;
    onSuccess?: (fileName: string) => void;
    onError?: (error: string) => void;
    buttonText?: string;
    className?: string;
}

export const VacacionesPDFButton: React.FC<VacacionesPDFButtonProps> = ({
    idVacaciones,
    onSuccess,
    onError,
    buttonText = 'PDF',
    className = '',
}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGeneratePDF = async () => {
        if (!idVacaciones) {
            const errorMsg = 'ID de vacaciones no proporcionado';
            setError(errorMsg);
            onError?.(errorMsg);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await apiService.get<{
                status: boolean;
                data?: { vacacion: VacacionData };
                message?: string;
            }>(`vacaciones/ObtenerVacacionPDF.php?IdVacaciones=${idVacaciones}`);

            if (!response.status || !response.data) {
                throw new Error(response.message || 'Error al obtener los datos de la vacación');
            }

            const { vacacion } = response.data;

            if (!vacacion) {
                throw new Error('No se encontró la solicitud de vacaciones');
            }

            const blob = await pdf(<VacacionesPDFContent vacacion={vacacion} />).toBlob();

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Solicitud_Vacaciones_${vacacion.NoEmpleado}_${idVacaciones}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            onSuccess?.(`Solicitud_Vacaciones_${vacacion.NoEmpleado}_${idVacaciones}.pdf`);
        } catch (err: any) {
            const errorMsg = err.message || 'Error al generar el PDF';
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleGeneratePDF}
                disabled={loading}
                className={className}
                style={{
                    padding: '8px 16px',
                    backgroundColor: loading ? '#ccc' : ORANGE_COLOR,
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = ORANGE_DARK;
                }}
                onMouseLeave={(e) => {
                    if (!loading) e.currentTarget.style.backgroundColor = ORANGE_COLOR;
                }}
            >
                {loading ? (
                    <>
                        <span>⏳</span> Generando PDF...
                    </>
                ) : (
                    <>
                        <span>📄</span> {buttonText}
                    </>
                )}
            </button>

            {error && (
                <div
                    style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#FEE2E2',
                        border: '1px solid #FCA5A5',
                        borderRadius: '6px',
                        color: '#991B1B',
                        fontSize: '11px',
                    }}
                >
                    ❌ {error}
                </div>
            )}
        </div>
    );
};

export default VacacionesPDFButton;