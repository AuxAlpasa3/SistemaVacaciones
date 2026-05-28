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
$whereConditions[] = "t1.FechaSolicitud BETWEEN :fechaInicio AND :fechaFin";

if (!empty($filtroNoEmpleado)) {
    $whereConditions[] = "t2.NoEmpleado LIKE :noEmpleado";
    $params[':noEmpleado'] = "%$filtroNoEmpleado%";
}

if (!empty($filtroNombreCompleto)) {
    $whereConditions[] = "CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) LIKE :nombreCompleto";
    $params[':nombreCompleto'] = "%$filtroNombreCompleto%";
}

if (!empty($filtroDepartamento) && $filtroDepartamento !== '0') {
    $whereConditions[] = "t2.Departamento = :departamento";
    $params[':departamento'] = $filtroDepartamento;
}

if (!empty($filtroEmpresa) && $filtroEmpresa !== '0') {
    $whereConditions[] = "t2.Empresa = :empresa";
    $params[':empresa'] = $filtroEmpresa;
}

if (!empty($filtroJefeInmediato) && $filtroJefeInmediato !== '0') {
    $whereConditions[] = "t2.IdJefeInmediato = :jefeInmediato";
    $params[':jefeInmediato'] = $filtroJefeInmediato;
}

if ($filtroEstatus !== '' && $filtroEstatus !== 'todos') {
    $estatusMap = [
        'pendiente' => 0,
        'validada' => 1,
        'rechazada' => 2
    ];
    if (isset($estatusMap[$filtroEstatus])) {
        $whereConditions[] = "t1.Estatus = :estatus";
        $params[':estatus'] = $estatusMap[$filtroEstatus];
    }
}

$whereClause = implode(" AND ", $whereConditions);

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
             CONCAT(t5.Nombre, ' ',t5.ApPaterno, ' ', t5.ApMaterno)  as JefeInmediato
        FROM t_Vacaciones as t1
        INNER JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
        INNER JOIN t_departamento as t3 on t2.Departamento=t3.IdDepartamento
        INNER JOIN t_empresa as t4 on t2.Empresa=t4.IdEmpresa
        LEFT JOIN t_personal as t5 on t5.IdPersonal=t5.IdJefeInmediato
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

$validadas = array_filter($todasVacaciones, function($item) {
    return $item['Estatus'] == 1;
});

$queryHoy = "SELECT 
                t1.IdVacaciones,
                t1.IdPersonal,
                t1.FechaInicio,
                t1.FechaFin,
                t1.DiasTomar,
                CONCAT(t2.Nombre, ' ', t2.ApPaterno, ' ', t2.ApMaterno) as NombreCompleto
            FROM t_Vacaciones t1
            INNER JOIN t_personal t2 ON t1.IdPersonal = t2.IdPersonal
            WHERE CAST(GETDATE() AS DATE) BETWEEN t1.FechaInicio AND t1.FechaFin
            AND t1.Estatus = 1";

$stmtHoy = $Conexion->prepare($queryHoy);
$stmtHoy->execute();
$personalVacacionesHoy = $stmtHoy->fetchAll(PDO::FETCH_ASSOC);

$queryResumen = "SELECT 
                    SUM(CASE WHEN t1.Estatus = 0 THEN 1 ELSE 0 END) as totalPendientes,
                    SUM(CASE WHEN t1.Estatus = 1 THEN 1 ELSE 0 END) as totalValidadas
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
        'pendientes' => array_values($pendientes),
        'validadas' => array_values($validadas),
        'todasVacaciones' => $todasVacaciones,
        'personalVacacionesHoy' => $personalVacacionesHoy,
        'resumen' => [
            'totalPendientes' => (int)($resumenData['totalPendientes'] ?? 0),
            'totalValidadas' => (int)($resumenData['totalValidadas'] ?? 0),
            'personalVacacionesHoy' => count($personalVacacionesHoy)
        ]
    ]
];

echo json_encode($response);
?>