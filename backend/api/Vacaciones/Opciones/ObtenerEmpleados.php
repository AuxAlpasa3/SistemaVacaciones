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
            p.IdPersonal,
            p.NivelJerarquico,
            p.IdJefeInmediato
        FROM t_personal p
        WHERE 1 = 1
    ";

    $params = [];

    if ($idUsuario > 0) {
        // Obtener información del usuario
        $queryUsuario = "
            SELECT
                t1.TipoUsuario,
                t1.Rol,
                t2.Departamento,
                t2.IdPersonal,
                t2.IdJefeInmediato,
                t2.NivelJerarquico
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
            $nivelUsuario = (int)($usuario['NivelJerarquico'] ?? 0);

            // =========================================================
            // REGLA 1: Si es RH (TipoUsuario = 1) o Administrador (Rol = 2)
            // Puede ver TODOS los empleados sin restricciones
            // =========================================================
            $esRH = ($tipoUsuario === 1 || $rolUsuario === 2);

            if ($esRH) {
                // No se agregan filtros adicionales, puede ver todo
                // La consulta solo tiene WHERE 1 = 1
                $query .= "";
            } else {
                // =========================================================
                // REGLA 2: Usuario normal (NO RH)
                // =========================================================
                
                $esAdministrativo =
                    $departamentoUsuario === '1' ||
                    strcasecmp($departamentoUsuario, 'Administrativo') === 0 ||
                    strcasecmp($departamentoUsuario, 'Administración') === 0 ||
                    strcasecmp($departamentoUsuario, 'Administracion') === 0;

                if ($esAdministrativo) {
                    // =====================================================
                    // REGLA PARA DEPARTAMENTO 1 (Administración) - NO RH
                    // SOLO muestra:
                    // 1. El propio usuario (IdPersonal = ?)
                    // 2. Sus subordinados directos (IdJefeInmediato = ?)
                    // =====================================================
                    
                    $query .= " AND (";
                    $conditions = array();
                    
                    // 1. Mostrar el propio usuario
                    $conditions[] = "p.IdPersonal = ?";
                    $params[] = $idPersonalUsuario;
                    
                    // 2. Mostrar subordinados directos
                    $conditions[] = "p.IdJefeInmediato = ?";
                    $params[] = $idPersonalUsuario;
                    
                    // Unir todas las condiciones con OR
                    $query .= implode(' OR ', $conditions);
                    $query .= ")";
                    
                } else {
                    // =====================================================
                    // REGLA PARA DEPARTAMENTOS QUE NO SON 1 - NO RH
                    // 1. El propio usuario
                    // 2. Sus subordinados directos
                    // 3. Empleados que NO son del departamento 1
                    //    según nivel jerárquico (nivel n ve n, n+1, n+2)
                    // =====================================================
                    
                    $query .= " AND (";
                    $conditions = array();
                    
                    // 1. Mostrar el propio usuario
                    $conditions[] = "p.IdPersonal = ?";
                    $params[] = $idPersonalUsuario;
                    
                    // 2. Mostrar subordinados directos
                    $conditions[] = "p.IdJefeInmediato = ?";
                    $params[] = $idPersonalUsuario;
                    
                    // 3. Mostrar empleados que NO sean del departamento 1 
                    // con niveles entre n y n+2
                    $nivelMinimo = $nivelUsuario;
                    $nivelMaximo = $nivelUsuario + 2;
                    
                    $conditions[] = "(
                        p.NivelJerarquico BETWEEN ? AND ? 
                        AND p.Departamento != ?
                        AND p.IdPersonal != ?
                        AND p.IdJefeInmediato != ?
                    )";
                    $params[] = $nivelMinimo;
                    $params[] = $nivelMaximo;
                    $params[] = '1';
                    $params[] = $idPersonalUsuario;
                    $params[] = $idPersonalUsuario;
                    
                    // Unir todas las condiciones con OR
                    $query .= implode(' OR ', $conditions);
                    $query .= ")";
                }
            }
        }
    }

    $query .= "
        ORDER BY
            p.Departamento,
            p.NivelJerarquico,
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
            'IdPersonal' => (int)($row['IdPersonal'] ?? 0),
            'NivelJerarquico' => (int)($row['NivelJerarquico'] ?? 0),
            'IdJefeInmediato' => (int)($row['IdJefeInmediato'] ?? 0)
        ];
    }

    // Eliminar duplicados
    $empleadosUnicos = [];
    $idsVistos = [];
    foreach ($empleados as $empleado) {
        $id = $empleado['IdPersonal'];
        if (!in_array($id, $idsVistos)) {
            $idsVistos[] = $id;
            $empleadosUnicos[] = $empleado;
        }
    }

    echo json_encode([
        'status' => true,
        'data' => $empleadosUnicos,
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