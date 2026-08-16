from django.core.exceptions import ValidationError
from django.db import models

from apps.arrendatarios.models import Arrendatario
from apps.habitaciones.models import Habitacion


class Arriendo(models.Model):
    ACTIVO = "ACTIVO"
    FINALIZADO = "FINALIZADO"
    CANCELADO = "CANCELADO"

    ESTADOS = [
        (ACTIVO, "Activo"),
        (FINALIZADO, "Finalizado"),
        (CANCELADO, "Cancelado"),
    ]

    arrendatario = models.ForeignKey(
        Arrendatario,
        on_delete=models.PROTECT,
        related_name="arriendos",
    )
    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.PROTECT,
        related_name="arriendos",
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    valor_mensual = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=ACTIVO)
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Arriendo"
        verbose_name_plural = "Arriendos"
        ordering = ["-fecha_inicio"]

    def clean(self):
        if self.estado == self.ACTIVO:
            existe_activo = Arriendo.objects.filter(
                habitacion=self.habitacion,
                estado=self.ACTIVO,
            ).exclude(pk=self.pk)
            if existe_activo.exists():
                raise ValidationError(
                    "La habitación ya tiene un arriendo activo."
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        if self.estado == self.ACTIVO and self.habitacion.estado != Habitacion.OCUPADA:
            self.habitacion.estado = Habitacion.OCUPADA
            self.habitacion.save(update_fields=["estado", "fecha_actualizacion"])

    def __str__(self):
        return f"{self.arrendatario} - {self.habitacion}"


class Pago(models.Model):
    PENDIENTE = "PENDIENTE"
    PAGADO = "PAGADO"
    ATRASADO = "ATRASADO"

    ESTADOS = [
        (PENDIENTE, "Pendiente"),
        (PAGADO, "Pagado"),
        (ATRASADO, "Atrasado"),
    ]

    arriendo = models.ForeignKey(
        Arriendo,
        on_delete=models.CASCADE,
        related_name="pagos",
    )
    periodo = models.CharField(max_length=30)
    fecha_vencimiento = models.DateField()
    fecha_pago = models.DateField(null=True, blank=True)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    metodo_pago = models.CharField(max_length=40, blank=True)
    referencia_pago = models.CharField(max_length=120, blank=True)
    comprobante_pago = models.FileField(upload_to="comprobantes_pago_mensual/", blank=True, null=True)
    observaciones_cliente = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=PENDIENTE)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"
        ordering = ["fecha_vencimiento"]
        constraints = [
            models.UniqueConstraint(
                fields=["arriendo", "periodo"],
                name="pago_unico_por_arriendo_periodo",
            )
        ]

    def __str__(self):
        return f"{self.arriendo} - {self.periodo}"


class Garantia(models.Model):
    RETENIDA = "RETENIDA"
    DEVUELTA = "DEVUELTA"
    USADA_POR_DANOS = "USADA_POR_DANOS"

    ESTADOS = [
        (RETENIDA, "Retenida"),
        (DEVUELTA, "Devuelta"),
        (USADA_POR_DANOS, "Usada por daños"),
    ]

    arriendo = models.ForeignKey(
        Arriendo,
        on_delete=models.CASCADE,
        related_name="garantias",
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    fecha_entrega = models.DateField()
    fecha_devolucion = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=30, choices=ESTADOS, default=RETENIDA)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Garantía"
        verbose_name_plural = "Garantías"
        ordering = ["-fecha_entrega"]

    def __str__(self):
        return f"Garantía {self.monto} - {self.arriendo}"
