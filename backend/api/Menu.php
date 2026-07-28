<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../db/Connection.php';

$fechaInicio = isset($_GET['fechaInicio']) ? $_GET['fechaInicio'] : date('Y-m-d');
$fechaFin = isset($_GET['fechaFin']) ? $_GET['fechaFin'] : date('Y-m-d');

$filtroNoEmpleado = isset($_GET['noEmpleado']) ? $_GET['noEmpleado'] : '';
$filtroNombreCompleto = isset($_GET['nombreCompleto']) ? $_GET['nombreCompleto'] : '';
$filtroDepartamento = isset($_GET['departamento']) ? $_GET['departamento'] : '';
$filtroEmpresa = isset($_GET['empresa']) ? $_GET['empresa'] : '';
$filtroJefeInmediato = isset($_GET['jefeInmediato']) ? $_GET['jefeInmediato'] : '';
$filtroEstatus = isset($_GET['estatus']) ? $_GET['estatus'] : '';

$whereConditions = [];
$params = [];

$params[':fechaInicio'] = $fechaInicio;
$params[':fechaFin'] = $fechaFin;
$whereConditions[] = "t1.FechaInicio <= :fechaFin AND t1.FechaFin >= :fechaInicio";

if (!empty($filtroNoEmpleado)) {
    $whereConditions[] = "t2.NoEmpleado LIKE :noEmpleado";
    $params[':noEmpleado'] = "%$filtroNoEmpleado%";
}

if (!empty($filtroNombreCompleto)) {
    $whereConditions[] = "CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) LIKE :nombreCompleto";
    $params[':nombreCompleto'] = "%$filtroNombreCompleto%";
}

if (!empty($filtroDepartamento) && $filtroDepartamento !== '0' && $filtroDepartamento !== '') {
    $whereConditions[] = "t2.Departamento = :departamento";
    $params[':departamento'] = $filtroDepartamento;
}

if (!empty($filtroEmpresa) && $filtroEmpresa !== '0' && $filtroEmpresa !== '') {
    $whereConditions[] = "t2.Empresa = :empresa";
    $params[':empresa'] = $filtroEmpresa;
}

if (!empty($filtroJefeInmediato) && $filtroJefeInmediato !== '0' && $filtroJefeInmediato !== '') {
    $whereConditions[] = "t2.IdJefeInmediato = :jefeInmediato";
    $params[':jefeInmediato'] = $filtroJefeInmediato;
}

if ($filtroEstatus !== '' && $filtroEstatus !== 'todos') {
    $estatusMap = [
        'solicitada' => 0,
        'autorizada' => 1,
        'validada'   => 2,
        'cancelada'  => 3,
        'enrevision' => 4
    ];
    if (isset($estatusMap[$filtroEstatus])) {
        $whereConditions[] = "t1.Estatus = :estatus";
        $params[':estatus'] = $estatusMap[$filtroEstatus];
    }
}

$whereClause = !empty($whereConditions) ? implode(" AND ", $whereConditions) : "1=1";

$query = "SELECT 
            t1.IdVacaciones,
            t1.IdPersonal,
            t1.FechaSolicitud,
            t1.FechaInicio,
            t1.FechaFin,
            t1.FechaRetornoLabores,
            t1.DiasTomar,
            t1.UsuarioSolicita,
            t1.UsuarioAutoriza,
            t1.FechaAutoriza,
            t1.Estatus,
            CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) as NombreCompleto,
            t2.NoEmpleado,
            t3.NomDepto as Departamento,
            t4.NomEmpresa as Empresa,
            CONCAT(t5.Nombre, ' ', t5.ApPaterno, ' ', t5.ApMaterno) as JefeInmediato
        FROM t_Vacaciones as t1
        INNER JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
        INNER JOIN t_departamento as t3 ON t2.Departamento = t3.IdDepartamento
        INNER JOIN t_empresa as t4 ON t2.Empresa = t4.IdEmpresa
        LEFT JOIN t_personal as t5 ON t2.IdJefeInmediato = t5.IdPersonal
        WHERE $whereClause
        ORDER BY t1.FechaSolicitud DESC";

$stmt = $Conexion->prepare($query);

foreach ($params as $key => $value) {
    $stmt->bindValue($key, $value);
}

$stmt->execute();
$todasVacaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

$pendientes = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 0;
});

$autorizadas = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 1;
});

$validadas = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 2;
});

$canceladas = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 3;
});

$enRevision = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 4;
});

$queryHoy = "SELECT 
                t1.IdVacaciones,
                t1.IdPersonal,
                t1.FechaInicio,
                t1.FechaFin,
                t1.DiasTomar,
                CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) as NombreCompleto,
                t2.NoEmpleado
            FROM t_Vacaciones t1
            INNER JOIN t_personal t2 ON t1.IdPersonal = t2.IdPersonal
            WHERE CAST(GETDATE() AS DATE) BETWEEN t1.FechaInicio AND t1.FechaFin
            AND t1.Estatus = 2";

$hoyWhereConditions = [];
$hoyParams = [];

if (!empty($filtroNoEmpleado)) {
    $hoyWhereConditions[] = "t2.NoEmpleado LIKE :noEmpleadoHoy";
    $hoyParams[':noEmpleadoHoy'] = "%$filtroNoEmpleado%";
}

if (!empty($filtroNombreCompleto)) {
    $hoyWhereConditions[] = "CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) LIKE :nombreCompletoHoy";
    $hoyParams[':nombreCompletoHoy'] = "%$filtroNombreCompleto%";
}

if (!empty($filtroDepartamento) && $filtroDepartamento !== '0' && $filtroDepartamento !== '') {
    $hoyWhereConditions[] = "t2.Departamento = :departamentoHoy";
    $hoyParams[':departamentoHoy'] = $filtroDepartamento;
}

if (!empty($filtroEmpresa) && $filtroEmpresa !== '0' && $filtroEmpresa !== '') {
    $hoyWhereConditions[] = "t2.Empresa = :empresaHoy";
    $hoyParams[':empresaHoy'] = $filtroEmpresa;
}

if (!empty($filtroJefeInmediato) && $filtroJefeInmediato !== '0' && $filtroJefeInmediato !== '') {
    $hoyWhereConditions[] = "t2.IdJefeInmediato = :jefeInmediatoHoy";
    $hoyParams[':jefeInmediatoHoy'] = $filtroJefeInmediato;
}

if (!empty($hoyWhereConditions)) {
    $queryHoy .= " AND " . implode(" AND ", $hoyWhereConditions);
}

$stmtHoy = $Conexion->prepare($queryHoy);

foreach ($hoyParams as $key => $value) {
    $stmtHoy->bindValue($key, $value);
}

$stmtHoy->execute();
$personalVacacionesHoy = $stmtHoy->fetchAll(PDO::FETCH_ASSOC);

$queryResumen = "SELECT 
                    SUM(CASE WHEN t1.Estatus = 0 THEN 1 ELSE 0 END) as totalSolicitadas,
                    SUM(CASE WHEN t1.Estatus = 1 THEN 1 ELSE 0 END) as totalAutorizadas,
                    SUM(CASE WHEN t1.Estatus = 2 THEN 1 ELSE 0 END) as totalValidadas,
                    SUM(CASE WHEN t1.Estatus = 3 THEN 1 ELSE 0 END) as totalCanceladas,
                    SUM(CASE WHEN t1.Estatus = 4 THEN 1 ELSE 0 END) as totalEnRevision
                FROM t_Vacaciones t1
                INNER JOIN t_personal t2 ON t1.IdPersonal = t2.IdPersonal
                WHERE $whereClause";

$stmtResumen = $Conexion->prepare($queryResumen);

foreach ($params as $key => $value) {
    $stmtResumen->bindValue($key, $value);
}

$stmtResumen->execute();
$resumenData = $stmtResumen->fetch(PDO::FETCH_ASSOC);

$response = [
    'status' => true,
    'data' => [
        'solicitadas' => array_values($pendientes),
        'autorizadas' => array_values($autorizadas),
        'validadas' => array_values($validadas),
        'canceladas' => array_values($canceladas),
        'enRevision' => array_values($enRevision),
        'todasVacaciones' => $todasVacaciones,
        'personalVacacionesHoy' => $personalVacacionesHoy,
        'resumen' => [
            'totalSolicitadas' => (int)($resumenData['totalSolicitadas'] ?? 0),
            'totalAutorizadas' => (int)($resumenData['totalAutorizadas'] ?? 0),
            'totalValidadas' => (int)($resumenData['totalValidadas'] ?? 0),
            'totalCanceladas' => (int)($resumenData['totalCanceladas'] ?? 0),
            'totalEnRevision' => (int)($resumenData['totalEnRevision'] ?? 0),
            'personalVacacionesHoy' => count($personalVacacionesHoy)
        ]
    ]
];

echo json_encode($response);
?>