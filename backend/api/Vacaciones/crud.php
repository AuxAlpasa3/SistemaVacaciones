<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once '../../db/Connection.php';

$method = $_SERVER['REQUEST_METHOD'];
$idUsuario = isset($_GET['IdUsuario']) ? intval($_GET['IdUsuario']) : 0;

try {
    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                $data = $_POST;
            }
            
            $usuarioSolicita = $data['UsuarioSolicita'] ?? '';
            $empleadoIDSolicitante = null;
            
            if (!empty($usuarioSolicita)) {
                $queryCheckUser = "SELECT EmpleadoID FROM t_usuario WHERE Usuario = :usuario";
                $stmtCheck = $Conexion->prepare($queryCheckUser);
                $stmtCheck->bindParam(':usuario', $usuarioSolicita);
                $stmtCheck->execute();
                $empleadoIDSolicitante = $stmtCheck->fetchColumn();
            }
            
            $usuarioAutoriza = $data['UsuarioAutoriza'] ?? '';
            $empleadoIDAutorizador = null;
            
            if (!empty($usuarioAutoriza)) {
                $queryCheckAuth = "SELECT EmpleadoID FROM t_usuario WHERE Usuario = :usuario";
                $stmtCheckAuth = $Conexion->prepare($queryCheckAuth);
                $stmtCheckAuth->bindParam(':usuario', $usuarioAutoriza);
                $stmtCheckAuth->execute();
                $empleadoIDAutorizador = $stmtCheckAuth->fetchColumn();
            }
            
            $esMismoUsuario = false;
            if ($empleadoIDSolicitante !== null && $empleadoIDAutorizador !== null) {
                $esMismoUsuario = ($empleadoIDSolicitante == $empleadoIDAutorizador);
            }
            
            $fechaAutoriza = !empty($data['FechaAutoriza']) ? $data['FechaAutoriza'] : null;
            $estatus = isset($data['Estatus']) ? intval($data['Estatus']) : 0;
            
            if ($esMismoUsuario) {
                $usuarioAutoriza = '';
                $fechaAutoriza = null;
                $estatus = 0;
            }
            
            $saldoDias = isset($data['SaldoDias']) ? intval($data['SaldoDias']) : 0;
            $diasCorresponden = isset($data['DiasCorresponden']) ? intval($data['DiasCorresponden']) : 0;
            $antiguedad = isset($data['Antiguedad']) ? intval($data['Antiguedad']) : 0;
            
            $query = "INSERT INTO t_vacaciones (
                        IdPersonal, 
                        FechaSolicitud, 
                        UsuarioSolicita, 
                        UsuarioAutoriza,
                        FechaAutoriza,
                        FechaInicio, 
                        FechaFin, 
                        DiasTomar, 
                        FechaRetornoLabores, 
                        Estatus, 
                        Anio,
                        Comentarios,
                        SaldoDias,
                        DiasCorresponden,
                        Antiguedad
                      ) VALUES (
                        :IdPersonal, 
                        :FechaSolicitud, 
                        :UsuarioSolicita,
                        :UsuarioAutoriza,
                        :FechaAutoriza, 
                        :FechaInicio, 
                        :FechaFin, 
                        :DiasTomar, 
                        :FechaRetornoLabores, 
                        :Estatus, 
                        :Anio,
                        :Comentarios,
                        :SaldoDias,
                        :DiasCorresponden,
                        :Antiguedad
                      )";
            
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':IdPersonal', $data['IdPersonal'], PDO::PARAM_INT);
            $stmt->bindParam(':FechaSolicitud',  $data['FechaSolicitud']);
            $stmt->bindParam(':UsuarioSolicita', $usuarioSolicita);
            $stmt->bindParam(':UsuarioAutoriza', $usuarioAutoriza);
            $stmt->bindParam(':FechaAutoriza', $fechaAutoriza);
            $stmt->bindParam(':FechaInicio', $data['FechaInicio']);
            $stmt->bindParam(':FechaFin', $data['FechaFin']);
            $stmt->bindParam(':DiasTomar', $data['DiasTomar'], PDO::PARAM_INT);
            $stmt->bindParam(':FechaRetornoLabores', $data['FechaRetornoLabores']);
            $stmt->bindParam(':Estatus', $estatus, PDO::PARAM_INT);
            $stmt->bindParam(':Anio', $data['Anio'], PDO::PARAM_INT);
            $stmt->bindParam(':Comentarios', $data['Comentarios']);
            $stmt->bindParam(':SaldoDias', $saldoDias, PDO::PARAM_INT);
            $stmt->bindParam(':DiasCorresponden', $diasCorresponden, PDO::PARAM_INT);
            $stmt->bindParam(':Antiguedad', $antiguedad, PDO::PARAM_INT);

            if ($stmt->execute()) {
                echo json_encode([
                    'status' => true,
                    'data' => [
                        'IdVacaciones' => $Conexion->lastInsertId(),
                        'auto_autorizacion_prevenida' => $esMismoUsuario
                    ],
                    'message' => 'Solicitud de vacaciones creada correctamente'
                ]);
            } else {
                throw new Exception('Error al ejecutar la consulta');
            }
            break;
            
        case 'PUT':
            $idVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;
            $data = json_decode(file_get_contents('php://input'), true);
            
            $usuarioAutoriza = $data['UsuarioAutoriza'] ?? '';
            $usuarioSolicita = null;
            
            $queryGetSolicitante = "SELECT UsuarioSolicita FROM t_vacaciones WHERE IdVacaciones = :IdVacaciones";
            $stmtGetSolicitante = $Conexion->prepare($queryGetSolicitante);
            $stmtGetSolicitante->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
            $stmtGetSolicitante->execute();
            $usuarioSolicita = $stmtGetSolicitante->fetchColumn();
            
            if (!empty($usuarioAutoriza) && !empty($usuarioSolicita)) {
                $queryGetEmpleadoID = "SELECT EmpleadoID FROM t_usuario WHERE Usuario = :usuario";
                
                $stmtSolicitante = $Conexion->prepare($queryGetEmpleadoID);
                $stmtSolicitante->bindParam(':usuario', $usuarioSolicita);
                $stmtSolicitante->execute();
                $empleadoIDSolicitante = $stmtSolicitante->fetchColumn();
                
                $stmtAutorizador = $Conexion->prepare($queryGetEmpleadoID);
                $stmtAutorizador->bindParam(':usuario', $usuarioAutoriza);
                $stmtAutorizador->execute();
                $empleadoIDAutorizador = $stmtAutorizador->fetchColumn();
                
                if ($empleadoIDSolicitante !== null && $empleadoIDAutorizador !== null && 
                    $empleadoIDSolicitante == $empleadoIDAutorizador) {
                    $usuarioAutoriza = '';
                    $fechaAutoriza = null;
                    $estatus = 0;
                } else {
                    $fechaAutoriza = $data['FechaAutoriza'] ?? null;
                    $estatus = $data['Estatus'] ?? 0;
                }
            } else {
                $fechaAutoriza = $data['FechaAutoriza'] ?? null;
                $estatus = $data['Estatus'] ?? 0;
            }
            
            $saldoDias = isset($data['SaldoDias']) ? intval($data['SaldoDias']) : 0;
            $diasCorresponden = isset($data['DiasCorresponden']) ? intval($data['DiasCorresponden']) : 0;
            $antiguedad = isset($data['Antiguedad']) ? intval($data['Antiguedad']) : 0;
            
            $query = "UPDATE t_vacaciones SET 
                        FechaInicio = :FechaInicio,
                        FechaFin = :FechaFin,
                        DiasTomar = :DiasTomar,
                        FechaRetornoLabores = :FechaRetornoLabores,
                        Anio = :Anio,
                        Comentarios = :Comentarios,
                        UsuarioAutoriza = :UsuarioAutoriza,
                        FechaAutoriza = :FechaAutoriza,
                        Estatus = :Estatus,
                        SaldoDias = :SaldoDias,
                        DiasCorresponden = :DiasCorresponden,
                        Antiguedad = :Antiguedad
                      WHERE IdVacaciones = :IdVacaciones";
            
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':FechaInicio', $data['FechaInicio']);
            $stmt->bindParam(':FechaFin', $data['FechaFin']);
            $stmt->bindParam(':DiasTomar', $data['DiasTomar'], PDO::PARAM_INT);
            $stmt->bindParam(':FechaRetornoLabores', $data['FechaRetornoLabores']);
            $stmt->bindParam(':Anio', $data['Anio'], PDO::PARAM_INT);
            $stmt->bindParam(':Comentarios', $data['Comentarios']);
            $stmt->bindParam(':UsuarioAutoriza', $usuarioAutoriza);
            $stmt->bindParam(':FechaAutoriza', $fechaAutoriza);
            $stmt->bindParam(':Estatus', $estatus, PDO::PARAM_INT);
            $stmt->bindParam(':SaldoDias', $saldoDias, PDO::PARAM_INT);
            $stmt->bindParam(':DiasCorresponden', $diasCorresponden, PDO::PARAM_INT);
            $stmt->bindParam(':Antiguedad', $antiguedad, PDO::PARAM_INT);
            $stmt->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);

            if ($stmt->execute()) {
                echo json_encode([
                    'status' => true,
                    'data' => null,
                    'message' => 'Solicitud de vacaciones actualizada correctamente'
                ]);
            } else {
                throw new Exception('Error al ejecutar la consulta');
            }
            break;
            
        case 'DELETE':
            $idVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;
            
            $query = "DELETE FROM t_vacaciones WHERE IdVacaciones = :IdVacaciones";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'status' => true,
                    'data' => null,
                    'message' => 'Solicitud de vacaciones eliminada correctamente'
                ]);
            } else {
                throw new Exception('Error al ejecutar la consulta');
            }
            break;
            
        default:
            echo json_encode([
                'status' => false,
                'data' => null,
                'message' => 'Método no permitido'
            ]);
            break;
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'data' => null,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>