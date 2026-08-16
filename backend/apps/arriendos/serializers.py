from rest_framework import serializers

from apps.validaciones import validar_monto_positivo, validar_texto_corto

from .models import Arriendo, Garantia, Pago


class ArriendoSerializer(serializers.ModelSerializer):
    arrendatario_nombre = serializers.SerializerMethodField()
    habitacion_codigo = serializers.CharField(source="habitacion.codigo", read_only=True)

    class Meta:
        model = Arriendo
        fields = [
            "id",
            "arrendatario",
            "arrendatario_nombre",
            "habitacion",
            "habitacion_codigo",
            "fecha_inicio",
            "fecha_fin",
            "valor_mensual",
            "estado",
            "observaciones",
            "fecha_creacion",
        ]
        read_only_fields = ["fecha_creacion", "arrendatario_nombre", "habitacion_codigo"]

    def get_arrendatario_nombre(self, obj):
        return str(obj.arrendatario)

    def validate_valor_mensual(self, value):
        return validar_monto_positivo(value, "El valor mensual")

    def validate(self, attrs):
        fecha_inicio = attrs.get("fecha_inicio") or getattr(self.instance, "fecha_inicio", None)
        fecha_fin = attrs.get("fecha_fin") or getattr(self.instance, "fecha_fin", None)
        habitacion = attrs.get("habitacion") or getattr(self.instance, "habitacion", None)
        estado = attrs.get("estado") or getattr(self.instance, "estado", None)

        if fecha_inicio and fecha_fin and fecha_fin < fecha_inicio:
            raise serializers.ValidationError(
                {"fecha_fin": "La fecha fin no puede ser anterior a la fecha inicio."}
            )
        if estado == Arriendo.ACTIVO and habitacion:
            existe_activo = Arriendo.objects.filter(
                habitacion=habitacion,
                estado=Arriendo.ACTIVO,
            )
            if self.instance:
                existe_activo = existe_activo.exclude(pk=self.instance.pk)
            if existe_activo.exists():
                raise serializers.ValidationError(
                    {"habitacion": "La habitación ya tiene un arriendo activo."}
                )
        return attrs


class PagoSerializer(serializers.ModelSerializer):
    arrendatario_nombre = serializers.SerializerMethodField()
    habitacion_codigo = serializers.CharField(source="arriendo.habitacion.codigo", read_only=True)

    class Meta:
        model = Pago
        fields = [
            "id",
            "arriendo",
            "arrendatario_nombre",
            "habitacion_codigo",
            "periodo",
            "fecha_vencimiento",
            "fecha_pago",
            "monto",
            "metodo_pago",
            "referencia_pago",
            "comprobante_pago",
            "observaciones_cliente",
            "estado",
            "observaciones",
        ]
        read_only_fields = ["arrendatario_nombre", "habitacion_codigo"]

    def get_arrendatario_nombre(self, obj):
        return str(obj.arriendo.arrendatario)

    def validate_periodo(self, value):
        return validar_texto_corto(value, "Periodo", obligatorio=True, minimo=4, requiere_letra=True)

    def validate_monto(self, value):
        return validar_monto_positivo(value, "El monto")

    def validate_metodo_pago(self, value):
        return validar_texto_corto(value, "Método de pago", obligatorio=False, minimo=3, requiere_letra=True)

    def validate(self, attrs):
        estado = attrs.get("estado") or getattr(self.instance, "estado", None)
        fecha_pago = attrs.get("fecha_pago") or getattr(self.instance, "fecha_pago", None)
        arriendo = attrs.get("arriendo") or getattr(self.instance, "arriendo", None)
        monto = attrs.get("monto") or getattr(self.instance, "monto", None)

        if estado == Pago.PAGADO and not fecha_pago:
            raise serializers.ValidationError(
                {"fecha_pago": "Debe registrar la fecha de pago cuando el estado es Pagado."}
            )
        if arriendo and monto and monto != arriendo.valor_mensual:
            raise serializers.ValidationError(
                {"monto": "El monto del pago debe coincidir con el valor mensual del arriendo."}
            )
        return attrs


class GarantiaSerializer(serializers.ModelSerializer):
    arrendatario_nombre = serializers.SerializerMethodField()
    habitacion_codigo = serializers.CharField(source="arriendo.habitacion.codigo", read_only=True)

    class Meta:
        model = Garantia
        fields = [
            "id",
            "arriendo",
            "arrendatario_nombre",
            "habitacion_codigo",
            "monto",
            "fecha_entrega",
            "fecha_devolucion",
            "estado",
            "observaciones",
        ]
        read_only_fields = ["arrendatario_nombre", "habitacion_codigo"]

    def get_arrendatario_nombre(self, obj):
        return str(obj.arriendo.arrendatario)

    def validate_monto(self, value):
        return validar_monto_positivo(value, "El monto de garantía")

    def validate(self, attrs):
        arriendo = attrs.get("arriendo") or getattr(self.instance, "arriendo", None)
        monto = attrs.get("monto") or getattr(self.instance, "monto", None)
        fecha_entrega = attrs.get("fecha_entrega") or getattr(self.instance, "fecha_entrega", None)
        fecha_devolucion = attrs.get("fecha_devolucion") or getattr(self.instance, "fecha_devolucion", None)
        estado = attrs.get("estado") or getattr(self.instance, "estado", None)

        if arriendo and monto and monto != arriendo.valor_mensual:
            raise serializers.ValidationError(
                {"monto": "El monto de la garantía debe coincidir con el valor mensual del arriendo."}
            )
        if fecha_entrega and fecha_devolucion and fecha_devolucion < fecha_entrega:
            raise serializers.ValidationError(
                {"fecha_devolucion": "La fecha de devolución no puede ser anterior a la entrega."}
            )
        if estado == Garantia.DEVUELTA and not fecha_devolucion:
            raise serializers.ValidationError(
                {"fecha_devolucion": "Debe registrar la fecha de devolución."}
            )
        return attrs
