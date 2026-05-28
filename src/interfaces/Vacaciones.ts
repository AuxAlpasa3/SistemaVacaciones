// interfaces/Vacaciones.ts
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
    Supervisor: string;
    FechaIngreso: string;
    FechaSolicitud: string;
    Estatus: number;
    Anio?: number;
}

export interface OpcionSelect {
    id: string;
    valor: string;
}