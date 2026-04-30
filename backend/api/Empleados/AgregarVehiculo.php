<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../db/Connection.php';

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
    
    if (!isset($_POST['Placas']) || empty(trim($_POST['Placas']))) {
        echo json_encode([
            'status' => false,
            'message' => 'El campo "placas" es requerido'
        ]);
        exit();
    }
    
    
    $Marca = isset($_POST['Marca']) ? trim($_POST['Marca']) : '';
    $Modelo = isset($_POST['Modelo']) ? trim($_POST['Modelo']) : '';
    $Placas = isset($_POST['Placas']) ? trim($_POST['Placas']) : '';
    $Anio = isset($_POST['Anio']) ? trim($_POST['Anio']) : '';
    $Color = isset($_POST['Color']) ? trim($_POST['Color']) : '';
    $TipoVehiculo = isset($_POST['TipoVehiculo']) ? trim($_POST['TipoVehiculo']) : '';
    
    $Activo = 1;
    $IdAsociado = isset($_POST['IdPersonal']) ? (int)$_POST['IdPersonal'] : null;
    $IdUsuario = isset($_POST['IdUsuario']) ? (int)$_POST['IdUsuario'] : null;
    
    $Conexion->beginTransaction();
    
    $checkQuery = "SELECT IdVehiculo, Placas FROM t_vehiculos WHERE Placas = :placas";
    $checkStmt = $Conexion->prepare($checkQuery);
    $checkStmt->bindParam(':placas', $Placas, PDO::PARAM_STR);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        $Conexion->rollBack();
        $existingRecord = $checkStmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => true,
            'data' => [
                'IdVehiculo' => (int)$existingRecord['IdVehiculo'],
                'placas' => $existingRecord['Placas'],
                'already_exists' => true
            ],
            'message' => 'El vehículo ya existe en la base de datos'
        ]);
        exit();
    }
    
    $query = "INSERT INTO t_vehiculos (Marca, Modelo, Placas, Anio, Color, TipoVehiculo, Activo, IdAsociado) VALUES (:marca, :modelo, :placas, :anio, :color, :tipoVehiculo, :activo, :idAsociado)";
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':marca', $Marca, PDO::PARAM_STR);
    $stmt->bindParam(':modelo', $Modelo, PDO::PARAM_STR);
    $stmt->bindParam(':placas', $Placas, PDO::PARAM_STR);
    $stmt->bindParam(':anio', $Anio, PDO::PARAM_STR);
    $stmt->bindParam(':color', $Color, PDO::PARAM_STR);
    $stmt->bindParam(':tipoVehiculo', $TipoVehiculo, PDO::PARAM_STR);
    $stmt->bindParam(':activo', $Activo, PDO::PARAM_INT);
    $stmt->bindParam(':idAsociado', $IdAsociado, PDO::PARAM_INT);
    $stmt->execute();
    
    $lastInsertId = $Conexion->lastInsertId();
    
    $tabla = 't_vehiculos';
    $folioMovimiento = $lastInsertId;
    $fecha = date('Y-m-d H:i:s');
    
    $consulta = "INSERT INTO t_vehiculos (Marca, Modelo, Placas, Anio, Color, TipoVehiculo, Activo, IdAsociado) VALUES (:marca, :modelo, :placas, :anio, :color, :tipoVehiculo, :activo, :idAsociado)";
    
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