export interface InterfaceVacaciones {
    IdVacaciones: number;
    FechaSolicitud: string;
    UsuarioSolicita: string;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
    FechaInicio: string;
    FechaFin: string;
    DiasTomar: string;
    FechaRetornoLabores: string;
    FechaAutoriza?: string;
    UsuarioAutoriza?: string;
}