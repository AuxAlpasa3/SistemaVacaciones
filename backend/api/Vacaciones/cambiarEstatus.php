<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include_once '../../db/Connection.php';
require_once '../Includes/VacacionesService.php';
 
define('ESTATUS_SOLICITUD', 0);
define('ESTATUS_AUTORIZADA', 1);
define('ESTATUS_VALIDADA', 2);
define('ESTATUS_CANCELADA', 3);
define('ESTATUS_ENREVISION', 4);
 
const ESTATUS_MENSAJES = [
    ESTATUS_SOLICITUD => 'Solicitada',
    ESTATUS_AUTORIZADA => 'Autorizada',
   ESTATUS_VALIDADA => 'Validada',
    ESTATUS_CANCELADA => 'Cancelada',
    ESTATUS_ENREVISION => 'En Revisión'
];

try { 
    if (!$Conexion instanceof PDO) {
        throw new Exception('La conexión no es una instancia de PDO');
    }
    
    $service = new VacacionesService($Conexion);
     
    $idVacaciones = filter_input(INPUT_GET, 'IdVacaciones', FILTER_VALIDATE_INT);
    $nuevoEstatus = filter_input(INPUT_GET, 'Estatus', FILTER_VALIDATE_INT);
    $idUsuario = filter_input(INPUT_GET, 'IdUsuario', FILTER_VALIDATE_INT);
     
    if (!$idVacaciones || $idVacaciones <= 0) {
        throw new Exception('IdVacaciones inválido o no proporcionado');
    }
    
    if ($nuevoEstatus === null || $nuevoEstatus === false) {
        throw new Exception('Estatus no proporcionado');
    }
     
    if (!$idUsuario || $idUsuario <= 0) {
        throw new Exception('IdUsuario inválido o no proporcionado');
    }
     
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
    }
     
    $comentarios = isset($input['Comentarios']) ? trim($input['Comentarios']) : null;
    $usuarioAutoriza = isset($input['UsuarioAutoriza']) ? (int)$input['UsuarioAutoriza'] : null;
    $fechaAutoriza = isset($input['FechaAutoriza']) ? $input['FechaAutoriza'] : date('Y-m-d H:i:s');
    $motivoCancelacion = isset($input['MotivoCancelacion']) ? trim($input['MotivoCancelacion']) : null;
     
    $sqlCheck = "SELECT 
                    IdVacaciones, 
                    Estatus, 
                    IdPersonal,
                    FechaSolicitud,
                    FechaInicio,
                    FechaFin,
                    ISNULL(UsuarioAutoriza, 0) as UsuarioAutoriza
                 FROM t_vacaciones 
                 WHERE IdVacaciones = ?";
    
    $stmtCheck = $Conexion->prepare($sqlCheck);
    if (!$stmtCheck) {
        throw new Exception('Error al preparar consulta de verificación');
    }
    
    $stmtCheck->execute([$idVacaciones]);
    $vacacionData = $stmtCheck->fetch(PDO::FETCH_ASSOC);
    
    if (!$vacacionData) {
        throw new Exception('Solicitud de vacaciones no encontrada');
    }
    
    $currentStatus = (int)$vacacionData['Estatus'];
    $idPersonal = (int)$vacacionData['IdPersonal'];
     
    $validTransitions = [
        ESTATUS_SOLICITUD => [ESTATUS_AUTORIZADA, ESTATUS_VALIDADA, ESTATUS_CANCELADA, ESTATUS_ENREVISION],
        ESTATUS_AUTORIZADA => [ESTATUS_VALIDADA, ESTATUS_CANCELADA, ESTATUS_ENREVISION],
        ESTATUS_VALIDADA => [ESTATUS_ENREVISION],
        ESTATUS_CANCELADA => [],
        ESTATUS_ENREVISION => [ESTATUS_AUTORIZADA, ESTATUS_CANCELADA]
    ];
    
    if (!in_array($nuevoEstatus, $validTransitions[$currentStatus])) {
        throw new Exception("Transición de estado no permitida de " . 
                           ESTATUS_MENSAJES[$currentStatus] . " a " . 
                           ESTATUS_MENSAJES[$nuevoEstatus]);
    }
     
    $tienePermisos = verificarPermisos($Conexion, $idUsuario, $idPersonal, $nuevoEstatus);
    if (!$tienePermisos) {
        throw new Exception('No tiene permisos para realizar esta acción');
    }
     
    $Conexion->beginTransaction();
    
    try {  
        $updateFields = ["Estatus = ?"];
        $params = [$nuevoEstatus];
        $updateLog = [];
          
        switch ($nuevoEstatus) {
            case ESTATUS_AUTORIZADA: 
                if (!$usuarioAutoriza) {
                    throw new Exception('UsuarioAutoriza es requerido para autorización');
                }
                 
                if (!usuarioExiste($Conexion, $usuarioAutoriza)) {
                    throw new Exception('UsuarioAutoriza no existe en el sistema');
                }
                
                $updateFields[] = "UsuarioAutoriza = ?";
                $updateFields[] = "FechaAutoriza = GETDATE()";
                $params[] = $usuarioAutoriza;
                 
                $updateFields[] = "EmailAvisoCancelacion = 0";
                
                $updateLog[] = "Autorizada por usuario ID: {$usuarioAutoriza}";
                break;
                
            case ESTATUS_VALIDADA: 
                if ($currentStatus != ESTATUS_AUTORIZADA && $currentStatus != ESTATUS_ENREVISION) {
                    throw new Exception('La solicitud debe estar autorizada o en revisión antes de ser validada');
                }
                
                $updateFields[] = "UsuarioValida = ?";
                $updateFields[] = "FechaValidado = GETDATE()";
                $params[] = $idUsuario;
                 
                $anioActual = date('Y');
                $updateFields[] = "Anio = ?";
                $params[] = $anioActual;
                 
                $diasCorresponden = calcularDiasCorresponden($Conexion, $idPersonal);
                $updateFields[] = "DiasCorresponden = ?";
                $params[] = $diasCorresponden;
                 
                $saldoDias = recalcularSaldoDias($Conexion, $idPersonal, $vacacionData['FechaInicio'], $vacacionData['FechaFin']);
                $updateFields[] = "SaldoDias = ?";
                $params[] = $saldoDias;
                
                $updateLog[] = "Validada por usuario ID: {$idUsuario}";
                break;
                
            case ESTATUS_CANCELADA: 
                if (empty($motivoCancelacion)) {
                    throw new Exception('Motivo de cancelación es requerido');
                }
                
                $updateFields[] = "Comentarios = CONCAT(ISNULL(Comentarios, ''), ' | Cancelación: ', ?)";
                $params[] = $motivoCancelacion;
                
                $updateFields[] = "EmailAvisoCancelacion = 1";
                
                $updateLog[] = "Cancelada por usuario ID: {$idUsuario}, Motivo: {$motivoCancelacion}";
                break;
                
            case ESTATUS_ENREVISION:
                if (empty($comentarios)) {
                    throw new Exception('Se requiere un comentario para enviar a revisión');
                }
                
                $updateFields[] = "Comentarios = CONCAT(ISNULL(Comentarios, ''), ' | Envío a Revisión: ', ?)";
                $params[] = $comentarios;
                
                $updateFields[] = "UsuarioRevision = ?";
                $params[] = $idUsuario;
                
                $updateFields[] = "FechaRevision = GETDATE()";
                
                $updateLog[] = "Enviada a revisión por usuario ID: {$idUsuario}";
                break;
        }
         
        if ($comentarios !== null && $comentarios !== '' && $nuevoEstatus != ESTATUS_ENREVISION) {
            $updateFields[] = "Comentarios = CONCAT(ISNULL(Comentarios, ''), ' | ', ?)";
            $params[] = $comentarios;
            $updateLog[] = "Comentarios agregados: {$comentarios}";
        }
         
        $setClause = implode(", ", $updateFields);
        $sql = "UPDATE t_vacaciones SET {$setClause} WHERE IdVacaciones = ?";
        $params[] = $idVacaciones;
         
        if (strlen($sql) > 4000) {
            throw new Exception('La consulta generada es demasiado larga');
        }
         
        $stmt = $Conexion->prepare($sql);
        if (!$stmt) {
            throw new Exception('Error al preparar la consulta');
        }
        
        if (!$stmt->execute($params)) {
            throw new Exception('Error al actualizar el estatus');
        }
        
        if ($stmt->rowCount() === 0) {
            throw new Exception('No se realizaron cambios. El estatus puede ser el mismo.');
        }
          
        $notificationResult = $service->sendStatusNotification($idVacaciones, $nuevoEstatus, $comentarios);
         
        if ($nuevoEstatus == ESTATUS_VALIDADA) {
            actualizarDiasTomados($Conexion, $idPersonal, $vacacionData['FechaInicio'], $vacacionData['FechaFin']);
        }
         
        $Conexion->commit();
         
        error_log(sprintf(
            "[VACACIONES] Estatus de vacaciones ID %d actualizado de %s a %s por usuario %d",
            $idVacaciones,
            ESTATUS_MENSAJES[$currentStatus],
            ESTATUS_MENSAJES[$nuevoEstatus],
            $idUsuario
        ));
         
        echo json_encode([
            'status' => true,
            'message' => 'Estatus actualizado correctamente',
            'data' => [
                'id_vacaciones' => $idVacaciones,
                'id_personal' => $idPersonal,
                'estatus_anterior' => $currentStatus,
                'estatus_anterior_texto' => ESTATUS_MENSAJES[$currentStatus],
                'estatus_nuevo' => $nuevoEstatus,
                'estatus_nuevo_texto' => ESTATUS_MENSAJES[$nuevoEstatus],
                'notificaciones_enviadas' => $notificationResult,
                'fecha_actualizacion' => date('Y-m-d H:i:s'),
                'usuario_actualizo' => $idUsuario
            ]
        ]);
        
    } catch (Exception $e) { 
        $Conexion->rollBack();
        throw $e;
    }
    
} catch (Exception $e) { 
    echo json_encode([
        'status' => false,
        'message' => $e->getMessage(),
        'error_code' => $e->getCode() ?: 500,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
 
function usuarioExiste($Conexion, $idUsuario) {
    $sql = "SELECT COUNT(*) as total FROM t_usuario WHERE IdUsuario = ? AND Estatus = 1";
    $stmt = $Conexion->prepare($sql);
    if (!$stmt) return false;
    
    $stmt->execute([$idUsuario]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $row['total'] > 0;
}
 
function verificarPermisos($Conexion, $idUsuario, $idPersonal, $nuevoEstatus) { 
    if (esSuperAdmin($Conexion, $idUsuario)) {
        return true;
    }
     
    if ($nuevoEstatus == ESTATUS_AUTORIZADA) {
        return esJefeDelPersonal($Conexion, $idUsuario, $idPersonal) || ($idUsuario == $idPersonal) ;
    }
     
    if ($nuevoEstatus == ESTATUS_VALIDADA) {
        return esRecursosHumanos($Conexion, $idUsuario);
    }
     
    if ($nuevoEstatus == ESTATUS_CANCELADA) {
        return ($idUsuario == $idPersonal) || esSuperAdmin($Conexion, $idUsuario) || esRecursosHumanos($Conexion, $idUsuario)||  esJefeDelPersonal($Conexion, $idUsuario, $idPersonal);;
    }
    
    if ($nuevoEstatus == ESTATUS_ENREVISION) {
        return esRecursosHumanos($Conexion, $idUsuario) ||  ($idUsuario == $idPersonal) || esJefeDelPersonal($Conexion, $idUsuario, $idPersonal);
    }
    
    return false;
}
 
function esSuperAdmin($Conexion, $idUsuario) { 
    $sql = "SELECT COUNT(*) as total FROM t_rolUsuario ru
            INNER JOIN t_usuario u ON u.rol = ru.IdRolUsuario
            WHERE u.IdUsuario = ? AND ru.IdRolUsuario = 1";
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$idUsuario]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return ($row['total'] ?? 0) > 0;
}
 
function esJefeDelPersonal($Conexion, $idUsuario, $idPersonal) { 
    $sql = "SELECT COUNT(*) as total FROM t_personal 
            WHERE IdPersonal = ? AND IdJefeInmediato = ?";
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$idPersonal, $idUsuario]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return $row['total'] > 0;
}
 
function esRecursosHumanos($Conexion, $idUsuario) { 
    $sql = "SELECT COUNT(*) as total FROM t_rolUsuario ru
            INNER JOIN t_usuario u ON u.rol = ru.IdRolUsuario
            WHERE u.IdUsuario = ? AND ru.IdRolUsuario = 2";
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$idUsuario]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return ($row['total'] ?? 0) > 0;
}
 
function calcularDiasCorresponden($Conexion, $idPersonal) { 
    $sql = "SELECT Antiguedad FROM t_vacaciones WHERE IdPersonal = ? ORDER BY FechaSolicitud DESC";
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$idPersonal]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $antiguedad = $row['Antiguedad'] ?? 0;
     
    if ($antiguedad >= 10) {
        return 30;
    } elseif ($antiguedad >= 5) {
        return 22;
    } else {
        return 12;
    }
}
 
function recalcularSaldoDias($Conexion, $idPersonal, $fechaInicio, $fechaFin) {
    $diasPorAntiguedad = calcularDiasCorresponden($Conexion, $idPersonal);
     
    $anio = date('Y');
    $sql = "SELECT SUM(DATEDIFF(day, FechaInicio, FechaFin) + 1) as DiasTomados 
            FROM t_vacaciones 
            WHERE IdPersonal = ? 
            AND YEAR(FechaInicio) = ?
            AND Estatus IN (1, 2)";  
    
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$idPersonal, $anio]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $diasTomados = $row['DiasTomados'] ?? 0;
    
    return $diasPorAntiguedad - $diasTomados;
}
 
function actualizarDiasTomados($Conexion, $idPersonal, $fechaInicio, $fechaFin) { 
    $dias = calcularDiasHabiles($fechaInicio, $fechaFin); 
    $sql = "UPDATE t_vacaciones SET DiasTomar = ? 
            WHERE IdPersonal = ? AND FechaInicio = ? AND FechaFin = ?";
    $stmt = $Conexion->prepare($sql);
    $stmt->execute([$dias, $idPersonal, $fechaInicio, $fechaFin]);
}
 
function calcularDiasHabiles($fechaInicio, $fechaFin) {
    $start = new DateTime($fechaInicio);
    $end = new DateTime($fechaFin);
    $end->modify('+1 day');
    $days = 0;
    $interval = new DateInterval('P1D');
    $period = new DatePeriod($start, $interval, $end);
    
    foreach ($period as $date) {
        if ($date->format('N') < 6) {
            $days++;
        }
    }
    return $days;
}
 
function obtenerTextoEstatus($estatus) {
    return ESTATUS_MENSAJES[$estatus] ?? 'Desconocido';
}
?>