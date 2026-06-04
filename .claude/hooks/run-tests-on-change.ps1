# PostToolUse hook (matcher: Edit|Write) -- corre los tests de la app cuando cambia codigo de
# packages/app y, si fallan, devuelve el error a Claude por stderr (exit 2).

$raw = [Console]::In.ReadToEnd()
$filePath = ""
try {
  $ti = ($raw | ConvertFrom-Json).tool_input
  if ($ti.file_path) { $filePath = $ti.file_path } elseif ($ti.path) { $filePath = $ti.path }
} catch { $filePath = "" }

# Normaliza separadores y filtra: solo .ts/.tsx dentro de packages/app/src
$fp = $filePath -replace '\\', '/'
if ($fp -notmatch 'packages/app/src/.*\.(ts|tsx)$') {
  exit 0
}

if ($env:CLAUDE_PROJECT_DIR) { Set-Location $env:CLAUDE_PROJECT_DIR }

$output = & npm run test:app 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
  Write-Output "[OK] Tests de la app en verde tras editar $filePath"
  exit 0
} else {
  $tail = ($output -split "`n" | Select-Object -Last 40) -join "`n"
  [Console]::Error.WriteLine("[FALLO] Los tests de la app fallan tras editar $filePath. Corrige antes de continuar:")
  [Console]::Error.WriteLine("----------------------------------------")
  [Console]::Error.WriteLine($tail)
  exit 2
}