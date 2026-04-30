<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

include_once '../../db/Connection.php';

// Obtener el método de la petición
$method = $_SERVER['REQUEST_METHOD'];
$idVacaciones = isset($_GET['IdVacaciones']) ? $_GET['IdVacaciones'] : null;
$idUsuario = isset($_GET['IdUsuario']) ? $_GET['IdUsuario'] : null;

try {
    
    switch ($method) {
        case 'POST':
            // Crear nueva solicitud de vacaciones
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Si no hay datos en JSON, intentar obtener de $_POST
            if (empty($data)) {
                $data = $_POST;
            }
            
            // Buscar IdPersonal basado en NoEmpleado
            $queryPersonal = "SELECT IdPersonal FROM t_personal WHERE NoEmpleado = :noEmpleado";
            $stmtPersonal = $Conexion->prepare($queryPersonal);
            $stmtPersonal->bindParam(':noEmpleado', $data['NoEmpleado']);
            $stmtPersonal->execute();
            $personal = $stmtPersonal->fetch(PDO::FETCH_ASSOC);
            
            if (!$personal) {
                throw new Exception('Empleado no encontrado');
            }
            
            $idPersonal = $personal['IdPersonal'];
            
            $query = "INSERT INTO t_Vacaciones (
                        FechaSolicitud,
                        UsuarioSolicita,
                        IdPersonal,
                        FechaInicio,
                        FechaFin,
                        DiasTomar,
                        FechaRetornoLabores,
                        FechaAutoriza,
                        UsuarioAutoriza
                    ) VALUES (
                        :fechaSolicitud,
                        :usuarioSolicita,
                        :idPersonal,
                        :fechaInicio,
                        :fechaFin,
                        :diasTomar,
                        :fechaRetornoLabores,
                        :fechaAutoriza,
                        :usuarioAutoriza
                    )";
            
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':fechaSolicitud', $data['FechaSolicitud']);
            $stmt->bindParam(':usuarioSolicita', $idUsuario);
            $stmt->bindParam(':idPersonal', $idPersonal);
            $stmt->bindParam(':fechaInicio', $data['FechaInicio']);
            $stmt->bindParam(':fechaFin', $data['FechaFin']);
            $stmt->bindParam(':diasTomar', $data['DiasTomar']);
            $stmt->bindParam(':fechaRetornoLabores', $data['FechaRetornoLabores']);
            $stmt->bindParam(':fechaAutoriza', $data['FechaAutoriza']);
            $stmt->bindParam(':usuarioAutoriza', $idUsuario);
            
            if ($stmt->execute()) {
                $idVacaciones = $Conexion->lastInsertId();
                echo json_encode([
                    'status' => true,
                    'message' => 'Solicitud de vacaciones creada correctamente',
                    'data' => ['IdVacaciones' => $idVacaciones]
                ]);
            } else {
                throw new Exception('Error al crear la solicitud');
            }
            break;
            
        case 'PUT':
            // Actualizar solicitud de vacaciones
            if (!$idVacaciones) {
                throw new Exception('IdVacaciones es requerido');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            
            // Buscar IdPersonal basado en NoEmpleado
            $queryPersonal = "SELECT IdPersonal FROM t_personal WHERE NoEmpleado = :noEmpleado";
            $stmtPersonal = $Conexion->prepare($queryPersonal);
            $stmtPersonal->bindParam(':noEmpleado', $data['NoEmpleado']);
            $stmtPersonal->execute();
            $personal = $stmtPersonal->fetch(PDO::FETCH_ASSOC);
            
            if (!$personal) {
                throw new Exception('Empleado no encontrado');
            }
            
            $idPersonal = $personal['IdPersonal'];
            
            $query = "UPDATE t_Vacaciones SET 
                        FechaSolicitud = :fechaSolicitud,
                        UsuarioSolicita = :usuarioSolicita,
                        IdPersonal = :idPersonal,
                        FechaInicio = :fechaInicio,
                        FechaFin = :fechaFin,
                        DiasTomar = :diasTomar,
                        FechaRetornoLabores = :fechaRetornoLabores,
                        FechaAutoriza = :fechaAutoriza,
                        UsuarioAutoriza = :usuarioAutoriza
                    WHERE IdVacaciones = :idVacaciones";
            
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':fechaSolicitud', $data['FechaSolicitud']);
            $stmt->bindParam(':usuarioSolicita', $idUsuario);
            $stmt->bindParam(':idPersonal', $idPersonal);
            $stmt->bindParam(':fechaInicio', $data['FechaInicio']);
            $stmt->bindParam(':fechaFin', $data['FechaFin']);
            $stmt->bindParam(':diasTomar', $data['DiasTomar']);
            $stmt->bindParam(':fechaRetornoLabores', $data['FechaRetornoLabores']);
            $stmt->bindParam(':fechaAutoriza', $data['FechaAutoriza']);
            $stmt->bindParam(':usuarioAutoriza', $idUsuario);
            $stmt->bindParam(':idVacaciones', $idVacaciones);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'status' => true,
                    'message' => 'Solicitud de vacaciones actualizada correctamente',
                    'data' => []
                ]);
            } else {
                throw new Exception('Error al actualizar la solicitud');
            }
            break;
            
        case 'DELETE':
            // Eliminar solicitud de vacaciones
            if (!$idVacaciones) {
                throw new Exception('IdVacaciones es requerido');
            }
            
            $query = "DELETE FROM t_Vacaciones WHERE IdVacaciones = :idVacaciones";
            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':idVacaciones', $idVacaciones);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'status' => true,
                    'message' => 'Solicitud de vacaciones eliminada correctamente',
                    'data' => []
                ]);
            } else {
                throw new Exception('Error al eliminar la solicitud');
            }
            break;
            
        default:
            echo json_encode([
                'status' => false,
                'message' => 'Método no permitido',
                'data' => []
            ]);
            break;
    }
    
} catch (Exception $e) {
    echo json_encode([
        'status' => false,
        'message' => $e->getMessage(),
        'data' => []
    ]);
}
?>