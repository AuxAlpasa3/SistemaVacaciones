import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatReportDate } from '../../helpers/reportDate';
import type { EstadoVacaciones } from '../../interfaces/EstadoCuentaVacaciones';
import './EstadoCuentaVacacionesPDF.css';

interface Props {
    visible: boolean;
    data: EstadoVacaciones | null;
    onClose: () => void;
}

export const EstadoCuentaVacacionesPDF: React.FC<Props> = ({
    visible,
    data,
    onClose
}) => {
    if (!visible || !data) return null;

    const totales = data.Detalle.reduce(
        (acc, d) => ({
            habilitados: acc.habilitados + d.DiasHabilitados,
            tomados: acc.tomados + d.DiasTomados,
            vencidos: acc.vencidos + d.DiasVencidos,
            vigentes: acc.vigentes + d.DiasVigentes
        }),
        { habilitados: 0, tomados: 0, vencidos: 0, vigentes: 0 }
    );

    const imprimir = () => {
        const contenido = document.getElementById('pdf-estado-cuenta');
        if (!contenido) return;

        const ventana = window.open('', '_blank', 'width=900,height=700');
        if (!ventana) return;

        const estilos = `
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
                body { margin: 0; padding: 24px; color: #000; }
                .pdf-titulo { text-align: center; margin-bottom: 16px; }
                .pdf-titulo h1 { margin: 0; font-size: 20px; color: #dc2626; }
                .pdf-titulo span { font-size: 12px; color: #000; }
                .pdf-info {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px 20px;
                    border: 1px solid #dc2626;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 16px;
                }
                .pdf-info > div { display: flex; flex-direction: column; }
                .pdf-info span {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #dc2626;
                    font-weight: 700;
                }
                .pdf-info strong { font-size: 13px; color: #000; }
                .pdf-resumen {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 16px;
                }
                .pdf-card {
                    border: 1px solid #dc2626;
                    border-radius: 8px;
                    padding: 10px;
                    text-align: center;
                }
                .pdf-card span {
                    display: block;
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #000;
                    font-weight: 700;
                    margin-bottom: 4px;
                }
                .pdf-card strong { font-size: 18px; }
                .pdf-card.habilitados strong { color: #2563eb; }
                .pdf-card.tomados strong     { color: #16a34a; }
                .pdf-card.vigentes strong    { color: #ea580c; }
                .pdf-card.vencidos strong    { color: #dc2626; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                th, td {
                    border: 1px solid #dc2626;
                    padding: 6px 8px;
                    font-size: 12px;
                    text-align: center;
                    color: #000;
                }
                th {
                    background: #dc2626;
                    color: #fff;
                    text-transform: uppercase;
                    font-size: 11px;
                }
                td.hab { color: #2563eb; font-weight: 700; }
                td.tom { color: #16a34a; font-weight: 700; }
                td.ven { color: #dc2626; font-weight: 700; }
                td.vig { color: #ea580c; font-weight: 700; }
                .saldo {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #ea580c;
                    color: #fff;
                    border-radius: 8px;
                    padding: 12px 20px;
                    font-size: 14px;
                    font-weight: 700;
                }
                .saldo strong { font-size: 20px; color: #fff; }
                .firmas {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 40px;
                    margin-top: 60px;
                }
                .firma {
                    border-top: 1px solid #000;
                    text-align: center;
                    padding-top: 6px;
                    font-size: 11px;
                    color: #000;
                }
            </style>
        `;

        ventana.document.write(`
            <html>
                <head>
                    <title>Estado de Cuenta de Vacaciones</title>
                    ${estilos}
                </head>
                <body>${contenido.innerHTML}</body>
            </html>
        `);

        ventana.document.close();
        ventana.focus();

        setTimeout(() => {
            ventana.print();
            ventana.close();
        }, 400);
    };

    return (
        <div className="pdf-modal-overlay">
            <div className="pdf-modal">
                <div className="pdf-modal-header">
                    <h2>Vista previa del PDF</h2>
                    <div className="pdf-modal-actions">
                        <button
                            type="button"
                            className="pdf-btn-print"
                            onClick={imprimir}
                        >
                            <Printer size={16} />
                            Imprimir
                        </button>
                        <button
                            type="button"
                            className="pdf-btn-close"
                            onClick={onClose}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="pdf-modal-body">
                    <div id="pdf-estado-cuenta" className="pdf-contenido">
                        <div className="pdf-titulo">
                            <h1>Estado de Cuenta de Vacaciones</h1>
                            <span>
                                Generado el{' '}
                                {formatReportDate(new Date().toISOString())}
                            </span>
                        </div>

                        <div className="pdf-info">
                            <div>
                                <span>No. Empleado</span>
                                <strong>{data.NoEmpleado}</strong>
                            </div>
                            <div>
                                <span>Nombre</span>
                                <strong>{data.NombreCompleto}</strong>
                            </div>
                            <div>
                                <span>Departamento</span>
                                <strong>{data.Departamento}</strong>
                            </div>
                            <div>
                                <span>Fecha de Ingreso</span>
                                <strong>{formatReportDate(data.FechaIngreso)}</strong>
                            </div>
                            <div>
                                <span>Próxima Fecha de Aniversario</span>
                                <strong>
                                    {formatReportDate(data.ProximoAniversario)}
                                </strong>
                            </div>
                            <div>
                                <span>Antigüedad</span>
                                <strong>
                                    {data.Antiguedad}{' '}
                                    {data.Antiguedad === 1 ? 'año' : 'años'}
                                </strong>
                            </div>
                        </div>

                        <div className="pdf-resumen">
                            <div className="pdf-card habilitados">
                                <span>Días Habilitados</span>
                                <strong>{totales.habilitados}</strong>
                            </div>
                            <div className="pdf-card tomados">
                                <span>Días Tomados</span>
                                <strong>{totales.tomados}</strong>
                            </div>
                            <div className="pdf-card vigentes">
                                <span>Días Vigentes</span>
                                <strong>{totales.vigentes}</strong>
                            </div>
                            <div className="pdf-card vencidos">
                                <span>Días Vencidos</span>
                                <strong>{totales.vencidos}</strong>
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Año</th>
                                    <th>Días Habilitados</th>
                                    <th>Días Tomados</th>
                                    <th>Días Vencidos</th>
                                    <th>Días Vigentes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.Detalle.map(row => (
                                    <tr key={row.Anio}>
                                        <td>{row.Anio}</td>
                                        <td className="hab">{row.DiasHabilitados}</td>
                                        <td className="tom">{row.DiasTomados}</td>
                                        <td className="ven">{row.DiasVencidos}</td>
                                        <td className="vig">{row.DiasVigentes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="saldo">
                            <span>Saldo total vigente</span>
                            <strong>{totales.vigentes} días</strong>
                        </div>

                        <div className="firmas">
                            <div className="firma">Firma del colaborador</div>
                            <div className="firma">Firma de RH</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};