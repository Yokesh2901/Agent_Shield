# AgentShield Windows PowerShell Development Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AGENTSHIELD - AI Agent Security & Action Governance     " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Python
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue
if (-not $pythonCmd) {
    Write-Error "Python not found in PATH. Please install Python 3.10+."
    exit 1
}

# 2. Check Node & npm
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Error "Node.js or npm not found in PATH. Please install Node.js 18+."
    exit 1
}

Write-Host "`n[1/4] Checking backend dependencies..." -ForegroundColor Green
python -m pip install -r backend/requirements.txt --quiet

Write-Host "`n[2/4] Running database seed and migrations..." -ForegroundColor Green
python backend/seed.py

Write-Host "`n[3/4] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$backendProcess = Start-Process -FilePath "uvicorn" -ArgumentList "app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload" -PassThru

Write-Host "`n[4/4] Launching React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process -FilePath "npm" -ArgumentList "run dev" -WorkingDirectory "$PSScriptRoot\frontend"

Write-Host "`nAgentShield is running!" -ForegroundColor Cyan
Write-Host "  - Frontend Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  - Backend Swagger:   http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "  - Prometheus Metrics: http://127.0.0.1:8000/metrics" -ForegroundColor White
Write-Host "`nPress Ctrl+C or close the terminal windows to stop." -ForegroundColor Yellow
