import React, {
    useEffect,
    useState,
    useMemo,
    useCallback
} from 'react';

import {
    Plus,
    X,
    FileText,
    Edit,
    Trash2,
    Eye,
    MoreVertical,
    Filter
} from 'lucide-react';

import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';

import './DiasFestivos.css';

import type { InterfaceDiasFestivos } from '../../interfaces/DiasFestivos';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { CatalogoUsuario } from '../../interfaces/Usuario';

import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';

import { apiService } from '../../api/apiService';

const MESES = [
    { valor: '01', nombre: 'Enero' },
    { valor: '02', nombre: 'Febrero' },
    { valor: '03', nombre: 'Marzo' },
    { valor: '04', nombre: 'Abril' },
    { valor: '05', nombre: 'Mayo' },
    { valor: '06', nombre: 'Junio' },
    { valor: '07', nombre: 'Julio' },
    { valor: '08', nombre: 'Agosto' },
    { valor: '09', nombre: 'Septiembre' },
    { valor: '10', nombre: 'Octubre' },
    { valor: '11', nombre: 'Noviembre' },
    { valor: '12', nombre: 'Diciembre' }
];

const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onView,
    onEdit,
    onDelete
}: {
    row: InterfaceDiasFestivos;
    openActionDropdown: string | null;
    setOpenActionDropdown: (id: string | null) => void;
    onView: (row: InterfaceDiasFestivos) => void;
    onEdit: (row: InterfaceDiasFestivos) => void;
    onDelete: (row: InterfaceDiasFestivos) => void;
}) => {

    const id = String(row.IdDiaFestivo);

    return (
        <div className="actions-dropdown-container">

            <button
                type="button"
                className="actions-dropdown-trigger"
                onClick={() =>
                    setOpenActionDropdown(
                        openActionDropdown === id ? null : id
                    )
                }
            >
                <MoreVertical size={16} />
            </button>

            {openActionDropdown === id && (
                <div className="actions-dropdown-menu">

                    <button
                        type="button"
                        className="actions-dropdown-item view-action"
                        onClick={() => {
                            onView(row);
                            setOpenActionDropdown(null);
                        }}
                    >
                        <Eye size={14} />
                        <span>Ver</span>
                    </button>

                    <div className="actions-dropdown-divider" />

                    <button
                        type="button"
                        className="actions-dropdown-item edit-action"
                        onClick={() => {
                            onEdit(row);
                            setOpenActionDropdown(null);
                        }}
                    >
                        <Edit size={14} />
                        <span>Editar</span>
                    </button>

                    <div className="actions-dropdown-divider" />

                    <button
                        type="button"
                        className="actions-dropdown-item delete-action"
                        onClick={() => {
                            onDelete(row);
                            setOpenActionDropdown(null);
                        }}
                    >
                        <Trash2 size={14} />
                        <span>Eliminar</span>
                    </button>

                </div>
            )}

        </div>
    );
});

export const DiasFestivos: React.FC = () => {

    const anioActual = new Date().getFullYear().toString();

    const [DiasFestivosForm, setDiasFestivosForm] =
        useState<InterfaceDiasFestivos>({
            IdDiaFestivo: '',
            Anio: Number(anioActual),
            Fecha: '',
            Nombre: '',
            Tipo: 'OFICIAL',
            Descripcion: '',
            FechaRegistro: '',
            UsuarioRegistro: ''
        });

    const [usuarioSesion, setUsuarioSesion] =
        useState<CatalogoUsuario | null>(null);

    const [DiasFestivos, setDiasFestivos] =
        useState<InterfaceDiasFestivos[]>([]);

    const [loading, setLoading] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const [showForm, setShowForm] = useState(false);

    const [TipoFormulario, setTipoFormulario] =
        useState<'Agregar' | 'Modificar' | 'Ver'>('Agregar');

    const [openActionDropdown, setOpenActionDropdown] =
        useState<string | null>(null);

    const [anioFiltro, setAnioFiltro] =
        useState<string>(anioActual);

    const [mesFiltro, setMesFiltro] =
        useState<string>('');

    const aniosDisponibles = useMemo(() => {

        const anios = DiasFestivos
            .map(item => {

                if (item.Anio) {
                    return Number(item.Anio);
                }

                if (item.Fecha) {
                    return Number(
                        String(item.Fecha).substring(0, 4)
                    );
                }

                return 0;
            })
            .filter(anio => anio > 0);

        anios.push(Number(anioActual));

        return Array
            .from(new Set(anios))
            .sort((a, b) => b - a);

    }, [DiasFestivos, anioActual]);

    const DiasFestivosFiltrados = useMemo(() => {

        return DiasFestivos.filter(item => {

            const fecha =
                String(item.Fecha ?? '').substring(0, 10);

            const anioRegistro =
                Number(item.Anio) ||
                Number(fecha.substring(0, 4));

            const mesRegistro =
                fecha.length >= 7
                    ? fecha.substring(5, 7)
                    : '';

            if (
                anioFiltro &&
                anioRegistro !== Number(anioFiltro)
            ) {
                return false;
            }

            if (
                mesFiltro &&
                mesRegistro !== mesFiltro
            ) {
                return false;
            }

            return true;
        });

    }, [
        DiasFestivos,
        anioFiltro,
        mesFiltro
    ]);

    const nombreMesSeleccionado = useMemo(() => {

        if (!mesFiltro) {
            return '';
        }

        return (
            MESES.find(
                mes => mes.valor === mesFiltro
            )?.nombre || ''
        );

    }, [mesFiltro]);

    const formatearFecha = (
        fecha: string | undefined | null
    ) => {

        if (!fecha) {
            return '';
        }

        const fechaLimpia =
            String(fecha).substring(0, 10);

        const partes =
            fechaLimpia.split('-');

        if (partes.length !== 3) {
            return fechaLimpia;
        }

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    };

    const handleInputChange = useCallback((
        e:
            React.ChangeEvent<HTMLInputElement> |
            React.ChangeEvent<HTMLSelectElement> |
            React.ChangeEvent<HTMLTextAreaElement>
    ) => {

        const { name, value } = e.target;

        setDiasFestivosForm(prev => {

            if (name === 'Fecha') {

                const anio =
                    value
                        ? Number(value.substring(0, 4))
                        : 0;

                return {
                    ...prev,
                    Fecha: value,
                    Anio: anio
                };
            }

            return {
                ...prev,
                [name]: value
            };
        });

    }, []);

    const fetchDiasFestivos =
        useCallback(async () => {

            try {

                setLoading(true);

                const response =
                    await apiService.get<RespuestaAPI>(
                        '/DiasFestivos/ObtenerListado.php'
                    );

                if (
                    response.status &&
                    response.data
                ) {

                    setDiasFestivos(
                        response.data as InterfaceDiasFestivos[]
                    );

                } else {

                    setDiasFestivos([]);
                }

            } catch (error) {

                console.error(error);

                setDiasFestivos([]);

                showToast({
                    text: 'Error al cargar los días festivos',
                    type: 'error',
                    autoClose: 1500
                });

            } finally {

                setLoading(false);
            }

        }, []);

    const resetForm =
        useCallback(() => {

            setDiasFestivosForm({
                IdDiaFestivo: '',
                Anio: Number(anioActual),
                Fecha: '',
                Nombre: '',
                Tipo: 'OFICIAL',
                Descripcion: '',
                FechaRegistro: '',
                UsuarioRegistro: ''
            });

            setTipoFormulario('Agregar');

        }, [anioActual]);

    const handleShowForm =
        useCallback(() => {

            resetForm();
            setTipoFormulario('Agregar');
            setShowForm(true);

        }, [resetForm]);

    const handleSubmit =
        useCallback(async (
            e: React.FormEvent
        ) => {

            e.preventDefault();

            if (TipoFormulario === 'Ver') {
                return;
            }

            if (!DiasFestivosForm.Fecha) {

                showToast({
                    text: 'Debe seleccionar una fecha',
                    type: 'error',
                    autoClose: 1500
                });

                return;
            }

            if (!DiasFestivosForm.Nombre?.trim()) {

                showToast({
                    text: 'Debe ingresar el nombre del día festivo',
                    type: 'error',
                    autoClose: 1500
                });

                return;
            }

            if (!DiasFestivosForm.Tipo) {

                showToast({
                    text: 'Debe seleccionar el tipo',
                    type: 'error',
                    autoClose: 1500
                });

                return;
            }

            try {

                setSubmitting(true);

                const datosNormalizados = {
                    ...DiasFestivosForm,
                    Anio: Number(
                        DiasFestivosForm.Fecha.substring(0, 4)
                    ),
                    Nombre:
                        DiasFestivosForm.Nombre
                            .trim()
                            .toUpperCase(),
                    Tipo:
                        DiasFestivosForm.Tipo
                            .trim()
                            .toUpperCase(),
                    Descripcion:
                        DiasFestivosForm.Descripcion
                            ?.trim()
                            .toUpperCase() || ''
                };

                let response: RespuestaAPI;

                if (TipoFormulario === 'Modificar') {

                    response =
                        await apiService.put<RespuestaAPI>(
                            `/DiasFestivos/crud.php?IdDiaFestivo=${DiasFestivosForm.IdDiaFestivo}&IdUsuario=${usuarioSesion?.IdUsuario}`,
                            datosNormalizados
                        );

                } else {

                    response =
                        await apiService.postForm<RespuestaAPI>(
                            `/DiasFestivos/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`,
                            datosNormalizados
                        );
                }

                showToast({
                    text:
                        response.message ||
                        (
                            TipoFormulario === 'Modificar'
                                ? 'Día festivo actualizado correctamente'
                                : 'Día festivo registrado correctamente'
                        ),
                    type:
                        response.status
                            ? 'success'
                            : 'error',
                    autoClose: 1500
                });

                if (response.status) {

                    setShowForm(false);
                    resetForm();

                    await fetchDiasFestivos();
                }

            } catch (error) {

                console.error(error);

                showToast({
                    text: 'Error al guardar el día festivo',
                    type: 'error',
                    autoClose: 1500
                });

            } finally {

                setSubmitting(false);
            }

        }, [
            DiasFestivosForm,
            TipoFormulario,
            usuarioSesion,
            fetchDiasFestivos,
            resetForm
        ]);

    const handleViewSolicitud =
        useCallback((
            diaFestivo: InterfaceDiasFestivos
        ) => {

            setTipoFormulario('Ver');

            setDiasFestivosForm({
                ...diaFestivo,
                Fecha:
                    diaFestivo.Fecha
                        ? String(
                            diaFestivo.Fecha
                        ).substring(0, 10)
                        : ''
            });

            setShowForm(true);

        }, []);

    const handleEditSolicitud =
        useCallback((
            diaFestivo: InterfaceDiasFestivos
        ) => {

            setTipoFormulario('Modificar');

            setDiasFestivosForm({
                ...diaFestivo,
                Fecha:
                    diaFestivo.Fecha
                        ? String(
                            diaFestivo.Fecha
                        ).substring(0, 10)
                        : ''
            });

            setShowForm(true);

        }, []);

    const handleDeleteSolicitud =
        useCallback(async (
            diaFestivo: InterfaceDiasFestivos
        ) => {

            const confirmar =
                window.confirm(
                    `¿Está seguro de eliminar el día festivo "${diaFestivo.Nombre}"?`
                );

            if (!confirmar) {
                return;
            }

            try {

                const response =
                    await apiService.delete<RespuestaAPI>(
                        `/DiasFestivos/crud.php?IdDiaFestivo=${diaFestivo.IdDiaFestivo}&IdUsuario=${usuarioSesion?.IdUsuario}`
                    );

                if (response.status) {

                    showToast({
                        text: 'Día festivo eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });

                    await fetchDiasFestivos();

                } else {

                    showToast({
                        text:
                            response.message ||
                            'Error al eliminar el día festivo',
                        type: 'error',
                        autoClose: 1500
                    });
                }

            } catch (error) {

                console.error(error);

                showToast({
                    text: 'Error al eliminar el día festivo',
                    type: 'error',
                    autoClose: 1500
                });
            }

        }, [
            usuarioSesion,
            fetchDiasFestivos
        ]);

    const limpiarFiltros =
        useCallback(() => {

            setAnioFiltro(anioActual);
            setMesFiltro('');

        }, [anioActual]);

    useEffect(() => {

        fetchDiasFestivos();

        const usuario =
            obtenerUsuarioSesion();

        setUsuarioSesion(usuario);

    }, [fetchDiasFestivos]);

    useEffect(() => {

        const handleClickOutside =
            (event: MouseEvent) => {

                if (
                    openActionDropdown &&
                    !(event.target as HTMLElement)
                        .closest(
                            '.actions-dropdown-container'
                        )
                ) {
                    setOpenActionDropdown(null);
                }
            };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );

    }, [openActionDropdown]);

    useEffect(() => {

        document.body.style.overflow =
            showForm
                ? 'hidden'
                : 'auto';

        return () => {
            document.body.style.overflow = 'auto';
        };

    }, [showForm]);

    const soloLectura =
        TipoFormulario === 'Ver';

    const tableColumns: Column[] = useMemo(() => [

        {
            key: 'IdDiaFestivo',
            title: 'ID',
            sortable: true,
            searchable: true,
            width: '70px',
            align: 'center'
        },

        {
            key: 'Anio',
            title: 'Año',
            sortable: true,
            searchable: true,
            width: '80px',
            align: 'center'
        },

        {
            key: 'Fecha',
            title: 'Fecha',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center',
            render: (value) =>
                formatearFecha(
                    value as string
                )
        },

        {
            key: 'Nombre',
            title: 'Día Festivo',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'left'
        },

        {
            key: 'Tipo',
            title: 'Tipo',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center'
        },

        {
            key: 'Descripcion',
            title: 'Descripción',
            sortable: true,
            searchable: true,
            width: '230px',
            align: 'left'
        },

        {
            key: 'FechaRegistro',
            title: 'Fecha Registro',
            sortable: true,
            searchable: true,
            width: '150px',
            align: 'center'
        },

        {
            key: 'UsuarioRegistro',
            title: 'Usuario',
            sortable: true,
            searchable: true,
            width: '140px',
            align: 'center'
        },

        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '90px',
            align: 'center',
            render: (_, row) => (
                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={
                        openActionDropdown
                    }
                    setOpenActionDropdown={
                        setOpenActionDropdown
                    }
                    onView={
                        handleViewSolicitud
                    }
                    onEdit={
                        handleEditSolicitud
                    }
                    onDelete={
                        handleDeleteSolicitud
                    }
                />
            )
        }

    ], [
        openActionDropdown,
        handleViewSolicitud,
        handleEditSolicitud,
        handleDeleteSolicitud
    ]);

    return (
        <div className="DiasFestivos-container"> 
            <div className="DiasFestivos-header"> 
                <div className="DiasFestivos-header-info"> 
                    <h1 className="page-title-DiasFestivos">
                        Catálogo de Días Festivos
                    </h1>
                </div>

                <div className="action-buttons"> 
                    <button
                        type="button"
                        className="action-btn"
                        onClick={
                            handleShowForm
                        }
                    >
                        <Plus size={18} />
                        Nuevo Día Festivo
                    </button>

                </div>

            </div>

            <div className="DiasFestivos-filters">

                <div className="DiasFestivos-filters-left">

                    <div className="DiasFestivos-filter-group">

                        <label className="DiasFestivos-filter-label">
                            Año
                        </label>

                        <select
                            value={
                                anioFiltro
                            }
                            onChange={(e) =>
                                setAnioFiltro(
                                    e.target.value
                                )
                            }
                            className="DiasFestivos-filter-select"
                        >

                            {aniosDisponibles.map(
                                anio => (
                                    <option
                                        key={anio}
                                        value={anio}
                                    >
                                        {anio}
                                    </option>
                                )
                            )}

                        </select>

                    </div>

                    <div className="DiasFestivos-filter-group">

                        <label className="DiasFestivos-filter-label">
                            Mes
                        </label>

                        <select
                            value={
                                mesFiltro
                            }
                            onChange={(e) =>
                                setMesFiltro(
                                    e.target.value
                                )
                            }
                            className="DiasFestivos-filter-select"
                        >

                            <option value="">
                                Todos los meses
                            </option>

                            {MESES.map(mes => (
                                <option
                                    key={
                                        mes.valor
                                    }
                                    value={
                                        mes.valor
                                    }
                                >
                                    {mes.nombre}
                                </option>
                            ))}

                        </select>

                    </div>

                    {(
                        anioFiltro !== anioActual ||
                        mesFiltro !== ''
                    ) && (

                        <button
                            type="button"
                            className="DiasFestivos-clear-filter"
                            onClick={
                                limpiarFiltros
                            }
                        >
                            <X size={15} />
                            Restablecer
                        </button>

                    )}

                </div>

                <div className="DiasFestivos-result-count">

                    <Filter size={16} />

                    <span>
                        <strong>
                            {
                                DiasFestivosFiltrados
                                    .length
                            }
                        </strong>
                        {' '}día(s) festivo(s)
                    </span>

                </div>

            </div>

            <div className="DiasFestivos-filter-summary">

                <span>
                    Mostrando:
                </span>

                <strong>
                    {anioFiltro}
                </strong>

                {mesFiltro && (
                    <>
                        <span>
                            •
                        </span>

                        <strong>
                            {
                                nombreMesSeleccionado
                            }
                        </strong>
                    </>
                )}

            </div>

            <div className="DiasFestivos-content">

                <Tabla
                    columns={
                        tableColumns
                    }
                    data={
                        DiasFestivosFiltrados
                    }
                    pageSize={10}
                    pageSizeOptions={[
                        5,
                        10,
                        25,
                        50
                    ]}
                    emptyMessage={
                        loading
                            ? 'Cargando...'
                            : `No existen días festivos para ${anioFiltro}${
                                mesFiltro
                                    ? ` - ${nombreMesSeleccionado}`
                                    : ''
                            }`
                    }
                    className="full-height-table"
                />

            </div>

            {showForm && (

                <div className="form-DiasFestivos-modal-overlay">

                    <div className="form-DiasFestivos-modal">

                        <div className="form-DiasFestivos-modal-header">

                            <h2 className="form-DiasFestivos-modal-title">
                                {
                                    TipoFormulario === 'Ver'
                                        ? 'Detalle del Día Festivo'
                                        : TipoFormulario === 'Modificar'
                                            ? 'Editar Día Festivo'
                                            : 'Nuevo Día Festivo'
                                }
                            </h2>

                            <button
                                type="button"
                                className="close-button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="form-DiasFestivos-modal-body">

                            <form onSubmit={handleSubmit}>

                                <div className="form-DiasFestivos-row two-columns">

                                    <div className="form-DiasFestivos-group">

                                        <label
                                            htmlFor="Fecha"
                                            className="form-DiasFestivos-label"
                                        >
                                            Fecha
                                        </label>

                                        <input
                                            type="date"
                                            id="Fecha"
                                            name="Fecha"
                                            value={
                                                DiasFestivosForm.Fecha || ''
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            className="form-DiasFestivos-input"
                                            disabled={
                                                soloLectura
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="form-DiasFestivos-group">

                                        <label
                                            htmlFor="Anio"
                                            className="form-DiasFestivos-label"
                                        >
                                            Año
                                        </label>

                                        <input
                                            type="number"
                                            id="Anio"
                                            name="Anio"
                                            value={
                                                DiasFestivosForm.Anio || ''
                                            }
                                            className="form-DiasFestivos-input readonly"
                                            readOnly
                                        />

                                    </div>

                                </div>

                                <div className="form-DiasFestivos-row two-columns">

                                    <div className="form-DiasFestivos-group">

                                        <label
                                            htmlFor="Nombre"
                                            className="form-DiasFestivos-label"
                                        >
                                            Día Festivo
                                        </label>

                                        <input
                                            type="text"
                                            id="Nombre"
                                            name="Nombre"
                                            value={
                                                DiasFestivosForm.Nombre || ''
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            className="form-DiasFestivos-input"
                                            placeholder="Ej. NAVIDAD"
                                            disabled={
                                                soloLectura
                                            }
                                            required
                                        />

                                    </div>

                                    <div className="form-DiasFestivos-group">

                                        <label
                                            htmlFor="Tipo"
                                            className="form-DiasFestivos-label"
                                        >
                                            Tipo
                                        </label>

                                        <select
                                            id="Tipo"
                                            name="Tipo"
                                            value={
                                                DiasFestivosForm.Tipo || ''
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            className="form-DiasFestivos-select"
                                            disabled={
                                                soloLectura
                                            }
                                            required
                                        >

                                            <option value="">
                                                Seleccione...
                                            </option>

                                            <option value="OFICIAL">
                                                Oficial
                                            </option>

                                            <option value="EMPRESA">
                                                Empresa
                                            </option>

                                            <option value="EXTRAORDINARIO">
                                                Extraordinario
                                            </option>

                                            <option value="OTRO">
                                                Otro
                                            </option>

                                        </select>

                                    </div>

                                </div>

                                <div className="form-DiasFestivos-row">

                                    <div className="form-DiasFestivos-group">

                                        <label
                                            htmlFor="Descripcion"
                                            className="form-DiasFestivos-label"
                                        >
                                            Descripción
                                        </label>

                                        <textarea
                                            id="Descripcion"
                                            name="Descripcion"
                                            value={
                                                DiasFestivosForm.Descripcion || ''
                                            }
                                            onChange={
                                                handleInputChange
                                            }
                                            className="form-DiasFestivos-textarea"
                                            placeholder="Descripción del día festivo"
                                            rows={4}
                                            disabled={
                                                soloLectura
                                            }
                                        />

                                    </div>

                                </div>

                                {TipoFormulario !== 'Agregar' && (

                                    <div className="form-DiasFestivos-row two-columns">

                                        <div className="form-DiasFestivos-group">

                                            <label className="form-DiasFestivos-label">
                                                Fecha Registro
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    DiasFestivosForm.FechaRegistro || ''
                                                }
                                                className="form-DiasFestivos-input readonly"
                                                readOnly
                                            />

                                        </div>

                                        <div className="form-DiasFestivos-group">

                                            <label className="form-DiasFestivos-label">
                                                Usuario Registro
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    DiasFestivosForm.UsuarioRegistro || ''
                                                }
                                                className="form-DiasFestivos-input readonly"
                                                readOnly
                                            />

                                        </div>

                                    </div>

                                )}

                                <div className="form-DiasFestivos-actions">

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                        }}
                                    >
                                        {
                                            soloLectura
                                                ? 'Cerrar'
                                                : 'Cancelar'
                                        }
                                    </button>

                                    {!soloLectura && (

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                submitting
                                            }
                                        >
                                            <FileText size={16} />

                                            {
                                                submitting
                                                    ? 'Guardando...'
                                                    : TipoFormulario === 'Modificar'
                                                        ? 'Actualizar'
                                                        : 'Guardar'
                                            }
                                        </button>

                                    )}

                                </div>

                            </form>

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
};