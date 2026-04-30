<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdPersonal,concat(Nombre,' ',ApPaterno,' ',ApMaterno) as NombreCompleto FROM t_personal ORDER BY IdPersonal";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $supervisores = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $supervisores[] = [
            'id' => (int)$row['IdPersonal'],
            'valor' => $row['NombreCompleto']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $supervisores,
        'message' => 'Supervisores obtenidos correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener supervisores: ' . $e->getMessage()
    ]);
}
?>