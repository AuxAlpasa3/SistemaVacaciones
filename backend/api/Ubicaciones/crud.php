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
             $Ubicacion= $_POST['Ubicacion'];
            if (!isset($Ubicacion)) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => false, 'message' => 'Datos incompletos']);
                exit;
            }
            

           $query = "INSERT INTO t_ubicacion(Ubicacion)
             values(:Ubicacion)";

           $stmt = $Conexion->prepare($query);

            $fecha = date('Y-m-d');
           $stmt->bindParam(":Ubicacion",$Ubicacion);

            if ($stmt->execute()) {
                http_response_code(201); // Created
                echo json_encode(['status' => true, 'message' => 'Ubicación registrado']);
            } else {
                http_response_code(500); // Internal Server Error
                echo json_encode(['status' => false, 'message' => 'Error al registrar Ubicación']);
            }
            break;

        case "PUT":
            if (!isset($_GET['IdUbicacion'])) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
                }
                
                $data = json_decode(file_get_contents("php://input"),true);
                $IdUbicacion  = $_GET['IdUbicacion'];
                $Ubicacion = $data['Ubicacion'];

            $query = "UPDATE t_ubicacion SET Ubicacion = :Ubicacion WHERE IdUbicacion = :IdUbicacion";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdUbicacion",$IdUbicacion);
            $stmt->bindParam(":Ubicacion",$Ubicacion);

            $stmt->execute();

            if ( $stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(['status' => true, 'message' => 'Ubicación modificado']);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(['status' => false, 'message' => 'No se encontró la Ubicación con ID: ' . $_GET['IdUbicacion']]);
            }
            break;

        case "GET":
            if (!isset($_GET['IdUbicacion'])) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }

           $query = "SELECT * FROM t_ubicacion WHERE IdUbicacion = :IdUbicacion";
           $stmt = $Conexion->prepare($query);
           $stmt->bindParam(":IdUbicacion", $_GET['IdUbicacion']);

            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($data) {
                http_response_code(200); // OK
                echo json_encode(['status' => true, 'data' => $data]);
            } else {
                http_response_code(200); // OK
                echo json_encode(['status' => false, 'message' => 'No hay información']);
            }
            break;

        case "DELETE":
            if (!isset($_GET['IdUbicacion'])) {
                http_response_code(400); // Bad Request
                echo json_encode(['status' => false, 'message' => 'ID no proporcionado']);
                exit;
            }

           $query = "DELETE FROM t_ubicacion WHERE IdUbicacion = :IdUbicacion";
           $stmt = $Conexion->prepare($query);
           $stmt->bindParam(":IdUbicacion", $_GET['IdUbicacion']);

            $stmt->execute();

            if ( $stmt->rowCount() > 0) {
                http_response_code(200); // OK
                echo json_encode(['status' => true, 'message' => 'Ubicación eliminado']);
            } else {
                http_response_code(404); // Not Found
                echo json_encode(['status' => false, 'message' => 'No se encontró la Ubicación con ID: ' . $_GET['IdUbicacion']]);
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