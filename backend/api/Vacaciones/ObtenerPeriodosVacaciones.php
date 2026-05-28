<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

$idPersonal = isset($_GET['IdPersonal']) ? (int)$_GET['IdPersonal'] : 0;

if (!$idPersonal) {
    echo json_encode(['status' => false, 'message' => 'IdPersonal no proporcionado', 'data' => []]);
    exit;
}

try {
    $sql = "{call sp_Vacaciones(?)}";
    $stmt = $Conexion->prepare($sql);
    $stmt->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmt->execute();
    
    $periodos = [];
    $totales = [];
    $conjuntoActual = 0;
    
    do {
        $resultados = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $conjuntoActual++;
        
        if ($resultados && count($resultados) > 0) {
            // El primer conjunto contiene los períodos (tiene la columna Periodo)
            if ($conjuntoActual == 1 && isset($resultados[0]['Periodo'])) {
                foreach ($resultados as $row) {
                    $periodos[] = [
                        'IdPersonalVacaciones' => isset($row['IdPersonalVacaciones']) ? (int)$row['IdPersonalVacaciones'] : 0,
                        'IdPersonal' => isset($row['IdPersonal']) ? (int)$row['IdPersonal'] : $idPersonal,
                        'Anio' => isset($row['Anio']) ? (int)$row['Anio'] : 0,
                        'Periodo' => isset($row['Periodo']) ? (int)$row['Periodo'] : 0,
                        'FechaInicioPeriodo' => isset($row['FechaInicioPeriodo']) ? $row['FechaInicioPeriodo'] : null,
                        'FechaFinPeriodo' => isset($row['FechaFinPeriodo']) ? $row['FechaFinPeriodo'] : null,
                        'FechaMitadPeriodo' => isset($row['FechaMitadPeriodo']) ? $row['FechaMitadPeriodo'] : null,
                        'DiasGenera' => isset($row['DiasGenera']) ? (int)$row['DiasGenera'] : 0,
                        'DiasTomados' => isset($row['DiasTomados']) ? (int)$row['DiasTomados'] : 0,
                        'DiasRestantes' => isset($row['DiasRestantes']) ? (int)$row['DiasRestantes'] : 0,
                        'DiasDisponibles' => isset($row['DiasDisponibles']) ? (int)$row['DiasDisponibles'] : 0,
                        'DiasVencidos' => isset($row['DiasVencidos']) ? (int)$row['DiasVencidos'] : 0,
                        'EstadoPeriodo' => isset($row['EstadoPeriodo']) ? $row['EstadoPeriodo'] : '',
                        'Motivo' => isset($row['Motivo']) ? $row['Motivo'] : ''
                    ];
                }
            } 
            // El segundo conjunto contiene los totales (tiene la columna TotalGenerados)
            elseif ($conjuntoActual == 2 && isset($resultados[0]['TotalGenerados'])) {
                $totales = $resultados[0];
            }
        }
    } while ($stmt->nextRowset());
    
    $stmt->closeCursor();
    
    // Ordenar períodos por período (año de antigüedad)
    usort($periodos, function($a, $b) {
        return $a['Periodo'] - $b['Periodo'];
    });
    
    // Transformar al formato que espera el frontend
    $periodosTransformados = array_map(function($periodo) {
        return [
            'Año' => $periodo['Anio'],
            'AñosAntiguedad' => $periodo['Periodo'],
            'DiasGenera' => $periodo['DiasGenera'],
            'DiasDisfrutados' => $periodo['DiasTomados'],
            'DiasDisponibles' => $periodo['DiasDisponibles'],
            'DiasVencidos' => $periodo['DiasVencidos'],
            'DiasRestantes' => $periodo['DiasRestantes'],
            'EstadoPeriodo' => $periodo['EstadoPeriodo'],
            'Motivo' => $periodo['Motivo'],
            'FechaInicioPeriodo' => $periodo['FechaInicioPeriodo'],
            'FechaFinPeriodo' => $periodo['FechaFinPeriodo'],
            'FechaMitadPeriodo' => $periodo['FechaMitadPeriodo']
        ];
    }, $periodos);
    
    // 🔴 MODIFICADO: SOLO mostrar períodos con días disponibles (DiasDisponibles > 0)
    $periodosFiltrados = array_filter($periodosTransformados, function($p) {
        return $p['DiasDisponibles'] > 0;
    });
    
    echo json_encode([
        'status' => true,
        'data' => array_values($periodosFiltrados),
        'totales' => [
            'totalGenerados' => isset($totales['TotalGenerados']) ? (int)$totales['TotalGenerados'] : 0,
            'totalTomados' => isset($totales['TotalTomados']) ? (int)$totales['TotalTomados'] : 0,
            'totalDisponibles' => isset($totales['TotalDisponibles']) ? (int)$totales['TotalDisponibles'] : 0,
            'totalVencidos' => isset($totales['TotalVencidos']) ? (int)$totales['TotalVencidos'] : 0
        ],
        'message' => 'Períodos obtenidos correctamente'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error al ejecutar SP: ' . $e->getMessage(),
        'data' => []
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'data' => []
    ]);
}
?>