<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

try {
    $estatus = isset($_GET['estatus']) ? $_GET['estatus'] : '';
    $noEmpleado = isset($_GET['noEmpleado']) ? $_GET['noEmpleado'] : '';
    $nombreCompleto = isset($_GET['nombreCompleto']) ? $_GET['nombreCompleto'] : '';
    $departamento = isset($_GET['departamento']) ? $_GET['departamento'] : '';
    $fechaInicioVac = isset($_GET['fechaInicioVacaciones']) ? $_GET['fechaInicioVacaciones'] : '';
    $fechaFinVac = isset($_GET['fechaFinVacaciones']) ? $_GET['fechaFinVacaciones'] : '';
    $fechaSolicitud = isset($_GET['fechaSolicitud']) ? $_GET['fechaSolicitud'] : '';
    $anio = isset($_GET['anio']) ? $_GET['anio'] : '';
    $fechaIngreso = isset($_GET['fechaIngreso']) ? $_GET['fechaIngreso'] : '';
    
    $query = "SELECT 
                t1.IdVacaciones,
                t1.Anio,
                t1.FechaSolicitud,
                t3.IdPersonal as UsuarioSolicitaId,
                CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')) as UsuarioSolicita,
                t2.NoEmpleado,
                t2.IdPersonal,
                CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) as NombreCompleto,
                ISNULL(t7.NomDepto, '') as Departamento,
                t2.departamento,
                ISNULL(t6.NomCargo, '') as Cargo,
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
                t1.Comentarios,
                t1.SaldoDias,
                t1.DiasCorresponden,
                t1.Antiguedad
            FROM t_Vacaciones as t1
            LEFT JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
            LEFT JOIN t_personal as t3 ON t3.IdPersonal = t1.UsuarioSolicita
            LEFT JOIN t_usuario as t4 ON t4.IdUsuario = t1.UsuarioAutoriza
            LEFT JOIN t_personal as t4_personal ON t4.EmpleadoID = t4_personal.IdPersonal
            LEFT JOIN t_usuario as t5 ON t5.IdUsuario = t1.UsuarioValida
            LEFT JOIN t_personal as t5_personal ON t5.EmpleadoID = t5_personal.IdPersonal
            LEFT JOIN t_cargo as t6 ON t6.IdCargo = t2.cargo
            LEFT JOIN t_departamento as t7 ON t7.IdDepartamento = t2.departamento
            WHERE 1=1";
    
    $params = array();
    
    if (!empty($estatus)) {
        if (strpos($estatus, ',') !== false) {
            $estatusArray = explode(',', $estatus);
            $placeholders = implode(',', array_fill(0, count($estatusArray), '?'));
            $query .= " AND t1.Estatus IN ($placeholders)";
            foreach ($estatusArray as $est) {
                $params[] = (int)$est;
            }
        } else {
            $query .= " AND t1.Estatus = ?";
            $params[] = (int)$estatus;
        }
    }
    
    if (!empty($noEmpleado)) {
        $query .= " AND t2.NoEmpleado LIKE ?";
        $params[] = "%$noEmpleado%";
    }
    
    if (!empty($nombreCompleto)) {
        $query .= " AND (t2.Nombre LIKE ? OR t2.ApPaterno LIKE ? OR t2.ApMaterno LIKE ? OR CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) LIKE ?)";
        $params[] = "%$nombreCompleto%";
        $params[] = "%$nombreCompleto%";
        $params[] = "%$nombreCompleto%";
        $params[] = "%$nombreCompleto%";
    }
    
    if (!empty($departamento)) {
        $query .= " AND t7.NomDepto LIKE ?";
        $params[] = "%$departamento%";
    }
    
    if (!empty($fechaInicioVac)) {
        $query .= " AND CONVERT(DATE, t1.FechaInicio) >= ?";
        $params[] = $fechaInicioVac;
    }
    
    if (!empty($fechaFinVac)) {
        $query .= " AND CONVERT(DATE, t1.FechaFin) <= ?";
        $params[] = $fechaFinVac;
    }
    
    if (!empty($fechaSolicitud)) {
        $query .= " AND CONVERT(DATE, t1.FechaSolicitud) = ?";
        $params[] = $fechaSolicitud;
    }
    
    if (!empty($anio)) {
        $query .= " AND t1.Anio = ?";
        $params[] = (int)$anio;
    }
    
    if (!empty($fechaIngreso)) {
        $query .= " AND CONVERT(DATE, t2.FechaIngreso) >= ?";
        $params[] = $fechaIngreso;
    }
    
    $query .= " ORDER BY t1.FechaSolicitud DESC, t1.IdVacaciones DESC";
    
    $stmt = $Conexion->prepare($query);
    
    if (!empty($params)) {
        $stmt->execute($params);
    } else {
        $stmt->execute();
    }
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $vacaciones = array();
    foreach ($result as $row) {
        $vacaciones[] = array(
            'IdVacaciones' => (int)$row['IdVacaciones'],
            'Anio' => (int)$row['Anio'],
            'FechaSolicitud' => $row['FechaSolicitud'] ?? '',
            'UsuarioSolicitaId' => isset($row['UsuarioSolicitaId']) ? (int)$row['UsuarioSolicitaId'] : 0,
            'UsuarioSolicita' => trim($row['UsuarioSolicita'] ?? ''),
            'NoEmpleado' => $row['NoEmpleado'] ?? '',
            'IdPersonal' => (int)$row['IdPersonal'],
            'NombreCompleto' => trim($row['NombreCompleto'] ?? ''),
            'Departamento' => $row['Departamento'] ?? '',
            'DepartamentoId' => $row['departamento'] ?? '',
            'Cargo' => $row['Cargo'] ?? '',
            'FechaIngreso' => $row['FechaIngreso'] ?? '',
            'FechaInicio' => $row['FechaInicio'] ?? '',
            'FechaFin' => $row['FechaFin'] ?? '',
            'DiasTomar' => (int)$row['DiasTomar'],
            'FechaRetornoLabores' => $row['FechaRetornoLabores'] ?? '',
            'Estatus' => (int)$row['Estatus'],
            'UsuarioAutorizaId' => isset($row['UsuarioAutorizaId']) ? (int)$row['UsuarioAutorizaId'] : 0,
            'UsuarioAutoriza' => trim($row['UsuarioAutoriza'] ?? ''),
            'FechaAutoriza' => $row['FechaAutoriza'] ?? '',
            'UsuarioValidaId' => isset($row['UsuarioValidaId']) ? (int)$row['UsuarioValidaId'] : 0,
            'UsuarioValida' => trim($row['UsuarioValida'] ?? ''),
            'FechaValidado' => $row['FechaValidado'] ?? '',
            'Comentarios' => $row['Comentarios'] ?? null,
            'SaldoDias' => isset($row['SaldoDias']) ? (int)$row['SaldoDias'] : 0,
            'DiasCorresponden' => isset($row['DiasCorresponden']) ? (int)$row['DiasCorresponden'] : 0,
            'Antiguedad' => isset($row['Antiguedad']) ? (int)$row['Antiguedad'] : 0
        );
    }
    
    echo json_encode(array(
        'status' => true,
        'message' => 'Vacaciones obtenidas correctamente',
        'data' => $vacaciones,
        'total' => count($vacaciones)
    ));
    
} catch (Exception $e) {
    echo json_encode(array(
        'status' => false,
        'message' => 'Error al obtener vacaciones: ' . $e->getMessage(),
        'data' => array()
    ));
}
?>