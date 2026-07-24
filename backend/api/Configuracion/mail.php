<?php 
return [
    'smtp' => [
        'host' => 'smtp-mail.outlook.com', 
        'port' => 587,
        'username' => 'noreply@alpasa.com.mx',
        'password' => 'Baf81593',
        'from_email' => 'noreply@alpasa.com.mx',
        'from_name' => 'Sistema de Vacaciones - Alpasa',
    ],
     'destinatarios' => [
         'rh' => 'auxiliarsistemas3@alpasa.com.mx',
         'rh_alterno' => 'auxiliarsistemas3@alpasa.com.mx',
    ],
    'url_base' => 'https://intranet.alpasamx.com/SistemaVacaciones/dist',
    
    'url_base_img' => 'https://intranet.alpasamx.com/SistemaVacaciones/backend/api/Includes/',
    'empresa' => 'Alpasa',
    'max_intentos' => 3,
    'limite_por_ciclo' => 50,
];