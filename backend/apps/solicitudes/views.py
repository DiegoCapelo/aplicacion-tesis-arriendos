from django.db import transaction
from django.db.models import Q
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.arrendatarios.models import Arrendatario
from apps.arriendos.models import Arriendo, Pago
from apps.arriendos.services import ensure_monthly_payments, periodo_actual
from apps.permisos import EsAdministradorOEncargado
from apps.validaciones import limpiar_texto, validar_cedula_ecuador

from .models import SolicitudArrendamiento
from .serializers import SolicitudArrendamientoSerializer

COMPROBANTE_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}
COMPROBANTE_MAX_SIZE = 5 * 1024 * 1024


def metodo_pago_para_arriendo(metodo_solicitud):
    if metodo_solicitud == SolicitudArrendamiento.PAGO_TRANSFERENCIA:
        return "Transferencia"
    if metodo_solicitud == SolicitudArrendamiento.PAGO_PAYPAL:
        return "PayPal"
    if metodo_solicitud == SolicitudArrendamiento.PAGO_SITIO:
        return "Pago en el sitio"
    return ""


class SolicitudArrendamientoViewSet(viewsets.ModelViewSet):
    queryset = SolicitudArrendamiento.objects.select_related("usuario", "habitacion").all()
    serializer_class = SolicitudArrendamientoSerializer
    permission_classes = [EsAdministradorOEncargado]

    def _solicitud_formalizada(self, solicitud):
        marker = f"solicitud #{solicitud.id}"
        return (
            Arriendo.objects.filter(observaciones__icontains=marker).exists()
            or Pago.objects.filter(observaciones__icontains=marker).exists()
        )

    def _vincular_usuario_si_corresponde(self, solicitud, arrendatario):
        if (
            solicitud.usuario
            and not arrendatario.usuario_id
            and not Arrendatario.objects.filter(usuario=solicitud.usuario).exclude(pk=arrendatario.pk).exists()
        ):
            arrendatario.usuario = solicitud.usuario
            arrendatario.save(update_fields=["usuario"])

    @action(detail=True, methods=["post"])
    def confirmar_pago(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.metodo_pago == SolicitudArrendamiento.PAGO_SIN_SELECCIONAR:
            return Response(
                {"metodo_pago": "Primero el cliente debe elegir una forma de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if solicitud.estado != SolicitudArrendamiento.APROBADA:
            return Response(
                {"estado": "Solo se puede confirmar el pago de una solicitud aprobada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        solicitud.estado_pago = SolicitudArrendamiento.PAGO_CONFIRMADO
        solicitud.save(update_fields=["estado_pago"])
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=["post"])
    def pago_pendiente(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.estado != SolicitudArrendamiento.APROBADA:
            return Response(
                {"estado": "Solo se puede marcar como pendiente una solicitud aprobada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        solicitud.estado_pago = SolicitudArrendamiento.PAGO_PENDIENTE
        solicitud.save(update_fields=["estado_pago"])
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=["post"])
    def formalizar(self, request, pk=None):
        with transaction.atomic():
            solicitud = SolicitudArrendamiento.objects.select_for_update().select_related(
                "usuario",
                "habitacion",
            ).get(pk=pk)

            if solicitud.estado != SolicitudArrendamiento.APROBADA:
                return Response(
                    {"estado": "Solo se puede formalizar una solicitud aprobada."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if solicitud.estado_pago != SolicitudArrendamiento.PAGO_CONFIRMADO:
                return Response(
                    {"estado_pago": "Primero confirma el pago inicial del cliente."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if self._solicitud_formalizada(solicitud):
                return Response(
                    {"detail": "Esta solicitud ya fue formalizada y no debe registrarse otra vez."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            arrendatario_id = request.data.get("arrendatario")
            if arrendatario_id:
                try:
                    arrendatario = Arrendatario.objects.select_for_update().get(pk=arrendatario_id)
                except Arrendatario.DoesNotExist:
                    return Response(
                        {"arrendatario": "No se encontró el arrendatario seleccionado."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                self._vincular_usuario_si_corresponde(solicitud, arrendatario)
            else:
                cedula = limpiar_texto(request.data.get("cedula", ""))
                try:
                    validar_cedula_ecuador(cedula)
                except Exception as exc:
                    return Response(
                        {"cedula": exc.detail if hasattr(exc, "detail") else str(exc)},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                nombres = limpiar_texto(request.data.get("nombres") or solicitud.nombres)
                apellidos = limpiar_texto(request.data.get("apellidos", ""))
                telefono = limpiar_texto(request.data.get("telefono") or solicitud.telefono)
                correo = limpiar_texto(request.data.get("correo") or solicitud.correo)
                usuario_para_arrendatario = None
                if solicitud.usuario and not Arrendatario.objects.filter(usuario=solicitud.usuario).exists():
                    usuario_para_arrendatario = solicitud.usuario

                arrendatario, created = Arrendatario.objects.select_for_update().get_or_create(
                    cedula=cedula,
                    defaults={
                        "usuario": usuario_para_arrendatario,
                        "nombres": nombres,
                        "apellidos": apellidos,
                        "telefono": telefono,
                        "correo": correo,
                        "direccion": limpiar_texto(request.data.get("direccion", "")),
                        "contacto_emergencia": limpiar_texto(request.data.get("contacto_emergencia", "")),
                        "estado": Arrendatario.ACTIVO,
                    },
                )
                if not created:
                    changed_fields = []
                    for field, value in {
                        "nombres": nombres,
                        "apellidos": apellidos,
                        "telefono": telefono,
                        "correo": correo,
                        "direccion": limpiar_texto(request.data.get("direccion", "")) or arrendatario.direccion,
                        "contacto_emergencia": limpiar_texto(request.data.get("contacto_emergencia", "")) or arrendatario.contacto_emergencia,
                        "estado": Arrendatario.ACTIVO,
                    }.items():
                        if value and getattr(arrendatario, field) != value:
                            setattr(arrendatario, field, value)
                            changed_fields.append(field)
                    if changed_fields:
                        arrendatario.save(update_fields=changed_fields)
                    self._vincular_usuario_si_corresponde(solicitud, arrendatario)

            arriendo_existente = Arriendo.objects.filter(
                habitacion=solicitud.habitacion,
                estado=Arriendo.ACTIVO,
            ).select_related("arrendatario").first()
            if arriendo_existente:
                return Response(
                    {
                        "habitacion": (
                            "La habitación ya tiene un arriendo activo con "
                            f"{arriendo_existente.arrendatario}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            fecha_inicio = request.data.get("fecha_inicio") or timezone.localdate()
            if isinstance(fecha_inicio, str):
                fecha_inicio = parse_date(fecha_inicio) or timezone.localdate()

            arriendo = Arriendo.objects.create(
                arrendatario=arrendatario,
                habitacion=solicitud.habitacion,
                fecha_inicio=fecha_inicio,
                valor_mensual=solicitud.habitacion.precio_mensual,
                estado=Arriendo.ACTIVO,
                observaciones=f"Arriendo formalizado desde la solicitud #{solicitud.id}.",
            )

            periodo = periodo_actual(fecha_inicio)
            periodo_legacy = periodo.replace(" de ", " ")
            pago_data = {
                "periodo": periodo,
                "fecha_vencimiento": fecha_inicio,
                "fecha_pago": timezone.localdate(),
                "monto": arriendo.valor_mensual,
                "metodo_pago": metodo_pago_para_arriendo(solicitud.metodo_pago),
                "referencia_pago": solicitud.referencia_pago,
                "comprobante_pago": solicitud.comprobante_pago,
                "observaciones_cliente": solicitud.observaciones_pago,
                "estado": Pago.PAGADO,
                "observaciones": f"Pago inicial confirmado desde la solicitud #{solicitud.id}.",
            }
            pago = Pago.objects.filter(arriendo=arriendo, periodo__in=[periodo, periodo_legacy]).first()
            if pago:
                for field, value in pago_data.items():
                    setattr(pago, field, value)
                pago.save(update_fields=list(pago_data.keys()))
            else:
                pago = Pago.objects.create(arriendo=arriendo, **pago_data)

            SolicitudArrendamiento.objects.filter(
                habitacion=solicitud.habitacion,
                estado=SolicitudArrendamiento.PENDIENTE,
            ).exclude(pk=solicitud.pk).update(estado=SolicitudArrendamiento.RECHAZADA)

        return Response(
            {
                "detail": "Solicitud formalizada correctamente.",
                "solicitud": self.get_serializer(solicitud).data,
                "arrendatario": arrendatario.id,
                "arriendo": arriendo.id,
                "pago": pago.id,
            },
            status=status.HTTP_201_CREATED,
        )


class SolicitudPublicaViewSet(viewsets.ModelViewSet):
    queryset = SolicitudArrendamiento.objects.select_related("usuario", "habitacion").none()
    serializer_class = SolicitudArrendamientoSerializer
    http_method_names = ["get", "post", "options"]

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return SolicitudArrendamiento.objects.none()
        return SolicitudArrendamiento.objects.select_related("usuario", "habitacion").filter(
            usuario=self.request.user
        )

    def perform_create(self, serializer):
        usuario = self.request.user if self.request.user.is_authenticated else None
        serializer.save(usuario=usuario)

    def _arrendatarios_del_usuario(self):
        user = self.request.user
        filters = Q(usuario=user)
        if user.email:
            filters |= Q(correo__iexact=user.email.strip().lower())
        if user.telefono:
            filters |= Q(telefono=user.telefono.strip())
        return Arrendatario.objects.filter(filters).distinct()

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated], url_path="mi-cuenta")
    def mi_cuenta(self, request):
        arrendatarios = self._arrendatarios_del_usuario()
        arriendos = Arriendo.objects.select_related("arrendatario", "habitacion").filter(
            arrendatario__in=arrendatarios,
            estado=Arriendo.ACTIVO,
        )
        ensure_monthly_payments(arriendos)
        pagos = Pago.objects.select_related(
            "arriendo",
            "arriendo__arrendatario",
            "arriendo__habitacion",
        ).filter(arriendo__in=arriendos).order_by("fecha_vencimiento")

        return Response(
            {
                "arriendos": [
                    {
                        "id": arriendo.id,
                        "habitacion": arriendo.habitacion.id,
                        "habitacion_codigo": arriendo.habitacion.codigo,
                        "arrendatario": arriendo.arrendatario.id,
                        "arrendatario_nombre": str(arriendo.arrendatario),
                        "fecha_inicio": arriendo.fecha_inicio,
                        "fecha_fin": arriendo.fecha_fin,
                        "valor_mensual": str(arriendo.valor_mensual),
                        "estado": arriendo.estado,
                    }
                    for arriendo in arriendos
                ],
                "pagos": [
                    {
                        "id": pago.id,
                        "arriendo": pago.arriendo.id,
                        "habitacion_codigo": pago.arriendo.habitacion.codigo,
                        "periodo": pago.periodo,
                        "fecha_vencimiento": pago.fecha_vencimiento,
                        "fecha_pago": pago.fecha_pago,
                        "monto": str(pago.monto),
                        "metodo_pago": pago.metodo_pago,
                        "referencia_pago": pago.referencia_pago,
                        "comprobante_pago": pago.comprobante_pago.url if pago.comprobante_pago else "",
                        "observaciones_cliente": pago.observaciones_cliente,
                        "estado": pago.estado,
                        "observaciones": pago.observaciones,
                    }
                    for pago in pagos
                ],
            }
        )

    @action(
        detail=False,
        methods=["post"],
        permission_classes=[IsAuthenticated],
        url_path=r"pagos/(?P<pago_id>[^/.]+)/comprobante",
    )
    def subir_comprobante_pago(self, request, pago_id=None):
        arrendatarios = self._arrendatarios_del_usuario()
        arriendos = Arriendo.objects.filter(arrendatario__in=arrendatarios, estado=Arriendo.ACTIVO)
        try:
            pago = Pago.objects.select_related("arriendo").get(pk=pago_id, arriendo__in=arriendos)
        except Pago.DoesNotExist:
            return Response(
                {"detail": "No se encontró un pago mensual disponible para tu cuenta."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if pago.estado == Pago.PAGADO:
            return Response(
                {"estado": "Este pago ya fue confirmado por administración."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        metodo_pago = request.data.get("metodo_pago", "").strip()
        referencia_pago = request.data.get("referencia_pago", "").strip()
        observaciones_cliente = request.data.get("observaciones_cliente", "").strip()
        comprobante_pago = request.FILES.get("comprobante_pago")

        metodos_validos = {"Transferencia", "PayPal", "Pago en el sitio"}
        if metodo_pago not in metodos_validos:
            return Response(
                {"metodo_pago": "Selecciona transferencia, PayPal o pago en el sitio."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if metodo_pago == "Transferencia" and not referencia_pago and not comprobante_pago and not pago.comprobante_pago:
            return Response(
                {"referencia_pago": "Ingresa la referencia o sube el comprobante de la transferencia."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if comprobante_pago:
            if comprobante_pago.content_type not in COMPROBANTE_CONTENT_TYPES:
                return Response(
                    {"comprobante_pago": "Sube una imagen JPG, PNG, WEBP o un archivo PDF."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if comprobante_pago.size > COMPROBANTE_MAX_SIZE:
                return Response(
                    {"comprobante_pago": "El comprobante no debe superar 5 MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        pago.metodo_pago = metodo_pago
        pago.referencia_pago = referencia_pago
        pago.observaciones_cliente = observaciones_cliente
        update_fields = ["metodo_pago", "referencia_pago", "observaciones_cliente"]
        if comprobante_pago:
            pago.comprobante_pago = comprobante_pago
            update_fields.append("comprobante_pago")
        pago.save(update_fields=update_fields)
        return Response({"detail": "Comprobante mensual enviado a revisión."})

    @action(detail=True, methods=["post"], permission_classes=[IsAuthenticated])
    def elegir_pago(self, request, pk=None):
        solicitud = self.get_object()
        metodo_pago = request.data.get("metodo_pago")
        referencia_pago = request.data.get("referencia_pago", "").strip()
        observaciones_pago = request.data.get("observaciones_pago", "").strip()
        comprobante_pago = request.FILES.get("comprobante_pago")

        metodos_validos = {
            SolicitudArrendamiento.PAGO_PAYPAL,
            SolicitudArrendamiento.PAGO_TRANSFERENCIA,
            SolicitudArrendamiento.PAGO_SITIO,
        }

        if solicitud.estado != SolicitudArrendamiento.APROBADA:
            return Response(
                {"detail": "Solo puedes elegir forma de pago cuando la solicitud está aprobada."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if metodo_pago not in metodos_validos:
            return Response(
                {"metodo_pago": "Selecciona PayPal, transferencia bancaria o pago en el sitio."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if (
            metodo_pago == SolicitudArrendamiento.PAGO_TRANSFERENCIA
            and not referencia_pago
            and not comprobante_pago
            and not solicitud.comprobante_pago
        ):
            return Response(
                {"referencia_pago": "Ingresa la referencia o sube el comprobante de la transferencia."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if comprobante_pago:
            if comprobante_pago.content_type not in COMPROBANTE_CONTENT_TYPES:
                return Response(
                    {"comprobante_pago": "Sube una imagen JPG, PNG, WEBP o un archivo PDF."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if comprobante_pago.size > COMPROBANTE_MAX_SIZE:
                return Response(
                    {"comprobante_pago": "El comprobante no debe superar 5 MB."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        solicitud.metodo_pago = metodo_pago
        solicitud.estado_pago = SolicitudArrendamiento.PAGO_PENDIENTE
        solicitud.referencia_pago = referencia_pago
        solicitud.observaciones_pago = observaciones_pago
        update_fields = [
            "metodo_pago",
            "estado_pago",
            "referencia_pago",
            "observaciones_pago",
        ]
        if comprobante_pago:
            solicitud.comprobante_pago = comprobante_pago
            update_fields.append("comprobante_pago")
        solicitud.save(update_fields=update_fields)
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=["post"])
    def confirmar_pago(self, request, pk=None):
        solicitud = self.get_object()
        if solicitud.metodo_pago == SolicitudArrendamiento.PAGO_SIN_SELECCIONAR:
            return Response(
                {"metodo_pago": "Primero el cliente debe elegir una forma de pago."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        solicitud.estado_pago = SolicitudArrendamiento.PAGO_CONFIRMADO
        solicitud.save(update_fields=["estado_pago"])
        return Response(self.get_serializer(solicitud).data)

    @action(detail=True, methods=["post"])
    def pago_pendiente(self, request, pk=None):
        solicitud = self.get_object()
        solicitud.estado_pago = SolicitudArrendamiento.PAGO_PENDIENTE
        solicitud.save(update_fields=["estado_pago"])
        return Response(self.get_serializer(solicitud).data)
