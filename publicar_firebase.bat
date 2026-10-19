@echo off
title Cantina Express - Publicar no Firebase Hosting
cd /d "%~dp0"
echo ======================================================
echo    PUBLICANDO NO GOOGLE FIREBASE HOSTING
echo ======================================================
echo.
echo 1. Gerando build de producao...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao compilar o projeto.
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Enviando para o Firebase Hosting (cantina-express-32161)...
call npx firebase-tools deploy --only hosting
echo.
echo Processo finalizado!
pause
