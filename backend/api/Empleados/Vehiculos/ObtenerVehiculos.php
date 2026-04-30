<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];


try {
    switch ($method) {
        case "GET":
            $idAsociado = $_GET['IdPersonal'] ?? null;
            if (!$idAsociado) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'Falta el parámetro IdPersonal']);
                exit;
            }


           $query = "SELECT IdVehiculo,idAsociado, Marca,Modelo,Num_Serie,Placas,Anio,Color,Activo,RutaFoto,LibreUso,
                        TipoVehiculo FROM t_vehiculos 
                        WHERE IdAsociado=? AND TipoVehiculo=1";
           $stmt = $Conexion->prepare($query);
            $stmt->execute([$idAsociado]);
            
              $data = $stmt->fetchAll(PDO::FETCH_ASSOC);


            if (!empty($data)) {
                http_response_code(200);
                echo json_encode(['status' => true, 'data' => $data]);
            } else {
                http_response_code(200); 
                echo json_encode(['status' => false, 'message' => 'No hay información']);
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