param(
    [int]$Port = 5194
)

$ErrorActionPreference = "Stop"
$rootScript = Join-Path (Split-Path -Parent $PSScriptRoot) "start-backend.ps1"

if (!(Test-Path -LiteralPath $rootScript)) {
    throw "Khong tim thay script chay backend tai: $rootScript"
}

& $rootScript -Port $Port
