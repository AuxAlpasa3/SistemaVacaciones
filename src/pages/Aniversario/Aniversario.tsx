import React, {
    useCallback,
    useEffect,
    useMemo,
    useState
} from 'react';

import { CalendarDays, RefreshCw, FileDown } from 'lucide-react';

import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Aniversario as AniversarioData } from '../../interfaces/Aniversario';

import './Aniversario.css';

const meses = [
    { id: 0, nombre: 'TODOS' },
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

const obtenerFecha = (fecha: string): Date | null => {
    if (!fecha) return null;

    const fechaLimpia = fecha.substring(0, 10);
    const partes = fechaLimpia.split('-');

    if (partes.length !== 3) return null;

    const anio = Number(partes[0]);
    const mes = Number(partes[1]);
    const dia = Number(partes[2]);

    const resultado = new Date(anio, mes - 1, dia);

    if (isNaN(resultado.getTime())) return null;

    return resultado;
};

const formatoFecha = (fecha: string | null | undefined): string => {
    if (!fecha) return 'N/A';

    const date = obtenerFecha(fecha);
    if (!date) return 'N/A';

    return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

export const Aniversario: React.FC = () => {

    const anioActual = new Date().getFullYear();

    const [anio, setAnio] = useState<number>(anioActual);
    const [mes, setMes] = useState<number>(0);
    const [noEmpleado, setNoEmpleado] = useState('');
    const [nombre, setNombre] = useState('');

    const [datos, setDatos] = useState<AniversarioData[]>([]);
    const [loading, setLoading] = useState(false);

    const cargarReporte = useCallback(async () => {
        try {
            setLoading(true);

            const respuesta = await apiService.get<RespuestaAPI>(
                '/ReportesVacaciones/ReporteAniversarios.php'
            );

            if (
                !respuesta?.status ||
                !respuesta?.data ||
                !Array.isArray(respuesta.data)
            ) {
                setDatos([]);
                showToast({
                    text: 'No se pudo obtener el reporte de aniversarios',
                    type: 'error',
                    autoClose: 2000
                });
                return;
            }

            const reporte = (respuesta.data as any[])
                .map((item): AniversarioData => ({
                    IdPersonal: Number(item.IdPersonal ?? 0),
                    NoEmpleado: item.NoEmpleado ?? '',
                    NombreCompleto: item.NombreCompleto ?? '',
                    FechaIngreso: item.FechaIngreso ?? '',
                    FechaAniversario: item.FechaAniversario ?? '',
                    InicioNuevoPeriodo: item.InicioNuevoPeriodo ?? '',
                    DiasCorresponden: Number(item.DiasCorresponden ?? 0),
                    PuedeUtilizarDesde: item.PuedeUtilizarDesde ?? '',
                    FechaVencimiento: item.FechaVencimiento ?? '',
                    Antiguedad: Number(item.Antiguedad ?? 0)
                }))
                .sort(
                    (a, b) =>
                        new Date(a.FechaAniversario).getTime() -
                        new Date(b.FechaAniversario).getTime()
                );

            setDatos(reporte);

        } catch (error) {
            console.error(error);
            setDatos([]);
            showToast({
                text: 'Error al cargar el reporte de aniversarios',
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

    const aniosDisponibles = useMemo(() => {
        const setAnios = new Set<number>();

        for (const item of datos) {
            const fecha = obtenerFecha(item.FechaAniversario);
            if (fecha) {
                const anioItem = fecha.getFullYear();
                if (anioItem >= anioActual) {
                    setAnios.add(anioItem);
                }
            }
        }

        if (setAnios.size === 0) {
            return [anioActual];
        }

        return Array.from(setAnios).sort((a, b) => a - b);
    }, [datos, anioActual]);

    useEffect(() => {
        if (!aniosDisponibles.includes(anio)) {
            setAnio(aniosDisponibles[0]);
            return;
        }

        if (anio < anioActual) {
            setAnio(aniosDisponibles[0]);
        }
    }, [aniosDisponibles, anio, anioActual]);

    const datosFiltrados = useMemo(() => {
        let resultado = [...datos];

        resultado = resultado.filter(item => {
            const fecha = obtenerFecha(item.FechaAniversario);
            return fecha && fecha.getFullYear() === anio;
        });

        if (mes !== 0) {
            resultado = resultado.filter(item => {
                const fecha = obtenerFecha(item.FechaAniversario);
                return fecha && fecha.getMonth() + 1 === mes;
            });
        }

        if (noEmpleado.trim()) {
            resultado = resultado.filter(item =>
                item.NoEmpleado
                    .toString()
                    .toLowerCase()
                    .includes(noEmpleado.trim().toLowerCase())
            );
        }

        if (nombre.trim()) {
            resultado = resultado.filter(item =>
                item.NombreCompleto
                    .toLowerCase()
                    .includes(nombre.trim().toLowerCase())
            );
        }

        return resultado;
    }, [datos, anio, mes, noEmpleado, nombre]);

    const columnas: Column[] = useMemo(
        () => [
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
                title: 'Nombre Completo',
                sortable: true,
                searchable: false,
                width: '250px',
                align: 'left',
                headerAlign: 'center'
            },
            {
                key: 'FechaIngreso',
                title: 'Fecha de Ingreso',
                sortable: true,
                searchable: false,
                width: '150px',
                align: 'center',
                headerAlign: 'center',
                render: value => formatoFecha(value)
            },
            {
                key: 'FechaAniversario',
                title: 'Fecha de Aniversario',
                sortable: true,
                searchable: false,
                width: '160px',
                align: 'center',
                headerAlign: 'center',
                render: value => formatoFecha(value)
            },
            {
                key: 'InicioNuevoPeriodo',
                title: 'Inicio del Nuevo Periodo',
                sortable: true,
                searchable: false,
                width: '180px',
                align: 'center',
                headerAlign: 'center',
                render: value => formatoFecha(value)
            },
            {
                key: 'Antiguedad',
                title: 'Antigüedad',
                sortable: true,
                searchable: false,
                width: '110px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span>
                        {value} {value === 1 ? 'año' : 'años'}
                    </span>
                )
            },
            {
                key: 'DiasCorresponden',
                title: 'Días que Corresponden',
                sortable: true,
                searchable: false,
                width: '160px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="aniversario-dias">{value}</span>
                )
            },
            {
                key: 'PuedeUtilizarDesde',
                title: 'Puede Utilizar Desde',
                sortable: true,
                searchable: false,
                width: '180px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="aniversario-disponible">
                        {formatoFecha(value)}
                    </span>
                )
            },
            {
                key: 'FechaVencimiento',
                title: 'Vence',
                sortable: true,
                searchable: false,
                width: '160px',
                align: 'center',
                headerAlign: 'center',
                render: value => (
                    <span className="aniversario-vencimiento">
                        {formatoFecha(value)}
                    </span>
                )
            }
        ],
        []
    );

    const limpiarFiltros = () => {
        setAnio(aniosDisponibles[0] ?? anioActual);
        setMes(0);
        setNoEmpleado('');
        setNombre('');
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
            'Fecha de Ingreso',
            'Fecha de Aniversario',
            'Inicio del Nuevo Periodo',
            'Antigüedad',
            'Días que Corresponden',
            'Puede Utilizar Desde',
            'Vence'
        ];

        const filas = datosFiltrados.map(item =>
            [
                item.NoEmpleado,
                `"${item.NombreCompleto}"`,
                formatoFecha(item.FechaIngreso),
                formatoFecha(item.FechaAniversario),
                formatoFecha(item.InicioNuevoPeriodo),
                item.Antiguedad,
                item.DiasCorresponden,
                formatoFecha(item.PuedeUtilizarDesde),
                formatoFecha(item.FechaVencimiento)
            ].join(',')
        );

        const contenido = [encabezados.join(','), ...filas].join('\n');

        const blob = new Blob(['\uFEFF' + contenido], {
            type: 'text/csv;charset=utf-8;'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `Reporte_Aniversarios_${anio}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="aniversarios-container">

            <div className="aniversarios-header">
                <div>
                    <h1 className="aniversarios-title"> 
                        Reporte de Aniversarios
                    </h1> 
                </div>

                <div className="aniversarios-actions">
                    <button
                        type="button"
                        className="aniversarios-btn aniversarios-btn-excel"
                        onClick={exportarCSV}
                        disabled={datosFiltrados.length === 0}
                    >
                        <FileDown size={18} />
                        Excel
                    </button>

                    <button
                        type="button"
                        className="aniversarios-btn aniversarios-btn-refresh"
                        onClick={cargarReporte}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={18}
                            className={loading ? 'aniversarios-spin' : ''}
                        />
                        {loading ? 'Cargando...' : 'Actualizar'}
                    </button>
                </div>
            </div>

            <div className="aniversarios-filtros">

                <div className="aniversarios-filtro">
                    <label>Año de aniversario</label>
                    <select
                        value={anio}
                        onChange={e => setAnio(Number(e.target.value))}
                        disabled={aniosDisponibles.length <= 1}
                    >
                        {aniosDisponibles.map(item => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="aniversarios-filtro">
                    <label>Mes</label>
                    <select
                        value={mes}
                        onChange={e => setMes(Number(e.target.value))}
                    >
                        {meses.map(item => (
                            <option key={item.id} value={item.id}>
                                {item.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="aniversarios-filtro">
                    <label>No. Empleado</label>
                    <input
                        type="text"
                        value={noEmpleado}
                        onChange={e => setNoEmpleado(e.target.value)}
                        placeholder="Buscar..."
                    />
                </div>

                <div className="aniversarios-filtro aniversarios-filtro-nombre">
                    <label>Nombre</label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        placeholder="Buscar por nombre..."
                    />
                </div>

                <button
                    type="button"
                    className="aniversarios-limpiar"
                    onClick={limpiarFiltros}
                >
                    Limpiar filtros
                </button>
            </div>

            <div className="aniversarios-resumen">
                <div className="aniversarios-resumen-card">
                    <span>Empleados</span>
                    <strong>{datosFiltrados.length}</strong>
                </div>

                <div className="aniversarios-resumen-card">
                    <span>Año</span>
                    <strong>{anio}</strong>
                </div>

                <div className="aniversarios-resumen-card">
                    <span>Mes</span>
                    <strong>
                        {meses.find(item => item.id === mes)?.nombre}
                    </strong>
                </div>
            </div>

            <div className="aniversarios-tabla">
                <Tabla
                    columns={columnas}
                    data={datosFiltrados}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50, 100]}
                    emptyMessage="No se encontraron aniversarios"
                    className="full-height-table"
                    loading={loading}
                />
            </div>
        </div>
    );
};