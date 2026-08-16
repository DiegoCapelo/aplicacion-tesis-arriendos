from rest_framework.permissions import BasePermission

from apps.usuarios.models import Rol


def _rol_nombre(user):
    rol = getattr(user, "rol", None)
    return getattr(rol, "nombre", "")


def es_administrador(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and (user.is_superuser or _rol_nombre(user) == Rol.ADMIN)
    )


def es_encargado(user):
    return bool(
        user
        and user.is_authenticated
        and user.is_active
        and _rol_nombre(user) == Rol.ENCARGADO
    )


class EsAdministrador(BasePermission):
    message = "Solo un administrador puede realizar esta accion."

    def has_permission(self, request, view):
        return es_administrador(request.user)


class EsAdministradorOEncargado(BasePermission):
    message = "Solo administracion puede acceder a este modulo."

    def has_permission(self, request, view):
        return es_administrador(request.user) or es_encargado(request.user)
