<?php

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../db/Connection.php';

function normalizarFecha($valor): ?string
{
    if (empty($valor)) return null;
    if ($valor instanceof DateTimeInterface) {
        return $valor->format('Y-m-d');
    }
    $ts = strtotime((string)$valor);
    return $ts ? date('Y-m-d', $ts) : null;
}

try {

    $busqueda = trim((string)($_GET['busqueda'] ?? ''));

    if ($busqueda === '') {
        http_response_code(400);
        echo json_encode([
            'status'  => false,
            'data'    => null,
            'message' => 'Debe indicar número de empleado o nombre'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $query = "EXEC dbo.sp_EstadoCuentaVacaciones :busqueda";

    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(':busqueda', $busqueda, PDO::PARAM_STR);
    $stmt->execute();

    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($data)) {
        echo json_encode([
            'status'  => false,
            'data'    => null,
            'message' => 'No se encontró el empleado'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /* El SP devuelve los datos del empleado repetidos en cada fila.
       Tomamos el primero y armamos el detalle por año. */
    $primera = $data[0];

    $detalle = [];
    foreach ($data as $row) {

        $fechasTomadas = [];
        if (!empty($row['FechasTomadas'])) {
            $fechasTomadas = array_values(array_filter(
                array_map('trim', explode(',', $row['FechasTomadas']))
            ));
        }

        $detalle[] = [
            'Anio'            => isset($row['Anio'])            ? (int)$row['Anio']            : 0,
            'DiasHabilitados' => isset($row['DiasHabilitados']) ? (int)$row['DiasHabilitados'] : 0,
            'DiasTomados'     => isset($row['DiasTomados'])     ? (int)$row['DiasTomados']     : 0,
            'DiasVencidos'    => isset($row['DiasVencidos'])    ? (int)$row['DiasVencidos']    : 0,
            'DiasVigentes'    => isset($row['DiasVigentes'])    ? (int)$row['DiasVigentes']    : 0,
            'EstadoPeriodo'   => $row['EstadoPeriodo'] ?? '',
            'FechasTomadas'   => $fechasTomadas,
        ];
    }

    $resultado = [
        'IdPersonal'     => isset($primera['IdPersonal'])     ? (int)$primera['IdPersonal']     : 0,
        'NoEmpleado'     => $primera['NoEmpleado']     ?? '',
        'NombreCompleto' => $primera['NombreCompleto'] ?? '',
        'Departamento'   => $primera['Departamento']   ?? '',
        'FechaIngreso'   => normalizarFecha($primera['FechaIngreso'] ?? null),
        'Antiguedad'     => isset($primera['Antiguedad']) ? (int)$primera['Antiguedad'] : 0,
        'Detalle'        => $detalle,
    ];

    echo json_encode([
        'status'  => true,
        'data'    => $resultado,
        'message' => 'Estado de cuenta obtenido correctamente'
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {

    http_response_code(500);

    echo json_encode([
        'status'  => false,
        'data'    => null,
        'message' => 'Error al obtener el estado de cuenta: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}