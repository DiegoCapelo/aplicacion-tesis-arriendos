from rest_framework import serializers

from apps.validaciones import validar_codigo, validar_monto_positivo, validar_texto_corto

from .models import Habitacion


class HabitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habitacion
        fields = [
            "id",
            "codigo",
            "descripcion",
            "precio_mensual",
            "estado",
            "servicios",
            "observaciones",
            "fecha_creacion",
            "fecha_actualizacion",
        ]
        read_only_fields = ["fecha_creacion", "fecha_actualizacion"]

    def validate_codigo(self, value):
        return validar_codigo(value)

    def validate_precio_mensual(self, value):
        return validar_monto_positivo(value, "El precio mensual")

    def validate_servicios(self, value):
        return validar_texto_corto(value, "Servicios", obligatorio=False, minimo=3)
