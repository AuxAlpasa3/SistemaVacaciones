export interface RespuestaAPI {
    data: [] | string;
    message: string;
     status: boolean;
}

export interface RespuestaImportacion {
    status: boolean;
    message: string;
    data: {
        successCount: number;
        errorCount: number;
        errors: string[];
        detalles?: Array<{
            fila: number;
            error: string;
            datos?: any;
        }>;
    } | null;
}