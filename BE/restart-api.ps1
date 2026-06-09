$port = 5194
$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    $processIds = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($processId in $processIds) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping process $processId ($($process.ProcessName)) on port $port..."
            Stop-Process -Id $processId -Force
        }
    }
}

Write-Host "Starting API on http://localhost:$port ..."
dotnet run --urls "http://localhost:$port"
