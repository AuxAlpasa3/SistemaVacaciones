import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiService } from '../../api/apiService';
import type { RespuestaAPI } from '../../interfaces/RespuestaAPI';
import type { EmpleadoOpcion } from '../../interfaces/EstadoCuentaVacaciones';
import './BuscadorEmpleado.css';

interface Props {
    idUsuario: number;
    onSelect: (empleado: EmpleadoOpcion | null) => void;
}

export const BuscadorEmpleado: React.FC<Props> = ({ idUsuario, onSelect }) => {
    const [texto, setTexto] = useState('');
    const [empleados, setEmpleados] = useState<EmpleadoOpcion[]>([]);
    const [abierto, setAbierto] = useState(false);
    const [loading, setLoading] = useState(false);
    const [seleccionado, setSeleccionado] = useState<EmpleadoOpcion | null>(null);

    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                contenedorRef.current &&
                !contenedorRef.current.contains(e.target as Node)
            ) {
                setAbierto(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const cargarEmpleados = async () => {
        if (empleados.length > 0) return;

        try {
            setLoading(true);
            const respuesta = await apiService.get<RespuestaAPI>(
                `/Vacaciones/Opciones/ObtenerEmpleados.php?IdUsuario=${idUsuario}`
            );

            if (respuesta?.status && Array.isArray(respuesta.data)) {
                const lista: EmpleadoOpcion[] = (respuesta.data as any[]).map(e => ({
                    IdPersonal: Number(e.IdPersonal ?? 0),
                    NoEmpleado: String(e.NoEmpleado ?? ''),
                    NombreCompleto: String(e.NombreCompleto ?? ''),
                    Departamento: String(e.Departamento ?? ''),
                    Cargo: String(e.Cargo ?? ''),
                    FechaIngreso: String(e.FechaIngreso ?? '')
                }));
                setEmpleados(lista);
            }
        } catch {
            setEmpleados([]);
        } finally {
            setLoading(false);
        }
    };

    const filtrados = useMemo(() => {
        const q = texto.trim().toLowerCase();
        if (!q || seleccionado) return [];

        return empleados
            .filter(
                e =>
                    e.NoEmpleado.toLowerCase().includes(q) ||
                    e.NombreCompleto.toLowerCase().includes(q)
            )
            .slice(0, 50);
    }, [texto, empleados, seleccionado]);

    const seleccionar = (empleado: EmpleadoOpcion) => {
        setSeleccionado(empleado);
        setTexto(`${empleado.NoEmpleado} - ${empleado.NombreCompleto}`);
        setAbierto(false);
        onSelect(empleado);
    };

    const limpiar = () => {
        setSeleccionado(null);
        setTexto('');
        setAbierto(false);
        onSelect(null);
    };

    return (
        <div className="buscador-empleado" ref={contenedorRef}>
            <label>Empleado</label>
            <div className="buscador-empleado-input">
                <input
                    type="text"
                    value={texto}
                    placeholder="No. empleado o nombre"
                    autoComplete="off"
                    onFocus={async () => {
                        await cargarEmpleados();
                        if (!seleccionado) setAbierto(true);
                    }}
                    onChange={e => {
                        setTexto(e.target.value);
                        if (seleccionado) {
                            setSeleccionado(null);
                            onSelect(null);
                        }
                        setAbierto(true);
                    }}
                />
                {seleccionado && (
                    <button
                        type="button"
                        className="buscador-empleado-clear"
                        onClick={limpiar}
                        aria-label="Limpiar"
                    >
                        ×
                    </button>
                )}
            </div>

            {abierto && !seleccionado && (
                <ul className="buscador-empleado-lista">
                    {loading && (
                        <li className="buscador-empleado-cargando">
                            Cargando empleados...
                        </li>
                    )}
                    {!loading && texto.trim() === '' && (
                        <li className="buscador-empleado-vacio">
                            Escriba nombre o número de empleado
                        </li>
                    )}
                    {!loading && texto.trim() !== '' && filtrados.length === 0 && (
                        <li className="buscador-empleado-vacio">Sin resultados</li>
                    )}
                    {!loading &&
                        filtrados.map(item => (
                            <li
                                key={item.IdPersonal}
                                onClick={() => seleccionar(item)}
                            >
                                <span className="buscador-empleado-no">
                                    {item.NoEmpleado}
                                </span>
                                <span className="buscador-empleado-nombre">
                                    {item.NombreCompleto}
                                </span>
                            </li>
                        ))}
                </ul>
            )}
        </div>
    );
};