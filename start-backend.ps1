param(
    [int]$Port = 5194
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "BE"

Write-Host "Checking port $Port..."
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
$processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)

foreach ($processId in $processIds) {
    if ($processId -and $processId -ne $PID) {
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping process $processId ($($process.ProcessName)) on port $Port..."
            Stop-Process -Id $processId -Force
        }
    }
}

Push-Location $backend
try {
    Write-Host "Building backend..."
    dotnet build .\WebsiteServiceEcommerce.API.csproj

    Write-Host "Starting backend at http://localhost:$Port ..."
    dotnet run --launch-profile http
}
finally {
    Pop-Location
}
