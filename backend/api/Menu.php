<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../db/Connection.php';

try {
    $fechaInicio = isset($_GET['fechaInicio']) ? $_GET['fechaInicio'] : date('Y-m-01');
    $fechaFin = isset($_GET['fechaFin']) ? $_GET['fechaFin'] : date('Y-m-t');
    
    $queryPendientes = "SELECT IdVacaciones, concat(t1.IdPersonal,' ',t2.Nombre,' ',t2.ApPaterno,' ',t2.ApMaterno,' ') as IdPersonal, FechaSolicitud, FechaInicio, FechaFin, 
    FechaRetornoLabores, DiasTomar, UsuarioSolicita, UsuarioAutoriza, FechaAutoriza, Estatus 
    FROM t_Vacaciones as t1 inner join t_personal as t2 on t1.IdPersonal=t2.IdPersonal 
    WHERE Estatus = 0 AND CONVERT(DATE, FechaSolicitud) 
    BETWEEN ? AND ? ORDER BY FechaSolicitud DESC";
    $stmtPendientes = $Conexion->prepare($queryPendientes);
    $stmtPendientes->execute([$fechaInicio, $fechaFin]);
    $pendientes = $stmtPendientes->fetchAll(PDO::FETCH_ASSOC);
    
    $queryValidadas = "SELECT IdVacaciones, concat(t1.IdPersonal,' ',t2.Nombre,' ',t2.ApPaterno,' ',
    t2.ApMaterno,' ') as IdPersonal, FechaSolicitud, FechaInicio, FechaFin, FechaRetornoLabores,
     DiasTomar, UsuarioSolicita, UsuarioAutoriza, FechaAutoriza, Estatus FROM 
     t_Vacaciones as t1 inner join t_personal as t2 on t1.IdPersonal=t2.IdPersonal
      WHERE Estatus = 1 AND CONVERT(DATE, FechaAutoriza) BETWEEN ? AND ? ORDER BY FechaAutoriza DESC";
    $stmtValidadas = $Conexion->prepare($queryValidadas);
    $stmtValidadas->execute([$fechaInicio, $fechaFin]);
    $validadas = $stmtValidadas->fetchAll(PDO::FETCH_ASSOC);
    
    $queryTodas = "SELECT IdVacaciones, concat(t1.IdPersonal,' ',t2.Nombre,' ',t2.ApPaterno,' ',
    t2.ApMaterno,' ') as IdPersonal, FechaSolicitud, FechaInicio, FechaFin, FechaRetornoLabores, 
    DiasTomar, UsuarioSolicita, UsuarioAutoriza, FechaAutoriza, Estatus FROM t_Vacaciones 
    as t1 inner join t_personal as t2 on t1.IdPersonal=t2.IdPersonal WHERE
     (CONVERT(DATE, FechaSolicitud) BETWEEN ? AND ?) OR 
     (CONVERT(DATE, FechaAutoriza) BETWEEN ? AND ?) OR 
     (CONVERT(DATE, FechaInicio) BETWEEN ? AND ?) ORDER BY FechaInicio DESC";
    $stmtTodas = $Conexion->prepare($queryTodas);
    $stmtTodas->execute([$fechaInicio, $fechaFin, $fechaInicio, $fechaFin, $fechaInicio, $fechaFin]);
    $todasVacaciones = $stmtTodas->fetchAll(PDO::FETCH_ASSOC);
    
    $hoy = date('Y-m-d');
    $queryHoy = "SELECT COUNT(DISTINCT IdPersonal) as total FROM t_Vacaciones WHERE 
    Estatus = 1 AND CONVERT(DATE, FechaInicio) <= ? AND CONVERT(DATE, FechaFin) >= ?";
    $stmtHoy = $Conexion->prepare($queryHoy);
    $stmtHoy->execute([$hoy, $hoy]);
    $resultHoy = $stmtHoy->fetch(PDO::FETCH_ASSOC);
    $personalVacacionesHoy = $resultHoy ? intval($resultHoy['total']) : 0;
    
    echo json_encode([
        'status' => true,
        'data' => [
            'pendientes' => $pendientes,
            'validadas' => $validadas,
            'todasVacaciones' => $todasVacaciones,
            'resumen' => [
                'totalPendientes' => count($pendientes),
                'totalValidadas' => count($validadas),
                'personalVacacionesHoy' => $personalVacacionesHoy
            ]
        ],
        'message' => 'Datos obtenidos correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'error' => $e->getMessage(),
        'message' => 'Error de base de datos'
    ]);
}
?>