<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

try {
    $idusuario = isset($_GET['idusuario']) ? $_GET['idusuario'] : '';
    $noEmpleado = isset($_GET['NoEmpleado']) ? $_GET['NoEmpleado'] : '';
    
    if (empty($idusuario)) {
        echo json_encode([
            'status' => false,
            'message' => 'El parámetro idusuario es requerido',
            'data' => null
        ]);
        exit;
    }
    
    if (empty($noEmpleado)) {
        echo json_encode([
            'status' => false,
            'message' => 'El parámetro NoEmpleado es requerido',
            'data' => null
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
            'data' => null
        ]);
        exit;
    }
    
    $rol = $usuario['rol'];
    $empleadoID = $usuario['EmpleadoID'];
    
    $query = "SELECT 
                t1.IdPersonal,
                t1.NoEmpleado,
                CONCAT(ISNULL(t1.Nombre, ''), ' ', ISNULL(t1.ApPaterno, ''), ' ', ISNULL(t1.ApMaterno, '')) as NombreCompleto,
                t3.NomDepto as Departamento,
                t2.NomCargo as Cargo,
                t1.FechaIngreso,
                t1.IdSupervisor
            FROM t_personal as t1
            INNER JOIN t_cargo as t2 ON t1.Cargo = t2.IdCargo
            INNER JOIN t_departamento as t3 ON t1.Departamento = t3.IdDepartamento
            WHERE t1.NoEmpleado = :noEmpleado AND t1.Status = '1'";
    
    // Validación de permisos según el rol
    if ($rol == 1 || $rol == 2) {
        // Administrador o RRHH pueden ver cualquier empleado
        $params = [':noEmpleado' => $noEmpleado];
    } 
    elseif ($rol == 3) {
        // Supervisor puede ver a sus empleados Y a sí mismo
        if (!empty($empleadoID)) {
            $query .= " AND (t1.IdSupervisor = :empleadoID OR t1.NoEmpleado = :propioEmpleado)";
            $params = [
                ':noEmpleado' => $noEmpleado,
                ':empleadoID' => $empleadoID,
                ':propioEmpleado' => $empleadoID
            ];
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Supervisor sin empleado asignado',
                'data' => null
            ]);
            exit;
        }
    } 
    elseif ($rol == 4) {
        // Empleado normal SOLO puede verse a sí mismo
        $query .= " AND t1.NoEmpleado = :propioEmpleado";
        $params = [
            ':noEmpleado' => $noEmpleado,
            ':propioEmpleado' => $empleadoID
        ];
    }
    else {
        echo json_encode([
            'status' => false,
            'message' => 'Rol no autorizado',
            'data' => null
        ]);
        exit;
    }
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute($params);
    $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($empleado) {
        echo json_encode([
            'status' => true,
            'message' => 'Empleado encontrado',
            'data' => $empleado,
            'rol' => $rol,
            'empleado_actual' => $empleadoID
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Empleado no encontrado o no autorizado',
            'data' => null,
            'rol' => $rol,
            'empleado_solicitado' => $noEmpleado,
            'empleado_actual' => $empleadoID
        ]);
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al buscar empleado: ' . $e->getMessage(),
        'data' => null
    ]);
}
?>