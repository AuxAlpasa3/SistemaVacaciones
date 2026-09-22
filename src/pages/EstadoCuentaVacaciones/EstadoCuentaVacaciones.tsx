import React, { useCallback, useMemo, useState } from 'react';
import { FileDown, RefreshCw } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import { formatReportDate } from '../../helpers/reportDate';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type {
    EstadoVacaciones,
    EstadoCuentaPorAnio,
    EmpleadoOpcion
} from '../../interfaces/EstadoCuentaVacaciones';
import { BuscadorEmpleado } from '../../components/BuscadorEmpleado/BuscadorEmpleado'; 
import { EstadoCuentaVacacionesPDF } from '../../components/Reportes/EstadoCuentaVacacionesPDF'; 
import './EstadoCuentaVacaciones.css';
 
interface Props {
    idUsuario: number;
}

export const EstadoCuentaVacaciones: React.FC<Props> = ({ idUsuario }) => {
    const [loading, setLoading] = useState(false);
    const [estadoCuenta, setEstadoCuenta] =
        useState<EstadoVacaciones | null>(null);
    const [pdfVisible, setPdfVisible] = useState(false);
    const [empleadoSel, setEmpleadoSel] = useState<EmpleadoOpcion | null>(null);

    const cargarEstadoCuenta = useCallback(async (noEmpleado: string) => {
        try {
            setLoading(true);
            setEstadoCuenta(null);

            const respuesta = await apiService.get<RespuestaAPI>(
                `/ReportesVacaciones/ReporteEstadoCuenta.php?busqueda=${encodeURIComponent(
                    noEmpleado
                )}`
            );

            if (!respuesta?.status || !respuesta?.data) {
                showToast({
                    text: respuesta?.message ?? 'No se encontró el empleado',
                    type: 'warning',
                    autoClose: 2500
                });
                return;
            }

            const data = respuesta.data as any;

            const detalle: EstadoCuentaPorAnio[] = Array.isArray(data.Detalle)
                ? data.Detalle.map((d: any) => ({
                      Anio: Number(d.Anio ?? 0),
                      DiasHabilitados: Number(d.DiasHabilitados ?? 0),
                      DiasTomados: Number(d.DiasTomados ?? 0),
                      DiasVencidos: Number(d.DiasVencidos ?? 0),
                      DiasVigentes: Number(d.DiasVigentes ?? 0),
                      EstadoPeriodo: d.EstadoPeriodo ?? '',
                      FechasTomadas: Array.isArray(d.FechasTomadas)
                          ? d.FechasTomadas
                          : []
                  }))
                : [];

            setEstadoCuenta({
                IdPersonal: Number(data.IdPersonal ?? 0),
                NoEmpleado: data.NoEmpleado ?? '',
                NombreCompleto: data.NombreCompleto ?? '',
                Departamento: data.Departamento ?? '',
                FechaIngreso: data.FechaIngreso ?? '',
                ProximoAniversario: data.ProximoAniversario ?? '',
                Antiguedad: Number(data.Antiguedad ?? 0),
                Detalle: detalle.sort((a, b) => b.Anio - a.Anio)
            });
        } catch (error) {
            console.error(error);
            showToast({
                text: 'Error al consultar el estado de cuenta',
                type: 'error',
                autoClose: 2000
            });
        } finally {
            setLoading(false);
        }
    }, []);

    const onSelectEmpleado = (empleado: EmpleadoOpcion | null) => {
        setEmpleadoSel(empleado);
        if (empleado) {
            cargarEstadoCuenta(empleado.NoEmpleado);
        } else {
            setEstadoCuenta(null);
        }
    };

    const totales = useMemo(() => {
        if (!estadoCuenta) {
            return { habilitados: 0, tomados: 0, vencidos: 0, vigentes: 0 };
        }
        return estadoCuenta.Detalle.reduce(
            (acc, d) => ({
                habilitados: acc.habilitados + d.DiasHabilitados,
                tomados: acc.tomados + d.DiasTomados,
                vencidos: acc.vencidos + d.DiasVencidos,
                vigentes: acc.vigentes + d.DiasVigentes
            }),
            { habilitados: 0, tomados: 0, vencidos: 0, vigentes: 0 }
        );
    }, [estadoCuenta]);

    const columnas: Column[] = useMemo(
        () => [
            {
                key: 'Anio',
                title: 'Año',
                sortable: true,
                searchable: false,
                width: '100px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'DiasHabilitados',
                title: 'Días Habilitados',
                sortable: true,
                searchable: false,
                width: '150px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="vacaciones-dias-asignados">{value}</span>
                )
            },
            {
                key: 'DiasTomados',
                title: 'Días Tomados',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="vacaciones-dias-tomados">{value}</span>
                )
            },
            {
                key: 'DiasVencidos',
                title: 'Días Vencidos',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="vacaciones-dias-vencidos">{value}</span>
                )
            },
            {
                key: 'DiasVigentes',
                title: 'Días Vigentes',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span
                        className={
                            Number(value) > 0
                                ? 'vacaciones-dias-pendientes'
                                : 'vacaciones-sin-pendientes'
                        }
                    >
                        {value}
                    </span>
                )
            }
        ],
        []
    );

    return (
        <div className="vacaciones-container estado-cuenta-container">
            <div className="vacaciones-header no-print">
                <div>
                    <h1 className="vacaciones-title">
                        Estado de Cuenta de Vacaciones
                    </h1>
                </div>

                <div className="vacaciones-actions">
                    <button
                        type="button"
                        className="vacaciones-btn vacaciones-btn-excel"
                        onClick={() => setPdfVisible(true)}
                        disabled={!estadoCuenta}
                    >
                        <FileDown size={18} />
                        Imprimir / PDF
                    </button>

                    <button
                        type="button"
                        className="vacaciones-btn vacaciones-btn-actualizar"
                        onClick={() =>
                            empleadoSel &&
                            cargarEstadoCuenta(empleadoSel.NoEmpleado)
                        }
                        disabled={loading || !empleadoSel}
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'vacaciones-spin' : ''}
                        />
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            <div className="vacaciones-filtros no-print">
                <BuscadorEmpleado
                    idUsuario={idUsuario}
                    onSelect={onSelectEmpleado}
                />
            </div>

            {estadoCuenta && (
                <div className="estado-cuenta-encabezado">
                    <div className="estado-cuenta-info">
                        <div>
                            <span>No. Empleado</span>
                            <strong>{estadoCuenta.NoEmpleado}</strong>
                        </div>
                        <div>
                            <span>Nombre</span>
                            <strong>{estadoCuenta.NombreCompleto}</strong>
                        </div>
                        <div>
                            <span>Departamento</span>
                            <strong>{estadoCuenta.Departamento}</strong>
                        </div>
                        <div>
                            <span>Fecha de Ingreso</span>
                            <strong>
                                {formatReportDate(estadoCuenta.FechaIngreso)}
                            </strong>
                        </div>
                        <div>
                            <span>Próxima Fecha de Aniversario</span>
                            <strong>
                                {formatReportDate(
                                    estadoCuenta.ProximoAniversario
                                )}
                            </strong>
                        </div>
                        <div>
                            <span>Antigüedad</span>
                            <strong>
                                {estadoCuenta.Antiguedad}{' '}
                                {estadoCuenta.Antiguedad === 1
                                    ? 'año'
                                    : 'años'}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            {estadoCuenta && (
                <div className="vacaciones-resumen">
                    <div className="vacaciones-resumen-card asignados">
                        <span>Días Habilitados</span>
                        <strong>{totales.habilitados}</strong>
                    </div>
                    <div className="vacaciones-resumen-card tomados">
                        <span>Días Tomados</span>
                        <strong>{totales.tomados}</strong>
                    </div>
                    <div className="vacaciones-resumen-card vencidos">
                        <span>Días Vencidos</span>
                        <strong>{totales.vencidos}</strong>
                    </div>
                    <div className="vacaciones-resumen-card vigentes">
                        <span>Días Vigentes</span>
                        <strong>{totales.vigentes}</strong>
                    </div>
                </div>
            )}

            {estadoCuenta ? (
                <>
                    <div className="vacaciones-tabla">
                        <Tabla
                            columns={columnas}
                            data={estadoCuenta.Detalle}
                            pageSize={20}
                            pageSizeOptions={[10, 20, 50, 100]}
                            emptyMessage="Sin periodos registrados"
                            className="full-height-table"
                            loading={loading}
                        />
                    </div>

                    <div className="estado-cuenta-saldo-total">
                        <span>Saldo total vigente</span>
                        <strong>{totales.vigentes} días</strong>
                    </div>
                </>
            ) : (
                <div className="estado-cuenta-vacio-general no-print">
                    Busque un empleado por número o nombre para ver su estado
                    de cuenta.
                </div>
            )}

            <EstadoCuentaVacacionesPDF
                visible={pdfVisible}
                data={estadoCuenta}
                onClose={() => setPdfVisible(false)}
            />
        </div>
    );
};