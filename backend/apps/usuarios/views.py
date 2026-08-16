from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Rol, Usuario
from .serializers import (
    LoginInteresadoSerializer,
    RegistroInteresadoSerializer,
    RolSerializer,
    UsuarioSerializer,
)


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related("rol").all()
    serializer_class = UsuarioSerializer


def usuario_publico_response(usuario, telefono=""):
    return {
        "id": usuario.id,
        "nombres": usuario.first_name,
        "apellidos": usuario.last_name,
        "correo": usuario.email,
        "telefono": telefono or usuario.telefono,
        "rol": usuario.rol.nombre if usuario.rol else "",
    }


class RegistroInteresadoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroInteresadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        return Response(
            usuario_publico_response(usuario, serializer.validated_data.get("telefono", "")),
            status=status.HTTP_201_CREATED,
        )


class LoginInteresadoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginInteresadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data["usuario"]
        return Response(usuario_publico_response(usuario))


class PerfilInteresadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(usuario_publico_response(request.user))
