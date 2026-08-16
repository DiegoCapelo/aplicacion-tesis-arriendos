from rest_framework import serializers

from apps.validaciones import (
    validar_cedula_ecuador,
    validar_nombre_persona,
    validar_telefono,
    validar_texto_corto,
)

from .models import Arrendatario


class ArrendatarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Arrendatario
        fields = [
            "id",
            "usuario",
            "nombres",
            "apellidos",
            "cedula",
            "telefono",
            "correo",
            "direccion",
            "contacto_emergencia",
            "estado",
            "fecha_registro",
        ]
        read_only_fields = ["fecha_registro"]

    def validate_nombres(self, value):
        return validar_nombre_persona(value, "Nombres")

    def validate_apellidos(self, value):
        return validar_nombre_persona(value, "Apellidos")

    def validate_cedula(self, value):
        return validar_cedula_ecuador(value)

    def validate_telefono(self, value):
        return validar_telefono(value)

    def validate_contacto_emergencia(self, value):
        return validar_texto_corto(value, "Contacto de emergencia", obligatorio=False, minimo=3)
