@echo off
title EMIT - Application de gestion
cd /d "%~dp0app"
if not exist "EmitGestion.Api.exe" (
  echo [ERREUR] Application introuvable : %~dp0app\EmitGestion.Api.exe
  echo La publication n'a pas ete effectuee.
  pause
  exit /b 1
)
rem Port fixe (l'executable publie n'utilise pas le profil de developpement)
set "ASPNETCORE_URLS=http://localhost:5043"
echo ============================================================
echo   APPLICATION EMIT - Ecole de Management et d'Innovation
echo   Interface : http://localhost:5043
echo.
echo   Comptes : admin / admin123   (Administrateur)
echo             secretariat / secret123
echo.
echo   GARDEZ CETTE FENETRE OUVERTE pendant l'utilisation.
echo   Pour quitter l'application : fermez cette fenetre.
echo ============================================================
echo.
rem Ouvre le navigateur automatiquement apres quelques secondes
start "" /b cmd /c "timeout /t 5 /nobreak >nul & start "" http://localhost:5043"
EmitGestion.Api.exe
echo.
echo ============================================================
echo  Le serveur s'est arrete (code %ERRORLEVEL%).
echo  Si une erreur PostgreSQL apparait ci-dessus, verifiez que
echo  le service PostgreSQL est demarre.
echo ============================================================
pause
