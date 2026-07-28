<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';
 
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode([
        'status' => false,
        'message' => 'Datos inválidos'
    ]);
    exit;
}
 
if (!isset($input['IdTablaVacaciones']) || empty($input['IdTablaVacaciones'])) {
    echo json_encode([
        'status' => false,
        'message' => 'El ID de la tabla de vacaciones es requerido'
    ]);
    exit;
}

if (!isset($input['Detalles']) || !is_array($input['Detalles']) || empty($input['Detalles'])) {
    echo json_encode([
        'status' => false,
        'message' => 'Debe proporcionar al menos un detalle'
    ]);
    exit;
}

$IdTablaVacaciones = (int)$input['IdTablaVacaciones'];
$detalles = $input['Detalles'];
$IdUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : null;

try { 
    $Conexion->beginTransaction();
 
    $querySelect = "SELECT IdDetalleTablaVacaciones 
                    FROM t_DetalletablaVacaciones 
                    WHERE IdTablaVacaciones = :IdTablaVacaciones";
    
    $stmtSelect = $Conexion->prepare($querySelect);
    $stmtSelect->bindParam(':IdTablaVacaciones', $IdTablaVacaciones, PDO::PARAM_INT);
    $stmtSelect->execute();
    
    $idsActuales = $stmtSelect->fetchAll(PDO::FETCH_COLUMN);
 
    $idsProcesados = [];
    $errores = [];

    foreach ($detalles as $detalle) {  
        if (!isset($detalle['Antiguedad']) || !isset($detalle['Dias'])) {
            $errores[] = 'Cada detalle debe tener Antiguedad y Dias';
            continue;
        }

        $antiguedad = (int)$detalle['Antiguedad'];
        $dias = (int)$detalle['Dias'];

        if ($antiguedad < 0 || $dias < 0) {
            $errores[] = "La antigüedad y los días no pueden ser negativos (Antiguedad: $antiguedad, Dias: $dias)";
            continue;
        }
 
        $antiguedades = array_column($detalles, 'Antiguedad');
        if (count(array_unique($antiguedades)) !== count($antiguedades)) {
            $errores[] = 'No puede haber antigüedades duplicadas';
            continue;
        }
 
        if (isset($detalle['IdDetalleTablaVacaciones']) && 
            !empty($detalle['IdDetalleTablaVacaciones']) && 
            !str_starts_with($detalle['IdDetalleTablaVacaciones'], 'temp_')) {
             
            $IdDetalle = (int)$detalle['IdDetalleTablaVacaciones'];
            
            $queryUpdate = "UPDATE t_DetalletablaVacaciones 
                            SET Antiguedad = :antiguedad, 
                                Dias = :dias 
                            WHERE IdDetalleTablaVacaciones = :IdDetalle 
                            AND IdTablaVacaciones = :IdTablaVacaciones";
            
            $stmtUpdate = $Conexion->prepare($queryUpdate);
            $stmtUpdate->bindParam(':antiguedad', $antiguedad, PDO::PARAM_INT);
            $stmtUpdate->bindParam(':dias', $dias, PDO::PARAM_INT);
            $stmtUpdate->bindParam(':IdDetalle', $IdDetalle, PDO::PARAM_INT);
            $stmtUpdate->bindParam(':IdTablaVacaciones', $IdTablaVacaciones, PDO::PARAM_INT);
            
            if ($stmtUpdate->execute()) {
                $idsProcesados[] = $IdDetalle;
            } else {
                $errores[] = "Error al actualizar detalle ID: $IdDetalle";
            }
            
        } else { 
            $queryInsert = "INSERT INTO t_DetalletablaVacaciones 
                            (IdTablaVacaciones, Antiguedad, Dias) 
                            VALUES 
                            (:IdTablaVacaciones, :antiguedad, :dias)";
            
            $stmtInsert = $Conexion->prepare($queryInsert);
            $stmtInsert->bindParam(':IdTablaVacaciones', $IdTablaVacaciones, PDO::PARAM_INT);
            $stmtInsert->bindParam(':antiguedad', $antiguedad, PDO::PARAM_INT);
            $stmtInsert->bindParam(':dias', $dias, PDO::PARAM_INT);
            
            if ($stmtInsert->execute()) {
                $idsProcesados[] = $Conexion->lastInsertId();
            } else {
                $errores[] = "Error al insertar nuevo detalle (Antiguedad: $antiguedad, Dias: $dias)";
            }
        }
    }
 
    if (!empty($errores)) {
        $Conexion->rollBack();
        echo json_encode([
            'status' => false,
            'message' => 'Errores al procesar detalles',
            'errors' => $errores
        ]);
        exit;
    }
 
    $idsAEliminar = array_diff($idsActuales, $idsProcesados);
    
    if (!empty($idsAEliminar)) {
        $placeholders = implode(',', array_fill(0, count($idsAEliminar), '?'));
        $queryDelete = "DELETE FROM t_DetalletablaVacaciones 
                        WHERE IdDetalleTablaVacaciones IN ($placeholders) 
                        AND IdTablaVacaciones = ?";
        
        $stmtDelete = $Conexion->prepare($queryDelete);
        $params = array_merge($idsAEliminar, [$IdTablaVacaciones]);
         
        foreach ($params as $index => $param) {
            $stmtDelete->bindValue($index + 1, $param, PDO::PARAM_INT);
        }
        
        $stmtDelete->execute();
    }
 
    if ($IdUsuario) {
        try { 
            $checkTable = "SHOW TABLES LIKE 't_Bitacora'";
            $stmtCheck = $Conexion->prepare($checkTable);
            $stmtCheck->execute();
            
            if ($stmtCheck->rowCount() > 0) {
                $queryBitacora = "INSERT INTO t_Bitacora 
                                  (IdUsuario, Accion, Tabla, RegistroId, Fecha) 
                                  VALUES 
                                  (:IdUsuario, 'ACTUALIZAR_DETALLES', 't_DetalletablaVacaciones', :RegistroId, NOW())";
                
                $stmtBitacora = $Conexion->prepare($queryBitacora);
                $stmtBitacora->bindParam(':IdUsuario', $IdUsuario, PDO::PARAM_INT);
                $stmtBitacora->bindParam(':RegistroId', $IdTablaVacaciones, PDO::PARAM_INT);
                $stmtBitacora->execute();
            }
        } catch (Exception $e) {  
            error_log("Error al registrar en bitácora: " . $e->getMessage());        }
    }
 
    $Conexion->commit();
 
    $queryGetUpdated = "SELECT IdDetalleTablaVacaciones, IdTablaVacaciones, Antiguedad, Dias 
                        FROM t_DetalletablaVacaciones 
                        WHERE IdTablaVacaciones = :IdTablaVacaciones 
                        ORDER BY Antiguedad ASC";
    
    $stmtGetUpdated = $Conexion->prepare($queryGetUpdated);
    $stmtGetUpdated->bindParam(':IdTablaVacaciones', $IdTablaVacaciones, PDO::PARAM_INT);
    $stmtGetUpdated->execute();
    
    $detallesActualizados = $stmtGetUpdated->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => true,
        'message' => 'Detalles actualizados correctamente',
        'data' => [
            'detalles' => $detallesActualizados,
            'estadisticas' => [
                'insertados' => count(array_diff($idsProcesados, $idsActuales)),
                'actualizados' => count(array_intersect($idsProcesados, $idsActuales)),
                'eliminados' => count($idsAEliminar)
            ]
        ]
    ]);

} catch (Exception $e) { 
    if ($Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    echo json_encode([
        'status' => false,
        'message' => 'Error al actualizar detalles: ' . $e->getMessage()
    ]);
}
?>