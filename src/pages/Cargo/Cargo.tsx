import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './Cargo.css';
// INTERFACES
import type { InterfaceCargo } from '../../interfaces/Cargo';
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
    setOpenActionDropdown: (IdCargo: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdCargo ? null : row.IdCargo)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdCargo && (
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
export const Cargo: React.FC = () => {

    const [cargoForm, setCargoForm] = useState<InterfaceCargo>({
        IdCargo: '',
        NomCargo: ''

    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [cargo, setCargo] = useState<InterfaceCargo[]>([]);

    const [listadoCargo, setListadoCargo] = useState<InterfaceCargo[] | []>([]);
    const [loading, setLoading] = useState(false);
    const [TipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);


    useEffect(() => {
        const fetchCargoListado = async () => {
            try {
                if (cargoForm.IdCargo != '') {
                    const listadoCargos = await obtenerCargo();
                    setListadoCargo(listadoCargos as InterfaceCargo[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de Cargo', type: 'error' });
            }
        }

        fetchCargoListado();
    }, [cargoForm.IdCargo]);

    const obtenerCargo = async () => {
        try {
            const config = {};
            const listadoCargo: any = await apiService.get<RespuestaAPI>('/Cargo/Crud.php?IdCargo=' + cargoForm.IdCargo, config);

            return listadoCargo || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdCargo',
            title: 'ID Cargo',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'NomCargo',
            title: 'Cargo',
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
        setCargoForm((prev: any) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchCargo = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/Cargo/ObtenerListado.php');
            if (response.status && response.data) {
                const cargoData = response.data as InterfaceCargo[];
                setCargo(cargoData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar cargo',
                    type: 'error',
                    autoClose: 1500
                });
                setCargo([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar cargo',
                type: 'error',
                autoClose: 1500
            });
            setCargo([]);
        } finally {
            setLoading(false);
        }
    }, []);



    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const datosNormalizados = {
                        ...cargoForm,
                        NomCargo: cargoForm.NomCargo.trim().toUpperCase(),
                    };

            const isUpdate = cargo.some(p => p.IdCargo === cargoForm.IdCargo);
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/cargo/crud.php?IdCargo=${cargoForm.IdCargo}&IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/cargo/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            }
            showToast({
                  text: response.message || (isUpdate ? 'Cargo actualizada correctamente' : 'Cargo guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchCargo();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el cargo',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [cargoForm, fetchCargo]);

    const handleEditSolicitud = useCallback((cargo: InterfaceCargo) => {
         setTipoFormulario('Modificar');
        setCargoForm(cargo);
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (cargo: InterfaceCargo) => {
        if (window.confirm('¿Está seguro de que desea eliminar este cargo?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/cargo/crud.php?IdCargo=${cargo.IdCargo}&IdUsuario=${usuarioSesion?.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'Cargo eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchCargo();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar cargo',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar cargo',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchCargo]);

    const resetForm = useCallback(() => {
        setCargoForm({
            IdCargo: '',
            NomCargo: ''
        });
    }, []);

    useEffect(() => {
        fetchCargo();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchCargo]);

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
        <div className="cargo-container">
            <div className="cargo-header">
                <h1 className="page-title-cargo">Catálogo de Cargo</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo Cargo
                    </button>
                </div>
            </div>

            <div className="cargo-content">
                <Tabla
                    columns={tableColumns}
                    data={cargo}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron Cargo"
                    className="full-height-table"
                //loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-cargo-modal-overlay">
                    <div className="form-cargo-modal">
                        <div className="form-cargo-modal-header">
                            <h2 className="form-cargo-modal-title">
                                {TipoFormulario === 'Modificar' ? 'Editar Cargo' : 'Registro de Cargo'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-cargo-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-cargo-row">
                                    <div className="form-cargo-group">
                                        <label htmlFor='NomCargo' className="form-cargo-label">Cargo:</label>
                                        <input
                                            type="text"
                                            name="NomCargo"
                                            value={cargoForm.NomCargo}
                                            onChange={handleInputChange}
                                            className="form-cargo-input"
                                            placeholder="Cargo"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-cargo-actions">
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