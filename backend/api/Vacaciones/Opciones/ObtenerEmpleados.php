<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include_once '../../../db/Connection.php';

$idUsuario = isset($_GET['IdUsuario'])
    ? (int)$_GET['IdUsuario']
    : 0;

try {
    $query = "
        SELECT
            p.NoEmpleado,
            LTRIM(RTRIM(CONCAT(
                ISNULL(p.Nombre, ''),
                ' ',
                ISNULL(p.ApPaterno, ''),
                ' ',
                ISNULL(p.ApMaterno, '')
            ))) AS NombreCompleto,
            p.Departamento,
            p.Cargo,
            p.FechaIngreso,
            p.IdPersonal
        FROM t_personal p
        WHERE 1 = 1
    ";

    $params = [];

    if ($idUsuario > 0) {
        $queryUsuario = "
            SELECT
                t1.TipoUsuario,
                t1.Rol,
                t2.Departamento,
                t2.IdPersonal
            FROM t_usuario t1
            INNER JOIN t_personal t2
                ON t1.EmpleadoID = t2.IdPersonal
            WHERE t1.IdUsuario = ?
        ";

        $stmtUsuario = $Conexion->prepare($queryUsuario);
        $stmtUsuario->execute([$idUsuario]);

        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);

        if ($usuario) {
            $tipoUsuario = (int)($usuario['TipoUsuario'] ?? 0);
            $rolUsuario = (int)($usuario['Rol'] ?? 0);
            $departamentoUsuario = trim((string)($usuario['Departamento'] ?? ''));
            $idPersonalUsuario = (int)($usuario['IdPersonal'] ?? 0);

            $puedeVerTodos =
                $tipoUsuario === 1 &&
                $rolUsuario === 2;

            if (!$puedeVerTodos) {
                $esAdministrativo =
                    $departamentoUsuario === '1' ||
                    strcasecmp($departamentoUsuario, 'Administrativo') === 0 ||
                    strcasecmp($departamentoUsuario, 'Administración') === 0 ||
                    strcasecmp($departamentoUsuario, 'Administracion') === 0;

                if ($esAdministrativo) {
                    $query .= "
                        AND (
                            p.Departamento = ?
                            OR p.IdJefeInmediato = ?
                            OR p.IdPersonal = ?
                        )
                    ";

                    $params[] = $departamentoUsuario;
                    $params[] = $idPersonalUsuario;
                    $params[] = $idPersonalUsuario;
                }
            }
        }
    }

    $query .= "
        ORDER BY
            p.Nombre,
            p.ApPaterno,
            p.ApMaterno
    ";

    $stmt = $Conexion->prepare($query);
    $stmt->execute($params);

    $empleados = [];

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $empleados[] = [
            'NoEmpleado' => (string)($row['NoEmpleado'] ?? ''),
            'NombreCompleto' => trim((string)($row['NombreCompleto'] ?? '')),
            'Departamento' => $row['Departamento'] ?? '',
            'Cargo' => $row['Cargo'] ?? '',
            'FechaIngreso' => $row['FechaIngreso'] ?? '',
            'IdPersonal' => (int)($row['IdPersonal'] ?? 0)
        ];
    }

    echo json_encode([
        'status' => true,
        'data' => $empleados,
        'message' => 'Listado de empleados obtenido correctamente'
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);

    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener empleados: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
?>