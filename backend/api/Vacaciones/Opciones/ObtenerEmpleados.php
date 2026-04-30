<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../../db/Connection.php';
try {
    
    $query = "SELECT 
                NoEmpleado as id,
                CONCAT(ISNULL(Nombre, ''), ' ', ISNULL(ApPaterno, ''), ' ', ISNULL(ApMaterno, '')) as valor
            FROM t_personal 
            WHERE Status = '1'
            ORDER BY Nombre, ApPaterno, ApMaterno";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'message' => 'Empleados obtenidos correctamente',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al obtener empleados: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>