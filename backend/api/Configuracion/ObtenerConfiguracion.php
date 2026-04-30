<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../db/Connection.php';

try {
    $query = "SELECT logoAlpasa, SelloBascula FROM t_configuracion";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $configuraciones = [];
    if ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $configuraciones[] = [
            'logoAlpasa' => $row['logoAlpasa'] ?? '',
            'SelloBascula' => $row['SelloBascula'] ?? ''
        ];
    }
    
    if (!empty($configuraciones)) {
        $response = [
            'status' => true,
            'data' => $configuraciones,
            'message' => 'Configuración obtenida exitosamente'
        ];
    } else {
        $response = [
            'status' => false,
            'data' => [],
            'message' => 'No se encontró configuración en la base de datos'
        ];
    }
    
    echo json_encode($response);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener configuración: ' . $e->getMessage()
    ]);
}
?>