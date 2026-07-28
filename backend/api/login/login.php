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

            $query = "SELECT t1.IdUsuario,t1.Usuario,t1.Contrasenia,t1.EmpleadoID,t1.Descripcion,t1.TipoUsuario,t4.TipoUsuario as TipoUsuarioNombre,t1.Estatus,t1.rol	,t3.RolUsuario, t1.Ubicacion,t5.NomLargo as UbicacionNombre,t2.IdPersonal,
                t2.NoEmpleado, concat(t2.Nombre,' ',t2.ApPaterno,' ',t2.ApMaterno) as NombreCompleto,	t6.NomCargo AS Cargo, t7.NomDepto as Departamento,	t8.NomEmpresa as Empresa,
                t2.Status,	t2.NSS,	t2.esJefeInmediato,	t2.RutaFoto,	t2.Email,	t2.Contacto,	concat(t9.Nombre,' ',t9.ApPaterno,' ',t9.ApMaterno) as IdJefeInmediato,
                t2.TipoSangre,	t2.FechaIngreso,	t2.Alergias,	t2.Turno,	t2.FechadeNacimiento,	t2.Direccion 
                FROM t_usuario as t1 
                LEFT join t_personal as t2 on t1.EmpleadoID = t2.IdPersonal
                LEFT JOIN t_rolUsuario as t3 on t1.rol=t3.IdRolUsuario
                LEFT JOIN t_tipoUsuario as t4 on t1.TipoUsuario=t4.IdTipoUsuario
                LEFT JOIN t_ubicacion as t5 on t1.Ubicacion=t5.IdUbicacion
                LEFT JOIN t_cargo as t6 on t2.Cargo=t6.IdCargo
                LEFT JOIN t_departamento as t7 on t2.Departamento=t7.IdDepartamento
                LEFT JOIN t_empresa as t8 on t2.Empresa=t8.IdEmpresa
                LEFT JOIN t_personal as t9 on t2.IdJefeInmediato =t9.IdPersonal
            WHERE t1.usuario = :username and t1.Estatus = 1";
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