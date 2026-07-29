<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../../db/Connection.php';

$idUsuario = isset($_GET['IdUsuario']) ? (int)$_GET['IdUsuario'] : 0;

try {
    $query = "SELECT 
                p.NoEmpleado,
                CONCAT(ISNULL(p.Nombre, ''), ' ', ISNULL(p.ApPaterno, ''), ' ', ISNULL(p.ApMaterno, '')) as NombreCompleto,
                p.Departamento,
                p.Cargo,
                p.FechaIngreso,
                p.IdPersonal
            FROM t_personal p
            WHERE 1=1";
    
    $params = [];
    
    if ($idUsuario > 0) {
        $queryUsuario = "SELECT Departamento, IdPersonal FROM t_usuarios WHERE IdUsuario = ?";
        $stmtUsuario = $Conexion->prepare($queryUsuario);
        $stmtUsuario->execute([$idUsuario]);
        $usuario = $stmtUsuario->fetch(PDO::FETCH_ASSOC);
        
        if ($usuario) {
            $departamentoUsuario = $usuario['Departamento'];
            $idPersonalJefe = $usuario['IdPersonal'];
            
            if ($departamentoUsuario == '1' || $departamentoUsuario == 'Administrativo') {
                $query .= " AND (p.Departamento = ? OR p.JefeInmediato = ? OR p.IdPersonal = ?)";
                $params[] = $departamentoUsuario;
                $params[] = $idPersonalJefe;
                $params[] = $idPersonalJefe;
            }
        }
    }
    
    $query .= " ORDER BY p.Nombre";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute($params);

    $empleados = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $empleados[] = [
            'NoEmpleado' => $row['NoEmpleado'],
            'NombreCompleto' => $row['NombreCompleto'],
            'Departamento' => $row['Departamento'],
            'Cargo' => $row['Cargo'],
            'FechaIngreso' => $row['FechaIngreso'],
            'IdPersonal' => $row['IdPersonal']
        ];
    }

    echo json_encode([
        'status' => true,
        'data' => $empleados,
        'message' => 'Listado de empleados obtenido correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener empleados: ' . $e->getMessage()
    ]);
}
?>