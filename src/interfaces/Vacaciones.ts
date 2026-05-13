export interface InterfaceVacaciones {
    IdVacaciones: number;
    FechaSolicitud: string;
    UsuarioSolicita: string;
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    FechaInicio: string;
    FechaFin: string;
    DiasTomar: number | string;
    FechaRetornoLabores: string;
    FechaAutoriza: string;
    UsuarioAutoriza: string;
    Estatus: number;
}

export interface FiltrosVacaciones {
    NoEmpleado: number | string;
    NombreCompleto: string;
    FechaInicioVacaciones: string;
    FechaFinVacaciones: string;
    Supervisor: string;
    FechaIngreso: string;
    FechaSolicitud: string;
    Estatus: number;
}

export interface OpcionSelect {
    id: string;
    valor: string;
}