@echo off
REM =====================================================
REM INICIAR SERVIDOR BANNERFLIX
REM =====================================================

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║         🎬 INICIANDO SERVIDOR BANNERFLIX 🎬           ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Verifica se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não está instalado!
    echo.
    echo Para instalar Node.js, visite: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado
echo.

REM Inicia o servidor
echo 🚀 Iniciando servidor na porta 3000...
echo.
node server-simples.js

pause
