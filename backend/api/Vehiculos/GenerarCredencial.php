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

            $data = json_decode(file_get_contents("php://input"));

            if (!isset($data->IdPersonal)) {

                http_response_code(200);
                echo json_encode([
                    'status' => false,
                    'message' => 'IdPersonal es requerido'
                ]);
                break;
            }

            $query = "SELECT 
                        t1.IdPersonal,
                        t1.NoEmpleado,
                        CONCAT(t1.Nombre,' ', t1.ApPaterno,' ', t1.ApMaterno) AS NombreCompleto,
                        t1.RutaFoto,
                        t1.Status
                      FROM t_personal t1
                      WHERE t1.IdPersonal = :IdPersonal";

            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(":IdPersonal", $data->IdPersonal, PDO::PARAM_INT);
            $stmt->execute();

            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {

                if ($row['Status'] !== 'ACTIVO') {

                    http_response_code(200);
                    echo json_encode([
                        'status' => false,
                        'message' => 'El empleado no está activo'
                    ]);
                    break;
                }

                $codigoQR = "01_" . $row['NoEmpleado'];

                http_response_code(200);
                echo json_encode([
                    'status' => true,
                    'data' => [
                        "IdPersonal" => $row['IdPersonal'],
                        "NombreCompleto" => $row['NombreCompleto'],
                        "NoEmpleado" => $row['NoEmpleado'],
                        "RutaFoto" => $row['RutaFoto'],
                        "CodigoQR" => $codigoQR,
                        "Status" => $row['Status']
                    ]
                ]);

            } else {

                http_response_code(200);
                echo json_encode([
                    'status' => false,
                    'message' => 'Empleado no encontrado'
                ]);
            }

            break;

        default:
            http_response_code(405);
            echo json_encode([
                'status' => false,
                'message' => 'Método no permitido'
            ]);
            break;
    }

} catch (\Throwable $th) {

    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $th->getMessage()
    ]);

} finally {
    $Conexion = null;
}