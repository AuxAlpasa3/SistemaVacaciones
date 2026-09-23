<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

require_once '../../db/Connection.php';

date_default_timezone_set('America/Mexico_City');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$idUsuario = isset($_GET['IdUsuario']) ? intval($_GET['IdUsuario']) : 0;
$accion = isset($_GET['accion']) ? $_GET['accion'] : '';

try {
    if ($idUsuario <= 0) {
        throw new Exception('IdUsuario es requerido');
    }

    $queryUser = "SELECT u.IdUsuario, u.EmpleadoID, u.Rol, p.departamento
                  FROM t_usuario u
                  LEFT JOIN t_personal p ON p.IdPersonal = u.EmpleadoID
                  WHERE u.IdUsuario = :IdUsuario";
    $stmtUser = $Conexion->prepare($queryUser);
    $stmtUser->bindParam(':IdUsuario', $idUsuario, PDO::PARAM_INT);
    $stmtUser->execute();
    $usuarioData = $stmtUser->fetch(PDO::FETCH_ASSOC);

    if (!$usuarioData) {
        throw new Exception('Usuario no encontrado');
    }

    $rolUsuario = intval($usuarioData['Rol'] ?? 0);
    $empleadoIDUsuario = intval($usuarioData['EmpleadoID'] ?? 0);
    $departamentoUsuario = intval($usuarioData['departamento'] ?? 0);

    if (!in_array($rolUsuario, [1, 2, 3])) {
        throw new Exception('No tiene permisos para realizar esta acción');
    }

    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                $data = $_POST;
            }

            $solicitudes = $data['Solicitudes'] ?? null;
            $idVacacionesOriginal = isset($data['IdVacacionesOriginal']) ? intval($data['IdVacacionesOriginal']) : 0;

            if (!$solicitudes || !is_array($solicitudes) || count($solicitudes) === 0) {
                throw new Exception('Se requiere el array de Solicitudes');
            }

            $Conexion->beginTransaction();

            try {
                if ($accion === 'reemplazar' && $idVacacionesOriginal > 0) {
                    $queryGetOrig = "SELECT IdPersonal FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
                    $stmtGetOrig = $Conexion->prepare($queryGetOrig);
                    $stmtGetOrig->bindParam(':IdVacaciones', $idVacacionesOriginal, PDO::PARAM_INT);
                    $stmtGetOrig->execute();
                    $idPersonalOrig = $stmtGetOrig->fetchColumn();

                    if ($idPersonalOrig === false) {
                        throw new Exception('Solicitud original no encontrada');
                    }

                    if ($rolUsuario === 3 && $empleadoIDUsuario !== intval($idPersonalOrig) && $departamentoUsuario > 0) {
                        $queryCheckDepto = "SELECT departamento FROM t_personal WHERE IdPersonal = :IdPersonal";
                        $stmtCheckDepto = $Conexion->prepare($queryCheckDepto);
                        $stmtCheckDepto->bindParam(':IdPersonal', $idPersonalOrig, PDO::PARAM_INT);
                        $stmtCheckDepto->execute();
                        $deptoSolicitud = intval($stmtCheckDepto->fetchColumn());

                        if ($deptoSolicitud !== $departamentoUsuario) {
                            throw new Exception('No tiene permisos para modificar esta solicitud');
                        }
                    }

                    $queryDel = "DELETE FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
                    $stmtDel = $Conexion->prepare($queryDel);
                    $stmtDel->bindParam(':IdVacaciones', $idVacacionesOriginal, PDO::PARAM_INT);
                    $stmtDel->execute();
                }

                $idsCreados = [];

                foreach ($solicitudes as $sol) {
                    $idPersonalSol = intval($sol['IdPersonal'] ?? 0);
                    if ($idPersonalSol <= 0) {
                        throw new Exception('IdPersonal es requerido en cada solicitud');
                    }

                    $usuarioSolicita = $sol['UsuarioSolicita'] ?? '';
                    $usuarioAutoriza = $sol['UsuarioAutoriza'] ?? '';
                    $fechaAutoriza = !empty($sol['FechaAutoriza']) ? $sol['FechaAutoriza'] : null;
                    $estatus = isset($sol['Estatus']) ? intval($sol['Estatus']) : 0;

                    if (!empty($usuarioSolicita) && !empty($usuarioAutoriza)) {
                        $queryGetEmpleadoID = "SELECT EmpleadoID FROM t_usuario WHERE IdUsuario = :idUsuario";

                        $stmtSol = $Conexion->prepare($queryGetEmpleadoID);
                        $stmtSol->bindParam(':idUsuario', $usuarioSolicita, PDO::PARAM_INT);
                        $stmtSol->execute();
                        $empleadoIDSolicitante = $stmtSol->fetchColumn();

                        $stmtAut = $Conexion->prepare($queryGetEmpleadoID);
                        $stmtAut->bindParam(':idUsuario', $usuarioAutoriza, PDO::PARAM_INT);
                        $stmtAut->execute();
                        $empleadoIDAutorizador = $stmtAut->fetchColumn();

                        if ($empleadoIDSolicitante !== false && $empleadoIDAutorizador !== false &&
                            $empleadoIDSolicitante == $empleadoIDAutorizador) {
                            $usuarioAutoriza = '';
                            $fechaAutoriza = null;
                            $estatus = 0;
                        }
                    }

                    $fechaSolicitud = !empty($sol['FechaSolicitud']) ? $sol['FechaSolicitud'] : date('Y-m-d');
                    $fechaInicio = !empty($sol['FechaInicio']) ? $sol['FechaInicio'] : null;
                    $fechaFin = !empty($sol['FechaFin']) ? $sol['FechaFin'] : null;
                    $fechaRetorno = !empty($sol['FechaRetornoLabores']) ? $sol['FechaRetornoLabores'] : null;

                    $saldoDias = isset($sol['SaldoDias']) ? intval($sol['SaldoDias']) : 0;
                    $diasCorresponden = isset($sol['DiasCorresponden']) ? intval($sol['DiasCorresponden']) : 0;
                    $antiguedad = isset($sol['Antiguedad']) ? intval($sol['Antiguedad']) : 0;
                    $noContarDomingos = isset($sol['NoContarDomingos']) ? intval($sol['NoContarDomingos']) : 0;
                    $anio = isset($sol['Anio']) ? intval($sol['Anio']) : 0;

                    $query = "INSERT INTO t_Vacaciones (
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
                                Antiguedad,
                                NoContarDomingos
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
                                :Antiguedad,
                                :NoContarDomingos
                              )";

                    $stmt = $Conexion->prepare($query);
                    $stmt->bindParam(':IdPersonal', $idPersonalSol, PDO::PARAM_INT);
                    $stmt->bindParam(':FechaSolicitud', $fechaSolicitud);
                    $stmt->bindParam(':UsuarioSolicita', $usuarioSolicita);
                    $stmt->bindParam(':UsuarioAutoriza', $usuarioAutoriza);
                    $stmt->bindParam(':FechaAutoriza', $fechaAutoriza);
                    $stmt->bindParam(':FechaInicio', $fechaInicio);
                    $stmt->bindParam(':FechaFin', $fechaFin);
                    $stmt->bindParam(':DiasTomar', $sol['DiasTomar'], PDO::PARAM_INT);
                    $stmt->bindParam(':FechaRetornoLabores', $fechaRetorno);
                    $stmt->bindParam(':Estatus', $estatus, PDO::PARAM_INT);
                    $stmt->bindParam(':Anio', $anio, PDO::PARAM_INT);
                    $stmt->bindParam(':Comentarios', $sol['Comentarios']);
                    $stmt->bindParam(':SaldoDias', $saldoDias, PDO::PARAM_INT);
                    $stmt->bindParam(':DiasCorresponden', $diasCorresponden, PDO::PARAM_INT);
                    $stmt->bindParam(':Antiguedad', $antiguedad, PDO::PARAM_INT);
                    $stmt->bindParam(':NoContarDomingos', $noContarDomingos, PDO::PARAM_INT);

                    if (!$stmt->execute()) {
                        throw new Exception('Error al insertar registro de vacaciones');
                    }

                    $idsCreados[] = $Conexion->lastInsertId();
                }

                $Conexion->commit();

                echo json_encode([
                    'status' => true,
                    'data' => [
                        'IdsCreados' => $idsCreados,
                        'TotalRegistros' => count($idsCreados),
                        'reemplazo' => ($accion === 'reemplazar')
                    ],
                    'message' => count($idsCreados) === 1
                        ? 'Solicitud de vacaciones creada correctamente'
                        : 'Solicitudes de vacaciones creadas correctamente (' . count($idsCreados) . ' registros)'
                ]);
            } catch (Exception $e) {
                $Conexion->rollBack();
                throw $e;
            }
            break;

        case 'PUT':
            $idVacaciones = isset($_GET['IdVacaciones']) ? intval($_GET['IdVacaciones']) : 0;
            if ($idVacaciones <= 0) {
                throw new Exception('IdVacaciones es requerido');
            }

            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) {
                throw new Exception('Datos inválidos');
            }

            $queryGetVac = "SELECT IdPersonal, UsuarioSolicita FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
            $stmtGetVac = $Conexion->prepare($queryGetVac);
            $stmtGetVac->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
            $stmtGetVac->execute();
            $vacacionActual = $stmtGetVac->fetch(PDO::FETCH_ASSOC);

            if (!$vacacionActual) {
                throw new Exception('Solicitud de vacaciones no encontrada');
            }

            $idPersonalSolicitud = intval($vacacionActual['IdPersonal']);

            if ($rolUsuario === 3 && $empleadoIDUsuario !== $idPersonalSolicitud && $departamentoUsuario > 0) {
                $queryCheckDepto = "SELECT departamento FROM t_personal WHERE IdPersonal = :IdPersonal";
                $stmtCheckDepto = $Conexion->prepare($queryCheckDepto);
                $stmtCheckDepto->bindParam(':IdPersonal', $idPersonalSolicitud, PDO::PARAM_INT);
                $stmtCheckDepto->execute();
                $deptoSolicitud = intval($stmtCheckDepto->fetchColumn());

                if ($deptoSolicitud !== $departamentoUsuario) {
                    throw new Exception('No tiene permisos para modificar esta solicitud');
                }
            }

            $usuarioAutoriza = $data['UsuarioAutoriza'] ?? '';
            $usuarioSolicita = $vacacionActual['UsuarioSolicita'];
            $fechaAutoriza = $data['FechaAutoriza'] ?? null;
            $estatus = $data['Estatus'] ?? 0;

            if (!empty($usuarioAutoriza) && !empty($usuarioSolicita)) {
                $queryGetEmpleadoID = "SELECT EmpleadoID FROM t_usuario WHERE IdUsuario = :idUsuario";

                $stmtSol = $Conexion->prepare($queryGetEmpleadoID);
                $stmtSol->bindParam(':idUsuario', $usuarioSolicita, PDO::PARAM_INT);
                $stmtSol->execute();
                $empleadoIDSolicitante = $stmtSol->fetchColumn();

                $stmtAut = $Conexion->prepare($queryGetEmpleadoID);
                $stmtAut->bindParam(':idUsuario', $usuarioAutoriza, PDO::PARAM_INT);
                $stmtAut->execute();
                $empleadoIDAutorizador = $stmtAut->fetchColumn();

                if ($empleadoIDSolicitante !== false && $empleadoIDAutorizador !== false &&
                    $empleadoIDSolicitante == $empleadoIDAutorizador) {
                    $usuarioAutoriza = '';
                    $fechaAutoriza = null;
                    $estatus = 0;
                }
            }

            $saldoDias = isset($data['SaldoDias']) ? intval($data['SaldoDias']) : 0;
            $diasCorresponden = isset($data['DiasCorresponden']) ? intval($data['DiasCorresponden']) : 0;
            $antiguedad = isset($data['Antiguedad']) ? intval($data['Antiguedad']) : 0;
            $noContarDomingos = isset($data['NoContarDomingos']) ? intval($data['NoContarDomingos']) : 0;
            $anio = isset($data['Anio']) ? intval($data['Anio']) : 0;

            $fechaInicio = !empty($data['FechaInicio']) ? $data['FechaInicio'] : null;
            $fechaFin = !empty($data['FechaFin']) ? $data['FechaFin'] : null;
            $fechaRetorno = !empty($data['FechaRetornoLabores']) ? $data['FechaRetornoLabores'] : null;

            $query = "UPDATE t_Vacaciones SET
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
                        Antiguedad = :Antiguedad,
                        NoContarDomingos = :NoContarDomingos
                      WHERE IdVacaciones = :IdVacaciones";

            $stmt = $Conexion->prepare($query);
            $stmt->bindParam(':FechaInicio', $fechaInicio);
            $stmt->bindParam(':FechaFin', $fechaFin);
            $stmt->bindParam(':DiasTomar', $data['DiasTomar'], PDO::PARAM_INT);
            $stmt->bindParam(':FechaRetornoLabores', $fechaRetorno);
            $stmt->bindParam(':Anio', $anio, PDO::PARAM_INT);
            $stmt->bindParam(':Comentarios', $data['Comentarios']);
            $stmt->bindParam(':UsuarioAutoriza', $usuarioAutoriza);
            $stmt->bindParam(':FechaAutoriza', $fechaAutoriza);
            $stmt->bindParam(':Estatus', $estatus, PDO::PARAM_INT);
            $stmt->bindParam(':SaldoDias', $saldoDias, PDO::PARAM_INT);
            $stmt->bindParam(':DiasCorresponden', $diasCorresponden, PDO::PARAM_INT);
            $stmt->bindParam(':Antiguedad', $antiguedad, PDO::PARAM_INT);
            $stmt->bindParam(':NoContarDomingos', $noContarDomingos, PDO::PARAM_INT);
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
            if ($idVacaciones <= 0) {
                throw new Exception('IdVacaciones es requerido');
            }

            $queryGetVac = "SELECT IdPersonal FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
            $stmtGetVac = $Conexion->prepare($queryGetVac);
            $stmtGetVac->bindParam(':IdVacaciones', $idVacaciones, PDO::PARAM_INT);
            $stmtGetVac->execute();
            $idPersonalSolicitud = $stmtGetVac->fetchColumn();

            if ($idPersonalSolicitud === false) {
                throw new Exception('Solicitud de vacaciones no encontrada');
            }

            if ($rolUsuario === 3 && $empleadoIDUsuario !== intval($idPersonalSolicitud) && $departamentoUsuario > 0) {
                $queryCheckDepto = "SELECT departamento FROM t_personal WHERE IdPersonal = :IdPersonal";
                $stmtCheckDepto = $Conexion->prepare($queryCheckDepto);
                $stmtCheckDepto->bindParam(':IdPersonal', $idPersonalSolicitud, PDO::PARAM_INT);
                $stmtCheckDepto->execute();
                $deptoSolicitud = intval($stmtCheckDepto->fetchColumn());

                if ($deptoSolicitud !== $departamentoUsuario) {
                    throw new Exception('No tiene permisos para eliminar esta solicitud');
                }
            }

            $query = "DELETE FROM t_Vacaciones WHERE IdVacaciones = :IdVacaciones";
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