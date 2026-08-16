from rest_framework import serializers

from apps.validaciones import validar_entero_positivo, validar_texto_corto

from .models import InventarioHabitacion


class InventarioHabitacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventarioHabitacion
        fields = [
            "id",
            "habitacion",
            "nombre_bien",
            "descripcion",
            "cantidad",
            "estado",
            "observaciones",
        ]

    def validate_nombre_bien(self, value):
        return validar_texto_corto(value, "Bien", obligatorio=True, minimo=3, requiere_letra=True)

    def validate_cantidad(self, value):
        return validar_entero_positivo(value, "La cantidad")
