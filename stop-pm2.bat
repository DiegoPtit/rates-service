@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script para detener microservicios con PM2
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   DETENIENDO MICROSERVICIOS
echo ═══════════════════════════════════════════════════════════════════════════
echo.

call pm2 stop all

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Microservicios detenidos correctamente.
    echo.
    call pm2 status
) else (
    echo.
    echo [ERROR] No se pudieron detener los microservicios.
    echo Verifica con: pm2 status
)

echo.
pause
