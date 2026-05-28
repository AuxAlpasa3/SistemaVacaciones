<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');


include_once '../../db/Connection.php';

try {
    
    $idPersonal = $_GET['IdPersonal'] ?? 0;
    
    if (!$idPersonal) {
        echo json_encode([
            'status' => false,
            'data' => null,
            'message' => 'ID de personal requerido'
        ]);
        exit;
    }
    
    $query = "SELECT FechaIngreso FROM t_personal WHERE IdPersonal = :idPersonal";
    $stmt = $Conexion->prepare($query);
    $stmt->execute([':idPersonal' => $idPersonal]);
    $personal = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$personal) {
        echo json_encode([
            'status' => false,
            'data' => null,
            'message' => 'Personal no encontrado'
        ]);
        exit;
    }
    
    $fechaIngreso = $personal['FechaIngreso'];
    $fechaIngresoDate = new DateTime($fechaIngreso);
    $hoy = new DateTime();
    
    $aniosAntiguedad = $fechaIngresoDate->diff($hoy)->y;
    
    $proximoAniversario = new DateTime();
    $proximoAniversario->setDate($hoy->format('Y'), $fechaIngresoDate->format('m'), $fechaIngresoDate->format('d'));
    
    if ($proximoAniversario < $hoy) {
        $proximoAniversario->modify('+1 year');
    }
    
    echo json_encode([
        'status' => true,
        'data' => [
            'FechaIngreso' => $fechaIngreso,
            'AniosAntiguedad' => $aniosAntiguedad,
            'ProximoAniversario' => $proximoAniversario->format('Y-m-d')
        ],
        'message' => 'Información obtenida correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => 'Error al obtener información: ' . $e->getMessage()
    ]);
}
?>