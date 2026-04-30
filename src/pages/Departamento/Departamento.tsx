import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './Departamento.css';
// INTERFACES
import type { InterfaceDepartamento } from '../../interfaces/Departamento';
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
    setOpenActionDropdown: (IdDepartamento: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdDepartamento ? null : row.IdDepartamento)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdDepartamento && (
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
export const Departamento: React.FC = () => {

    const [departamentoForm, setDepartamentoForm] = useState<InterfaceDepartamento>({
        IdDepartamento: '',
        NomDepto: ''

    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [departamento, setDepartamento] = useState<InterfaceDepartamento[]>([]);

    const [listadoDepartamento, setListadoDepartamento] = useState<InterfaceDepartamento[] | []>([]);
    const [loading, setLoading] = useState(false);
    const [TipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);


    useEffect(() => {
        const fetchDepartamentoListado = async () => {
            try {
                if (departamentoForm.IdDepartamento != '') {
                    const listadoDepartamentos = await obtenerDepartamento();
                    setListadoDepartamento(listadoDepartamentos as InterfaceDepartamento[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de Departamento', type: 'error' });
            }
        }

        fetchDepartamentoListado();
    }, [departamentoForm.IdDepartamento]);

    const obtenerDepartamento = async () => {
        try {
            const config = {};
            const listadoDepartamento: any = await apiService.get<RespuestaAPI>('/Departamento/Crud.php?IdDepartamento=' + departamentoForm.IdDepartamento, config);

            return listadoDepartamento || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdDepartamento',
            title: 'ID Departamento',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'NomDepto',
            title: 'Departamento',
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
        setDepartamentoForm((prev: any) => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const fetchDepartamento = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/departamento/ObtenerListado.php');
            if (response.status && response.data) {
                const departamentoData = response.data as InterfaceDepartamento[];
                setDepartamento(departamentoData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar departamento',
                    type: 'error',
                    autoClose: 1500
                });
                setDepartamento([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar departamento',
                type: 'error',
                autoClose: 1500
            });
            setDepartamento([]);
        } finally {
            setLoading(false);
        }
    }, []);



    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const datosNormalizados = {
                        ...departamentoForm,
                        NomDepto: departamentoForm.NomDepto.trim().toUpperCase(),
                    };

            const isUpdate = departamento.some(p => p.IdDepartamento === departamentoForm.IdDepartamento);
            let response: RespuestaAPI;

            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/departamento/crud.php?IdDepartamento=${departamentoForm.IdDepartamento}&IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/departamento/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, datosNormalizados);
            }
            showToast({
                  text: response.message || (isUpdate ? 'Departamento actualizada correctamente' : 'Departamento guardada correctamente'),
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchDepartamento();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el departamento',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [departamentoForm, fetchDepartamento]);

    const handleEditSolicitud = useCallback((departamento: InterfaceDepartamento) => {
         setTipoFormulario('Modificar');
        setDepartamentoForm(departamento);
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (departamento: InterfaceDepartamento) => {
        if (window.confirm('¿Está seguro de que desea eliminar este departamento?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/departamento/crud.php?IdDepartamento=${departamento.IdDepartamento}&IdUsuario=${usuarioSesion?.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'Departamento eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchDepartamento();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar departamento',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar departamento',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchDepartamento]);

    const resetForm = useCallback(() => {
        setDepartamentoForm({
            IdDepartamento: '',
            NomDepto: ''
        });
    }, []);

    useEffect(() => {
        fetchDepartamento();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchDepartamento]);

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
        <div className="departamento-container">
            <div className="departamento-header">
                <h1 className="page-title-departamento">Catálogo de Departamento</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo Departamento
                    </button>
                </div>
            </div>

            <div className="departamento-content">
                <Tabla
                    columns={tableColumns}
                    data={departamento}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron Departamento"
                    className="full-height-table"
                //loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-departamento-modal-overlay">
                    <div className="form-departamento-modal">
                        <div className="form-departamento-modal-header">
                            <h2 className="form-departamento-modal-title">
                                {TipoFormulario === 'Modificar' ? 'Editar Departamento' : 'Registro de Departamento'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-departamento-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-departamento-row">
                                    <div className="form-departamento-group">
                                        <label htmlFor='NomDepto' className="form-departamento-label">Departamento:</label>
                                        <input
                                            type="text"
                                            name="NomDepto"
                                            value={departamentoForm.NomDepto}
                                            onChange={handleInputChange}
                                            className="form-departamento-input"
                                            placeholder="Departamento"
                                            style={{ textTransform: 'uppercase' }}
                                        />
                                    </div>
                                </div>

                                <div className="form-departamento-actions">
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