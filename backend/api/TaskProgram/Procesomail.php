<?php
$host = 'smtp.mail.outlook.com';
$puertos = [25, 465, 587, 2525];

echo "Probando conexión a $host...\n\n";

foreach ($puertos as $puerto) {
    echo "Puerto $puerto: ";
    $fp = @fsockopen('tcp://' . $host, $puerto, $errno, $errstr, 3);
    if ($fp) {
        echo "✅ CONECTADO\n";
        fclose($fp);
    } else {
        echo "❌ FALLÓ: $errstr\n";
    }
}
?>