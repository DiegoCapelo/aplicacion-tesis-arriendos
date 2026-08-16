from rest_framework import viewsets

from apps.permisos import EsAdministradorOEncargado

from .models import Arriendo, Garantia, Pago
from .serializers import ArriendoSerializer, GarantiaSerializer, PagoSerializer
from .services import ensure_monthly_payments


class ArriendoViewSet(viewsets.ModelViewSet):
    queryset = Arriendo.objects.select_related("arrendatario", "habitacion").all()
    serializer_class = ArriendoSerializer
    permission_classes = [EsAdministradorOEncargado]


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related("arriendo").all()
    serializer_class = PagoSerializer
    permission_classes = [EsAdministradorOEncargado]

    def get_queryset(self):
        ensure_monthly_payments()
        return Pago.objects.select_related(
            "arriendo",
            "arriendo__arrendatario",
            "arriendo__habitacion",
        ).all()


class GarantiaViewSet(viewsets.ModelViewSet):
    queryset = Garantia.objects.select_related("arriendo").all()
    serializer_class = GarantiaSerializer
    permission_classes = [EsAdministradorOEncargado]
