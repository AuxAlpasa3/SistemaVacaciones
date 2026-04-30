export interface Usuario {
    IdUsuario: string;
    Usuario: string;
    Contrasenia?: string;
    TipoUsuario: string;
    Descripcion: string;
    Almacen: string;
    Estatus: string;
    IdRolUsuario?: number; 
    RolUsuario?: string;   
    Sesion?: string;
}

export interface UsuarioLogin {
    Usuario: string;
    Contrasenia: string;
}

export interface OpcionSelect {
    id: string | number; 
    valor: string;
}