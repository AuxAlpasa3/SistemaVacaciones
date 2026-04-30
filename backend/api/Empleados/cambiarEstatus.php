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

try {
    $idPersonal = isset($_GET['IdPersonal']) ? intval($_GET['IdPersonal']) : 0;
    $nuevoStatus = isset($_GET['Status']) ? $_GET['Status'] : '';
    $idUsuario = isset($_GET['IdUsuario']) ? intval($_GET['IdUsuario']) : 0;
    
    if ($idPersonal <= 0) {
        echo json_encode([
            'status' => false,
            'message' => 'ID de personal no válido'
        ]);
        exit();
    }
    
    if (!in_array($nuevoStatus, ['0', '1', '2'])) {
        echo json_encode([
            'status' => false,
            'message' => 'Estatus no válido. Use 0 (Inactivo), 1 (Activo) o 2 (Desactivado)'
        ]);
        exit();
    }
    
    if ($idUsuario <= 0) {
        echo json_encode([
            'status' => false,
            'message' => 'ID de usuario no válido'
        ]);
        exit();
    }
    
    $checkQuery = "SELECT IdPersonal, Status FROM t_personal WHERE IdPersonal = :idPersonal";
    $checkStmt = $Conexion->prepare($checkQuery);
    $checkStmt->bindParam(':idPersonal', $idPersonal);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        echo json_encode([
            'status' => false,
            'message' => 'Empleado no encontrado'
        ]);
        exit();
    }
    
    $empleadoActual = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($empleadoActual['Status'] == $nuevoStatus) {
        echo json_encode([
            'status' => false,
            'message' => 'El empleado ya tiene este estatus'
        ]);
        exit();
    }
    
    $Conexion->beginTransaction();
    
    $updateQuery = "UPDATE t_personal SET Status = :status WHERE IdPersonal = :idPersonal";
    $updateStmt = $Conexion->prepare($updateQuery);
    $updateStmt->bindParam(':status', $nuevoStatus);
    $updateStmt->bindParam(':idPersonal', $idPersonal);
    
    if (!$updateStmt->execute()) {
        throw new Exception('Error al actualizar el estatus del empleado');
    }
    
    $bitacoraQuery = "INSERT INTO Bitacora (Tabla, FolMovimiento, Fecha, Consulta, Usuario) 
                      VALUES (:tabla, :folMovimiento, GETDATE(), :consulta, :usuario)";
    $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
    $tabla = 't_personal';
    $consulta = "UPDATE t_personal SET Status = $nuevoStatus WHERE IdPersonal = $idPersonal";
    $bitacoraStmt->bindParam(':tabla', $tabla);
    $bitacoraStmt->bindParam(':folMovimiento', $idPersonal);
    $bitacoraStmt->bindParam(':consulta', $consulta);
    $bitacoraStmt->bindParam(':usuario', $idUsuario);
    $bitacoraStmt->execute();
    
    $Conexion->commit();
    
    $infoQuery = "SELECT NoEmpleado, CONCAT(Nombre, ' ', ApPaterno, ' ', ApMaterno) as NombreCompleto 
                  FROM t_personal WHERE IdPersonal = :idPersonal";
    $infoStmt = $Conexion->prepare($infoQuery);
    $infoStmt->bindParam(':idPersonal', $idPersonal);
    $infoStmt->execute();
    $empleadoInfo = $infoStmt->fetch(PDO::FETCH_ASSOC);
    
    $statusTexto = '';
    switch ($nuevoStatus) {
        case '1':
            $statusTexto = 'Activo';
            break;
        case '0':
            $statusTexto = 'Inactivo';
            break;
        case '2':
            $statusTexto = 'Desactivado';
            break;
    }
    
    echo json_encode([
        'status' => true,
        'message' => "Estatus del empleado {$empleadoInfo['NoEmpleado']} - {$empleadoInfo['NombreCompleto']} cambiado a: {$statusTexto}",
        'data' => [
            'IdPersonal' => $idPersonal,
            'NoEmpleado' => $empleadoInfo['NoEmpleado'],
            'NombreCompleto' => $empleadoInfo['NombreCompleto'],
            'StatusNuevo' => $nuevoStatus,
            'StatusTexto' => $statusTexto
        ]
    ]);
    
} catch (Exception $e) {
    if (isset($Conexion) && $Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    echo json_encode([
        'status' => false,
        'message' => 'Error al cambiar estatus: ' . $e->getMessage()
    ]);
} catch (PDOException $e) {
    if (isset($Conexion) && $Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    echo json_encode([
        'status' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
}
?>