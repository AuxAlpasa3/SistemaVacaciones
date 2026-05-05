<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

include_once '../../db/Connection.php';

$method = $_SERVER['REQUEST_METHOD'];
$IdVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;
$IdUsuario = isset($_GET['IdUsuario']) ? intval($_GET['IdUsuario']) : 0;

try {
    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!$data) {
                $data = $_POST;
            }
            $IdPersonal = isset($data['IdPersonal']) ? intval($data['IdPersonal']) : 0;
            $IdUsuario = isset($data['UsuarioSolicita']) ? intval($data['UsuarioSolicita']) : 0;
            $FechaSolicitud = isset($data['FechaSolicitud']) ? $data['FechaSolicitud'] : null;
            $FechaInicio = isset($data['FechaInicio']) ? $data['FechaInicio'] : null;
            $FechaFin = isset($data['FechaFin']) ? $data['FechaFin'] : null;
            $FechaRetornoLabores = isset($data['FechaRetornoLabores']) ? $data['FechaRetornoLabores'] : null;
            $DiasTomar = isset($data['DiasTomar']) ? intval($data['DiasTomar']) : 0;   
            $Estatus = 1; // Estatus inicial para nueva solicitud

            $query = "INSERT INTO t_vacaciones (
                        IdPersonal,
                        FechaSolicitud,
                        FechaInicio,
                        FechaFin,
                        FechaRetornoLabores,
                        DiasTomar,
                        UsuarioSolicita,
                        Estatus
                    ) VALUES (
                        :id_personal,
                        :fecha_solicitud,
                        :fecha_inicio,
                        :fecha_fin,
                        :fecha_retorno,
                        :dias_tomar,
                        :usuario_solicita,
                        :estatus
                    )";
            
            $stmt = $Conexion->prepare($query);
            $stmt->execute([
                ':id_personal' => $data['IdPersonal'],
                ':fecha_solicitud' => $data['FechaSolicitud'],
                ':fecha_inicio' => $data['FechaInicio'],
                ':fecha_fin' => $data['FechaFin'],
                ':fecha_retorno' => $data['FechaRetornoLabores'],
                ':dias_tomar' => $data['DiasTomar'],
                ':usuario_solicita' => $data['UsuarioSolicita'],
                ':estatus' => $Estatus
            ]);
            
            $insertedId = $Conexion->lastInsertId();
            
            echo json_encode([
                'status' => true,
                'message' => 'Solicitud de vacaciones creada correctamente',
                'data' => ['IdVacaciones' => $insertedId]
            ]);
            break;
            
        case 'PUT': 
            if ($IdVacaciones <= 0) {
                throw new Exception('ID de vacaciones no válido');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            $query = "UPDATE t_vacaciones SET 
                        IdPersonal = :id_personal,
                        FechaSolicitud = CONVERT(datetime, :fecha_solicitud, 23),
                        FechaInicio = CONVERT(datetime, :fecha_inicio, 23),
                        FechaFin = CONVERT(datetime, :fecha_fin, 23),
                        FechaRetornoLabores = CONVERT(datetime, :fecha_retorno, 23),
                        DiasTomar = :dias_tomar,
                        UsuarioSolicita = :usuario_solicita,
                        UsuarioAutoriza = :usuario_autoriza,
                        FechaAutoriza = CONVERT(datetime, :fecha_autoriza, 23),
                        Estatus = :estatus
                      WHERE IdVacaciones = :id_vacaciones";
            
            $stmt = $Conexion->prepare($query);
            $stmt->execute([
                ':id_personal' => $data['IdPersonal'],
                ':fecha_solicitud' => $data['FechaSolicitud'],
                ':fecha_inicio' => $data['FechaInicio'],
                ':fecha_fin' => $data['FechaFin'],
                ':fecha_retorno' => $data['FechaRetornoLabores'],
                ':dias_tomar' => $data['DiasTomar'],
                ':usuario_solicita' => $data['UsuarioSolicita'],
                ':usuario_autoriza' => $data['UsuarioAutoriza'] ?? null,
                ':fecha_autoriza' => $data['FechaAutoriza'] ?? null,
                ':id_vacaciones' => $IdVacaciones,
                ':estatus' => $data['Estatus'] ?? null
            ]);
            
            echo json_encode([
                'status' => true,
                'message' => 'Solicitud de vacaciones actualizada correctamente'
            ]);
            break;
            
        case 'DELETE':
            if ($IdVacaciones <= 0) {
                throw new Exception('ID de vacaciones no válido');
            }
            
            $query = "DELETE FROM t_vacaciones WHERE IdVacaciones = :id_vacaciones";
            $stmt = $Conexion->prepare($query);
            $stmt->execute([':id_vacaciones' => $IdVacaciones]);
            
            echo json_encode([
                'status' => true,
                'message' => 'Solicitud de vacaciones eliminada correctamente'
            ]);
            break;
            
        default:
            throw new Exception('Método no permitido');
    }
} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Error en la operación: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => $e->getMessage()
    ]);
}
?>