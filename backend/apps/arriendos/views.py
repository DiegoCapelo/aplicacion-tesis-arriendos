from rest_framework import viewsets

from .models import Arriendo, Garantia, Pago
from .serializers import ArriendoSerializer, GarantiaSerializer, PagoSerializer
from .services import ensure_monthly_payments


class ArriendoViewSet(viewsets.ModelViewSet):
    queryset = Arriendo.objects.select_related("arrendatario", "habitacion").all()
    serializer_class = ArriendoSerializer


class PagoViewSet(viewsets.ModelViewSet):
    queryset = Pago.objects.select_related("arriendo").all()
    serializer_class = PagoSerializer

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
