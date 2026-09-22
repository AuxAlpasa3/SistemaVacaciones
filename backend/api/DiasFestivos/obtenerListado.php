<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {

    switch ($method) {

        case "GET":

            if (isset($_GET['Anio']) && $_GET['Anio'] !== '') {

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

                $stmt->bindParam(
                    ":Anio",
                    $Anio,
                    PDO::PARAM_INT
                );

            } else {

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
            }


            $stmt->execute();

            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);


            if (!empty($data)) {

                http_response_code(200);

                echo json_encode([
                    'status' => true,
                    'data' => $data
                ]);

            } else {

                http_response_code(200);

                echo json_encode([
                    'status' => false,
                    'message' => 'No hay días festivos registrados',
                    'data' => []
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

} catch (\Throwable $th) {

    http_response_code(500);

    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $th->getMessage()
    ]);

} finally {

    $Conexion = null;
}
?>