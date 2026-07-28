export interface InterfaceVacaciones {
    IdVacaciones: number;
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    FechaSolicitud: string;
    FechaInicio: string;
    FechaFin: string;
    FechaRetornoLabores: string;
    DiasTomar: number;
    UsuarioSolicita: string;
    UsuarioAutoriza: string;
    FechaAutoriza: string;
    UsuarioValida: string;
    FechaValidado: string;
    Estatus: number;
    Anio: number;
    Comentarios: string | null;
    SaldoDias?: number;  
    DiasCorresponden?: number;  
    Antiguedad?: number;
    NoContarDomingos?: boolean | number; 
}

export interface PeriodoVacaciones {
    IdPersonalVacaciones: number;
    IdPersonal: number;
    Año: number;
    AñosAntiguedad: number;
    DiasGenera: number;
    DiasDisfrutados: number;
    DiasVencidos: number;
    DiasDisponibles: number;
}

export interface FiltrosVacaciones {
    NoEmpleado: string | number;
    NombreCompleto: string;
    Departamento: string;
    FechaInicioVacaciones: string;
    FechaFinVacaciones: string;
    JefeInmediato: string;
    FechaIngreso: string;
    FechaSolicitud: string;
    Estatus: number;
    Anio?: number;
    NoContarDomingos?: boolean | number; 
}

export interface OpcionSelect {
    id: string;
    valor: string;
}

export interface ConfiguracionVacaciones {
    NoContarDomingos: boolean;
    DiasHabiles: number;
    DiasTotales: number;
}