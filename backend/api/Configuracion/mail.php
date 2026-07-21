<?php 
return [
    'smtp' => [
        'host' => 'smtp.office365.com', 
        'port' => 587,
        'username' => 'mailto:noreply@alpasa.com.mx',
        'password' => 'Baf81593zl',
        'from_email' => 'mailto:noreply@alpasa.com.mx',
        'from_name' => 'Sistema de Vacaciones - Alpasa',
    ],
    // 'destinatarios' => [
    //     'rh' => 'recursoshumanos@alpasa.com.mx',
    //     'rh_alterno' => 'rh@alpasa.com.mx',
    // ],
    'url_base' => 'https://intranet.alpasamx.com/SistemaVacaciones',
    'empresa' => 'Alpasa',
    'max_intentos' => 3,
    'limite_por_ciclo' => 50,
];