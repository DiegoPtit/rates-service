@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script de verificación de estado de microservicios
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   VERIFICACIÓN DE ESTADO DE MICROSERVICIOS
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Verificar PM2
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] PM2 no está instalado
    echo     Instala con: npm install -g pm2
    echo.
    goto :check_manual
)

echo [*] Estado de PM2:
echo.
call pm2 status
echo.

:check_manual
echo ═══════════════════════════════════════════════════════════════════════════
echo   VERIFICACIÓN DE ENDPOINTS
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Verificar si curl está disponible
where curl >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [!] curl no está disponible
    echo     Verifica manualmente en tu navegador:
    echo     - http://localhost:3001/health (BCV)
    echo     - http://localhost:3000/health (Binance)
    echo.
    goto :end
)

echo [*] Verificando BCV Microservice (Puerto 3001)...
curl -s http://localhost:3001/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     [OK] BCV Microservice está respondiendo
    curl -s http://localhost:3001/health
) else (
    echo     [X] BCV Microservice NO está respondiendo
)
echo.

echo [*] Verificando Binance Microservice (Puerto 3000)...
curl -s http://localhost:3000/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo     [OK] Binance Microservice está respondiendo
    curl -s http://localhost:3000/health
) else (
    echo     [X] Binance Microservice NO está respondiendo
)
echo.

:end
echo ═══════════════════════════════════════════════════════════════════════════
echo.
pause
