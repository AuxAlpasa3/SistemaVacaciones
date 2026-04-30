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

try {
    switch ($method) {
        case "POST":
            if (isset($_POST['action']) && $_POST['action'] === 'cambiar_contrasenia') {
                $IdUsuario = $_POST['IdUsuario'];
                $Contrasenia = $_POST['Contrasenia'];

                if (!isset($IdUsuario) || !isset($Contrasenia)) {
                    http_response_code(400);
                    echo json_encode(['status' => false, 'message' => 'Datos incompletos para cambio de contraseña']);
                    exit;
                }
                
                $passCifrada = password_hash($Contrasenia,PASSWORD_DEFAULT);
                $Contrasenia = $passCifrada;

               $query = "UPDATE t_usuario SET Contrasenia = :Contrasenia WHERE IdUsuario = :IdUsuario";
               $stmt = $Conexion->prepare($query);
               $stmt->bindParam(":IdUsuario", $IdUsuario);
               $stmt->bindParam(":Contrasenia", $Contrasenia);

                if ($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode(['status' => true, 'message' => 'Contraseña actualizada correctamente']);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => false, 'message' => 'Error al actualizar contraseña']);
                }
                break;
            }

            // Crear nuevo usuario
            $Usuario = $_POST['Usuario'];
            $TipoUsuario = $_POST['TipoUsuario'];
            $Correo = $_POST['Correo'];
            $NombreColaborador = $_POST['NombreColaborador'];
            $Almacen = $_POST['Almacen'];
            $Estatus = $_POST['Estatus'];
            $Contrasenia = $_POST['Contrasenia'];

            
            $passCifrada = password_hash($Contrasenia,PASSWORD_DEFAULT);
            $Contrasenia = $passCifrada;

            if (!isset($IdUsuario) || !isset($Usuario) || !isset($Contrasenia)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Datos incompletos']);
                exit;
            }
            
            // Verificar si el usuario ya existe
           $query = "SELECT COUNT(*) as count FROM t_usuario WHERE Usuario = :Usuario";
           $stmt = $Conexion->prepare($query);
           $stmt->bindParam(":Usuario", $Usuario);
            $stmt->execute();
            $exists = $conexion->pps->fetch(PDO::FETCH_ASSOC)['count'] > 0;

            if ($exists) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'El Usuario ya existe']);
            } else {
                // Insertar nuevo usuario
               $query = "INSERT INTO t_usuario(IdUsuario, Usuario, TipoUsuario, Correo, NombreColaborador, Almacen, Estatus, Contrasenia)
                 VALUES (:IdUsuario, :Usuario, :TipoUsuario, :Correo, :NombreColaborador, :Almacen, :Estatus, :Contrasenia)";
            }

           $stmt = $Conexion->prepare($query);

           $stmt->bindParam(":IdUsuario", $IdUsuario);
           $stmt->bindParam(":Usuario", $Usuario);
           $stmt->bindParam(":TipoUsuario", $TipoUsuario);
           $stmt->bindParam(":Correo", $Correo);
           $stmt->bindParam(":NombreColaborador", $NombreColaborador);
           $stmt->bindParam(":Almacen", $Almacen);
           $stmt->bindParam(":Estatus", $Estatus);
            
            if (!$exists) {
               $stmt->bindParam(":Contrasenia", $Contrasenia);
            }

            if ($stmt->execute()) {
                http_response_code($exists ? 200 : 201);
                echo json_encode(['status' => true, 'message' => $exists ? 'Usuario actualizado' : 'Usuario registrado']);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al guardar usuario']);
            }
            break;

        case "GET":
            if (isset($_GET['IdUsuario'])) {
               $query = "SELECT IdUsuario, Usuario, TipoUsuario, Correo, NombreColaborador, Almacen, Estatus FROM t_usuario WHERE IdUsuario = :IdUsuario";
               $stmt = $Conexion->prepare($query);
               $stmt->bindParam(":IdUsuario", $_GET['IdUsuario']);
            } else {
               $query = "SELECT IdUsuario, Usuario, TipoUsuario, Correo, NombreColaborador, Almacen, Estatus FROM t_usuario ORDER BY IdUsuario";
               $stmt = $Conexion->prepare($query);
            }

            $stmt->execute();
              $data = $stmt->fetchAll(PDO::FETCH_ASSOC);


            if ($data) {
                http_response_code(200);
                echo json_encode(['status' => true, 'data' => $data]);
            } else {
                http_response_code(200);
                echo json_encode(['status' => false, 'message' => 'No hay información']);
            }
            break;

        case "DELETE":
            if (!isset($_GET['IdUsuario'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }

           $query = "DELETE FROM t_usuario WHERE IdUsuario = :IdUsuario";
           $stmt = $Conexion->prepare($query);
           $stmt->bindParam(":IdUsuario", $_GET['IdUsuario']);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode(['status' => true, 'message' => 'Usuario eliminado']);
            } else {
                http_response_code(404);
                echo json_encode(['status' => false, 'message' => 'No se encontró el usuario']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['status' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (\Throwable $th) {
    http_response_code(500);
    echo json_encode(['status' => false, 'message' => 'Error: ' . $th->getMessage()]);
} finally {
    $conexion->closeDataBase();
}