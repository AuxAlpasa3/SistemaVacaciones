import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Plus, X, FileText, Edit, Trash2, Eye, MoreVertical, Lock, EyeOff } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import './Usuario.css';
// INTERFACES
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario,OpcionSelect } from '../../interfaces/Usuario';
import type { InterfaceTipoUsuario } from '../../interfaces/TipoUsuario';
// HELPERS
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
// API
import { apiService } from '../../api/apiService';
import ReactSelect from '../../components/Select/Select';
import type { OptionType } from '../../interfaces/OptionType';

const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onEdit,
    onDelete,
    onCambiarContrasenia
}: {
    row: any,
    openActionDropdown: string | null,
    setOpenActionDropdown: (IdUsuario: string | null) => void,
    onEdit: (row: any) => void,
    onDelete: (row: any) => void,
    onCambiarContrasenia: (row: any) => void,
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={() => setOpenActionDropdown(openActionDropdown === row.IdUsuario ? null : row.IdUsuario)}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row?.IdUsuario && (
            <div className="actions-dropdown-menu">
                <button className="actions-dropdown-item edit-action" onClick={() => { onEdit(row); setOpenActionDropdown(null); }}>
                    <Edit size={14} />
                    <span>Editar</span>
                </button>
                <div className="actions-dropdown-divider"></div>
                <button className="actions-dropdown-item contrasena-action" onClick={() => { onCambiarContrasenia(row); setOpenActionDropdown(null); }}>
                    <Lock size={14} />
                    <span>Cambiar Contraseña</span>
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

const CambioContraseniaModal: React.FC<{
    usuario: Usuario | null;
    onClose: () => void;
    onSubmit: (data: { nuevaContrasenia: string; confirmarContrasenia: string }) => void;
    loading: boolean;
}> = ({ usuario, onClose, onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        nuevaContrasenia: '',
        confirmarContrasenia: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {};

        if (formData.nuevaContrasenia.length < 6) {
            newErrors.nuevaContrasenia = 'La contraseña debe tener al menos 6 caracteres';
        }

        if (formData.nuevaContrasenia !== formData.confirmarContrasenia) {
            newErrors.confirmarContrasenia = 'Las contraseñas no coinciden';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const getPasswordStrength = (password: string) => {
        if (password.length === 0) return { strength: 0, text: '' };
        if (password.length < 6) return { strength: 1, text: 'Débil' };
        if (password.length < 8) return { strength: 2, text: 'Media' };
        return { strength: 3, text: 'Fuerte' };
    };

    const passwordStrength = getPasswordStrength(formData.nuevaContrasenia);

    return (
        <div className="cambio-contrasenia-modal-overlay">
            <div className="cambio-contrasenia-modal">
                <div className="cambio-contrasenia-modal-header">
                    <h2 className="cambio-contrasenia-modal-title">
                        <Lock size={20} style={{ marginRight: '10px', verticalAlign: 'middle' }} />
                        Cambiar Contraseña - {usuario?.Usuario}
                    </h2>
                    <button className="close-button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="cambio-contrasenia-modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="cambio-contrasenia-form-group">
                            <label className="cambio-contrasenia-label">Nueva Contraseña:</label>
                            <div className="password-input-container">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="nuevaContrasenia"
                                    value={formData.nuevaContrasenia}
                                    onChange={handleInputChange}
                                    className={`cambio-contrasenia-input ${errors.nuevaContrasenia ? 'shake' : ''}`}
                                    placeholder="Ingresa la nueva contraseña"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className="password-strength">
                                <div className={`password-strength-bar ${passwordStrength.strength === 1 ? 'weak' :
                                    passwordStrength.strength === 2 ? 'medium' :
                                        passwordStrength.strength === 3 ? 'strong' : ''
                                    }`} />
                            </div>
                            <div className="password-strength-text">
                                {passwordStrength.text}
                            </div>
                            <div className={`validation-message ${errors.nuevaContrasenia ? 'error' : ''}`}>
                                {errors.nuevaContrasenia}
                            </div>
                        </div>

                        <div className="cambio-contrasenia-form-group">
                            <label className="cambio-contrasenia-label">Confirmar Contraseña:</label>
                            <div className="password-input-container">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmarContrasenia"
                                    value={formData.confirmarContrasenia}
                                    onChange={handleInputChange}
                                    className={`cambio-contrasenia-input ${errors.confirmarContrasenia ? 'shake' : ''}`}
                                    placeholder="Confirma la nueva contraseña"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className={`validation-message ${errors.confirmarContrasenia ? 'error' : ''}`}>
                                {errors.confirmarContrasenia}
                            </div>
                        </div>

                        <div className="cambio-contrasenia-modal-actions">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn-change-password"
                                disabled={loading}
                            >
                                <Lock size={16} />
                                {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export const Usuarios: React.FC = () => {
    const [usuarioForm, setUsuarioForm] = useState<Usuario>({
        IdUsuario: '',
        Usuario: '',
        TipoUsuario: '',
        Correo: '',
        NombreColaborador: '',
        Almacen: '',
        Estatus: '',
        Contrasenia: ''
    });
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const [listadoUsuario, setListadoUsuario] = useState<Usuario[] | []>([]);

    const [listadoEstatus, setListadoEstatus] = useState<InterfaceEstatusUsuario[] | []>([]);
    const [listadoTipoUsuario, setListadoTipoUsuario] = useState<InterfaceTipoUsuario[] | []>([]);
    const [listadoAlmacen, setListadoAlmacen] = useState<InterfaceAlmacen[] | []>([]);

    const [estatus, setEstatus] = useState<OpcionSelect[]>([]);
    const [tipoUsuario, setTipoUsuario] = useState<OpcionSelect[]>([]);
    const [almacen, setAlmacen] = useState<OpcionSelect[]>([]);

    const [selectedEstatus, setSelectedEstatus] = useState<any>({ value: '', label: '' });
    const [selectedTipoUsuario, setSelectedTipoUsuario] = useState<any>({ value: '', label: '' });
    const [selectedAlmacen, setSelectedAlmacen] = useState<any>({ value: '', label: '' });

    useEffect(() => {
        const fetchUsuarioListado = async () => {
            try {
                if (usuarioForm.IdUsuario != '') {
                    const listadoUsuarioss = await obtenerUsuario();
                    setListadoUsuario(listadoUsuarioss as Usuario[]);
                }
            } catch (error) {
                showToast({ text: 'Error al obtener lista de Usuario', type: 'error' });
            }
        }

        fetchUsuarioListado();
    }, [usuarioForm.IdUsuario]);

    const obtenerUsuario = async () => {
        try {
            const config = {};
            const listadoUsuarios: any = await apiService.get<RespuestaAPI>('/Usuarios/Crud.php', config);

            setSelectedEstatus({ label: (Array.isArray(listadoUsuarios.data) && listadoUsuarios.data.length > 0) && listadoUsuarios.data[0]?.Estatus == 1 ? 'Activo' : 'Inactivo', value: listadoUsuarios.data[0]?.Estatus });

            return listadoUsuarios || [];

        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    //Listado Estatus//
    useEffect(() => {
        const fetchEstatusListado = async () => {
            try {
                const listadoEstatuss = await obtenerEstatus();
                setListadoEstatus(listadoEstatuss as InterfaceEstatusUsuario[]);
            } catch (error) {
                showToast({ text: 'Error al obtener lista de estatus', type: 'error' });
            }
        }

        fetchEstatusListado();
    }, []);

    const obtenerEstatus = async () => {
        try {
            const config = {};
            const listadoEstatuss = await apiService.get<RespuestaAPI>('/Catalogos/ObtenerEstatus.php', config);
            return listadoEstatuss.data || [];
        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };


    //Listado TipoUsuario//
    useEffect(() => {
        const fetchTipoUsuarioListado = async () => {
            try {
                const listadoTipoUsuarioss = await obtenerTipoUsuario();
                setListadoTipoUsuario(listadoTipoUsuarioss as InterfaceTipoUsuario[]);
            } catch (error) {
                showToast({ text: 'Error al obtener lista de TipoUsuario', type: 'error' });
            }
        }
        fetchTipoUsuarioListado();
    }, []);

    
    const convertirOpciones = useCallback((opciones: OpcionSelect[]): {id: string, valor: string}[] => {
        return opciones.map(opcion => ({
            id: opcion.id.toString(),
            valor: opcion.valor
        }));
    }, []);

    const convertirOpcionesParaBusqueda = useCallback((opciones: OpcionSelect[]): {id: string, valor: string}[] => {
        return opciones.map(opcion => ({
            id: opcion.id.toString(),
            valor: opcion.valor
        }));
    }, []);

      const obtenerTextoPorId = useCallback((value: string, opciones: OpcionSelect[]): string => {
            if (value === '0' || value === '0') {
                return 'N/A';
            }
            if (!value && value !== '0') return '';
            
            const opcion = opciones.find(op => op.id.toString() === value.toString());
            return opcion ? opcion.valor : value;
        }, []);


    const obtenerTipoUsuario = async () => {
        try {
            const config = {};
            const listadoTipoUsuarios = await apiService.get<RespuestaAPI>('/Catalogos/ObtenerTipoUsuario.php', config);
            return listadoTipoUsuarios.data || [];
        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };

    useEffect(() => {
        const fetchAlmacenListado = async () => {
            try {
                const listadoAlmacens = await obtenerAlmacen();
                setListadoAlmacen(listadoAlmacens as InterfaceAlmacen[]);
            } catch (error) {
                showToast({ text: 'Error al obtener lista de estatus', type: 'error' });
            }
        }

        fetchAlmacenListado();
    }, []);

    const obtenerAlmacen = async () => {
        try {
            const config = {};
            const listadoAlmacens = await apiService.get<RespuestaAPI>('/Catalogos/ObtenerAlmacen.php', config);
            return listadoAlmacens.data || [];
        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
    };




    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdUsuario',
            title: 'ID Usuario',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center'
        },
        {
            key: 'Usuario',
            title: 'Usuario',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center'
        },
        {
            key: 'TipoUsuario',
            title: 'Tipo de Usuario',
            sortable: true,
            searchable: true,
            width: '150px',
            align: 'center',
            render: (value) => obtenerTextoPorId(value, tipoUsuario)
        },
        {
            key: 'Correo',
            title: 'Correo',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center'
        },
        {
            key: 'NombreColaborador',
            title: 'Nombre',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center'
        },
        {
            key: 'Estatus',
            title: 'Estatus',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center',
            render: (value) => obtenerTextoPorId(value, estatus)
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
                    onCambiarContrasenia={handleOpenPasswordModal}
                />
            )
        }
    ], [openActionDropdown]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setUsuarioForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleEstatusSelect = (EstatusData: OptionType) => {
        setSelectedEstatus(EstatusData);
    }
    const handleTipoUsuarioSelect = (TipoUsuarioData: OptionType) => {
        setSelectedTipoUsuario(TipoUsuarioData);
    }
    const handleAlmacenSelect = (AlmacenData: OptionType) => {
        setSelectedAlmacen(AlmacenData);
    }

    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/usuarios/ObtenerListado.php');
            if (response.status && response.data) {
                const usuariosData = response.data as Usuario[];
                setUsuarios(usuariosData);

            } else {
                showToast({
                    text: response.message || 'Error al cargar usuarios',
                    type: 'error',
                    autoClose: 1500
                });
                setUsuarios([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar usuarios',
                type: 'error',
                autoClose: 1500
            });
            setUsuarios([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSubmitting(true);

            const formData = new FormData();
            Object.entries(usuarioForm).forEach(([key, value]) => {
                formData.append(key, value);
            });

            const response = await apiService.postForm<RespuestaAPI>(`/usuarios/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, formData);

            showToast({
                text: response.message || 'Usuario guardado correctamente',
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowForm(false);
                resetForm();
                fetchUsuarios();
            }
        } catch (error) {
            showToast({
                text: 'Error al guardar el usuario',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [usuarioForm, fetchUsuarios]);

    const handleCambiarContrasenia = useCallback(async (data: { nuevaContrasenia: string; confirmarContrasenia: string }) => {
        if (!selectedUsuario) return;

        try {
            setChangingPassword(true);

            const formData = new FormData();
            formData.append('IdUsuario', selectedUsuario.IdUsuario);
            formData.append('Contrasenia', data.nuevaContrasenia);
            formData.append('action', 'cambiar_contrasenia');

            const response = await apiService.postForm<RespuestaAPI>(`/usuarios/crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, formData);

            showToast({
                text: response.message || 'Contraseña cambiada correctamente',
                type: response.status ? 'success' : 'error',
                autoClose: 1500
            });

            if (response.status) {
                setShowPasswordModal(false);
                setSelectedUsuario(null);
            }
        } catch (error) {
            showToast({
                text: 'Error al cambiar la contraseña',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setChangingPassword(false);
        }
    }, [selectedUsuario]);

    const handleViewSolicitud = useCallback((usuario: Usuario) => {
        console.log('Ver usuario:', usuario);
    }, []);

    const handleEditSolicitud = useCallback((usuario: Usuario) => {
        setUsuarioForm({ ...usuario, IdUsuario: usuario.IdUsuario })
        setShowForm(true);
    }, []);

    const handleDeleteSolicitud = useCallback(async (usuario: Usuario) => {
        if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(`/Usuarios/crud.php?IdUsuario=${usuario.IdUsuario}`);

                if (response.status) {
                    showToast({
                        text: 'Usuario eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    fetchUsuarios();
                } else {
                    showToast({
                        text: response.message || 'Error al eliminar usuario',
                        type: 'error',
                        autoClose: 1500
                    });
                }
            } catch (error) {
                showToast({
                    text: 'Error al eliminar usuario',
                    type: 'error',
                    autoClose: 1500
                });
            }
        }
    }, [fetchUsuarios]);

    const handleOpenPasswordModal = useCallback((usuario: Usuario) => {
        setSelectedUsuario(usuario);
        setShowPasswordModal(true);
    }, []);

    const resetForm = useCallback(() => {
        setUsuarioForm({
            IdUsuario: '',
            Usuario: '',
            TipoUsuario: '',
            Correo: '',
            NombreColaborador: '',
            Almacen: '',
            Estatus: 'Activo',
            Contrasenia: ''
        });
    }, []);

    useEffect(() => {
        fetchUsuarios();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchUsuarios]);

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
        document.body.style.overflow = showForm || showPasswordModal ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm, showPasswordModal]);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
    }, [resetForm]);

    return (
        <div className="usuarios-container">
            <div className="usuarios-header">
                <h1 className="page-title-usuarios">Catálogo de Usuarios</h1>
                <div className="action-buttons">
                    <button className="action-btn" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="usuarios-content">
                <Tabla
                    columns={tableColumns}
                    data={usuarios}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron Usuarios"
                    className="full-height-table"
                //loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-usuario-modal-overlay">
                    <div className="form-usuario-modal">
                        <div className="form-usuario-modal-header">
                            <h2 className="form-usuario-modal-title">
                                {usuarioForm.IdUsuario && usuarioForm.IdUsuario !== '' ? 'Editar Usuario' : 'Registro de Usuario'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-usuario-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-usuario-row three-columns-equal">
                                    <div className="form-usuario-group">
                                        <label htmlFor='Usuario' className="form-usuario-label">Usuario:</label>
                                        <input
                                            type="text"
                                            name="Usuario"
                                            value={usuarioForm.Usuario}
                                            onChange={handleInputChange}
                                            className="form-usuario-input"
                                            placeholder="Nombre de usuario"
                                            required
                                        />
                                    </div>
                                    <div className="form-usuario-group">
                                        <label htmlFor='TipoUsuario' className="form-usuario-label">Tipo de Usuario:</label>
                                        <div className="form-group usuario-search-container">
                                            <div className="usuario-input-wrapper">
                                                <div className="usuario-input-container">
                                                    <ReactSelect optionsData={
                                                        listadoTipoUsuario.map((tipousuario) => ({
                                                            value: tipousuario.IdTipoUsuario,
                                                            label: `${tipousuario.TipoUsuario}`
                                                        }))
                                                    }
                                                        handleChange={(e: {
                                                            value: string;
                                                            label: string;
                                                        }) => {
                                                            handleTipoUsuarioSelect(e)
                                                        }}
                                                        selectedOption={selectedTipoUsuario}
                                                        isClearable={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-usuario-group ">
                                        <label htmlFor='Estatus' className="form-usuario-label">Estatus:</label>
                                        <div className="form-group usuario-search-container">
                                            <div className="usuario-input-wrapper">
                                                <div className="usuario-input-container">
                                                    <ReactSelect optionsData={
                                                        listadoEstatus.map((estatus) => ({
                                                            value: estatus.IdEstatusUsuario,
                                                            label: `${estatus.EstatusUsuario}`
                                                        }))
                                                    }
                                                        handleChange={(e: {
                                                            value: string;
                                                            label: string;
                                                        }) => {
                                                            handleEstatusSelect(e)
                                                        }}
                                                        selectedOption={selectedEstatus}
                                                        isClearable={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-usuario-row three-columns-equal">
                                    <div className="form-usuario-group">
                                        <label htmlFor='Correo' className="form-usuario-label">Correo:</label>
                                        <input
                                            type="email"
                                            name="Correo"
                                            value={usuarioForm.Correo}
                                            onChange={handleInputChange}
                                            className="form-usuario-input"
                                            placeholder="correo@ejemplo.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-usuario-group">
                                        <label htmlFor='NombreColaborador' className="form-usuario-label">Nombre Completo:</label>
                                        <input
                                            type="text"
                                            name="NombreColaborador"
                                            value={usuarioForm.NombreColaborador}
                                            onChange={handleInputChange}
                                            className="form-usuario-input"
                                            placeholder="Nombre completo del colaborador"
                                            required
                                        />
                                    </div>
                                    <div className="form-usuario-group">
                                        <label htmlFor='Almacen' className="form-usuario-label">Almacén:</label>
                                        <div className="form-group usuario-search-container">
                                            <div className="usuario-input-wrapper">
                                                <div className="usuario-input-container">
                                                    <ReactSelect optionsData={
                                                        listadoAlmacen.map((almacen) => ({
                                                            value: almacen.IdAlmacen,
                                                            label: `${almacen.Almacen}`
                                                        }))
                                                    }
                                                        handleChange={(e: {
                                                            value: string;
                                                            label: string;
                                                        }) => {
                                                            handleAlmacenSelect(e)
                                                        }}
                                                        selectedOption={selectedAlmacen}
                                                        isClearable={false}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {!usuarioForm.IdUsuario ? (
                                    <div className="form-usuario-row">
                                        <div className="form-usuario-group">
                                            <label htmlFor='Contrasenia' className="form-usuario-label">Contraseña:</label>
                                            <input
                                                type="password"
                                                name="Contrasenia"
                                                value={usuarioForm.Contrasenia}
                                                onChange={handleInputChange}
                                                className="form-usuario-input"
                                                placeholder="Contraseña inicial"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                <div className="form-usuario-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowForm(false);
                                            resetForm();
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
                </div >
            )}

            {
                showPasswordModal && (
                    <CambioContraseniaModal
                        usuario={selectedUsuario}
                        onClose={() => {
                            setShowPasswordModal(false);
                            setSelectedUsuario(null);
                        }}
                        onSubmit={handleCambiarContrasenia}
                        loading={changingPassword}
                    />
                )
            }
        </div >
    );
};