import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './Ubicaciones.css';
// INTERFACES
import type { InterfaceUbicacion } from '../../interfaces/Ubicacion';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
// HELPERS
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
// API
import { apiService } from '../../api/apiService';


// Componente memoizado para los botones de acción
const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onEdit,
    onDelete
}: {
    row: any,
    openActionDropdown: string | null,
    setOpenActionDropdown: (IdUbicacion: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdUbicacion ? null : row.IdUbicacion)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdUbicacion && (
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
export const Ubicaciones: React.FC = () => {

    const [ubicacionForm, setUbicacionForm] = useState<InterfaceUbicacion>({
        IdUbicacion: '',
        Ubicacion: ''

    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [ubicaciones, setUbicaciones] = useState<InterfaceUbicacion[]>([]);

    const [listadoUbicacion, setListadoUbicacion] = useState<InterfaceUbicacion[] | []>([]);
    const [loading, setLoading] = useState(false);
    const [TipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);


    useEffect(() => {
        const fetchUbicacionListado = async () => {
            try {
                if (ubicacionForm.IdUbicacion != '') {
                    const listadoUbicacions = await obtenerUbicacion();
                    setListadoUbicacion(listadoUbicacions as InterfaceUbicacion[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de Ubicacion', type: 'error' });
            }
        }

        fetchUbicacionListado();
    }, [ubicacionForm.IdUbicacion]);

    const obtenerUbicacion = async () => {
        try {
            const config = {};
            const listadoUbicacion: any = await apiService.get<RespuestaAPI>('/Ubicaciones/Crud.php?IdUbicacion=' + ubicacionForm.IdUbicacion, config);

            return listadoUbicacion || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdUbicacion',
            title: 'ID Ubicacion',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'Ubicacion',
            title: 'Ubicacion',
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
        setUbicacionForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchUbicaciones = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/ubicaciones/ObtenerListado.php');
            if (response.status && response.data) {
                const ubicacionesData = response.data as InterfaceUbicacion[];
                setUbicaciones(ubicacionesData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar ubicaciones',
                    type: 'error',
                    autoClose: 1500
                });
                setUbicaciones([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar ubicaciones',
                type: 'error',
                autoClose: 1500
            });
            setUbicaciones([]);
        } finally {
            setLoading(false);
        }
    }, []);



    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const datosNormalizados = {
                        ...ubicacionForm,
                        Ubicacion: ubicacionForm.Ubicacion.trim().toUpperCase(),
                    };

            const isUpdate = ubicaciones.some(p => p.IdUbicacion === ubicacionForm.IdUbicacion);
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/ubicaciones/crud.php?IdUbicacion=${ubicacionForm.IdUbicacion}&IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/ubicaciones/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            }
            showToast({
                  text: response.message || (isUpdate ? 'Ubicacion actualizada correctamente' : 'Ubicacion guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchUbicaciones();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el ubicacion',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [ubicacionForm, fetchUbicaciones]);

    const handleEditSolicitud = useCallback((ubicacion: InterfaceUbicacion) => {
         setTipoFormulario('Modificar');
        setUbicacionForm(ubicacion);
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (ubicacion: InterfaceUbicacion) => {
        if (window.confirm('¿Está seguro de que desea eliminar este ubicacion?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/ubicaciones/crud.php?IdUbicacion=${ubicacion.IdUbicacion}&IdUsuario=${usuarioSesion?.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'Ubicacion eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchUbicaciones();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar ubicacion',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar ubicacion',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchUbicaciones]);

    const resetForm = useCallback(() => {
        setUbicacionForm({
            IdUbicacion: '',
            Ubicacion: ''
        });
    }, []);

    useEffect(() => {
        fetchUbicaciones();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchUbicaciones]);

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
        <div className="ubicaciones-container">
            <div className="ubicaciones-header">
                <h1 className="page-title-ubicaciones">Catálogo de Ubicaciones</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo Ubicacion
                    </button>
                </div>
            </div>

            <div className="ubicaciones-content">
                <Tabla
                    columns={tableColumns}
                    data={ubicaciones}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron Ubicaciones"
                    className="full-height-table"
                //loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-ubicacion-modal-overlay">
                    <div className="form-ubicacion-modal">
                        <div className="form-ubicacion-modal-header">
                            <h2 className="form-ubicacion-modal-title">
                                {TipoFormulario === 'Modificar' ? 'Editar Ubicacion' : 'Registro de Ubicacion'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-ubicacion-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-ubicacion-row">
                                    <div className="form-ubicacion-group">
                                        <label htmlFor='Ubicacion' className="form-ubicacion-label">Ubicacion:</label>
                                        <input
                                            type="text"
                                            name="Ubicacion"
                                            value={ubicacionForm.Ubicacion}
                                            onChange={handleInputChange}
                                            className="form-ubicacion-input"
                                            placeholder="Ubicacion"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-ubicacion-actions">
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