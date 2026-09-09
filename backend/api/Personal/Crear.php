<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: access");
header("Access-Control-Allow-Methods: GET,POST,PUT,DELETE");
header("Content-Type: application/json; charset=UTF-8");

include_once '../../db/Connection.php';

$method = $_SERVER["REQUEST_METHOD"];

try {
    switch ($method) {
        case "POST":
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->NoEmpleado) || empty($data->NoEmpleado)) {
                http_response_code(400);
                echo json_encode(['status' => false, 'message' => 'El número de empleado es requerido']);
                exit;
            }

            $NoEmpleado = $data->NoEmpleado;
            $Nombre = $data->Nombre ?? '';
            $ApPaterno = $data->ApPaterno ?? '';
            $ApMaterno = $data->ApMaterno ?? '';
            $FechaIngreso = $data->FechaIngreso ?? null;
            $Cargo = $data->Cargo ?? null;
            $Departamento = $data->Departamento ?? null;
            $Empresa = $data->Empresa ?? null;
            $Status = $data->Status ?? '1';
            $IdUbicacion = $data->IdUbicacion ?? null;
            $RutaFoto = $data->RutaFoto ?? '';
            $Email = $data->Email ?? '';
            $Contacto = $data->Contacto ?? '';
            $IdJefeInmediato = $data->IdJefeInmediato ?? null;
            $TipoSangre = $data->TipoSangre ?? '';
            $NSS = $data->NSS ?? '';
            $EsJefeInmediato = $data->EsJefeInmediato ?? 'NO';
            $Alergias = $data->Alergias ?? '';
            $Turno = $data->Turno ?? null;
            $FechadeNacimiento = $data->FechadeNacimiento ?? null;
            $Direccion = $data->Direccion ?? '';
            $CURP = $data->CURP ?? '';
            $RFC = $data->RFC ?? '';
            $NivelJerarquico = $data->NivelJerarquico ?? null;
            $UsuarioCreacion = $data->UsuarioCreacion ?? null;

            $query = "INSERT INTO t_personal (
                        NoEmpleado, Nombre, ApPaterno, ApMaterno, FechaIngreso, 
                        Cargo, Departamento, Empresa, Status, IdUbicacion, 
                        RutaFoto, Email, Contacto, IdJefeInmediato, TipoSangre, 
                        NSS, EsJefeInmediato, Alergias, Turno, FechadeNacimiento, 
                        Direccion, CURP, RFC, NivelJerarquico, UsuarioCreacion, FechaCreacion
                    ) VALUES (
                        :NoEmpleado, :Nombre, :ApPaterno, :ApMaterno, :FechaIngreso,
                        :Cargo, :Departamento, :Empresa, :Status, :IdUbicacion,
                        :RutaFoto, :Email, :Contacto, :IdJefeInmediato, :TipoSangre,
                        :NSS, :EsJefeInmediato, :Alergias, :Turno, :FechadeNacimiento,
                        :Direccion, :CURP, :RFC, :NivelJerarquico, :UsuarioCreacion, NOW()
                    )";

            $stmt = $Conexion->prepare($query);
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
            $stmt->bindParam(':UsuarioCreacion', $UsuarioCreacion);

            if ($stmt->execute()) {
                $IdPersonal = $Conexion->lastInsertId();
                http_response_code(201);
                echo json_encode([
                    'status' => true, 
                    'message' => 'Personal creado correctamente',
                    'data' => ['IdPersonal' => $IdPersonal]
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['status' => false, 'message' => 'Error al crear personal']);
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
    $Conexion = null;
}
?>