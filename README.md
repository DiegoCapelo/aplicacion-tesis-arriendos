# Aplicacion web de arrendamientos

Sistema web para la gestion administrativa y de arrendamientos de habitaciones amobladas.

## Tecnologias propuestas

- Backend: Django + Django REST Framework
- Frontend: React + Vite
- Base de datos: PostgreSQL para produccion o tesis; SQLite para primeras pruebas locales

## Primer avance

Este repositorio ya contiene la estructura base del backend y frontend:

- Usuarios y roles
- Habitaciones
- Arrendatarios
- Arriendos
- Pagos
- Garantias
- Inventario
- Solicitudes de arrendamiento

## Siguiente paso tecnico

Instalar dependencias del backend, crear migraciones y levantar el servidor Django.

## Comandos de desarrollo

Backend:

```powershell
cd backend
.venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

Frontend:

```powershell
cd frontend
C:\Users\Acer\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd dev --host 127.0.0.1 --port 5173
```

URLs locales:

- Frontend: http://127.0.0.1:5173
- Backend API: http://127.0.0.1:8000/api/
- Admin Django: http://127.0.0.1:8000/admin/

Vistas principales:

- Usuario interesado: abrir `http://127.0.0.1:5173`. Esta pantalla muestra habitaciones disponibles y permite enviar una solicitud.
- Administrador visual: dentro de `http://127.0.0.1:5173`, presionar `Administracion`. Incluye habitaciones, solicitudes, arrendatarios, arriendos, pagos, garantias e inventario.
- Administrador Django interno: abrir `http://127.0.0.1:8000/admin/`.

Flujo de solicitudes:

1. El usuario interesado envia una solicitud desde la vista publica.
2. El administrador entra a `Administracion`.
3. Abre el modulo `Solicitudes`.
4. Revisa nombre, telefono, habitacion y mensaje.
5. Presiona `Aprobar` o `Rechazar`.

Usuario administrador local:

- Usuario: `admin`
- Contrasena: `Admin12345!`

## Datos de ejemplo

Para cargar habitaciones, inventario, un arrendatario, un arriendo, pagos y garantia de prueba:

```powershell
cd backend
.venv\Scripts\python.exe manage.py cargar_datos_demo
```

Despues abre el frontend en `http://127.0.0.1:5173` e inicia sesion con:

- Usuario: `admin`
- Contrasena: `Admin12345!`
