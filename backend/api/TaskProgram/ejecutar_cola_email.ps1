 $phpPath = "C:\xampp\php\php.exe"
$scriptPath = "C:\xampp\htdocs\SistemaVacaciones\backend\api\TaskProgram\procesar_cola_email.php"
$logPath = "C:\xampp\htdocs\SistemaVacaciones\backend\api\TaskProgram\ejecucion_$(Get-Date -Format 'yyyyMMdd_HHmm').log"

$logDir = Split-Path $logPath -Parent
if (!(Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] INICIO - Cola Email"

try {
    $output = & $phpPath -f $scriptPath 2>&1
    Add-Content -Path $logPath -Value $output
} catch {
    Add-Content -Path $logPath -Value "ERROR: $($_.Exception.Message)"
}

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logPath -Value "[$timestamp] FIN - Cola Email"