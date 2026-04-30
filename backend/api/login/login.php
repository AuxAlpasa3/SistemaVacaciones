<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../../helpers/EncriptarToken.php';
require '../../vendor/autoload.php';
use \Firebase\JWT\JWT;

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "POST":
            $input = json_decode(file_get_contents('php://input'), true);
            $Username= $_POST['user'];  
             $Password= $_POST['pssw'];

            if (!$Username || !$Password) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Usuario y contraseña son requeridos', 'data' => []]);
                exit;
            }

            $query = "SELECT t1.IdUsuario, t1.Usuario,t1.Descripcion, t1.Contrasenia, t1.Estatus, t1.rol as IdRolUsuario,t2.RolUsuario, 
            t1.Sesion FROM t_usuario as t1 inner join t_rolusuario as t2
             on t1.rol = t2.IdRolUsuario
            WHERE usuario = :username and Estatus = 1";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':username', $Username); 
            $stmt->execute();
            $dataUser = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (count($dataUser) <= 0) {
                http_response_code(401); 
                echo json_encode(['status' => false, 'message' => 'Usuario o contraseña incorrectos', 'data' => []]);
                exit;
            }

            $storedPassword = $dataUser[0]['Contrasenia'] ?? $dataUser[0]['contrasenia'] ?? null;
            
            if (!$storedPassword) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error en los datos del usuario', 'data' => []]);
                exit;
            }

            if (!password_verify($Password, $storedPassword)) {
                http_response_code(401);
                echo json_encode(['status' => false, 'message' => 'Usuario o contraseña incorrectos', 'data' => []]);
                exit;
            }

            unset($dataUser[0]['Contrasenia']);
            unset($dataUser[0]['contrasenia']);

            $secretKey = 'tu_clave_secreta_super_segura_123';

            $payload = [
                'iss' => 'https://intranet.alpasamx.com/SistemaVacaciones/dist',
                'aud' => 'https://intranet.alpasamx.com/SistemaVacaciones/dist',
                'iat' => time(),
                'exp' => time() + (60 * 60),
                'data' => $dataUser[0]
            ];

            $jwt = JWT::encode($payload, $secretKey, 'HS256');

            $key = "82dnmka01mz4zmz0plqoalpa391sa10d";
            $encryptedJWT = encryptJWT($jwt, $key);

            http_response_code(200);
            echo json_encode([
                'status' => true, 
                'message' => 'Sesión iniciada correctamente', 
                'data' => $encryptedJWT
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['status' => false, 'message' => 'Método no permitido']);
            break;
    }
} catch (\Throwable $th) {
    http_response_code(500);
    echo json_encode(['status' => false, 'message' => 'Error: ' . $th->getMessage()]);
} finally {
    $Conexion = null;
}