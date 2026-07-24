<?php
require_once  'Mailer.php';

class VacacionesService {
    private $db;
    private $mailer;
    private $config;
    
    public function __construct($db) {
        $this->db = $db;
        $this->mailer = new Mailer($db);
        $this->config = include('../Configuracion/mail.php');
    }
     
    private function getJefeInmediato($idPersonal) { 
        $stmt = $this->db->prepare("
            SELECT IdJefeInmediato 
            FROM t_personal 
            WHERE IdPersonal = :idPersonal
        ");
        $stmt->execute([':idPersonal' => $idPersonal]);
        $empleado = $stmt->fetch(PDO::FETCH_ASSOC);
        
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
         
        $stmt = $this->db->prepare("
            SELECT IdPersonal, NoEmpleado, 
                   CONCAT(Nombre, ' ', ApPaterno, ' ', ApMaterno) as NombreCompleto,
                   Email, Cargo, Departamento
            FROM t_personal 
            WHERE IdPersonal = :idJefe
        ");
        $stmt->execute([':idJefe' => $empleado['IdJefeInmediato']]);
        $jefe = $stmt->fetch(PDO::FETCH_ASSOC);
        
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
     
    private function getVacacionCompleta($idVacaciones) {
        $stmt = $this->db->prepare("
                SELECT v.*, 
                    p.IdPersonal,
                    p.NoEmpleado,
                    CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                    d.NomDepto as Departamento,
                    c.NomCargo as Cargo,
                    p.FechaIngreso,
                    p.Email as EmailEmpleado,
                    p.IdJefeInmediato
            FROM t_vacaciones v
            INNER JOIN t_personal p ON v.IdPersonal = p.IdPersonal
            INNER JOIN t_departamento d on d.IdDepartamento=p.Departamento
            INNER JOIN t_cargo c on c.IdCargo=p.Cargo
            WHERE v.IdVacaciones = :idVacaciones
        ");
        $stmt->execute([':idVacaciones' => $idVacaciones]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
     
    public function sendStatusNotification($idVacaciones, $nuevoEstatus, $comentarios = null) {
        switch ($nuevoEstatus) {
            case 1: 
                return $this->notifyAuthorization($idVacaciones, $comentarios);
            case 2:  
                return $this->notifyValidation($idVacaciones, $comentarios);
            case 3:  
                return $this->notifyCancellation($idVacaciones, $comentarios);
            case 4:  
                return $this->notifyReview($idVacaciones, $comentarios);
            default:
                return false;
        }
    }
     
    public function notifyAuthorization($idVacaciones, $comentarios = null) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "VACACIÓN AUTORIZADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('autorizacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'autorizacion',
            null,
            //$this->config['destinatarios']['rh'] --ESPERA DE REVISIÓN

            'Auxiliarsistemas3@alpasa.com.mx'
        );
        
        return true;
    } 

    public function notifyValidation($idVacaciones, $comentarios = null) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "VACACIÓN VALIDADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('validacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'validacion',
            null,
            //$this->config['destinatarios']['rh']
            
            'Auxiliarsistemas3@alpasa.com.mx'
        );
        
        return true;
    }
     
    public function notifyReview($idVacaciones, $comentarios) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = " VACACIÓN EN REVISIÓN - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('revision', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'revision',
            null,
           // $this->config['destinatarios']['rh']
           'auxiliarsistemas3@alpasa.com.mx'
        );
        
        return true;
    }
    
    public function notifyCancellation($idVacaciones, $comentarios) {
        $vacacion = $this->getVacacionCompleta($idVacaciones);
        if (!$vacacion) return false;
        
        $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
        
        $asunto = "VACACIÓN CANCELADA - {$vacacion['NombreCompleto']}";
        $cuerpo = $this->buildEmailTemplate('cancelacion', $vacacion, $jefe, $comentarios);
        
        $this->mailer->queueEmail(
            $idVacaciones,
            $jefe['Email'],
            $asunto,
            $cuerpo,
            'cancelacion',
            null,
            //$this->config['destinatarios']['rh'] 
            'Auxiliarsistemas3@alpasa.com.mx'
        );
        
        return true;
    }
     
    public function sendAdvanceNotices() { 
        $fecha15Dias = date('Y-m-d', strtotime('+15 days'));
        $fecha7Dias = date('Y-m-d', strtotime('+7 days'));
        
        $total = 0;
        $total += $this->sendAdvanceNotice($fecha15Dias, 'aviso_15_dias', 15);
        $total += $this->sendAdvanceNotice($fecha7Dias, 'aviso_7_dias', 7);
        
        return $total;
    }
     
    private function sendAdvanceNotice($fechaInicio, $tipo, $diasAntes) {
        $campoFlag = $tipo === 'aviso_15_dias' ? 'EmailEnviado15Dias' : 'EmailEnviado7Dias';
        
        $stmt = $this->db->prepare("
            SELECT v.*, 
                    p.IdPersonal,
                    p.NoEmpleado,
                    CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                    d.NomDepto as Departamento,
                    c.NomCargo as Cargo,
                    p.Email as EmailEmpleado,
                    p.IdJefeInmediato
            FROM t_vacaciones v
            INNER JOIN t_personal p ON v.IdPersonal = p.IdPersonal
            INNER JOIN t_departamento d on d.IdDepartamento=p.Departamento
            INNER JOIN t_cargo c on c.IdCargo=p.Cargo
            WHERE v.FechaInicio = :fechaInicio
            AND v.Estatus IN (1, 2)
            AND v.{$campoFlag} = 0
        ");
        $stmt->execute([':fechaInicio' => $fechaInicio]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $contador = 0;
        
        foreach ($result as $vacacion) {
            $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
            
            if (!$jefe || !$jefe['Email']) continue;
            
            $asunto = "Recordatorio: {$vacacion['NombreCompleto']} inicia vacaciones en {$diasAntes} días";
            $cuerpo = $this->buildAdvanceNoticeTemplate($vacacion, $jefe, $diasAntes);
            
            $this->mailer->queueEmail(
                $vacacion['IdVacaciones'],
                $jefe['Email'],
                $asunto,
                $cuerpo,
                $tipo,
                null,
                //$this->config['destinatarios']['rh']
                'Auxiliarsistemas3@alpasa.com.mx'
            );
             
            $updateStmt = $this->db->prepare("UPDATE t_vacaciones SET {$campoFlag} = 1 WHERE IdVacaciones = :idVacaciones");
            $updateStmt->execute([':idVacaciones' => $vacacion['IdVacaciones']]);
            
            $contador++;
        }
        
        return $contador;
    }
     
    public function checkUnvalidatedVacations() {
        $fechaActual = date('Y-m-d');
        $fechaLimiteSolicitud = date('Y-m-d', strtotime('-1 day'));
        
        $stmt = $this->db->prepare("
            SELECT v.*, 
                   p.IdPersonal,
                   p.NoEmpleado,
                   CONCAT(p.Nombre, ' ', p.ApPaterno, ' ', p.ApMaterno) as NombreCompleto,
                   d.NomDepto as Departamento,
                   c.NomCargo as Cargo,
                   p.Email as EmailEmpleado,
                   p.IdJefeInmediato
            FROM t_vacaciones v
            INNER JOIN t_personal p ON v.IdPersonal = p.IdPersonal
            INNER JOIN t_departamento d on d.IdDepartamento=p.Departamento
            INNER JOIN t_cargo c on c.IdCargo=p.Cargo
            WHERE CAST(v.FechaSolicitud AS DATE) <= :fechaLimiteSolicitud
              AND v.FechaInicio > :fechaActual
              AND v.Estatus = 1
              AND v.EmailRecordatorioRH = 0
            ORDER BY v.FechaSolicitud ASC
        ");
        $stmt->execute([
            ':fechaLimiteSolicitud' => $fechaLimiteSolicitud,
            ':fechaActual' => $fechaActual
        ]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $contador = 0;
        
        foreach ($result as $vacacion) {
            $jefe = $this->getJefeInmediato($vacacion['IdPersonal']);
             
            $fechaSolicitud = new DateTime($vacacion['FechaSolicitud']);
            $fechaActualObj = new DateTime();
            $diferencia = $fechaActualObj->diff($fechaSolicitud);
            $diasPasados = $diferencia->days;
             
            if ($diasPasados >= 1) {
                $asunto = " URGENTE: VACACIÓN AUTORIZADA pero SIN VALIDAR - {$vacacion['NombreCompleto']}";
                $cuerpo = $this->buildUnvalidatedNoticeTemplate($vacacion, $jefe, $diasPasados);
                 
                $this->mailer->queueEmail(
                    $vacacion['IdVacaciones'],
                    $this->config['destinatarios']['rh'],
                    $asunto,
                    $cuerpo,
                    'recordatorio_rh'
                );
                 
                if ($jefe && $jefe['Email']) {
                    $this->mailer->queueEmail(
                        $vacacion['IdVacaciones'],
                        $jefe['Email'],
                        $asunto,
                        $cuerpo,
                        'recordatorio_rh'
                    );
                }
                 
                $updateStmt = $this->db->prepare("UPDATE t_vacaciones SET EmailRecordatorioRH = 1 WHERE IdVacaciones = :idVacaciones");
                $updateStmt->execute([':idVacaciones' => $vacacion['IdVacaciones']]);
                
                $contador++;
            }
        }
        
        return $contador;
    }
     
    private function buildEmailTemplate($tipo, $vacacion, $jefe, $comentarios = null) {
        $titulos = [
            'autorizacion' => 'Solicitud de Vacaciones AUTORIZADA',
            'validacion' => 'Solicitud de Vacaciones VALIDADA',
            'revision' => 'Solicitud de Vacaciones EN REVISIÓN',
            'cancelacion' => 'Solicitud de Vacaciones CANCELADA'
        ];
        
        $colores = [
            'autorizacion' => '#5bc102',
            'validacion' => '#2196F3',
            'revision' => '#FF9800',
            'cancelacion' => '#F44336'
        ];
         
        $titulo = $titulos[$tipo] ?? 'Actualización de Vacaciones';
        $color = $colores[$tipo] ?? '#F57C00';
        
        $estatusTexto = $this->getStatusText($vacacion['Estatus']);
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
         
        $logoUrl = $this->config['url_base'] . 'IMG/icportada.png';
        $headerImageUrl = $this->config['url_base'] . 'IMG/LogoAlpasa.png';
        
        $html = "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 20px; 
                    background: #eef2f7; 
                }
                
                .container { 
                    max-width: 650px; 
                    margin: 0 auto; 
                }
                
                /* CARD PRINCIPAL */
                .card { 
                    background: #ffffff; 
                    border-radius: 16px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                /* HEADER CON IMAGEN DE FONDO */
                .card-header { 
                    background: linear-gradient(135deg, {$color}, " . $this->adjustBrightness($color, -30) . ");
                    padding: 0;
                    position: relative;
                    min-height: 120px;
                }
                
                .header-image {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    opacity: 0.15;
                    display: block;
                }
                
                .header-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                
                .header-content h2 { 
                    margin: 0; 
                    font-size: 24px; 
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .header-content p { 
                    margin: 5px 0 0; 
                    opacity: 0.95; 
                    font-size: 14px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                }
                
                .logo-container {
                    display: flex;
                    justify-content: center;
                    margin-top: -40px;
                    margin-bottom: 10px;
                    position: relative;
                    z-index: 2;
                }
                
                .logo-circle {
                    background: white;
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    padding: 5px;
                }
                
                .logo-circle img {
                    max-width: 70px;
                    max-height: 70px;
                    border-radius: 50%;
                }
                
                /* CUERPO DEL CARD */
                .card-body { 
                    padding: 25px 30px; 
                }
                
                .greeting {
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                
                .greeting strong {
                    color: {$color};
                }
                
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 12px; 
                    margin: 20px 0; 
                }
                
                .info-item { 
                    background: #f8f9fa; 
                    padding: 12px 15px; 
                    border-radius: 8px; 
                    border-left: 4px solid {$color}; 
                    transition: all 0.2s;
                }
                
                .info-item .label { 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    color: #888; 
                    font-weight: 600; 
                    display: block; 
                    letter-spacing: 0.5px;
                }
                
                .info-item .value { 
                    font-size: 15px; 
                    font-weight: 500; 
                    color: #333; 
                    margin-top: 2px;
                }
                
                .info-item-full { 
                    grid-column: span 2; 
                }
                
                .badge { 
                    display: inline-block; 
                    padding: 4px 14px; 
                    background: {$color}; 
                    color: white; 
                    border-radius: 20px; 
                    font-size: 12px; 
                    font-weight: bold; 
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .comentarios { 
                    background: #FFF8E1; 
                    padding: 15px 18px; 
                    border-left: 4px solid #FF9800; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                }
                
                .comentarios strong { 
                    color: #E65100; 
                }
                
                .btn-container {
                    text-align: center; 
                    margin: 25px 0 10px;
                }
                
                .btn { 
                    display: inline-block; 
                    background: {$color}; 
                    color: white; 
                    padding: 12px 35px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-weight: 600; 
                    font-size: 14px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                
                .btn:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }
                
                .footer { 
                    text-align: center; 
                    margin-top: 25px; 
                    padding-top: 20px; 
                    border-top: 1px solid #e0e0e0; 
                    font-size: 12px; 
                    color: #999; 
                }
                
                .footer p {
                    margin: 5px 0;
                }
                
                .company-name { 
                    font-weight: bold; 
                }
                
                /* Responsive */
                @media (max-width: 480px) {
                    .card-body { padding: 20px; }
                    .info-grid { grid-template-columns: 1fr; }
                    .info-item-full { grid-column: span 1; }
                    .header-content h2 { font-size: 20px; }
                    .logo-circle { width: 60px; height: 60px; }
                    .logo-circle img { max-width: 50px; max-height: 50px; }
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='card'>
                    <!-- HEADER CON IMAGEN -->
                    <div class='card-header'>
                        <img src='{$headerImageUrl}' alt='' class='header-image'>
                        <div class='header-content'>
                            <h2>{$titulo}</h2>
                            <p>Sistema de Vacaciones - <span class='company-name'>{$this->config['empresa']}</span></p>
                        </div>
                    </div>
                    
                    <!-- LOGO -->
                    <div class='logo-container'>
                        <div class='logo-circle'>
                            <img src='{$logoUrl}' alt='Logo {$this->config['empresa']}'>
                        </div>
                    </div>
                    
                    <!-- CUERPO -->
                    <div class='card-body'>
                        <p class='greeting'>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                        <p>Se ha actualizado el estatus de la solicitud de vacaciones del siguiente empleado a su cargo:</p>
                        
                        <div class='info-grid'>
                            <div class='info-item'>
                                <span class='label'>👤 Empleado</span>
                                <span class='value'>{$vacacion['NombreCompleto']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🆔 No. Empleado</span>
                                <span class='value'>{$vacacion['NoEmpleado']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🏢 Departamento</span>
                                <span class='value'>{$vacacion['Departamento']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>💼 Cargo</span>
                                <span class='value'>{$vacacion['Cargo']}</span>
                            </div>
                            <div class='info-item info-item-full'>
                                <span class='label'>📅 Período de Vacaciones</span>
                                <span class='value'>" . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . " al " . 
                                date('d/m/Y', strtotime($vacacion['FechaFin'])) . "</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>📆 Días a Tomar</span>
                                <span class='value'>{$vacacion['DiasTomar']} días</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>📊 Estatus Actual</span>
                                <span class='value'><span class='badge'>{$estatusTexto}</span></span>
                            </div>
                            <div class='info-item info-item-full'>
                                <span class='label'>📝 Fecha de Solicitud</span>
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
                        <div class='btn-container'>
                            <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                                🔍 Ver en el Sistema
                            </a>
                        </div>
                    </div>
                    
                    <!-- FOOTER -->
                    <div class='footer'>
                        <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                        <p>Por favor no responda a este correo. Si tiene dudas, contacte a RRHH.</p>
                        <p>© " . date('Y') . " - {$this->config['empresa']} | Todos los derechos reservados</p>
                    </div>
                </div>
            </div>
        </body>
        </html>";
        
        return $html;
    }
     
    private function adjustBrightness($hex, $percent) {
        $hex = ltrim($hex, '#');
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));
        
        $r = max(0, min(255, $r + $percent));
        $g = max(0, min(255, $g + $percent));
        $b = max(0, min(255, $b + $percent));
        
        return sprintf("#%02x%02x%02x", $r, $g, $b);
    }
     
    private function buildAdvanceNoticeTemplate($vacacion, $jefe, $diasAntes) {
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        
        // URL de imágenes (ajusta estas rutas según tu estructura)
        $logoUrl = $this->config['url_base'] . '/assets/images/logo.png';
        $headerImageUrl = $this->config['url_base'] . '/assets/images/email-header-blue.jpg';
        $color = '#2196F3';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 20px; 
                    background: #eef2f7; 
                }
                
                .container { 
                    max-width: 650px; 
                    margin: 0 auto; 
                }
                
                .card { 
                    background: #ffffff; 
                    border-radius: 16px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .card-header { 
                    background: linear-gradient(135deg, {$color}, #0D47A1);
                    padding: 0;
                    position: relative;
                    min-height: 120px;
                }
                
                .header-image {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    opacity: 0.15;
                    display: block;
                }
                
                .header-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                
                .header-content h2 { 
                    margin: 0; 
                    font-size: 24px; 
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .header-content p { 
                    margin: 5px 0 0; 
                    opacity: 0.95; 
                    font-size: 14px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                }
                
                .logo-container {
                    display: flex;
                    justify-content: center;
                    margin-top: -40px;
                    margin-bottom: 10px;
                    position: relative;
                    z-index: 2;
                }
                
                .logo-circle {
                    background: white;
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    padding: 5px;
                }
                
                .logo-circle img {
                    max-width: 70px;
                    max-height: 70px;
                    border-radius: 50%;
                }
                
                .card-body { 
                    padding: 25px 30px; 
                }
                
                .greeting {
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                
                .greeting strong {
                    color: {$color};
                }
                
                .highlight { 
                    background: #E3F2FD; 
                    padding: 15px 20px; 
                    border-left: 4px solid {$color}; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                }
                
                .highlight p {
                    margin: 5px 0;
                }
                
                .highlight strong {
                    color: #0D47A1;
                }
                
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 12px; 
                    margin: 15px 0; 
                }
                
                .info-item { 
                    background: #f8f9fa; 
                    padding: 12px 15px; 
                    border-radius: 8px; 
                    border-left: 4px solid {$color}; 
                }
                
                .info-item .label { 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    color: #888; 
                    font-weight: 600; 
                    display: block; 
                    letter-spacing: 0.5px;
                }
                
                .info-item .value { 
                    font-size: 15px; 
                    font-weight: 500; 
                    margin-top: 2px;
                }
                
                .info-item-full { 
                    grid-column: span 2; 
                }
                
                .action-box { 
                    background: #FFF8E1; 
                    padding: 15px 18px; 
                    border-left: 4px solid #FF9800; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                }
                
                .action-box strong { 
                    color: #E65100; 
                }
                
                .action-box ul { 
                    margin: 10px 0 0; 
                    padding-left: 20px; 
                }
                
                .action-box ul li {
                    margin: 5px 0;
                }
                
                .btn-container {
                    text-align: center; 
                    margin: 25px 0 10px;
                }
                
                .btn { 
                    display: inline-block; 
                    background: {$color}; 
                    color: white; 
                    padding: 12px 35px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-weight: 600; 
                    font-size: 14px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                }
                
                .btn:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }
                
                .footer { 
                    text-align: center; 
                    margin-top: 25px; 
                    padding-top: 20px; 
                    border-top: 1px solid #e0e0e0; 
                    font-size: 12px; 
                    color: #999; 
                }
                
                .footer p {
                    margin: 5px 0;
                }
                
                .company-name {
                    font-weight: bold;
                }
                
                @media (max-width: 480px) {
                    .card-body { padding: 20px; }
                    .info-grid { grid-template-columns: 1fr; }
                    .info-item-full { grid-column: span 1; }
                    .header-content h2 { font-size: 20px; }
                    .logo-circle { width: 60px; height: 60px; }
                    .logo-circle img { max-width: 50px; max-height: 50px; }
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='card'>
                    <!-- HEADER CON IMAGEN -->
                    <div class='card-header'>
                        <img src='{$headerImageUrl}' alt='' class='header-image'>
                        <div class='header-content'>
                            <h2>📅 Recordatorio de Vacaciones</h2>
                            <p>Sistema de Vacaciones - <span class='company-name'>{$this->config['empresa']}</span></p>
                        </div>
                    </div>
                    
                    <!-- LOGO -->
                    <div class='logo-container'>
                        <div class='logo-circle'>
                            <img src='{$logoUrl}' alt='Logo {$this->config['empresa']}'>
                        </div>
                    </div>
                    
                    <!-- CUERPO -->
                    <div class='card-body'>
                        <p class='greeting'>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                        <p>Le recordamos que el siguiente empleado a su cargo iniciará su período de vacaciones en <strong>{$diasAntes} días</strong>:</p>
                        
                        <div class='highlight'>
                            <p style='margin: 0; font-size: 16px;'>
                                <strong>📆 Fecha de inicio:</strong> " . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . "<br>
                                <strong>↩️ Fecha de retorno:</strong> " . date('d/m/Y', strtotime($vacacion['FechaRetornoLabores'])) . "
                            </p>
                        </div>
                        
                        <div class='info-grid'>
                            <div class='info-item info-item-full'>
                                <span class='label'>👤 Empleado</span>
                                <span class='value'>{$vacacion['NombreCompleto']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🆔 No. Empleado</span>
                                <span class='value'>{$vacacion['NoEmpleado']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🏢 Departamento</span>
                                <span class='value'>{$vacacion['Departamento']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>💼 Cargo</span>
                                <span class='value'>{$vacacion['Cargo']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>📊 Días</span>
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
                        
                        <div class='btn-container'>
                            <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                                🔍 Ver en el Sistema
                            </a>
                        </div>
                    </div>
                    
                    <!-- FOOTER -->
                    <div class='footer'>
                        <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                        <p>© " . date('Y') . " - {$this->config['empresa']} | Todos los derechos reservados</p>
                    </div>
                </div>
            </div>
        </body>
        </html>";
    }
     
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
            <div style='background: #FFF3E0; padding: 12px 18px; border-left: 4px solid #FF9800; margin: 15px 0; border-radius: 8px;'>
                <strong style='color: #E65100;'>⏰ ¡URGENTE! Faltan solo {$diasRestantes} días para el inicio de las vacaciones.</strong>
            </div>";
        }
         
        $logoUrl = $this->config['url_base'] . '/assets/images/logo.png';
        $headerImageUrl = $this->config['url_base'] . '/assets/images/email-header-red.jpg';
        $color = '#F44336';
        
        return "
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body { 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    line-height: 1.6; 
                    color: #333; 
                    margin: 0; 
                    padding: 20px; 
                    background: #eef2f7; 
                }
                
                .container { 
                    max-width: 650px; 
                    margin: 0 auto; 
                }
                
                .card { 
                    background: #ffffff; 
                    border-radius: 16px; 
                    box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                
                .card-header { 
                    background: linear-gradient(135deg, {$color}, #B71C1C);
                    padding: 0;
                    position: relative;
                    min-height: 120px;
                }
                
                .header-image {
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    opacity: 0.15;
                    display: block;
                }
                
                .header-content {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }
                
                .header-content h2 { 
                    margin: 0; 
                    font-size: 22px; 
                    font-weight: 700;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                .header-content p { 
                    margin: 5px 0 0; 
                    opacity: 0.95; 
                    font-size: 14px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.15);
                }
                
                .logo-container {
                    display: flex;
                    justify-content: center;
                    margin-top: -40px;
                    margin-bottom: 10px;
                    position: relative;
                    z-index: 2;
                }
                
                .logo-circle {
                    background: white;
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    padding: 5px;
                }
                
                .logo-circle img {
                    max-width: 70px;
                    max-height: 70px;
                    border-radius: 50%;
                }
                
                .card-body { 
                    padding: 25px 30px; 
                }
                
                .greeting {
                    font-size: 16px;
                    margin-bottom: 15px;
                }
                
                .greeting strong {
                    color: {$color};
                }
                
                .urgent-box { 
                    background: #FFEBEE; 
                    padding: 18px 20px; 
                    border-left: 5px solid #F44336; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                }
                
                .urgent-box h3 { 
                    margin: 0 0 10px 0; 
                    color: #C62828; 
                }
                
                .urgent-box .highlight { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: #C62828; 
                }
                
                .dias-pasados { 
                    background: #F44336; 
                    color: white; 
                    padding: 4px 14px; 
                    border-radius: 20px; 
                    font-weight: bold; 
                    font-size: 14px;
                    display: inline-block;
                }
                
                .info-grid { 
                    display: grid; 
                    grid-template-columns: 1fr 1fr; 
                    gap: 12px; 
                    margin: 15px 0; 
                }
                
                .info-item { 
                    background: #f8f9fa; 
                    padding: 12px 15px; 
                    border-radius: 8px; 
                    border-left: 4px solid {$color}; 
                }
                
                .info-item .label { 
                    font-size: 11px; 
                    text-transform: uppercase; 
                    color: #888; 
                    font-weight: 600; 
                    display: block; 
                    letter-spacing: 0.5px;
                }
                
                .info-item .value { 
                    font-size: 15px; 
                    font-weight: 500; 
                    margin-top: 2px;
                }
                
                .info-item-full { 
                    grid-column: span 2; 
                }
                
                .status-badge { 
                    display: inline-block; 
                    padding: 4px 14px; 
                    background: #4CAF50; 
                    color: white; 
                    border-radius: 20px; 
                    font-size: 13px; 
                    font-weight: bold; 
                }
                
                .info-autorizacion { 
                    background: #E8F5E9; 
                    padding: 12px 18px; 
                    border-left: 4px solid #4CAF50; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                }
                
                .info-autorizacion strong {
                    color: #1B5E20;
                }
                
                .warning-box { 
                    background: #FFF8E1; 
                    padding: 12px 18px; 
                    border-left: 4px solid #FFC107; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                }
                
                .warning-box strong {
                    color: #795548;
                }
                
                .action-box { 
                    background: #FFF3E0; 
                    padding: 15px 18px; 
                    border-left: 4px solid #FF9800; 
                    margin: 20px 0; 
                    border-radius: 8px; 
                }
                
                .action-box strong { 
                    color: #E65100; 
                }
                
                .action-box ul { 
                    margin: 10px 0 0; 
                    padding-left: 20px; 
                }
                
                .action-box ul li {
                    margin: 5px 0;
                }
                
                .btn-container {
                    text-align: center; 
                    margin: 25px 0 10px;
                }
                
                .btn { 
                    display: inline-block; 
                    background: {$color}; 
                    color: white; 
                    padding: 12px 35px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-weight: 600; 
                    font-size: 14px;
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                    margin: 0 5px;
                }
                
                .btn:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.2);
                }
                
                .btn-secondary { 
                    display: inline-block; 
                    background: #9E9E9E; 
                    color: white; 
                    padding: 12px 25px; 
                    text-decoration: none; 
                    border-radius: 50px; 
                    font-weight: 500; 
                    font-size: 14px;
                    transition: all 0.3s;
                    margin: 0 5px;
                }
                
                .btn-secondary:hover { 
                    opacity: 0.9; 
                    transform: translateY(-2px);
                }
                
                .note-box { 
                    background: #FFF8E1; 
                    padding: 12px 18px; 
                    border-radius: 8px; 
                    margin-top: 15px; 
                    font-size: 13px; 
                    color: #795548;
                    border: 1px solid #FFE0B2;
                }
                
                .footer { 
                    text-align: center; 
                    margin-top: 25px; 
                    padding-top: 20px; 
                    border-top: 1px solid #e0e0e0; 
                    font-size: 12px; 
                    color: #999; 
                }
                
                .footer p {
                    margin: 5px 0;
                }
                
                .company-name {
                    font-weight: bold;
                }
                
                @media (max-width: 480px) {
                    .card-body { padding: 20px; }
                    .info-grid { grid-template-columns: 1fr; }
                    .info-item-full { grid-column: span 1; }
                    .header-content h2 { font-size: 18px; }
                    .logo-circle { width: 60px; height: 60px; }
                    .logo-circle img { max-width: 50px; max-height: 50px; }
                    .btn, .btn-secondary { 
                        display: block; 
                        margin: 10px auto; 
                        width: 80%; 
                    }
                }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='card'>
                    <!-- HEADER CON IMAGEN -->
                    <div class='card-header'>
                        <img src='{$headerImageUrl}' alt='' class='header-image'>
                        <div class='header-content'>
                            <h2>🚨 ALERTA: Vacación Autorizada pero NO Validada</h2>
                            <p>Sistema de Vacaciones - <span class='company-name'>{$this->config['empresa']}</span></p>
                        </div>
                    </div>
                    
                    <!-- LOGO -->
                    <div class='logo-container'>
                        <div class='logo-circle'>
                            <img src='{$logoUrl}' alt='Logo {$this->config['empresa']}'>
                        </div>
                    </div>
                    
                    <!-- CUERPO -->
                    <div class='card-body'>
                        <p class='greeting'>Estimado(a) <strong>{$nombreJefe}</strong>,</p>
                        
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
                            <strong>✅ Información de Autorización:</strong><br>
                            <span>Autorizado por: <strong>{$usuarioAutoriza}</strong></span><br>
                            <span>Fecha de autorización: <strong>{$fechaAutoriza}</strong></span>
                        </div>
                        
                        <div class='warning-box'>
                            <strong>ℹ️ IMPORTANTE:</strong>
                            <span>La validación debe realizarse ANTES de la fecha de inicio de las vacaciones.</span>
                        </div>
                        
                        <div class='info-grid'>
                            <div class='info-item info-item-full'>
                                <span class='label'>👤 Empleado</span>
                                <span class='value'>{$nombreEmpleado}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🆔 No. Empleado</span>
                                <span class='value'>{$vacacion['NoEmpleado']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>🏢 Departamento</span>
                                <span class='value'>{$vacacion['Departamento']}</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>💼 Cargo</span>
                                <span class='value'>{$vacacion['Cargo']}</span>
                            </div>
                            <div class='info-item info-item-full'>
                                <span class='label'>📅 Período de Vacaciones</span>
                                <span class='value'>" . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . " al " . 
                                date('d/m/Y', strtotime($vacacion['FechaFin'])) . "</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>📆 Días a Tomar</span>
                                <span class='value'>{$vacacion['DiasTomar']} días</span>
                            </div>
                            <div class='info-item'>
                                <span class='label'>📝 Fecha de Solicitud</span>
                                <span class='value'><strong>{$fechaSolicitud}</strong></span>
                            </div>
                            <div class='info-item info-item-full'>
                                <span class='label'>📊 Estatus Actual</span>
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
                        
                        <div class='btn-container'>
                            <a href='{$this->config['url_base']}/vacaciones' class='btn'>
                                🔍 Ir a Validar Solicitud
                            </a>
                            <a href='{$this->config['url_base']}/vacaciones' class='btn-secondary'>
                                📋 Ver todas
                            </a>
                        </div>
                        
                        <div class='note-box'>
                            <strong>💡 Nota:</strong> Esta alerta se genera automáticamente cuando una solicitud de vacaciones 
                            ha sido <strong>AUTORIZADA</strong> hace más de 1 día pero <strong>NO VALIDADA</strong>, 
                            y la fecha de inicio es FUTURA.
                        </div>
                    </div>
                    
                    <!-- FOOTER -->
                    <div class='footer'>
                        <p>Este es un mensaje automático del Sistema de Vacaciones de {$this->config['empresa']}.</p>
                        <p>Si ya validó esta solicitud, ignore este mensaje.</p>
                        <p>© " . date('Y') . " - {$this->config['empresa']} | Todos los derechos reservados</p>
                    </div>
                </div>
            </div>
        </body>
        </html>";
    }
     
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
     
    public function getNotificationStats() {
        $stats = [];
         
        $queueStats = $this->mailer->getQueueStats();
        $stats['queue'] = $queueStats;
         
        $stmt = $this->db->query("
            SELECT Estatus, COUNT(*) as total 
            FROM t_vacaciones 
            GROUP BY Estatus
        ");
        $statusCounts = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $statusCounts[$row['Estatus']] = (int)$row['total'];
        }
        $stats['vacaciones_por_estatus'] = $statusCounts;
         
        $stmt = $this->db->query("
            SELECT COUNT(*) as total 
            FROM email_logs 
            WHERE CAST(FechaEnvio AS DATE) = CAST(GETDATE() AS DATE)
        ");
        $stats['envios_hoy'] = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        return $stats;
    }
}