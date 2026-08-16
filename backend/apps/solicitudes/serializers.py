from rest_framework import serializers

from apps.arrendatarios.models import Arrendatario
from apps.arriendos.models import Arriendo, Pago
from apps.habitaciones.models import Habitacion
from apps.validaciones import validar_nombre_persona, validar_telefono

from .models import SolicitudArrendamiento


class SolicitudArrendamientoSerializer(serializers.ModelSerializer):
    habitacion_codigo = serializers.CharField(source="habitacion.codigo", read_only=True)
    habitacion_precio = serializers.DecimalField(
        source="habitacion.precio_mensual",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    formalizada = serializers.SerializerMethodField()

    class Meta:
        model = SolicitudArrendamiento
        fields = [
            "id",
            "usuario",
            "habitacion",
            "habitacion_codigo",
            "habitacion_precio",
            "nombres",
            "telefono",
            "correo",
            "mensaje",
            "estado",
            "metodo_pago",
            "estado_pago",
            "referencia_pago",
            "comprobante_pago",
            "observaciones_pago",
            "fecha_solicitud",
            "formalizada",
        ]
        read_only_fields = [
            "fecha_solicitud",
            "estado_pago",
            "referencia_pago",
            "comprobante_pago",
            "observaciones_pago",
            "formalizada",
        ]

    def get_formalizada(self, obj):
        marker = f"solicitud #{obj.id}"
        if Arriendo.objects.filter(observaciones__icontains=marker).exists():
            return True
        if Pago.objects.filter(observaciones__icontains=marker).exists():
            return True

        normalized_email = (obj.correo or "").strip().lower()
        normalized_phone = (obj.telefono or "").strip()
        tenants = Arrendatario.objects.none()
        if normalized_email:
            tenants = tenants | Arrendatario.objects.filter(correo__iexact=normalized_email)
        if normalized_phone:
            tenants = tenants | Arrendatario.objects.filter(telefono=normalized_phone)
        return Arriendo.objects.filter(
            arrendatario__in=tenants,
            habitacion=obj.habitacion,
            estado=Arriendo.ACTIVO,
        ).exists()

    def validate_nombres(self, value):
        return validar_nombre_persona(value, "Nombres")

    def validate_telefono(self, value):
        return validar_telefono(value)

    def validate(self, attrs):
        habitacion = attrs.get("habitacion") or getattr(self.instance, "habitacion", None)
        estado = attrs.get("estado") or getattr(self.instance, "estado", None)

        if self.instance is None and habitacion and habitacion.estado != Habitacion.DISPONIBLE:
            raise serializers.ValidationError(
                {"habitacion": "La habitación seleccionada no está disponible."}
            )

        if (
            self.instance
            and estado == SolicitudArrendamiento.APROBADA
            and self.instance.estado != SolicitudArrendamiento.APROBADA
            and habitacion
            and habitacion.estado != Habitacion.DISPONIBLE
        ):
            raise serializers.ValidationError(
                {"habitacion": "No se puede aprobar porque la habitación ya no está disponible."}
            )

        return attrs
