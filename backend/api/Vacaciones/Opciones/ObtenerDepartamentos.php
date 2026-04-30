<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../../db/Connection.php';

try {
    $query = "SELECT DISTINCT 
                Departamento as id,
                Departamento as valor
            FROM t_personal 
            WHERE Departamento IS NOT NULL AND Departamento != ''
            ORDER BY Departamento";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'message' => 'Departamentos obtenidos correctamente',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al obtener departamentos: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>