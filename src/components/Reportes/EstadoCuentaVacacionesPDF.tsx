import React, { useEffect, useMemo, useState } from 'react';
import { Printer, X } from 'lucide-react';
import { formatReportDate } from '../../helpers/reportDate';
import type { EstadoVacaciones } from '../../interfaces/EstadoCuentaVacaciones';
import logoAlpasa from '../../assets/logocredencial.png';
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
    const [aniosSeleccionados, setAniosSeleccionados] = useState<number[]>([]);

    useEffect(() => {
        if (data) {
            setAniosSeleccionados(data.Detalle.map(d => d.Anio));
        }
    }, [data]);

    const detalleFiltrado = useMemo(() => {
        if (!data) return [];
        return data.Detalle.filter(d => aniosSeleccionados.includes(d.Anio));
    }, [data, aniosSeleccionados]);

    const totales = useMemo(() => {
        return detalleFiltrado.reduce(
            (acc, d) => ({
                habilitados: acc.habilitados + d.DiasHabilitados,
                tomados: acc.tomados + d.DiasTomados,
                vencidos: acc.vencidos + d.DiasVencidos,
                vigentes: acc.vigentes + d.DiasVigentes
            }),
            { habilitados: 0, tomados: 0, vencidos: 0, vigentes: 0 }
        );
    }, [detalleFiltrado]);

    const toggleAnio = (anio: number) => {
        setAniosSeleccionados(actual =>
            actual.includes(anio)
                ? actual.filter(a => a !== anio)
                : [...actual, anio]
        );
    };

    const seleccionarTodos = () => {
        if (!data) return;
        setAniosSeleccionados(data.Detalle.map(d => d.Anio));
    };

    const limpiarSeleccion = () => {
        setAniosSeleccionados([]);
    };

    const imprimir = () => {
        if (detalleFiltrado.length === 0) return;

        const contenido = document.getElementById('pdf-estado-cuenta');
        if (!contenido) return;

        const ventana = window.open('', '_blank', 'width=900,height=700');
        if (!ventana) return;

        const estilos = `
            <style>
                * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
                body { margin: 0; padding: 24px; color: #000; }
                .pdf-titulo { text-align: center; margin-bottom: 16px; }
                .pdf-titulo h1 { margin: 0; font-size: 20px; color: #ea580c; }
                .pdf-titulo span { font-size: 12px; color: #000; }
                .pdf-cabecera {
                    display: flex;
                    gap: 20px;
                    align-items: center;
                    border: 1px solid #ea580c;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 12px;
                }
                .pdf-logo {
                    width: 130px;
                    height: auto;
                    flex-shrink: 0;
                    object-fit: contain;
                }
                .pdf-cabecera-datos {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px 20px;
                    flex: 1;
                }
                .pdf-cabecera-datos > div { display: flex; flex-direction: column; }
                .pdf-cabecera-datos span {
                    font-size: 10px;
                    text-transform: uppercase;
                    color: #ea580c;
                    font-weight: 700;
                }
                .pdf-cabecera-datos strong { font-size: 13px; color: #000; }
                .pdf-resumen {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 16px;
                }
                .pdf-card {
                    border: 1px solid #ea580c;
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
                    border: 1px solid #ea580c;
                    padding: 6px 8px;
                    font-size: 12px;
                    text-align: center;
                    color: #000;
                }
                th {
                    background: #000;
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

    if (!visible || !data) return null;

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
                            disabled={detalleFiltrado.length === 0}
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
                    <div className="pdf-anios-selector">
                        <div className="pdf-anios-header">
                            <span>Años a imprimir</span>
                            <div className="pdf-anios-actions">
                                <button type="button" onClick={seleccionarTodos}>
                                    Todos
                                </button>
                                <button type="button" onClick={limpiarSeleccion}>
                                    Ninguno
                                </button>
                            </div>
                        </div>
                        <div className="pdf-anios-lista">
                            {data.Detalle.map(d => (
                                <label
                                    key={d.Anio}
                                    className={`pdf-anio-check ${
                                        aniosSeleccionados.includes(d.Anio)
                                            ? 'activo'
                                            : ''
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={aniosSeleccionados.includes(d.Anio)}
                                        onChange={() => toggleAnio(d.Anio)}
                                    />
                                    <span>{d.Anio}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div id="pdf-estado-cuenta" className="pdf-contenido">
                        <div className="pdf-titulo">
                            <h1>Estado de Cuenta de Vacaciones</h1>
                            <span>
                                Generado el{' '}
                                {formatReportDate(new Date().toISOString())}
                            </span>
                        </div>

                        <div className="pdf-cabecera">
                            <img
                                src={logoAlpasa}
                                alt="Alpasa"
                                className="pdf-logo"
                            />
                            <div className="pdf-cabecera-datos">
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
                                    <strong>
                                        {formatReportDate(data.FechaIngreso)}
                                    </strong>
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
                                {detalleFiltrado.map(row => (
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