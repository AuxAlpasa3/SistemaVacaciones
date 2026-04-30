import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './HistorialPersonal.css';
// INTERFACES
import type { InterfaceHistorialPersonal } from '../../interfaces/HistorialPersonal';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
// HELPERS
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
// API
import { apiService } from '../../api/apiService';


const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onEdit,
    onDelete
}: {
    row: any,
    openActionDropdown: string | null,
    setOpenActionDropdown: (IdHistorialPersonal: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdHistorialPersonal ? null : row.IdHistorialPersonal)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdHistorialPersonal && (
            <div className="actions-dropdown-menu">
                <button className="actions-dropdown-item edit-action" onClick={() => { onEdit(row); setOpenActionDropdown(null); }}>
                    <Edit size={14} />
                    <span>Editar</span>
                </button>
                <div className="actions-dropdown-divider"></div>
                <button className="actions-dropdown-item delete-action" onClick={() => { onDelete(row); setOpenActionDropdown(null); }}>
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                </button>
            </div>
        )}
    </div>
));
export const HistorialPersonal: React.FC = () => {

    const [historialPersonalForm, setHistorialPersonalForm] = useState<InterfaceHistorialPersonal>({
        IdPersonal_historial: '',
        IdPersonal: '',
        NoEmpleado: '',
        Nombre: '',
        ApPaterno: '',
        ApMaterno: '',
        Cargo: '',
        Departamento: '',
        Empresa: '',
        Status: '',
        IdUbicacion: '',
        NSS: '',
        EsSupervisor: '',
        RutaFoto: '',
        Email: '',
        Contacto: '',
        IdSupervisor: '',
        TipoSangre: '',
        FechaModificacion: '',
        UsuarioModifico: ''

    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [historialPersonal, setHistorialPersonal] = useState<InterfaceHistorialPersonal[]>([]);

    const [listadoHistorialPersonal, setListadoHistorialPersonal] = useState<InterfaceHistorialPersonal[] | []>([]);
    const [loading, setLoading] = useState(false);
    const [TipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);


    useEffect(() => {
        const fetchHistorialPersonalListado = async () => {
            try {
                if (historialPersonalForm.IdPersonal_historial != '') {
                    const listadoHistorialPersonals = await obtenerHistorialPersonal();
                    setListadoHistorialPersonal(listadoHistorialPersonals as InterfaceHistorialPersonal[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de HistorialPersonal', type: 'error' });
            }
        }

        fetchHistorialPersonalListado();
    }, [historialPersonalForm.IdPersonal_historial]);

    const obtenerHistorialPersonal = async () => {
        try {
            const config = {};
            const listadoHistorialPersonal: any = await apiService.get<RespuestaAPI>('/HistorialPersonal/Crud.php?IdPersonal_historial=' + historialPersonalForm.IdPersonal_historial, config);

            return listadoHistorialPersonal || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdHistorialPersonal',
            title: 'ID HistorialPersonal',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'HistorialPersonal',
            title: 'HistorialPersonal',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center'
        },
        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '120px',
            align: 'center',
            render: (_, row) => (

                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    onEdit={handleEditSolicitud}
                    onDelete={handleDeleteSolicitud}
                />


            )
        }
    ], [openActionDropdown]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setHistorialPersonalForm((prev: any) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchHistorialPersonal = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/historialPersonal/ObtenerListado.php');
            if (response.status && response.data) {
                const historialPersonalData = response.data as InterfaceHistorialPersonal[];
                setHistorialPersonal(historialPersonalData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar historialPersonal',
                    type: 'error',
                    autoClose: 1500
                });
                setHistorialPersonal([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar historialPersonal',
                type: 'error',
                autoClose: 1500
            });
            setHistorialPersonal([]);
        } finally {
            setLoading(false);
        }
    }, []);



    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const datosNormalizados = {
                        ...historialPersonalForm,
                        HistorialPersonal: historialPersonalForm.IdPersonal_historial.trim().toUpperCase(),
                    };

            const isUpdate = historialPersonal.some(p => p.IdPersonal_historial === historialPersonalForm.IdPersonal_historial);
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/historialPersonal/crud.php?IdPersonal_historial=${historialPersonalForm.IdPersonal_historial}&IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/historialPersonal/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            }
            showToast({
                  text: response.message || (isUpdate ? 'HistorialPersonal actualizada correctamente' : 'HistorialPersonal guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchHistorialPersonal();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el historialPersonal',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [historialPersonalForm, fetchHistorialPersonal]);

    const handleEditSolicitud = useCallback((historialPersonal: InterfaceHistorialPersonal) => {
         setTipoFormulario('Modificar');
        setHistorialPersonalForm(historialPersonal);
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (historialPersonal: InterfaceHistorialPersonal) => {
        if (window.confirm('¿Está seguro de que desea eliminar este historialPersonal?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/historialPersonal/crud.php?IdPersonal_historial=${historialPersonal.IdPersonal_historial}&IdUsuario=${usuarioSesion?.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'HistorialPersonal eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchHistorialPersonal();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar historialPersonal',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar historialPersonal',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchHistorialPersonal]);

    const resetForm = useCallback(() => {
        setHistorialPersonalForm({
            IdPersonal_historial: '',
            IdPersonal: '',
            NoEmpleado: '',
            Nombre: '',
            ApPaterno: '',
            ApMaterno: '',
            Cargo: '',
            Departamento: '',
            Empresa: '',
            Status: '',
            IdUbicacion: '',
            NSS: '',
            EsSupervisor: '',
            RutaFoto: '',
            Email: '',
            Contacto: '',
            IdSupervisor: '',
            TipoSangre: '',
            FechaModificacion: '',
            UsuarioModifico: ''
        });
    }, []);

    useEffect(() => {
        fetchHistorialPersonal();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchHistorialPersonal]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionDropdown && !(event.target as HTMLElement).closest('.actions-dropdown-container')) {
                setOpenActionDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openActionDropdown]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'a' && !showForm) {
                event.preventDefault();
                setShowForm(true);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showForm]);

    useEffect(() => {
        document.body.style.overflow = showForm ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm]);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
    }, [resetForm]);

    return (
        <div className="historialPersonal-container">
            <div className="historialPersonal-header">
                <h1 className="page-title-historialPersonal">Catálogo de HistorialPersonal</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo HistorialPersonal
                    </button>
                </div>
            </div>

            <div className="historialPersonal-content">
                <Tabla
                    columns={tableColumns}
                    data={historialPersonal}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron HistorialPersonal"
                    className="full-height-table"
                //loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-historialPersonal-modal-overlay">
                    <div className="form-historialPersonal-modal">
                        <div className="form-historialPersonal-modal-header">
                            <h2 className="form-historialPersonal-modal-title">
                                {TipoFormulario === 'Modificar' ? 'Editar HistorialPersonal' : 'Registro de HistorialPersonal'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-historialPersonal-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-historialPersonal-row">
                                    <div className="form-historialPersonal-group">
                                        <label htmlFor='HistorialPersonal' className="form-historialPersonal-label">HistorialPersonal:</label>
                                        <input
                                            type="text"
                                            name="HistorialPersonal"
                                            value={historialPersonalForm.Nombre}
                                            onChange={handleInputChange}
                                            className="form-historialPersonal-input"
                                            placeholder="HistorialPersonal"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-historialPersonal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
                                            setTipoFormulario('Agregar');
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={submitting}
                                    >
                                        <FileText size={16} />
                                        {submitting ? 'Guardando...' : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};