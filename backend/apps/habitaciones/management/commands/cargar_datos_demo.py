from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.arrendatarios.models import Arrendatario
from apps.arriendos.models import Arriendo, Garantia, Pago
from apps.habitaciones.constants import CODIGOS_HABITACIONES_REALES
from apps.habitaciones.models import Habitacion
from apps.inventario.models import InventarioHabitacion
from apps.usuarios.models import Rol, Usuario


class Command(BaseCommand):
    help = "Carga datos de ejemplo para probar la aplicacion."

    def handle(self, *args, **options):
        roles = [
            (Rol.ADMIN, "Administrador principal"),
            (Rol.ENCARGADO, "Encargado operativo"),
            (Rol.USUARIO_INTERESADO, "Usuario interesado"),
        ]
        for nombre, descripcion in roles:
            Rol.objects.get_or_create(nombre=nombre, defaults={"descripcion": descripcion})

        admin_role = Rol.objects.get(nombre=Rol.ADMIN)
        admin, _ = Usuario.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@example.com",
                "is_staff": True,
                "is_superuser": True,
                "rol": admin_role,
            },
        )
        admin.email = "admin@example.com"
        admin.rol = admin_role
        admin.is_staff = True
        admin.is_superuser = True
        admin.set_password("Admin12345!")
        admin.save()

        habitaciones = [
            {
                "codigo": codigo,
                "descripcion": (
                    "Habitación amoblada con cama, armario, televisor, "
                    "aire acondicionado y baño privado."
                ),
                "precio_mensual": Decimal("120.00"),
                "estado": Habitacion.DISPONIBLE,
                "servicios": "Agua, luz, internet, baño privado, aire acondicionado",
                "observaciones": f"Ubicada en el piso {codigo[0]}.",
            }
            for codigo in CODIGOS_HABITACIONES_REALES
        ]

        bienes_base = [
            ("Aire acondicionado", "Equipo de aire acondicionado instalado.", 1),
            ("Almohadas", "Almohadas para la cama.", 2),
            ("Armario", "Armario para ropa y pertenencias.", 1),
            ("Baño privado", "Baño privado con ducha, inodoro y lavamanos.", 1),
            ("Cama", "Cama en buen estado.", 1),
            ("Colchón", "Colchón en buen estado.", 1),
            ("Cortinas", "Cortinas instaladas en la ventana.", 1),
            ("Juego de sábanas", "Juego de sábanas y cobija para la cama.", 1),
            ("Mesa", "Mesa para estudio o trabajo.", 1),
            ("Silla", "Silla para la mesa de estudio.", 1),
            ("Televisor", "Televisor instalado en la habitación.", 1),
            ("Velador", "Velador junto a la cama.", 1),
        ]

        creadas = 0
        for data in habitaciones:
            habitacion, created = Habitacion.objects.update_or_create(
                codigo=data["codigo"],
                defaults=data,
            )
            creadas += int(created)
            for nombre_bien, descripcion, cantidad in bienes_base:
                InventarioHabitacion.objects.update_or_create(
                    habitacion=habitacion,
                    nombre_bien=nombre_bien,
                    defaults={
                        "descripcion": descripcion,
                        "cantidad": cantidad,
                        "estado": InventarioHabitacion.BUENO,
                    },
                )

        arrendatario, _ = Arrendatario.objects.update_or_create(
            cedula="1710034065",
            defaults={
                "nombres": "Carlos Andres",
                "apellidos": "Mora Lopez",
                "telefono": "0999999999",
                "correo": "carlos.demo@example.com",
                "direccion": "La Joya de los Sachas",
                "contacto_emergencia": "Maria Lopez - 0988888888",
                "estado": Arrendatario.ACTIVO,
            },
        )

        habitacion = Habitacion.objects.get(codigo="407")
        arriendo, _ = Arriendo.objects.update_or_create(
            arrendatario=arrendatario,
            habitacion=habitacion,
            estado=Arriendo.ACTIVO,
            defaults={
                "fecha_inicio": date(2026, 7, 1),
                "valor_mensual": Decimal("120.00"),
                "observaciones": "Arriendo de ejemplo para pruebas con habitación real.",
            },
        )

        Pago.objects.update_or_create(
            arriendo=arriendo,
            periodo="Julio 2026",
            defaults={
                "fecha_vencimiento": date(2026, 7, 5),
                "fecha_pago": date(2026, 7, 3),
                "monto": Decimal("120.00"),
                "metodo_pago": "Efectivo",
                "estado": Pago.PAGADO,
            },
        )
        Pago.objects.update_or_create(
            arriendo=arriendo,
            periodo="Agosto 2026",
            defaults={
                "fecha_vencimiento": date(2026, 8, 5),
                "monto": Decimal("120.00"),
                "estado": Pago.PENDIENTE,
            },
        )
        Garantia.objects.update_or_create(
            arriendo=arriendo,
            defaults={
                "monto": Decimal("120.00"),
                "fecha_entrega": date(2026, 7, 1),
                "estado": Garantia.RETENIDA,
                "observaciones": "Garantia de ejemplo.",
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"Datos demo cargados. Habitaciones nuevas: {creadas}. Usuario admin: admin / Admin12345!"
            )
        )
