<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "POST":
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->Departamento) || empty($data->Departamento)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El nombre del departamento es requerido']);
                exit;
            }

            $Departamento = strtoupper(trim($data->Departamento));
            $IdUsuario = $_GET['IdUsuario'] ?? null;

            $query = "INSERT INTO t_departamento (NomDepto) VALUES (:Departamento)";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':Departamento', $Departamento); 

            if ($stmt->execute()) {
                $IdDepartamento = $Conexion->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status' => true, 
                    'message' => 'Departamento creado correctamente',
                    'data' => ['IdDepartamento' => $IdDepartamento]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al crear departamento']);
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