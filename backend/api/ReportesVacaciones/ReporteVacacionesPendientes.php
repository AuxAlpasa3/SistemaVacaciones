<?php

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../db/Connection.php';

try {

    $query = "EXEC dbo.sp_ReporteVacacionesPendientes";

    $stmt = $Conexion->prepare($query);

    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $resultado = [];

    foreach ($data as $row) {

        $fechaIngreso = null;
        $fechaAniversario = null;
        $fechaInicioPeriodo = null;
        $fechaFinPeriodo = null;
        $puedeUtilizarDesde = null;

        if (!empty($row['FechaIngreso'])) {
            if ($row['FechaIngreso'] instanceof DateTimeInterface) {
                $fechaIngreso = $row['FechaIngreso']->format('Y-m-d');
            } else {
                $fechaIngreso = date(
                    'Y-m-d',
                    strtotime($row['FechaIngreso'])
                );
            }
        }

        if (!empty($row['FechaAniversario'])) {
            if ($row['FechaAniversario'] instanceof DateTimeInterface) {
                $fechaAniversario = $row['FechaAniversario']->format('Y-m-d');
            } else {
                $fechaAniversario = date(
                    'Y-m-d',
                    strtotime($row['FechaAniversario'])
                );
            }
        }

        if (!empty($row['FechaInicioPeriodo'])) {
            if ($row['FechaInicioPeriodo'] instanceof DateTimeInterface) {
                $fechaInicioPeriodo = $row['FechaInicioPeriodo']->format('Y-m-d');
            } else {
                $fechaInicioPeriodo = date(
                    'Y-m-d',
                    strtotime($row['FechaInicioPeriodo'])
                );
            }
        }

        if (!empty($row['FechaFinPeriodo'])) {
            if ($row['FechaFinPeriodo'] instanceof DateTimeInterface) {
                $fechaFinPeriodo = $row['FechaFinPeriodo']->format('Y-m-d');
            } else {
                $fechaFinPeriodo = date(
                    'Y-m-d',
                    strtotime($row['FechaFinPeriodo'])
                );
            }
        }

        if (!empty($row['PuedeUtilizarDesde'])) {
            if ($row['PuedeUtilizarDesde'] instanceof DateTimeInterface) {
                $puedeUtilizarDesde = $row['PuedeUtilizarDesde']->format('Y-m-d');
            } else {
                $puedeUtilizarDesde = date(
                    'Y-m-d',
                    strtotime($row['PuedeUtilizarDesde'])
                );
            }
        }

        $resultado[] = [
            'IdPersonal' => isset($row['IdPersonal'])
                ? (int)$row['IdPersonal']
                : 0,

            'NoEmpleado' => $row['NoEmpleado']
                ?? '',

            'NombreCompleto' => $row['NombreCompleto']
                ?? '',

            'IdDepartamento' => isset($row['IdDepartamento'])
                ? (int)$row['IdDepartamento']
                : null,

            'Departamento' => $row['Departamento']
                ?? 'SIN DEPARTAMENTO',

            'FechaIngreso' => $fechaIngreso,

            'FechaAniversario' => $fechaAniversario,

            'Periodo' => isset($row['Periodo'])
                ? (int)$row['Periodo']
                : 0,

            'Antiguedad' => isset($row['Antiguedad'])
                ? (int)$row['Antiguedad']
                : 0,

            'FechaInicioPeriodo' => $fechaInicioPeriodo,

            'FechaFinPeriodo' => $fechaFinPeriodo,

            'PuedeUtilizarDesde' => $puedeUtilizarDesde,

            'DiasAsignados' => isset($row['DiasAsignados'])
                ? (int)$row['DiasAsignados']
                : 0,

            'DiasTomados' => isset($row['DiasTomados'])
                ? (int)$row['DiasTomados']
                : 0,

            'DiasRestantes' => isset($row['DiasRestantes'])
                ? (int)$row['DiasRestantes']
                : 0,

            'DiasPendientes' => isset($row['DiasPendientes'])
                ? (int)$row['DiasPendientes']
                : 0,

            'DiasVencidos' => isset($row['DiasVencidos'])
                ? (int)$row['DiasVencidos']
                : 0,

            'EstadoPeriodo' => $row['EstadoPeriodo']
                ?? ''
        ];
    }

    echo json_encode([
        'status' => true,
        'data' => $resultado,
        'message' => 'Reporte de vacaciones pendientes obtenido correctamente'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => 'Error al obtener el reporte: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

?>