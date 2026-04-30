<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];
try {
    switch ($method) {
        case "GET":
            $fechaActual = date('Y-m-d');
            $mesActual = date('Y-m-01');
            $mesSiguiente = date('Y-m-01', strtotime('+1 month'));
            $lunesSemana = date('Y-m-d', strtotime('monday this week'));
            $lunesProxima = date('Y-m-d', strtotime('monday next week'));
            
            $respuesta = [];
            
            $sql1 = "SELECT t1.*, t1.Cliente as ClienteNombre 
                    FROM t_boleta_Enc t1 
                    WHERE t1.Estatus = 0 
                    AND CONVERT(date, t1.FechaCita) = ?";
            $stmt1 = $Conexion->prepare($sql1);
            $stmt1->execute([$fechaActual]);
            $result1 = $stmt1->fetchAll(PDO::FETCH_ASSOC);
            
            $detalles1 = [];
            $contador1 = 0;
            foreach ($result1 as $row) {
                if ($contador1 >= 5) break;
                $detalles1[] = [
                    'id' => $row['IdBoletas'] ?? 0,
                    'folio' => $row['Folio'] ?? 'N/A',
                    'cliente' => $row['ClienteNombre'] ?? 'Cliente',
                    'fecha' => $row['FechaCita'] ?? date('Y-m-d'),
                    'estatus' => $row['Estatus'] ?? '0',
                    'peso' => isset($row['PesoNeto']) ? (float)$row['PesoNeto'] : null
                ];
                $contador1++;
            }
            $respuesta['pendientesHoy'] = [
                'count' => count($result1),
                'detalles' => $detalles1
            ];
            
            // 2. Boletas Pendientes de Envío
            $sql2 = "SELECT t1.*, t1.Cliente as ClienteNombre 
                    FROM t_boleta_Enc t1 
                    WHERE t1.Estatus = 0 
                    AND t1.Envio = 0 
                    AND tipoOperacion= 2
                    AND t1.Cliente like '%MEXICHEM%'
                    AND CONVERT(date, t1.FechaCita) = ?";
            $stmt2 = $Conexion->prepare($sql2);
            $stmt2->execute([$fechaActual]);
            $result2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
            
            $detalles2 = [];
            $contador2 = 0;
            foreach ($result2 as $row) {
                if ($contador2 >= 5) break;
                $detalles2[] = [
                    'id' => $row['IdBoletas'] ?? 0,
                    'folio' => $row['Folio'] ?? 'N/A',
                    'cliente' => $row['ClienteNombre'] ?? 'Cliente',
                    'fecha' => $row['FechaCita'] ?? date('Y-m-d'),
                    'estatus' => $row['Estatus'] ?? '0',
                    'peso' => isset($row['PesoNeto']) ? (float)$row['PesoNeto'] : null
                ];
                $contador2++;
            }
            $respuesta['pendientesEnvio'] = [
                'count' => count($result2),
                'detalles' => $detalles2
            ];
            
            // 3. Boletas Enviados hoy
            $sql3 = "SELECT t1.*, t1.Cliente as ClienteNombre 
                    FROM t_boleta_Enc t1 
                    WHERE t1.Estatus = 0 
                    AND t1.Envio = 3 
                    AND tipoOperacion= 2
                    AND t1.Cliente like '%MEXICHEM%'
                    AND CONVERT(date, t1.FechaCita) = ?";
            $stmt3 = $Conexion->prepare($sql3);
            $stmt3->execute([$fechaActual]);
            $result3 = $stmt3->fetchAll(PDO::FETCH_ASSOC);
            
            $detalles3 = [];
            $contador3 = 0;
            foreach ($result3 as $row) {
                if ($contador3 >= 5) break;
                $detalles3[] = [
                    'id' => $row['IdBoletas'] ?? 0,
                    'folio' => $row['Folio'] ?? 'N/A',
                    'cliente' => $row['ClienteNombre'] ?? 'Cliente',
                    'fecha' => $row['FechaCita'] ?? date('Y-m-d'),
                    'estatus' => $row['Estatus'] ?? '0',
                    'peso' => isset($row['PesoNeto']) ? (float)$row['PesoNeto'] : null
                ];
                $contador3++;
            }
            $respuesta['enviadosHoy'] = [
                'count' => count($result3),
                'detalles' => $detalles3
            ];
            
            // 4. Recibidas en este mes
            $sql4 = "SELECT COUNT(*) as total 
                    FROM t_boleta_Enc 
                    WHERE Estatus = 7 
                    AND FechaCita >= ? 
                    AND FechaCita < ?";
            $stmt4 = $Conexion->prepare($sql4);
            $stmt4->execute([$mesActual, $mesSiguiente]);
            $result4 = $stmt4->fetch(PDO::FETCH_ASSOC);
            
            $respuesta['recibidosMes'] = [
                'count' => $result4['total'] ?? 0,
                'detalles' => []
            ];
            
            // 5. Enviados esta semana
            $sql5 = "SELECT COUNT(*) as total 
                    FROM t_boleta_Enc 
                    WHERE Estatus = 7 
                    AND Envio = 3 
                    AND tipoOperacion= 2
                    AND Cliente like '%MEXICHEM%'
                    AND FechaCita >= ? 
                    AND FechaCita < ?";
            $stmt5 = $Conexion->prepare($sql5);
            $stmt5->execute([$lunesSemana, $lunesProxima]);
            $result5 = $stmt5->fetch(PDO::FETCH_ASSOC);
            
            $respuesta['enviadosSemana'] = [
                'count' => $result5['total'] ?? 0,
                'detalles' => []
            ];
            
            // 6. Enviados este mes
            $sql6 = "SELECT COUNT(*) as total 
                    FROM t_boleta_Enc 
                    WHERE Estatus = 7 
                    AND Envio = 3 
                    AND tipoOperacion= 2
                    AND Cliente like '%MEXICHEM%'
                    AND FechaCita >= ? 
                    AND FechaCita < ?";
            $stmt6 = $Conexion->prepare($sql6);
            $stmt6->execute([$mesActual, $mesSiguiente]);
            $result6 = $stmt6->fetch(PDO::FETCH_ASSOC);
            
            $respuesta['enviadosMes'] = [
                'count' => $result6['total'] ?? 0,
                'detalles' => []
            ];
            
            if (!empty($respuesta)) {
                http_response_code(200); // OK
                echo json_encode(['status' => true, 'data' => $respuesta]);
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
?>