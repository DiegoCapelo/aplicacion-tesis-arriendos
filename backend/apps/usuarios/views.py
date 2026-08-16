from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from apps.permisos import EsAdministrador
from .models import Rol, Usuario
from .serializers import (
    LoginAdministrativoSerializer,
    LoginInteresadoSerializer,
    RegistroInteresadoSerializer,
    RolSerializer,
    UsuarioSerializer,
)


class RolViewSet(viewsets.ModelViewSet):
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [EsAdministrador]


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.select_related("rol").all()
    serializer_class = UsuarioSerializer
    permission_classes = [EsAdministrador]


def usuario_publico_response(usuario, telefono=""):
    return {
        "id": usuario.id,
        "nombres": usuario.first_name,
        "apellidos": usuario.last_name,
        "correo": usuario.email,
        "telefono": telefono or usuario.telefono,
        "rol": usuario.rol.nombre if usuario.rol else "",
    }


def token_response(usuario, payload=None):
    token, _ = Token.objects.get_or_create(user=usuario)
    data = payload or usuario_publico_response(usuario)
    return {
        "token": token.key,
        "user": data,
    }


class LoginAdministrativoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginAdministrativoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data["usuario"]
        return Response(token_response(usuario, usuario_publico_response(usuario)))


class RegistroInteresadoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroInteresadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.save()
        payload = usuario_publico_response(usuario, serializer.validated_data.get("telefono", ""))
        return Response(token_response(usuario, payload), status=status.HTTP_201_CREATED)


class LoginInteresadoView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginInteresadoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        usuario = serializer.validated_data["usuario"]
        return Response(token_response(usuario, usuario_publico_response(usuario)))


class PerfilInteresadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(usuario_publico_response(request.user))
