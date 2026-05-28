<?php
// /vacaciones/cambiarEstatus.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../db/Connection.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'PUT') {
    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => 'Método no permitido'
    ]);
    exit;
}

$idVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;
$nuevoEstatus = isset($_GET['Estatus']) ? intval($_GET['Estatus']) : 0;
$idUsuario = isset($_GET['IdUsuario']) ? intval($_GET['IdUsuario']) : 0;

$data = json_decode(file_get_contents('php://input'), true);

try {
    $Conexion->beginTransaction();
    
    $query = "UPDATE t_vacaciones SET Estatus = :Estatus, Comentarios = :Comentarios WHERE IdVacaciones = :IdVacaciones";
    $stmt = $Conexion->prepare($query);
    $comentarios = $data['Comentarios'] ?? null;
    $stmt->bindParam(':Estatus', $nuevoEstatus, PDO::PARAM_INT);
    $stmt->bindParam(':Comentarios', $comentarios);
    $stmt->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al actualizar estatus');
    }
    
    if ($nuevoEstatus == 1 && isset($data['UsuarioAutoriza']) && isset($data['FechaAutoriza'])) {
        $query2 = "UPDATE t_vacaciones SET UsuarioAutoriza = :UsuarioAutoriza, FechaAutoriza = :FechaAutoriza WHERE IdVacaciones = :IdVacaciones";
        $stmt2 = $Conexion->prepare($query2);
        $fechaAutoriza = date('Y-m-d H:i:s');
        $stmt2->bindParam(':UsuarioAutoriza', $data['UsuarioAutoriza']);
        $stmt2->bindParam(':FechaAutoriza', $fechaAutoriza);
        $stmt2->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
        if (!$stmt2->execute()) {
            throw new Exception('Error al actualizar autorización');
        }
    }
    
    if ($nuevoEstatus == 2 && isset($data['UsuarioValida']) && isset($data['FechaValidado'])) {
        $query3 = "UPDATE t_vacaciones SET UsuarioValida = :UsuarioValida, FechaValidado = :FechaValidado WHERE IdVacaciones = :IdVacaciones";
        $stmt3 = $Conexion->prepare($query3);
        $fechaValidado = date('Y-m-d H:i:s');
        $stmt3->bindParam(':UsuarioValida', $data['UsuarioValida']);
        $stmt3->bindParam(':FechaValidado', $fechaValidado);
        $stmt3->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
        if (!$stmt3->execute()) {
            throw new Exception('Error al actualizar validación');
        }
    }
    
    $Conexion->commit();
    
    echo json_encode([
        'status' => true,
        'data' => null,
        'message' => 'Estatus actualizado correctamente'
    ]);
    
} catch (Exception $e) {
    $Conexion->rollBack();
    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => 'Error al actualizar estatus: ' . $e->getMessage()
    ]);
}
?>