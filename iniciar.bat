@echo off
title Cantina Express - Servidor Local
cd /d "%~dp0"
echo ======================================================
echo    INICIANDO CANTINA EXPRESS (PDV / COZINHA / TV)
echo ======================================================
echo.
echo Servidor Vite em execucao:
echo - Caixa:   http://localhost:5173/#caixa
echo - Cozinha: http://localhost:5173/#cozinha
echo - TV:      http://localhost:5173/#tv
echo.
start http://localhost:5173/#caixa
echo Pressione Ctrl+C para encerrar o servidor quando desejar.
echo.
npm run dev
pause
