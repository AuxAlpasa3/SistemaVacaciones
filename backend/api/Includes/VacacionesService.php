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
            'autorizacion' => '#28A745',
            'validacion' => '#007BFF',
            'revision' => '#FF8C00',
            'cancelacion' => '#DC3545'
        ];
        
        $coloresHover = [
            'autorizacion' => '#218838',
            'validacion' => '#0069D9',
            'revision' => '#E67E00',
            'cancelacion' => '#C82333'
        ];
         
        $titulo = $titulos[$tipo] ?? 'Actualización de Vacaciones';
        $color = $colores[$tipo] ?? '#FF8C00';
        $colorHover = $coloresHover[$tipo] ?? '#E67E00';
        
        $estatusTexto = $this->getStatusText($vacacion['Estatus']);
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        $logoUrl = $this->config['url_base_img'] . 'IMG/LogoAlpasa.png';
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>' . $titulo . '</title>
            <!--[if (gte mso 9)|(IE)]>
            <style type="text/css">
                table {border-collapse: collapse;}
                .btn {border-radius: 50px !important;}
            </style>
            <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #E8ECF1; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
            
            <!--[if (gte mso 9)|(IE)]>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #E8ECF1;">
                <tr>
                    <td align="center">
            <![endif]-->
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8ECF1; min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 30px 15px;">
                        
                        <!-- CARD PRINCIPAL -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            
                            <!-- HEADER -->
                            <tr>
                                <td style="padding: 30px 30px 20px; text-align: center; background-color: ' . $color . '; border-radius: 12px 12px 0 0; background: linear-gradient(135deg, ' . $color . ', ' . $colorHover . '); mso-background-color: ' . $color . ';">
                                    
                                    <!-- Logo -->
                                    <img src="' . $logoUrl . '" width="200" alt="ALPASA" style="display: block; margin: 0 auto 10px; max-width: 200px; height: auto; border: 0; outline: none; text-decoration: none;">
                                    
                                    <!-- Título -->
                                    <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; margin: 10px 0 5px; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                        ' . $titulo . '
                                    </div>
                                    
                                    <!-- Subtítulo -->
                                    <div style="font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 400; letter-spacing: 0.3px;">
                                        Sistema de Gestión de Vacaciones
                                    </div>
                                    
                                    <!-- Línea decorativa -->
                                    <div style="width: 50px; height: 3px; background-color: rgba(255,255,255,0.3); margin: 12px auto 0; border-radius: 2px;"></div>
                                    
                                </td>
                            </tr>
                            
                            <!-- CUERPO -->
                            <tr>
                                <td style="padding: 30px 30px 25px; background-color: #FFFFFF;">
                                    
                                    <!-- Saludo -->
                                    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #333333;">
                                        Estimado(a) <strong style="color: ' . $color . ';">' . $nombreJefe . '</strong>,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
                                        Se ha actualizado el estatus de la solicitud de vacaciones del siguiente empleado a su cargo:
                                    </p>
                                    
                                    <!-- TABLA DE INFORMACIÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; border: 1px solid #E9ECEF; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                
                                                <!-- Empleado -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0 0 5px 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Empleado</div>
                                                            <div style="font-size: 16px; font-weight: 600; color: #222;">' . $vacacion['NombreCompleto'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- No. Empleado y Departamento -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">No. Empleado</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['NoEmpleado'] . '</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Departamento</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Departamento'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Cargo -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Cargo</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Cargo'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Separador -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 8px 0; border-bottom: 1px dashed #E0E0E0;"></td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Período de Vacaciones -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px; margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Período de Vacaciones</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . ' al ' . date('d/m/Y', strtotime($vacacion['FechaFin'])) . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Días a Tomar y Estatus -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Días a Tomar</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['DiasTomar'] . ' días</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Estatus Actual</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333; margin-top: 2px;">
                                                                <span style="display: inline-block; padding: 4px 16px; background-color: ' . $color . '; color: #FFFFFF; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">' . $estatusTexto . '</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Fecha de Solicitud -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Fecha de Solicitud</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . date('d/m/Y', strtotime($vacacion['FechaSolicitud'])) . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                            </td>
                                        </tr>
                                    </table>';
    
        if ($comentarios) {
            $html .= '
                                    <!-- COMENTARIOS -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8E1; border-radius: 8px; border-left: 4px solid #FF9800; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 14px 18px;">
                                                <div style="font-size: 12px; font-weight: 700; color: #E65100; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Comentarios</div>
                                                <div style="font-size: 14px; color: #333; line-height: 1.5;">' . $comentarios . '</div>
                                            </td>
                                        </tr>
                                    </table>';
        }
    
        $html .= '
                                    <!-- DESPEDIDA -->
                                    <p style="margin: 0 0 5px; font-size: 15px; color: #333333;">
                                        Atentamente,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; color: #333333; font-weight: 600;">
                                        El equipo de ALPASA
                                    </p>
                                    
                                    <!-- BOTÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="padding: 5px 0 10px;">
                                                <!--[if (gte mso 9)|(IE)]>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                                    <tr>
                                                        <td align="center" bgcolor="' . $color . '" style="border-radius: 50px; padding: 0;">
                                                <![endif]-->
                                                <a href="' . $this->config['url_base'] . '/vacaciones" 
                                                   target="_blank"
                                                   style="display: inline-block;
                                                          background-color: ' . $color . ';
                                                          color: #FFFFFF;
                                                          padding: 14px 40px;
                                                          font-family: Arial, Helvetica, sans-serif;
                                                          font-size: 15px;
                                                          font-weight: 700;
                                                          text-decoration: none;
                                                          border-radius: 50px;
                                                          text-align: center;
                                                          letter-spacing: 0.5px;
                                                          border: none;
                                                          mso-padding-alt: 14px 40px;
                                                          mso-line-height-alt: 22px;
                                                          box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                                    Ver en el Sistema
                                                </a>
                                                <!--[if (gte mso 9)|(IE)]>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <![endif]-->
                                            </td>
                                        </tr>
                                    </table>
                                    
                                </td>
                            </tr>
                            
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 20px 30px; text-align: center; background-color: #F8F9FA; border-radius: 0 0 12px 12px; border-top: 1px solid #E9ECEF;">
                                    
                                    <div style="font-size: 11px; line-height: 1.6; color: #888888;">
                                        <p style="margin: 0 0 8px;">
                                            Este es un mensaje automático del Sistema de Vacaciones de ALPASA.
                                        </p>
                                        <p style="margin: 0 0 8px;">
                                            Por favor no responda a este correo. Si tiene dudas, contacte a RRHH.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            En cumplimiento a lo previsto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, 
                                            consulte nuestro aviso de privacidad en 
                                            <a href="https://www.alpasa.mx/politica-de-privacidad" 
                                               style="color: ' . $color . '; text-decoration: underline;">alpasa.mx/politica-de-privacidad</a>.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            La información contenida en este correo electrónico es privilegiada y confidencial y para uso exclusivo de los destinatarios.
                                        </p>
                                        <p style="margin: 10px 0 0; font-size: 11px; color: #999999; font-weight: 600;">
                                            &copy; ' . date('Y') . ' ALPASA - Todos los derechos reservados
                                        </p>
                                    </div>
                                    
                                </td>
                            </tr>
                            
                        </table>
                        
                    </td>
                </tr>
            </table>
            
            <!--[if (gte mso 9)|(IE)]>
                    </td>
                </tr>
            </table>
            <![endif]-->
            
        </body>
        </html>';
        
        return $html;
    }
     
    private function buildAdvanceNoticeTemplate($vacacion, $jefe, $diasAntes) {
        $nombreJefe = $jefe['NombreCompleto'] ?? 'Jefe';
        $color = '#2196F3';
        $colorHover = '#1976D2';
        $logoUrl = $this->config['url_base_img'] . 'IMG/LogoAlpasa.png';
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Recordatorio de Vacaciones</title>
            <!--[if (gte mso 9)|(IE)]>
            <style type="text/css">
                table {border-collapse: collapse;}
                .btn {border-radius: 50px !important;}
            </style>
            <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #E8ECF1; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
            
            <!--[if (gte mso 9)|(IE)]>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #E8ECF1;">
                <tr>
                    <td align="center">
            <![endif]-->
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8ECF1; min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 30px 15px;">
                        
                        <!-- CARD PRINCIPAL -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            
                            <!-- HEADER -->
                            <tr>
                                <td style="padding: 30px 30px 20px; text-align: center; background-color: ' . $color . '; border-radius: 12px 12px 0 0; background: linear-gradient(135deg, ' . $color . ', ' . $colorHover . '); mso-background-color: ' . $color . ';">
                                    
                                    <!-- Logo -->
                                    <img src="' . $logoUrl . '" width="200" alt="ALPASA" style="display: block; margin: 0 auto 10px; max-width: 200px; height: auto; border: 0; outline: none; text-decoration: none;">
                                    
                                    <!-- Título -->
                                    <div style="font-size: 20px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; margin: 10px 0 5px; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                        Recordatorio de Vacaciones
                                    </div>
                                    
                                    <!-- Subtítulo -->
                                    <div style="font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 400; letter-spacing: 0.3px;">
                                        Sistema de Gestión de Vacaciones
                                    </div>
                                    
                                    <!-- Línea decorativa -->
                                    <div style="width: 50px; height: 3px; background-color: rgba(255,255,255,0.3); margin: 12px auto 0; border-radius: 2px;"></div>
                                    
                                </td>
                            </tr>
                            
                            <!-- CUERPO -->
                            <tr>
                                <td style="padding: 30px 30px 25px; background-color: #FFFFFF;">
                                    
                                    <!-- Saludo -->
                                    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #333333;">
                                        Estimado(a) <strong style="color: ' . $color . ';">' . $nombreJefe . '</strong>,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #555555;">
                                        Le recordamos que el siguiente empleado a su cargo iniciará su período de vacaciones en <strong style="color: ' . $color . ';">' . $diasAntes . ' días</strong>:
                                    </p>
                                    
                                    <!-- FECHAS DESTACADAS -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E3F2FD; border-radius: 8px; border-left: 4px solid ' . $color . '; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #1565C0; font-weight: 700; letter-spacing: 0.5px;">Fecha de Inicio</div>
                                                            <div style="font-size: 16px; font-weight: 600; color: #0D47A1;">' . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . '</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #1565C0; font-weight: 700; letter-spacing: 0.5px;">Fecha de Retorno</div>
                                                            <div style="font-size: 16px; font-weight: 600; color: #0D47A1;">' . date('d/m/Y', strtotime($vacacion['FechaRetornoLabores'])) . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- TABLA DE INFORMACIÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; border: 1px solid #E9ECEF; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                
                                                <!-- Empleado -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0 0 5px 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Empleado</div>
                                                            <div style="font-size: 16px; font-weight: 600; color: #222;">' . $vacacion['NombreCompleto'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- No. Empleado y Departamento -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">No. Empleado</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['NoEmpleado'] . '</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Departamento</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Departamento'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Cargo y Días -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Cargo</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Cargo'] . '</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Días a Tomar</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['DiasTomar'] . ' días</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- ACCIONES RECOMENDADAS -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8E1; border-radius: 8px; border-left: 4px solid #FF9800; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                <div style="font-size: 13px; font-weight: 700; color: #E65100; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Acciones Recomendadas</div>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Asegurar la entrega de responsabilidades del empleado
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Actualizar el calendario de ausencias del departamento
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Verificar la cobertura de sus funciones durante su ausencia
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- DESPEDIDA -->
                                    <p style="margin: 0 0 5px; font-size: 15px; color: #333333;">
                                        Atentamente,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; color: #333333; font-weight: 600;">
                                        El equipo de ALPASA
                                    </p>
                                    
                                    <!-- BOTÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="padding: 5px 0 10px;">
                                                <!--[if (gte mso 9)|(IE)]>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                                    <tr>
                                                        <td align="center" bgcolor="' . $color . '" style="border-radius: 50px; padding: 0;">
                                                <![endif]-->
                                                <a href="' . $this->config['url_base'] . '/vacaciones" 
                                                   target="_blank"
                                                   style="display: inline-block;
                                                          background-color: ' . $color . ';
                                                          color: #FFFFFF;
                                                          padding: 14px 40px;
                                                          font-family: Arial, Helvetica, sans-serif;
                                                          font-size: 15px;
                                                          font-weight: 700;
                                                          text-decoration: none;
                                                          border-radius: 50px;
                                                          text-align: center;
                                                          letter-spacing: 0.5px;
                                                          border: none;
                                                          mso-padding-alt: 14px 40px;
                                                          mso-line-height-alt: 22px;
                                                          box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                                    Ver en el Sistema
                                                </a>
                                                <!--[if (gte mso 9)|(IE)]>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <![endif]-->
                                            </td>
                                        </tr>
                                    </table>
                                    
                                </td>
                            </tr>
                            
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 20px 30px; text-align: center; background-color: #F8F9FA; border-radius: 0 0 12px 12px; border-top: 1px solid #E9ECEF;">
                                    
                                    <div style="font-size: 11px; line-height: 1.6; color: #888888;">
                                        <p style="margin: 0 0 8px;">
                                            Este es un mensaje automático del Sistema de Vacaciones de ALPASA.
                                        </p>
                                        <p style="margin: 0 0 8px;">
                                            Por favor no responda a este correo. Si tiene dudas, contacte a RRHH.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            En cumplimiento a lo previsto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, 
                                            consulte nuestro aviso de privacidad en 
                                            <a href="https://www.alpasa.mx/politica-de-privacidad" 
                                               style="color: ' . $color . '; text-decoration: underline;">alpasa.mx/politica-de-privacidad</a>.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            La información contenida en este correo electrónico es privilegiada y confidencial y para uso exclusivo de los destinatarios.
                                        </p>
                                        <p style="margin: 10px 0 0; font-size: 11px; color: #999999; font-weight: 600;">
                                            &copy; ' . date('Y') . ' ALPASA - Todos los derechos reservados
                                        </p>
                                    </div>
                                    
                                </td>
                            </tr>
                            
                        </table>
                        
                    </td>
                </tr>
            </table>
            
            <!--[if (gte mso 9)|(IE)]>
                    </td>
                </tr>
            </table>
            <![endif]-->
            
        </body>
        </html>';
        
        return $html;
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
        
        $color = '#F44336';
        $colorHover = '#C62828';
        $logoUrl = $this->config['url_base_img'] . 'IMG/LogoAlpasaBlanco.png';
        
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>ALERTA: Vacación Autorizada pero NO Validada</title>
            <!--[if (gte mso 9)|(IE)]>
            <style type="text/css">
                table {border-collapse: collapse;}
                .btn {border-radius: 50px !important;}
            </style>
            <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #E8ECF1; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
            
            <!--[if (gte mso 9)|(IE)]>
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #E8ECF1;">
                <tr>
                    <td align="center">
            <![endif]-->
            
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8ECF1; min-height: 100vh;">
                <tr>
                    <td align="center" style="padding: 30px 15px;">
                        
                        <!-- CARD PRINCIPAL -->
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            
                            <!-- HEADER -->
                            <tr>
                                <td style="padding: 30px 30px 20px; text-align: center; background-color: ' . $color . '; border-radius: 12px 12px 0 0; background: linear-gradient(135deg, ' . $color . ', ' . $colorHover . '); mso-background-color: ' . $color . ';">
                                    
                                    <!-- Logo -->
                                    <img src="' . $logoUrl . '" width="200" alt="ALPASA" style="display: block; margin: 0 auto 10px; max-width: 200px; height: auto; border: 0; outline: none; text-decoration: none;">
                                    
                                    <!-- Título -->
                                    <div style="font-size: 18px; font-weight: 700; color: #FFFFFF; letter-spacing: 0.5px; margin: 10px 0 5px; text-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                                        ALERTA: Vacación Autorizada pero NO Validada
                                    </div>
                                    
                                    <!-- Subtítulo -->
                                    <div style="font-size: 13px; color: rgba(255,255,255,0.9); font-weight: 400; letter-spacing: 0.3px;">
                                        Sistema de Gestión de Vacaciones
                                    </div>
                                    
                                    <!-- Línea decorativa -->
                                    <div style="width: 50px; height: 3px; background-color: rgba(255,255,255,0.3); margin: 12px auto 0; border-radius: 2px;"></div>
                                    
                                </td>
                            </tr>
                            
                            <!-- CUERPO -->
                            <tr>
                                <td style="padding: 30px 30px 25px; background-color: #FFFFFF;">
                                    
                                    <!-- Saludo -->
                                    <p style="margin: 0 0 12px; font-size: 15px; line-height: 1.6; color: #333333;">
                                        Estimado(a) <strong style="color: ' . $color . ';">' . $nombreJefe . '</strong>,
                                    </p>
                                    
                                    <!-- ALERTA URGENTE -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFEBEE; border-radius: 8px; border-left: 5px solid #F44336; margin-bottom: 15px;">
                                        <tr>
                                            <td style="padding: 18px 20px;">
                                                <div style="font-size: 16px; font-weight: 700; color: #C62828; margin-bottom: 8px;">ATENCION - ACCION REQUERIDA</div>
                                                <p style="margin: 0; font-size: 14px; color: #333; line-height: 1.6;">
                                                    La solicitud de vacaciones de <strong style="color: #C62828;">' . $nombreEmpleado . '</strong> fue <strong>AUTORIZADA</strong> hace <strong style="color: #C62828;">' . $diasPasados . ' día(s)</strong> 
                                                    pero aun <strong style="color: #C62828;">NO HA SIDO VALIDADA</strong> por RRHH.
                                                </p>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0;">
                                                            <span style="display: inline-block; background-color: #F44336; color: #FFFFFF; padding: 4px 16px; border-radius: 20px; font-size: 13px; font-weight: 700;">' . $diasPasados . ' días desde la solicitud</span>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px;">
                                                            <span style="font-size: 14px; color: #333;">Inicia: <strong>' . $fechaInicio . '</strong></span>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>';
        
        if ($diasRestantes <= 3) {
            $html .= '
                                    <!-- MENSAJE DE URGENCIA -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF3E0; border-radius: 8px; border-left: 4px solid #FF9800; margin-bottom: 15px;">
                                        <tr>
                                            <td style="padding: 12px 18px;">
                                                <div style="font-size: 14px; font-weight: 700; color: #E65100;">URGENTE - Faltan solo ' . $diasRestantes . ' dias para el inicio de las vacaciones</div>
                                            </td>
                                        </tr>
                                    </table>';
        }
        
        $html .= '
                                    <!-- INFORMACIÓN DE AUTORIZACIÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #E8F5E9; border-radius: 8px; border-left: 4px solid #4CAF50; margin-bottom: 15px;">
                                        <tr>
                                            <td style="padding: 12px 18px;">
                                                <div style="font-size: 13px; font-weight: 700; color: #1B5E20; margin-bottom: 4px;">Informacion de Autorizacion</div>
                                                <div style="font-size: 14px; color: #333; line-height: 1.5;">
                                                    Autorizado por: <strong>' . $usuarioAutoriza . '</strong><br>
                                                    Fecha de autorizacion: <strong>' . $fechaAutoriza . '</strong>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- AVISO IMPORTANTE -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8E1; border-radius: 8px; border-left: 4px solid #FFC107; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 12px 18px;">
                                                <div style="font-size: 14px; color: #795548;">
                                                    <strong>IMPORTANTE:</strong> La validacion debe realizarse ANTES de la fecha de inicio de las vacaciones.
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- TABLA DE INFORMACIÓN -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; border-radius: 8px; border: 1px solid #E9ECEF; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                
                                                <!-- Empleado -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0 0 5px 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Empleado</div>
                                                            <div style="font-size: 16px; font-weight: 600; color: #222;">' . $nombreEmpleado . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- No. Empleado y Departamento -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">No. Empleado</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['NoEmpleado'] . '</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Departamento</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Departamento'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Cargo -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Cargo</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['Cargo'] . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Separador -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 8px 0; border-bottom: 1px dashed #E0E0E0;"></td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Período de Vacaciones -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 10px; margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Periodo de Vacaciones</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . date('d/m/Y', strtotime($vacacion['FechaInicio'])) . ' al ' . date('d/m/Y', strtotime($vacacion['FechaFin'])) . '</div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Días a Tomar y Estatus -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 10px;">
                                                    <tr>
                                                        <td width="50%" style="padding: 0 10px 0 0; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Dias a Tomar</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;">' . $vacacion['DiasTomar'] . ' dias</div>
                                                        </td>
                                                        <td width="50%" style="padding: 0 0 0 10px; vertical-align: top;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Fecha de Solicitud</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333;"><strong>' . $fechaSolicitud . '</strong></div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                                <!-- Estatus Actual -->
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td width="100%" style="padding: 0;">
                                                            <div style="font-size: 11px; text-transform: uppercase; color: #888; font-weight: 700; letter-spacing: 0.5px;">Estatus Actual</div>
                                                            <div style="font-size: 15px; font-weight: 500; color: #333; margin-top: 2px;">
                                                                <span style="display: inline-block; padding: 4px 16px; background-color: ' . $color . '; color: #FFFFFF; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap;">' . $estadoTexto . '</span>
                                                                <span style="margin-left: 10px; font-size: 13px; color: #888;">(Autorizada - Pendiente de Validacion)</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                                
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- ACCIONES REQUERIDAS -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF3E0; border-radius: 8px; border-left: 4px solid #FF9800; margin-bottom: 20px;">
                                        <tr>
                                            <td style="padding: 15px 18px;">
                                                <div style="font-size: 13px; font-weight: 700; color: #E65100; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Acciones Requeridas - RRHH</div>
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> <strong>Validar</strong> la solicitud de vacaciones en el sistema
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Verificar que el empleado cumpla con los requisitos
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Confirmar la disponibilidad de dias
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 3px 0; font-size: 14px; color: #333; line-height: 1.5;">
                                                            <span style="color: #FF9800; font-weight: bold; margin-right: 6px;">•</span> Revisar que no afecte las operaciones del departamento
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- DESPEDIDA -->
                                    <p style="margin: 0 0 5px; font-size: 15px; color: #333333;">
                                        Atentamente,
                                    </p>
                                    <p style="margin: 0 0 20px; font-size: 15px; color: #333333; font-weight: 600;">
                                        El equipo de ALPASA
                                    </p>
                                    
                                    <!-- BOTONES -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                        <tr>
                                            <td align="center" style="padding: 5px 0 10px;">
                                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                                    <tr>
                                                        <td style="padding: 0 5px 5px;">
                                                            <!--[if (gte mso 9)|(IE)]>
                                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                                                <tr>
                                                                    <td align="center" bgcolor="' . $color . '" style="border-radius: 50px; padding: 0;">
                                                            <![endif]-->
                                                            <a href="' . $this->config['url_base'] . '/vacaciones" 
                                                               target="_blank"
                                                               style="display: inline-block;
                                                                      background-color: ' . $color . ';
                                                                      color: #FFFFFF;
                                                                      padding: 14px 35px;
                                                                      font-family: Arial, Helvetica, sans-serif;
                                                                      font-size: 14px;
                                                                      font-weight: 700;
                                                                      text-decoration: none;
                                                                      border-radius: 50px;
                                                                      text-align: center;
                                                                      letter-spacing: 0.5px;
                                                                      border: none;
                                                                      mso-padding-alt: 14px 35px;
                                                                      mso-line-height-alt: 22px;
                                                                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                                                                Ir a Validar Solicitud
                                                            </a>
                                                            <!--[if (gte mso 9)|(IE)]>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <![endif]-->
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td style="padding: 5px 5px 0;">
                                                            <!--[if (gte mso 9)|(IE)]>
                                                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
                                                                <tr>
                                                                    <td align="center" bgcolor="#9E9E9E" style="border-radius: 50px; padding: 0;">
                                                            <![endif]-->
                                                            <a href="' . $this->config['url_base'] . '/vacaciones" 
                                                               target="_blank"
                                                               style="display: inline-block;
                                                                      background-color: #9E9E9E;
                                                                      color: #FFFFFF;
                                                                      padding: 10px 25px;
                                                                      font-family: Arial, Helvetica, sans-serif;
                                                                      font-size: 13px;
                                                                      font-weight: 600;
                                                                      text-decoration: none;
                                                                      border-radius: 50px;
                                                                      text-align: center;
                                                                      letter-spacing: 0.5px;
                                                                      border: none;
                                                                      mso-padding-alt: 10px 25px;
                                                                      mso-line-height-alt: 20px;">
                                                                Ver todas
                                                            </a>
                                                            <!--[if (gte mso 9)|(IE)]>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                            <![endif]-->
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- NOTA -->
                                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8E1; border-radius: 8px; border: 1px solid #FFE0B2; margin-top: 15px;">
                                        <tr>
                                            <td style="padding: 12px 18px;">
                                                <div style="font-size: 12px; color: #795548; line-height: 1.5;">
                                                    <strong>Nota:</strong> Esta alerta se genera automaticamente cuando una solicitud de vacaciones 
                                                    ha sido <strong>AUTORIZADA</strong> hace mas de 1 dia pero <strong>NO VALIDADA</strong>, 
                                                    y la fecha de inicio es FUTURA.
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                </td>
                            </tr>
                            
                            <!-- FOOTER -->
                            <tr>
                                <td style="padding: 20px 30px; text-align: center; background-color: #F8F9FA; border-radius: 0 0 12px 12px; border-top: 1px solid #E9ECEF;">
                                    
                                    <div style="font-size: 11px; line-height: 1.6; color: #888888;">
                                        <p style="margin: 0 0 8px;">
                                            Este es un mensaje automatico del Sistema de Vacaciones de ALPASA.
                                        </p>
                                        <p style="margin: 0 0 8px; font-weight: 600; color: #F44336;">
                                            Si ya valido esta solicitud, ignore este mensaje.
                                        </p>
                                        <p style="margin: 0 0 8px;">
                                            Por favor no responda a este correo. Si tiene dudas, contacte a RRHH.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            En cumplimiento a lo previsto en la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares, 
                                            consulte nuestro aviso de privacidad en 
                                            <a href="https://www.alpasa.mx/politica-de-privacidad" 
                                               style="color: ' . $color . '; text-decoration: underline;">alpasa.mx/politica-de-privacidad</a>.
                                        </p>
                                        <p style="margin: 0 0 8px; font-size: 10px; color: #AAAAAA;">
                                            La informacion contenida en este correo electronico es privilegiada y confidencial y para uso exclusivo de los destinatarios.
                                        </p>
                                        <p style="margin: 10px 0 0; font-size: 11px; color: #999999; font-weight: 600;">
                                            &copy; ' . date('Y') . ' ALPASA - Todos los derechos reservados
                                        </p>
                                    </div>
                                    
                                </td>
                            </tr>
                            
                        </table>
                        
                    </td>
                </tr>
            </table>
            
            <!--[if (gte mso 9)|(IE)]>
                    </td>
                </tr>
            </table>
            <![endif]-->
            
        </body>
        </html>';
        
        return $html;
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