export interface MonitoreoResumen {
    TotalEmpleados: number;
    TotalOtorgados: number;
    TotalTomados: number;
    TotalVigentes: number;
    TotalVencidos: number;
}

export interface MonitoreoDetalle {
    IdPersonal: number;
    NoEmpleado: string;
    NombreCompleto: string;
    Departamento: string;
    Empresa: string;
    Anio: number;
    Periodo: number;
    DiasOtorgados: number;
    DiasTomados: number;
    DiasVigentes: number;
    DiasVencidos: number;
    EstadoPeriodo: string;
}

export interface MonitoreoPorGrupo {
    TotalEmpleados: number;
    TotalOtorgados: number;
    TotalTomados: number;
    TotalVigentes: number;
    TotalVencidos: number;
}

export interface MonitoreoPorDepartamento extends MonitoreoPorGrupo {
    Departamento: string;
}

export interface MonitoreoPorEmpresa extends MonitoreoPorGrupo {
    Empresa: string;
}

export interface MonitoreoResponse {
    Resumen: MonitoreoResumen;
    Detalle: MonitoreoDetalle[];
    PorDepartamento: MonitoreoPorDepartamento[];
    PorEmpresa: MonitoreoPorEmpresa[];
}