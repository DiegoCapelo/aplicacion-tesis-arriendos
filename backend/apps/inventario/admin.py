from django.contrib import admin

from .models import InventarioHabitacion


@admin.register(InventarioHabitacion)
class InventarioHabitacionAdmin(admin.ModelAdmin):
    list_display = ("id", "habitacion", "nombre_bien", "cantidad", "estado")
    list_filter = ("estado", "habitacion")
    search_fields = ("nombre_bien", "descripcion", "habitacion__codigo")
