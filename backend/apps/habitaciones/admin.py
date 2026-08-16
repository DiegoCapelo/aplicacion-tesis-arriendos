from django.contrib import admin

from .models import Habitacion


@admin.register(Habitacion)
class HabitacionAdmin(admin.ModelAdmin):
    list_display = ("id", "codigo", "precio_mensual", "estado")
    list_filter = ("estado",)
    search_fields = ("codigo", "descripcion", "servicios")
