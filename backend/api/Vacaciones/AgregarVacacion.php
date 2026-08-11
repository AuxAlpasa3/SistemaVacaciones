<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => false,
        'message' => 'Método no permitido. Solo se acepta POST'
    ]);
    exit();
}

include_once '../../db/Connection.php';

try {
    if (!isset($Conexion) || !$Conexion) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    $requiredFields = ['IdPersonal', 'FechaInicio', 'FechaFin', 'DiasTomar'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode([
                'status' => false,
                'message' => "El campo {$field} es requerido"
            ]);
            exit();
        }
    }
    
    $idPersonal = intval($data['IdPersonal']);
    $fechaSolicitud = $data['FechaSolicitud'] ?? date('Y-m-d H:i:s');
    $fechaInicio = $data['FechaInicio'];
    $fechaFin = $data['FechaFin'];
    $fechaRetornoLabores = $data['FechaRetornoLabores'] ?? date('Y-m-d', strtotime($fechaFin . ' +1 day'));
    $diasTomar = intval($data['DiasTomar']);
    $usuarioSolicita = $idPersonal;
    $fechaAutoriza = $data['FechaAutoriza'] ?? null;
    $estatus = isset($data['Estatus']) ? intval($data['Estatus']) : 2;
    $comentarios = $data['Comentarios'] ?? '';
    $usuarioValida = isset($data['UsuarioValida']) ? intval($data['UsuarioValida']) : 0;
    $fechaValidado = $data['FechaValidado'] ?? date('Y-m-d H:i:s');
    $anio = isset($data['Anio']) ? intval($data['Anio']) : intval(date('Y', strtotime($fechaInicio)));
    $noContarDomingos = isset($data['NoContarDomingos']) ? intval($data['NoContarDomingos']) : 1;
    $saldoDias = $data['SaldoDias'] ?? $diasTomar;
    $diasCorresponden = $data['DiasCorresponden'] ?? 12;
    $antiguedad = $data['Antiguedad'] ?? 1;
    
    $checkPersonal = "SET NOCOUNT ON; SELECT IdPersonal FROM t_Personal WHERE IdPersonal = ?";
    $stmtCheck = $Conexion->prepare($checkPersonal);
    $stmtCheck->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmtCheck->execute();
    
    $personalExiste = $stmtCheck->fetchColumn();
    $stmtCheck->closeCursor();
    $stmtCheck = null;
    
    if (!$personalExiste) {
        http_response_code(404);
        echo json_encode([
            'status' => false,
            'message' => 'Personal no encontrado'
        ]);
        exit();
    }
    
    $queryJefe = "SET NOCOUNT ON; 
                  SELECT IdUsuario 
                  FROM t_Personal as t1 
                  inner join t_usuario as t2 on t1.IdJefeInmediato=t2.EmpleadoID
                  WHERE IdPersonal = ?";
    $stmtJefe = $Conexion->prepare($queryJefe);
    $stmtJefe->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmtJefe->execute();
    
    $usuarioAutoriza = intval($stmtJefe->fetchColumn());
    $stmtJefe->closeCursor();
    $stmtJefe = null;
    
    if ($usuarioAutoriza === 0) {
        $usuarioAutoriza = 0;
    }
    
    $checkVacaciones = "SET NOCOUNT ON; SELECT COUNT(*) FROM t_Vacaciones 
                        WHERE IdPersonal = ? 
                        AND (
                            (FechaInicio <= ? AND FechaFin >= ?) OR
                            (FechaInicio <= ? AND FechaFin >= ?) OR
                            (FechaInicio >= ? AND FechaFin <= ?)
                        )
                        AND Estatus IN (1, 2, 3)";
    
    $stmtCheckVac = $Conexion->prepare($checkVacaciones);
    $stmtCheckVac->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmtCheckVac->bindParam(2, $fechaInicio);
    $stmtCheckVac->bindParam(3, $fechaInicio);
    $stmtCheckVac->bindParam(4, $fechaFin);
    $stmtCheckVac->bindParam(5, $fechaFin);
    $stmtCheckVac->bindParam(6, $fechaInicio);
    $stmtCheckVac->bindParam(7, $fechaFin);
    $stmtCheckVac->execute();
    
    $vacacionesExistentes = $stmtCheckVac->fetchColumn();
    $stmtCheckVac->closeCursor();
    $stmtCheckVac = null;
    
    if ($vacacionesExistentes > 0) {
        http_response_code(400);
        echo json_encode([
            'status' => false,
            'message' => 'Ya existe una vacación registrada en el rango de fechas seleccionado'
        ]);
        exit();
    }
    
    $Conexion->beginTransaction();
    
    $query = "INSERT INTO t_Vacaciones (
        IdPersonal, 
        FechaSolicitud, 
        FechaInicio, 
        FechaFin, 
        FechaRetornoLabores, 
        DiasTomar, 
        UsuarioSolicita, 
        UsuarioAutoriza, 
        FechaAutoriza, 
        Estatus, 
        Comentarios, 
        UsuarioValida, 
        FechaValidado, 
        Anio, 
        NoContarDomingos,
        SaldoDias,
        DiasCorresponden,
        Antiguedad,
        EmailEnviado15Dias,
        EmailEnviado7Dias,
        EmailRecordatorioRH,
        EmailAvisoCancelacion
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0
    )";
    
    $stmt = $Conexion->prepare($query);
    $stmt->bindParam(1, $idPersonal, PDO::PARAM_INT);
    $stmt->bindParam(2, $fechaSolicitud);
    $stmt->bindParam(3, $fechaInicio);
    $stmt->bindParam(4, $fechaFin);
    $stmt->bindParam(5, $fechaRetornoLabores);
    $stmt->bindParam(6, $diasTomar, PDO::PARAM_INT);
    $stmt->bindParam(7, $usuarioSolicita, PDO::PARAM_INT);
    $stmt->bindParam(8, $usuarioAutoriza, PDO::PARAM_INT);
    $stmt->bindParam(9, $fechaAutoriza);
    $stmt->bindParam(10, $estatus, PDO::PARAM_INT);
    $stmt->bindParam(11, $comentarios);
    $stmt->bindParam(12, $usuarioValida, PDO::PARAM_INT);
    $stmt->bindParam(13, $fechaValidado);
    $stmt->bindParam(14, $anio, PDO::PARAM_INT);
    $stmt->bindParam(15, $noContarDomingos, PDO::PARAM_INT);
    $stmt->bindParam(16, $saldoDias, PDO::PARAM_INT);
    $stmt->bindParam(17, $diasCorresponden, PDO::PARAM_INT);
    $stmt->bindParam(18, $antiguedad, PDO::PARAM_INT);
    
    if (!$stmt->execute()) {
        throw new Exception('Error al insertar la vacación');
    }
    
    $idVacacion = $Conexion->lastInsertId();
    $stmt->closeCursor();
    $stmt = null;
    
    $Conexion->commit();
    
    http_response_code(200);
    echo json_encode([
        'status' => true,
        'message' => 'Vacación registrada correctamente',
        'data' => [
            'IdVacaciones' => $idVacacion,
            'IdPersonal' => $idPersonal,
            'DiasTomar' => $diasTomar,
            'Estatus' => $estatus,
            'FechaInicio' => $fechaInicio,
            'FechaFin' => $fechaFin,
            'UsuarioSolicita' => $usuarioSolicita,
            'UsuarioAutoriza' => $usuarioAutoriza
        ]
    ]);
    
} catch (PDOException $e) {
    if (isset($Conexion) && $Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    if (isset($Conexion) && $Conexion->inTransaction()) {
        $Conexion->rollBack();
    }
    
    http_response_code(500);
    echo json_encode([
        'status' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>