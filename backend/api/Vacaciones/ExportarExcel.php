<?php
header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
header('Content-Disposition: attachment; filename="vacaciones_' . date('Y-m-d_His') . '.xlsx"');

include_once '../../db/Connection.php';
require_once '../../vendor/autoload.php';

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Color;

$filtros = $_GET;

$sql = "SELECT 
            v.IdVacaciones,
            v.NoEmpleado,
            v.NombreCompleto,
            v.Departamento,
            v.Cargo,
            v.FechaIngreso,
            v.FechaInicio,
            v.FechaFin,
            v.DiasTomar,
            v.FechaRetornoLabores,
            v.FechaSolicitud,
            v.UsuarioSolicita,
            v.UsuarioAutoriza,
            v.FechaAutoriza,
            v.UsuarioValida,
            v.FechaValidado,
            v.Estatus,
            v.Anio,
            v.Comentarios,
            v.SaldoDias,
            v.DiasCorresponden,
            v.Antiguedad,
            v.NoContarDomingos,
            CASE 
                WHEN v.NoContarDomingos = 1 THEN 'Sí'
                ELSE 'No'
            END AS NoContarDomingosTexto,
            CASE 
                WHEN v.Estatus = 0 THEN 'Solicitada'
                WHEN v.Estatus = 1 THEN 'Autorizada'
                WHEN v.Estatus = 2 THEN 'Validada'
                WHEN v.Estatus = 3 THEN 'Cancelada'
                WHEN v.Estatus = 4 THEN 'En Revisión'
                ELSE 'Desconocido'
            END AS EstatusTexto
        FROM t_vacaciones v
        WHERE 1=1";

$params = [];
$conditions = [];

if (!empty($filtros['noEmpleado'])) {
    $conditions[] = "v.NoEmpleado LIKE ?";
    $params[] = "%{$filtros['noEmpleado']}%";
}

if (!empty($filtros['nombreCompleto'])) {
    $conditions[] = "v.NombreCompleto LIKE ?";
    $params[] = "%{$filtros['nombreCompleto']}%";
}

if (!empty($filtros['departamento'])) {
    $conditions[] = "v.Departamento LIKE ?";
    $params[] = "%{$filtros['departamento']}%";
}

if (!empty($filtros['fechaInicio'])) {
    $conditions[] = "v.FechaInicio >= ?";
    $params[] = $filtros['fechaInicio'];
}

if (!empty($filtros['fechaFin'])) {
    $conditions[] = "v.FechaFin <= ?";
    $params[] = $filtros['fechaFin'];
}

if (!empty($filtros['fechaSolicitud'])) {
    $conditions[] = "v.FechaSolicitud >= ?";
    $params[] = $filtros['fechaSolicitud'];
}

if (!empty($filtros['estatus']) && $filtros['estatus'] !== '') {
    $conditions[] = "v.Estatus = ?";
    $params[] = $filtros['estatus'];
}

if (!empty($filtros['anio'])) {
    $conditions[] = "v.Anio = ?";
    $params[] = $filtros['anio'];
}

if (!empty($filtros['noContarDomingos']) && $filtros['noContarDomingos'] !== '') {
    $conditions[] = "v.NoContarDomingos = ?";
    $params[] = $filtros['noContarDomingos'];
}

if (count($conditions) > 0) {
    $sql .= " AND " . implode(" AND ", $conditions);
}

$sql .= " ORDER BY v.FechaSolicitud DESC";

$stmt = $Conexion->prepare($sql);

if (count($params) > 0) {
    $stmt->execute($params);
} else {
    $stmt->execute();
}

$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();

$sheet->setTitle('Vacaciones');

$headers = [
    'A1' => 'ID',
    'B1' => 'No. Empleado',
    'C1' => 'Nombre Completo',
    'D1' => 'Departamento',
    'E1' => 'Cargo',
    'F1' => 'Fecha Ingreso',
    'G1' => 'Fecha Inicio Vacaciones',
    'H1' => 'Fecha Fin Vacaciones',
    'I1' => 'Días a Tomar',
    'J1' => 'Fecha Retorno',
    'K1' => 'Fecha Solicitud',
    'L1' => 'Usuario Solicita',
    'M1' => 'Usuario Autoriza',
    'N1' => 'Fecha Autorización',
    'O1' => 'Usuario Valida',
    'P1' => 'Fecha Validación',
    'Q1' => 'Estatus',
    'R1' => 'Año',
    'S1' => 'Saldo Días',
    'T1' => 'Días Corresponden',
    'U1' => 'Antigüedad',
    'V1' => 'Sin Domingos',
    'W1' => 'Comentarios'
];

foreach ($headers as $cell => $value) {
    $sheet->setCellValue($cell, $value);
}

$headerStyle = [
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E85C0D']],
    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER]
];
$sheet->getStyle('A1:W1')->applyFromArray($headerStyle);

$row = 2;
foreach ($result as $vacacion) {
    $sheet->setCellValue('A' . $row, $vacacion['IdVacaciones']);
    $sheet->setCellValue('B' . $row, $vacacion['NoEmpleado'] ?? '');
    $sheet->setCellValue('C' . $row, $vacacion['NombreCompleto'] ?? '');
    $sheet->setCellValue('D' . $row, $vacacion['Departamento'] ?? '');
    $sheet->setCellValue('E' . $row, $vacacion['Cargo'] ?? '');
    $sheet->setCellValue('F' . $row, $vacacion['FechaIngreso'] ?? '');
    $sheet->setCellValue('G' . $row, $vacacion['FechaInicio'] ?? '');
    $sheet->setCellValue('H' . $row, $vacacion['FechaFin'] ?? '');
    $sheet->setCellValue('I' . $row, $vacacion['DiasTomar'] ?? 0);
    $sheet->setCellValue('J' . $row, $vacacion['FechaRetornoLabores'] ?? '');
    $sheet->setCellValue('K' . $row, $vacacion['FechaSolicitud'] ?? '');
    $sheet->setCellValue('L' . $row, $vacacion['UsuarioSolicita'] ?? '');
    $sheet->setCellValue('M' . $row, $vacacion['UsuarioAutoriza'] ?? '');
    $sheet->setCellValue('N' . $row, $vacacion['FechaAutoriza'] ?? '');
    $sheet->setCellValue('O' . $row, $vacacion['UsuarioValida'] ?? '');
    $sheet->setCellValue('P' . $row, $vacacion['FechaValidado'] ?? '');
    $sheet->setCellValue('Q' . $row, $vacacion['EstatusTexto'] ?? '');
    $sheet->setCellValue('R' . $row, $vacacion['Anio'] ?? 0);
    $sheet->setCellValue('S' . $row, $vacacion['SaldoDias'] ?? 0);
    $sheet->setCellValue('T' . $row, $vacacion['DiasCorresponden'] ?? 0);
    $sheet->setCellValue('U' . $row, $vacacion['Antiguedad'] ?? 0);
    $sheet->setCellValue('V' . $row, $vacacion['NoContarDomingosTexto'] ?? 'No');
    $sheet->setCellValue('W' . $row, $vacacion['Comentarios'] ?? '');
    
    // Colorear fila según estatus
    $estatus = $vacacion['Estatus'] ?? 0;
    $color = '';
    switch ($estatus) {
        case 0:
            $color = 'FFF3E0'; // Naranja claro
            break;
        case 1:
            $color = 'E8F5E9'; // Verde claro
            break;
        case 2:
            $color = 'C8E6C9'; // Verde más intenso
            break;
        case 3:
            $color = 'FFEBEE'; // Rojo claro
            break;
        case 4:
            $color = 'E3F2FD'; // Azul claro
            break;
        default:
            $color = 'FFFFFF'; // Blanco
            break;
    }
    
    if ($color !== 'FFFFFF') {
        $sheet->getStyle('A' . $row . ':W' . $row)->applyFromArray([
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => $color]
            ]
        ]);
    }
    
    $row++;
}

foreach (range('A', 'W') as $column) {
    $sheet->getColumnDimension($column)->setAutoSize(true);
}

$sheet->getStyle('A2:W' . ($row - 1))->applyFromArray([
    'borders' => [
        'allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'CCCCCC']]
    ],
    'alignment' => [
        'horizontal' => Alignment::HORIZONTAL_LEFT,
        'vertical' => Alignment::VERTICAL_CENTER
    ]
]);

// Ajustar formato de fechas
$sheet->getStyle('F2:W' . ($row - 1))
    ->getNumberFormat()
    ->setFormatCode('yyyy-mm-dd');

$writer = new Xlsx($spreadsheet);
$writer->save('php://output');

$stmt = null;
$Conexion = null;
?>