<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'status' => false,
        'message' => 'Método no permitido. Solo se acepta GET'
    ]);
    exit();
}

include_once '../../db/Connection.php';

try {
    if (!isset($Conexion) || !$Conexion) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    $idPersonal = isset($_GET['IdPersonal']) ? intval($_GET['IdPersonal']) : 0;
    
    if ($idPersonal <= 0) {
        http_response_code(400);
        echo json_encode([
            'status' => false,
            'message' => 'IdPersonal es requerido y debe ser un número entero positivo'
        ]);
        exit();
    }
    
    $query = "{call dbo.sp_Vacaciones(?)}";
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmt->execute();
    
    $resultados = [];
    $totales = null;
    
    do {
        $columnCount = $stmt->columnCount();
        
        if ($columnCount > 0) {
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (isset($rows[0]['TotalGenerados'])) {
                if (!empty($rows)) {
                    $totales = [
                        'TotalGenerados' => intval($rows[0]['TotalGenerados']),
                        'TotalTomados' => intval($rows[0]['TotalTomados']),
                        'TotalDisponibles' => intval($rows[0]['TotalDisponibles']),
                        'TotalVencidos' => intval($rows[0]['TotalVencidos'])
                    ];
                }
            } else {
                foreach ($rows as $row) {
                    if (!empty($row) && isset($row['Anio']) && intval($row['Anio']) > 0) {
                        $resultados[] = [
                            'IdPersonalVacaciones' => isset($row['IdPersonalVacaciones']) ? intval($row['IdPersonalVacaciones']) : 0,
                            'IdPersonal' => isset($row['IdPersonal']) ? intval($row['IdPersonal']) : 0,
                            'Año' => isset($row['Anio']) ? intval($row['Anio']) : 0,
                            'DiasGenera' => isset($row['DiasGenera']) ? intval($row['DiasGenera']) : 0,
                            'DiasDisfrutados' => isset($row['DiasTomados']) ? intval($row['DiasTomados']) : 0,
                            'DiasRestantes' => isset($row['DiasRestantes']) ? intval($row['DiasRestantes']) : 0,
                            'DiasDisponibles' => isset($row['DiasDisponibles']) ? intval($row['DiasDisponibles']) : 0,
                            'DiasVencidos' => isset($row['DiasVencidos']) ? intval($row['DiasVencidos']) : 0,
                                 'FechaInicioPeriodo' => isset($row['FechaInicioPeriodo']) ? $row['FechaInicioPeriodo'] : null
                        ];
                    }
                }
            }
        }
    } while ($stmt->nextRowset());
    
    $stmt->closeCursor();
    
    http_response_code(200);
    echo json_encode([
        'status' => true,
        'data' => $resultados,
        'totales' => $totales,
        'total' => count($resultados)
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    
    $errorMsg = $e->getMessage();
    if (strpos($errorMsg, 'contains no fields') !== false) {
        $errorMsg = 'El procedimiento almacenado no retornó datos';
    }
    
    echo json_encode([
        'status' => false,
        'message' => 'Error de base de datos: ' . $errorMsg
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>