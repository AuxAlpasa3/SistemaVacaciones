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

function formatDateForSQL($date) {
    if (empty($date)) return null;
    
    $timestamp = strtotime($date);
    if ($timestamp === false) {
        return null;
    }
    
    return date('Y-m-d H:i:s', $timestamp);
}

// Función para convertir fecha de dd mm aaaa a YYYY-MM-DD
function convertFechaIngreso($fecha) {
    if (empty($fecha)) return null;
    
    // Si la fecha viene en formato dd mm aaaa
    if (preg_match('/^(\d{2})\s+(\d{2})\s+(\d{4})$/', $fecha, $matches)) {
        return $matches[3] . '-' . $matches[2] . '-' . $matches[1];
    }
    
    // Si ya viene en formato YYYY-MM-DD
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $fecha)) {
        return $fecha;
    }
    
    // Intentar convertir con strtotime como fallback
    $timestamp = strtotime($fecha);
    if ($timestamp !== false) {
        return date('Y-m-d', $timestamp);
    }
    
    return null;
}

try {
    switch ($method) {
        case "GET":
            $IdPersonal = $_GET['IdPersonal'] ?? null;
            
            if ($IdPersonal) {
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
            } else {
                // Obtener todos los registros
                $query = "SELECT * FROM t_personal ORDER BY IdPersonal DESC";
                $stmt = $Conexion->prepare($query);
                $stmt->execute();
                $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
                
                echo json_encode(['status' => true, 'data' => $results]);
            }
            break;
            
        case "POST":
            $json_data = file_get_contents("php://input");
            $data = json_decode($json_data, true);
            
            if (empty($data) && !empty($_POST)) {
                $data = $_POST;
            }
            
            if (empty($data)) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
                exit;
            }
            
            $required_fields = ['NoEmpleado', 'Nombre', 'Cargo', 'Departamento'];
            
            foreach ($required_fields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    http_response_code(400); 
                    echo json_encode(['status' => false, 'message' => 'Datos incompletos. Campo requerido: ' . $field]);
                    exit;
                }
            }

            $NoEmpleado = $data['NoEmpleado'];
            $FechaCreacion = date('Y-m-d H:i:s');
            $FechaIngreso = convertFechaIngreso($data['FechaIngreso'] ?? '');
            $Nombre = mb_strtoupper($data['Nombre']);
            $ApPaterno = isset($data['ApPaterno']) ? mb_strtoupper($data['ApPaterno']) : '';
            $ApMaterno = isset($data['ApMaterno']) ? mb_strtoupper($data['ApMaterno']) : '';
            $Cargo = $data['Cargo'] ?? null;
            $Departamento = $data['Departamento'] ?? null;
            $Empresa = 1; // Siempre será 1
            $Status = $data['Status'] ?? 1;
            $IdUbicacion = $data['IdUbicacion'] ?? null;
            $Email = $data['Email'] ?? null;
            $Contacto = $data['Contacto'] ?? null;  
            $IdSupervisor = $data['IdSupervisor'] ?? null;
            $TipoSangre = $data['TipoSangre'] ?? null;
            $NSS = $data['NSS'] ?? null;
            $UsuarioCreacion = $data['UsuarioCreacion'] ?? null;
            $RutaFoto = $data['RutaFoto'] ?? null;
            $EsSupervisor = isset($data['EsSupervisor']) ? ($data['EsSupervisor'] === 'SI' ? 1 : 0) : 0;

            $Conexion->beginTransaction();

            try {
                $query_per = "INSERT INTO t_personal (
                    NoEmpleado, FechaCreacion, FechaIngreso, Nombre, ApPaterno, ApMaterno, Cargo, 
                    Departamento, Empresa, Status, IdUbicacion, Email, Contacto, 
                    IdSupervisor, TipoSangre, NSS, UsuarioCreacion, RutaFoto, EsSupervisor
                ) VALUES ( 
                    :NoEmpleado, :FechaCreacion, :FechaIngreso, :Nombre, :ApPaterno, :ApMaterno, :Cargo, 
                    :Departamento, :Empresa, :Status, :IdUbicacion, :Email, :Contacto, 
                    :IdSupervisor, :TipoSangre, :NSS, :UsuarioCreacion, :RutaFoto, :EsSupervisor
                )";

                $stmt_per = $Conexion->prepare($query_per);
                $stmt_per->bindParam(":NoEmpleado", $NoEmpleado);
                $stmt_per->bindParam(":FechaCreacion", $FechaCreacion);
                $stmt_per->bindParam(":FechaIngreso", $FechaIngreso);
                $stmt_per->bindParam(":Nombre", $Nombre);
                $stmt_per->bindParam(":ApPaterno", $ApPaterno);
                $stmt_per->bindParam(":ApMaterno", $ApMaterno);
                $stmt_per->bindParam(":Cargo", $Cargo);
                $stmt_per->bindParam(":Departamento", $Departamento);
                $stmt_per->bindParam(":Empresa", $Empresa, PDO::PARAM_INT);
                $stmt_per->bindParam(":Status", $Status);
                $stmt_per->bindParam(":IdUbicacion", $IdUbicacion);
                $stmt_per->bindParam(":Email", $Email);
                $stmt_per->bindParam(":Contacto", $Contacto);
                $stmt_per->bindParam(":IdSupervisor", $IdSupervisor);
                $stmt_per->bindParam(":TipoSangre", $TipoSangre);
                $stmt_per->bindParam(":NSS", $NSS);
                $stmt_per->bindParam(":UsuarioCreacion", $UsuarioCreacion);
                $stmt_per->bindParam(":RutaFoto", $RutaFoto);
                $stmt_per->bindParam(":EsSupervisor", $EsSupervisor, PDO::PARAM_INT);

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
                    'data' => [
                        'IdPersonal' => $IdPersonal
                    ]
                ]);

            } catch (Exception $e) {
                $Conexion->rollBack();
                throw $e;
            }
            break;

        case "PUT":
            $json_data = file_get_contents("php://input");
            $input = json_decode($json_data, true);
            
            if (empty($input) && !empty($_POST)) {
                $input = $_POST;
            }
            
            if (empty($input) && !empty($_GET)) {
                $input = $_GET;
            }
            
            if (empty($input)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
                exit;
            }

            $IdPersonal = $input['IdPersonal'] ?? null;
            
            if (!$IdPersonal) {
                http_response_code(400); 
                echo json_encode(['status' => false, 'message' => 'IdPersonal es requerido']);
                exit;
            }

            // Verificar si el registro existe
            $check_query = "SELECT IdPersonal FROM t_personal WHERE IdPersonal = :IdPersonal";
            $check_stmt = $Conexion->prepare($check_query);
            $check_stmt->bindParam(':IdPersonal', $IdPersonal, PDO::PARAM_INT);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() == 0) {
                http_response_code(404);
                echo json_encode(['status' => false, 'message' => 'Personal no encontrado']);
                exit;
            }

            // Preparar campos para actualizar
            $update_fields = [];
            $params = [':IdPersonal' => $IdPersonal];
            
            if (isset($input['NoEmpleado']) && $input['NoEmpleado'] !== '') {
                $update_fields[] = "NoEmpleado = :NoEmpleado";
                $params[':NoEmpleado'] = $input['NoEmpleado'];
            }
            
            if (isset($input['FechaIngreso'])) {
                $update_fields[] = "FechaIngreso = :FechaIngreso";
                $params[':FechaIngreso'] = convertFechaIngreso($input['FechaIngreso']);
            }
            
            if (isset($input['Nombre']) && $input['Nombre'] !== '') {
                $update_fields[] = "Nombre = :Nombre";
                $params[':Nombre'] = mb_strtoupper($input['Nombre']);
            }
            
            if (isset($input['ApPaterno'])) {
                $update_fields[] = "ApPaterno = :ApPaterno";
                $params[':ApPaterno'] = mb_strtoupper($input['ApPaterno']);
            }
            
            if (isset($input['ApMaterno'])) {
                $update_fields[] = "ApMaterno = :ApMaterno";
                $params[':ApMaterno'] = mb_strtoupper($input['ApMaterno']);
            }
            
            if (isset($input['Cargo'])) {
                $update_fields[] = "Cargo = :Cargo";
                $params[':Cargo'] = $input['Cargo'];
            }
            
            if (isset($input['Departamento'])) {
                $update_fields[] = "Departamento = :Departamento";
                $params[':Departamento'] = $input['Departamento'];
            }
            
            // Empresa siempre es 1, no se actualiza desde el frontend
            
            if (isset($input['Status'])) {
                $update_fields[] = "Status = :Status";
                $params[':Status'] = $input['Status'];
            }
            
            if (isset($input['IdUbicacion'])) {
                $update_fields[] = "IdUbicacion = :IdUbicacion";
                $params[':IdUbicacion'] = $input['IdUbicacion'];
            }
            
            if (isset($input['Email'])) {
                $update_fields[] = "Email = :Email";
                $params[':Email'] = $input['Email'];
            }
            
            if (isset($input['Contacto'])) {
                $update_fields[] = "Contacto = :Contacto";
                $params[':Contacto'] = $input['Contacto'];
            }
            
            if (isset($input['IdSupervisor'])) {
                $update_fields[] = "IdSupervisor = :IdSupervisor";
                $params[':IdSupervisor'] = $input['IdSupervisor'];
            }
            
            if (isset($input['TipoSangre'])) {
                $update_fields[] = "TipoSangre = :TipoSangre";
                $params[':TipoSangre'] = $input['TipoSangre'];
            }
            
            if (isset($input['NSS'])) {
                $update_fields[] = "NSS = :NSS";
                $params[':NSS'] = $input['NSS'];
            }

            if (isset($input['RutaFoto'])) {
                $update_fields[] = "RutaFoto = :RutaFoto";
                $params[':RutaFoto'] = $input['RutaFoto'];
            }

            if (isset($input['EsSupervisor'])) {
                $update_fields[] = "EsSupervisor = :EsSupervisor";
                $params[':EsSupervisor'] = $input['EsSupervisor'] === 'SI' ? 1 : 0;
            }
    
            if (empty($update_fields)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No hay campos para actualizar']);
                exit;
            }

            try {
                $query = "UPDATE t_personal SET " . implode(', ', $update_fields) . 
                         " WHERE IdPersonal = :IdPersonal";
                
                $stmt = $Conexion->prepare($query);
                
                if (!$stmt->execute($params)) {
                    $errorInfo = $stmt->errorInfo();
                    throw new Exception("Error al actualizar personal: " . $errorInfo[2]);
                }
                
                http_response_code(200);
                echo json_encode([
                    'status' => true,
                    'message' => 'Personal actualizado exitosamente',
                    'data' => [
                        'IdPersonal' => $IdPersonal,
                        'filas_afectadas' => $stmt->rowCount()
                    ]
                ]);
                
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'status' => false,
                    'message' => 'Error al actualizar el personal: ' . $e->getMessage()
                ]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['status' => false, 'message' => 'Método no permitido']);
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