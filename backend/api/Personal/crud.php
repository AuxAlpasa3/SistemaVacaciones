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

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];
$action = $_GET['action'] ?? '';

function convertFechaIngreso($fecha) {
    if (empty($fecha)) return null;
    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $fecha, $matches)) {
        return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
    }
    if (preg_match('/^(\d{2})\s+(\d{2})\s+(\d{4})$/', $fecha, $matches)) {
        return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
    }
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return $fecha;
    }
    $timestamp = strtotime($fecha);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    return null;
}

function construirNombreCompleto($nombre, $apPaterno, $apMaterno) {
    $nombreCompleto = trim($nombre);
    if (!empty($apPaterno)) {
        $nombreCompleto .= ' ' . trim($apPaterno);
    }
    if (!empty($apMaterno)) {
        $nombreCompleto .= ' ' . trim($apMaterno);
    }
    return $nombreCompleto;
}

try {
    switch ($action) {
        case 'getAll':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT * FROM t_personal ORDER BY IdPersonal DESC";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getOne':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $IdPersonal = $_GET['IdPersonal'] ?? null;
            if (!$IdPersonal) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'IdPersonal es requerido']);
                break;
            }
            $query = "SELECT * FROM t_personal WHERE IdPersonal = :IdPersonal";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result) {
                echo json_encode(['status' => true, 'data' => $result]);
            } else {
                http_response_code(404);
                echo json_encode(['status' => false, 'message' => 'Personal no encontrado']);
            }
            break;

        case 'create':
            if ($method != 'POST') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $json_data = file_get_contents("php://input");
            $data = json_decode($json_data, true);
            if (empty($data) && !empty($_POST)) {
                $data = $_POST;
            }
            if (empty($data)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
                break;
            }
            $required_fields = ['NoEmpleado', 'Nombre', 'Cargo', 'Departamento'];
            foreach ($required_fields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400);
                    echo json_encode(['status' => false, 'message' => 'Datos incompletos. Campo requerido: ' . $field]);
                    break 2;
                }
            }
            $NoEmpleado = $data['NoEmpleado'];
            $FechaCreacion = date('Y-m-d H:i:s');
            $FechaIngreso = convertFechaIngreso($data['FechaIngreso'] ?? '');
            $FechadeNacimiento = convertFechaIngreso($data['FechadeNacimiento'] ?? '');
            $Nombre = mb_strtoupper(trim($data['Nombre']));
            $ApPaterno = isset($data['ApPaterno']) ? mb_strtoupper(trim($data['ApPaterno'])) : '';
            $ApMaterno = isset($data['ApMaterno']) ? mb_strtoupper(trim($data['ApMaterno'])) : '';
            $NombreCompleto = construirNombreCompleto($Nombre, $ApPaterno, $ApMaterno);
            $Cargo = $data['Cargo'] ?? null;
            $Departamento = $data['Departamento'] ?? null;
            $Empresa = $data['Empresa'] ?? null;
            $Status = $data['Status'] ?? '1';
            $IdUbicacion = $data['IdUbicacion'] ?? null;
            $Email = $data['Email'] ?? null;
            $Contacto = $data['Contacto'] ?? null;
            $IdJefeInmediato = !empty($data['IdJefeInmediato']) ? $data['IdJefeInmediato'] : null;
            $TipoSangre = $data['TipoSangre'] ?? null;
            $NSS = $data['NSS'] ?? null;
            $UsuarioCreacion = $data['UsuarioCreacion'] ?? null;
            $RutaFoto = $data['RutaFoto'] ?? null;
            $EsJefeInmediato = isset($data['EsJefeInmediato']) ? ($data['EsJefeInmediato'] === 'SI' ? 1 : 0) : 0;
            $Turno = !empty($data['Turno']) ? $data['Turno'] : null;
            $Alergias = $data['Alergias'] ?? null;
            $Direccion = $data['Direccion'] ?? null;

            $Conexion->beginTransaction();
            try {
                $query_per = "INSERT INTO t_personal (
                    NoEmpleado, FechaCreacion, FechaIngreso, FechadeNacimiento,
                    Nombre, ApPaterno, ApMaterno, NombreCompleto,
                    Cargo, Departamento, Empresa, Status, IdUbicacion,
                    Email, Contacto, IdJefeInmediato, TipoSangre, NSS,
                    UsuarioCreacion, RutaFoto, EsJefeInmediato, Turno, Alergias, Direccion
                ) VALUES (
                    :NoEmpleado, :FechaCreacion, :FechaIngreso, :FechadeNacimiento,
                    :Nombre, :ApPaterno, :ApMaterno, :NombreCompleto,
                    :Cargo, :Departamento, :Empresa, :Status, :IdUbicacion,
                    :Email, :Contacto, :IdJefeInmediato, :TipoSangre, :NSS,
                    :UsuarioCreacion, :RutaFoto, :EsJefeInmediato, :Turno, :Alergias, :Direccion
                )";
                $stmt_per = $Conexion->prepare($query_per);
                $stmt_per->bindParam(":NoEmpleado", $NoEmpleado);
                $stmt_per->bindParam(":FechaCreacion", $FechaCreacion);
                $stmt_per->bindParam(":FechaIngreso", $FechaIngreso);
                $stmt_per->bindParam(":FechadeNacimiento", $FechadeNacimiento);
                $stmt_per->bindParam(":Nombre", $Nombre);
                $stmt_per->bindParam(":ApPaterno", $ApPaterno);
                $stmt_per->bindParam(":ApMaterno", $ApMaterno);
                $stmt_per->bindParam(":NombreCompleto", $NombreCompleto);
                $stmt_per->bindParam(":Cargo", $Cargo);
                $stmt_per->bindParam(":Departamento", $Departamento);
                $stmt_per->bindParam(":Empresa", $Empresa);
                $stmt_per->bindParam(":Status", $Status);
                $stmt_per->bindParam(":IdUbicacion", $IdUbicacion);
                $stmt_per->bindParam(":Email", $Email);
                $stmt_per->bindParam(":Contacto", $Contacto);
                $stmt_per->bindParam(":IdJefeInmediato", $IdJefeInmediato);
                $stmt_per->bindParam(":TipoSangre", $TipoSangre);
                $stmt_per->bindParam(":NSS", $NSS);
                $stmt_per->bindParam(":UsuarioCreacion", $UsuarioCreacion);
                $stmt_per->bindParam(":RutaFoto", $RutaFoto);
                $stmt_per->bindParam(":EsJefeInmediato", $EsJefeInmediato, PDO::PARAM_INT);
                $stmt_per->bindParam(":Turno", $Turno);
                $stmt_per->bindParam(":Alergias", $Alergias);
                $stmt_per->bindParam(":Direccion", $Direccion);
                if (!$stmt_per->execute()) {
                    $errorInfo = $stmt_per->errorInfo();
                    throw new Exception("Error al insertar personal: " . $errorInfo[2]);
                }
                $IdPersonal = $Conexion->lastInsertId();
                $Conexion->commit();
                http_response_code(201);
                echo json_encode([
                    'status' => true,
                    'message' => 'Personal registrado exitosamente',
                    'data' => ['IdPersonal' => $IdPersonal]
                ]);
            } catch (Exception $e) {
                $Conexion->rollBack();
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al registrar personal: ' . $e->getMessage()]);
            }
            break;

        case 'update':
            if ($method != 'PUT') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $json_data = file_get_contents("php://input");
            $input = json_decode($json_data, true);
            if (empty($input) && !empty($_POST)) {
                $input = $_POST;
            }
            if (empty($input)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
                break;
            }
            $IdPersonal = $input['IdPersonal'] ?? null;
            if (!$IdPersonal) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'IdPersonal es requerido']);
                break;
            }
            $check_query = "SELECT IdPersonal, Nombre, ApPaterno, ApMaterno FROM t_personal WHERE IdPersonal = :IdPersonal";
            $check_stmt = $Conexion->prepare($check_query);
            $check_stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
            $check_stmt->execute();
            if ($check_stmt->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(['status' => false, 'message' => 'Personal no encontrado']);
                break;
            }
            $current_data = $check_stmt->fetch(PDO::FETCH_ASSOC);
            $update_fields = [];
            $params = [':IdPersonal' => $IdPersonal];
            $nombre = $current_data['Nombre'] ?? '';
            $apPaterno = $current_data['ApPaterno'] ?? '';
            $apMaterno = $current_data['ApMaterno'] ?? '';
            $actualizarNombreCompleto = false;

            if (isset($input['NoEmpleado']) && $input['NoEmpleado'] !== '') {
                $update_fields[] = "NoEmpleado = :NoEmpleado";
                $params[':NoEmpleado'] = $input['NoEmpleado'];
            }
            if (array_key_exists('FechaIngreso', $input)) {
                $update_fields[] = "FechaIngreso = :FechaIngreso";
                $params[':FechaIngreso'] = convertFechaIngreso($input['FechaIngreso']);
            }
            if (array_key_exists('FechadeNacimiento', $input)) {
                $update_fields[] = "FechadeNacimiento = :FechadeNacimiento";
                $params[':FechadeNacimiento'] = convertFechaIngreso($input['FechadeNacimiento']);
            }
            if (isset($input['Nombre']) && $input['Nombre'] !== '') {
                $update_fields[] = "Nombre = :Nombre";
                $params[':Nombre'] = mb_strtoupper(trim($input['Nombre']));
                $nombre = $params[':Nombre'];
                $actualizarNombreCompleto = true;
            }
            if (array_key_exists('ApPaterno', $input)) {
                $update_fields[] = "ApPaterno = :ApPaterno";
                $params[':ApPaterno'] = mb_strtoupper(trim($input['ApPaterno']));
                $apPaterno = $params[':ApPaterno'];
                $actualizarNombreCompleto = true;
            }
            if (array_key_exists('ApMaterno', $input)) {
                $update_fields[] = "ApMaterno = :ApMaterno";
                $params[':ApMaterno'] = mb_strtoupper(trim($input['ApMaterno']));
                $apMaterno = $params[':ApMaterno'];
                $actualizarNombreCompleto = true;
            }
            if (array_key_exists('Cargo', $input)) {
                $update_fields[] = "Cargo = :Cargo";
                $params[':Cargo'] = $input['Cargo'];
            }
            if (array_key_exists('Departamento', $input)) {
                $update_fields[] = "Departamento = :Departamento";
                $params[':Departamento'] = $input['Departamento'];
            }
            if (array_key_exists('Empresa', $input)) {
                $update_fields[] = "Empresa = :Empresa";
                $params[':Empresa'] = $input['Empresa'];
            }
            if (array_key_exists('Status', $input)) {
                $update_fields[] = "Status = :Status";
                $params[':Status'] = $input['Status'];
            }
            if (array_key_exists('IdUbicacion', $input)) {
                $update_fields[] = "IdUbicacion = :IdUbicacion";
                $params[':IdUbicacion'] = $input['IdUbicacion'];
            }
            if (array_key_exists('Email', $input)) {
                $update_fields[] = "Email = :Email";
                $params[':Email'] = $input['Email'];
            }
            if (array_key_exists('Contacto', $input)) {
                $update_fields[] = "Contacto = :Contacto";
                $params[':Contacto'] = $input['Contacto'];
            }
            if (array_key_exists('IdJefeInmediato', $input)) {
                $update_fields[] = "IdJefeInmediato = :IdJefeInmediato";
                $params[':IdJefeInmediato'] = !empty($input['IdJefeInmediato']) ? $input['IdJefeInmediato'] : null;
            }
            if (array_key_exists('TipoSangre', $input)) {
                $update_fields[] = "TipoSangre = :TipoSangre";
                $params[':TipoSangre'] = $input['TipoSangre'];
            }
            if (array_key_exists('NSS', $input)) {
                $update_fields[] = "NSS = :NSS";
                $params[':NSS'] = $input['NSS'];
            }
            if (array_key_exists('RutaFoto', $input)) {
                $update_fields[] = "RutaFoto = :RutaFoto";
                $params[':RutaFoto'] = $input['RutaFoto'];
            }
            if (array_key_exists('EsJefeInmediato', $input)) {
                $update_fields[] = "EsJefeInmediato = :EsJefeInmediato";
                $params[':EsJefeInmediato'] = $input['EsJefeInmediato'] === 'SI' ? 1 : 0;
            }
            if (array_key_exists('Turno', $input)) {
                $update_fields[] = "Turno = :Turno";
                $params[':Turno'] = !empty($input['Turno']) ? $input['Turno'] : null;
            }
            if (array_key_exists('Alergias', $input)) {
                $update_fields[] = "Alergias = :Alergias";
                $params[':Alergias'] = $input['Alergias'];
            }
            if (array_key_exists('Direccion', $input)) {
                $update_fields[] = "Direccion = :Direccion";
                $params[':Direccion'] = $input['Direccion'];
            }
            if ($actualizarNombreCompleto) {
                $nombreCompleto = construirNombreCompleto($nombre, $apPaterno, $apMaterno);
                $update_fields[] = "NombreCompleto = :NombreCompleto";
                $params[':NombreCompleto'] = $nombreCompleto;
            }
            $update_fields[] = "FechaModificacion = NOW()";
            if (isset($input['UsuarioCreacion'])) {
                $update_fields[] = "UsuarioModificacion = :UsuarioModificacion";
                $params[':UsuarioModificacion'] = $input['UsuarioCreacion'];
            }
            if (empty($update_fields)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No hay campos para actualizar']);
                break;
            }
            try {
                $query = "UPDATE t_personal SET " . implode(', ', $update_fields) . " WHERE IdPersonal = :IdPersonal";
                $stmt = $Conexion->prepare($query);
                if (!$stmt->execute($params)) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al actualizar personal: " . $errorInfo[2]);
                }
                http_response_code(200);
                echo json_encode([
                    'status' => true,
                    'message' => 'Personal actualizado exitosamente',
                    'data' => ['IdPersonal' => $IdPersonal, 'filas_afectadas' => $stmt->rowCount()]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al actualizar el personal: ' . $e->getMessage()]);
            }
            break;

        case 'cambiarEstatus':
            if ($method != 'PUT') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $IdPersonal = $_GET['IdPersonal'] ?? null;
            $Status = $_GET['Status'] ?? null;
            $IdUsuario = $_GET['IdUsuario'] ?? null;
            if (!$IdPersonal || $Status === null) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'IdPersonal y Status son requeridos']);
                break;
            }
            $check_query = "SELECT IdPersonal FROM t_personal WHERE IdPersonal = :IdPersonal";
            $check_stmt = $Conexion->prepare($check_query);
            $check_stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
            $check_stmt->execute();
            if ($check_stmt->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(['status' => false, 'message' => 'Personal no encontrado']);
                break;
            }
            try {
                $query = "UPDATE t_personal SET Status = :Status, FechaModificacion = NOW(), UsuarioModificacion = :IdUsuario WHERE IdPersonal = :IdPersonal";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':Status', $Status);
                $stmt->bindParam(':IdUsuario', $IdUsuario);
                $stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
                if (!$stmt->execute()) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al cambiar estatus: " . $errorInfo[2]);
                }
                http_response_code(200);
                echo json_encode(['status' => true, 'message' => 'Estatus cambiado exitosamente']);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al cambiar estatus: ' . $e->getMessage()]);
            }
            break;

        case 'uploadPhoto':
            if ($method != 'POST') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No se recibió la foto']);
                break;
            }
            $IdPersonal = $_POST['IdPersonal'] ?? null;
            $nombreArchivo = $_POST['nombreArchivo'] ?? null;
            if (!$IdPersonal || !$nombreArchivo) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'IdPersonal y nombreArchivo son requeridos']);
                break;
            }
            $uploadDir = '../../uploads/personal/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            $rutaCompleta = $uploadDir . $nombreArchivo;
            if (move_uploaded_file($_FILES['foto']['tmp_name'], $rutaCompleta)) {
                $rutaRelativa = 'uploads/personal/' . $nombreArchivo;
                $query = "UPDATE t_personal SET RutaFoto = :RutaFoto WHERE IdPersonal = :IdPersonal";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':RutaFoto', $rutaRelativa);
                $stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
                $stmt->execute();
                echo json_encode([
                    'status' => true,
                    'message' => 'Foto subida exitosamente',
                    'data' => ['ruta' => $rutaRelativa]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al subir la foto']);
            }
            break;

        case 'getCargos':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdCargo as id, Cargo as valor FROM t_cargos ORDER BY Cargo";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getDepartamentos':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdDepartamento as id, Departamento as valor FROM t_departamentos ORDER BY Departamento";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getEmpresas':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdEmpresa as id, Empresa as valor FROM t_empresas ORDER BY Empresa";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getUbicaciones':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdUbicacion as id, Ubicacion as valor FROM t_ubicaciones ORDER BY Ubicacion";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getJefes':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdPersonal as id, NombreCompleto as valor FROM t_personal WHERE EsJefeInmediato = 1 AND Status = 1 ORDER BY NombreCompleto";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'getTurnos':
            if ($method != 'GET') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $query = "SELECT IdTurno as id, Turno as valor FROM t_turnos ORDER BY Turno";
            $stmt = $Conexion->prepare($query);
            $stmt->execute();
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['status' => true, 'data' => $results]);
            break;

        case 'createCargo':
            if ($method != 'POST') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $json_data = file_get_contents("php://input");
            $data = json_decode($json_data, true);
            if (empty($data) && !empty($_POST)) {
                $data = $_POST;
            }
            if (empty($data) || empty($data['Cargo'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Cargo es requerido']);
                break;
            }
            $Cargo = mb_strtoupper(trim($data['Cargo']));
            $IdUsuario = $_GET['IdUsuario'] ?? null;
            try {
                $query = "INSERT INTO t_cargos (Cargo, UsuarioCreacion) VALUES (:Cargo, :IdUsuario)";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':Cargo', $Cargo);
                $stmt->bindParam(':IdUsuario', $IdUsuario);
                if (!$stmt->execute()) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al crear cargo: " . $errorInfo[2]);
                }
                $IdCargo = $Conexion->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status' => true,
                    'message' => 'Cargo creado exitosamente',
                    'data' => ['IdCargo' => $IdCargo]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al crear cargo: ' . $e->getMessage()]);
            }
            break;

        case 'createDepartamento':
            if ($method != 'POST') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $json_data = file_get_contents("php://input");
            $data = json_decode($json_data, true);
            if (empty($data) && !empty($_POST)) {
                $data = $_POST;
            }
            if (empty($data) || empty($data['Departamento'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Departamento es requerido']);
                break;
            }
            $Departamento = mb_strtoupper(trim($data['Departamento']));
            $IdUsuario = $_GET['IdUsuario'] ?? null;
            try {
                $query = "INSERT INTO t_departamentos (Departamento, UsuarioCreacion) VALUES (:Departamento, :IdUsuario)";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':Departamento', $Departamento);
                $stmt->bindParam(':IdUsuario', $IdUsuario);
                if (!$stmt->execute()) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al crear departamento: " . $errorInfo[2]);
                }
                $IdDepartamento = $Conexion->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status' => true,
                    'message' => 'Departamento creado exitosamente',
                    'data' => ['IdDepartamento' => $IdDepartamento]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al crear departamento: ' . $e->getMessage()]);
            }
            break;

        case 'createEmpresa':
            if ($method != 'POST') {
                http_response_code(405);
                echo json_encode(['status' => false, 'message' => 'Método no permitido']);
                break;
            }
            $json_data = file_get_contents("php://input");
            $data = json_decode($json_data, true);
            if (empty($data) && !empty($_POST)) {
                $data = $_POST;
            }
            if (empty($data) || empty($data['Empresa'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'Empresa es requerido']);
                break;
            }
            $Empresa = mb_strtoupper(trim($data['Empresa']));
            $IdUsuario = $_GET['IdUsuario'] ?? null;
            try {
                $query = "INSERT INTO t_empresas (Empresa, UsuarioCreacion) VALUES (:Empresa, :IdUsuario)";
                $stmt = $Conexion->prepare($query);
                $stmt->bindParam(':Empresa', $Empresa);
                $stmt->bindParam(':IdUsuario', $IdUsuario);
                if (!$stmt->execute()) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al crear empresa: " . $errorInfo[2]);
                }
                $IdEmpresa = $Conexion->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status' => true,
                    'message' => 'Empresa creada exitosamente',
                    'data' => ['IdEmpresa' => $IdEmpresa]
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al crear empresa: ' . $e->getMessage()]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(['status' => false, 'message' => 'Acción no encontrada']);
    }
} catch (\Throwable $th) {
    http_response_code(500);
    echo json_encode(['status' => false, 'message' => 'Error: ' . $th->getMessage()]);
} finally {
    if (isset($Conexion)) {
        $Conexion = null;
    }
}
?>