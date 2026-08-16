@echo off
cd /d C:\Users\Acer\Documents\Aplicacion_Tesis
echo Abriendo backend y frontend...
start "Backend Django" cmd /k iniciar_backend.bat
start "Frontend React" cmd /k iniciar_frontend.bat
timeout /t 8 > nul
start http://127.0.0.1:5173
start http://127.0.0.1:8000/admin/
