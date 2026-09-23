import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Building2, Users, Briefcase } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { MultiSelect } from '../../components/MultiSelect/MultiSelect';
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type {
    MonitoreoResponse,
    MonitoreoDetalle,
    MonitoreoPorDepartamento,
    MonitoreoPorEmpresa
} from '../../interfaces/MonitoreoSaldos';
import './MonitoreoSaldos.css';

type VistaAgrupacion = 'empleado' | 'departamento' | 'empresa';

export const MonitoreoSaldos: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<MonitoreoResponse | null>(null);
    const [vista, setVista] = useState<VistaAgrupacion>('empleado');
    const [departamentosSeleccionados, setDepartamentosSeleccionados] = useState<string[]>([]);
    const [empresasSeleccionadas, setEmpresasSeleccionadas] = useState<string[]>([]);

    const cargarMonitoreo = useCallback(async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (departamentosSeleccionados.length === 1) {
                params.set('IdDepartamento', departamentosSeleccionados[0]);
            }
            if (empresasSeleccionadas.length === 1) {
                params.set('IdEmpresa', empresasSeleccionadas[0]);
            }

            const qs = params.toString();
            const url = `/ReportesVacaciones/MonitoreoSaldos.php${qs ? `?${qs}` : ''}`;

            const respuesta = await apiService.get<RespuestaAPI>(url);

            if (!respuesta?.status || !respuesta?.data) {
                showToast({
                    text: respuesta?.message ?? 'No se pudo obtener el monitoreo',
                    type: 'error',
                    autoClose: 2500
                });
                setData(null);
                return;
            }

            setData(respuesta.data as unknown as MonitoreoResponse);
        } catch (error) {
            console.error(error);
            setData(null);
            showToast({
                text: 'Error al consultar el monitoreo',
                type: 'error',
                autoClose: 2000
            });
        } finally {
            setLoading(false);
        }
    }, [departamentosSeleccionados, empresasSeleccionadas]);

    useEffect(() => {
        cargarMonitoreo();
    }, [cargarMonitoreo]);

    const departamentosDisponibles = useMemo(() => {
        if (!data) return [];
        return Array.from(
            new Set(data.Detalle.map(d => d.Departamento).filter(Boolean))
        )
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map(d => ({ value: d, label: d }));
    }, [data]);

    const empresasDisponibles = useMemo(() => {
        if (!data) return [];
        return Array.from(
            new Set(data.Detalle.map(d => d.Empresa).filter(Boolean))
        )
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map(e => ({ value: e, label: e }));
    }, [data]);

    const detalleFiltrado = useMemo(() => {
        if (!data) return [];
        return data.Detalle.filter(d => {
            const okDepto =
                departamentosSeleccionados.length === 0 ||
                departamentosSeleccionados.includes(d.Departamento);
            const okEmpresa =
                empresasSeleccionadas.length === 0 ||
                empresasSeleccionadas.includes(d.Empresa);
            return okDepto && okEmpresa;
        });
    }, [data, departamentosSeleccionados, empresasSeleccionadas]);

    const resumenFiltrado = useMemo(() => {
        return detalleFiltrado.reduce(
            (acc, d) => ({
                empleados: acc.empleados.add(d.IdPersonal),
                otorgados: acc.otorgados + d.DiasOtorgados,
                tomados: acc.tomados + d.DiasTomados,
                vigentes: acc.vigentes + d.DiasVigentes,
                vencidos: acc.vencidos + d.DiasVencidos
            }),
            {
                empleados: new Set<number>(),
                otorgados: 0,
                tomados: 0,
                vigentes: 0,
                vencidos: 0
            }
        );
    }, [detalleFiltrado]);

    const porDepartamentoFiltrado = useMemo(() => {
        if (!data) return [];
        const grupos = new Map<string, MonitoreoPorDepartamento>();
        detalleFiltrado.forEach(d => {
            const actual = grupos.get(d.Departamento) ?? {
                Departamento: d.Departamento,
                TotalEmpleados: 0,
                TotalOtorgados: 0,
                TotalTomados: 0,
                TotalVigentes: 0,
                TotalVencidos: 0
            };
            actual.TotalOtorgados += d.DiasOtorgados;
            actual.TotalTomados += d.DiasTomados;
            actual.TotalVigentes += d.DiasVigentes;
            actual.TotalVencidos += d.DiasVencidos;
            grupos.set(d.Departamento, actual);
        });
        const empleadosPorDepto = new Map<string, Set<number>>();
        detalleFiltrado.forEach(d => {
            const set = empleadosPorDepto.get(d.Departamento) ?? new Set<number>();
            set.add(d.IdPersonal);
            empleadosPorDepto.set(d.Departamento, set);
        });
        return Array.from(grupos.values())
            .map(g => ({
                ...g,
                TotalEmpleados: empleadosPorDepto.get(g.Departamento)?.size ?? 0
            }))
            .sort((a, b) => a.Departamento.localeCompare(b.Departamento, 'es'));
    }, [data, detalleFiltrado]);

    const porEmpresaFiltrado = useMemo(() => {
        if (!data) return [];
        const grupos = new Map<string, MonitoreoPorEmpresa>();
        detalleFiltrado.forEach(d => {
            const actual = grupos.get(d.Empresa) ?? {
                Empresa: d.Empresa,
                TotalEmpleados: 0,
                TotalOtorgados: 0,
                TotalTomados: 0,
                TotalVigentes: 0,
                TotalVencidos: 0
            };
            actual.TotalOtorgados += d.DiasOtorgados;
            actual.TotalTomados += d.DiasTomados;
            actual.TotalVigentes += d.DiasVigentes;
            actual.TotalVencidos += d.DiasVencidos;
            grupos.set(d.Empresa, actual);
        });
        const empleadosPorEmpresa = new Map<string, Set<number>>();
        detalleFiltrado.forEach(d => {
            const set = empleadosPorEmpresa.get(d.Empresa) ?? new Set<number>();
            set.add(d.IdPersonal);
            empleadosPorEmpresa.set(d.Empresa, set);
        });
        return Array.from(grupos.values())
            .map(g => ({
                ...g,
                TotalEmpleados: empleadosPorEmpresa.get(g.Empresa)?.size ?? 0
            }))
            .sort((a, b) => a.Empresa.localeCompare(b.Empresa, 'es'));
    }, [data, detalleFiltrado]);

    const columnasEmpleado: Column[] = useMemo(
        () => [
            {
                key: 'NoEmpleado',
                title: 'No. Empleado',
                sortable: true,
                searchable: false,
                width: '110px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'NombreCompleto',
                title: 'Nombre Completo',
                sortable: true,
                searchable: false,
                width: '240px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'Departamento',
                title: 'Departamento',
                sortable: true,
                searchable: false,
                width: '170px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'Empresa',
                title: 'Empresa',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'Anio',
                title: 'Año',
                sortable: true,
                searchable: false,
                width: '90px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'DiasOtorgados',
                title: 'Días Otorgados',
                sortable: true,
                searchable: false,
                width: '130px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-otorgados">{value}</span>
                )
            },
            {
                key: 'DiasTomados',
                title: 'Días Tomados',
                sortable: true,
                searchable: false,
                width: '125px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-tomados">{value}</span>
                )
            },
            {
                key: 'DiasVigentes',
                title: 'Días Vigentes',
                sortable: true,
                searchable: false,
                width: '125px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vigentes">{value}</span>
                )
            },
            {
                key: 'DiasVencidos',
                title: 'Días Vencidos',
                sortable: true,
                searchable: false,
                width: '125px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vencidos">{value}</span>
                )
            }
        ],
        []
    );

    const columnasDepartamento: Column[] = useMemo(
        () => [
            {
                key: 'Departamento',
                title: 'Departamento',
                sortable: true,
                searchable: false,
                width: '220px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'TotalEmpleados',
                title: 'Empleados',
                sortable: true,
                searchable: false,
                width: '110px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'TotalOtorgados',
                title: 'Días Otorgados',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-otorgados">{value}</span>
                )
            },
            {
                key: 'TotalTomados',
                title: 'Días Tomados',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-tomados">{value}</span>
                )
            },
            {
                key: 'TotalVigentes',
                title: 'Días Vigentes',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vigentes">{value}</span>
                )
            },
            {
                key: 'TotalVencidos',
                title: 'Días Vencidos',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vencidos">{value}</span>
                )
            }
        ],
        []
    );

    const columnasEmpresa: Column[] = useMemo(
        () => [
            {
                key: 'Empresa',
                title: 'Empresa',
                sortable: true,
                searchable: false,
                width: '220px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'TotalEmpleados',
                title: 'Empleados',
                sortable: true,
                searchable: false,
                width: '110px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'TotalOtorgados',
                title: 'Días Otorgados',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-otorgados">{value}</span>
                )
            },
            {
                key: 'TotalTomados',
                title: 'Días Tomados',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-tomados">{value}</span>
                )
            },
            {
                key: 'TotalVigentes',
                title: 'Días Vigentes',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vigentes">{value}</span>
                )
            },
            {
                key: 'TotalVencidos',
                title: 'Días Vencidos',
                sortable: true,
                searchable: false,
                width: '140px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="monitoreo-dias-vencidos">{value}</span>
                )
            }
        ],
        []
    );

    return (
        <div className="monitoreo-container">
            <div className="monitoreo-header">
                <div>
                    <h1 className="monitoreo-title">
                        Monitoreo General de Saldos
                    </h1>
                </div>

                <div className="monitoreo-actions">
                    <button
                        type="button"
                        className="monitoreo-btn monitoreo-btn-actualizar"
                        onClick={cargarMonitoreo}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'monitoreo-spin' : ''}
                        />
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            <div className="monitoreo-filtros">
                <div className="monitoreo-filtro">
                    <label>Departamento</label>
                    <MultiSelect
                        options={departamentosDisponibles}
                        selected={departamentosSeleccionados}
                        onChange={setDepartamentosSeleccionados}
                    />
                </div>

                <div className="monitoreo-filtro">
                    <label>Empresa</label>
                    <MultiSelect
                        options={empresasDisponibles}
                        selected={empresasSeleccionadas}
                        onChange={setEmpresasSeleccionadas}
                    />
                </div>

                <div className="monitoreo-filtro">
                    <label>Ver por</label>
                    <div className="monitoreo-vista-botones">
                        <button
                            type="button"
                            className={
                                vista === 'empleado'
                                    ? 'monitoreo-vista-btn activo'
                                    : 'monitoreo-vista-btn'
                            }
                            onClick={() => setVista('empleado')}
                        >
                            <Users size={16} />
                            Empleado
                        </button>
                        <button
                            type="button"
                            className={
                                vista === 'departamento'
                                    ? 'monitoreo-vista-btn activo'
                                    : 'monitoreo-vista-btn'
                            }
                            onClick={() => setVista('departamento')}
                        >
                            <Briefcase size={16} />
                            Departamento
                        </button>
                        <button
                            type="button"
                            className={
                                vista === 'empresa'
                                    ? 'monitoreo-vista-btn activo'
                                    : 'monitoreo-vista-btn'
                            }
                            onClick={() => setVista('empresa')}
                        >
                            <Building2 size={16} />
                            Empresa
                        </button>
                    </div>
                </div>
            </div>

            <div className="monitoreo-resumen">
                <div className="monitoreo-resumen-card empleados">
                    <span>Empleados</span>
                    <strong>{resumenFiltrado.empleados.size}</strong>
                </div>
                <div className="monitoreo-resumen-card otorgados">
                    <span>Días Otorgados</span>
                    <strong>{resumenFiltrado.otorgados}</strong>
                </div>
                <div className="monitoreo-resumen-card tomados">
                    <span>Días Tomados</span>
                    <strong>{resumenFiltrado.tomados}</strong>
                </div>
                <div className="monitoreo-resumen-card vigentes">
                    <span>Días Vigentes</span>
                    <strong>{resumenFiltrado.vigentes}</strong>
                </div>
                <div className="monitoreo-resumen-card vencidos">
                    <span>Días Vencidos</span>
                    <strong>{resumenFiltrado.vencidos}</strong>
                </div>
            </div>

            <div className="monitoreo-tabla">
                {vista === 'empleado' && (
                    <Tabla
                        columns={columnasEmpleado}
                        data={detalleFiltrado}
                        pageSize={10}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        emptyMessage="No se encontraron saldos"
                        className="full-height-table"
                        loading={loading}
                    />
                )}
                {vista === 'departamento' && (
                    <Tabla
                        columns={columnasDepartamento}
                        data={porDepartamentoFiltrado}
                        pageSize={10}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        emptyMessage="No se encontraron saldos"
                        className="full-height-table"
                        loading={loading}
                    />
                )}
                {vista === 'empresa' && (
                    <Tabla
                        columns={columnasEmpresa}
                        data={porEmpresaFiltrado}
                        pageSize={10}
                        pageSizeOptions={[5, 10, 25, 50, 100]}
                        emptyMessage="No se encontraron saldos"
                        className="full-height-table"
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
};