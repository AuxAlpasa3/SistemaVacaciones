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
                        t1.IdPersonal, t1.NoEmpleado, CONCAT(t1.nombre, ' ', t1.ApPaterno, ' ', t1.ApMaterno) AS NombreCompleto,
                        t3.NomCargo, t4.NomDepto, t5.NomEmpresa, CASE WHEN t1.status = 1 THEN 'Activo' ELSE 'Inactivo' END AS Status,
                        t6.NomLargo, t1.RutaFoto AS RutaFotoEmpleado, t1.Email, t1.Contacto, t7.Supervisor,t1.TipoSangre,t1.NSS
                    FROM t_personal AS t1 
                    LEFT JOIN t_vehiculos AS t2 ON t1.IdPersonal = t2.IdAsociado AND t2.TipoVehiculo = 1
                    LEFT JOIN t_cargo AS t3 ON t1.Cargo = t3.IdCargo
                    LEFT JOIN t_departamento AS t4 ON t1.Departamento = t4.IdDepartamento
                    LEFT JOIN t_empresa AS t5 ON t1.Empresa = t5.IdEmpresa
                    LEFT JOIN t_ubicacion AS t6 ON t1.IdUbicacion = t6.IdUbicacion 
                    LEFT JOIN (
                        SELECT 
                            IdPersonal,
                            CONCAT(nombre, ' ', ApPaterno, ' ', ApMaterno) AS Supervisor
                        FROM t_personal
                    ) AS t7 ON t7.IdPersonal = t1.IdPersonal
                    WHERE t1.NoEmpleado=?";
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