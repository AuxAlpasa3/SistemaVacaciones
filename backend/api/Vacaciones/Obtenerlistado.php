<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejo de preflight CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../db/Connection.php';

date_default_timezone_set('America/Mexico_City');

try {
    // ============ 1. OBTENER Y SANITIZAR PARÁMETROS ============
    $idUsuario         = isset($_GET['IdUsuario']) && $_GET['IdUsuario'] !== '' ? (int)$_GET['IdUsuario'] : 0;
    $estatus           = isset($_GET['estatus']) ? trim($_GET['estatus']) : '';
    $noEmpleado        = isset($_GET['noEmpleado']) ? trim($_GET['noEmpleado']) : '';
    $nombreCompleto    = isset($_GET['nombreCompleto']) ? trim($_GET['nombreCompleto']) : '';
    $departamento      = isset($_GET['departamento']) ? trim($_GET['departamento']) : '';
    $fechaInicioVac    = isset($_GET['fechaInicioVacaciones']) ? trim($_GET['fechaInicioVacaciones']) : '';
    $fechaFinVac       = isset($_GET['fechaFinVacaciones']) ? trim($_GET['fechaFinVacaciones']) : '';
    $fechaSolicitud    = isset($_GET['fechaSolicitud']) ? trim($_GET['fechaSolicitud']) : '';
    $anio              = isset($_GET['anio']) && $_GET['anio'] !== '' ? (int)$_GET['anio'] : 0;
    $fechaIngreso      = isset($_GET['fechaIngreso']) ? trim($_GET['fechaIngreso']) : '';
    $noContarDomingos  = isset($_GET['noContarDomingos']) && $_GET['noContarDomingos'] !== '' ? (int)$_GET['noContarDomingos'] : null;
    $jefeInmediato     = isset($_GET['jefeInmediato']) ? trim($_GET['jefeInmediato']) : '';

    // ============ 2. VALIDACIÓN DE FECHAS (formato YYYY-MM-DD) ============
    $validarFecha = function ($fecha) {
        if (empty($fecha)) return '';
        $d = DateTime::createFromFormat('Y-m-d', $fecha);
        return ($d && $d->format('Y-m-d') === $fecha) ? $fecha : '';
    };

    $fechaInicioVac = $validarFecha($fechaInicioVac);
    $fechaFinVac    = $validarFecha($fechaFinVac);
    $fechaSolicitud = $validarFecha($fechaSolicitud);
    $fechaIngreso   = $validarFecha($fechaIngreso);

    // ============ 3. VALIDACIÓN DE ESTATUS ============
    $estatusValidos = [0, 1, 2, 3, 4];
    $estatusArray = [];
    if ($estatus !== '') {
        foreach (explode(',', $estatus) as $e) {
            $e = (int)trim($e);
            if (in_array($e, $estatusValidos, true)) {
                $estatusArray[] = $e;
            }
        }
        $estatusArray = array_values(array_unique($estatusArray));
    }

    // ============ 4. CONSTRUCCIÓN DE LA CONSULTA ============
    $query = "SELECT 
                t1.IdVacaciones,
                t1.Anio,
                CONVERT(varchar(10), t1.FechaSolicitud, 23) AS FechaSolicitud,
                t3.IdPersonal AS UsuarioSolicitaId,
                LTRIM(RTRIM(CONCAT(ISNULL(t3.Nombre, ''), ' ', ISNULL(t3.ApPaterno, ''), ' ', ISNULL(t3.ApMaterno, '')))) AS UsuarioSolicita,
                t2.NoEmpleado,
                t2.IdPersonal,
                LTRIM(RTRIM(CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')))) AS NombreCompleto,
                ISNULL(t7.NomDepto, '') AS Departamento,
                t2.departamento AS DepartamentoId,
                ISNULL(t6.NomCargo, '') AS Cargo,
                CONVERT(varchar(10), t2.FechaIngreso, 23) AS FechaIngreso,
                CONVERT(varchar(10), t1.FechaInicio, 23) AS FechaInicio,
                CONVERT(varchar(10), t1.FechaFin, 23) AS FechaFin,
                t1.DiasTomar,
                CONVERT(varchar(10), t1.FechaRetornoLabores, 23) AS FechaRetornoLabores,
                t1.Estatus,
                t4.IdUsuario AS UsuarioAutorizaId,
                CASE 
                    WHEN t4.IdUsuario IS NULL THEN 'Pendiente'
                    WHEN t4.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE LTRIM(RTRIM(CONCAT(ISNULL(t4_personal.Nombre, ''), ' ', ISNULL(t4_personal.ApPaterno, ''), ' ', ISNULL(t4_personal.ApMaterno, ''))))
                END AS UsuarioAutoriza,
                CONVERT(varchar(10), t1.FechaAutoriza, 23) AS FechaAutoriza,
                t5.IdUsuario AS UsuarioValidaId,
                CASE 
                    WHEN t5.IdUsuario IS NULL THEN 'Pendiente'
                    WHEN t5.EmpleadoID IS NULL THEN 'Administrador'
                    ELSE LTRIM(RTRIM(CONCAT(ISNULL(t5_personal.Nombre, ''), ' ', ISNULL(t5_personal.ApPaterno, ''), ' ', ISNULL(t5_personal.ApMaterno, ''))))
                END AS UsuarioValida,
                CONVERT(varchar(10), t1.FechaValidado, 23) AS FechaValidado,
                t1.Comentarios,
                t1.SaldoDias,
                t1.DiasCorresponden,
                t1.Antiguedad,
                t1.NoContarDomingos,
                CASE WHEN t1.NoContarDomingos = 1 THEN 'Sí' ELSE 'No' END AS NoContarDomingosTexto
            FROM t_Vacaciones AS t1
            LEFT JOIN t_personal    AS t2           ON t1.IdPersonal      = t2.IdPersonal
            LEFT JOIN t_personal    AS t3           ON t3.IdPersonal      = t1.UsuarioSolicita
            LEFT JOIN t_usuario     AS t4           ON t4.IdUsuario       = t1.UsuarioAutoriza
            LEFT JOIN t_personal    AS t4_personal  ON t4.EmpleadoID      = t4_personal.IdPersonal
            LEFT JOIN t_usuario     AS t5           ON t5.IdUsuario       = t1.UsuarioValida
            LEFT JOIN t_personal    AS t5_personal  ON t5.EmpleadoID      = t5_personal.IdPersonal
            LEFT JOIN t_cargo       AS t6           ON t6.IdCargo         = t2.cargo
            LEFT JOIN t_departamento AS t7          ON t7.IdDepartamento  = t2.departamento
            WHERE 1 = 1";

    $params = [];

    // ============ 5. FILTRO POR ESTATUS (soporta múltiples) ============
    if (!empty($estatusArray)) {
        $placeholders = implode(',', array_fill(0, count($estatusArray), '?'));
        $query .= " AND t1.Estatus IN ($placeholders)";
        foreach ($estatusArray as $e) {
            $params[] = $e;
        }
    }

    // ============ 6. FILTROS DE TEXTO ============
    if ($noEmpleado !== '' && $noEmpleado !== '0') {
        $query .= " AND t2.NoEmpleado LIKE ?";
        $params[] = "%{$noEmpleado}%";
    }

    if ($nombreCompleto !== '') {
        $query .= " AND (
                        t2.Nombre      LIKE ? OR 
                        t2.ApPaterno   LIKE ? OR 
                        t2.ApMaterno   LIKE ? OR 
                        CONCAT(ISNULL(t2.Nombre, ''), ' ', ISNULL(t2.ApPaterno, ''), ' ', ISNULL(t2.ApMaterno, '')) LIKE ?
                    )";
        $like = "%{$nombreCompleto}%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    if ($departamento !== '') {
        // Soporta búsqueda por ID numérico O por nombre de departamento
        if (ctype_digit($departamento)) {
            $query .= " AND t2.departamento = ?";
            $params[] = (int)$departamento;
        } else {
            $query .= " AND t7.NomDepto LIKE ?";
            $params[] = "%{$departamento}%";
        }
    }

    if ($jefeInmediato !== '') {
        $query .= " AND (
                        t4_personal.Nombre    LIKE ? OR 
                        t4_personal.ApPaterno LIKE ? OR 
                        t4_personal.ApMaterno LIKE ?
                    )";
        $like = "%{$jefeInmediato}%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    // ============ 7. FILTROS DE FECHAS ============
    if ($fechaInicioVac !== '') {
        $query .= " AND CONVERT(DATE, t1.FechaInicio) >= ?";
        $params[] = $fechaInicioVac;
    }

    if ($fechaFinVac !== '') {
        $query .= " AND CONVERT(DATE, t1.FechaFin) <= ?";
        $params[] = $fechaFinVac;
    }

    if ($fechaSolicitud !== '') {
        $query .= " AND CONVERT(DATE, t1.FechaSolicitud) = ?";
        $params[] = $fechaSolicitud;
    }

    if ($fechaIngreso !== '') {
        // Filtro por rango de año/mes en lugar de igualdad estricta
        $query .= " AND CONVERT(DATE, t2.FechaIngreso) = ?";
        $params[] = $fechaIngreso;
    }

    if ($anio > 0) {
        $query .= " AND t1.Anio = ?";
        $params[] = $anio;
    }

    if ($noContarDomingos !== null && in_array($noContarDomingos, [0, 1], true)) {
        $query .= " AND t1.NoContarDomingos = ?";
        $params[] = $noContarDomingos;
    }

    // ============ 8. ORDEN Y LÍMITE ============
    $query .= " ORDER BY t1.FechaSolicitud DESC, t1.IdVacaciones DESC";

    // Límite configurable (por defecto 500, máximo 2000) para evitar cargas masivas
    $limite = isset($_GET['limite']) ? (int)$_GET['limite'] : 500;
    $limite = max(1, min($limite, 2000));
    $query .= " OFFSET 0 ROWS FETCH NEXT {$limite} ROWS ONLY";

    // ============ 9. EJECUCIÓN ============
    $stmt = $Conexion->prepare($query);

    // Vincular parámetros con tipos correctos
    foreach ($params as $i => $valor) {
        $tipo = is_int($valor) ? PDO::PARAM_INT : PDO::PARAM_STR;
        $stmt->bindValue($i + 1, $valor, $tipo);
    }

    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ============ 10. MAPEO DE RESULTADOS ============
    $vacaciones = [];
    foreach ($result as $row) {
        $vacaciones[] = [
            'IdVacaciones'          => (int)$row['IdVacaciones'],
            'Anio'                  => (int)$row['Anio'],
            'FechaSolicitud'        => $row['FechaSolicitud'] ?? '',
            'UsuarioSolicitaId'     => (int)($row['UsuarioSolicitaId'] ?? 0),
            'UsuarioSolicita'       => trim($row['UsuarioSolicita'] ?? ''),
            'NoEmpleado'            => $row['NoEmpleado'] ?? '',
            'IdPersonal'            => (int)$row['IdPersonal'],
            'NombreCompleto'        => trim($row['NombreCompleto'] ?? ''),
            'Departamento'          => $row['Departamento'] ?? '',
            'DepartamentoId'        => $row['DepartamentoId'] ?? '',
            'Cargo'                 => $row['Cargo'] ?? '',
            'FechaIngreso'          => $row['FechaIngreso'] ?? '',
            'FechaInicio'           => $row['FechaInicio'] ?? '',
            'FechaFin'              => $row['FechaFin'] ?? '',
            'DiasTomar'             => (int)$row['DiasTomar'],
            'FechaRetornoLabores'   => $row['FechaRetornoLabores'] ?? '',
            'Estatus'               => (int)$row['Estatus'],
            'UsuarioAutorizaId'     => (int)($row['UsuarioAutorizaId'] ?? 0),
            'UsuarioAutoriza'       => trim($row['UsuarioAutoriza'] ?? ''),
            'FechaAutoriza'         => $row['FechaAutoriza'] ?? '',
            'UsuarioValidaId'       => (int)($row['UsuarioValidaId'] ?? 0),
            'UsuarioValida'         => trim($row['UsuarioValida'] ?? ''),
            'FechaValidado'         => $row['FechaValidado'] ?? '',
            'Comentarios'           => $row['Comentarios'] ?? null,
            'SaldoDias'             => (int)($row['SaldoDias'] ?? 0),
            'DiasCorresponden'      => (int)($row['DiasCorresponden'] ?? 0),
            'Antiguedad'            => (int)($row['Antiguedad'] ?? 0),
            'NoContarDomingos'      => (int)($row['NoContarDomingos'] ?? 0),
            'NoContarDomingosTexto' => $row['NoContarDomingosTexto'] ?? 'No',
        ];
    }

    echo json_encode([
        'status'  => true,
        'message' => 'Vacaciones obtenidas correctamente',
        'data'    => $vacaciones,
        'total'   => count($vacaciones),
        'filtros' => [
            'estatus'        => $estatusArray,
            'noEmpleado'     => $noEmpleado,
            'nombreCompleto' => $nombreCompleto,
            'departamento'   => $departamento,
            'anio'           => $anio,
            'limite'         => $limite,
        ],
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => false,
        'message' => 'Error de base de datos al obtener vacaciones',
        'error'   => $e->getMessage(),
        'data'    => [],
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status'  => false,
        'message' => 'Error al obtener vacaciones: ' . $e->getMessage(),
        'data'    => [],
    ], JSON_UNESCAPED_UNICODE);
}