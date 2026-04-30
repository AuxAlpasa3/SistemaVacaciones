<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

try {
    $query = "SELECT 
                t1.IdVacaciones,
                t1.FechaSolicitud,
                CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')) as UsuarioSolicita,
                t2.NoEmpleado,
                CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) as NombreCompleto,
                t2.Departamento,
                t2.Cargo,
                t2.FechaIngreso,
                t1.FechaInicio,
                t1.FechaFin,
                t1.DiasTomar,
                t1.FechaRetornoLabores,
                t1.FechaAutoriza,
                CONCAT(ISNULL(t4.Nombre, ''), ' ', ISNULL(t4.ApPaterno, ''), ' ', ISNULL(t4.ApMaterno, '')) as UsuarioAutoriza
            FROM t_Vacaciones as t1
            LEFT JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
            LEFT JOIN t_personal as t3 ON t3.IdPersonal = t1.UsuarioSolicita
            LEFT JOIN t_personal as t4 ON t4.IdPersonal = t1.UsuarioAutoriza
            ORDER BY t1.FechaSolicitud DESC";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'message' => 'Vacaciones obtenidas correctamente',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al obtener vacaciones: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>