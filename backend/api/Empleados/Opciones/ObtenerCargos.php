<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdCargo, NomCargo FROM t_cargo ORDER BY IdCargo";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $cargos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cargos[] = [
            'id' => (int)$row['IdCargo'],
            'valor' => $row['NomCargo']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $cargos,
        'message' => 'Cargos obtenidos correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener cargos: ' . $e->getMessage()
    ]);
}
?>