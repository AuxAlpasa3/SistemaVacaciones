import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Plus, X, FileText, Edit, Trash2, MoreVertical, Filter, ChevronDown, FileDown, Printer, Download, Upload, Eye, RefreshCw } from 'lucide-react';
import { Tabla } from '../../components/Tabla/Tabla';
import type { Column } from '../../components/Tabla/Tabla';
import { SelectConBusqueda } from '../../components/Select/SelectConBusqueda';
import { SelectConBusquedayCrear } from '../../components/Select/SelectConBusquedayCrear';
import './personal.css';
import type { Interfacepersonal, OpcionSelect } from '../../interfaces/Personal';
import type { FiltrosPersonal } from '../../interfaces/Personal';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { Usuario } from '../../interfaces/Usuario';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import { showToast } from '../../helpers/toast';
import { formatDateForServer } from '../../helpers/date';
import { apiService } from '../../api/apiService';
import { useNavigate } from 'react-router-dom';

const CambioEstatusModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    personal: Interfacepersonal | null;
    onConfirm: (nuevoEstatus: string) => void;
    loading?: boolean;
}> = ({ visible, onClose, personal, onConfirm, loading = false }) => {
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        if (visible && personal) {
            setSelectedStatus(personal.Status);
        }
    }, [visible, personal]);

    if (!visible) return null;

    const statusOptions = [
        { value: '1', label: 'Activo', color: '#28A745', description: 'Personal activo y operativo' },
        { value: '0', label: 'Inactivo', color: '#DC3545', description: 'Personal inactivo temporalmente' },
        { value: '2', label: 'Desactivado', color: '#6C757D', description: 'Personal dado de baja definitivamente' }
    ];

    const handleConfirm = () => {
        if (selectedStatus && onConfirm) {
            onConfirm(selectedStatus);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ width: '500px', maxWidth: '90vw' }}>
                <div className="modal-header">
                    <h3 className="modal-title">Cambiar Estatus de Personal</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ marginBottom: '8px', fontWeight: '500' }}>
                            Personal: <strong>{personal?.NombreCompleto}</strong>
                        </p>
                        <p style={{ marginBottom: '16px', fontSize: '14px', color: '#666' }}>
                            No. Empleado: {personal?.NoEmpleado}
                        </p>
                    </div>

                    <div className="status-options-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {statusOptions.map(option => (
                            <label
                                key={option.value}
                                className={`status-option ${selectedStatus === option.value ? 'selected' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    border: `2px solid ${selectedStatus === option.value ? option.color : '#E0E0E0'}`,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    backgroundColor: selectedStatus === option.value ? `${option.color}10` : 'white'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="estatus"
                                    value={option.value}
                                    checked={selectedStatus === option.value}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    style={{ marginRight: '12px', accentColor: option.color }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', color: option.color }}>
                                        {option.label}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                        {option.description}
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary orange-button"
                        onClick={handleConfirm}
                        disabled={loading || selectedStatus === personal?.Status}
                        style={{ background: '#E85C0D' }}
                    >
                        {loading ? 'Cambiando...' : 'Cambiar Estatus'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PhotoModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
    personalName: string;
}> = ({ isOpen, onClose, imageUrl, personalName }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="photo-modal-overlay" onClick={onClose}>
            <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="photo-modal-header">
                    <h3 className="photo-modal-title">Foto de {personalName}</h3>
                    <button className="photo-modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="photo-modal-body">
                    <img 
                        src={imageUrl} 
                        alt={`Foto de ${personalName}`}
                        className="photo-modal-image"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3E%3Crect x="2" y="3" width="20" height="20" rx="2" ry="2"%3E%3C/rect%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"%3E%3Ccircle%3E%3Cpolyline points="21 15 16 10 5 21"%3E%3C/polyline%3E%3C/svg%3E';
                        }}
                    />
                </div>
                <div className="photo-modal-footer">
                    <button className="photo-modal-button" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

const PhotoCell: React.FC<{ value: string; personalName: string }> = ({ value, personalName }) => {
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handlePhotoClick = () => {
        if (value && !imageError) {
            setIsModalOpen(true);
        }
    };

    const API_URL = import.meta.env.VITE_API_BASE_URL_PROD;
    const imageUrl = value && !value.startsWith('http') && !value.startsWith('data:') 
        ? `${API_URL}/${value}` 
        : value;

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {imageUrl && !imageError ? (
                    <div style={{ position: 'relative' }}>
                        {imageLoading && (
                            <div style={{
                                width: '50px',
                                height: '50px',
                                backgroundColor: '#f0f0f0',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <div className="photo-spinner" style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid #f3f3f3',
                                    borderTop: '2px solid #ff6b35',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            </div>
                        )}
                        <img
                            src={imageUrl}
                            alt={`Foto de ${personalName}`}
                            style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: imageLoading ? 'none' : 'block',
                                transition: 'transform 0.2s ease',
                                border: '1px solid #e0e0e0'
                            }}
                            onLoad={() => setImageLoading(false)}
                            onError={() => {
                                setImageLoading(false);
                                setImageError(true);
                            }}
                            onClick={handlePhotoClick}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        />
                    </div>
                ) : (
                    <div style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        color: '#999',
                        textAlign: 'center',
                        border: '1px solid #e0e0e0'
                    }}>
                        {imageError ? 'Error' : 'Sin foto'}
                    </div>
                )}
            </div>

            <PhotoModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={imageUrl}
                personalName={personalName}
            />
        </>
    );
};

const MemoizedActionButtons = React.memo(({
    row,
    openActionDropdown,
    setOpenActionDropdown,
    onView,
    onEdit,
    onCambiarEstatus
}: {
    row: any,
    openActionDropdown: number | null,
    setOpenActionDropdown: (IdPersonal: number | null) => void,
    onView: (row: any) => void,
    onEdit: (row: any) => void,
    onCambiarEstatus: (row: any) => void
}) => (
    <div className="actions-dropdown-container">
        <button
            className="actions-dropdown-trigger"
            onClick={(e) => {
                e.stopPropagation();
                setOpenActionDropdown(openActionDropdown === row.IdPersonal ? null : row.IdPersonal);
            }}
            title="Más acciones"
        >
            <MoreVertical size={16} color='black' />
        </button>

        {openActionDropdown === row.IdPersonal && (
            <div className="actions-dropdown-menu">
                <button 
                    className="actions-dropdown-item view-action" 
                    onClick={() => { 
                        onView(row); 
                        setOpenActionDropdown(null); 
                    }}
                >
                    <Eye size={14} />
                    <span>Ver</span>
                </button>
                <div className="actions-dropdown-divider"></div>
                <button 
                    className="actions-dropdown-item edit-action" 
                    onClick={() => { 
                        onEdit(row); 
                        setOpenActionDropdown(null); 
                    }}
                >
                    <Edit size={14} />
                    <span>Editar</span>
                </button>
                <div className="actions-dropdown-divider"></div>
                <button 
                    className="actions-dropdown-item change-status-action" 
                    onClick={() => { 
                        onCambiarEstatus(row); 
                        setOpenActionDropdown(null); 
                    }}
                >
                    <RefreshCw size={14} />
                    <span>Cambiar Estatus</span>
                </button>
            </div>
        )}
    </div>
));

export const Personal: React.FC = () => {
    const navigate = useNavigate();

    const [personalForm, setPersonalForm] = useState<Interfacepersonal>({
        IdPersonal: 0,
        NoEmpleado: 0,
        NombreCompleto: '',
        Nombre: '',
        ApPaterno: '',
        ApMaterno: '',
        FechaIngreso: '',
        Cargo: '',
        Departamento: '',
        Empresa: '',
        Status: '',
        IdUbicacion: '',
        RutaFoto: '',
        Email: '',
        Contacto: '',
        IdSupervisor: '',
        TipoSangre: '',
        FechaCreacion: '',
        NSS: '',
        EsSupervisor: 'NO'
    });
    
    const [fechaIngresoDisplay, setFechaIngresoDisplay] = useState('');
    
    const [usuarioSesion, setUsuarioSesion] = useState<Usuario | null>(null);
    const [personal, setPersonal] = useState<Interfacepersonal[]>([]);
    const [personalFiltrados, setPersonalFiltrados] = useState<Interfacepersonal[]>([]);
    const [loading, setLoading] = useState(false);
    const [tipoFormulario, setTipoFormulario] = useState('Agregar');
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [openActionDropdown, setOpenActionDropdown] = useState<number | null>(null);
    const [previewFoto, setPreviewFoto] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showFiltrosAvanzados, setShowFiltrosAvanzados] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [cargos, setCargos] = useState<OpcionSelect[]>([]);
    const [departamentos, setDepartamentos] = useState<OpcionSelect[]>([]);
    const [empresas, setEmpresas] = useState<OpcionSelect[]>([]);
    const [ubicaciones, setUbicaciones] = useState<OpcionSelect[]>([]);
    const [supervisores, setSupervisores] = useState<OpcionSelect[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    const [creatingNewOption, setCreatingNewOption] = useState<{type: string, value: string} | null>(null);
    const [filtros, setFiltros] = useState<FiltrosPersonal>({
        NoEmpleado: 0,
        NombreCompleto: '',
        FechaCreacionInicio: '',
        FechaCreacionFin: '',
        Status: '',
        Empresa: '',
        Departamento: '',
        Cargo: '',
        IdSupervisor: '',
        EsSupervisor: ''
    });

    const [cambioEstatusModalVisible, setCambioEstatusModalVisible] = useState(false);
    const [personalCambioEstatus, setPersonalCambioEstatus] = useState<Interfacepersonal | null>(null);
    const [cambiandoEstatus, setCambiandoEstatus] = useState(false);

    // Sincronizar fecha display cuando cambia FechaIngreso en el formulario
    useEffect(() => {
        if (personalForm.FechaIngreso) {
            setFechaIngresoDisplay(formatDateForServer(personalForm.FechaIngreso));
        } else {
            setFechaIngresoDisplay('');
        }
    }, [personalForm.FechaIngreso]);

    const cargarOpcionesCatalogos = useCallback(async () => {
        try {
            setLoadingOptions(true);
            
            const [cargosResponse, departamentosResponse, empresasResponse, 
                    ubicacionesResponse, supervisoresResponse] = await Promise.all([
                apiService.get<RespuestaAPI>('/personal/opciones/ObtenerCargos.php'),
                apiService.get<RespuestaAPI>('/personal/opciones/ObtenerDepartamentos.php'),
                apiService.get<RespuestaAPI>('/personal/opciones/ObtenerEmpresas.php'),
                apiService.get<RespuestaAPI>('/personal/opciones/ObtenerUbicaciones.php'),
                apiService.get<RespuestaAPI>('/personal/opciones/ObtenerSupervisores.php')
            ]);

            if (cargosResponse.status && cargosResponse.data) {
                const cargosData = Array.isArray(cargosResponse.data) ? cargosResponse.data : [];
                setCargos(cargosData.map((c: any) => ({ 
                    id: c.id?.toString() || c.IdCargo?.toString() || '', 
                    valor: c.Cargo || c.valor || c.descripcion || '' 
                })));
            }

            if (departamentosResponse.status && departamentosResponse.data) {
                const deptosData = Array.isArray(departamentosResponse.data) ? departamentosResponse.data : [];
                setDepartamentos(deptosData.map((d: any) => ({ 
                    id: d.id?.toString() || d.IdDepartamento?.toString() || '', 
                    valor: d.Departamento || d.valor || d.descripcion || '' 
                })));
            }

            if (empresasResponse.status && empresasResponse.data) {
                const empresasData = Array.isArray(empresasResponse.data) ? empresasResponse.data : [];
                setEmpresas(empresasData.map((e: any) => ({ 
                    id: e.id?.toString() || e.IdEmpresa?.toString() || '', 
                    valor: e.Empresa || e.valor || e.descripcion || '' 
                })));
            }

            if (ubicacionesResponse.status && ubicacionesResponse.data) {
                const ubicacionesData = Array.isArray(ubicacionesResponse.data) ? ubicacionesResponse.data : [];
                setUbicaciones(ubicacionesData.map((u: any) => ({ 
                    id: u.id?.toString() || u.IdUbicacion?.toString() || '', 
                    valor: u.Ubicacion || u.valor || u.descripcion || '' 
                })));
            }

            if (supervisoresResponse.status && supervisoresResponse.data) {
                const supervisoresData = Array.isArray(supervisoresResponse.data) ? supervisoresResponse.data : [];
                setSupervisores(supervisoresData.map((s: any) => ({ 
                    id: s.id || s.IdPersonal || '', 
                    valor: s.NombreCompleto || s.valor || s.descripcion || '' 
                })));
            }

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
    }, []);

    const handleSelectChange = useCallback((name: keyof Interfacepersonal, value: string) => {
        setPersonalForm(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleCreateNewOption = useCallback(async (type: string, value: string): Promise<boolean> => {
        try {
            setCreatingNewOption({ type, value });
            
            let endpoint = '';
            let data: any = { valor: value };
            
            switch (type) {
                case 'Cargo':
                    endpoint = `/personal/crear/Cargo.php?IdUsuario=${usuarioSesion?.IdUsuario}`;
                    data = { Cargo: value };
                    break;
                case 'Departamento':
                    endpoint = `/personal/crear/Departamento.php?IdUsuario=${usuarioSesion?.IdUsuario}`;
                    data = { Departamento: value };
                    break;
                case 'Empresa':
                    endpoint = `/personal/crear/Empresa.php?IdUsuario=${usuarioSesion?.IdUsuario}`;
                    data = { Empresa: value };
                    break;
                default:
                    return false;
            }
            
            const response = await apiService.post<RespuestaAPI>(endpoint, data);
            
            if (response.status && response.data) {
                showToast({
                    text: `${type} creado exitosamente`,
                    type: 'success',
                    autoClose: 1500
                });
                
                await cargarOpcionesCatalogos();
                
                setTimeout(() => {
                    let nuevaLista: OpcionSelect[] = [];
                    switch (type) {
                        case 'Cargo':
                            nuevaLista = cargos;
                            break;
                        case 'Departamento':
                            nuevaLista = departamentos;
                            break;
                        case 'Empresa':
                            nuevaLista = empresas;
                            break;
                    }
                    
                    const nuevoElemento = nuevaLista.find(item => 
                        item.valor.toLowerCase() === value.toLowerCase()
                    );
                    
                    if (nuevoElemento) {
                        switch (type) {
                            case 'Cargo':
                                handleSelectChange('Cargo', nuevoElemento.id.toString());
                                break;
                            case 'Departamento':
                                handleSelectChange('Departamento', nuevoElemento.id.toString());
                                break;
                            case 'Empresa':
                                handleSelectChange('Empresa', nuevoElemento.id.toString());
                                break;
                        }
                    }
                }, 100);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error creando ${type}:`, error);
            showToast({
                text: `Error al crear ${type}`,
                type: 'error',
                autoClose: 1500
            });
            return false;
        } finally {
            setCreatingNewOption(null);
        }
    }, [cargarOpcionesCatalogos, usuarioSesion, cargos, departamentos, empresas, handleSelectChange]);

    const obtenerTextoPorId = useCallback((value: string | number, opciones: OpcionSelect[]): string => {
        if (value === 0 || value === '0' || value === '' || value === null) {
            return 'N/A';
        }
        const opcion = opciones.find(op => op.id.toString() === value.toString());
        return opcion ? opcion.valor : value.toString();
    }, []);

    const uploadPhoto = useCallback(async (file: File, idPersonal: number, nombreCompleto: string, noEmpleado: number): Promise<string | null> => {
        try {
            setUploadingPhoto(true);
            const formData = new FormData();
            
            const extension = file.name.split('.').pop();
            const nombreLimpio = nombreCompleto
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9]/g, '_');
            const nuevoNombre = `${noEmpleado}_${nombreLimpio}.${extension}`;
            
            const modifiedFile = new File([file], nuevoNombre, { type: file.type });
            formData.append('foto', modifiedFile);
            formData.append('IdPersonal', idPersonal.toString());
            formData.append('nombreArchivo', nuevoNombre);
            
            const API_URL = import.meta.env.VITE_API_BASE_URL_PROD;
            const response = await fetch(`${API_URL}/personal/actualizarFoto.php`, {
                method: 'POST',
                body: formData,
            });
            
            const result = await response.json();
            
            if (result.status && result.data && result.data.ruta) {
                return result.data.ruta;
            } else {
                showToast({
                    text: result.message || 'Error al subir la foto',
                    type: 'error',
                    autoClose: 3000
                });
                return null;
            }
        } catch (error) {
            console.error('Error al subir foto:', error);
            showToast({
                text: 'Error al subir la foto',
                type: 'error',
                autoClose: 3000
            });
            return null;
        } finally {
            setUploadingPhoto(false);
        }
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                showToast({
                    text: 'Solo se permiten imágenes (JPG, PNG, GIF)',
                    type: 'error',
                    autoClose: 3000
                });
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast({
                    text: 'La imagen no debe exceder los 5MB',
                    type: 'error',
                    autoClose: 3000
                });
                return;
            }
            
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewFoto(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const aplicarFiltros = useCallback(() => {
        let filtrados = [...personal];

        if (filtros.NoEmpleado) {
            filtrados = filtrados.filter(p => 
                p.NoEmpleado.toString().toLowerCase().includes(filtros.NoEmpleado.toString().toLowerCase())
            );
        }

        if (filtros.NombreCompleto) {
            filtrados = filtrados.filter(p => 
                p.NombreCompleto.toLowerCase().includes(filtros.NombreCompleto.toLowerCase())
            );
        }

        if (filtros.FechaCreacionInicio) {
            filtrados = filtrados.filter(p => 
                p.FechaCreacion && p.FechaCreacion >= filtros.FechaCreacionInicio
            );
        }
        if (filtros.FechaCreacionFin) {
            filtrados = filtrados.filter(p => 
                p.FechaCreacion && p.FechaCreacion <= filtros.FechaCreacionFin
            );
        }

        if (filtros.Status) {
            filtrados = filtrados.filter(p => p.Status === filtros.Status);
        }

        if (filtros.Empresa && filtros.Empresa !== '0') {
            filtrados = filtrados.filter(p => p.Empresa?.toString() === filtros.Empresa);
        }

        if (filtros.Departamento && filtros.Departamento !== '0') {
            filtrados = filtrados.filter(p => p.Departamento?.toString() === filtros.Departamento);
        }

        if (filtros.Cargo && filtros.Cargo !== '0') {
            filtrados = filtrados.filter(p => p.Cargo?.toString() === filtros.Cargo);
        }

        if (filtros.IdSupervisor && filtros.IdSupervisor !== '0') {
            filtrados = filtrados.filter(p => 
                p.IdSupervisor && p.IdSupervisor.toString() === filtros.IdSupervisor
            );
        }

        setPersonalFiltrados(filtrados);
    }, [personal, filtros]);

    const handleFiltroChange = (campo: keyof FiltrosPersonal, valor: string) => {
        setFiltros(prev => ({
            ...prev,
            [campo]: valor
        }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            NoEmpleado: 0,
            NombreCompleto: '',
            FechaCreacionInicio: '',
            FechaCreacionFin: '',
            Status: '',
            Empresa: '',
            Departamento: '',
            Cargo: '',
            IdSupervisor: '',
            EsSupervisor: ''
        });
        setPersonalFiltrados(personal);
    };

    const exportarExcel = useCallback(() => {
        if (personalFiltrados.length === 0) {
            showToast({
                text: 'No hay datos para exportar',
                type: 'warning',
                autoClose: 3000
            });
            return;
        }

        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.append(key, value.toString());
            }
        });
        
        const API = import.meta.env.VITE_API_BASE_URL_PROD;
        window.open(`${API}/personal/ExportarExcel.php?${params.toString()}`, '_blank');
        
        showToast({
            text: 'Generando archivo Excel...',
            type: 'success',
            autoClose: 3000
        });
    }, [filtros, personalFiltrados]);

    const exportarPDF = useCallback(() => {
        if (personalFiltrados.length === 0) {
            showToast({
                text: 'No hay datos para exportar',
                type: 'warning',
                autoClose: 3000
            });
            return;
        }

        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.append(key, value.toString());
            }
        });
        
        const API = import.meta.env.VITE_API_BASE_URL_PROD;
        window.open(`${API}/personal/ExportarPDF.php?${params.toString()}`, '_blank');
        
        showToast({
            text: 'Generando archivo PDF...',
            type: 'success',
            autoClose: 3000
        });
    }, [filtros, personalFiltrados]);

    const imprimirDirecto = useCallback(() => {
        if (personalFiltrados.length === 0) {
            showToast({
                text: 'No hay datos para imprimir',
                type: 'warning',
                autoClose: 3000
            });
            return;
        }

        const params = new URLSearchParams();
        Object.entries(filtros).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.append(key, value.toString());
            }
        });
        
        const API = import.meta.env.VITE_API_BASE_URL_PROD;
        window.open(`${API}/personal/Imprimir.php?${params.toString()}`, '_blank');
        
        showToast({
            text: 'Preparando impresión...',
            type: 'success',
            autoClose: 3000
        });
    }, [filtros, personalFiltrados]);

    const fetchPersonal = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiService.get<RespuestaAPI>('/personal/Catalogo.php');
            if (response.status && response.data) {
                const catalogosData = response.data as Interfacepersonal[];
                setPersonal(catalogosData);
                setPersonalFiltrados(catalogosData);
            } else {
                showToast({
                    text: response.message || 'Error al cargar personal',
                    type: 'error',
                    autoClose: 1500
                });
                setPersonal([]);
                setPersonalFiltrados([]);
            }
        } catch (error) {
            showToast({
                text: 'Error al cargar personal',
                type: 'error',
                autoClose: 1500
            });
            setPersonal([]);
            setPersonalFiltrados([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleViewPersonal = useCallback(async (personal: Interfacepersonal) => {
        navigate(`/Catalogos/VerDetallePersonal/01_${personal.NoEmpleado}`);
    }, [navigate]);

    const handleEditPersonal = useCallback((personal: Interfacepersonal) => {
        setTipoFormulario('Modificar');
        setPersonalForm({
            ...personal,
            FechaIngreso: personal.FechaIngreso || ''
        });
        setFechaIngresoDisplay(formatDateForServer(personal.FechaIngreso || ''));
        setPreviewFoto(personal.RutaFoto || '');
        setShowForm(true);
    }, []);

    const handleCambiarEstatus = useCallback((personal: Interfacepersonal) => {
        setPersonalCambioEstatus(personal);
        setCambioEstatusModalVisible(true);
    }, []);

    const handleConfirmarCambioEstatus = useCallback(async (nuevoEstatus: string) => {
        if (!personalCambioEstatus) return;
        
        if (!usuarioSesion?.IdUsuario) {
            showToast({
                text: 'No se pudo obtener la información del usuario',
                type: 'error',
                autoClose: 3000
            });
            return;
        }
        
        try {
            setCambiandoEstatus(true);
            const response = await apiService.put<RespuestaAPI>(
                `/personal/cambiarEstatus.php?IdPersonal=${personalCambioEstatus.IdPersonal}&Status=${nuevoEstatus}&IdUsuario=${usuarioSesion.IdUsuario}`,
                {}
            );

            if (response.status) {
                const statusText = nuevoEstatus === '1' ? 'activado' : (nuevoEstatus === '0' ? 'desactivado temporalmente' : 'desactivado permanentemente');
                showToast({
                    text: `Personal ${statusText} correctamente`,
                    type: 'success',
                    autoClose: 3000
                });
                await fetchPersonal();
                setCambioEstatusModalVisible(false);
                setPersonalCambioEstatus(null);
            } else {
                showToast({
                    text: response.message || 'Error al cambiar estatus',
                    type: 'error',
                    autoClose: 3000
                });
            }
        } catch (error) {
            console.error('Error en cambio de estatus:', error);
            showToast({
                text: 'Error al cambiar estatus',
                type: 'error',
                autoClose: 3000
            });
        } finally {
            setCambiandoEstatus(false);
        }
    }, [personalCambioEstatus, fetchPersonal, usuarioSesion]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'FechaIngreso') {
            // Validar formato dd/mm/aaaa
            if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value) && value !== '') {
                showToast({
                    text: 'Formato de fecha inválido. Use dd/mm/aaaa',
                    type: 'error',
                    autoClose: 3000
                });
                return;
            }
            
            // Guardar el valor mostrado en el estado display
            setFechaIngresoDisplay(value);
            
            // Convertir a formato ISO (yyyy-mm-dd) para el formulario
            const isoDate = formatDateForServer(value);
            setPersonalForm((prev: any) => ({
                ...prev,
                [name]: isoDate
            }));
        } else {
            setPersonalForm((prev: any) => ({
                ...prev,
                [name]: name === 'NoEmpleado' ? (value === '' ? 0 : parseInt(value) || 0) : value
            }));
        }
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!personalForm.NoEmpleado) {
            showToast({ text: 'El número de empleado es requerido', type: 'error' });
            return;
        }
        
        const nombreCompleto = `${personalForm.Nombre || ''} ${personalForm.ApPaterno || ''} ${personalForm.ApMaterno || ''}`.trim();
        
        try {
            setSubmitting(true);
            const isUpdate = personal.some(p => p.IdPersonal === personalForm.IdPersonal);
            let response: RespuestaAPI;
            
            const dataToSend = {
                ...personalForm,
                UsuarioCreacion: usuarioSesion?.IdUsuario,
                RutaFoto: selectedFile ? '' : personalForm.RutaFoto
            };
            
            if (isUpdate) {
                response = await apiService.put<RespuestaAPI>(`/personal/crud.php`, dataToSend);
            } else {
                response = await apiService.postForm<RespuestaAPI>(`/personal/crud.php`, dataToSend);
            }
            
            if (response.status) {
                if (selectedFile) {
                    let idPersonal = personalForm.IdPersonal;
                    let nombreCompletoFoto = nombreCompleto;
                    let noEmpleado = personalForm.NoEmpleado;
                    
                    if (!isUpdate && response.data && (response.data as any).IdPersonal) {
                        idPersonal = (response.data as any).IdPersonal;
                    }
                    
                    if (!nombreCompletoFoto && personalForm.NombreCompleto) {
                        nombreCompletoFoto = personalForm.NombreCompleto;
                    }
                    
                    const ruta = await uploadPhoto(selectedFile, idPersonal, nombreCompletoFoto, personalForm.NoEmpleado);
                    if (ruta) {
                        setPersonalForm(prev => ({ ...prev, RutaFoto: ruta }));
                    }
                }
                
                showToast({
                    text: response.message || (isUpdate ? 'Personal actualizado correctamente' : 'Personal guardado correctamente'),
                    type: 'success',
                    autoClose: 1500
                });
                
                setShowForm(false);
                resetForm();
                setTipoFormulario('Agregar');
                fetchPersonal();
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
    }, [personalForm, personal, fetchPersonal, usuarioSesion, selectedFile, uploadPhoto]);

    const resetForm = useCallback(() => {
        setPersonalForm({
            IdPersonal: 0,
            NoEmpleado: 0,
            NombreCompleto: '',
            Nombre: '',
            ApPaterno: '',
            ApMaterno: '',
            FechaIngreso: '',
            Cargo: '',
            Departamento: '',
            Empresa: '',
            Status: '',
            IdUbicacion: '',
            RutaFoto: '',
            Email: '',
            Contacto: '',
            IdSupervisor: '',
            TipoSangre: '',
            FechaCreacion: '',
            NSS: '',
            EsSupervisor: 'NO'
        });
        setFechaIngresoDisplay('');
        setPreviewFoto('');
        setSelectedFile(null);
        setTipoFormulario('Agregar');
    }, []);

    const handleShowForm = useCallback(() => {
        resetForm();
        setShowForm(true);
        setTipoFormulario('Agregar');
    }, [resetForm]);

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

    const tableColumns: Column[] = useMemo(() => [
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
            key: 'RutaFoto',
            title: 'Foto',
            sortable: true,
            searchable: false,
            width: '100px',
            align: 'center',
            headerAlign: 'center',
            render: (value: string, row: Interfacepersonal) => (
                <PhotoCell value={value} personalName={row.NombreCompleto} />
            )
        }, 
        {
            key: 'NombreCompleto',
            title: 'Nombre Completo',
            sortable: true,
            searchable: false,
            width: '250px',
            align: 'center',
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
            render: (value: string) => formatDateForServer(value)
        },
        {
            key: 'Cargo',
            title: 'Cargo',
            sortable: true,
            searchable: false,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => obtenerTextoPorId(value, cargos)
        },
        {
            key: 'Departamento',
            title: 'Departamento',
            sortable: true,
            searchable: false,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => obtenerTextoPorId(value, departamentos)
        },
        {
            key: 'Empresa',
            title: 'Empresa',
            sortable: true,
            searchable: false,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => obtenerTextoPorId(value, empresas)
        },
        {
            key: 'IdUbicacion',
            title: 'Ubicacion',
            sortable: true,
            searchable: false,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => obtenerTextoPorId(value, ubicaciones)
        },
        {
            key: 'IdSupervisor',
            title: 'Supervisor',
            sortable: true,
            searchable: false,
            width: '200px',
            align: 'center',
            headerAlign: 'center',
            render: (value: number) => obtenerTextoPorId(value, supervisores)
        },
        {
            key: 'Status',
            title: 'Estatus',
            sortable: true,
            searchable: false,
            width: '120px',
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
                    case '2':
                        statusText = 'Desactivado';
                        statusClass = 'status-desactivado';
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
            key: 'FechaCreacion',
            title: 'Fecha Creación',
            sortable: true,
            searchable: false,
            width: '150px',
            align: 'center',
            headerAlign: 'center',
            render: (value) => formatDateForServer(value)
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
                    onView={handleViewPersonal}
                    onEdit={handleEditPersonal}
                    onCambiarEstatus={handleCambiarEstatus}
                />
            )
        }
    ], [openActionDropdown, cargos, departamentos, empresas, ubicaciones, supervisores, obtenerTextoPorId, handleViewPersonal, handleEditPersonal, handleCambiarEstatus]);

    useEffect(() => {
        aplicarFiltros();
    }, [aplicarFiltros]);

    useEffect(() => {
        fetchPersonal();
        cargarOpcionesCatalogos();
        const usuario = obtenerUsuarioSesion();
        setUsuarioSesion(usuario);
    }, [fetchPersonal, cargarOpcionesCatalogos]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionDropdown !== null && !(event.target as HTMLElement).closest('.actions-dropdown-container')) {
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
        document.body.style.overflow = showForm ? 'hidden' : 'auto';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [showForm]);

    return (
        <div className="personal-container">
            <div className="personal-header">
                <h1 className="page-title-personal">Catálogo de Personal</h1>
                <div className="action-buttons">
                    <button 
                        className="action-btn" 
                        onClick={exportarExcel}
                        disabled={personalFiltrados.length === 0}
                        style={{ background: '#1976D2' }}
                        title="Exportar a Excel"
                    >
                        <FileDown size={18} />
                        <span>Excel</span>
                    </button>
                    
                    <button 
                        className="action-btn" 
                        onClick={exportarPDF}
                        disabled={personalFiltrados.length === 0}
                        style={{ background: '#DC3545' }}
                        title="Exportar a PDF"
                    >
                        <Download size={18} />
                        <span>PDF</span>
                    </button>

                    <button 
                        className="action-btn" 
                        onClick={imprimirDirecto}
                        disabled={personalFiltrados.length === 0}
                        style={{ background: '#28A745' }}
                        title="Imprimir directamente"
                    >
                        <Printer size={18} />
                        <span>Imprimir</span>
                    </button>

                    <button className="action-btn orange-button" onClick={handleShowForm}>
                        <Plus size={18} />
                        Nuevo personal
                    </button>
                </div>
            </div>

            <div className="filtros-container">
                <div className="filtros-basicos">
                    <div className="filtro-group">
                        <label className="filtro-label">No. Empleado:</label>
                        <input
                            type="text"
                            className="filtro-input"
                            placeholder="Buscar por número..."
                            value={filtros.NoEmpleado}
                            onChange={(e) => handleFiltroChange('NoEmpleado', e.target.value)}
                        />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Nombre Completo:</label>
                        <input
                            type="text"
                            className="filtro-input"
                            placeholder="Buscar por nombre..."
                            value={filtros.NombreCompleto}
                            onChange={(e) => handleFiltroChange('NombreCompleto', e.target.value)}
                        />
                    </div>
                    <div className="filtro-group">
                        <label className="filtro-label">Fecha Creación Inicio:</label>
                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                className="filtro-input"
                                value={filtros.FechaCreacionInicio}
                                onChange={(e) => handleFiltroChange('FechaCreacionInicio', e.target.value)}
                                max={filtros.FechaCreacionFin || undefined}
                            />
                        </div>
                    </div>

                    <div className="filtro-group">
                        <label className="filtro-label">Fecha Creación Fin:</label>
                        <div className="date-input-wrapper">
                            <input
                                type="date"
                                className="filtro-input"
                                value={filtros.FechaCreacionFin}
                                onChange={(e) => handleFiltroChange('FechaCreacionFin', e.target.value)}
                                min={filtros.FechaCreacionInicio || undefined}
                            />
                        </div>
                    </div>

                    <div className="filtro-group">
                        <label className="filtro-label">Estatus:</label>
                        <select
                            className="filtro-select"
                            value={filtros.Status}
                            onChange={(e) => handleFiltroChange('Status', e.target.value)}
                        >
                            <option value="">TODOS</option>
                            <option value="1">ACTIVO</option>
                            <option value="0">INACTIVO</option>
                            <option value="2">DESACTIVADO</option>
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
                                <label className="filtro-label">Empresa:</label>
                                <SelectConBusqueda
                                    options={convertirOpcionesParaBusqueda(empresas)}
                                    value={filtros.Empresa}
                                    onChange={(value) => handleFiltroChange('Empresa', value)}
                                    placeholder="Seleccionar empresa"
                                />
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Departamento:</label>
                                <select
                                    className="filtro-select"
                                    value={filtros.Departamento}
                                    onChange={(e) => handleFiltroChange('Departamento', e.target.value)}
                                >
                                    <option value="">TODOS</option>
                                    {departamentos.map(depto => (
                                        <option key={depto.id} value={depto.id}>
                                            {depto.valor}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Cargo:</label>
                                <select
                                    className="filtro-select"
                                    value={filtros.Cargo}
                                    onChange={(e) => handleFiltroChange('Cargo', e.target.value)}
                                >
                                    <option value="">TODOS</option>
                                    {cargos.map(cargo => (
                                        <option key={cargo.id} value={cargo.id}>
                                            {cargo.valor}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="filtro-group">
                                <label className="filtro-label">Supervisor:</label>
                                <select
                                    className="filtro-select"
                                    value={filtros.IdSupervisor}
                                    onChange={(e) => handleFiltroChange('IdSupervisor', e.target.value)}
                                >
                                    <option value="">TODOS</option>
                                    {supervisores.map(supervisor => (
                                        <option key={supervisor.id} value={supervisor.id}>
                                            {supervisor.valor}
                                        </option>
                                    ))}
                                </select>
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

            <div className="personal-content">
                {loadingOptions && (
                    <div className="loading-options">
                        <span>Cargando opciones...</span>
                    </div>
                )}
                <Tabla
                    columns={tableColumns}
                    data={personalFiltrados}
                    pageSize={10}
                    pageSizeOptions={[5, 10, 25, 50]}
                    emptyMessage="No se encontraron personal"
                    className="full-height-table"
                    loading={loading}
                />
            </div>

            {showForm && (
                <div className="form-personal-modal-overlay">
                    <div className="form-personal-modal">
                        <div className="form-personal-modal-header">
                            <h2 className="form-personal-modal-title">
                                {tipoFormulario === 'Modificar' ? 'Editar personal' : 'Registro de personal'}
                            </h2>
                            <button className="close-button" onClick={() => {
                                setShowForm(false);
                                resetForm();
                                setTipoFormulario('Agregar');
                            }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="form-personal-modal-body">
                            <form onSubmit={handleSubmit}>
                                <div className="form-personal-grid">
                                    <div className="form-section">
                                        <h3 className="form-section-title">Foto del personal</h3>
                                        <div className="form-personal-row">
                                            <div className="form-personal-group photo-upload-group">
                                                <label className="form-personal-label">Foto del personal:</label>
                                                <div className="photo-upload-container">
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileSelect}
                                                        accept="image/jpeg,image/jpg,image/png,image/gif"
                                                        style={{ display: 'none' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="upload-photo-btn"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={uploadingPhoto}
                                                    >
                                                        <Upload size={18} />
                                                        {uploadingPhoto ? 'Subiendo...' : 'Seleccionar foto'}
                                                    </button>
                                                    <span className="photo-format-hint">
                                                        Formatos: JPG, PNG, GIF (Max. 5MB)
                                                    </span>
                                                </div>
                                                
                                                {previewFoto && (
                                                    <div className="photo-preview">
                                                        <div className="photo-preview-container">
                                                            <img 
                                                                src={previewFoto.startsWith('http') || previewFoto.startsWith('data:') ? previewFoto : `${import.meta.env.VITE_API_BASE_URL_PROD}/${previewFoto}`}
                                                                alt="Vista previa"
                                                                className="photo-preview-img"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = previewFoto;
                                                                }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="remove-photo-btn"
                                                                onClick={() => {
                                                                    setPreviewFoto('');
                                                                    setSelectedFile(null);
                                                                    setPersonalForm((prev: any) => ({ ...prev, RutaFoto: '' }));
                                                                }}
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-section-title">Información Personal</h3>
                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='NoEmpleado' className="form-personal-label required">No. Empleado *</label>
                                                <input
                                                    type="text"
                                                    name="NoEmpleado"
                                                    value={personalForm.NoEmpleado}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Número de empleado"
                                                    required
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='FechaIngreso' className="form-personal-label">Fecha de Ingreso</label>
                                                <input
                                                    type="text"
                                                    name="FechaIngreso"
                                                    value={fechaIngresoDisplay}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="dd/mm/aaaa"
                                                    pattern="\d{2}/\d{2}/\d{4}"
                                                    title="Formato: dd/mm/aaaa"
                                                />
                                                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                                    Formato: dd/mm/aaaa (ejemplo: 15/03/2024)
                                                </small>
                                            </div>
                                        </div>

                                        <div className="form-personal-row three-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='Nombre' className="form-personal-label">Nombre</label>
                                                <input
                                                    type="text"
                                                    name="Nombre"
                                                    value={personalForm.Nombre}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Nombre"
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='ApPaterno' className="form-personal-label">Apellido Paterno</label>
                                                <input
                                                    type="text"
                                                    name="ApPaterno"
                                                    value={personalForm.ApPaterno}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Apellido paterno"
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='ApMaterno' className="form-personal-label">Apellido Materno</label>
                                                <input
                                                    type="text"
                                                    name="ApMaterno"
                                                    value={personalForm.ApMaterno}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Apellido materno"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='TipoSangre' className="form-personal-label">Tipo de Sangre</label>
                                                <input
                                                    type="text"
                                                    name="TipoSangre"
                                                    value={personalForm.TipoSangre}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="A+, A-, B+, B-, O+, O-, AB+, AB-"
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='NSS' className="form-personal-label">NSS</label>
                                                <input
                                                    type="text"
                                                    name="NSS"
                                                    value={personalForm.NSS}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Número de Seguro Social"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-section-title">Información Laboral</h3>
                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='Cargo' className="form-personal-label">Cargo</label>
                                                <SelectConBusquedayCrear
                                                    options={convertirOpciones(cargos)}
                                                    value={personalForm.Cargo}
                                                    onChange={(value) => handleSelectChange('Cargo', value)}
                                                    placeholder="Buscar o crear cargo"
                                                    onCreateNew={(value) => handleCreateNewOption('Cargo', value)}
                                                    loading={creatingNewOption?.type === 'Cargo'}
                                                    allowCreate={true}
                                                    forceUppercase={true}
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='Departamento' className="form-personal-label">Departamento</label>
                                                <SelectConBusquedayCrear
                                                    options={convertirOpciones(departamentos)}
                                                    value={personalForm.Departamento}
                                                    onChange={(value) => handleSelectChange('Departamento', value)}
                                                    placeholder="Buscar o crear departamento"
                                                    onCreateNew={(value) => handleCreateNewOption('Departamento', value)}
                                                    loading={creatingNewOption?.type === 'Departamento'}
                                                    allowCreate={true}
                                                    forceUppercase={true}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='Empresa' className="form-personal-label">Empresa</label>
                                                <SelectConBusquedayCrear
                                                    options={convertirOpciones(empresas)}
                                                    value={personalForm.Empresa}
                                                    onChange={(value) => handleSelectChange('Empresa', value)}
                                                    placeholder="Buscar o crear empresa"
                                                    onCreateNew={(value) => handleCreateNewOption('Empresa', value)}
                                                    loading={creatingNewOption?.type === 'Empresa'}
                                                    allowCreate={true}
                                                    forceUppercase={true}
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='IdUbicacion' className="form-personal-label">Ubicación</label>
                                                <SelectConBusqueda
                                                    options={convertirOpcionesParaBusqueda(ubicaciones)}
                                                    value={personalForm.IdUbicacion}
                                                    onChange={(value) => handleSelectChange('IdUbicacion', value)}
                                                    placeholder="Seleccionar ubicación"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='EsSupervisor' className="form-personal-label">Es Supervisor</label>
                                                <select
                                                    name="EsSupervisor"
                                                    value={personalForm.EsSupervisor}
                                                    onChange={handleInputChange}
                                                    className="form-personal-select"
                                                >
                                                    <option value="NO">No</option>
                                                    <option value="SI">Sí</option>
                                                </select>
                                            </div>
                                            <div className="form-personal-group">
                                                <label htmlFor='IdSupervisor' className="form-personal-label">Supervisor</label>
                                                <SelectConBusqueda
                                                    options={convertirOpcionesParaBusqueda(supervisores)}
                                                    value={personalForm.IdSupervisor}
                                                    onChange={(value) => handleSelectChange('IdSupervisor', value)}
                                                    placeholder="Seleccionar supervisor"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-section">
                                        <h3 className="form-section-title">Información de Contacto</h3>
                                        <div className="form-personal-row two-columns">
                                            <div className="form-personal-group">
                                                <label htmlFor='Email' className="form-personal-label">Email</label>
                                                <input
                                                    type="email"
                                                    name="Email"
                                                    value={personalForm.Email}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="correo@empresa.com.mx"
                                                />
                                            </div>

                                            <div className="form-personal-group">
                                                <label htmlFor='Contacto' className="form-personal-label">Teléfono</label>
                                                <input
                                                    type="text"
                                                    name="Contacto"
                                                    value={personalForm.Contacto}
                                                    onChange={handleInputChange}
                                                    className="form-personal-input"
                                                    placeholder="Teléfono de contacto"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-personal-actions">
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
                                        disabled={submitting || uploadingPhoto}
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

            <CambioEstatusModal
                visible={cambioEstatusModalVisible}
                onClose={() => {
                    setCambioEstatusModalVisible(false);
                    setPersonalCambioEstatus(null);
                }}
                personal={personalCambioEstatus}
                onConfirm={handleConfirmarCambioEstatus}
                loading={cambiandoEstatus}
            />
        </div>
    );
};