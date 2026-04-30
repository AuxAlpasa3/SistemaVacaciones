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
            CONCAT(t6.Nombre, ' ', t6.ApPaterno, ' ', t6.ApMaterno) as Supervisor,
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
        LEFT JOIN t_personal t6 ON t1.IdSupervisor = t6.IdPersonal
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
    $conditions[] = "t1.IdSupervisor = ?";
    $params[] = $filtros['supervisor'];
}

if (!empty($filtros['tieneVehiculo'])) {
    $conditions[] = "t1.TieneVehiculo = ?";
    $params[] = $filtros['tieneVehiculo'];
}

// Agregar condiciones a la consulta
if (count($conditions) > 0) {
    $sql .= " AND " . implode(" AND ", $conditions);
}

$sql .= " ORDER BY t1.FechaCreacion DESC";

// Preparar la consulta para SQL Server con PDO
$stmt = $Conexion->prepare($sql);

// Ejecutar la consulta con los parámetros
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
        @media print {
            body {
                margin: 0;
                padding: 20px;
            }
            .no-print {
                display: none;
            }
            table {
                page-break-inside: avoid;
            }
            tr {
                page-break-inside: avoid;
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .header h1 {
            color: #E85C0D;
            margin: 0;
        }
        
        .header p {
            color: #666;
            margin: 5px 0 0;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th {
            background-color: #E85C0D;
            color: white;
            padding: 10px;
            text-align: center;
            font-size: 12px;
        }
        
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: center;
            font-size: 11px;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        
        .status-active {
            color: green;
            font-weight: bold;
        }
        
        .status-inactive {
            color: red;
            font-weight: bold;
        }
        
        .print-button {
            background-color: #E85C0D;
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 16px;
            cursor: pointer;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .print-button:hover {
            background-color: #c44d0a;
        }
        
        .button-container {
            text-align: center;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="button-container no-print">
        <button class="print-button" onclick="window.print();">
            🖨️ Imprimir
        </button>
    </div>
    
    <div class="header">
        <h1>Catálogo de Empleados</h1>
        <p>Fecha de generación: <?php echo date('d/m/Y H:i:s'); ?></p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>No. Empleado</th>
                <th>Nombre Completo</th>
                <th>Cargo</th>
                <th>Departamento</th>
                <th>Empresa</th>
                <th>Ubicación</th>
                <th>Supervisor</th>
                <th>Estatus</th>
                <th>Vehículo</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Tipo Sangre</th>
                <th>NSS</th>
                <th>Fecha Creación</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($result as $empleado): ?>
                <tr>
                    <td><?php echo htmlspecialchars($empleado['NoEmpleado']); ?></td>
                    <td><?php echo htmlspecialchars($empleado['NombreCompleto']); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Cargo'] ?? 'N/A'); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Departamento'] ?? 'N/A'); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Empresa'] ?? 'N/A'); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Ubicacion'] ?? 'N/A'); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Supervisor'] ?? 'N/A'); ?></td>
                    <td class="<?php echo $empleado['Status'] == '1' ? 'status-active' : 'status-inactive'; ?>">
                        <?php echo $empleado['Status'] == '1' ? 'Activo' : 'Inactivo'; ?>
                    </td>
                    <td><?php echo htmlspecialchars($empleado['TieneVehiculo'] ?? 'NO'); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Email'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($empleado['Contacto'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($empleado['TipoSangre'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($empleado['NSS'] ?? ''); ?></td>
                    <td><?php echo htmlspecialchars($empleado['FechaCreacion'] ?? ''); ?></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    
    <div class="footer">
        <p>Total de empleados: <?php echo $totalRegistros; ?></p>
        <p>Sistema de Gestión de Empleados</p>
    </div>
</body>
</html>

<?php
// Cerrar la conexión
$stmt = null;
$Conexion = null;
?>