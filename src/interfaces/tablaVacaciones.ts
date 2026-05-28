export interface InterfacetablaVacaciones {
    IdTablaVacaciones: number;
    Descripcion: string;
    Vigencia: string;
}

export interface InterfaceDetalletablaVacaciones {
    IdDetalleTablaVacaciones: string;
    IdTablaVacaciones: string;
    Antiguedad: string;
    Dias: string;
}