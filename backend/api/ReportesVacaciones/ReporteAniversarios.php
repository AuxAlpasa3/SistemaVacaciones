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

    $query = "EXEC dbo.sp_ReporteAniversarios";

    $stmt = $Conexion->prepare($query);

    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $resultado = [];

    foreach ($data as $row) {

        $fechaIngreso = null;
        $fechaAniversario = null;
        $inicioNuevoPeriodo = null;
        $puedeUtilizarDesde = null;
        $fechaVencimiento = null;

        if (!empty($row['FechaIngreso'])) {
            if ($row['FechaIngreso'] instanceof DateTimeInterface) {
                $fechaIngreso = $row['FechaIngreso']->format('Y-m-d');
            } else {
                $fechaIngreso = date('Y-m-d', strtotime($row['FechaIngreso']));
            }
        }

        if (!empty($row['FechaAniversario'])) {
            if ($row['FechaAniversario'] instanceof DateTimeInterface) {
                $fechaAniversario = $row['FechaAniversario']->format('Y-m-d');
            } else {
                $fechaAniversario = date('Y-m-d', strtotime($row['FechaAniversario']));
            }
        }

        if (!empty($row['InicioNuevoPeriodo'])) {
            if ($row['InicioNuevoPeriodo'] instanceof DateTimeInterface) {
                $inicioNuevoPeriodo = $row['InicioNuevoPeriodo']->format('Y-m-d');
            } else {
                $inicioNuevoPeriodo = date('Y-m-d', strtotime($row['InicioNuevoPeriodo']));
            }
        }

        if (!empty($row['PuedeUtilizarDesde'])) {
            if ($row['PuedeUtilizarDesde'] instanceof DateTimeInterface) {
                $puedeUtilizarDesde = $row['PuedeUtilizarDesde']->format('Y-m-d');
            } else {
                $puedeUtilizarDesde = date('Y-m-d', strtotime($row['PuedeUtilizarDesde']));
            }
        }

        if (!empty($row['FechaVencimiento'])) {
            if ($row['FechaVencimiento'] instanceof DateTimeInterface) {
                $fechaVencimiento = $row['FechaVencimiento']->format('Y-m-d');
            } else {
                $fechaVencimiento = date('Y-m-d', strtotime($row['FechaVencimiento']));
            }
        }

        $resultado[] = [
            'IdPersonal' => isset($row['IdPersonal'])
                ? (int)$row['IdPersonal']
                : 0,

            'NoEmpleado' => $row['NoEmpleado'] ?? '',

            'NombreCompleto' => $row['NombreCompleto'] ?? '',

            'FechaIngreso' => $fechaIngreso,

            'FechaAniversario' => $fechaAniversario,

            'InicioNuevoPeriodo' => $inicioNuevoPeriodo,

            'DiasCorresponden' => isset($row['DiasCorresponden'])
                ? (int)$row['DiasCorresponden']
                : 0,

            'PuedeUtilizarDesde' => $puedeUtilizarDesde,

            'FechaVencimiento' => $fechaVencimiento,

            'Antiguedad' => isset($row['Antiguedad'])
                ? (int)$row['Antiguedad']
                : 0
        ];
    }

    echo json_encode([
        'status' => true,
        'data' => $resultado,
        'message' => 'Reporte de aniversarios obtenido correctamente'
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