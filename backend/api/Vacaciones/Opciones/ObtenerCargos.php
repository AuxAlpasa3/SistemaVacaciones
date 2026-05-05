<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT DISTINCT 
                t1.Cargo as id,
                t2.NomCargo as valor
            FROM t_personal as t1 inner join t_cargo as t2 on t1.Cargo=t2.IdCargo
            WHERE t1.Cargo IS NOT NULL AND t1.Cargo != ''
            ORDER BY t1.Cargo";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'message' => 'Cargos obtenidos correctamente',
        'data' => $result
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al obtener cargos: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>