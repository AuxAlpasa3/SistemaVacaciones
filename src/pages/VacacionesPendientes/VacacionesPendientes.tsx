import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';
import { FileDown, RefreshCw } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { MultiSelect } from '../../components/MultiSelect/MultiSelect';
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import {
    formatReportDate,
    getReportMonth,
    getReportYear
} from '../../helpers/reportDate';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { ReporteVacacionesPendientes } from '../../interfaces/VacacionesPendientes';
import './VacacionesPendientes.css';

const meses = [
    { id: 1, nombre: 'ENERO' },
    { id: 2, nombre: 'FEBRERO' },
    { id: 3, nombre: 'MARZO' },
    { id: 4, nombre: 'ABRIL' },
    { id: 5, nombre: 'MAYO' },
    { id: 6, nombre: 'JUNIO' },
    { id: 7, nombre: 'JULIO' },
    { id: 8, nombre: 'AGOSTO' },
    { id: 9, nombre: 'SEPTIEMBRE' },
    { id: 10, nombre: 'OCTUBRE' },
    { id: 11, nombre: 'NOVIEMBRE' },
    { id: 12, nombre: 'DICIEMBRE' }
];

const escaparCSV = (valor: unknown): string => {
    if (valor === null || valor === undefined) return '';
    const texto = String(valor).replace(/"/g, '""');
    return `"${texto}"`;
};

const obtenerClaseEstado = (estado: string): string => {
    switch (estado.trim().toUpperCase()) {
        case 'ANTICIPADO':
            return 'anticipado';
        case 'PERIODO ACTUAL':
            return 'actual';
        case 'REDUCIDO 50%':
            return 'reducido';
        default:
            return 'otro';
    }
};

/**
 * Devuelve el mismo array si no hubo cambios, para evitar
 * re-renders innecesarios y bucles infinitos en useEffect.
 */
const sincronizarSeleccion = <T,>(
    actual: T[],
    disponibles: Set<T>
): T[] => {
    const filtrado = actual.filter(item => disponibles.has(item));
    return filtrado.length === actual.length ? actual : filtrado;
};

export const VacacionesPendientes: React.FC = () => {

    const [datos, setDatos] = useState<ReporteVacacionesPendientes[]>([]);
    const [loading, setLoading] = useState(false);

    const [
        departamentosSeleccionados,
        setDepartamentosSeleccionados
    ] = useState<string[]>([]);

    const [empleado, setEmpleado] = useState('');
    const [periodosSeleccionados, setPeriodosSeleccionados] = useState<number[]>([]);
    const [mesesSeleccionados, setMesesSeleccionados] = useState<number[]>([]);
    const [estadosSeleccionados, setEstadosSeleccionados] = useState<string[]>([]);
    const [soloPendientes, setSoloPendientes] = useState(true);

    const cargarReporte = useCallback(async () => {
        try {
            setLoading(true);

            const respuesta = await apiService.get<RespuestaAPI>(
                '/ReportesVacaciones/ReporteVacacionesPendientes.php'
            );

            if (
                !respuesta?.status ||
                !respuesta?.data ||
                !Array.isArray(respuesta.data)
            ) {
                setDatos([]);
                showToast({
                    text: 'No se pudo obtener el reporte de vacaciones',
                    type: 'error',
                    autoClose: 2000
                });
                return;
            }

            const reporte = respuesta.data
                .map((item: any): ReporteVacacionesPendientes => ({
                    IdPersonal: Number(item.IdPersonal ?? 0),
                    NoEmpleado: item.NoEmpleado ?? '',
                    NombreCompleto: item.NombreCompleto ?? '',
                    IdDepartamento:
                        item.IdDepartamento !== null &&
                        item.IdDepartamento !== undefined &&
                        item.IdDepartamento !== ''
                            ? Number(item.IdDepartamento)
                            : null,
                    Departamento: item.Departamento?.trim()
                        ? item.Departamento.trim()
                        : 'SIN DEPARTAMENTO',
                    FechaIngreso: item.FechaIngreso ?? '',
                    FechaAniversario: item.FechaAniversario ?? '',
                    Periodo: Number(item.Periodo ?? 0),
                    Antiguedad: Number(item.Antiguedad ?? 0),
                    FechaInicioPeriodo: item.FechaInicioPeriodo ?? '',
                    FechaFinPeriodo: item.FechaFinPeriodo ?? '',
                    PuedeUtilizarDesde: item.PuedeUtilizarDesde ?? '',
                    DiasAsignados: Number(item.DiasAsignados ?? 0),
                    DiasTomados: Number(item.DiasTomados ?? 0),
                    DiasRestantes: Number(item.DiasRestantes ?? 0),
                    DiasPendientes: Number(item.DiasPendientes ?? 0),
                    DiasVencidos: Number(item.DiasVencidos ?? 0),
                    EstadoPeriodo: item.EstadoPeriodo?.trim() ?? ''
                }))
                .filter(
                    item => item.EstadoPeriodo.toUpperCase() !== 'VENCIDO'
                )
                .sort((a, b) => {
                    const anioA = getReportYear(a.FechaAniversario) ?? 0;
                    const anioB = getReportYear(b.FechaAniversario) ?? 0;
                    if (anioB !== anioA) return anioB - anioA;
                    return a.NombreCompleto.localeCompare(b.NombreCompleto, 'es');
                });

            setDatos(reporte);
        } catch (error) {
            console.error(error);
            setDatos([]);
            showToast({
                text: 'Error al cargar vacaciones pendientes',
                type: 'error',
                autoClose: 2000
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarReporte();
    }, [cargarReporte]);

    const aplicarFiltros = useCallback(
        (
            lista: ReporteVacacionesPendientes[],
            excluir?: 'departamento' | 'periodo' | 'mes' | 'estado'
        ) => {
            let resultado = lista.filter(
                item => item.EstadoPeriodo.trim().toUpperCase() !== 'VENCIDO'
            );

            if (soloPendientes) {
                resultado = resultado.filter(
                    item => Number(item.DiasPendientes) > 0
                );
            }

            if (empleado.trim()) {
                const buscar = empleado.trim().toLowerCase();
                resultado = resultado.filter(
                    item =>
                        String(item.NoEmpleado).toLowerCase().includes(buscar) ||
                        item.NombreCompleto.toLowerCase().includes(buscar)
                );
            }

            if (
                excluir !== 'departamento' &&
                departamentosSeleccionados.length > 0
            ) {
                resultado = resultado.filter(item =>
                    departamentosSeleccionados.includes(item.Departamento)
                );
            }

            if (excluir !== 'periodo' && periodosSeleccionados.length > 0) {
                resultado = resultado.filter(item => {
                    const anio = getReportYear(item.FechaAniversario);
                    return (
                        anio !== null &&
                        periodosSeleccionados.includes(anio)
                    );
                });
            }

            if (excluir !== 'mes' && mesesSeleccionados.length > 0) {
                resultado = resultado.filter(item => {
                    const mes = getReportMonth(item.FechaAniversario);
                    return (
                        mes !== null &&
                        mesesSeleccionados.includes(mes)
                    );
                });
            }

            if (excluir !== 'estado' && estadosSeleccionados.length > 0) {
                resultado = resultado.filter(item =>
                    estadosSeleccionados.includes(item.EstadoPeriodo)
                );
            }

            return resultado;
        },
        [
            departamentosSeleccionados,
            empleado,
            estadosSeleccionados,
            mesesSeleccionados,
            periodosSeleccionados,
            soloPendientes
        ]
    );

    const departamentos = useMemo(() => {
        const lista = aplicarFiltros(datos, 'departamento')
            .map(item => item.Departamento.trim())
            .filter(
                item => Boolean(item) && item !== 'SIN DEPARTAMENTO'
            );

        return Array.from(new Set(lista))
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map(item => ({ value: item, label: item }));
    }, [aplicarFiltros, datos]);

    const periodos = useMemo(() => {
        const lista = aplicarFiltros(datos, 'periodo')
            .map(item => getReportYear(item.FechaAniversario))
            .filter(
                (item): item is number =>
                    item !== null && Number.isFinite(item) && item > 0
            );

        return Array.from(new Set(lista))
            .sort((a, b) => b - a)
            .map(item => ({ value: item, label: String(item) }));
    }, [aplicarFiltros, datos]);

    const mesesDisponibles = useMemo(() => {
        const disponibles = new Set(
            aplicarFiltros(datos, 'mes')
                .map(item => getReportMonth(item.FechaAniversario))
                .filter(
                    (item): item is number =>
                        item !== null && item >= 1 && item <= 12
                )
        );

        return meses
            .filter(item => disponibles.has(item.id))
            .map(item => ({ value: item.id, label: item.nombre }));
    }, [aplicarFiltros, datos]);

    const estados = useMemo(() => {
        const lista = aplicarFiltros(datos, 'estado')
            .map(item => item.EstadoPeriodo.trim())
            .filter(
                item =>
                    Boolean(item) && item.toUpperCase() !== 'VENCIDO'
            );

        return Array.from(new Set(lista))
            .sort((a, b) => a.localeCompare(b, 'es'))
            .map(item => ({ value: item, label: item }));
    }, [aplicarFiltros, datos]);

    useEffect(() => {
        const disponibles = new Set(periodos.map(item => item.value));
        setPeriodosSeleccionados(actual =>
            sincronizarSeleccion(actual, disponibles)
        );
    }, [periodos]);

    useEffect(() => {
        const disponibles = new Set(mesesDisponibles.map(item => item.value));
        setMesesSeleccionados(actual =>
            sincronizarSeleccion(actual, disponibles)
        );
    }, [mesesDisponibles]);

    useEffect(() => {
        const disponibles = new Set(departamentos.map(item => item.value));
        setDepartamentosSeleccionados(actual =>
            sincronizarSeleccion(actual, disponibles)
        );
    }, [departamentos]);

    useEffect(() => {
        const disponibles = new Set(estados.map(item => item.value));
        setEstadosSeleccionados(actual =>
            sincronizarSeleccion(actual, disponibles)
        );
    }, [estados]);

    const datosFiltrados = useMemo(
        () => aplicarFiltros(datos),
        [aplicarFiltros, datos]
    );

    const resumen = useMemo(() => {
        const empleados = new Set(
            datosFiltrados.map(item => item.IdPersonal)
        ).size;

        const diasAsignados = datosFiltrados.reduce(
            (total, item) => total + Number(item.DiasAsignados),
            0
        );

        const diasTomados = datosFiltrados.reduce(
            (total, item) => total + Number(item.DiasTomados),
            0
        );

        const diasPendientes = datosFiltrados.reduce(
            (total, item) => total + Number(item.DiasPendientes),
            0
        );

        return { empleados, diasAsignados, diasTomados, diasPendientes };
    }, [datosFiltrados]);

    const columnas: Column[] = useMemo(
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
                width: '180px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'FechaIngreso',
                title: 'Fecha de Ingreso',
                sortable: true,
                searchable: false,
                width: '145px',
                align: 'center',
                headerAlign: 'center',
                render: value => formatReportDate(value)
            },
            {
                key: 'FechaAniversario',
                title: 'Fecha de Aniversario',
                sortable: true,
                searchable: false,
                width: '165px',
                align: 'center',
                headerAlign: 'center',
                render: value => formatReportDate(value)
            },
            {
                key: 'Periodo',
                title: 'Periodo',
                sortable: true,
                searchable: false,
                width: '90px',
                align: 'center',
                headerAlign: 'center'
            },
            {
                key: 'Antiguedad',
                title: 'Antigüedad',
                sortable: true,
                searchable: false,
                width: '110px',
                align: 'center',
                headerAlign: 'center',
                render: value => {
                    const numero = Number(value);
                    return (
                        <span>
                            {numero} {numero === 1 ? 'año' : 'años'}
                        </span>
                    );
                }
            },
            {
                key: 'DiasAsignados',
                title: 'Días Asignados',
                sortable: true,
                searchable: false,
                width: '130px',
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
                width: '125px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="vacaciones-dias-tomados">{value}</span>
                )
            },
            {
                key: 'DiasPendientes',
                title: 'Días Pendientes',
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
            },
            {
                key: 'EstadoPeriodo',
                title: 'Estado',
                sortable: true,
                searchable: false,
                width: '150px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span
                        className={`vacaciones-estado ${obtenerClaseEstado(
                            String(value)
                        )}`}
                    >
                        {value}
                    </span>
                )
            }
        ],
        []
    );

    const limpiarFiltros = () => {
        setDepartamentosSeleccionados([]);
        setEmpleado('');
        setPeriodosSeleccionados([]);
        setMesesSeleccionados([]);
        setEstadosSeleccionados([]);
        setSoloPendientes(true);
    };

    const exportarCSV = () => {
        if (datosFiltrados.length === 0) {
            showToast({
                text: 'No hay datos para exportar',
                type: 'warning',
                autoClose: 2000
            });
            return;
        }

        const encabezados = [
            'No. Empleado',
            'Nombre Completo',
            'Departamento',
            'Fecha de Ingreso',
            'Fecha de Aniversario',
            'Periodo',
            'Antigüedad',
            'Días Asignados',
            'Días Tomados',
            'Días Pendientes',
            'Estado'
        ];

        const filas = datosFiltrados.map(item =>
            [
                escaparCSV(item.NoEmpleado),
                escaparCSV(item.NombreCompleto),
                escaparCSV(item.Departamento),
                escaparCSV(formatReportDate(item.FechaIngreso)),
                escaparCSV(formatReportDate(item.FechaAniversario)),
                escaparCSV(item.Periodo),
                escaparCSV(item.Antiguedad),
                escaparCSV(item.DiasAsignados),
                escaparCSV(item.DiasTomados),
                escaparCSV(item.DiasPendientes),
                escaparCSV(item.EstadoPeriodo)
            ].join(',')
        );

        const contenido = [
            encabezados.map(escaparCSV).join(','),
            ...filas
        ].join('\n');

        const blob = new Blob(['\uFEFF' + contenido], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = 'Reporte_Vacaciones_Pendientes.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="vacaciones-container">
            <div className="vacaciones-header">
                <div>
                    <h1 className="vacaciones-title">
                        Vacaciones Pendientes por Tomar
                    </h1>
                </div>

                <div className="vacaciones-actions">
                    <button
                        type="button"
                        className="vacaciones-btn vacaciones-btn-excel"
                        onClick={exportarCSV}
                        disabled={datosFiltrados.length === 0}
                    >
                        <FileDown size={18} />
                        Excel
                    </button>

                    <button
                        type="button"
                        className="vacaciones-btn vacaciones-btn-actualizar"
                        onClick={cargarReporte}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'vacaciones-spin' : ''}
                        />
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            <div className="vacaciones-filtros">
                <div className="vacaciones-filtro">
                    <label>Departamento</label>
                    <MultiSelect
                        options={departamentos}
                        selected={departamentosSeleccionados}
                        onChange={setDepartamentosSeleccionados}
                    />
                </div>

                <div className="vacaciones-filtro">
                    <label>Empleado</label>
                    <input
                        type="text"
                        value={empleado}
                        onChange={e => setEmpleado(e.target.value)}
                        placeholder="No. empleado o nombre"
                    />
                </div>

                <div className="vacaciones-filtro">
                    <label>Periodo</label>
                    <MultiSelect
                        options={periodos}
                        selected={periodosSeleccionados}
                        onChange={setPeriodosSeleccionados}
                    />
                </div>

                <div className="vacaciones-filtro">
                    <label>Mes</label>
                    <MultiSelect
                        options={mesesDisponibles}
                        selected={mesesSeleccionados}
                        onChange={setMesesSeleccionados}
                    />
                </div>

                <div className="vacaciones-filtro">
                    <label>Estado</label>
                    <MultiSelect
                        options={estados}
                        selected={estadosSeleccionados}
                        onChange={setEstadosSeleccionados}
                    />
                </div>

                <div className="vacaciones-filtro">
                    <label>Mostrar</label>
                    <select
                        value={soloPendientes ? '1' : '0'}
                        onChange={e => {
                            setSoloPendientes(e.target.value === '1');
                            setPeriodosSeleccionados([]);
                            setMesesSeleccionados([]);
                            setEstadosSeleccionados([]);
                        }}
                    >
                        <option value="1">SOLO CON PENDIENTES</option>
                        <option value="0">TODOS LOS PERIODOS</option>
                    </select>
                </div>

                <button
                    type="button"
                    className="vacaciones-limpiar"
                    onClick={limpiarFiltros}
                >
                    Limpiar filtros
                </button>
            </div>

            <div className="vacaciones-resumen">
                <div className="vacaciones-resumen-card empleados">
                    <span>Empleados</span>
                    <strong>{resumen.empleados}</strong>
                </div>

                <div className="vacaciones-resumen-card asignados">
                    <span>Días Asignados</span>
                    <strong>{resumen.diasAsignados}</strong>
                </div>

                <div className="vacaciones-resumen-card tomados">
                    <span>Días Tomados</span>
                    <strong>{resumen.diasTomados}</strong>
                </div>

                <div className="vacaciones-resumen-card pendientes">
                    <span>Días Pendientes</span>
                    <strong>{resumen.diasPendientes}</strong>
                </div>
            </div>

            <div className="vacaciones-tabla">
                <Tabla
                    columns={columnas}
                    data={datosFiltrados}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50, 100]}
                    emptyMessage="No se encontraron vacaciones pendientes"
                    className="full-height-table"
                    loading={loading}
                />
            </div>
        </div>
    );
};