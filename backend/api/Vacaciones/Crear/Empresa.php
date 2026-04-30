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
    
    if (!isset($input['Empresa']) || empty(trim($input['Empresa']))) {
        echo json_encode([
            'status' => false,
            'message' => 'El campo "empresa" es requerido'
        ]);
        exit();
    }
    
    $empresa = trim($input['Empresa']);
    $IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : null;
    
    $Conexion->beginTransaction();
    
    $checkQuery = "SELECT IdEmpresa, NomEmpresa FROM t_empresa WHERE NomEmpresa = :empresa";
    $checkStmt = $Conexion->prepare($checkQuery);
    $checkStmt->bindParam(':empresa', $empresa, PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        $Conexion->rollBack();
        $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => true,
            'data' => [
                'IdEmpresa' => (int)$existingRecord['IdEmpresa'],
                'empresa' => $existingRecord['NomEmpresa'],
                'already_exists' => true
            ],
            'message' => 'La empresa ya existe en la base de datos'
        ]);
        exit();
    }
    
    $query = "INSERT INTO t_empresa (NomEmpresa) VALUES (:empresa)";
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':empresa', $empresa, PDO::PARAM_STR);
    $stmt->execute();
    
    $lastInsertId = $Conexion->lastInsertId();
    
    $tabla = 't_empresa';
    $folioMovimiento = $lastInsertId;
    $fecha = date('Y-m-d H:i:s');
    
    $consulta = "INSERT INTO t_empresa (NomEmpresa) VALUES ('" . addslashes($empresa) . "')";
    
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
            'IdDepartamento' => (int)$lastInsertId,
            'departamento' => $departamento,
            'already_exists' => false,
            'bitacora_id' => $Conexion->lastInsertId()
        ],
        'message' => 'Departamento insertado correctamente y registrado en bitácora'
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