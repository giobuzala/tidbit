Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")

Set-Location $projectRoot

if (-not (Test-Path ".venv")) {
  Write-Host "Creating virtual env in $projectRoot\.venv ..."
  python -m venv .venv
}

$activateScript = Join-Path $projectRoot ".venv\Scripts\Activate.ps1"
. $activateScript

Write-Host "Installing backend deps (editable) ..."
pip install -e . | Out-Null

$envFile = Join-Path $projectRoot "..\.env.local"
if (-not $env:OPENAI_API_KEY -and (Test-Path $envFile)) {
  Write-Host "Sourcing OPENAI_API_KEY from $envFile"
  foreach ($line in Get-Content $envFile) {
    if ($line -match "^\s*#") { continue }
    if ($line -match "^\s*$") { continue }
    if ($line -match "^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$") {
      $name = $Matches[1]
      $value = $Matches[2].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Substring(1, $value.Length - 2)
      } elseif ($value.StartsWith("'") -and $value.EndsWith("'")) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      Set-Item -Path "Env:$name" -Value $value
    }
  }
}

if (-not $env:OPENAI_API_KEY) {
  Write-Error "Set OPENAI_API_KEY in your environment or in .env.local before running this script."
  exit 1
}

Write-Host "Starting ChatKit backend on http://127.0.0.1:8000 ..."
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
