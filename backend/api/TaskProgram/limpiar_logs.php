<?php

include_once '../../db/Connection.php';
require_once '../includes/Mailer.php';

date_default_timezone_set('America/Mexico_City');

$logFile = __DIR__ . '/../logs/limpiar_logs.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

try {
    $db = Connection::getInstance()->getConnection();
    $mailer = new Mailer($db);
     
    $result = $mailer->cleanOldLogs(90); 
    $stmt = $db->prepare("
        DELETE FROM email_queue 
        WHERE Estado IN ('sent', 'failed') 
          AND FechaEnvio < DATE_SUB(NOW(), INTERVAL 30 DAY)
    ");
    $stmt->execute();
    $eliminados = $stmt->affected_rows;
    
    $mensaje = date('Y-m-d H:i:s') . 
               " - Logs eliminados: " . ($result ? 'OK' : 'FAIL') .
               " - Registros de cola eliminados: {$eliminados}\n";
    
    file_put_contents($logFile, $mensaje, FILE_APPEND);
    echo $mensaje;
    
} catch (Exception $e) {
    $errorMsg = date('Y-m-d H:i:s') . " - ERROR: " . $e->getMessage() . "\n";
    file_put_contents($logFile, $errorMsg, FILE_APPEND);
    echo $errorMsg;
}