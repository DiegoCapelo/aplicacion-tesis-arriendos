from django.contrib import admin

from .models import Arriendo, Garantia, Pago


@admin.register(Arriendo)
class ArriendoAdmin(admin.ModelAdmin):
    list_display = ("id", "arrendatario", "habitacion", "fecha_inicio", "estado")
    list_filter = ("estado", "fecha_inicio")
    search_fields = ("arrendatario__nombres", "arrendatario__apellidos", "habitacion__codigo")


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    list_display = ("id", "arriendo", "periodo", "monto", "estado", "metodo_pago", "fecha_vencimiento")
    list_filter = ("estado", "metodo_pago", "fecha_vencimiento")
    search_fields = (
        "periodo",
        "referencia_pago",
        "arriendo__arrendatario__nombres",
        "arriendo__arrendatario__apellidos",
    )


@admin.register(Garantia)
class GarantiaAdmin(admin.ModelAdmin):
    list_display = ("id", "arriendo", "monto", "estado", "fecha_entrega")
    list_filter = ("estado",)
    search_fields = ("arriendo__arrendatario__nombres", "arriendo__arrendatario__apellidos")
