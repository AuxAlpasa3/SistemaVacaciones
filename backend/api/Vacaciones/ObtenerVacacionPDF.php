<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../../db/Connection.php'; 
header('Content-Type: application/json; charset=utf-8');

try {
    if (!isset($_GET['IdVacaciones']) || empty($_GET['IdVacaciones'])) {
        throw new Exception('ID de vacaciones no proporcionado');
    }

    $IdVacaciones = (int)$_GET['IdVacaciones'];
 
    $stmt = $Conexion->prepare("
        SELECT 
            t1.IdVacaciones,
            t1.Anio,
            t1.FechaSolicitud,
            t3.IdPersonal as UsuarioSolicitaId,
            CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')) as UsuarioSolicita,
            t2.NoEmpleado,
            t2.IdPersonal,
            CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) as NombreCompleto,
            t7.NomDepto as Departamento,
            t2.departamento,
            t6.NomCargo as Cargo,
            t2.FechaIngreso,
            t1.FechaInicio,
            t1.FechaFin,
            t1.DiasTomar,
            t1.FechaRetornoLabores,
            t1.Estatus,
            t4.IdUsuario as UsuarioAutorizaId,
            t1.SaldoDias,
            t1.DiasCorresponden,
            CONCAT(
                DATEDIFF(MONTH, t2.FechaIngreso, GETDATE()) / 12, ' Año(s) ',
                DATEDIFF(MONTH, t2.FechaIngreso, GETDATE()) % 12, ' Mes(es)'
            ) AS Antiguedad,
            CASE 
                WHEN t4.IdUsuario IS NULL THEN 'Pendiente'
                WHEN t1.UsuarioSolicita = t4.EmpleadoID THEN 
                    ISNULL(
                        (SELECT CONCAT(ISNULL(p2.Nombre, ''), ' ', ISNULL(p2.ApPaterno, ''), ' ', ISNULL(p2.ApMaterno, ''))
                        FROM t_personal p2 
                        WHERE p2.IdPersonal = t2.IdJefeInmediato),
                        'Sin jefe asignado'
                    )
                WHEN t4.EmpleadoID IS NULL THEN 'Administrador'
                ELSE CONCAT(ISNULL(t4_personal.Nombre, ''), ' ', ISNULL(t4_personal.ApPaterno, ''), ' ', ISNULL(t4_personal.ApMaterno, ''))
            END as UsuarioAutoriza,
            t1.FechaAutoriza,
            t5.IdUsuario as UsuarioValidaId,
            CASE 
                WHEN t5.IdUsuario IS NULL THEN 'Pendiente'
                WHEN t5.EmpleadoID IS NULL THEN 'Administrador'
                ELSE CONCAT(ISNULL(t5_personal.Nombre, ''), ' ', ISNULL(t5_personal.ApPaterno, ''), ' ', ISNULL(t5_personal.ApMaterno, ''))
            END as UsuarioValida,
            t1.FechaValidado,
            t1.Comentarios
        FROM t_Vacaciones as t1
        LEFT JOIN t_personal as t2 ON t1.IdPersonal = t2.IdPersonal
        LEFT JOIN t_personal as t3 ON t3.IdPersonal = t1.UsuarioSolicita
        LEFT JOIN t_usuario as t4 ON t4.IdUsuario = t1.UsuarioAutoriza
        LEFT JOIN t_personal as t4_personal ON t4.EmpleadoID = t4_personal.IdPersonal
        LEFT JOIN t_usuario as t5 ON t5.IdUsuario = t1.UsuarioValida
        LEFT JOIN t_personal as t5_personal ON t5.EmpleadoID = t5_personal.IdPersonal
        INNER JOIN t_cargo as t6 ON t6.IdCargo = t2.cargo
        INNER JOIN t_departamento as t7 ON t7.IdDepartamento = t2.departamento
        WHERE t1.IdVacaciones = :IdVacaciones
        ORDER BY t1.FechaSolicitud DESC
    ");

    $stmt->bindParam(':IdVacaciones', $IdVacaciones, PDO::PARAM_INT);
    $stmt->execute();

    $vacacion = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$vacacion) {
        throw new Exception('No se encontró la solicitud de vacaciones');
    }
 
    $domingos = obtenerDomingosEnRango($vacacion['FechaInicio'], $vacacion['FechaFin']);
 
    $festivos = obtenerFestivosEnRango(
        $Conexion,
        $vacacion['FechaInicio'],
        $vacacion['FechaFin']
    );
 
    $diasNoLaborables = unificarDiasNoLaborables($festivos, $domingos);
 
    $vacacion['DiasFestivos']     = $festivos;
    $vacacion['DiasNoLaborables'] = $diasNoLaborables;
 
    echo json_encode([
        'status'  => true,
        'data'    => [
            'vacacion' => $vacacion
        ],
        'message' => 'Datos obtenidos correctamente'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    echo json_encode([
        'status'  => false,
        'data'    => null,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

 
function obtenerDomingosEnRango($fechaInicio, $fechaFin)
{
    $domingos = [];

    if (empty($fechaInicio) || empty($fechaFin)) {
        return $domingos;
    }

    try {
        $inicio = new DateTime($fechaInicio);
        $fin    = new DateTime($fechaFin);
        $fin->modify('+1 day');  

        $interval = new DateInterval('P1D');
        $periodo  = new DatePeriod($inicio, $interval, $fin);

        foreach ($periodo as $dia) {
            if ((int)$dia->format('N') === 7) {  
                $domingos[] = [
                    'Fecha'       => $dia->format('Y-m-d'),
                    'Descripcion' => 'Domingo',
                    'Tipo'        => 'Domingo'
                ];
            }
        }
    } catch (Exception $e) { 
    }

    return $domingos;
}
 
function obtenerFestivosEnRango(PDO $Conexion, $fechaInicio, $fechaFin)
{
    $festivos = [];

    if (empty($fechaInicio) || empty($fechaFin)) {
        return $festivos;
    }
 
    $sql = "
        SELECT
            IdDiaFestivo,
            Anio,
            Fecha,
            Nombre,
            Tipo,
            Descripcion
        FROM t_diasFestivos
        WHERE CONVERT(DATE, Fecha) BETWEEN CONVERT(DATE, :inicio) AND CONVERT(DATE, :fin)
        ORDER BY Fecha ASC
    ";

    try {
        $stmt = $Conexion->prepare($sql);
        $stmt->bindParam(':inicio', $fechaInicio);
        $stmt->bindParam(':fin',    $fechaFin);
        $stmt->execute();

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            // Descripción principal: Nombre; fallback: Descripcion
            $descripcion = !empty($row['Nombre'])
                ? $row['Nombre']
                : (!empty($row['Descripcion']) ? $row['Descripcion'] : 'Día festivo');

            $festivos[] = [
                'IdDiaFestivo' => (int)$row['IdDiaFestivo'],
                'Anio'         => (int)$row['Anio'],
                'Fecha'        => $row['Fecha'],
                'Nombre'       => $row['Nombre'],
                'Descripcion'  => $descripcion,
                'Tipo'         => 'Festivo'   // Normalizado para el PDF
            ];
        }
    } catch (PDOException $e) { 
    }

    return $festivos;
}

 
function unificarDiasNoLaborables(array $festivos, array $domingos)
{
    $mapa = [];

    // Festivos primero (tienen prioridad)
    foreach ($festivos as $f) {
        $key = date('Y-m-d', strtotime($f['Fecha']));
        $mapa[$key] = [
            'Fecha'       => date('Y-m-d', strtotime($f['Fecha'])),
            'Descripcion' => $f['Descripcion'],
            'Tipo'        => 'Festivo'
        ];
    }

    // Domingos, solo si no existen ya como festivo
    foreach ($domingos as $d) {
        $key = date('Y-m-d', strtotime($d['Fecha']));
        if (!isset($mapa[$key])) {
            $mapa[$key] = [
                'Fecha'       => $d['Fecha'],
                'Descripcion' => 'Domingo',
                'Tipo'        => 'Domingo'
            ];
        }
    }

    ksort($mapa);

    return array_values($mapa);
}
?>