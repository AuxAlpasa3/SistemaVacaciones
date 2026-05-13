<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../../db/Connection.php';

try {
    $idusuario = isset($_GET['idusuario']) ? $_GET['idusuario'] : '';
    
    if (empty($idusuario)) {
        echo json_encode([
            'status' => false,
            'message' => 'El parámetro idusuario es requerido',
            'data' => []
        ]);
        exit;
    }
    
    $queryUsuario = "SELECT rol, EmpleadoID FROM t_usuario WHERE IdUsuario = :idusuario AND Estatus = '1'";
    $stmtUsuario = $Conexion->prepare($queryUsuario);
    $stmtUsuario->execute([':idusuario' => $idusuario]);
    $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
    
    if (!$usuario) {
        echo json_encode([
            'status' => false,
            'message' => 'Usuario no encontrado o inactivo',
            'data' => []
        ]);
        exit;
    }
    
    $rol = $usuario['rol'];
    $empleadoID = $usuario['EmpleadoID'];
    
    $query = "SELECT 
                NoEmpleado as id,
                CONCAT(NoEmpleado, ' - ', ISNULL(Nombre, ''), ' ', ISNULL(ApPaterno, ''), ' ', ISNULL(ApMaterno, '')) as valor
            FROM t_personal
            WHERE Status = '1'";
    
    if ($rol == 1 || $rol == 2) {
        // Admin y RRHH pueden ver todos los empleados
        $query .= " ORDER BY Nombre, ApPaterno, ApMaterno";
        $params = [];
    } 
    elseif ($rol == 3) {
        // Supervisor puede ver sus empleados Y a sí mismo
        if (!empty($empleadoID)) {
            $query .= " AND (IdSupervisor = :empleadoID OR NoEmpleado = :propioEmpleado) ORDER BY Nombre, ApPaterno, ApMaterno";
            $params = [
                ':empleadoID' => $empleadoID,
                ':propioEmpleado' => $empleadoID
            ];
        } else {
            $query .= " AND 1=0 ORDER BY Nombre, ApPaterno, ApMaterno";
            $params = [];
        }
    } 
    elseif ($rol == 4) {
        // Empleado normal SOLO puede verse a sí mismo
        if (!empty($empleadoID)) {
            $query .= " AND NoEmpleado = :propioEmpleado ORDER BY Nombre, ApPaterno, ApMaterno";
            $params = [':propioEmpleado' => $empleadoID];
        } else {
            $query .= " AND 1=0 ORDER BY Nombre, ApPaterno, ApMaterno";
            $params = [];
        }
    }
    else {
        echo json_encode([
            'status' => false,
            'message' => 'Rol no autorizado para ver empleados',
            'data' => []
        ]);
        exit;
    }
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute($params);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'message' => 'Empleados obtenidos correctamente',
        'data' => $result,
        'rol' => $rol,
        'empleado_actual' => $empleadoID
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al obtener empleados: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>