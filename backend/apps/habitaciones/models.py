from django.db import models


class Habitacion(models.Model):
    DISPONIBLE = "DISPONIBLE"
    OCUPADA = "OCUPADA"
    MANTENIMIENTO = "MANTENIMIENTO"

    ESTADOS = [
        (DISPONIBLE, "Disponible"),
        (OCUPADA, "Ocupada"),
        (MANTENIMIENTO, "Mantenimiento"),
    ]

    codigo = models.CharField(max_length=20, unique=True)
    descripcion = models.TextField(blank=True)
    precio_mensual = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=DISPONIBLE)
    servicios = models.TextField(blank=True)
    observaciones = models.TextField(blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Habitacion"
        verbose_name_plural = "Habitaciones"
        ordering = ["codigo"]

    def __str__(self):
        return f"Habitacion {self.codigo}"
