<?php
// includes/VacacionesService.php

require_once __DIR__ . '/Mailer.php';

class VacacionesService {
    private $db;
    private $mailer;
    private $config;
    
    public function __construct($db) {
        $this->db = $db;
        $this->mailer = new Mailer($db);
        $this->config = include(__DIR__ . '/../config/mail.php');
    }
    
    /**
     * Obtiene los datos del jefe inmediato de un empleado
     */
    private function getJefeInmediato($idPersonal) {
        // Primero obtener el IdJefeInmediato del empleado
        $stmt = $this->db->prepare("
            SELECT IdJefeInmediato 
            FROM personal 
            WHERE IdPersonal = ?
        ");
        $stmt->bind_param('i', $idPersonal);
        $stmt->execute();
        $result = $stmt->get_result();
        $empleado = $result->fetch_assoc();
        
        if (!$empleado || !$empleado['IdJefeInmediato']) {
            return [
                'IdPersonal' => 0,
                'NoEmpleado' => 'RRHH',
                'NombreCompleto' => 'Recursos Humanos',
                'Email' => $this->config['destinatarios']['rh'],
                'Cargo' => 'RRHH',
                'Departamento' => 'RRHH'
            ];
        }
        
        // Obtener datos del jefe
        $stmt = $this->db->prepare("
            SELECT IdPersonal, NoEmpleado, 
                   CONCAT(Nombre, ' ', ApPaterno, ' ', ApMaterno) as NombreCompleto,
                   Email, Cargo, Departamento
            FROM personal 
            WHERE IdPersonal = ?
        ");
        $stmt->bind_param('i', $empleado['IdJefeInmediato']);
        $stmt->execute();
        $jefe = $stmt->get_result()->fetch_assoc();
        
        if ($jefe && $jefe['Email']) {
            return $jefe;
        }
        
        return [
            'IdPersonal' => 0,
            'NoEmpleado' => 'RRHH',
            'NombreCompleto' => 'Recursos Humanos',
            'Email' => $this->config['destinatarios']['rh'],
            'Cargo' => 'RRHH',
            'Departamento' => 'RRHH'
        ];
    }
    
    /**
     * Obtiene datos completos de la vacación
     */
    private function getVacacionCompleta($idVacaciones) {
        $stmt = $this->db->prepare("
            SELECT v.*, 
                   p.IdPersonal,
                   p.NoEmpleado,
                   CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                   p.Departamento,
                   p.Cargo,
                   p.FechaIngreso,
                   p.Email as EmailEmpleado,
                   p.IdJefeInmediato
            FROM vacaciones v
            INNER JOIN personal p ON v.IdPersonal = p.IdPersonal
            WHERE v.IdVacaciones = ?
        ");
        $stmt->bind_param('i', $idVacaciones);
        $stmt->execute();
        return $stmt->get_result()->fetch_assoc();
    }
    
    /**
     * Envía notificaciones según el cambio de estatus
     */
    public function sendStatusNotification($idVacaciones, $nuevoEstatus, $comentarios = null) {
        switch ($nuevoEstatus) {
            case 1: // Autorizada
                return $this->notifyAuthorization($idVacaciones, $comentarios);
            case 2: // Validada
                return $this->notifyValidation($idVacaciones, $comentarios);
            case 3: // Cancelada
                return $this->notifyCancellation($idVacaciones, $comentarios);
            case 4: // En Revisión
                return $this->notifyReview($idVacaciones, $comentarios);
            default:
                return false;
        }
    }
    
    /**
     * Notifica cuando se autoriza una vacación
     */
    public function notifyAuthorization($idVacaciones, $comentarios = null) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "✅ Vacación AUTORIZADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('autorizacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'autorizacion',
            null,
            $this->config['destinatarios']['rh']
        );
        
        return true;
    }
    
    /**
     * Notifica cuando se valida una vacación
     */
    public function notifyValidation($idVacaciones, $comentarios = null) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "✅ Vacación VALIDADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('validacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'validacion',
            null,
            $this->config['destinatarios']['rh']
        );
        
        return true;
    }
    
    /**
     * Notifica cuando se envía a revisión
     */
    public function notifyReview($idVacaciones, $comentarios) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "⚠️ Vacación EN REVISIÓN - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('revision', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'revision',
            null,
            $this->config['destinatarios']['rh']
        );
        
        return true;
    }
    
    /**
     * Notifica cuando se cancela una vacación
     */
    public function notifyCancellation($idVacaciones, $comentarios) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "❌ Vacación CANCELADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('cancelacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'cancelacion',
            null,
            $this->config['destinatarios']['rh']
        );
        
        return true;
    }
    
    /**
     * Envía avisos de vacaciones próximas (15 y 7 días antes)
     */
    public function sendAdvanceNotices() {
        $fecha15Dias = date('Y-m-d', strtotime('+15 days'));
        $fecha7Dias = date('Y-m-d', strtotime('+7 days'));
        
        $total = 0;
        $total += $this->sendAdvanceNotice($fecha15Dias, 'aviso_15_dias', 15);
        $total += $this->sendAdvanceNotice($fecha7Dias, 'aviso_7_dias', 7);
        
        return $total;
    }
    
    /**
     * Envía aviso de próxima vacación al jefe
     */
    private function sendAdvanceNotice($fechaInicio, $tipo, $diasAntes) {
        $campoFlag = $tipo === 'aviso_15_dias' ? 'EmailEnviado15Dias' : 'EmailEnviado7Dias';
        
        $stmt = $this->db->prepare("
            SELECT v.*, 
                   p.IdPersonal,
                   p.NoEmpleado,
                   CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                   p.Departamento,
                   p.Cargo,
                   p.Email as EmailEmpleado,
                   p.IdJefeInmediato
            FROM vacaciones v
            INNER JOIN personal p ON v.IdPersonal = p.IdPersonal
            WHERE v.FechaInicio = ? 
              AND v.Estatus IN (1, 2)
              AND v.{$campoFlag} = 0
        ");
        $stmt->bind_param('s', $fechaInicio);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $contador = 0;
        
        while ($vacacion = $result->fetch_assoc()) {
            $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
            
            if (!$jefe || !$jefe['Email']) continue;
            
            $asunto = "📅 Recordatorio: {$vacacion['NombreCompleto']} inicia vacaciones en {$diasAntes} días";
            $cuerpo = $this->buildAdvanceNoticeTemplate($vacacion, $jefe, $diasAntes);
            
            $this->mailer->queueEmail(
                $vacacion['IdVacaciones'],
                $jefe['Email'],
                $asunto,
                $cuerpo,
                $tipo,
                null,
                $this->config['destinatarios']['rh']
            );
            
            // Marcar como enviado
            $updateStmt = $this->db->prepare("UPDATE vacaciones SET {$campoFlag} = 1 WHERE IdVacaciones = ?");
            $updateStmt->bind_param('i', $vacacion['IdVacaciones']);
            $updateStmt->execute();
            
            $contador++;
        }
        
        return $contador;
    }
    
    /**
     * Verifica vacaciones AUTORIZADAS (Estatus = 1) pero NO VALIDADAS (Estatus ≠ 2)
     * SOLO si la fecha de inicio es FUTURA (mayor a hoy)
     * Y han pasado más de 1 día desde la solicitud
     */
    public function checkUnvalidatedVacations() {
        $fechaActual = date('Y-m-d');
        $fechaLimiteSolicitud = date('Y-m-d', strtotime('-1 day'));
        
        $stmt = $this->db->prepare("
            SELECT v.*, 
                   p.IdPersonal,
                   p.NoEmpleado,
                   CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                   p.Departamento,
                   p.Cargo,
                   p.Email as EmailEmpleado,
                   p.IdJefeInmediato
            FROM vacaciones v
            INNER JOIN personal p ON v.IdPersonal = p.IdPersonal
            WHERE DATE(v.FechaSolicitud) <= ? 
              AND v.FechaInicio > ? 
              AND v.Estatus = 1
              AND v.EmailRecordatorioRH = 0
            ORDER BY v.FechaSolicitud ASC
        ");
        $stmt->bind_param('ss', $fechaLimiteSolicitud, $fechaActual);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $contador = 0;
        
        while ($vacacion = $result->fetch_assoc()) {
            $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
            
            // Calcular días desde que se solicitó
            $fechaSolicitud = new DateTime($vacacion['FechaSolicitud']);
            $fechaActualObj = new DateTime();
            $diferencia = $fechaActualObj->diff($fechaSolicitud);
            $diasPasados = $diferencia->days;
            
            // Si ya pasó 1 día desde la solicitud
            if ($diasPasados >= 1) {
                $asunto = "⚠️ URGENTE: Vacación AUTORIZADA pero SIN VALIDAR - {$vacacion['NombreCompleto']}";
                $cuerpo = $this->buildUnvalidatedNoticeTemplate($vacacion, $jefe, $diasPasados);
                
                // Enviar a RRHH
                $this->mailer->queueEmail(
                    $vacacion['IdVacaciones'],
                    $this->config['destinatarios']['rh'],
                    $asunto,
                    $cuerpo,
                    'recordatorio_rh'
                );
                
                // Enviar también al jefe
                if ($jefe && $jefe['Email']) {
                    $this->mailer->queueEmail(
                        $vacacion['IdVacaciones'],
                        $jefe['Email'],
                        $asunto,
                        $cuerpo,
                        'recordatorio_rh'
                    );
                }
                
                // Marcar como enviado
                $updateStmt = $this->db->prepare("UPDATE vacaciones SET EmailRecordatorioRH = 1 WHERE IdVacaciones = ?");
                $updateStmt->bind_param('i', $vacacion['IdVacaciones']);
                $updateStmt->execute();
                
                $contador++;
            }
        }
        
        return $contador;
    }
    
    /**
     * Construye plantilla de correo para el jefe
     */
    private function buildEmailTemplate($tipo, $vacacion, $jefe, $comentarios = null) {
        $iconos = [
            'autorizacion' => '✅',
            'validacion' => '✅',
            'revision' => '⚠️',
            'cancelacion' => '❌'
        ];
        
        $titulos = [
            'autorizacion' => 'Solicitud de Vacaciones AUTORIZADA',
            'validacion' => 'Solicitud de Vacaciones VALIDADA',
            'revision' => 'Solicitud de Vacaciones EN REVISIÓN',
            'cancelacion' => 'Solicitud de Vacaciones CANCELADA'
        ];
        
        $colores = [
            'autorizacion' => '#4CAF50',
            'validacion' => '#2196F3',
            'revision' => '#FF9800',
            'cancelacion' => '#F44336'
        ];
        
        $icono = $iconos[$tipo] ?? '📧';
        $titulo = $titulos[$tipo] ?? 'Actualización de Vacaciones';
        $color = $colores[$tipo] ?? '#F57C00';
        
        $estatusTexto = $this->getStatusText($vacacion['Estatus']);
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        
        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 650px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
                .header { background: {$color}; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h2 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
                .content { background: #ffffff; padding: 25px; border-radius: 0 0 10px 10px; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
                .info-item { background: #f8f9fa; padding: 12px 15px; border-radius: 6px; border-left: 4px solid {$color}; }
                .info-item .label { font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; display: block; }
                .info-item .value { font-size: 16px; font-weight: 500; color: #333; }
                .info-item-full { grid-column: span 2; }
                .comentarios { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 4px; }
                .comentarios strong { color: #E65100; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 15px; }
                .btn { display: inline-block; background: {$color}; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: 500; }
                .btn:hover { opacity: 0.9; }
                .badge { display: inline-block; padding: 3px 12px; background: {$color}; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .company-name { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>{$icono} {$titulo}</h2>
                    <p>Sistema de Vacaciones - <span class='company-name'>{$this->config['empresa']}</span></p>
                </div>
                <div class='content'>
                    <p>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                    <p>Se ha actualizado el estatus de la solicitud de vacaciones del siguiente empleado a su cargo:</p>
                    
                    <div class='info-grid'>
                        <div class='info-item'>
                            <span class='label'>Empleado</span>
                            <span class='value'>{$vacacion['NombreCompleto']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>No. Empleado</span>
                            <span class='value'>{$vacacion['NoEmpleado']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Departamento</span>
                            <span class='value'>{$vacacion['Departamento']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Cargo</span>
                            <span class='value'>{$vacacion['Cargo']}</span>
                        </div>
                        <div class='info-item info-item-full'>
                            <span class='label'>Período de Vacaciones</span>
                            <span class='value'>" . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . " al " . 
                            date('d/m/Y', strtotime($vacacion['FechaFin'])) . "</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Días a Tomar</span>
                            <span class='value'>{$vacacion['DiasTomar']} días</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Estatus Actual</span>
                            <span class='value'><span class='badge'>{$estatusTexto}</span></span>
                        </div>
                        <div class='info-item info-item-full'>
                            <span class='label'>Fecha de Solicitud</span>
                            <span class='value'>" . date('d/m/Y', strtotime($vacacion['FechaSolicitud'])) . "</span>
                        </div>
                    </div>";
        
        if ($comentarios) {
            $html .= "
                    <div class='comentarios'>
                        <strong>📝 Comentarios:</strong><br>
                        {$comentarios}
                    </div>";
        }
        
        $html .= "
                    <p style='text-align: center; margin-top: 20px;'>
                        <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                            Ver en el Sistema
                        </a>
                    </p>
                </div>
                <div class='footer'>
                    <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                    <p>Por favor no responda a este correo. Si tiene dudas, contacte a RRHH.</p>
                    <p>© " . date('Y') . " - {$this->config['empresa']}</p>
                </div>
            </div>
        </body>
        </html>";
        
        return $html;
    }
    
    /**
     * Construye plantilla de aviso de próxima vacación
     */
    private function buildAdvanceNoticeTemplate($vacacion, $jefe, $diasAntes) {
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 650px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
                .header { background: #2196F3; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h2 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
                .content { background: #ffffff; padding: 25px; border-radius: 0 0 10px 10px; }
                .highlight { background: #E3F2FD; padding: 15px; border-left: 4px solid #2196F3; border-radius: 4px; margin: 15px 0; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
                .info-item { background: #f8f9fa; padding: 12px 15px; border-radius: 6px; }
                .info-item .label { font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; display: block; }
                .info-item .value { font-size: 16px; font-weight: 500; }
                .info-item-full { grid-column: span 2; }
                .action-box { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 4px; }
                .action-box ul { margin: 10px 0 0; padding-left: 20px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 15px; }
                .btn { display: inline-block; background: #2196F3; color: white; padding: 10px 25px; text-decoration: none; border-radius: 5px; font-weight: 500; }
                .btn:hover { opacity: 0.9; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>📅 Recordatorio de Vacaciones</h2>
                    <p style='margin: 5px 0 0; opacity: 0.9;'>{$this->config['empresa']}</p>
                </div>
                <div class='content'>
                    <p>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                    <p>Le recordamos que el siguiente empleado a su cargo iniciará su período de vacaciones en <strong>{$diasAntes} días</strong>:</p>
                    
                    <div class='highlight'>
                        <p style='margin: 0; font-size: 16px;'>
                            <strong>Fecha de inicio:</strong> " . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . "<br>
                            <strong>Fecha de retorno:</strong> " . date('d/m/Y', strtotime($vacacion['FechaRetornoLabores'])) . "
                        </p>
                    </div>
                    
                    <div class='info-grid'>
                        <div class='info-item info-item-full'>
                            <span class='label'>Empleado</span>
                            <span class='value'>{$vacacion['NombreCompleto']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>No. Empleado</span>
                            <span class='value'>{$vacacion['NoEmpleado']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Departamento</span>
                            <span class='value'>{$vacacion['Departamento']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Cargo</span>
                            <span class='value'>{$vacacion['Cargo']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Días</span>
                            <span class='value'>{$vacacion['DiasTomar']} días</span>
                        </div>
                    </div>
                    
                    <div class='action-box'>
                        <strong>⚠️ Acciones recomendadas:</strong>
                        <ul>
                            <li>Asegurar la entrega de responsabilidades del empleado</li>
                            <li>Actualizar el calendario de ausencias del departamento</li>
                            <li>Verificar la cobertura de sus funciones durante su ausencia</li>
                        </ul>
                    </div>
                    
                    <p style='text-align: center; margin-top: 20px;'>
                        <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                            Ver detalles en el Sistema
                        </a>
                    </p>
                </div>
                <div class='footer'>
                    <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                    <p>© " . date('Y') . " - {$this->config['empresa']}</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Construye plantilla de aviso de vacación autorizada pero no validada
     */
    private function buildUnvalidatedNoticeTemplate($vacacion, $jefe, $diasPasados) {
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        $nombreEmpleado = $vacacion['NombreCompleto'];
        
        $estadoTexto = $this->getStatusText($vacacion['Estatus']);
        $fechaSolicitud = date('d/m/Y', strtotime($vacacion['FechaSolicitud']));
        $fechaInicio = date('d/m/Y', strtotime($vacacion['FechaInicio']));
        $fechaAutoriza = $vacacion['FechaAutoriza'] ? date('d/m/Y', strtotime($vacacion['FechaAutoriza'])) : 'No registrada';
        $usuarioAutoriza = $vacacion['UsuarioAutoriza'] ?: 'No registrado';
        
        // Calcular días restantes
        $fechaInicioObj = new DateTime($vacacion['FechaInicio']);
        $fechaActualObj = new DateTime();
        $diasRestantes = $fechaActualObj->diff($fechaInicioObj);
        $diasRestantes = $diasRestantes->days;
        
        $mensajeUrgencia = '';
        if ($diasRestantes <= 3) {
            $mensajeUrgencia = "
            <div style='background: #FFF3E0; padding: 12px; border-left: 4px solid #FF9800; margin: 10px 0; border-radius: 4px;'>
                <strong style='color: #E65100;'>⏰ ¡URGENTE! Faltan solo {$diasRestantes} días para el inicio de las vacaciones.</strong>
            </div>";
        }
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 650px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
                .header { background: #F44336; color: white; padding: 25px; text-align: center; border-radius: 10px 10px 0 0; }
                .header h2 { margin: 0; font-size: 24px; }
                .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
                .content { background: #ffffff; padding: 25px; border-radius: 0 0 10px 10px; }
                .urgent-box { background: #FFEBEE; padding: 20px; border-left: 5px solid #F44336; border-radius: 4px; margin: 15px 0; }
                .urgent-box h3 { margin: 0 0 10px 0; color: #C62828; }
                .urgent-box .highlight { font-size: 18px; font-weight: bold; color: #C62828; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 15px 0; }
                .info-item { background: #f8f9fa; padding: 12px 15px; border-radius: 6px; border-left: 3px solid #F44336; }
                .info-item .label { font-size: 11px; text-transform: uppercase; color: #888; font-weight: bold; display: block; }
                .info-item .value { font-size: 15px; font-weight: 500; }
                .info-item-full { grid-column: span 2; }
                .status-badge { display: inline-block; padding: 4px 12px; background: #4CAF50; color: white; border-radius: 20px; font-size: 13px; font-weight: bold; }
                .action-box { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 4px; }
                .action-box ul { margin: 10px 0 0; padding-left: 20px; }
                .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; border-top: 1px solid #e0e0e0; padding-top: 15px; }
                .btn { display: inline-block; background: #F44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 500; font-size: 16px; }
                .btn:hover { opacity: 0.9; }
                .btn-secondary { display: inline-block; background: #9E9E9E; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: 500; margin-left: 10px; }
                .dias-pasados { background: #F44336; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
                .warning-box { background: #FFF8E1; padding: 12px; border-left: 4px solid #FFC107; border-radius: 4px; margin: 10px 0; }
                .info-autorizacion { background: #E8F5E9; padding: 12px; border-left: 4px solid #4CAF50; border-radius: 4px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>🚨 ALERTA: Vacación Autorizada pero NO Validada</h2>
                    <p>Sistema de Vacaciones - {$this->config['empresa']}</p>
                </div>
                <div class='content'>
                    <p>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                    
                    <div class='urgent-box'>
                        <h3>⚠️ ¡ATENCIÓN! ACCIÓN REQUERIDA</h3>
                        <p style='margin: 0;'>
                            La solicitud de vacaciones de <strong>{$nombreEmpleado}</strong> fue <strong>AUTORIZADA</strong> hace {$diasPasados} día(s) 
                            pero aún <strong style='color: #C62828;'>NO HA SIDO VALIDADA</strong> por RRHH.
                        </p>
                        <p style='margin: 10px 0 0; font-size: 14px;'>
                            <span class='dias-pasados'>{$diasPasados} días desde la solicitud</span>
                            <span style='margin-left: 15px;'>📅 Inicia: <strong>{$fechaInicio}</strong></span>
                        </p>
                    </div>
                    
                    {$mensajeUrgencia}
                    
                    <div class='info-autorizacion'>
                        <strong style='color: #2E7D32;'>✅ Información de Autorización:</strong><br>
                        <span style='color: #2E7D32;'>Autorizado por: <strong>{$usuarioAutoriza}</strong></span><br>
                        <span style='color: #2E7D32;'>Fecha de autorización: <strong>{$fechaAutoriza}</strong></span>
                    </div>
                    
                    <div class='warning-box'>
                        <strong style='color: #795548;'>ℹ️ IMPORTANTE:</strong>
                        <span style='color: #795548;'>La validación debe realizarse ANTES de la fecha de inicio de las vacaciones.</span>
                    </div>
                    
                    <div class='info-grid'>
                        <div class='info-item info-item-full'>
                            <span class='label'>Empleado</span>
                            <span class='value'>{$nombreEmpleado}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>No. Empleado</span>
                            <span class='value'>{$vacacion['NoEmpleado']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Departamento</span>
                            <span class='value'>{$vacacion['Departamento']}</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Cargo</span>
                            <span class='value'>{$vacacion['Cargo']}</span>
                        </div>
                        <div class='info-item info-item-full'>
                            <span class='label'>Período de Vacaciones</span>
                            <span class='value'>" . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . " al " . 
                            date('d/m/Y', strtotime($vacacion['FechaFin'])) . "</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Días a Tomar</span>
                            <span class='value'>{$vacacion['DiasTomar']} días</span>
                        </div>
                        <div class='info-item'>
                            <span class='label'>Fecha de Solicitud</span>
                            <span class='value'><strong>{$fechaSolicitud}</strong></span>
                        </div>
                        <div class='info-item info-item-full'>
                            <span class='label'>Estatus Actual</span>
                            <span class='value'>
                                <span class='status-badge'>
                                    {$estadoTexto}
                                </span>
                                <span style='margin-left: 10px; font-size: 13px; color: #888;'>
                                    (Autorizada - Pendiente de Validación)
                                </span>
                            </span>
                        </div>
                    </div>
                    
                    <div class='action-box'>
                        <strong>📋 Acciones Requeridas - RRHH:</strong>
                        <ul>
                            <li><strong>Validar</strong> la solicitud de vacaciones en el sistema</li>
                            <li>Verificar que el empleado cumpla con los requisitos</li>
                            <li>Confirmar la disponibilidad de días</li>
                            <li>Revisar que no afecte las operaciones del departamento</li>
                        </ul>
                    </div>
                    
                    <p style='text-align: center; margin-top: 25px;'>
                        <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                            🔍 Ir a Validar Solicitud
                        </a>
                        <a href='{$this->config['url_base']}/vacaciones' class='btn-secondary'>
                            Ver todas
                        </a>
                    </p>
                    
                    <div style='background: #FFF8E1; padding: 12px; border-radius: 4px; margin-top: 15px; font-size: 13px; color: #795548;'>
                        <strong>💡 Nota:</strong> Esta alerta se genera automáticamente cuando una solicitud de vacaciones 
                        ha sido <strong>AUTORIZADA</strong> hace más de 1 día pero <strong>NO VALIDADA</strong>, 
                        y la fecha de inicio es FUTURA.
                    </div>
                </div>
                <div class='footer'>
                    <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                    <p>Si ya validó esta solicitud, ignore este mensaje.</p>
                    <p>© " . date('Y') . " - {$this->config['empresa']}</p>
                </div>
            </div>
        </body>
        </html>";
    }
    
    /**
     * Obtiene el texto del estatus
     */
    private function getStatusText($estatus) {
        $statusMap = [
            0 => 'Solicitada',
            1 => 'Autorizada',
            2 => 'Validada',
            3 => 'Cancelada',
            4 => 'En Revisión'
        ];
        return $statusMap[$estatus] ?? 'Desconocido';
    }
    
    /**
     * Obtiene estadísticas de notificaciones
     */
    public function getNotificationStats() {
        $stats = [];
        
        // Estadísticas de la cola
        $queueStats = $this->mailer->getQueueStats();
        $stats['queue'] = $queueStats;
        
        // Total de vacaciones por estatus
        $stmt = $this->db->query("
            SELECT Estatus, COUNT(*) as total 
            FROM vacaciones 
            GROUP BY Estatus
        ");
        $statusCounts = [];
        while ($row = $stmt->fetch_assoc()) {
            $statusCounts[$row['Estatus']] = (int)$row['total'];
        }
        $stats['vacaciones_por_estatus'] = $statusCounts;
        
        // Envíos de correos hoy
        $stmt = $this->db->query("
            SELECT COUNT(*) as total 
            FROM email_logs 
            WHERE DATE(FechaEnvio) = CURDATE()
        ");
        $stats['envios_hoy'] = (int)$stmt->fetch_assoc()['total'];
        
        return $stats;
    }
}