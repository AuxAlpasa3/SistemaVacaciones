<?php

// Definir encabezados
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

// Conexión a base de datos
include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];


try {
    switch ($method) {
        case "GET":

           $query = "SELECT * FROM t_ubicacion";
           $stmt = $Conexion->prepare($query);

            $stmt->execute();
              $data = $stmt->fetchAll(PDO::FETCH_ASSOC);


            if (!empty($data)) {
                http_response_code(200); // OK
                echo json_encode(['status' => true, 'data' => $data]);
            } else {
                http_response_code(200); // OK
                echo json_encode(['status' => false, 'message' => 'No hay información']);
            }
            break;
        default:
            http_response_code(405); // Method Not Allowed
            echo json_encode(['status' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (\Throwable $th) {
    http_response_code(500); // Internal Server Error
    echo json_encode(['status' => false, 'message' => 'Error: ' . $th->getMessage()]);
} finally {
     $Conexion = null;
}