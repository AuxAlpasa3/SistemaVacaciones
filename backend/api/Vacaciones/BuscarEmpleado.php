<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

$noEmpleado = isset($_GET['NoEmpleado']) ? $_GET['NoEmpleado'] : '';

try {
    
    $query = "SELECT 
                IdPersonal,
                NoEmpleado,
                CONCAT(ISNULL(Nombre, ''), ' ', ISNULL(ApPaterno, ''), ' ', ISNULL(ApMaterno, '')) as NombreCompleto,
                Nombre,
                ApPaterno,
                ApMaterno,
                Departamento,
                Cargo,
                FechaIngreso,
                Email,
                Contacto,
                Status
            FROM t_personal 
            WHERE NoEmpleado = :noEmpleado AND Status = '1'";
    
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':noEmpleado', $noEmpleado);
    $stmt->execute();
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        echo json_encode([
            'status' => true,
            'message' => 'Empleado encontrado',
            'data' => $result
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