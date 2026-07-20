<?php 
return [
    'smtp' => [
        'host' => 'smtp.office365.com', 
        'port' => 587,
        'username' => 'sistema@alpasa.com.mx',
        'password' => 'tu_contraseña_aqui',
        'from_email' => 'sistema@alpasa.com.mx',
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