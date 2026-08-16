from rest_framework import viewsets

from .models import Arrendatario
from .serializers import ArrendatarioSerializer


class ArrendatarioViewSet(viewsets.ModelViewSet):
    queryset = Arrendatario.objects.select_related("usuario").all()
    serializer_class = ArrendatarioSerializer
