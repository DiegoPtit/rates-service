@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM Script de inicio para microservicios con PM2
REM ═══════════════════════════════════════════════════════════════════════════

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   INICIANDO MICROSERVICIOS DE TASAS DE CAMBIO CON PM2
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Verificar si PM2 está instalado
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 no está instalado.
    echo.
    echo Instalando PM2 globalmente...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No se pudo instalar PM2.
        echo Por favor, ejecuta manualmente: npm install -g pm2
        pause
        exit /b 1
    )
    echo [OK] PM2 instalado correctamente.
    echo.
)

REM Iniciar servicios con PM2
echo [*] Iniciando microservicios con PM2...
echo.
call pm2 start ecosystem.config.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] No se pudieron iniciar los microservicios.
    echo Verifica los logs con: pm2 logs
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   MICROSERVICIOS INICIADOS CORRECTAMENTE
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo   • BCV Microservice:     http://localhost:3001
echo   • Binance Microservice: http://localhost:3000
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.

REM Mostrar estado de los servicios
call pm2 status

echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo   COMANDOS ÚTILES:
echo ═══════════════════════════════════════════════════════════════════════════
echo.
echo   pm2 logs              Ver logs en tiempo real
echo   pm2 monit             Monitoreo interactivo
echo   pm2 restart all       Reiniciar todos los servicios
echo   pm2 stop all          Detener todos los servicios
echo   pm2 delete all        Eliminar todos los servicios de PM2
echo.
echo ═══════════════════════════════════════════════════════════════════════════
echo.

pause
