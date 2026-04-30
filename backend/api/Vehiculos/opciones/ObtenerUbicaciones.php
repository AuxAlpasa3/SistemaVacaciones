<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdUbicacion, NomLargo FROM t_ubicacion ORDER BY IdUbicacion";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $ubicaciones = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $ubicaciones[] = [
            'id' => (int)$row['IdUbicacion'],
            'valor' => $row['NomLargo']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $ubicaciones,
        'message' => 'Ubicaciones obtenidas correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener ubicaciones: ' . $e->getMessage()
    ]);
}
?>