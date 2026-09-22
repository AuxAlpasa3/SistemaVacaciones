export interface ReporteVacacionesPendientes {
    IdPersonal: number;
    NoEmpleado: string | number;
    NombreCompleto: string;
    IdDepartamento: number | null;
    Departamento: string;
    FechaIngreso: string;
    FechaAniversario: string;
    Periodo: number;
    Antiguedad: number;
    FechaInicioPeriodo: string;
    FechaFinPeriodo: string;
    PuedeUtilizarDesde: string;
    DiasAsignados: number;
    DiasTomados: number;
    DiasRestantes: number;
    DiasPendientes: number;
    DiasVencidos: number;
    EstadoPeriodo: string;
}