<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    echo json_encode([
        'status' => false,
        'message' => 'Método no permitido. Use PUT'
    ]);
    exit();
}

include_once '../../db/Connection.php';

$IdVacaciones = isset($_GET['IdVacaciones']) ? (int)$_GET['IdVacaciones'] : 0;
$Estatus = isset($_GET['Estatus']) ? (int)$_GET['Estatus'] : 0;
$IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : 0;

try {
    if ($IdVacaciones == 0) {
        throw new Exception('IdVacaciones es requerido');
    }
    
    if (!in_array($Estatus, [1, 2])) {
        throw new Exception('Estatus no válido');
    }
    
    $querySelect = "SELECT Estatus FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
    $stmtSelect = $Conexion->prepare($querySelect);
    $stmtSelect->bindParam(':IdVacaciones', $IdVacaciones);
    $stmtSelect->execute();
    $current = $stmtSelect->fetch(PDO::FETCH_ASSOC);
    
    if (!$current) {
        throw new Exception('Solicitud de vacaciones no encontrada');
    }
    
    if ($Estatus == 1 && $current['Estatus'] != 0) {
        throw new Exception('Solo se pueden validar solicitudes pendientes');
    }
    
    if ($Estatus == 1) {
        $query = "UPDATE t_Vacaciones SET 
                    Estatus = :Estatus,
                    FechaAutoriza = GETDATE(),
                    UsuarioAutoriza = :IdUsuario
                  WHERE IdVacaciones = :IdVacaciones";
    } else {
        $query = "UPDATE t_Vacaciones SET Estatus = :Estatus 
                  WHERE IdVacaciones = :IdVacaciones";
    }
    
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':Estatus', $Estatus);
    $stmt->bindParam(':IdVacaciones', $IdVacaciones);
    if ($Estatus == 1) {
        $stmt->bindParam(':IdUsuario', $IdUsuario);
    }
    
    if ($stmt->execute()) {
        $message = $Estatus == 1 ? 'Solicitud validada correctamente' : 'Solicitud cancelada correctamente';
        echo json_encode([
            'status' => true,
            'data' => null,
            'message' => $message
        ]);
    } else {
        throw new Exception('Error al cambiar el estatus');
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => $e->getMessage()
    ]);
}
?>