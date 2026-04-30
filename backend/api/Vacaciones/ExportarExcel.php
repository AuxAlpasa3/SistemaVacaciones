<?php
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="empleados_' . date('Y-m-d_His') . '.xlsx"');

include_once '../../db/Connection.php';
require_once '../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

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

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$sheet->setTitle('Empleados');

$headers = [
    'A1' => 'No. Empleado',
    'B1' => 'Nombre Completo',
    'C1' => 'Cargo',
    'D1' => 'Departamento',
    'E1' => 'Empresa',
    'F1' => 'Ubicación',
    'G1' => 'Supervisor',
    'H1' => 'Estatus',
    'I1' => 'Tiene Vehículo',
    'J1' => 'Email',
    'K1' => 'Teléfono',
    'L1' => 'Tipo de Sangre',
    'M1' => 'NSS',
    'N1' => 'Fecha Creación'
];

foreach ($headers as $cell => $value) {
    $sheet->setCellValue($cell, $value);
}

$headerStyle = [
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E85C0D']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
];
$sheet->getStyle('A1:N1')->applyFromArray($headerStyle);

$row = 2;
foreach ($result as $empleado) {
    $sheet->setCellValue('A' . $row, $empleado['NoEmpleado']);
    $sheet->setCellValue('B' . $row, $empleado['NombreCompleto']);
    $sheet->setCellValue('C' . $row, $empleado['Cargo'] ?? 'N/A');
    $sheet->setCellValue('D' . $row, $empleado['Departamento'] ?? 'N/A');
    $sheet->setCellValue('E' . $row, $empleado['Empresa'] ?? 'N/A');
    $sheet->setCellValue('F' . $row, $empleado['Ubicacion'] ?? 'N/A');
    $sheet->setCellValue('G' . $row, $empleado['Supervisor'] ?? 'N/A');
    $sheet->setCellValue('H' . $row, $empleado['Status'] == '1' ? 'Activo' : 'Inactivo');
    $sheet->setCellValue('I' . $row, $empleado['TieneVehiculo'] ?? 'NO');
    $sheet->setCellValue('J' . $row, $empleado['Email'] ?? '');
    $sheet->setCellValue('K' . $row, $empleado['Contacto'] ?? '');
    $sheet->setCellValue('L' . $row, $empleado['TipoSangre'] ?? '');
    $sheet->setCellValue('M' . $row, $empleado['NSS'] ?? '');
    $sheet->setCellValue('N' . $row, $empleado['FechaCreacion'] ?? '');
    $row++;
}

foreach (range('A', 'N') as $column) {
    $sheet->getColumnDimension($column)->setAutoSize(true);
}

$sheet->getStyle('A2:N' . ($row - 1))->applyFromArray([
    'borders' => [
        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]
    ]
]);

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');

// Cerrar la conexión
$stmt = null;
$Conexion = null;
?>