from django.contrib.auth.models import AbstractUser
from django.db import models


class Rol(models.Model):
    ADMIN = "ADMIN"
    ENCARGADO = "ENCARGADO"
    USUARIO_INTERESADO = "USUARIO_INTERESADO"

    nombre = models.CharField(max_length=40, unique=True)
    descripcion = models.TextField(blank=True)

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre


class Usuario(AbstractUser):
    telefono = models.CharField(max_length=20, blank=True)
    rol = models.ForeignKey(
        Rol,
        on_delete=models.PROTECT,
        related_name="usuarios",
        null=True,
        blank=True,
    )
    fecha_registro = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    @property
    def es_admin(self):
        return self.rol and self.rol.nombre == Rol.ADMIN

    @property
    def es_encargado(self):
        return self.rol and self.rol.nombre == Rol.ENCARGADO
