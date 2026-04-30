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

            if (isset($_GET['solicitudes']) && $_GET['solicitudes'] == true) {
                $query = $_GET['rol'] != 3 ? " WHERE nombre_cliente = '" . $_GET['agencia'] . "' " : "";

                //agrupamos los datos por fecha
               $query = "SELECT DATENAME(MONTH,fecha) AS mes, 
            SUM(CASE WHEN estado = 'Pendiente' THEN 1 ELSE 0 END) AS pendiente,
            SUM(CASE WHEN estado = 'Rechazado' THEN 1 ELSE 0 END) AS rechazado,
            SUM(CASE WHEN estado = 'Aprobado' THEN 1 ELSE 0 END) AS aprobado
            FROM solicitud  " . $query . "  GROUP BY DATENAME(MONTH,fecha)";

               $stmt = $Conexion->prepare($query);
                $stmt->execute();
                $oqut = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

                // Transformar los resultados en el formato deseado
                $resultados = [];
                foreach ($oqut as $row) {
                    $resultado = [
                        'mes' => $row['mes'],
                        'pendiente' => intval($row['pendiente']),
                        'rechazado' => intval($row['rechazado']),
                        'aprobado' => intval($row['aprobado'])
                    ];
                    $resultados[] = $resultado;
                }
                echo json_encode($oqut);
            } else {
                $query = $_GET['rol'] == 2 || $_GET['rol'] == 3 ? " WHERE CardName = '" . $_GET['agencia'] . "' " : "";
                $pendiente = $_GET['rol'] == 2 || $_GET['rol'] == 3 ? "  ,SUM(CASE WHEN U_ESTATUS = 'Pendiente' THEN 1 ELSE 0 END) AS pendiente " : " ";

                //agrupamos los datos por fecha
               $query = "SELECT DATENAME(MONTH,U_CREATE) AS mes, 
            SUM(CASE WHEN U_ESTATUS = 'Abierto' THEN 1 ELSE 0 END) AS abierto,
            SUM(CASE WHEN U_ESTATUS = 'Rechazado' THEN 1 ELSE 0 END) AS rechazado,
            SUM(CASE WHEN U_ESTATUS = 'Aprobado' THEN 1 ELSE 0 END) AS aprobado
            " . $pendiente . "
            FROM OQUT  " . $query . "  GROUP BY DATENAME(MONTH,U_CREATE)";

               $stmt = $Conexion->prepare($query);
                $stmt->execute();
                $oqut = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

                // Transformar los resultados en el formato deseado
                $resultados = [];
                foreach ($oqut as $row) {
                    $resultado = [
                        'mes' => $row['mes'],
                        'abierto' => intval($row['abierto']),
                        'rechazado' => intval($row['rechazado']),
                        'aprobado' => intval($row['aprobado'])
                    ];
                    $resultados[] = $resultado;
                }
                echo json_encode($oqut);
            }

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