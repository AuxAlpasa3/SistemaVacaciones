<?php
include_once '../../db/Connection.php';
require '../../../vendor/autoload.php';

use Dompdf\Dompdf;
use Dompdf\Options;

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

// Calcular el total de empleados
$totalEmpleados = count($result);
$fechaGeneracion = date('d/m/Y H:i:s');

$html = '
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Reporte de Empleados</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 10px;
            font-size: 9px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 3px solid #E85C0D;
        }
        
        .header h1 {
            color: #E85C0D;
            font-size: 20px;
            margin: 0;
            text-transform: uppercase;
        }
        
        .header .subtitle {
            color: #666;
            font-size: 11px;
            margin-top: 5px;
        }
        
        .header .fecha {
            color: #888;
            font-size: 10px;
            margin-top: 3px;
        }
        
        .info-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 8px 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
            font-size: 10px;
        }
        
        .info-bar .total {
            font-weight: bold;
            color: #E85C0D;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            font-size: 8px;
        }
        
        th {
            background-color: #E85C0D;
            color: white;
            padding: 6px 4px;
            text-align: center;
            font-size: 8px;
            font-weight: bold;
            border: 1px solid #D35400;
            white-space: nowrap;
        }
        
        td {
            border: 1px solid #ddd;
            padding: 5px 4px;
            text-align: center;
            font-size: 8px;
            word-wrap: break-word;
            max-width: 100px;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        tr:hover {
            background-color: #f0f0f0;
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
            margin-top: 15px;
            text-align: center;
            font-size: 8px;
            color: #888;
            padding-top: 10px;
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
        
        @media print {
            body { 
                margin: 0; 
                padding: 5px;
            }
            .header h1 { font-size: 18px; }
            th { background-color: #E85C0D !important; color: white !important; }
            .no-print { display: none; }
        }
        
        /* Estilos para evitar que el contenido se desborde */
        .col-id { width: 8%; }
        .col-nombre { width: 15%; }
        .col-cargo { width: 12%; }
        .col-depto { width: 12%; }
        .col-empresa { width: 10%; }
        .col-ubicacion { width: 8%; }
        .col-jefe { width: 12%; }
        .col-estatus { width: 6%; }
        .col-vehiculo { width: 6%; }
        .col-email { width: 10%; }
        .col-telefono { width: 8%; }
        .col-sangre { width: 6%; }
        .col-nss { width: 8%; }
        .col-fecha { width: 10%; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Catálogo de Empleados</h1>
        <div class="subtitle">Sistema de Gestión de Recursos Humanos</div>
        <div class="fecha">Fecha de generación: ' . $fechaGeneracion . '</div>
    </div>
    
    <div class="info-bar">
        <span>Total de empleados: <span class="total">' . $totalEmpleados . '</span></span>
        <span>Filtros aplicados: ' . (count($conditions) > 0 ? 'Sí' : 'Ninguno') . '</span>
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
        <tbody>';

if ($totalEmpleados > 0) {
    foreach ($result as $index => $empleado) {
        $estatusClass = $empleado['Status'] == '1' ? 'status-active' : 'status-inactive';
        $estatusText = $empleado['Status'] == '1' ? '● Activo' : '● Inactivo';
        $tieneVehiculo = $empleado['TieneVehiculo'] ?? 'NO';
        $badgeVehiculo = $tieneVehiculo == 'SI' 
            ? '<span class="badge-si">SI</span>' 
            : '<span class="badge-no">NO</span>';
        
        $html .= '<tr>
            <td>' . htmlspecialchars($empleado['NoEmpleado']) . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['NombreCompleto']) . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['Cargo'] ?? 'N/A') . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['Departamento'] ?? 'N/A') . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['Empresa'] ?? 'N/A') . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['Ubicacion'] ?? 'N/A') . '</td>
            <td style="text-align:left;">' . htmlspecialchars($empleado['JefeInmediato'] ?? 'N/A') . '</td>
            <td class="' . $estatusClass . '">' . $estatusText . '</td>
            <td>' . $badgeVehiculo . '</td>
            <td style="text-align:left;font-size:7px;">' . htmlspecialchars($empleado['Email'] ?? '') . '</td>
            <td>' . htmlspecialchars($empleado['Contacto'] ?? '') . '</td>
            <td>' . htmlspecialchars($empleado['TipoSangre'] ?? '') . '</td>
            <td style="font-size:7px;">' . htmlspecialchars($empleado['NSS'] ?? '') . '</td>
            <td>' . htmlspecialchars($empleado['FechaCreacion'] ?? '') . '</td>
        </tr>';
    }
} else {
    $html .= '<tr>
        <td colspan="14" style="text-align:center;padding:20px;color:#999;font-size:12px;">
            No se encontraron empleados con los filtros aplicados
        </td>
    </tr>';
}

$html .= '
        </tbody>
    </table>
    
    <div class="footer">
        <span>© ' . date('Y') . ' - Sistema de Gestión de Empleados</span>
        <span class="page-info">Página 1 de 1 | Registros: ' . $totalEmpleados . '</span>
    </div>
</body>
</html>';

// Configurar Dompdf
$options = new Options();
$options->set('defaultFont', 'Arial');
$options->set('isHtml5ParserEnabled', true);
$options->set('isRemoteEnabled', true);
$options->set('chroot', realpath(''));

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html);

// Configurar papel tamaño A4 en orientación horizontal (landscape)
$dompdf->setPaper('A4', 'landscape');

// Renderizar el PDF
$dompdf->render();

// Enviar el PDF al navegador
$dompdf->stream("empleados_" . date('Y-m-d_His') . ".pdf", array(
    "Attachment" => true,
    "compress" => true
));

$stmt = null;
$Conexion = null;
?>