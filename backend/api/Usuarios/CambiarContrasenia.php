<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}
include_once '../../db/Connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $idUsuario = $input['IdUsuario'] ?? null;
    $nuevaContrasenia = $input['Contrasenia'] ?? null;
    $usuarioSesion = $input['IdUsuarioSesion'] ?? null;
    
    // Validar datos
    if (!$idUsuario) {
        echo json_encode([
            'status' => false,
            'message' => 'ID de usuario requerido'
        ]);
        exit();
    }
    
    if (!$nuevaContrasenia || strlen($nuevaContrasenia) < 6) {
        echo json_encode([
            'status' => false,
            'message' => 'La contraseña debe tener al menos 6 caracteres'
        ]);
        exit();
    }
    
    // Verificar que el usuario exista
    $checkQuery = "SELECT IdUsuario, Usuario FROM t_usuario WHERE IdUsuario = :id";
    $checkStmt = $Conexion->prepare($checkQuery);
    $checkStmt->bindParam(':id', $idUsuario);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() === 0) {
        echo json_encode([
            'status' => false,
            'message' => 'Usuario no encontrado'
        ]);
        exit();
    }
    
    $usuario = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    // Encriptar nueva contraseña
    $hashedPassword = password_hash($nuevaContrasenia, PASSWORD_DEFAULT);
    
    // Actualizar contraseña
    $query = "UPDATE t_usuario SET Contrasenia = :contrasenia WHERE IdUsuario = :id";
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':contrasenia', $hashedPassword);
    $stmt->bindParam(':id', $idUsuario);
    
    if ($stmt->execute()) {
        // Registrar en bitácora
        if ($usuarioSesion) {
            $bitacoraQuery = "INSERT INTO t_bitacora (IdUsuario, Accion, Tabla, RegistroId, Descripcion, FechaHora) 
                              VALUES (:idUsuario, 'UPDATE_PASSWORD', 'usuarios', :registroId, :descripcion, NOW())";
            $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
            $descripcion = "Cambio de contraseña para usuario: " . $usuario['Usuario'];
            $bitacoraStmt->bindParam(':idUsuario', $usuarioSesion);
            $bitacoraStmt->bindParam(':registroId', $idUsuario);
            $bitacoraStmt->bindParam(':descripcion', $descripcion);
            $bitacoraStmt->execute();
        }
        
        echo json_encode([
            'status' => true,
            'message' => 'Contraseña cambiada correctamente'
        ]);
    } else {
        echo json_encode([
            'status' => false,
            'message' => 'Error al cambiar la contraseña'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => false, 'message' => 'Método no permitido']);
}
?>