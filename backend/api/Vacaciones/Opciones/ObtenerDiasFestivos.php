<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../../db/Connection.php';

try { 
    $anios = [];

    if (isset($_GET['anios']) && is_array($_GET['anios'])) {
        $anios = $_GET['anios'];
    } elseif (isset($_GET['anios'])) {
        $anios = explode(',', (string)$_GET['anios']);
    } elseif (isset($_GET['anio'])) {
        $anios = [$_GET['anio']];
    }
 
    $anios = array_values(array_unique(array_filter(
        array_map('intval', $anios),
        function ($a) { return $a > 0; }
    )));
 
    if (empty($anios)) {
        $anios = [(int)date('Y')];
    }
 
    $placeholders = implode(',', array_fill(0, count($anios), '?'));

    $query = "SELECT 
                IdDiaFestivo,
                Anio,
                Fecha,
                Nombre,
                Tipo,
                Descripcion
              FROM t_diasFestivos
              WHERE Anio IN ($placeholders)
              ORDER BY Fecha ASC";

    $stmt = $Conexion->prepare($query);
    $stmt->execute($anios);

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
 
    $diasFestivos = array_map(function ($row) {
        return [
            'IdDiaFestivo' => (int)$row['IdDiaFestivo'],
            'Anio'         => (int)$row['Anio'],
            'Fecha'        => substr((string)$row['Fecha'], 0, 10),
            'Nombre'       => $row['Nombre'] ?? '',
            'Tipo'         => $row['Tipo'] ?? '',
            'Descripcion'  => $row['Descripcion'] ?? ''
        ];
    }, $result);

    echo json_encode([
        'status'  => true,
        'message' => 'Días festivos obtenidos correctamente',
        'data'    => $diasFestivos
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status'  => false,
        'message' => 'Error al obtener días festivos: ' . $e->getMessage(),
        'data'    => []
    ]);
}