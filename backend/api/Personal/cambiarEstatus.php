<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "PUT":
            parse_str(file_get_contents("php://input"), $putData);
            
            if (!isset($putData['IdPersonal']) || empty($putData['IdPersonal'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El ID del personal es requerido']);
                exit;
            }

            if (!isset($putData['Status']) || empty($putData['Status'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El estatus es requerido']);
                exit;
            }

            $IdPersonal = $putData['IdPersonal'];
            $Status = $putData['Status'];
            $IdUsuario = $putData['IdUsuario'] ?? null;

            $query = "UPDATE t_personal SET Status = :Status WHERE IdPersonal = :IdPersonal";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':Status', $Status);
            $stmt->bindParam(':IdPersonal', $IdPersonal);

            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'status' => true, 
                    'message' => 'Estatus actualizado correctamente'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al cambiar estatus']);
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
    $Conexion = null;
}
?>