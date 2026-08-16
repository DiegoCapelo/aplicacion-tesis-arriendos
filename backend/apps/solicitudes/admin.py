from django.contrib import admin

from .models import SolicitudArrendamiento


@admin.register(SolicitudArrendamiento)
class SolicitudArrendamientoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nombres",
        "telefono",
        "habitacion",
        "estado",
        "metodo_pago",
        "estado_pago",
        "fecha_solicitud",
    )
    list_filter = ("estado", "metodo_pago", "estado_pago", "fecha_solicitud")
    search_fields = ("nombres", "telefono", "correo", "habitacion__codigo", "referencia_pago")
