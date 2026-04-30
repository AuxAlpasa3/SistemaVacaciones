<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../../db/Connection.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    echo json_encode([
        'status' => false,
        'message' => 'Método no permitido. Use POST'
    ]);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['Cargo']) || empty(trim($input['Cargo']))) {
        echo json_encode([
            'status' => false,
            'message' => 'El campo "cargo" es requerido'
        ]);
        exit();
    }
    
    $cargo = trim($input['Cargo']);
    $IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : null;
    
    $Conexion->beginTransaction();
    
    $checkQuery = "SELECT IdCargo, NomCargo FROM t_cargo WHERE NomCargo = :cargo";
    $checkStmt = $Conexion->prepare($checkQuery);
    $checkStmt->bindParam(':cargo', $cargo, PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        $Conexion->rollBack();
        $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => true,
            'data' => [
                'IdCargo' => (int)$existingRecord['IdCargo'],
                'cargo' => $existingRecord['NomCargo'],
                'already_exists' => true
            ],
            'message' => 'El cargo ya existe en la base de datos'
        ]);
        exit();
    }
    
    $query = "INSERT INTO t_cargo (NomCargo) VALUES (:cargo)";
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':cargo', $cargo, PDO::PARAM_STR);
    $stmt->execute();
    
    $lastInsertId = $Conexion->lastInsertId();
    
    $tabla = 't_cargo';
    $folioMovimiento = $lastInsertId;
    $fecha = date('Y-m-d H:i:s');
    
    $consulta = "INSERT INTO t_cargo (NomCargo) VALUES ('" . addslashes($cargo) . "')";
    
    $bitacoraQuery = "INSERT INTO t_bitacora (Tabla, FolMovimiento, Fecha, Consulta, Usuario) 
                      VALUES (:tabla, :folioMovimiento, :fecha, :consulta, :usuario)";
    $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
    $bitacoraStmt->bindParam(':tabla', $tabla, PDO::PARAM_STR);
    $bitacoraStmt->bindParam(':folioMovimiento', $folioMovimiento, PDO::PARAM_INT);
    $bitacoraStmt->bindParam(':fecha', $fecha, PDO::PARAM_STR);
    $bitacoraStmt->bindParam(':consulta', $consulta, PDO::PARAM_STR);
    $bitacoraStmt->bindParam(':usuario', $IdUsuario, PDO::PARAM_INT);
    $bitacoraStmt->execute();
    
    $Conexion->commit();
    
    echo json_encode([
        'status' => true,
        'data' => [
            'IdCargo' => (int)$lastInsertId,
            'cargo' => $cargo,
            'already_exists' => false,
            'bitacora_id' => $Conexion->lastInsertId()
        ],
        'message' => 'Cargo insertado correctamente y registrado en bitácora'
    ]);
    
} catch (PDOException $e) {
    if ($Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    $errorCode = $e->getCode();
    $errorMessage = $e->getMessage();
    
    echo json_encode([
        'status' => false,
        'message' => 'Error al procesar la solicitud: ' . $errorMessage
    ]);
    
} catch (Exception $e) {
    if ($Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>