export interface EstadoVacaciones {
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    FechaIngreso: string;
    Antiguedad: number; 
    ProximoAniversario: string;
    Detalle: EstadoCuentaPorAnio[];
}

export interface EstadoCuentaPorAnio {
    Anio: number;
    DiasHabilitados: number;
    DiasTomados: number;
    DiasVencidos: number;
    DiasVigentes: number; 
    FechasTomadas: string[];
}