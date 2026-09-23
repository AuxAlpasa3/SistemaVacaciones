<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

require_once '../../db/Connection.php';

date_default_timezone_set('America/Mexico_City');

try {
    $idVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;

    if ($idVacaciones <= 0) {
        throw new Exception('IdVacaciones es requerido');
    }

    $query = "SELECT
                t1.IdVacaciones,
                t1.Anio,
                CONVERT(varchar(10), t1.FechaSolicitud, 23) as FechaSolicitud,
                CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')) as UsuarioSolicita,
                t2.NoEmpleado,
                t2.IdPersonal,
                CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) as NombreCompleto,
                ISNULL(t7.NomDepto, '') as Departamento,
                ISNULL(t6.NomCargo, '') as Cargo,
                CONVERT(varchar(10), t2.FechaIngreso, 23) as FechaIngreso,
                CONVERT(varchar(10), t1.FechaInicio, 23) as FechaInicio,
                CONVERT(varchar(10), t1.FechaFin, 23) as FechaFin,
                t1.DiasTomar,
                CONVERT(varchar(10), t1.FechaRetornoLabores, 23) as FechaRetornoLabores,
                t1.Estatus,
                CASE
                    WHEN t4.IdUsuario IS NULL THEN ''
                    WHEN t4.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE CONCAT(ISNULL(t4_personal.Nombre, ''), ' ', ISNULL(t4_personal.ApPaterno, ''), ' ', ISNULL(t4_personal.ApMaterno, ''))
                END as UsuarioAutoriza,
                CONVERT(varchar(10), t1.FechaAutoriza, 23) as FechaAutoriza,
                CASE
                    WHEN t5.IdUsuario IS NULL THEN ''
                    WHEN t5.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE CONCAT(ISNULL(t5_personal.Nombre, ''), ' ', ISNULL(t5_personal.ApPaterno, ''), ' ', ISNULL(t5_personal.ApMaterno, ''))
                END as UsuarioValida,
                CONVERT(varchar(10), t1.FechaValidado, 23) as FechaValidado,
                t1.Comentarios,
                t1.SaldoDias,
                t1.DiasCorresponden,
                t1.Antiguedad,
                t1.NoContarDomingos
            FROM t_Vacaciones as t1
            LEFT JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
            LEFT JOIN t_personal as t3 ON t3.IdPersonal = t1.UsuarioSolicita
            LEFT JOIN t_usuario as t4 ON t4.IdUsuario = t1.UsuarioAutoriza
            LEFT JOIN t_personal as t4_personal ON t4.EmpleadoID = t4_personal.IdPersonal
            LEFT JOIN t_usuario as t5 ON t5.IdUsuario = t1.UsuarioValida
            LEFT JOIN t_personal as t5_personal ON t5.EmpleadoID = t5_personal.IdPersonal
            LEFT JOIN t_cargo as t6 ON t6.IdCargo = t2.cargo
            LEFT JOIN t_departamento as t7 ON t7.IdDepartamento = t2.departamento
            WHERE t1.IdVacaciones = :IdVacaciones";

    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
    $stmt->execute();

    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        throw new Exception('Solicitud de vacaciones no encontrada');
    }

    $vacacion = array(
        'IdVacaciones' => (int)$row['IdVacaciones'],
        'Anio' => (int)$row['Anio'],
        'FechaSolicitud' => $row['FechaSolicitud'] ?? '',
        'UsuarioSolicita' => trim($row['UsuarioSolicita'] ?? ''),
        'NoEmpleado' => $row['NoEmpleado'] ?? '',
        'IdPersonal' => (int)$row['IdPersonal'],
        'NombreCompleto' => trim($row['NombreCompleto'] ?? ''),
        'Departamento' => $row['Departamento'] ?? '',
        'Cargo' => $row['Cargo'] ?? '',
        'FechaIngreso' => $row['FechaIngreso'] ?? '',
        'FechaInicio' => $row['FechaInicio'] ?? '',
        'FechaFin' => $row['FechaFin'] ?? '',
        'DiasTomar' => (int)$row['DiasTomar'],
        'FechaRetornoLabores' => $row['FechaRetornoLabores'] ?? '',
        'Estatus' => (int)$row['Estatus'],
        'UsuarioAutoriza' => trim($row['UsuarioAutoriza'] ?? ''),
        'FechaAutoriza' => $row['FechaAutoriza'] ?? '',
        'UsuarioValida' => trim($row['UsuarioValida'] ?? ''),
        'FechaValidado' => $row['FechaValidado'] ?? '',
        'Comentarios' => $row['Comentarios'] ?? null,
        'SaldoDias' => (int)$row['SaldoDias'],
        'DiasCorresponden' => (int)$row['DiasCorresponden'],
        'Antiguedad' => (int)$row['Antiguedad'],
        'NoContarDomingos' => (int)$row['NoContarDomingos']
    );

    echo json_encode(array(
        'status' => true,
        'message' => 'Solicitud obtenida correctamente',
        'data' => $vacacion
    ));
} catch (Exception $e) {
    echo json_encode(array(
        'status' => false,
        'message' => 'Error: ' . $e->getMessage(),
        'data' => null
    ));
}
?>