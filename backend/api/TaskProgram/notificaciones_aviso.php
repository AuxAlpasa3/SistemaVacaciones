<?php  
include_once '../../db/Connection.php';
require_once '../Includes/VacacionesService.php';
 
date_default_timezone_set('America/Mexico_City');
 
$logFile = __DIR__ . '/../logs/notificaciones_aviso.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

try { 
    $service = new VacacionesService($Conexion);
     
    $totalAvisos = $service->sendAdvanceNotices(); 
    $totalAlertas = $service->checkUnvalidatedVacations();
    
    $mensaje = date('Y-m-d H:i:s') . " - Avisos enviados: {$totalAvisos}, Alertas no validadas: {$totalAlertas}\n";
     
    file_put_contents($logFile, $mensaje, FILE_APPEND);
    
    echo $mensaje;
    
} catch (Exception $e) {
    $errorMsg = date('Y-m-d H:i:s') . " - ERROR: " . $e->getMessage() . "\n";
    file_put_contents($logFile, $errorMsg, FILE_APPEND);
    echo $errorMsg;
}