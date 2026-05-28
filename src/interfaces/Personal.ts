// interfaces/Personal.ts

export interface Interfacepersonal {
    IdPersonal: number;
    NoEmpleado: number;
    NombreCompleto: string;
    Nombre: string;
    ApPaterno: string;
    ApMaterno: string;
    FechaIngreso: string;
    Cargo: string;
    Departamento: string;
    Empresa: string;
    Status: string;
    IdUbicacion: string;
    RutaFoto: string;
    Email: string;
    Contacto: string;
    IdJefeInmediato: string;
    TipoSangre: string;
    FechaCreacion: string;
    NSS: string;
    EsJefeInmediato: string;
    Alergias: string;
    Turno: string;           // Nuevo campo
    FechadeNacimiento: string; // Nuevo campo
    Direccion: string;       // Nuevo campo
}

export interface FiltrosPersonal {
    NoEmpleado: number | string;
    NombreCompleto: string;
    FechaIngresoInicio: string;
    FechaIngresoFin: string;
    Status: string;
    Empresa: string;
    Departamento: string;
    Cargo: string;
    IdJefeInmediato: string;
    EsJefeInmediato: string;
}

export interface OpcionSelect {
    id: string;
    valor: string;
}
export interface VacacionesPersonal {
    IdPersonalVacaciones: number;
    IdPersonal: number;
    Año: number;
    Dias: number;
    DiasTomados: number;
    DiasRestan: number;
}


export interface Vacas {
    IdPersonalVacaciones: number;
    IdPersonal: number;
    Año: number;
    Dias: number;
    DiasTomados: number;
    DiasRestan: number;
}


export interface DetalleVacacionesPersonal extends Interfacepersonal {
    Vacaciones?: VacacionesPersonal[];
    VacacionesActuales?: VacacionesPersonal;
    TotalDiasTomados?: number;
    TotalDiasDisponibles?: number;
    DiasRestantesTotales?: number;
}

