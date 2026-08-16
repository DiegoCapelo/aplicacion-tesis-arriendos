from rest_framework import viewsets

from apps.permisos import EsAdministradorOEncargado

from .models import InventarioHabitacion
from .serializers import InventarioHabitacionSerializer


class InventarioHabitacionViewSet(viewsets.ModelViewSet):
    queryset = InventarioHabitacion.objects.select_related("habitacion").all()
    serializer_class = InventarioHabitacionSerializer
    permission_classes = [EsAdministradorOEncargado]
