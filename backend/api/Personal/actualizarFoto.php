<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "POST":
            if (!isset($_POST['IdPersonal']) || empty($_POST['IdPersonal'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El ID del personal es requerido']);
                exit;
            }

            if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Error al subir la foto']);
                exit;
            }

            $IdPersonal = $_POST['IdPersonal'];
            $nombreArchivo = $_POST['nombreArchivo'] ?? '';

            $uploadDir = '../../api/Personal/Fotografias/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $filePath = $uploadDir . $nombreArchivo;
            $rutaRelativa = 'Personal/Fotografias/' . $nombreArchivo;

            if (move_uploaded_file($_FILES['foto']['tmp_name'], $filePath)) {
                $query = "UPDATE t_personal SET RutaFoto = :RutaFoto WHERE IdPersonal = :IdPersonal";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':RutaFoto', $rutaRelativa);
                $stmt->bindParam(':IdPersonal', $IdPersonal);

                if ($stmt->execute()) {
                    http_response_code(200);
                    echo json_encode([
                        'status' => true, 
                        'message' => 'Foto actualizada correctamente',
                        'data' => ['ruta' => $rutaRelativa]
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode(['status' => false, 'message' => 'Error al actualizar la ruta de la foto']);
                }
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al mover la foto']);
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