from django.conf import settings
from django.db import models


class Arrendatario(models.Model):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"

    ESTADOS = [
        (ACTIVO, "Activo"),
        (INACTIVO, "Inactivo"),
    ]

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="arrendatario",
        null=True,
        blank=True,
    )
    nombres = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    cedula = models.CharField(max_length=20, unique=True)
    telefono = models.CharField(max_length=20)
    correo = models.EmailField(blank=True)
    direccion = models.TextField(blank=True)
    contacto_emergencia = models.CharField(max_length=120, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default=ACTIVO)
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Arrendatario"
        verbose_name_plural = "Arrendatarios"
        ordering = ["apellidos", "nombres"]

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"
