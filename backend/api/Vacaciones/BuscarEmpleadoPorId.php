
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

try {
    $noEmpleado = isset($_GET['NoEmpleado']) ? $_GET['NoEmpleado'] : '';
    $idusuario = isset($_GET['idusuario']) ? $_GET['idusuario'] : '';
    
    if (empty($noEmpleado)) {
        echo json_encode([
            'status' => false,
            'message' => 'El parámetro NoEmpleado es requerido',
            'data' => null
        ]);
        exit;
    }

    $query = "SELECT 
                t1.IdPersonal,
                t1.NoEmpleado,
                CONCAT(ISNULL(t1.Nombre, ''), ' ', ISNULL(t1.ApPaterno, ''), ' ', 
                ISNULL(t1.ApMaterno, '')) as NombreCompleto,
                t3.NomDepto as Departamento,
                t2.NomCargo as Cargo,
                t1.FechaIngreso
            FROM t_personal as t1
            INNER JOIN t_cargo as t2 ON t1.Cargo = t2.IdCargo
            INNER JOIN t_departamento as t3 ON t1.Departamento = t3.IdDepartamento
            WHERE t1.NoEmpleado = :noEmpleado AND t1.Status = '1'";
    
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':noEmpleado', $noEmpleado);
    $stmt->execute();
    $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($empleado) {
        echo json_encode([
            'status' => true,
            'message' => 'Empleado encontrado',
            'data' => $empleado
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Empleado no encontrado',
            'data' => null
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