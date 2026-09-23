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

    $idDepartamento = isset($_GET['IdDepartamento']) && $_GET['IdDepartamento'] !== ''
        ? (int)$_GET['IdDepartamento']
        : null;

    $idEmpresa = isset($_GET['IdEmpresa']) && $_GET['IdEmpresa'] !== ''
        ? (int)$_GET['IdEmpresa']
        : null;

    $busqueda = isset($_GET['Busqueda']) && trim((string)$_GET['Busqueda']) !== ''
        ? trim((string)$_GET['Busqueda'])
        : null;

    $query = "EXEC dbo.sp_MonitoreoSaldos :IdDepartamento, :IdEmpresa, :Busqueda";

    $stmt = $Conexion->prepare($query);

    if ($idDepartamento === null) {
        $stmt->bindValue(':IdDepartamento', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':IdDepartamento', $idDepartamento, PDO::PARAM_INT);
    }

    if ($idEmpresa === null) {
        $stmt->bindValue(':IdEmpresa', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':IdEmpresa', $idEmpresa, PDO::PARAM_INT);
    }

    if ($busqueda === null) {
        $stmt->bindValue(':Busqueda', null, PDO::PARAM_NULL);
    } else {
        $stmt->bindValue(':Busqueda', $busqueda, PDO::PARAM_STR);
    }

    $stmt->execute();

    $detalle = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->nextRowset();
    $resumen = $stmt->fetch(PDO::FETCH_ASSOC);
    $stmt->nextRowset();
    $porDepartamento = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $stmt->nextRowset();
    $porEmpresa = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $detalleFormateado = array_map(function ($r) {
        return [
            'IdPersonal'     => (int)($r['IdPersonal'] ?? 0),
            'NoEmpleado'     => (string)($r['NoEmpleado'] ?? ''),
            'NombreCompleto' => (string)($r['NombreCompleto'] ?? ''),
            'Departamento'   => (string)($r['Departamento'] ?? ''),
            'Empresa'        => (string)($r['Empresa'] ?? ''),
            'Anio'           => (int)($r['Anio'] ?? 0),
            'Periodo'        => (int)($r['Periodo'] ?? 0),
            'DiasOtorgados'  => (int)($r['DiasOtorgados'] ?? 0),
            'DiasTomados'    => (int)($r['DiasTomados'] ?? 0),
            'DiasVigentes'   => (int)($r['DiasVigentes'] ?? 0),
            'DiasVencidos'   => (int)($r['DiasVencidos'] ?? 0),
            'EstadoPeriodo'  => (string)($r['EstadoPeriodo'] ?? '')
        ];
    }, $detalle);

    $porDepartamentoFormateado = array_map(function ($r) {
        return [
            'Departamento'    => (string)($r['Departamento'] ?? ''),
            'TotalEmpleados'  => (int)($r['TotalEmpleados'] ?? 0),
            'TotalOtorgados'  => (int)($r['TotalOtorgados'] ?? 0),
            'TotalTomados'    => (int)($r['TotalTomados'] ?? 0),
            'TotalVigentes'   => (int)($r['TotalVigentes'] ?? 0),
            'TotalVencidos'   => (int)($r['TotalVencidos'] ?? 0)
        ];
    }, $porDepartamento);

    $porEmpresaFormateado = array_map(function ($r) {
        return [
            'Empresa'         => (string)($r['Empresa'] ?? ''),
            'TotalEmpleados'  => (int)($r['TotalEmpleados'] ?? 0),
            'TotalOtorgados'  => (int)($r['TotalOtorgados'] ?? 0),
            'TotalTomados'    => (int)($r['TotalTomados'] ?? 0),
            'TotalVigentes'   => (int)($r['TotalVigentes'] ?? 0),
            'TotalVencidos'   => (int)($r['TotalVencidos'] ?? 0)
        ];
    }, $porEmpresa);

    echo json_encode([
        'status'  => true,
        'data'    => [
            'Resumen'         => [
                'TotalEmpleados' => (int)($resumen['TotalEmpleados'] ?? 0),
                'TotalOtorgados' => (int)($resumen['TotalOtorgados'] ?? 0),
                'TotalTomados'   => (int)($resumen['TotalTomados'] ?? 0),
                'TotalVigentes'  => (int)($resumen['TotalVigentes'] ?? 0),
                'TotalVencidos'  => (int)($resumen['TotalVencidos'] ?? 0)
            ],
            'Detalle'         => $detalleFormateado,
            'PorDepartamento' => $porDepartamentoFormateado,
            'PorEmpresa'      => $porEmpresaFormateado
        ],
        'message' => 'Monitoreo de saldos obtenido correctamente'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'status'  => false,
        'data'    => null,
        'message' => 'Error al obtener el monitoreo: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
