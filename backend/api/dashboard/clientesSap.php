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

           $query = "SELECT COUNT(*) as total,U_Tipo_Cliente estado  FROM OCRD WHERE U_Tipo_Cliente IS NOT NULL   GROUP BY U_Tipo_Cliente";
           $stmt = $Conexion->prepare($query);

            $stmt->execute();
            $ocrd = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

           $query = "SELECT *  FROM OCRD    WHERE U_Tipo_Cliente IS NOT NULL";
           $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $ocrdlist = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($ocrdlist)) {
                http_response_code(200); // OK
                // echo json_encode(['status' => true, 'data' => $data]);
                echo json_encode([
                    'status' => true,
                    'data' => [
                        'chart' => $ocrd,
                        'list' => $ocrdlist,
                    ]
                ]);
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