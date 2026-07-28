<?php
include_once '../../db/Connection.php';

$filtros = $_GET;

$sql = "SELECT 
            t1.Idpersonal,
            t1.NoEmpleado,
            t1.Nombre,
            t1.ApPaterno,
            t1.ApMaterno,
            CONCAT(t1.Nombre, ' ', t1.ApPaterno, ' ', t1.ApMaterno) as NombreCompleto,
            t2.NomCargo as Cargo,
            t3.NomDepto as Departamento,
            t4.NomEmpresa as Empresa,
            t5.NomLargo as Ubicacion,
            CONCAT(t6.Nombre, ' ', t6.ApPaterno, ' ', t6.ApMaterno) as JefeInmediato,
            t1.Status,
            CASE WHEN t7.IdVehiculo IS NULL THEN 'NO' ELSE 'SI' END as TieneVehiculo,
            t1.Email,
            t1.Contacto,
            t1.TipoSangre,
            t1.NSS,
            t1.FechaCreacion
        FROM t_personal t1
        LEFT JOIN t_cargo t2 ON t1.Cargo = t2.IdCargo
        LEFT JOIN t_departamento t3 ON t1.Departamento = t3.IdDepartamento
        LEFT JOIN t_empresa t4 ON t1.Empresa = t4.IdEmpresa
        LEFT JOIN t_ubicacion t5 ON t1.IdUbicacion = t5.IdUbicacion
        LEFT JOIN t_personal t6 ON t1.IdJefeInmediato = t6.IdPersonal
        LEFT JOIN t_vehiculos t7 ON t1.IdPersonal = t7.IdAsociado AND t7.TipoVehiculo = 1
        WHERE 1=1";

$params = [];
$conditions = [];

if (!empty($filtros['noEmpleado'])) {
    $conditions[] = "t1.NoEmpleado LIKE ?";
    $params[] = "%{$filtros['noEmpleado']}%";
}

if (!empty($filtros['nombreCompleto'])) {
    $conditions[] = "(t1.Nombre LIKE ? OR t1.ApPaterno LIKE ? OR t1.ApMaterno LIKE ? OR CONCAT(t1.Nombre, ' ', t1.ApPaterno, ' ', t1.ApMaterno) LIKE ?)";
    $params[] = "%{$filtros['nombreCompleto']}%";
    $params[] = "%{$filtros['nombreCompleto']}%";
    $params[] = "%{$filtros['nombreCompleto']}%";
    $params[] = "%{$filtros['nombreCompleto']}%";
}

if (!empty($filtros['fechaCreacionInicio'])) {
    $conditions[] = "CAST(t1.FechaCreacion AS DATE) >= ?";
    $params[] = $filtros['fechaCreacionInicio'];
}

if (!empty($filtros['fechaCreacionFin'])) {
    $conditions[] = "CAST(t1.FechaCreacion AS DATE) <= ?";
    $params[] = $filtros['fechaCreacionFin'];
}

if (!empty($filtros['estatus'])) {
    $conditions[] = "t1.Status = ?";
    $params[] = $filtros['estatus'];
}

if (!empty($filtros['empresa']) && $filtros['empresa'] !== '0') {
    $conditions[] = "t1.Empresa = ?";
    $params[] = $filtros['empresa'];
}

if (!empty($filtros['departamento']) && $filtros['departamento'] !== '0') {
    $conditions[] = "t1.Departamento = ?";
    $params[] = $filtros['departamento'];
}

if (!empty($filtros['cargo']) && $filtros['cargo'] !== '0') {
    $conditions[] = "t1.Cargo = ?";
    $params[] = $filtros['cargo'];
}

if (!empty($filtros['supervisor']) && $filtros['supervisor'] !== '0') {
    $conditions[] = "t1.IdJefeInmediato = ?";
    $params[] = $filtros['supervisor'];
}

if (!empty($filtros['tieneVehiculo'])) {
    $conditions[] = "t1.TieneVehiculo = ?";
    $params[] = $filtros['tieneVehiculo'];
}

if (count($conditions) > 0) {
    $sql .= " AND " . implode(" AND ", $conditions);
}

$sql .= " ORDER BY t1.FechaCreacion DESC";

$stmt = $Conexion->prepare($sql);

if (count($params) > 0) {
    $stmt->execute($params);
} else {
    $stmt->execute();
}

$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
$totalRegistros = count($result);
?>

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Empleados</title>
    <style>
        @page {
            size: landscape;
            margin: 8mm;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 5px;
                font-size: 8px;
            }
            .no-print {
                display: none !important;
            }
            table {
                page-break-inside: avoid;
                width: 100%;
            }
            tr {
                page-break-inside: avoid;
            }
            th {
                background-color: #E85C0D !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .status-active {
                color: #27ae60 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .status-inactive {
                color: #e74c3c !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .badge-si {
                background-color: #27ae60 !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .badge-no {
                background-color: #e74c3c !important;
                color: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            .header h1 {
                font-size: 14px;
            }
            .header .subtitle {
                font-size: 9px;
            }
            .header .fecha {
                font-size: 8px;
            }
            .footer {
                font-size: 7px;
            }
            .info-bar {
                font-size: 8px;
                padding: 4px 8px;
            }
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 10px;
            font-size: 9px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #E85C0D;
        }
        
        .header h1 {
            color: #E85C0D;
            font-size: 16px;
            margin: 0;
            text-transform: uppercase;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 10px;
            margin-top: 3px;
        }
        
        .header .fecha {
            color: #888;
            font-size: 9px;
            margin-top: 2px;
        }
        
        .info-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 6px 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            font-size: 9px;
        }
        
        .info-bar .total {
            font-weight: bold;
            color: #E85C0D;
        }
        
        .button-container {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .print-button {
            background-color: #E85C0D;
            color: white;
            border: none;
            padding: 8px 20px;
            font-size: 14px;
            cursor: pointer;
            border-radius: 5px;
        }
        
        .print-button:hover {
            background-color: #c44d0a;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
        }
        
        th {
            background-color: #E85C0D;
            color: white;
            padding: 5px 3px;
            text-align: center;
            font-size: 7.5px;
            font-weight: bold;
            border: 1px solid #D35400;
            white-space: nowrap;
        }
        
        td {
            border: 1px solid #ddd;
            padding: 4px 3px;
            text-align: center;
            font-size: 7.5px;
            word-wrap: break-word;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .status-active {
            color: #27ae60;
            font-weight: bold;
        }
        
        .status-inactive {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 10px;
            text-align: center;
            font-size: 8px;
            color: #888;
            padding-top: 8px;
            border-top: 1px solid #ddd;
        }
        
        .footer .page-info {
            float: right;
        }
        
        .badge-si {
            display: inline-block;
            padding: 1px 6px;
            background-color: #27ae60;
            color: white;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
        }
        
        .badge-no {
            display: inline-block;
            padding: 1px 6px;
            background-color: #e74c3c;
            color: white;
            border-radius: 3px;
            font-size: 7px;
            font-weight: bold;
        }
        
        /* Anchos de columna */
        .col-id { width: 6%; }
        .col-nombre { width: 12%; }
        .col-cargo { width: 9%; }
        .col-depto { width: 9%; }
        .col-empresa { width: 8%; }
        .col-ubicacion { width: 7%; }
        .col-jefe { width: 10%; }
        .col-estatus { width: 6%; }
        .col-vehiculo { width: 5%; }
        .col-email { width: 10%; }
        .col-telefono { width: 7%; }
        .col-sangre { width: 5%; }
        .col-nss { width: 8%; }
        .col-fecha { width: 8%; }
        
        /* Estilos para texto largo */
        .text-left {
            text-align: left !important;
        }
        
        .text-small {
            font-size: 6.5px;
        }
    </style>
</head>
<body>
    <div class="button-container no-print">
        <button class="print-button" onclick="window.print();">
            🖨️ Imprimir Reporte
        </button>
        <button class="print-button" onclick="window.close();" style="background-color: #666; margin-left: 10px;">
            ✖ Cerrar
        </button>
    </div>
    
    <div class="header">
        <h1>📋 Catálogo de Empleados</h1>
        <div class="subtitle">Sistema de Gestión de Recursos Humanos</div>
        <div class="fecha">Fecha de generación: <?php echo date('d/m/Y H:i:s'); ?></div>
    </div>
    
    <div class="info-bar">
        <span>Total de empleados: <span class="total"><?php echo $totalRegistros; ?></span></span>
        <span>Filtros aplicados: <?php echo count($conditions) > 0 ? 'Sí' : 'Ninguno'; ?></span>
        <span>Reporte generado por el sistema</span>
    </div>
    
    <table>
        <thead>
            <tr>
                <th class="col-id">No.</th>
                <th class="col-nombre">Nombre Completo</th>
                <th class="col-cargo">Cargo</th>
                <th class="col-depto">Departamento</th>
                <th class="col-empresa">Empresa</th>
                <th class="col-ubicacion">Ubicación</th>
                <th class="col-jefe">Jefe Inmediato</th>
                <th class="col-estatus">Estatus</th>
                <th class="col-vehiculo">Vehículo</th>
                <th class="col-email">Email</th>
                <th class="col-telefono">Teléfono</th>
                <th class="col-sangre">Tipo Sangre</th>
                <th class="col-nss">NSS</th>
                <th class="col-fecha">Fecha Creación</th>
            </tr>
        </thead>
        <tbody>
            <?php if ($totalRegistros > 0): ?>
                <?php foreach ($result as $empleado): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($empleado['NoEmpleado']); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['NombreCompleto']); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['Cargo'] ?? 'N/A'); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['Departamento'] ?? 'N/A'); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['Empresa'] ?? 'N/A'); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['Ubicacion'] ?? 'N/A'); ?></td>
                        <td class="text-left"><?php echo htmlspecialchars($empleado['JefeInmediato'] ?? 'N/A'); ?></td>
                        <td class="<?php echo $empleado['Status'] == '1' ? 'status-active' : 'status-inactive'; ?>">
                            <?php echo $empleado['Status'] == '1' ? '● Activo' : '● Inactivo'; ?>
                        </td>
                        <td>
                            <?php if ($empleado['TieneVehiculo'] == 'SI'): ?>
                                <span class="badge-si">SI</span>
                            <?php else: ?>
                                <span class="badge-no">NO</span>
                            <?php endif; ?>
                        </td>
                        <td class="text-left text-small"><?php echo htmlspecialchars($empleado['Email'] ?? ''); ?></td>
                        <td><?php echo htmlspecialchars($empleado['Contacto'] ?? ''); ?></td>
                        <td><?php echo htmlspecialchars($empleado['TipoSangre'] ?? ''); ?></td>
                        <td class="text-small"><?php echo htmlspecialchars($empleado['NSS'] ?? ''); ?></td>
                        <td><?php echo htmlspecialchars($empleado['FechaCreacion'] ?? ''); ?></td>
                    </tr>
                <?php endforeach; ?>
            <?php else: ?>
                <tr>
                    <td colspan="14" style="text-align:center;padding:20px;color:#999;font-size:12px;">
                        No se encontraron empleados con los filtros aplicados
                    </td>
                </tr>
            <?php endif; ?>
        </tbody>
    </table>
    
    <div class="footer">
        <span>© <?php echo date('Y'); ?> - Sistema de Gestión de Empleados</span>
        <span class="page-info">Página 1 de 1 | Registros: <?php echo $totalRegistros; ?></span>
    </div>
</body>
</html>

<?php
$stmt = null;
$Conexion = null;
?>