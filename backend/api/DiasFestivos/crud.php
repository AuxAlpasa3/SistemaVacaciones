<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {

    switch ($method) { 

        case "POST": 
            $contentType = $_SERVER["CONTENT_TYPE"] ?? ''; 
            if (strpos($contentType, 'application/json') !== false) {
                $data = json_decode(file_get_contents("php://input"), true);
            } else {
                $data = $_POST;
            }

            $Fecha = $data['Fecha'] ?? null;
            $Nombre = trim($data['Nombre'] ?? '');
            $Tipo = trim($data['Tipo'] ?? 'OFICIAL');
            $Descripcion = trim($data['Descripcion'] ?? '');
            $UsuarioRegistro = trim($data['UsuarioRegistro'] ?? '');
 
            if (empty($Fecha) || empty($Nombre)) {
                http_response_code(400);

                echo json_encode([
                    'status' => false,
                    'message' => 'Fecha y Nombre son obligatorios'
                ]);

                exit;
            }
 
            $Anio = date('Y', strtotime($Fecha));
 
            $queryExiste = "
                SELECT IdDiaFestivo
                FROM dbo.t_diasFestivos
                WHERE Fecha = :Fecha
            ";

            $stmtExiste = $Conexion->prepare($queryExiste);
            $stmtExiste->bindParam(":Fecha", $Fecha);
            $stmtExiste->execute();

            if ($stmtExiste->fetch(PDO::FETCH_ASSOC)) {

                http_response_code(409);

                echo json_encode([
                    'status' => false,
                    'message' => 'Ya existe un día festivo registrado en esa fecha'
                ]);

                exit;
            }


            $query = "
                INSERT INTO dbo.t_diasFestivos
                (
                    Anio,
                    Fecha,
                    Nombre,
                    Tipo,
                    Descripcion,
                    UsuarioRegistro
                )
                VALUES
                (
                    :Anio,
                    :Fecha,
                    :Nombre,
                    :Tipo,
                    :Descripcion,
                    :UsuarioRegistro
                )
            ";

            $stmt = $Conexion->prepare($query);

            $stmt->bindParam(":Anio", $Anio);
            $stmt->bindParam(":Fecha", $Fecha);
            $stmt->bindParam(":Nombre", $Nombre);
            $stmt->bindParam(":Tipo", $Tipo);
            $stmt->bindParam(":Descripcion", $Descripcion);
            $stmt->bindParam(":UsuarioRegistro", $UsuarioRegistro);

            if ($stmt->execute()) {

                http_response_code(201);

                echo json_encode([
                    'status' => true,
                    'message' => 'Día festivo registrado correctamente'
                ]);

            } else {

                http_response_code(500);

                echo json_encode([
                    'status' => false,
                    'message' => 'Error al registrar el día festivo'
                ]);
            }

            break;
 
        case "PUT":

            if (!isset($_GET['IdDiaFestivo'])) { 
                http_response_code(400); 
                echo json_encode([
                    'status' => false,
                    'message' => 'IdDiaFestivo no proporcionado'
                ]);
                exit;
            }

            $IdDiaFestivo = (int) $_GET['IdDiaFestivo'];

            $data = json_decode(
                file_get_contents("php://input"),
                true
            );

            if (!$data) { 
                http_response_code(400); 
                echo json_encode([
                    'status' => false,
                    'message' => 'No se recibieron datos'
                ]); 
                exit;
            }

            $Fecha = $data['Fecha'] ?? null;
            $Nombre = trim($data['Nombre'] ?? '');
            $Tipo = trim($data['Tipo'] ?? 'OFICIAL');
            $Descripcion = trim($data['Descripcion'] ?? '');

            if (empty($Fecha) || empty($Nombre)) {

                http_response_code(400);

                echo json_encode([
                    'status' => false,
                    'message' => 'Fecha y Nombre son obligatorios'
                ]);

                exit;
            }

            $Anio = date('Y', strtotime($Fecha));

 
            $queryExiste = "
                SELECT IdDiaFestivo
                FROM dbo.t_diasFestivos
                WHERE Fecha = :Fecha
                AND IdDiaFestivo <> :IdDiaFestivo
            ";

            $stmtExiste = $Conexion->prepare($queryExiste);

            $stmtExiste->bindParam(":Fecha", $Fecha);
            $stmtExiste->bindParam(":IdDiaFestivo", $IdDiaFestivo);

            $stmtExiste->execute();

            if ($stmtExiste->fetch(PDO::FETCH_ASSOC)) {

                http_response_code(409);

                echo json_encode([
                    'status' => false,
                    'message' => 'Ya existe otro día festivo registrado en esa fecha'
                ]);

                exit;
            }


            $query = "
                UPDATE dbo.t_diasFestivos
                SET
                    Anio = :Anio,
                    Fecha = :Fecha,
                    Nombre = :Nombre,
                    Tipo = :Tipo,
                    Descripcion = :Descripcion
                WHERE IdDiaFestivo = :IdDiaFestivo
            ";

            $stmt = $Conexion->prepare($query);

            $stmt->bindParam(":IdDiaFestivo", $IdDiaFestivo);
            $stmt->bindParam(":Anio", $Anio);
            $stmt->bindParam(":Fecha", $Fecha);
            $stmt->bindParam(":Nombre", $Nombre);
            $stmt->bindParam(":Tipo", $Tipo);
            $stmt->bindParam(":Descripcion", $Descripcion);

            $stmt->execute();


            if ($stmt->rowCount() > 0) {

                http_response_code(200);

                echo json_encode([
                    'status' => true,
                    'message' => 'Día festivo modificado correctamente'
                ]);

            } else { 
                $queryExiste = "
                    SELECT IdDiaFestivo
                    FROM dbo.t_diasFestivos
                    WHERE IdDiaFestivo = :IdDiaFestivo
                ";

                $verificar = $Conexion->prepare($queryExiste);
                $verificar->bindParam(":IdDiaFestivo", $IdDiaFestivo);
                $verificar->execute();

                if ($verificar->fetch(PDO::FETCH_ASSOC)) {

                    http_response_code(200);

                    echo json_encode([
                        'status' => true,
                        'message' => 'No hubo cambios en el día festivo'
                    ]);

                } else {

                    http_response_code(404);

                    echo json_encode([
                        'status' => false,
                        'message' => 'No se encontró el día festivo'
                    ]);
                }
            }

            break;

 
        case "GET":
 
            if (isset($_GET['IdDiaFestivo'])) {

                $IdDiaFestivo = (int) $_GET['IdDiaFestivo'];

                $query = "
                    SELECT
                        IdDiaFestivo,
                        Anio,
                        Fecha,
                        Nombre,
                        Tipo,
                        Descripcion,
                        FechaRegistro,
                        UsuarioRegistro
                    FROM dbo.t_diasFestivos
                    WHERE IdDiaFestivo = :IdDiaFestivo
                ";

                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(":IdDiaFestivo", $IdDiaFestivo);

                $stmt->execute();

                $data = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($data) {

                    http_response_code(200);

                    echo json_encode([
                        'status' => true,
                        'data' => $data
                    ]);

                } else {

                    http_response_code(404);

                    echo json_encode([
                        'status' => false,
                        'message' => 'No se encontró el día festivo'
                    ]);
                }

                break;
            } 
            
            if (isset($_GET['Anio'])) {

                $Anio = (int) $_GET['Anio'];

                $query = "
                    SELECT
                        IdDiaFestivo,
                        Anio,
                        Fecha,
                        Nombre,
                        Tipo,
                        Descripcion,
                        FechaRegistro,
                        UsuarioRegistro
                    FROM dbo.t_diasFestivos
                    WHERE Anio = :Anio
                    ORDER BY Fecha ASC
                ";

                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(":Anio", $Anio);

                $stmt->execute();

                $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    'status' => true,
                    'data' => $data
                ]);

                break;
            }


            /*
             * GET sin parámetros
             *
             * Devuelve todos los años.
             */
            $query = "
                SELECT
                    IdDiaFestivo,
                    Anio,
                    Fecha,
                    Nombre,
                    Tipo,
                    Descripcion,
                    FechaRegistro,
                    UsuarioRegistro
                FROM dbo.t_diasFestivos
                ORDER BY Anio DESC, Fecha ASC
            ";

            $stmt = $Conexion->prepare($query);

            $stmt->execute();

            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);

            echo json_encode([
                'status' => true,
                'data' => $data
            ]);

            break;

 
        case "DELETE": 
            if (!isset($_GET['IdDiaFestivo'])) { 
                http_response_code(400); 
                echo json_encode([
                    'status' => false,
                    'message' => 'IdDiaFestivo no proporcionado'
                ]); 
                exit;
            }

            $IdDiaFestivo = (int) $_GET['IdDiaFestivo'];
            $query = "
                DELETE FROM dbo.t_diasFestivos
                WHERE IdDiaFestivo = :IdDiaFestivo
            "; 
            $stmt = $Conexion->prepare($query); 
            $stmt->bindParam(
                ":IdDiaFestivo",
                $IdDiaFestivo
            ); 
            $stmt->execute();
 
            if ($stmt->rowCount() > 0) { 
                http_response_code(200); 
                echo json_encode([
                    'status' => true,
                    'message' => 'Día festivo eliminado correctamente'
                ]); 
            } else { 
                http_response_code(404); 
                echo json_encode([
                    'status' => false,
                    'message' => 'No se encontró el día festivo'
                ]);
            }

            break;


        default:
            http_response_code(405);
            echo json_encode([
                'status' => false,
                'message' => 'Método no permitido'
            ]);
            break;
    }

} catch (Throwable $th) {
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $th->getMessage()
    ]);

} finally {
    $Conexion = null;
}
?>