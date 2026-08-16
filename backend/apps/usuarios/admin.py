from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Rol, Usuario


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "descripcion")
    search_fields = ("nombre",)


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Rol del sistema", {"fields": ("rol",)}),
    )
    list_display = ("id", "username", "email", "rol", "is_active", "is_staff")
    list_filter = ("rol", "is_active", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")
