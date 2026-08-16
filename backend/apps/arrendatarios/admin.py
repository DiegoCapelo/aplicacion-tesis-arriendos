from django.contrib import admin

from .models import Arrendatario


@admin.register(Arrendatario)
class ArrendatarioAdmin(admin.ModelAdmin):
    list_display = ("id", "nombres", "apellidos", "cedula", "telefono", "estado")
    list_filter = ("estado",)
    search_fields = ("nombres", "apellidos", "cedula", "telefono", "correo")
