<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../db/Connection.php';

$idPersonal = isset($_GET['IdPersonal']) ? intval($_GET['IdPersonal']) : 0;

if ($idPersonal <= 0) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'ID de personal no valido'
    ]);
    exit;
}

try {
    
    $query = "SELECT DISTINCT Año FROM t_personal_vacaciones WHERE IdPersonal = ? ORDER BY Año DESC";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute([$idPersonal]);
    $anos = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'status' => true,
        'data' => $anos,
        'message' => 'Años obtenidos correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener los años: ' . $e->getMessage()
    ]);
}
?>