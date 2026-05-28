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
            t1.IdPersonal,
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
            t1.EsJefeInmediato,
            t1.RutaFoto,
            t1.Email,
            t1.Contacto,
            t1.TipoSangre,
            t1.NSS,
            t1.FechaIngreso,
            t1.FechaCreacion,
            t1.UsuarioCreacion
        FROM t_personal t1
        LEFT JOIN t_cargo t2 ON t1.Cargo = t2.IdCargo
        LEFT JOIN t_departamento t3 ON t1.Departamento = t3.IdDepartamento
        LEFT JOIN t_empresa t4 ON t1.Empresa = t4.IdEmpresa
        LEFT JOIN t_ubicacion t5 ON t1.IdUbicacion = t5.IdUbicacion
        LEFT JOIN t_personal t6 ON t1.IdJefeInmediato = t6.IdPersonal
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

if (!empty($filtros['fechaIngresoInicio'])) {
    $conditions[] = "CAST(t1.FechaIngreso AS DATE) >= ?";
    $params[] = $filtros['fechaIngresoInicio'];
}

if (!empty($filtros['fechaIngresoFin'])) {
    $conditions[] = "CAST(t1.FechaIngreso AS DATE) <= ?";
    $params[] = $filtros['fechaIngresoFin'];
}

if (!empty($filtros['estatus'])) {
    $conditions[] = "t1.Status = ?";
    $params[] = $filtros['estatus'];
}

if (!empty($filtros['EsJefeInmediato'])) {
    $conditions[] = "t1.EsJefeInmediato = ?";
    $params[] = $filtros['EsJefeInmediato'];
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

if (!empty($filtros['tipoSangre'])) {
    $conditions[] = "t1.TipoSangre = ?";
    $params[] = $filtros['tipoSangre'];
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
    'A1' => 'ID Personal',
    'B1' => 'No. Empleado',
    'C1' => 'Nombre',
    'D1' => 'Apellido Paterno',
    'E1' => 'Apellido Materno',
    'F1' => 'Nombre Completo',
    'G1' => 'Cargo',
    'H1' => 'Departamento',
    'I1' => 'Empresa',
    'J1' => 'Ubicación',
    'K1' => 'Supervisor',
    'L1' => 'Estatus',
    'M1' => 'Es Supervisor',
    'N1' => 'Ruta Foto',
    'O1' => 'Email',
    'P1' => 'Contacto',
    'Q1' => 'Tipo de Sangre',
    'R1' => 'NSS',
    'S1' => 'Fecha Ingreso',
    'T1' => 'Fecha Creación',
    'U1' => 'Usuario Creación'
];

foreach ($headers as $cell => $value) {
    $sheet->setCellValue($cell, $value);
}

$headerStyle = [
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E85C0D']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
];
$sheet->getStyle('A1:U1')->applyFromArray($headerStyle);

$row = 2;
foreach ($result as $empleado) {
    $sheet->setCellValue('A' . $row, $empleado['IdPersonal']);
    $sheet->setCellValue('B' . $row, $empleado['NoEmpleado']);
    $sheet->setCellValue('C' . $row, $empleado['Nombre']);
    $sheet->setCellValue('D' . $row, $empleado['ApPaterno']);
    $sheet->setCellValue('E' . $row, $empleado['ApMaterno']);
    $sheet->setCellValue('F' . $row, $empleado['NombreCompleto']);
    $sheet->setCellValue('G' . $row, $empleado['Cargo'] ?? 'N/A');
    $sheet->setCellValue('H' . $row, $empleado['Departamento'] ?? 'N/A');
    $sheet->setCellValue('I' . $row, $empleado['Empresa'] ?? 'N/A');
    $sheet->setCellValue('J' . $row, $empleado['Ubicacion'] ?? 'N/A');
    $sheet->setCellValue('K' . $row, $empleado['Supervisor'] ?? 'N/A');
    $sheet->setCellValue('L' . $row, $empleado['Status'] == '1' ? 'Activo' : 'Inactivo');
    $sheet->setCellValue('M' . $row, $empleado['EsJefeInmediato'] == '1' ? 'Sí' : 'No');
    $sheet->setCellValue('N' . $row, $empleado['RutaFoto'] ?? '');
    $sheet->setCellValue('O' . $row, $empleado['Email'] ?? '');
    $sheet->setCellValue('P' . $row, $empleado['Contacto'] ?? '');
    $sheet->setCellValue('Q' . $row, $empleado['TipoSangre'] ?? '');
    $sheet->setCellValue('R' . $row, $empleado['NSS'] ?? '');
    $sheet->setCellValue('S' . $row, $empleado['FechaIngreso'] ?? '');
    $sheet->setCellValue('T' . $row, $empleado['FechaCreacion'] ?? '');
    $sheet->setCellValue('U' . $row, $empleado['UsuarioCreacion'] ?? '');
    $row++;
}

foreach (range('A', 'U') as $column) {
    $sheet->getColumnDimension($column)->setAutoSize(true);
}

$sheet->getStyle('A2:U' . ($row - 1))->applyFromArray([
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