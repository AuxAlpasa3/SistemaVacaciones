export interface CatalogoUsuario {
    IdUsuario: number;
    Usuario: string;
    EmpleadoID?: number;
    Descripcion?: string;
    TipoUsuario?: number;
    TipoUsuarioNombre?: string;
    Estatus?: number;
    rol?: number;
    RolUsuario?: string;
    Ubicacion?: number;
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Cargo: number;
    Contrasenia?: string;
    Sesion: string;
    UltimaSesion: string;
    Departamento: number;
    Empresa: number;
    Status: string;
    IdUbicacion: number;
    NSS: string | null;
    esJefeInmediato: number;
    RutaFoto: string;
    Email: string;
    Contacto: string | null;
    IdJefeInmediato: number | null;
    TipoSangre: string | null;
    FechaIngreso: string;
    Alergias: string | null;
    Turno: string | null;
    CreateDate: string;
    FechadeNacimiento: string | null;
    Direccion: string | null;
}

export interface UsuarioResponse {
    success: boolean;
    data?: CatalogoUsuario;
    message?: string;
}
export interface UsuarioLogin {
    Usuario: string;
    Contrasenia?: string;
}

export interface OpcionSelect {
    id: string;
    valor: string;
}

export interface FiltrosUsuario {
    Usuario: string;
    TipoUsuario: string;
    Estatus: string;
    rol: string;
    Ubicacion: string;
    EmpleadoID: string;
    FechaCreacionInicio: string;
    FechaCreacionFin: string;
}