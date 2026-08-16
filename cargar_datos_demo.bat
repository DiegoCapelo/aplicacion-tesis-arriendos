@echo off
cd /d C:\Users\Acer\Documents\Aplicacion_Tesis\backend
echo Cargando datos de ejemplo...
.venv\Scripts\python.exe manage.py cargar_datos_demo
pause
