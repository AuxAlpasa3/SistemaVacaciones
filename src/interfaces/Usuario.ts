export interface CatalogoUsuario {
    IdUsuario: number;
    Usuario: string;
    EmpleadoID?: number;
    Descripcion?: string;
    TipoUsuario?: number;
    Contrasenia?: string;
    Estatus?: number;
    rol?: number;
    Sesion?: string;
    UltimaSesion?: string;
    CreateDate?: string;
    Ubicacion?: number;
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