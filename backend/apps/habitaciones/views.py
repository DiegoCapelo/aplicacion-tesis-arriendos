from rest_framework import viewsets
from rest_framework.permissions import AllowAny

from .constants import CODIGOS_HABITACIONES_REALES
from .models import Habitacion
from .serializers import HabitacionSerializer


class HabitacionViewSet(viewsets.ModelViewSet):
    queryset = Habitacion.objects.filter(codigo__in=CODIGOS_HABITACIONES_REALES)
    serializer_class = HabitacionSerializer


class HabitacionDisponibleViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Habitacion.objects.filter(
        codigo__in=CODIGOS_HABITACIONES_REALES,
        estado=Habitacion.DISPONIBLE,
    )
    serializer_class = HabitacionSerializer
    permission_classes = [AllowAny]
