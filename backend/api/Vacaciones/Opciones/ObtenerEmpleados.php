<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../../db/Connection.php';

$idUsuario = isset($_GET['idusuario']) ? (int)$_GET['idusuario'] : 0;

try {
    $query = "SELECT 
                p.NoEmpleado,
                CONCAT(ISNULL(p.Nombre, ''), ' ', ISNULL(p.ApPaterno, ''), ' ', ISNULL(p.ApMaterno, '')) as NombreCompleto
            FROM t_personal p
            ORDER BY p.Nombre";
    
    $stmt = $Conexion->prepare($query);
    $stmt->execute();

    $empleados = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $empleados[] = [
            'NoEmpleado' => $row['NoEmpleado'],
            'NombreCompleto' => $row['NombreCompleto']
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