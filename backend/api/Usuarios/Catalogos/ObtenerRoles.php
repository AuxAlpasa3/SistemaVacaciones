<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdRolUsuario, RolUsuario FROM t_rolUsuario ORDER BY IdRolUsuario";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'status' => true,
        'data' => $result,
        'message' => 'Catálogo de tipos de usuario obtenido correctamente'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener tipos de usuario: ' . $e->getMessage()
    ]);
}
?>