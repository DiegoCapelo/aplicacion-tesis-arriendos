@echo off
cd /d C:\Users\Acer\Documents\Aplicacion_Tesis\backend
echo Iniciando backend Django en http://127.0.0.1:8000
echo Usuario admin: admin
echo Contrasena: Admin12345!
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
