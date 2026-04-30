<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


include_once '../../../db/Connection.php';

try {
    $query = "SELECT IdEmpresa, NomEmpresa FROM t_empresa ORDER BY IdEmpresa";
    $stmt = $Conexion->prepare($query);
    $stmt->execute();
    
    $empresas = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $empresas[] = [
            'id' => (int)$row['IdEmpresa'],
            'valor' => $row['NomEmpresa']
        ];
    }
    
    echo json_encode([
        'status' => true,
        'data' => $empresas,
        'message' => 'Empresas obtenidas correctamente'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => [],
        'message' => 'Error al obtener empresas: ' . $e->getMessage()
    ]);
}
?>