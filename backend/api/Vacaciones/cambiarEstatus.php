<?php
// vacaciones/cambiarEstatus.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../includes/Connection.php';
require_once __DIR__ . '/../includes/VacacionesService.php';

try {
    $db = Connection::getInstance()->getConnection();
    $service = new VacacionesService($db);
    
    // Obtener parámetros
    $idVacaciones = $_GET['IdVacaciones'] ?? null;
    $nuevoEstatus = $_GET['Estatus'] ?? null;
    $idUsuario = $_GET['IdUsuario'] ?? null;
    
    if (!$idVacaciones || $nuevoEstatus === null) {
        throw new Exception('Faltan parámetros requeridos: IdVacaciones y Estatus');
    }
    
    // Obtener comentarios del body
    $input = json_decode(file_get_contents('php://input'), true);
    $comentarios = $input['Comentarios'] ?? null;
    $usuarioAutoriza = $input['UsuarioAutoriza'] ?? null;
    $fechaAutoriza = $input['FechaAutoriza'] ?? null;
    
    // Actualizar estatus en la base de datos
    $updateFields = "Estatus = ?";
    $params = [$nuevoEstatus];
    $types = "i";
    
    if ($nuevoEstatus == 1) { // Autorizada
        $updateFields .= ", UsuarioAutoriza = ?, FechaAutoriza = ?";
        $params[] = $usuarioAutoriza ?? $idUsuario;
        $params[] = $fechaAutoriza ?? date('Y-m-d');
        $types .= "ss";
    } elseif ($nuevoEstatus == 2) { // Validada
        $updateFields .= ", UsuarioValida = ?, FechaValidado = ?";
        $params[] = $idUsuario;
        $params[] = date('Y-m-d');
        $types .= "ss";
    }
    
    if ($comentarios !== null) {
        $updateFields .= ", Comentarios = ?";
        $params[] = $comentarios;
        $types .= "s";
    }
    
    $params[] = $idVacaciones;
    $types .= "i";
    
    $stmt = $db->prepare("UPDATE vacaciones SET $updateFields WHERE IdVacaciones = ?");
    $stmt->bind_param($types, ...$params);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al actualizar el estatus');
    }
    
     $result = $service->sendStatusNotification($idVacaciones, $nuevoEstatus, $comentarios);
    
    echo json_encode([
        'status' => true,
        'message' => 'Estatus actualizado correctamente',
        'notificaciones_enviadas' => $result
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => $e->getMessage()
    ]);
}