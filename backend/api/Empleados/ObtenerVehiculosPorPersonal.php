<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];


try {
    switch ($method) {
        case "GET":
            $NoEmpleado = $_GET['NoEmpleado'] ?? null;
            if (!$NoEmpleado) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'Falta el parámetro NoEmpleado']);
                exit;
            }


           $query = "SELECT 
                    t1.IdVehiculo, t1.Marca, t1.Modelo,t1.Num_Serie, t1.Placas, t1.Anio, t1.Color, (case when t1.Activo=1 then 'Activo' else 'Inactivo' End) as Estatus,
                    t1.RutaFoto, (case when t1.LibreUso=1 then 'VehiculoEmpresa' else 'Personal' End) as LibreUso
                    FROM t_vehiculos AS t1 
                LEFT JOIN t_personal AS t2 ON t1.IdAsociado  = t2.IdPersonal AND t1.TipoVehiculo = 1
                WHERE t2.NoEmpleado=?";
           $stmt = $Conexion->prepare($query);
            $stmt->execute([$NoEmpleado]);
            
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