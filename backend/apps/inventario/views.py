from rest_framework import viewsets

from apps.habitaciones.constants import CODIGOS_HABITACIONES_REALES

from .models import InventarioHabitacion
from .serializers import InventarioHabitacionSerializer


class InventarioHabitacionViewSet(viewsets.ModelViewSet):
    queryset = InventarioHabitacion.objects.select_related("habitacion").filter(
        habitacion__codigo__in=CODIGOS_HABITACIONES_REALES
    )
    serializer_class = InventarioHabitacionSerializer
