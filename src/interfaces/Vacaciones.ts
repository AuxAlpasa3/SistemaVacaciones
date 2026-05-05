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
    DiasTomar: string;
    FechaRetornoLabores: string;
    FechaAutoriza?: string;
    UsuarioAutoriza?: string;
    Estatus: number | '';
}

export interface FiltrosVacaciones {
    NoEmpleado: number;
    NombreCompleto: string;
    FechaInicioVacaciones: string;
    FechaFinVacaciones: string;
    Supervisor: string;
    FechaIngreso: string;
    FechaSolicitud: string;
    Estatus: number | '';
}

export interface OpcionSelect {
    id: string | number; 
    valor: string;
}

export interface OptionType {
    value: string;
    label: string;
    [key: string]: any;
}