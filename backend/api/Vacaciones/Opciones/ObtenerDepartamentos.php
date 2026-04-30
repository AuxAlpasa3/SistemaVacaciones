<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdDepartamento, NomDepto FROM t_departamento ORDER BY IdDepartamento";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $departamentos = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $departamentos[] = [
            'id' => (int)$row['IdDepartamento'],
            'valor' => $row['NomDepto']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $departamentos,
        'message' => 'Departamentos obtenidos correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener departamentos: ' . $e->getMessage()
    ]);
}
?>