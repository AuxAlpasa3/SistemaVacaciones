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
            $query = "SELECT 
                        t1.Idpersonal as IdPersonal, 
                        t1.NoEmpleado, 
                        CONCAT(t1.Nombre, ' ', t1.ApPaterno, ' ', t1.ApMaterno) as NombreCompleto, 
                        t1.Nombre, 
                        t1.ApPaterno, 
                        t1.ApMaterno, 
                        t1.Cargo, 
                        t1.Departamento, 
                        t1.Empresa, 
                        t1.Status, 
                        t1.IdUbicacion, 
                        t1.RutaFoto, 
                        t1.Email, 
                        t1.Contacto, 
                        t1.IdJefeInmediato, 
                        t1.TipoSangre, 
                        t1.FechaCreacion, 
                        t1.NSS, 
                        CASE WHEN t1.EsJefeInmediato <> 1 THEN 'NO' ELSE 'SI' END as EsJefeInmediato,
                        t1.FechaIngreso,
                        t1.Alergias,
                        t1.Turno,
                        t1.FechadeNacimiento,
                        t1.Direccion,
                        t1.CURP,
                        t1.RFC,
                        t1.NivelJerarquico
                    FROM t_personal as t1  
                    ORDER BY t1.NoEmpleado";
                    
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            
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
?>