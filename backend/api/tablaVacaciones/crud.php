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
            $TablaVacaciones = isset($_POST['TablaVacaciones']) ? trim($_POST['TablaVacaciones']) : null;
            $IdUsuario = isset($_POST['IdUsuario']) ? (int)$_POST['IdUsuario'] : null;

            if (!isset($TablaVacaciones)) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'Datos incompletos']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $query = "INSERT INTO t_tablaVacaciones(NomTablaVacaciones) VALUES(:NomTablaVacaciones)";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":NomTablaVacaciones", $TablaVacaciones);

            if ($stmt->execute()) {
                $lastInsertId = $Conexion->lastInsertId();
                
                $tabla = 't_tablaVacaciones';
                $folioMovimiento = $lastInsertId;
                $fecha = date('Y-m-d H:i:s');
                $consulta = "INSERT INTO t_tablaVacaciones(NomTablaVacaciones) VALUES('" . addslashes($TablaVacaciones) . "')";
                
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
                    'message' => 'TablaVacaciones registrado',
                    'data' => [
                        'IdTablaVacaciones' => $lastInsertId,
                        'TablaVacaciones' => $TablaVacaciones
                    ],
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(500); 
                echo json_encode(['status' => false, 'message' => 'Error al registrar TablaVacaciones']);
            }
            break;

        case "PUT":
            $input = json_decode(file_get_contents('php://input'), true);
            $IdTablaVacaciones = isset($input['IdTablaVacaciones']) ? (int)$input['IdTablaVacaciones'] : null;
            $TablaVacaciones = isset($input['TablaVacaciones']) ? trim($input['TablaVacaciones']) : null;
            $IdUsuario = isset($input['IdUsuario']) ? (int)$input['IdUsuario'] : null;
            
            if (!$IdTablaVacaciones) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $queryOld = "SELECT NomTablaVacaciones FROM t_tablaVacaciones WHERE IdTablaVacaciones = :IdTablaVacaciones";
            $stmtOld = $Conexion->prepare($queryOld);
            $stmtOld->bindParam(":IdTablaVacaciones", $IdTablaVacaciones);
            $stmtOld->execute();
            $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);
            
            if (!$oldData) {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el TablaVacaciones con ID: ' . $IdTablaVacaciones]);
                exit;
            }
            
            $updateFields = [];
            $params = [':IdTablaVacaciones' => $IdTablaVacaciones];
            $changes = [];
            
            if ($TablaVacaciones !== null) {
                $updateFields[] = "NomTablaVacaciones = :NomTablaVacaciones";
                $params[':NomTablaVacaciones'] = $TablaVacaciones;
                if ($oldData['NomTablaVacaciones'] != $TablaVacaciones) {
                    $changes[] = "NomTablaVacaciones: '" . addslashes($oldData['NomTablaVacaciones']) . "' -> '" . addslashes($TablaVacaciones) . "'";
                }
            }
            
            if (empty($updateFields)) {
                $Conexion->rollBack();
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No hay campos para actualizar']);
                exit;
            }
            
            $query = "UPDATE t_tablaVacaciones SET " . implode(", ", $updateFields) . " WHERE IdTablaVacaciones = :IdTablaVacaciones";
            $stmt = $Conexion->prepare($query);
            
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $tabla = 't_tablaVacaciones';
                $folioMovimiento = $IdTablaVacaciones;
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
                    'message' => 'TablaVacaciones modificado',
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se realizaron cambios o no se encontró el TablaVacaciones']);
            }
            break;

        case "GET":
            if (!isset($_GET['IdTablaVacaciones'])) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }

            $query = "SELECT * FROM t_tablaVacaciones WHERE IdTablaVacaciones = :IdTablaVacaciones";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdTablaVacaciones", $_GET['IdTablaVacaciones']);
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
            $IdTablaVacaciones = isset($_GET['IdTablaVacaciones']) ? (int)$_GET['IdTablaVacaciones'] : null;
            $IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : null;
            
            if (!$IdTablaVacaciones) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }
            
            $Conexion->beginTransaction();
            
            $queryOld = "SELECT NomTablaVacaciones FROM t_tablaVacaciones WHERE IdTablaVacaciones = :IdTablaVacaciones";
            $stmtOld = $Conexion->prepare($queryOld);
            $stmtOld->bindParam(":IdTablaVacaciones", $IdTablaVacaciones);
            $stmtOld->execute();
            $oldData = $stmtOld->fetch(PDO::FETCH_ASSOC);
            
            if (!$oldData) {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el TablaVacaciones con ID: ' . $IdTablaVacaciones]);
                exit;
            }

            $query = "DELETE FROM t_tablaVacaciones WHERE IdTablaVacaciones = :IdTablaVacaciones";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdTablaVacaciones", $IdTablaVacaciones);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                $tabla = 't_tablaVacaciones';
                $folioMovimiento = $IdTablaVacaciones;
                $fecha = date('Y-m-d H:i:s');
                $consulta = "DELETE FROM t_tablaVacaciones WHERE IdTablaVacaciones = " . $IdTablaVacaciones;
                $consulta .= " | Datos eliminados: NomTablaVacaciones = '" . addslashes($oldData['NomTablaVacaciones']) . "'";
                
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
                    'message' => 'TablaVacaciones eliminado',
                    'bitacora_id' => $Conexion->lastInsertId()
                ]);
            } else {
                $Conexion->rollBack();
                http_response_code(404); 
                echo json_encode(['status' => false, 'message' => 'No se encontró el TablaVacaciones con ID: ' . $IdTablaVacaciones]);
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