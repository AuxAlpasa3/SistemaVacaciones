<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../../db/Connection.php';

try {
    $query = "SELECT DISTINCT 
                t1.Departamento as id,
                t2.NomDepto as valor
            FROM t_personal as t1
            INNER JOIN t_departamento as t2 on t1.Departamento=t2.IdDepartamento
            WHERE t1.Departamento IS NOT NULL AND Departamento != ''
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