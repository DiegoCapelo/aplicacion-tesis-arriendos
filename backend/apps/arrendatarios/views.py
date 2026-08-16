from rest_framework import viewsets

from apps.permisos import EsAdministradorOEncargado

from .models import Arrendatario
from .serializers import ArrendatarioSerializer


class ArrendatarioViewSet(viewsets.ModelViewSet):
    queryset = Arrendatario.objects.select_related("usuario").all()
    serializer_class = ArrendatarioSerializer
    permission_classes = [EsAdministradorOEncargado]
