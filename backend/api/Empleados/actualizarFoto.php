<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../db/Connection.php';

$response = ['status' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($_FILES['foto']) || !isset($_POST['IdPersonal'])) {
        $response['message'] = 'Faltan parámetros requeridos';
        echo json_encode($response);
        exit();
    }

    $uploadDir = '../Empleados/empleados/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileName = isset($_POST['nombreArchivo']) 
        ? $_POST['nombreArchivo']
        : $_POST['IdPersonal'] . '_' . time() . '.' . pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
    
    $uploadFile = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['foto']['tmp_name'], $uploadFile)) {
        $rutaGuardar = 'https://intranet.alpasamx.com/AlpasaCS/Empleados/empleados/' . $fileName;
        
        $query = "UPDATE t_personal SET RutaFoto = :rutaFoto WHERE IdPersonal = :idPersonal";
        $stmt = $Conexion->prepare($query);
        $stmt->bindParam(':rutaFoto', $rutaGuardar);
        $stmt->bindParam(':idPersonal', $_POST['IdPersonal']);
        
        if ($stmt->execute()) {
            $response['status'] = true;
            $response['message'] = 'Foto actualizada correctamente';
            $response['data'] = ['ruta' => $rutaGuardar];
        } else {
            $response['message'] = 'Error al actualizar la foto en la base de datos';
            if (file_exists($uploadFile)) {
                unlink($uploadFile);
            }
        }
    } else {
        $response['message'] = 'Error al mover el archivo';
    }
} else {
    $response['message'] = 'Método no permitido';
}

echo json_encode($response);
?>