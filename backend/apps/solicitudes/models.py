from django.conf import settings
from django.db import models

from apps.habitaciones.models import Habitacion


class SolicitudArrendamiento(models.Model):
    PENDIENTE = "PENDIENTE"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    PAGO_SIN_SELECCIONAR = "SIN_SELECCIONAR"
    PAGO_PAYPAL = "PAYPAL"
    PAGO_TRANSFERENCIA = "TRANSFERENCIA"
    PAGO_SITIO = "SITIO"
    PAGO_PENDIENTE = "PENDIENTE"
    PAGO_CONFIRMADO = "CONFIRMADO"

    ESTADOS = [
        (PENDIENTE, "Pendiente"),
        (APROBADA, "Aprobada"),
        (RECHAZADA, "Rechazada"),
    ]
    METODOS_PAGO = [
        (PAGO_SIN_SELECCIONAR, "Sin seleccionar"),
        (PAGO_PAYPAL, "PayPal"),
        (PAGO_TRANSFERENCIA, "Transferencia bancaria"),
        (PAGO_SITIO, "Pagar en el sitio"),
    ]
    ESTADOS_PAGO = [
        (PAGO_SIN_SELECCIONAR, "Sin seleccionar"),
        (PAGO_PENDIENTE, "Pendiente"),
        (PAGO_CONFIRMADO, "Confirmado"),
    ]

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="solicitudes_arrendamiento",
        null=True,
        blank=True,
    )
    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.PROTECT,
        related_name="solicitudes",
    )
    nombres = models.CharField(max_length=150)
    telefono = models.CharField(max_length=20)
    correo = models.EmailField(blank=True)
    mensaje = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=PENDIENTE)
    metodo_pago = models.CharField(max_length=30, choices=METODOS_PAGO, default=PAGO_SIN_SELECCIONAR)
    estado_pago = models.CharField(max_length=30, choices=ESTADOS_PAGO, default=PAGO_SIN_SELECCIONAR)
    referencia_pago = models.CharField(max_length=120, blank=True)
    comprobante_pago = models.FileField(upload_to="comprobantes_pago/", blank=True, null=True)
    observaciones_pago = models.TextField(blank=True)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Solicitud de arrendamiento"
        verbose_name_plural = "Solicitudes de arrendamiento"
        ordering = ["-fecha_solicitud"]

    def __str__(self):
        return f"{self.nombres} - {self.habitacion}"

    def _liberar_habitacion_si_corresponde(self):
        from apps.arriendos.models import Arriendo

        tiene_otra_aprobada = type(self).objects.filter(
            habitacion=self.habitacion,
            estado=self.APROBADA,
        ).exclude(pk=self.pk).exists()
        tiene_arriendo_activo = Arriendo.objects.filter(
            habitacion=self.habitacion,
            estado=Arriendo.ACTIVO,
        ).exists()
        if not tiene_otra_aprobada and not tiene_arriendo_activo and self.habitacion.estado == Habitacion.OCUPADA:
            self.habitacion.estado = Habitacion.DISPONIBLE
            self.habitacion.save(update_fields=["estado", "fecha_actualizacion"])

    def save(self, *args, **kwargs):
        estado_anterior = None
        if self.pk:
            estado_anterior = type(self).objects.filter(pk=self.pk).values_list("estado", flat=True).first()

        super().save(*args, **kwargs)
        if self.estado == self.APROBADA and self.habitacion.estado != Habitacion.OCUPADA:
            self.habitacion.estado = Habitacion.OCUPADA
            self.habitacion.save(update_fields=["estado", "fecha_actualizacion"])
        elif estado_anterior == self.APROBADA and self.estado != self.APROBADA:
            self._liberar_habitacion_si_corresponde()

    def delete(self, *args, **kwargs):
        from apps.arriendos.models import Arriendo

        estaba_aprobada = self.estado == self.APROBADA
        habitacion = self.habitacion
        super().delete(*args, **kwargs)
        tiene_otra_aprobada = type(self).objects.filter(
            habitacion=habitacion,
            estado=self.APROBADA,
        ).exists()
        tiene_arriendo_activo = Arriendo.objects.filter(
            habitacion=habitacion,
            estado=Arriendo.ACTIVO,
        ).exists()
        if estaba_aprobada and not tiene_otra_aprobada and not tiene_arriendo_activo and habitacion.estado == Habitacion.OCUPADA:
            habitacion.estado = Habitacion.DISPONIBLE
            habitacion.save(update_fields=["estado", "fecha_actualizacion"])
