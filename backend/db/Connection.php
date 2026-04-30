<?php
$rutaServidor = getenv('DB_HOST');
$nombreBaseDeDatos = getenv('DB');
$usuario = getenv('DB_USER');
$contraseña = getenv('DB_PASS');

$ZonaHoraria = getenv('ZonaHoraria');
$VERSION = getenv('VERSION');

date_default_timezone_set($ZonaHoraria);

try {
    $Conexion = new PDO(
        "sqlsrv:server=$rutaServidor;database=$nombreBaseDeDatos;TrustServerCertificate=yes;Encrypt=yes",
        $usuario,
        $contraseña
    );
    $Conexion->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    echo "Error de conexión: " . $e->getMessage();
} finally {
    $conexion = null;
}
?>