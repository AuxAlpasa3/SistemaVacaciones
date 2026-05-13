import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Lock, Eye, EyeOff, Filter, ChevronDown, FileDown, Printer, Download, RefreshCw, Search } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import './Usuario.css';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { CatalogoUsuario, OpcionSelect, FiltrosUsuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer } from '../../helpers/date';
import { apiService } from '../../api/apiService';

interface InterfaceTipoUsuario {
    IdTipoUsuario: string;
    TipoUsuario: string;
}

interface InterfaceRol {
    IdRolUsuario: string;
    RolUsuario: string;
}

interface InterfaceUbicacion {
    IdUbicacion: string;
    NomCorto: string;
}

interface InterfacePersonal {
    IdPersonal: string;
    NoEmpleado: string;
    NombreCompleto: string;
    Nombre?: string;
    ApPaterno?: string;
    ApMaterno?: string;
}

// Modal para cambio de contraseña (mantener igual)
const CambioContraseniaModal: React.FC<{
    usuario: CatalogoUsuario | null;
    onClose: () => void;
    onSubmit: (data: { nuevaContrasenia: string; confirmarContrasenia: string }) => void;
    loading: boolean;
}> = ({ usuario, onClose, onSubmit, loading }) => {
    // ... (código del modal sin cambios)
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <Lock size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Cambiar Contraseña - {usuario?.Usuario}
                    </h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">Nueva Contraseña:</label>
                            <div className="password-input-container" style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="nuevaContrasenia"
                                    value={formData.nuevaContrasenia}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Ingresa la nueva contraseña"
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <div className="password-strength" style={{ marginTop: '8px' }}>
                                <div className={`password-strength-bar ${passwordStrength.strength === 1 ? 'weak' :
                                    passwordStrength.strength === 2 ? 'medium' :
                                        passwordStrength.strength === 3 ? 'strong' : ''
                                    }`} style={{ height: '4px', borderRadius: '2px', transition: 'all 0.3s ease' }} />
                            </div>
                            <div className="password-strength-text" style={{ fontSize: '12px', marginTop: '4px' }}>
                                {passwordStrength.text}
                            </div>
                            {errors.nuevaContrasenia && (
                                <div className="error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.nuevaContrasenia}
                                </div>
                            )}
                        </div>

                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label className="form-label">Confirmar Contraseña:</label>
                            <div className="password-input-container" style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmarContrasenia"
                                    value={formData.confirmarContrasenia}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    placeholder="Confirma la nueva contraseña"
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '40px' }}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '10px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.confirmarContrasenia && (
                                <div className="error-message" style={{ color: '#dc3545', fontSize: '12px', marginTop: '4px' }}>
                                    {errors.confirmarContrasenia}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary orange-button"
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

// Componente de botones de acción memoizado
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

export const Usuario: React.FC = () => {
    const [usuarioForm, setUsuarioForm] = useState<CatalogoUsuario>({
        IdUsuario: 0,
        Usuario: '',
        EmpleadoID: 0,
        Descripcion: '',
        TipoUsuario: 0,
        Contrasenia: '',
        Estatus: 0,
        rol: 0,
        Sesion: '',
        UltimaSesion: '',
        CreateDate: '',
        Ubicacion: 0
    });
    
    const [usuarioSesion, setUsuarioSesion] = useState<CatalogoUsuario | null>(null);
    const [usuarios, setUsuarios] = useState<CatalogoUsuario[]>([]);
    const [usuariosFiltrados, setUsuariosFiltrados] = useState<CatalogoUsuario[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUsuario, setSelectedUsuario] = useState<CatalogoUsuario | null>(null);
    const [changingPassword, setChangingPassword] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<string | null>(null);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    
    // Estados para los catálogos
    const [tiposUsuario, setTiposUsuario] = useState<OpcionSelect[]>([]);
    const [roles, setRoles] = useState<OpcionSelect[]>([]);
    const [personal, setPersonal] = useState<OpcionSelect[]>([]);
    const [estatus, setEstatus] = useState<OpcionSelect[]>([
        { id: '1', valor: 'Activo' },
        { id: '0', valor: 'Inactivo' }
    ]);
    const [ubicaciones, setUbicaciones] = useState<OpcionSelect[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [filtros, setFiltros] = useState<FiltrosUsuario>({
        Usuario: '',
        TipoUsuario: '',
        Estatus: '',
        rol: '',
        Ubicacion: '',
        EmpleadoID: '',
        FechaCreacionInicio: '',
        FechaCreacionFin: ''
    });

    const convertirOpciones = useCallback((opciones: OpcionSelect[]): { id: string, valor: string }[] => {
        return opciones.map(opcion => ({
            id: opcion.id.toString(),
            valor: opcion.valor
        }));
    }, []);

    const cargarTiposUsuario = useCallback(async () => {
        try {
            const response = await apiService.get<RespuestaAPI>('Usuarios/Catalogos/ObtenerTipoUsuario.php');
                const tiposData = Array.isArray(response.data) ? response.data : [];
                setTiposUsuario(tiposData.map((t: InterfaceTipoUsuario) => ({ 
                    id: t.IdTipoUsuario.toString(), 
                    valor: t.TipoUsuario 
                })));
        } catch (error) {
            console.error('Error cargando tipos de usuario:', error);
        }
    }, []);

    const cargarRoles = useCallback(async () => {
        try {
            const response = await apiService.get<RespuestaAPI>('Usuarios/Catalogos/ObtenerRoles.php');
                const rolesData = Array.isArray(response.data) ? response.data : [];
                setRoles(rolesData.map((r: InterfaceRol) => ({ 
                    id: r.IdRolUsuario.toString(), 
                    valor: r.RolUsuario 
                })));
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    }, []);

    const cargarUbicaciones = useCallback(async () => {
        try {
            const response = await apiService.get<RespuestaAPI>('Usuarios/Catalogos/ObtenerUbicaciones.php');
             const ubicacionesData = Array.isArray(response.data) ? response.data : [];
                setUbicaciones(ubicacionesData.map((u: InterfaceUbicacion) => ({ 
                    id: u.IdUbicacion.toString(), 
                    valor: u.NomCorto 
                })));
        } catch (error) {
            console.error('Error cargando ubicaciones:', error);
        }
    }, []);

    // Cargar catálogo de personal
    const cargarPersonal = useCallback(async () => {
        try {
            const response = await apiService.get<RespuestaAPI>('/personal/Catalogo.php');
            if (response.status && response.data) {
                const personalData = Array.isArray(response.data) ? response.data : [];
                setPersonal(personalData.map((p: InterfacePersonal) => ({ 
                    id: p.IdPersonal.toString(), 
                    valor: `${p.NoEmpleado} - ${p.NombreCompleto}` 
                })));
            }
        } catch (error) {
            console.error('Error cargando personal:', error);
        }
    }, []);

    const cargarEstatus = useCallback(async () => {
        try {
            const response = await apiService.get<RespuestaAPI>('Usuarios/Catalogos/ObtenerEstatus.php');
            if (response.status && response.data) {
                const estatusData = Array.isArray(response.data) ? response.data : [];
                setEstatus(estatusData.map((e: any) => ({ 
                    id: e.IdEstatus?.toString() || e.IdEstatusUsuario?.toString(), 
                    valor: e.Estatus || e.EstatusUsuario 
                })));
            }
        } catch (error) {
            console.error('Error cargando estatus:', error);
            // Fallback: estatus fijos
            setEstatus([
                { id: '1', valor: 'Activo' },
                { id: '0', valor: 'Inactivo' }
            ]);
        }
    }, []);

    // Cargar todos los catálogos
    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
            await Promise.all([
                cargarTiposUsuario(),
                cargarRoles(),
                cargarUbicaciones(),
                cargarPersonal(),
                cargarEstatus()
            ]);
        } catch (error) {
            console.error('Error cargando opciones:', error);
            showToast({
                text: 'Error al cargar opciones',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setLoadingOptions(false);
        }
    }, [cargarTiposUsuario, cargarRoles, cargarUbicaciones, cargarPersonal, cargarEstatus]);

    // Obtener lista de usuarios
    const fetchUsuarios = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/Usuarios/ObtenerListado.php');
            
            if (response.status && response.data) {
                const usuariosData = Array.isArray(response.data) ? response.data : [];
                setUsuarios(usuariosData);
                setUsuariosFiltrados(usuariosData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar usuarios',
                    type: 'error',
                    autoClose: 1500
                });
                setUsuarios([]);
                setUsuariosFiltrados([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar usuarios',
                type: 'error',
                autoClose: 1500
            });
            setUsuarios([]);
            setUsuariosFiltrados([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Aplicar filtros
    const aplicarFiltros = useCallback(() => {
        let filtrados = [...usuarios];

        if (filtros.Usuario) {
            filtrados = filtrados.filter(u => 
                u.Usuario.toLowerCase().includes(filtros.Usuario.toLowerCase())
            );
        }

        if (filtros.TipoUsuario && filtros.TipoUsuario !== '') {
            filtrados = filtrados.filter(u => u.TipoUsuario === parseInt(filtros.TipoUsuario));
        }

        if (filtros.Estatus && filtros.Estatus !== '') {
            filtrados = filtrados.filter(u => u.Estatus === parseInt(filtros.Estatus));
        }

        if (filtros.rol && filtros.rol !== '') {
            filtrados = filtrados.filter(u => u.rol === parseInt(filtros.rol));
        }

        if (filtros.Ubicacion && filtros.Ubicacion !== '') {
            filtrados = filtrados.filter(u => u.Ubicacion === parseInt(filtros.Ubicacion));
        }

        if (filtros.EmpleadoID && filtros.EmpleadoID !== '') {
            filtrados = filtrados.filter(u => u.EmpleadoID === parseInt(filtros.EmpleadoID));
        }

        if (filtros.FechaCreacionInicio) {
            filtrados = filtrados.filter(u => 
                u.CreateDate && u.CreateDate >= filtros.FechaCreacionInicio
            );
        }
        
        if (filtros.FechaCreacionFin) {
            filtrados = filtrados.filter(u => 
                u.CreateDate && u.CreateDate <= filtros.FechaCreacionFin
            );
        }

        setUsuariosFiltrados(filtrados);
    }, [usuarios, filtros]);

    // Manejar cambios en filtros
    const handleFiltroChange = (campo: keyof FiltrosUsuario, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    // Limpiar filtros
    const limpiarFiltros = () => {
        setFiltros({
            Usuario: '',
            TipoUsuario: '',
            Estatus: '',
            rol: '',
            Ubicacion: '',
            EmpleadoID: '',
            FechaCreacionInicio: '',
            FechaCreacionFin: ''
        });
        setUsuariosFiltrados(usuarios);
    };

    // Obtener texto por ID para catálogos
    const obtenerTextoPorId = useCallback((value: string | number | undefined, opciones: OpcionSelect[]): string => {
        if (!value || value === 0 || value === '0' || value === '') {
            return 'N/A';
        }
        const opcion = opciones.find(op => op.id.toString() === value.toString());
        return opcion ? opcion.valor : value.toString();
    }, []);

    // Obtener texto para personal
    const obtenerTextoPersonal = useCallback((value: string | number | undefined): string => {
        if (!value || value === 0 || value === '0' || value === '') {
            return 'N/A';
        }
        const empleado = personal.find(p => p.id.toString() === value.toString());
        return empleado ? empleado.valor : value.toString();
    }, [personal]);

    // Formatear fecha
    const formatDate = useCallback((date: string) => {
        if (!date) return '';
        return formatDateForServer(date);
    }, []);

    // Columnas de la tabla
    const tableColumns: Column[] = useMemo(() => [
        {
            key: 'IdUsuario',
            title: 'ID',
            sortable: true,
            searchable: true,
            width: '80px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'Usuario',
            title: 'Usuario',
            sortable: true,
            searchable: true,
            width: '150px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'EmpleadoID',
            title: 'Empleado',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => obtenerTextoPersonal(value)
        },
        {
            key: 'Descripcion',
            title: 'Descripción',
            sortable: true,
            searchable: true,
            width: '200px',
            align: 'center',
            headerAlign: 'center'
        },
        {
            key: 'TipoUsuario',
            title: 'Tipo de Usuario',
            sortable: true,
            searchable: true,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => obtenerTextoPorId(value, tiposUsuario)
        },
        {
            key: 'rol',
            title: 'Rol',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => obtenerTextoPorId(value, roles)
        },
        {
            key: 'Ubicacion',
            title: 'Ubicación',
            sortable: true,
            searchable: true,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => obtenerTextoPorId(value, ubicaciones)
        },
        {
            key: 'Estatus',
            title: 'Estatus',
            sortable: true,
            searchable: true,
            width: '100px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string) => {
                let statusText = '';
                let statusClass = '';
                switch (value) {
                    case '1':
                        statusText = 'Activo';
                        statusClass = 'status-active';
                        break;
                    case '0':
                        statusText = 'Inactivo';
                        statusClass = 'status-inactive';
                        break;
                    default:
                        statusText = 'Desconocido';
                        statusClass = 'status-unknown';
                }
                return (
                    <span className={`status-badge ${statusClass}`}>
                        {statusText}
                    </span>
                );
            }
        },
        {
            key: 'UltimaSesion',
            title: 'Última Sesión',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => formatDate(value)
        },
        {
            key: 'CreateDate',
            title: 'Fecha Creación',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => formatDate(value)
        },
        {
            key: 'actions',
            title: 'Acciones',
            sortable: false,
            searchable: false,
            width: '120px',
            align: 'center',
            headerAlign: 'center',
            render: (_, row) => (
                <MemoizedActionButtons
                    row={row}
                    openActionDropdown={openActionDropdown}
                    setOpenActionDropdown={setOpenActionDropdown}
                    onEdit={handleEditUsuario}
                    onDelete={handleDeleteUsuario}
                    onCambiarContrasenia={handleOpenPasswordModal}
                />
            )
        }
    ], [openActionDropdown, tiposUsuario, roles, ubicaciones, personal, obtenerTextoPorId, obtenerTextoPersonal, formatDate]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setUsuarioForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    // Manejar cambios en selects
    const handleSelectChange = useCallback((name: keyof CatalogoUsuario, value: string) => {
        setUsuarioForm(prev => ({
            ...prev,
            [name]: value === '' ? 0 : parseInt(value)
        }));
    }, []);

    // Enviar formulario
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!usuarioForm.Usuario) {
            showToast({ text: 'El nombre de usuario es requerido', type: 'error' });
            return;
        }
        
        try {
            setSubmitting(true);
            const isUpdate = usuarioForm.IdUsuario !== 0;
            
            const dataToSend = {
                ...usuarioForm,
                UsuarioCreacion: usuarioSesion?.IdUsuario
            };
            
            let response: RespuestaAPI;
            
            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/Usuarios/Crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, dataToSend);
            } else {
                response = await apiService.post<RespuestaAPI>(`/Usuarios/Crud.php?IdUsuario=${usuarioSesion?.IdUsuario}`, dataToSend);
            }
            
            if (response.status) {
                showToast({
                    text: response.message || (isUpdate ? 'Usuario actualizado correctamente' : 'Usuario guardado correctamente'),
                    type: 'success',
                    autoClose: 1500
                });
                
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                await fetchUsuarios();
            } else {
                showToast({
                    text: response.message || 'Error al procesar la solicitud',
                    type: 'error',
                    autoClose: 1500
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showToast({
                text: 'Error al procesar la solicitud',
                type: 'error',
                autoClose: 1500
            });
        } finally {
            setSubmitting(false);
        }
    }, [usuarioForm, fetchUsuarios, usuarioSesion]);

    // Cambiar contraseña
    const handleCambiarContrasenia = useCallback(async (data: { nuevaContrasenia: string; confirmarContrasenia: string }) => {
        if (!selectedUsuario) return;

        try {
            setChangingPassword(true);

            const response = await apiService.put<RespuestaAPI>(
                `/Usuarios/CambiarContrasenia.php`,
                { 
                    IdUsuario: selectedUsuario.IdUsuario,
                    IdUsuarioSesion: usuarioSesion?.IdUsuario,
                    Contrasenia: data.nuevaContrasenia 
                }
            );

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
    }, [selectedUsuario, usuarioSesion]);

    // Editar usuario
    const handleEditUsuario = useCallback((usuario: CatalogoUsuario) => {
        setTipoFormulario('Modificar');
        setUsuarioForm({ ...usuario });
        setShowForm(true);
    }, []);

    // Eliminar usuario
    const handleDeleteUsuario = useCallback(async (usuario: CatalogoUsuario) => {
        if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            try {
                const response = await apiService.delete<RespuestaAPI>(
                    `/Usuarios/Crud.php?IdUsuario=${usuario.IdUsuario}&IdUsuarioSesion=${usuarioSesion?.IdUsuario}`
                );

                if (response.status) {
                    showToast({
                        text: 'Usuario eliminado correctamente',
                        type: 'success',
                        autoClose: 1500
                    });
                    await fetchUsuarios();
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
    }, [fetchUsuarios, usuarioSesion]);

    // Abrir modal de cambio de contraseña
    const handleOpenPasswordModal = useCallback((usuario: CatalogoUsuario) => {
        setSelectedUsuario(usuario);
        setShowPasswordModal(true);
    }, []);

    // Resetear formulario
    const resetForm = useCallback(() => {
        setUsuarioForm({
            IdUsuario: 0,
            Usuario: '',
            EmpleadoID: 0,
            Descripcion: '',
            TipoUsuario: 0,
            Contrasenia: '',
            Estatus: 1,
            rol: 0,
            Sesion: '',
            UltimaSesion: '',
            CreateDate: '',
            Ubicacion: 0
        });
        setTipoFormulario('Agregar');
    }, []);

    // Mostrar formulario
    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
    }, [resetForm]);

    // Efectos
    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    useEffect(() => {
        fetchUsuarios();
        cargarOpcionesCatalogos();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchUsuarios, cargarOpcionesCatalogos]);

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
                handleShowForm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showForm, handleShowForm]);

    useEffect(() => {
        document.body.style.overflow = showForm || showPasswordModal ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm, showPasswordModal]);

    return (
        <div className="usuarios-container">
            <div className="usuarios-header">
                <h1 className="page-title-usuarios">Catálogo de Usuarios</h1>
                <div className="action-buttons">
                    <button className="action-btn orange-button" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo Usuario
                    </button>
                </div>
            </div>

            <div className="filtros-container">
                <div className="filtros-basicos">
                    <div className="filtro-group">
                        <label className="filtro-label">Usuario:</label>
                        <input
                            type="text"
                            className="filtro-input"
                            placeholder="Buscar por usuario..."
                            value={filtros.Usuario}
                            onChange={(e) => handleFiltroChange('Usuario', e.target.value)}
                        />
                    </div>

                    <div className="filtro-group">
                        <label className="filtro-label">Tipo Usuario:</label>
                        <SelectConBusqueda
                            options={convertirOpciones(tiposUsuario)}
                            value={filtros.TipoUsuario}
                            onChange={(value) => handleFiltroChange('TipoUsuario', value)}
                            placeholder="Seleccionar tipo de usuario"
                        />
                    </div>

                    <div className="filtro-group">
                        <label className="filtro-label">Estatus:</label>
                        <select
                            className="filtro-select"
                            value={filtros.Estatus}
                            onChange={(e) => handleFiltroChange('Estatus', e.target.value)}
                        >
                            <option value="">TODOS</option>
                            {estatus.map(est => (
                                <option key={est.id} value={est.id}>
                                    {est.valor}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="filtros-avanzados-btn"
                        onClick={() => setShowFiltrosAvanzados(!showFiltrosAvanzados)}
                    >
                        <Filter size={16} />
                        <span>Filtros Avanzados</span>
                        <ChevronDown size={16} className={`chevron ${showFiltrosAvanzados ? 'rotated' : ''}`} />
                    </button>
                </div>

                {showFiltrosAvanzados && (
                    <div className="filtros-avanzados">
                        <div className="filtros-avanzados-grid">
                            <div className="filtro-group">
                                <label className="filtro-label">Rol:</label>
                                <SelectConBusqueda
                                    options={convertirOpciones(roles)}
                                    value={filtros.rol}
                                    onChange={(value) => handleFiltroChange('rol', value)}
                                    placeholder="Seleccionar rol"
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Ubicación:</label>
                                <SelectConBusqueda
                                    options={convertirOpciones(ubicaciones)}
                                    value={filtros.Ubicacion}
                                    onChange={(value) => handleFiltroChange('Ubicacion', value)}
                                    placeholder="Seleccionar ubicación"
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Empleado:</label>
                                <SelectConBusqueda
                                    options={convertirOpciones(personal)}
                                    value={filtros.EmpleadoID}
                                    onChange={(value) => handleFiltroChange('EmpleadoID', value)}
                                    placeholder="Buscar empleado..."
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Creación Inicio:</label>
                                <input
                                    type="date"
                                    className="filtro-input"
                                    value={filtros.FechaCreacionInicio}
                                    onChange={(e) => handleFiltroChange('FechaCreacionInicio', e.target.value)}
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Fecha Creación Fin:</label>
                                <input
                                    type="date"
                                    className="filtro-input"
                                    value={filtros.FechaCreacionFin}
                                    onChange={(e) => handleFiltroChange('FechaCreacionFin', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="filtros-avanzados-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={limpiarFiltros}
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="usuarios-content">
                {loadingOptions && (
                    <div className="loading-options">
                        <span>Cargando opciones...</span>
                    </div>
                )}
                <Tabla
                    columns={tableColumns}
                    data={usuariosFiltrados}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron Usuarios"
                    className="full-height-table"
                    loading={loading}
                />
            </div>

            {/* Modal de formulario */}
            {showForm && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '800px', maxWidth: '90vw' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {tipoFormulario === 'Modificar' ? 'Editar Usuario' : 'Registro de Usuario'}
                            </h3>
                            <button className="modal-close" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-grid" style={{ display: 'grid', gap: '20px' }}>
                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label htmlFor='Usuario' className="form-label required">Usuario:</label>
                                            <input
                                                type="text"
                                                name="Usuario"
                                                id="Usuario"
                                                value={usuarioForm.Usuario}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Nombre de usuario"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor='EmpleadoID' className="form-label">Empleado:</label>
                                            <SelectConBusqueda
                                                options={convertirOpciones(personal)}
                                                value={usuarioForm.EmpleadoID?.toString() || ''}
                                                onChange={(value) => handleSelectChange('EmpleadoID', value)}
                                                placeholder="Buscar empleado..."
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label htmlFor='TipoUsuario' className="form-label">Tipo de Usuario:</label>
                                            <SelectConBusqueda
                                                options={convertirOpciones(tiposUsuario)}
                                                value={usuarioForm.TipoUsuario?.toString() || ''}
                                                onChange={(value) => handleSelectChange('TipoUsuario', value)}
                                                placeholder="Seleccionar tipo de usuario"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor='rol' className="form-label">Rol:</label>
                                            <SelectConBusqueda
                                                options={convertirOpciones(roles)}
                                                value={usuarioForm.rol?.toString() || ''}
                                                onChange={(value) => handleSelectChange('rol', value)}
                                                placeholder="Seleccionar rol"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="form-group">
                                            <label htmlFor='Ubicacion' className="form-label">Ubicación:</label>
                                            <SelectConBusqueda
                                                options={convertirOpciones(ubicaciones)}
                                                value={usuarioForm.Ubicacion?.toString() || ''}
                                                onChange={(value) => handleSelectChange('Ubicacion', value)}
                                                placeholder="Seleccionar ubicación"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor='Estatus' className="form-label">Estatus:</label>
                                            <select
                                                name="Estatus"
                                                id="Estatus"
                                                value={usuarioForm.Estatus}
                                                onChange={handleInputChange}
                                                className="form-select"
                                            >
                                                {estatus.map(est => (
                                                    <option key={est.id} value={est.id}>
                                                        {est.valor}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor='Descripcion' className="form-label">Descripción:</label>
                                        <textarea
                                            name="Descripcion"
                                            id="Descripcion"
                                            value={usuarioForm.Descripcion || ''}
                                            onChange={handleInputChange}
                                            className="form-input"
                                            placeholder="Descripción del usuario"
                                            rows={3}
                                            style={{ resize: 'vertical' }}
                                        />
                                    </div>

                                    {!usuarioForm.IdUsuario && (
                                        <div className="form-group">
                                            <label htmlFor='Contrasenia' className="form-label required">Contraseña:</label>
                                            <input
                                                type="password"
                                                name="Contrasenia"
                                                id="Contrasenia"
                                                value={usuarioForm.Contrasenia || ''}
                                                onChange={handleInputChange}
                                                className="form-input"
                                                placeholder="Contraseña inicial"
                                                required
                                                minLength={6}
                                            />
                                            <small style={{ fontSize: '12px', color: '#666', marginTop: '4px', display: 'block' }}>
                                                Mínimo 6 caracteres
                                            </small>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
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
                                        className="btn btn-primary orange-button"
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

            {/* Modal de cambio de contraseña */}
            {showPasswordModal && (
                <CambioContraseniaModal
                    usuario={selectedUsuario}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setSelectedUsuario(null);
                    }}
                    onSubmit={handleCambiarContrasenia}
                    loading={changingPassword}
                />
            )}
        </div>
    );
};