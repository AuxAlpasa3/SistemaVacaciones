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
            $Cargo = isset($_POST['Cargo']) ? trim($_POST['Cargo']) : null;
            $IdUsuario = isset($_POST['IdUsuario']) ? (int)$_POST['IdUsuario'] : null;

            if (!isset($Cargo)) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'Datos incompletos']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $query = "INSERT INTO t_cargo(NomCargo) VALUES(:NomCargo)";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":NomCargo", $Cargo);

            if ($stmt->execute()) {
                $lastInsertId = $Conexion->lastInsertId();
                
                $tabla = 't_cargo';
                $folioMovimiento = $lastInsertId;
                $fecha = date('Y-m-d H:i:s');
                $consulta = "INSERT INTO t_cargo(NomCargo) VALUES('" . addslashes($Cargo) . "')";
                
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
                
                http_response_code(201); 
                echo json_encode([
                    'status' => true, 
                    'message' => 'Cargo registrado',
                    'data' => [
                        'IdCargo' => $lastInsertId,
                        'Cargo' => $Cargo
                    ],
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(500); 
                echo json_encode(['status' => false, 'message' => 'Error al registrar Cargo']);
            }
            break;

        case "PUT":
            $input = json_decode(file_get_contents('php://input'), true);
            $IdCargo = isset($input['IdCargo']) ? (int)$input['IdCargo'] : null;
            $Cargo = isset($input['Cargo']) ? trim($input['Cargo']) : null;
            $IdUsuario = isset($input['IdUsuario']) ? (int)$input['IdUsuario'] : null;
            
            if (!$IdCargo) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $queryOld = "SELECT NomCargo FROM t_cargo WHERE IdCargo = :IdCargo";
            $stmtOld = $Conexion->prepare($queryOld);
            $stmtOld->bindParam(":IdCargo", $IdCargo);
            $stmtOld->execute();
            $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);
            
            if (!$oldData) {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el Cargo con ID: ' . $IdCargo]);
                exit;
            }
            
            $updateFields = [];
            $params = [':IdCargo' => $IdCargo];
            $changes = [];
            
            if ($Cargo !== null) {
                $updateFields[] = "NomCargo = :NomCargo";
                $params[':Cargo'] = $Cargo;
                if ($oldData['Cargo'] != $Cargo) {
                    $changes[] = "Cargo: '" . addslashes($oldData['Cargo']) . "' -> '" . addslashes($Cargo) . "'";
                }
            }
            
            if (empty($updateFields)) {
                $Conexion->rollBack();
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No hay campos para actualizar']);
                exit;
            }
            
            $query = "UPDATE t_cargo SET " . implode(", ", $updateFields) . " WHERE IdCargo = :IdCargo";
            $stmt = $Conexion->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $tabla = 't_cargo';
                $folioMovimiento = $IdCargo;
                $fecha = date('Y-m-d H:i:s');
                $consulta = $query . " | Cambios realizados: " . implode(", ", $changes);
                
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
                
                http_response_code(200); 
                echo json_encode([
                    'status' => true, 
                    'message' => 'Cargo modificado',
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se realizaron cambios o no se encontró el Cargo']);
            }
            break;

        case "GET":
            if (!isset($_GET['IdCargo'])) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }

            $query = "SELECT * FROM t_cargo WHERE IdCargo = :IdCargo";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdCargo", $_GET['IdCargo']);
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                http_response_code(200); 
                echo json_encode(['status' => true, 'data' => $data]);
            } else {
                http_response_code(200); 
                echo json_encode(['status' => false, 'message' => 'No hay información']);
            }
            break;

        case "DELETE":
            $IdCargo = isset($_GET['IdCargo']) ? (int)$_GET['IdCargo'] : null;
            $IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : null;
            
            if (!$IdCargo) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $queryOld = "SELECT NomCargo FROM t_cargo WHERE IdCargo = :IdCargo";
            $stmtOld = $Conexion->prepare($queryOld);
            $stmtOld->bindParam(":IdCargo", $IdCargo);
            $stmtOld->execute();
            $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);
            
            if (!$oldData) {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el Cargo con ID: ' . $IdCargo]);
                exit;
            }

            $query = "DELETE FROM t_cargo WHERE IdCargo = :IdCargo";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdCargo", $IdCargo);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $tabla = 't_cargo';
                $folioMovimiento = $IdCargo;
                $fecha = date('Y-m-d H:i:s');
                $consulta = "DELETE FROM t_cargo WHERE IdCargo = " . $IdCargo;
                $consulta .= " | Datos eliminados: NomCargo = '" . addslashes($oldData['NomCargo']) . "'";
                
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
                
                http_response_code(200); 
                echo json_encode([
                    'status' => true, 
                    'message' => 'Cargo eliminado',
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el Cargo con ID: ' . $IdCargo]);
            }
            break;
            
        default:
            http_response_code(405); 
            echo json_encode(['status' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (\Throwable $th) {
    if (isset($Conexion) && $Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    http_response_code(500); 
    echo json_encode(['status' => false, 'message' => 'Error: ' . $th->getMessage()]);
} finally {
    $Conexion = null;
}
?>