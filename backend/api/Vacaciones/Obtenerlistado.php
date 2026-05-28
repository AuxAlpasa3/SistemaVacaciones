<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

try {
    $query = "SELECT 
                t1.IdVacaciones,
                t1.Anio,
                t1.FechaSolicitud,
                t3.IdPersonal as UsuarioSolicitaId,
                CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')) as UsuarioSolicita,
                t2.NoEmpleado,
                t2.IdPersonal,
                CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) as NombreCompleto,
                t7.NomDepto as Departamento,
                t2.departamento,
                t6.NomCargo as Cargo,
                t2.FechaIngreso,
                t1.FechaInicio,
                t1.FechaFin,
                t1.DiasTomar,
                t1.FechaRetornoLabores,
                t1.Estatus,
                t4.IdUsuario as UsuarioAutorizaId,
                CASE 
                    WHEN t4.IdUsuario IS NULL THEN 'Pendiente'
                    WHEN t4.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE CONCAT(ISNULL(t4_personal.Nombre, ''), ' ', ISNULL(t4_personal.ApPaterno, ''), ' ', ISNULL(t4_personal.ApMaterno, ''))
                END as UsuarioAutoriza,
                t1.FechaAutoriza,
                t5.IdUsuario as UsuarioValidaId,
                CASE 
                    WHEN t5.IdUsuario IS NULL THEN 'Pendiente'
                    WHEN t5.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE CONCAT(ISNULL(t5_personal.Nombre, ''), ' ', ISNULL(t5_personal.ApPaterno, ''), ' ', ISNULL(t5_personal.ApMaterno, ''))
                END as UsuarioValida,
                t1.FechaValidado,
                t1.Comentarios
            FROM t_Vacaciones as t1
            LEFT JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
            LEFT JOIN t_personal as t3 ON t3.IdPersonal = t1.UsuarioSolicita
            LEFT JOIN t_usuario as t4 ON t4.IdUsuario = t1.UsuarioAutoriza
            LEFT JOIN t_personal as t4_personal ON t4.EmpleadoID = t4_personal.IdPersonal
            LEFT JOIN t_usuario as t5 ON t5.IdUsuario = t1.UsuarioValida
            LEFT JOIN t_personal as t5_personal ON t5.EmpleadoID = t5_personal.IdPersonal
            INNER JOIN t_cargo as t6 ON t6.IdCargo = t2.cargo
            INNER JOIN t_departamento as t7 ON t7.IdDepartamento = t2.departamento
            ORDER BY t1.FechaSolicitud DESC";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir estatus a entero
    foreach ($result as &$row) {
        $row['Estatus'] = (int)$row['Estatus'];
        $row['Anio'] = (int)$row['Anio'];
        $row['DiasTomar'] = (int)$row['DiasTomar'];
        $row['IdVacaciones'] = (int)$row['IdVacaciones'];
        $row['IdPersonal'] = (int)$row['IdPersonal'];
        if (isset($row['UsuarioSolicitaId'])) $row['UsuarioSolicitaId'] = (int)$row['UsuarioSolicitaId'];
        if (isset($row['UsuarioAutorizaId'])) $row['UsuarioAutorizaId'] = (int)$row['UsuarioAutorizaId'];
        if (isset($row['UsuarioValidaId'])) $row['UsuarioValidaId'] = (int)$row['UsuarioValidaId'];
    }
    
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