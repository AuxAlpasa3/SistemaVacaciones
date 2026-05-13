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

$method = $_SERVER["REQUEST_METHOD"];
$id = isset($_GET['IdUsuario']) ? $_GET['IdUsuario'] : null;
$usuarioSesion = isset($_GET['IdUsuarioSesion']) ? $_GET['IdUsuarioSesion'] : null;

$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        if ($id) {
            $query = "SELECT 
                        u.IdUsuario,
                        u.Usuario,
                        u.EmpleadoID,
                        u.Descripcion,
                        u.TipoUsuario,
                        u.Contrasenia,
                        u.Estatus,
                        u.rol,
                        u.Sesion,
                        u.UltimaSesion,
                        u.CreateDate,
                        u.Ubicacion
                      FROM t_usuario u
                      WHERE u.IdUsuario = :id";
            
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($usuario) {
                echo json_encode([
                    'status' => true,
                    'message' => 'Usuario encontrado',
                    'data' => $usuario
                ]);
            } else {
                echo json_encode([
                    'status' => false,
                    'message' => 'Usuario no encontrado',
                    'data' => null
                ]);
            }
        } else {
            $query = "SELECT 
                        u.IdUsuario,
                        u.Usuario,
                        u.EmpleadoID,
                        u.Descripcion,
                        u.TipoUsuario,
                        u.Contrasenia,
                        u.Estatus,
                        u.rol,
                        u.Sesion,
                        u.UltimaSesion,
                        u.CreateDate,
                        u.Ubicacion
                      FROM t_usuario u
                      ORDER BY u.IdUsuario DESC";
            
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            
            $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => true,
                'message' => 'Usuarios obtenidos correctamente',
                'data' => $usuarios
            ]);
        }
        break;
        
    case 'POST':
        $usuario = $input['Usuario'] ?? '';
        $empleadoID = !empty($input['EmpleadoID']) ? $input['EmpleadoID'] : null;
        $descripcion = !empty($input['Descripcion']) ? $input['Descripcion'] : null;
        $tipoUsuario = !empty($input['TipoUsuario']) ? $input['TipoUsuario'] : null;
        $contrasenia = $input['Contrasenia'] ?? '';
        $estatus = isset($input['Estatus']) ? $input['Estatus'] : 1;
        $rol = !empty($input['rol']) ? $input['rol'] : null;
        $ubicacion = !empty($input['Ubicacion']) ? $input['Ubicacion'] : null;
        
        $checkQuery = "SELECT COUNT(*) as total FROM t_usuario WHERE Usuario = :usuario";
        $checkStmt = $Conexion->prepare($checkQuery);
        $checkStmt->bindParam(':usuario', $usuario);
        $checkStmt->execute();
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result['total'] > 0) {
            echo json_encode([
                'status' => false,
                'message' => 'El nombre de usuario ya existe',
                'data' => null
            ]);
            break;
        }
        
        $hashedPassword = password_hash($contrasenia, PASSWORD_DEFAULT);
        
        $query = "INSERT INTO t_usuario 
                  (Usuario, EmpleadoID, Descripcion, TipoUsuario, Contrasenia, 
                   Estatus, rol, Ubicacion, CreateDate) 
                  VALUES 
                  (:usuario, :empleadoID, :descripcion, :tipoUsuario, :contrasenia,
                   :estatus, :rol, :ubicacion, GETDATE())";
        
        $stmt = $Conexion->prepare($query);
        $stmt->bindParam(':usuario', $usuario);
        $stmt->bindParam(':empleadoID', $empleadoID);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->bindParam(':tipoUsuario', $tipoUsuario);
        $stmt->bindParam(':contrasenia', $hashedPassword);
        $stmt->bindParam(':estatus', $estatus);
        $stmt->bindParam(':rol', $rol);
        $stmt->bindParam(':ubicacion', $ubicacion);
        
        if ($stmt->execute()) {
            $idInsertado = $Conexion->lastInsertId();
            
            if ($usuarioSesion) {
                $bitacoraQuery = "INSERT INTO t_bitacora (IdUsuario, Accion, Tabla, RegistroId, Descripcion, FechaHora) 
                                  VALUES (:idUsuario, 'CREATE', 'usuarios', :registroId, :descripcion, GETDATE())";
                $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
                $descripcionBitacora = "Creación de usuario: " . $usuario;
                $bitacoraStmt->bindParam(':idUsuario', $usuarioSesion);
                $bitacoraStmt->bindParam(':registroId', $idInsertado);
                $bitacoraStmt->bindParam(':descripcion', $descripcionBitacora);
                $bitacoraStmt->execute();
            }
            
            echo json_encode([
                'status' => true,
                'message' => 'Usuario creado correctamente',
                'data' => ['IdUsuario' => $idInsertado]
            ]);
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Error al crear usuario',
                'data' => null
            ]);
        }
        break;
        
    case 'PUT':
        // Actualizar usuario
        if (!$id) {
            echo json_encode(['status' => false, 'message' => 'ID de usuario requerido']);
            break;
        }
        
        // Verificar si el usuario existe
        $checkQuery = "SELECT IdUsuario FROM t_usuario WHERE IdUsuario = :id";
        $checkStmt = $Conexion->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            echo json_encode([
                'status' => false,
                'message' => 'Usuario no encontrado',
                'data' => null
            ]);
            break;
        }
        
        $usuario = $input['Usuario'] ?? null;
        $empleadoID = isset($input['EmpleadoID']) ? (!empty($input['EmpleadoID']) ? $input['EmpleadoID'] : null) : null;
        $descripcion = isset($input['Descripcion']) ? (!empty($input['Descripcion']) ? $input['Descripcion'] : null) : null;
        $tipoUsuario = isset($input['TipoUsuario']) ? (!empty($input['TipoUsuario']) ? $input['TipoUsuario'] : null) : null;
        $estatus = isset($input['Estatus']) ? $input['Estatus'] : null;
        $rol = isset($input['rol']) ? (!empty($input['rol']) ? $input['rol'] : null) : null;
        $ubicacion = isset($input['Ubicacion']) ? (!empty($input['Ubicacion']) ? $input['Ubicacion'] : null) : null;
        $contrasenia = isset($input['Contrasenia']) ? (!empty($input['Contrasenia']) ? $input['Contrasenia'] : null) : null;
        
        // Verificar que el nombre de usuario no esté duplicado
        if ($usuario) {
            $checkUserQuery = "SELECT COUNT(*) as total FROM usuarios WHERE Usuario = :usuario AND IdUsuario != :id";
            $checkUserStmt = $Conexion->prepare($checkUserQuery);
            $checkUserStmt->bindParam(':usuario', $usuario);
            $checkUserStmt->bindParam(':id', $id);
            $checkUserStmt->execute();
            $result = $checkUserStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result['total'] > 0) {
                echo json_encode([
                    'status' => false,
                    'message' => 'El nombre de usuario ya existe',
                    'data' => null
                ]);
                break;
            }
        }
        
        // Construir query dinámica
        $fields = [];
        $params = [':id' => $id];
        
        if ($usuario !== null) {
            $fields[] = "Usuario = :usuario";
            $params[':usuario'] = $usuario;
        }
        if ($empleadoID !== null) {
            $fields[] = "EmpleadoID = :empleadoID";
            $params[':empleadoID'] = $empleadoID;
        }
        if ($descripcion !== null) {
            $fields[] = "Descripcion = :descripcion";
            $params[':descripcion'] = $descripcion;
        }
        if ($tipoUsuario !== null) {
            $fields[] = "TipoUsuario = :tipoUsuario";
            $params[':tipoUsuario'] = $tipoUsuario;
        }
        if ($estatus !== null) {
            $fields[] = "Estatus = :estatus";
            $params[':estatus'] = $estatus;
        }
        if ($rol !== null) {
            $fields[] = "rol = :rol";
            $params[':rol'] = $rol;
        }
        if ($ubicacion !== null) {
            $fields[] = "Ubicacion = :ubicacion";
            $params[':ubicacion'] = $ubicacion;
        }
        if ($contrasenia !== null) {
            $hashedPassword = password_hash($contrasenia, PASSWORD_DEFAULT);
            $fields[] = "Contrasenia = :contrasenia";
            $params[':contrasenia'] = $hashedPassword;
        }
        
        if (empty($fields)) {
            echo json_encode([
                'status' => false,
                'message' => 'No hay datos para actualizar',
                'data' => null
            ]);
            break;
        }
        
        $query = "UPDATE t_usuario SET " . implode(', ', $fields) . " WHERE IdUsuario = :id";
        $stmt = $Conexion->prepare($query);
        
        foreach ($params as $key => &$val) {
            $stmt->bindParam($key, $val);
        }
        
        if ($stmt->execute()) {
            // Registrar en bitácora
            if ($usuarioSesion) {
                $bitacoraQuery = "INSERT INTO t_bitacora (IdUsuario, Accion, Tabla, RegistroId, Descripcion, FechaHora) 
                                  VALUES (:idUsuario, 'UPDATE', 'usuarios', :registroId, :descripcion, GETDATE())";
                $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
                $descripcionBitacora = "Actualización de usuario ID: " . $id;
                $bitacoraStmt->bindParam(':idUsuario', $usuarioSesion);
                $bitacoraStmt->bindParam(':registroId', $id);
                $bitacoraStmt->bindParam(':descripcion', $descripcionBitacora);
                $bitacoraStmt->execute();
            }
            
            echo json_encode([
                'status' => true,
                'message' => 'Usuario actualizado correctamente',
                'data' => ['IdUsuario' => $id]
            ]);
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Error al actualizar usuario',
                'data' => null
            ]);
        }
        break;
        
    case 'DELETE':
        // Eliminar usuario
        if (!$id) {
            echo json_encode(['status' => false, 'message' => 'ID de usuario requerido']);
            break;
        }
        
        // Verificar si el usuario existe
        $checkQuery = "SELECT Usuario FROM usuarios WHERE IdUsuario = :id";
        $checkStmt = $Conexion->prepare($checkQuery);
        $checkStmt->bindParam(':id', $id);
        $checkStmt->execute();
        
        if ($checkStmt->rowCount() === 0) {
            echo json_encode([
                'status' => false,
                'message' => 'Usuario no encontrado',
                'data' => null
            ]);
            break;
        }
        
        $usuarioEliminado = $checkStmt->fetch(PDO::FETCH_ASSOC);
        
        $query = "UPDATE t_usuario SET Estatus = 0 WHERE IdUsuario = :id";
        $stmt = $Conexion->prepare($query);
        $stmt->bindParam(':id', $id);
        
        if ($stmt->execute()) {
            // Registrar en bitácora
            if ($usuarioSesion) {
                $bitacoraQuery = "INSERT INTO t_bitacora (IdUsuario, Accion, Tabla, RegistroId, Descripcion, FechaHora) 
                                  VALUES (:idUsuario, 'DELETE', 'usuarios', :registroId, :descripcion, GETDATE())";
                $bitacoraStmt = $Conexion->prepare($bitacoraQuery);
                $descripcionBitacora = "Eliminación de usuario: " . $usuarioEliminado['Usuario'];
                $bitacoraStmt->bindParam(':idUsuario', $usuarioSesion);
                $bitacoraStmt->bindParam(':registroId', $id);
                $bitacoraStmt->bindParam(':descripcion', $descripcionBitacora);
                $bitacoraStmt->execute();
            }
            
            echo json_encode([
                'status' => true,
                'message' => 'Usuario eliminado correctamente',
                'data' => null
            ]);
        } else {
            echo json_encode([
                'status' => false,
                'message' => 'Error al eliminar usuario',
                'data' => null
            ]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['status' => false, 'message' => 'Método no permitido']);
        break;
}
?>