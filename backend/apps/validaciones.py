import re
from decimal import Decimal, InvalidOperation

from rest_framework import serializers


NOMBRE_REGEX = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$")
CODIGO_REGEX = re.compile(r"^[A-Za-z0-9-]+$")
TEXTO_CORTO_REGEX = re.compile(r"^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 .,#/-]+$")


def limpiar_texto(valor):
    if valor is None:
        return valor
    return " ".join(str(valor).strip().split())


def validar_nombre_persona(valor, campo="Este campo"):
    valor = limpiar_texto(valor)
    if not valor:
        raise serializers.ValidationError(f"{campo} es obligatorio.")
    if len(valor) < 3:
        raise serializers.ValidationError(f"{campo} debe tener al menos 3 caracteres.")
    if not NOMBRE_REGEX.fullmatch(valor):
        raise serializers.ValidationError(f"{campo} solo debe contener letras y espacios.")
    return valor


def validar_telefono(valor):
    valor = limpiar_texto(valor)
    if not valor:
        raise serializers.ValidationError("El teléfono es obligatorio.")
    if not valor.isdigit():
        raise serializers.ValidationError("El teléfono solo debe contener números.")
    if not 7 <= len(valor) <= 10:
        raise serializers.ValidationError("El teléfono debe tener entre 7 y 10 dígitos.")
    return valor


def validar_cedula_ecuador(valor):
    valor = limpiar_texto(valor)
    if not valor:
        raise serializers.ValidationError("La cédula es obligatoria.")
    if not valor.isdigit() or len(valor) != 10:
        raise serializers.ValidationError("La cédula debe tener 10 dígitos numéricos.")

    provincia = int(valor[:2])
    tercer_digito = int(valor[2])
    if provincia < 1 or provincia > 24 or tercer_digito > 5:
        raise serializers.ValidationError("La cédula no tiene un formato válido.")

    coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2]
    total = 0
    for indice, coeficiente in enumerate(coeficientes):
        producto = int(valor[indice]) * coeficiente
        if producto >= 10:
            producto -= 9
        total += producto
    verificador = 0 if total % 10 == 0 else 10 - (total % 10)

    if verificador != int(valor[9]):
        raise serializers.ValidationError("La cédula no es válida.")
    return valor


def validar_monto_positivo(valor, campo="El monto"):
    try:
        numero = Decimal(str(valor))
    except (InvalidOperation, TypeError):
        raise serializers.ValidationError(f"{campo} debe ser un número válido.")
    if numero <= 0:
        raise serializers.ValidationError(f"{campo} debe ser mayor que cero.")
    return valor


def validar_entero_positivo(valor, campo="La cantidad"):
    if int(valor) <= 0:
        raise serializers.ValidationError(f"{campo} debe ser mayor que cero.")
    return valor


def validar_codigo(valor):
    valor = limpiar_texto(valor).upper()
    if not valor:
        raise serializers.ValidationError("El código es obligatorio.")
    if len(valor) < 2:
        raise serializers.ValidationError("El código debe tener al menos 2 caracteres.")
    if not CODIGO_REGEX.fullmatch(valor):
        raise serializers.ValidationError("El código solo debe contener letras, números o guion.")
    return valor


def validar_texto_corto(valor, campo="Este campo", obligatorio=False, minimo=2, requiere_letra=False):
    valor = limpiar_texto(valor)
    if not valor:
        if obligatorio:
            raise serializers.ValidationError(f"{campo} es obligatorio.")
        return ""
    if len(valor) < minimo:
        raise serializers.ValidationError(f"{campo} debe tener al menos {minimo} caracteres.")
    if not TEXTO_CORTO_REGEX.fullmatch(valor):
        raise serializers.ValidationError(f"{campo} contiene caracteres no permitidos.")
    if requiere_letra and not any(caracter.isalpha() for caracter in valor):
        raise serializers.ValidationError(f"{campo} debe contener letras.")
    return valor
