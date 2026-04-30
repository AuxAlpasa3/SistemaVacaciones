<?php

// Conexión a base de datos
include_once '../../db/Connection.php';

/*********************************************************************
 * Obtener todos el listado de maniobras
 *********************************************************************/
function obterDatos()
{
    /// abrimos la conexion
    

    $agencia = $_SESSION['agencia'];
    $rol = $_SESSION['rol_current_users'];

    $query = $rol == 2 ? " WHERE CardName = '" . $agencia . "' " : '';
   $query = "SELECT count(*) AS total, U_Estatus from oqut " . $query . " group by U_Estatus ORDER BY U_Estatus ASC";

    try {
       $stmt = $Conexion->prepare($query);

        $stmt->execute();

          $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (\Throwable $th) {
        return [];
    } finally {
        $conexion->closeDataBase();
    }


    return $data;
}
/*********************************************************************
 * Obtener las solicitudes por estado
 *********************************************************************/
function obterDatosDeSolicitud()
{
    /// abrimos la conexion
    

    $agencia = $_SESSION['agencia'];
    $rol = $_SESSION['rol_current_users'];

    $query = $rol == 2 ? " WHERE nombre_cliente = '" . $agencia . "' " : '';
   $query = "SELECT count(*) AS total, estado from solicitud " . $query . " group by estado ORDER BY estado ASC";

    try {
       $stmt = $Conexion->prepare($query);

        $stmt->execute();

          $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (\Throwable $th) {
        return [];
    } finally {
        $conexion->closeDataBase();
    }


    return $data;
}


/*********************************************************************
 * Obtener las solicitudes por estado
 *********************************************************************/
function obterDatosDeSolicitudDeCotizaciones()
{
    /// abrimos la conexion
    

    $agencia = $_SESSION['idusuario'];
    $rol = $_SESSION['rol_current_users'];

    $query = $rol != 4 ? " WHERE id_cliente = " . $agencia . " " : '';
   $query = "SELECT count(*) AS total, estado from solicitud_cotizaciones " . $query . " group by estado ORDER BY estado ASC";

    try {
       $stmt = $Conexion->prepare($query);

        $stmt->execute();

          $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    } catch (\Throwable $th) {
        return [];
    } finally {
        $conexion->closeDataBase();
    }


    return $data;
}
