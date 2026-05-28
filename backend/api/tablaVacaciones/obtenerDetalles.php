<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

$IdTablaVacaciones = isset($_GET['IdTablaVacaciones']) ? (int)$_GET['IdTablaVacaciones'] : 0;

if ($IdTablaVacaciones <= 0) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'ID de tabla de vacaciones no válido'
    ]);
    exit;
}

try {
    
    $query = "SELECT IdDetalleTablaVacaciones, IdTablaVacaciones, Antiguedad, Dias 
              FROM t_DetalletablaVacaciones 
              WHERE IdTablaVacaciones = :IdTablaVacaciones ";
    
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':IdTablaVacaciones', $IdTablaVacaciones, PDO::PARAM_INT);
    $stmt->execute();
    
    $detalles = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $detalles[] = [
            'IdDetalleTablaVacaciones' => $row['IdDetalleTablaVacaciones'],
            'IdTablaVacaciones' => $row['IdTablaVacaciones'],
            'Antiguedad' => $row['Antiguedad'],
            'Dias' => $row['Dias']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $detalles,
        'message' => 'Detalles obtenidos correctamente',
        'total_registros' => count($detalles)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener detalles: ' . $e->getMessage()
    ]);
}
?>