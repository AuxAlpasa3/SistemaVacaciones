<?php
// includes/Mailer.php

require_once __DIR__ . '/../vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class Mailer {
    private $smtpConfig;
    private $db;
    private $config;
    
    public function __construct($db) {
        $this->db = $db;
        $this->config = include(__DIR__ . '/../config/mail.php');
        $this->smtpConfig = $this->config['smtp'];
    }
    
    /**
     * Envía un correo usando PHPMailer
     */
    private function sendEmail($to, $subject, $htmlBody, $textBody = null, $cc = null) {
        try {
            $mail = new PHPMailer(true);
            
            // Configuración SMTP
            $mail->isSMTP();
            $mail->Host       = $this->smtpConfig['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->smtpConfig['username'];
            $mail->Password   = $this->smtpConfig['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = $this->smtpConfig['port'];
            $mail->CharSet    = 'UTF-8';
            
            // Destinatarios
            $mail->setFrom($this->smtpConfig['from_email'], $this->smtpConfig['from_name']);
            $mail->addAddress($to);
            
            if ($cc) {
                $ccArray = is_array($cc) ? $cc : [$cc];
                foreach ($ccArray as $ccEmail) {
                    if ($ccEmail && filter_var($ccEmail, FILTER_VALIDATE_EMAIL)) {
                        $mail->addCC($ccEmail);
                    }
                }
            }
            
            // Contenido
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = $textBody ?: strip_tags($htmlBody);
            
            $mail->send();
            return ['success' => true, 'error' => null];
            
        } catch (Exception $e) {
            return ['success' => false, 'error' => $mail->ErrorInfo];
        }
    }
    
    /**
     * Guarda en la cola de correos
     */
    public function queueEmail($idVacaciones, $destinatario, $asunto, $cuerpoHTML, $tipo, $fechaProgramada = null, $cc = null) {
        if (!filter_var($destinatario, FILTER_VALIDATE_EMAIL)) {
            error_log("Email inválido: $destinatario para vacación ID: $idVacaciones");
            return false;
        }
        
        $stmt = $this->db->prepare("
            INSERT INTO email_queue 
            (IdVacaciones, Destinatario, DestinatarioCC, Asunto, CuerpoHTML, TipoNotificacion, FechaProgramada, Estado, MaxIntentos) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        ");
        
        $ccStr = is_array($cc) ? implode(',', array_filter($cc, function($email) {
            return filter_var($email, FILTER_VALIDATE_EMAIL);
        })) : null;
        
        $maxIntentos = $this->config['max_intentos'] ?? 3;
        
        $stmt->bind_param(
            'issssssi',
            $idVacaciones,
            $destinatario,
            $ccStr,
            $asunto,
            $cuerpoHTML,
            $tipo,
            $fechaProgramada,
            $maxIntentos
        );
        
        return $stmt->execute();
    }
    
    /**
     * Procesa correos pendientes de la cola
     */
    public function processQueue($limit = null) {
        if ($limit === null) {
            $limit = $this->config['limite_por_ciclo'] ?? 50;
        }
        
        $stmt = $this->db->prepare("
            SELECT IdEmailQueue, IdVacaciones, Destinatario, DestinatarioCC,
                   Asunto, CuerpoHTML, TipoNotificacion, Intentos, MaxIntentos
            FROM email_queue 
            WHERE Estado = 'pending' 
              AND (FechaProgramada IS NULL OR FechaProgramada <= NOW())
            ORDER BY FechaCreacion ASC
            LIMIT ?
        ");
        $stmt->bind_param('i', $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $sentCount = 0;
        $failedCount = 0;
        
        while ($row = $result->fetch_assoc()) {
            $cc = $row['DestinatarioCC'] ? explode(',', $row['DestinatarioCC']) : null;
            
            $emailSent = $this->sendEmail(
                $row['Destinatario'],
                $row['Asunto'],
                $row['CuerpoHTML'],
                null,
                $cc
            );
            
            if ($emailSent['success']) {
                // Actualizar estado a sent
                $updateStmt = $this->db->prepare("
                    UPDATE email_queue 
                    SET Estado = 'sent', FechaEnvio = NOW() 
                    WHERE IdEmailQueue = ?
                ");
                $updateStmt->bind_param('i', $row['IdEmailQueue']);
                $updateStmt->execute();
                $sentCount++;
                
                // Guardar log
                $this->saveLog($row['IdVacaciones'], $row['IdEmailQueue'], 
                              $row['TipoNotificacion'], $row['Destinatario'], 
                              $row['Asunto'], 'sent');
                
            } else {
                $newIntentos = $row['Intentos'] + 1;
                $estado = ($newIntentos >= $row['MaxIntentos']) ? 'failed' : 'pending';
                
                $updateStmt = $this->db->prepare("
                    UPDATE email_queue 
                    SET Estado = ?, Intentos = ?, ErrorMensaje = ? 
                    WHERE IdEmailQueue = ?
                ");
                $updateStmt->bind_param('sisi', $estado, $newIntentos, $emailSent['error'], $row['IdEmailQueue']);
                $updateStmt->execute();
                $failedCount++;
                
                // Guardar log de error
                $this->saveLog($row['IdVacaciones'], $row['IdEmailQueue'], 
                              $row['TipoNotificacion'], $row['Destinatario'], 
                              $row['Asunto'], 'failed', $emailSent['error']);
            }
        }
        
        return ['sent' => $sentCount, 'failed' => $failedCount];
    }
    
    /**
     * Guarda log de envío
     */
    private function saveLog($idVacaciones, $idEmailQueue, $tipo, $destinatario, $asunto, $estado, $error = null) {
        $stmt = $this->db->prepare("
            INSERT INTO email_logs 
            (IdVacaciones, IdEmailQueue, TipoNotificacion, Destinatario, Asunto, Estado, ErrorMensaje) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->bind_param('iisssss', $idVacaciones, $idEmailQueue, $tipo, $destinatario, $asunto, $estado, $error);
        return $stmt->execute();
    }
    
    /**
     * Obtiene estadísticas de la cola
     */
    public function getQueueStats() {
        $stats = [];
        
        $stmt = $this->db->query("
            SELECT Estado, COUNT(*) as total 
            FROM email_queue 
            GROUP BY Estado
        ");
        while ($row = $stmt->fetch_assoc()) {
            $stats[$row['Estado']] = (int)$row['total'];
        }
        
        return $stats;
    }
    
    /**
     * Limpia logs antiguos (más de 30 días)
     */
    public function cleanOldLogs($days = 30) {
        $fechaLimite = date('Y-m-d', strtotime("-$days days"));
        
        $stmt = $this->db->prepare("
            DELETE FROM email_logs 
            WHERE FechaEnvio < ?
        ");
        $stmt->bind_param('s', $fechaLimite);
        return $stmt->execute();
    }
}