import React, { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import './Login.css';
import logoAlpasa from '../../assets/LogoCredencial.png';
import type { UsuarioLogin } from '../../interfaces/Usuario';
import { apiService } from '../../api/apiService';
import { showToast } from '../../helpers/toast';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import { useNavigate } from 'react-router-dom';
import { useUsuarioStore } from '../../services/UsuarioLogin';
import { obtenerUsuarioSesion } from '../../helpers/usuario';
import backgroundVideo from '../../assets/background.jpg';

export function Login() {
    const navigate = useNavigate();
    const { setUsuario } = useUsuarioStore();
    const [formLoginUserData, setFormUserData] = useState<UsuarioLogin>({
        Usuario: '',
        Contrasenia: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [disabled, setDisabled] = useState<boolean>(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLogin = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            setDisabled(true);
            if (formLoginUserData.Usuario.trim() === "") {
                throw new Error("Debe ingresar el usuario");
            }
            const config = {};
            const userData = {
                user: formLoginUserData.Usuario,
                pssw: formLoginUserData.Contrasenia
            }
            const loginRespuesta = await apiService.postForm<RespuestaAPI>('/login/login.php', userData, config);
            showToast({ text: loginRespuesta.message, type: 'success', autoClose: 1500 });
            setUsuario(loginRespuesta.data.toString());
            navigate('/menu');
        } catch (err: any) {
            showToast({ text: err?.data?.message || err.message, type: 'error' });
        }
        finally {
            setDisabled(false);
        }
    };

    useEffect(() => {
        const usuario = obtenerUsuarioSesion();
        if (usuario) {
            navigate('/menu');
        }
    }, [])

    return (
        <div className="fondo-con-video">
            {/* Video de fondo */}
            <video 
                className="video-background" 
                autoPlay 
                loop 
                muted 
                playsInline 
                preload="auto"
            >
                <source src={backgroundVideo} type="image/jpeg" />
                <div className="video-fallback"></div>
            </video>
            
            {/* Capa overlay para mejorar contraste y legibilidad */}
            <div className="video-overlay"></div>
            
            <div className='body-login-container'>
                <div className="login-container">
                    <div className="login-wrapper">
                        <div className="login-header">
                            <div>
                                <img src={logoAlpasa} alt='Logo' width={400} />
                            </div>
                            <div className="header-divide" />
                            <h2 className="welcome-title">MODULO VACACIONES</h2>
                            <p className="welcome-subtitle">Ingresa tus credenciales</p>
                        </div>
                        <div className="login-card">
                            <form className="login-form" onSubmit={handleLogin}>
                                <div className="formLogin-group">
                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <User className="icon" />
                                        </div>
                                        <input
                                            id="Usuario"
                                            name="Usuario"
                                            type="text"
                                            required
                                            value={formLoginUserData.Usuario}
                                            onChange={handleInputChange}
                                            className="formLogin-input"
                                            placeholder="Usuario"
                                            autoComplete='off'
                                        />
                                    </div>
                                </div>
                                <div className="formLogin-group">
                                    <div className="input-wrapper">
                                        <div className="input-icon">
                                            <Lock className="icon" />
                                        </div>
                                        <input
                                            id="Contrasenia"
                                            name="Contrasenia"
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={formLoginUserData.Contrasenia}
                                            onChange={handleInputChange}
                                            className="formLogin-input password-input"
                                            placeholder="Contraseña"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="password-toggle"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="icon" />
                                            ) : (
                                                <Eye className="icon" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button 
                                    type="submit" 
                                    className={`submit-button ${disabled ? 'btn-disabled' : ''}`} 
                                    disabled={disabled}
                                >
                                    <span className="button-icon">
                                        <Lock className="icon" />
                                    </span>
                                    Iniciar sesión
                                </button>
                            </form>
                        </div>
                    </div>
                    <p className='login-footer'>
                        | Todos los derechos reservados © {new Date().getFullYear()} <strong>
                        <a href='https://www.alpasa.mx/' target='_blank' rel="noopener noreferrer">ALPASA</a>
                        </strong> || 
                    </p>
                    <p className='login-footer'>MODULO VACACIONES - Versión 1.0.0</p>
                </div>
            </div>
        </div>
    );
}