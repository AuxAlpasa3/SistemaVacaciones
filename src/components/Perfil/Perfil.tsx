import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Building,
    Briefcase,
    AlertCircle,
    Clock,
    UserCircle,
    Shield,
    IdCard,
    Home,
    Users,
    Hash
} from 'lucide-react';
import './Perfil.css';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import type { CatalogoUsuario } from '../../interfaces/Usuario';

interface PerfilProps {
    onClose?: () => void;
}

export const Perfil: React.FC<PerfilProps> = ({ onClose }) => {
    const navigate = useNavigate();
    const [usuario, setUsuario] = useState<CatalogoUsuario | null>(null);

    useEffect(() => {
        const usuarioData = obtenerUsuarioSesion();
        if (usuarioData) {
            setUsuario(usuarioData);
        } else {
            navigate('/');
        }
    }, [navigate]);

    if (!usuario) {
        return (
            <div className="perfil-loading">
                <div className="spinner"></div>
                <p>Cargando información del usuario...</p>
            </div>
        );
    }

    return (
        <div className="perfil-container">
            <div className="perfil-header">
                <div className="perfil-header-left">
                    <h2>
                        <UserCircle size={28} />
                        Mi Perfil
                    </h2>
                </div>
                {onClose && (
                    <button className="perfil-close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                )}
            </div>

            <div className="perfil-content">
                {/* Foto de perfil */}
                <div className="perfil-avatar-section">
                    <div className="perfil-avatar">
                        {usuario.RutaFoto ? (
                            <img 
                                src={usuario.RutaFoto} 
                                alt={usuario.NombreCompleto}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                                }}
                            />
                        ) : (
                            <UserCircle size={80} />
                        )}
                    </div>
                    <div className="perfil-avatar-info">
                        <h3>{usuario.NombreCompleto}</h3>
                        <p>{usuario.Descripcion || 'Sin descripción'}</p>
                        <div className="perfil-badges">
                            <span className="perfil-rol-badge">{usuario.RolUsuario || 'Usuario'}</span>
                            <span className="perfil-status-badge">
                                {usuario.Estatus === '1' ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="perfil-form">
                    {/* Información Personal */}
                    <div className="perfil-section-title">
                        <h4>Información Personal</h4>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="NombreCompleto">
                                <User size={16} />
                                Nombre Completo
                            </label>
                            <input
                                type="text"
                                id="NombreCompleto"
                                name="NombreCompleto"
                                value={usuario.NombreCompleto || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="Usuario">
                                <Hash size={16} />
                                Usuario
                            </label>
                            <input
                                type="text"
                                id="Usuario"
                                name="Usuario"
                                value={usuario.Usuario || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="Email">
                                <Mail size={16} />
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="Email"
                                name="Email"
                                value={usuario.Email || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="Contacto">
                                <Phone size={16} />
                                Teléfono
                            </label>
                            <input
                                type="text"
                                id="Contacto"
                                name="Contacto"
                                value={usuario.Contacto || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="FechadeNacimiento">
                                <Calendar size={16} />
                                Fecha de Nacimiento
                            </label>
                            <input
                                type="date"
                                id="FechadeNacimiento"
                                name="FechadeNacimiento"
                                value={usuario.FechadeNacimiento ? 
                                    new Date(usuario.FechadeNacimiento).toISOString().split('T')[0] : 
                                    ''
                                }
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="TipoSangre">
                                <AlertCircle size={16} />
                                Tipo de Sangre
                            </label>
                            <input
                                type="text"
                                id="TipoSangre"
                                name="TipoSangre"
                                value={usuario.TipoSangre || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group full-width">
                            <label htmlFor="Direccion">
                                <MapPin size={16} />
                                Dirección
                            </label>
                            <textarea
                                id="Direccion"
                                name="Direccion"
                                value={usuario.Direccion || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Información Laboral */}
                    <div className="perfil-section-title">
                        <h4>Información Laboral</h4>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="NoEmpleado">
                                <IdCard size={16} />
                                Número de Empleado
                            </label>
                            <input
                                type="text"
                                id="NoEmpleado"
                                name="NoEmpleado"
                                value={usuario.NoEmpleado || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="Cargo">
                                <Briefcase size={16} />
                                Cargo
                            </label>
                            <input
                                type="text"
                                id="Cargo"
                                name="Cargo"
                                value={usuario.Cargo?.toString() || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="Departamento">
                                <Building size={16} />
                                Departamento
                            </label>
                            <input
                                type="text"
                                id="Departamento"
                                name="Departamento"
                                value={usuario.Departamento?.toString() || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="FechaIngreso">
                                <Calendar size={16} />
                                Fecha de Ingreso
                            </label>
                            <input
                                type="date"
                                id="FechaIngreso"
                                name="FechaIngreso"
                                value={usuario.FechaIngreso ? 
                                    new Date(usuario.FechaIngreso).toISOString().split('T')[0] : 
                                    ''
                                }
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="Turno">
                                <Clock size={16} />
                                Turno
                            </label>
                            <input
                                type="text"
                                id="Turno"
                                name="Turno"
                                value={usuario.Turno || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="Alergias">
                                <AlertCircle size={16} />
                                Alergias
                            </label>
                            <input
                                type="text"
                                id="Alergias"
                                name="Alergias"
                                value={usuario.Alergias || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    {/* Información Adicional */}
                    <div className="perfil-section-title">
                        <h4>Información Adicional</h4>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="NSS">
                                <Shield size={16} />
                                NSS
                            </label>
                            <input
                                type="text"
                                id="NSS"
                                name="NSS"
                                value={usuario.NSS || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="IdJefeInmediato">
                                <Users size={16} />
                                ID Jefe Inmediato
                            </label>
                            <input
                                type="text"
                                id="IdJefeInmediato"
                                name="IdJefeInmediato"
                                value={usuario.IdJefeInmediato?.toString() || 'No asignado'}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>

                    <div className="perfil-form-row">
                        <div className="perfil-form-group">
                            <label htmlFor="Ubicacion">
                                <Home size={16} />
                                Ubicación
                            </label>
                            <input
                                type="text"
                                id="Ubicacion"
                                name="Ubicacion"
                                value={usuario.Ubicacion?.toString() || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>

                        <div className="perfil-form-group">
                            <label htmlFor="Empresa">
                                <Building size={16} />
                                Empresa
                            </label>
                            <input
                                type="text"
                                id="Empresa"
                                name="Empresa"
                                value={usuario.Empresa?.toString() || ''}
                                disabled={true}
                                className="perfil-input-disabled"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};