<?php
$rutaServidor = getenv('DB_HOSTSAP');
$nombreBaseDeDatos = getenv('DBSAP');
$usuario = getenv('DB_USERSAP');
$contraseña = getenv('DB_PASSSAP');

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