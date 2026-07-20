<?php 
// Ejecutar cada 5 minutos: */5 * * * * php /ruta/cron/procesar_cola_email.php

require_once __DIR__ . '/../db/Connection.php';
require_once __DIR__ . '/../includes/Mailer.php';

// Configurar zona horaria
date_default_timezone_set('America/Mexico_City');
 
$logFile = __DIR__ . '/../logs/procesar_cola_email.log';
$logDir = dirname($logFile);
if (!is_dir($logDir)) {
    mkdir($logDir, 0777, true);
}

try {
    $db = Connection::getInstance()->getConnection();
    $mailer = new Mailer($db);
     
    $result = $mailer->processQueue(50);
     
    $stats = $mailer->getQueueStats();
    
    $mensaje = date('Y-m-d H:i:s') . 
               " - Enviados: {$result['sent']}, Fallidos: {$result['failed']}" .
               " - Cola: Pendientes: " . ($stats['pending'] ?? 0) .
               ", Enviados: " . ($stats['sent'] ?? 0) .
               ", Fallidos: " . ($stats['failed'] ?? 0) . "\n";
     
    file_put_contents($logFile, $mensaje, FILE_APPEND);
    
    echo $mensaje;
    
} catch (Exception $e) {
    $errorMsg = date('Y-m-d H:i:s') . " - ERROR: " . $e->getMessage() . "\n";
    file_put_contents($logFile, $errorMsg, FILE_APPEND);
    echo $errorMsg;
}