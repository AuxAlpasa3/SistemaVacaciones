<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdTurno, Turno FROM t_turno ORDER BY IdTurno ASC";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $cargos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cargos[] = [
            'id' => (int)$row['IdTurno'],
            'valor' => $row['Turno']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $cargos,
        'message' => 'Turnos obtenidos correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener cargos: ' . $e->getMessage()
    ]);
}
?>