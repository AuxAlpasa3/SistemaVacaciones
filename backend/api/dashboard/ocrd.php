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

            $status = isset($_GET['estado']) ? $_GET['estado'] : '';
            $period = isset($_GET['periodo']) ? $_GET['periodo'] : '';
            $mes = isset($_GET['mes']) ? $_GET['mes'] : '';

            $arrayMeses = explode(',', $mes);
            $stringMeses = implode(',', $arrayMeses);

            $periodo = isset($_GET['periodo']) ? " fecha LIKE '$period%'" : '';
            $estado = isset($_GET['estado']) ? " estatus = '$status'" : '';
            $meses = isset($_GET['mes']) && count($arrayMeses) ? " MONTH(fecha) IN ($stringMeses)" : '';


            $query = '';
            if ($estado !== "" && $meses !== "") {
                $query = " WHERE  $estado AND $meses";
            } else if ($periodo !== "" && $estado !== "") {
                $query = " WHERE  $estado AND $periodo";
            } else if ($periodo !== "" && $meses !== "") {
                $query = " WHERE  $meses AND $periodo";
            } else if ($estado !== "") {
                $query = " WHERE  $estado ";
            } else if ($periodo !== "") {
                $query = " WHERE  $periodo ";
            } else if ($meses !== "") {
                $query = " WHERE  $meses ";
            } else if ($periodo !== "" && $estado !== "" && $meses !== "") {
                $query = " WHERE $periodo AND $estado AND $meses";
            }

            //agrupamos los datos por fecha
           $query = "SELECT DATENAME(MONTH,fecha) AS mes, 
            SUM(CASE WHEN estatus = 'Aprobada' THEN 1 ELSE 0 END) AS aprobada,
            SUM(CASE WHEN estatus = 'Pendiente' THEN 1 ELSE 0 END) AS pendiente,
            SUM(CASE WHEN estatus = 'Rechazada' THEN 1 ELSE 0 END) AS rechazada,
            SUM(CASE WHEN estatus = 'Rechazada por ALPASA' THEN 1 ELSE 0 END) AS rechazado_por_alpasa
            FROM recursos_OCRD  " . $query . "  GROUP BY DATENAME(MONTH,fecha)";

           $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $chart = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

            //agrupamos los datos por fecha
           $query = "SELECT 
        r.num_cotizacion, o.CardName,r.estatus,
        CASE 
        WHEN COALESCE(r.CardCode,'') = ''  THEN 'CLIENTE PROSPECTO' 
        ELSE 'CLIENTE HISTORICO' 
        END AS cliente
        FROM recursos_OCRD r  
        LEFT JOIN OCRD  o ON o.CardCode = r.CardCode " . $query;

           $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $list = $conexion->pps->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($list)) {
                http_response_code(200); // OK
                echo json_encode([
                    'status' => true,
                    'data' => [
                        'chart' => $chart,
                        'list' => $list,
                    ]
                ]);
            } else {
                http_response_code(200); // OK
                echo json_encode(['status' => false, 'message' => 'No hay información', 'data' => []]);
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