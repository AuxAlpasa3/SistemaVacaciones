export interface EstadoVacaciones {
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    FechaIngreso: string;
    ProximoAniversario: string;
    Antiguedad: number;
    Detalle: EstadoCuentaPorAnio[];
}

export interface EstadoCuentaPorAnio {
    Anio: number;
    DiasHabilitados: number;
    DiasTomados: number;
    DiasVencidos: number;
    DiasVigentes: number;
    EstadoPeriodo: string;
    FechasTomadas: string[];
}

export interface EmpleadoOpcion {
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Cargo: string;
    FechaIngreso: string;
}