from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from apps.permisos import EsAdministradorOEncargado

from .models import Habitacion
from .serializers import HabitacionSerializer


class HabitacionViewSet(viewsets.ModelViewSet):
    queryset = Habitacion.objects.all()
    serializer_class = HabitacionSerializer
    permission_classes = [EsAdministradorOEncargado]


class HabitacionDisponibleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Habitacion.objects.filter(estado=Habitacion.DISPONIBLE)
    serializer_class = HabitacionSerializer
    permission_classes = [AllowAny]
