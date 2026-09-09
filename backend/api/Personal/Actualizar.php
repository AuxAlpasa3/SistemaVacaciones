<?php 
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, access, Origin, Accept");
    header("Access-Control-Max-Age: 86400");
    http_response_code(200);
    exit;
}
 
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, access, Origin, Accept");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
 
include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "PUT": 
            $inputData = file_get_contents("php://input");
            $putData = [];
             
            $jsonData = json_decode($inputData, true);
            if (json_last_error() === JSON_ERROR_NONE && $jsonData !== null) {
                $putData = $jsonData;
            } else { 
                parse_str($inputData, $putData);
            }
             
            if (empty($putData) && !empty($_POST)) {
                $putData = $_POST;
            } 
            if (empty($putData)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'No se recibieron datos']);
                exit;
            }
            
            if (!isset($putData['IdPersonal']) || empty($putData['IdPersonal'])) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El ID del personal es requerido']);
                exit;
            }
 
            $IdPersonal = trim($putData['IdPersonal']);
            $NoEmpleado = isset($putData['NoEmpleado']) && $putData['NoEmpleado'] !== '' ? $putData['NoEmpleado'] : null;
            $Nombre = trim($putData['Nombre'] ?? '');
            $ApPaterno = trim($putData['ApPaterno'] ?? '');
            $ApMaterno = trim($putData['ApMaterno'] ?? '');
            $FechaIngreso = isset($putData['FechaIngreso']) && $putData['FechaIngreso'] !== '' ? $putData['FechaIngreso'] : null;
            $Cargo = isset($putData['Cargo']) && $putData['Cargo'] !== '' ? $putData['Cargo'] : null;
            $Departamento = isset($putData['Departamento']) && $putData['Departamento'] !== '' ? $putData['Departamento'] : null;
            $Empresa = isset($putData['Empresa']) && $putData['Empresa'] !== '' ? $putData['Empresa'] : null;
            $Status = isset($putData['Status']) && $putData['Status'] !== '' ? $putData['Status'] : '1';
            $IdUbicacion = isset($putData['IdUbicacion']) && $putData['IdUbicacion'] !== '' ? $putData['IdUbicacion'] : null;
            $RutaFoto = trim($putData['RutaFoto'] ?? '');
            $Email = trim($putData['Email'] ?? '');
            $Contacto = isset($putData['Contacto']) && $putData['Contacto'] !== '' ? $putData['Contacto'] : null;
            $IdJefeInmediato = isset($putData['IdJefeInmediato']) && $putData['IdJefeInmediato'] !== '' ? $putData['IdJefeInmediato'] : null;
            $TipoSangre = trim($putData['TipoSangre'] ?? '');
            $NSS = trim($putData['NSS'] ?? '');
            $EsJefeInmediato = trim($putData['EsJefeInmediato'] ?? 'NO');
            $EsJefeInmediato = $EsJefeInmediato === 'SI' ? 1 : 0;
            $Alergias = trim($putData['Alergias'] ?? '');
            $Turno = isset($putData['Turno']) && $putData['Turno'] !== '' ? $putData['Turno'] : null;
            $FechadeNacimiento = isset($putData['FechadeNacimiento']) && $putData['FechadeNacimiento'] !== '' ? $putData['FechadeNacimiento'] : null;
            $Direccion = trim($putData['Direccion'] ?? '');
            $CURP = trim($putData['CURP'] ?? '');
            $RFC = trim($putData['RFC'] ?? '');
            $NivelJerarquico = isset($putData['NivelJerarquico']) && $putData['NivelJerarquico'] !== '' ? $putData['NivelJerarquico'] : null;
 

            $query = "UPDATE t_personal SET 
                        NoEmpleado = :NoEmpleado,
                        Nombre = :Nombre,
                        ApPaterno = :ApPaterno,
                        ApMaterno = :ApMaterno,
                        FechaIngreso = :FechaIngreso,
                        Cargo = :Cargo,
                        Departamento = :Departamento,
                        Empresa = :Empresa,
                        Status = :Status,
                        IdUbicacion = :IdUbicacion,
                        RutaFoto = :RutaFoto,
                        Email = :Email,
                        Contacto = :Contacto,
                        IdJefeInmediato = :IdJefeInmediato,
                        TipoSangre = :TipoSangre,
                        NSS = :NSS,
                        EsJefeInmediato = :EsJefeInmediato,
                        Alergias = :Alergias,
                        Turno = :Turno,
                        FechadeNacimiento = :FechadeNacimiento,
                        Direccion = :Direccion,
                        CURP = :CURP,
                        RFC = :RFC,
                        NivelJerarquico = :NivelJerarquico
                    WHERE IdPersonal = :IdPersonal";

            $stmt = $Conexion->prepare($query);
            
            // Bind de parámetros
            $stmt->bindParam(':IdPersonal', $IdPersonal);
            $stmt->bindParam(':NoEmpleado', $NoEmpleado);
            $stmt->bindParam(':Nombre', $Nombre);
            $stmt->bindParam(':ApPaterno', $ApPaterno);
            $stmt->bindParam(':ApMaterno', $ApMaterno);
            $stmt->bindParam(':FechaIngreso', $FechaIngreso);
            $stmt->bindParam(':Cargo', $Cargo);
            $stmt->bindParam(':Departamento', $Departamento);
            $stmt->bindParam(':Empresa', $Empresa);
            $stmt->bindParam(':Status', $Status);
            $stmt->bindParam(':IdUbicacion', $IdUbicacion);
            $stmt->bindParam(':RutaFoto', $RutaFoto);
            $stmt->bindParam(':Email', $Email);
            $stmt->bindParam(':Contacto', $Contacto);
            $stmt->bindParam(':IdJefeInmediato', $IdJefeInmediato);
            $stmt->bindParam(':TipoSangre', $TipoSangre);
            $stmt->bindParam(':NSS', $NSS);
            $stmt->bindParam(':EsJefeInmediato', $EsJefeInmediato);
            $stmt->bindParam(':Alergias', $Alergias);
            $stmt->bindParam(':Turno', $Turno);
            $stmt->bindParam(':FechadeNacimiento', $FechadeNacimiento);
            $stmt->bindParam(':Direccion', $Direccion);
            $stmt->bindParam(':CURP', $CURP);
            $stmt->bindParam(':RFC', $RFC);
            $stmt->bindParam(':NivelJerarquico', $NivelJerarquico);

            if ($stmt->execute()) {
                $affectedRows = $stmt->rowCount();
                http_response_code(200);
                echo json_encode([
                    'status' => true, 
                    'message' => 'Personal actualizado correctamente',
                    'affected_rows' => $affectedRows,
                    'id' => $IdPersonal
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al actualizar personal']);
            }
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
    if (isset($Conexion)) {
        $Conexion = null;
    }
}
?>