from django.db import models

from apps.habitaciones.models import Habitacion


class InventarioHabitacion(models.Model):
    BUENO = "BUENO"
    REGULAR = "REGULAR"
    MALO = "MALO"
    DANADO = "DANADO"

    ESTADOS = [
        (BUENO, "Bueno"),
        (REGULAR, "Regular"),
        (MALO, "Malo"),
        (DANADO, "Danado"),
    ]

    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.CASCADE,
        related_name="inventario",
    )
    nombre_bien = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    cantidad = models.PositiveIntegerField(default=1)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=BUENO)
    observaciones = models.TextField(blank=True)

    class Meta:
        verbose_name = "Inventario de habitacion"
        verbose_name_plural = "Inventario de habitaciones"
        ordering = ["habitacion__codigo", "nombre_bien"]

    def __str__(self):
        return f"{self.nombre_bien} - {self.habitacion}"
