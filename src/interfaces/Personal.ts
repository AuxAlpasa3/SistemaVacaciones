export interface Interfacepersonal {
    IdPersonal: number;
    NoEmpleado: number;
    NombreCompleto:string;
    Nombre: string;
    ApPaterno: string;
    ApMaterno: string;
    FechaIngreso: string;
    Cargo: string;
    Departamento: string;
    Empresa: string;
    Status: string;
    IdUbicacion: string;
    NSS: string;
    EsSupervisor: string;
    RutaFoto: string;
    Email: string;
    Contacto: string;
    IdSupervisor: string;
    TipoSangre: string;
    FechaCreacion: string;
}

export interface FiltrosPersonal {
    NoEmpleado: number;
    NombreCompleto: string;
    FechaCreacionInicio: string;
    FechaCreacionFin: string;
    Status: string;
    Empresa: string;
    Departamento: string;
    Cargo: string;
    IdSupervisor: string;
    EsSupervisor: string;
}

export interface OpcionSelect {
    id: string | number; 
    valor: string;
}

export interface OptionType {
    value: string;
    label: string;
    [key: string]: any; }