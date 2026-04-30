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

           $query = "SELECT DISTINCT(t1.Idpersonal) as IdPersonal, t1.NoEmpleado, Concat(t1.Nombre,' ', t1.ApPaterno,' ', t1.ApMaterno) as NombreCompleto, t1.Nombre, t1.ApPaterno, 
                    t1.ApMaterno, t1.Cargo, t1.Departamento, t1.Empresa, t1.Status, t1.IdUbicacion, t1.RutaFoto, t1.Email, t1.Contacto, t1.IdSupervisor, t1.TipoSangre, t1.FechaCreación, 
                    CASE WHEN t2.IdVehiculo IS NULL THEN 'NO' ELSE 'SI' END  as Vehiculo, t1.NSS, t1.FechaCreacion
                    From t_personal as t1 LEFT JOIN t_vehiculos as t2 on t1.IdPersonal=t2.IdAsociado";
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