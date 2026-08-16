from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.validaciones import validar_nombre_persona, validar_telefono

from .models import Rol, Usuario


class RolSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rol
        fields = ["id", "nombre", "descripcion"]


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "telefono",
            "rol",
            "is_active",
            "fecha_registro",
            "password",
        ]
        read_only_fields = ["fecha_registro"]

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get("request")
        user = getattr(request, "user", None)
        if not (user and user.is_authenticated and (user.is_superuser or getattr(user, "es_admin", False))):
            fields["rol"].read_only = True
            fields["is_active"].read_only = True
        return fields

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        usuario = Usuario(**validated_data)
        if password:
            usuario.set_password(password)
        else:
            usuario.set_unusable_password()
        usuario.save()
        return usuario

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

    def validate_first_name(self, value):
        if not value:
            return ""
        return validar_nombre_persona(value, "Nombres")

    def validate_last_name(self, value):
        if not value:
            return ""
        return validar_nombre_persona(value, "Apellidos")

    def validate_password(self, value):
        if value and len(value) < 8:
            raise serializers.ValidationError("La contrasena debe tener al menos 8 caracteres.")
        return value


class RegistroInteresadoSerializer(serializers.Serializer):
    nombres = serializers.CharField(max_length=100)
    apellidos = serializers.CharField(max_length=100)
    correo = serializers.EmailField()
    telefono = serializers.CharField(max_length=20)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_nombres(self, value):
        return validar_nombre_persona(value, "Nombres")

    def validate_apellidos(self, value):
        return validar_nombre_persona(value, "Apellidos")

    def validate_telefono(self, value):
        return validar_telefono(value)

    def validate_correo(self, value):
        value = value.strip().lower()
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Ya existe una cuenta con este correo.")
        return value

    def create(self, validated_data):
        rol, _ = Rol.objects.get_or_create(
            nombre=Rol.USUARIO_INTERESADO,
            defaults={"descripcion": "Usuario interesado en arrendar una habitacion"},
        )
        usuario = Usuario(
            username=validated_data["correo"],
            email=validated_data["correo"],
            first_name=validated_data["nombres"],
            last_name=validated_data["apellidos"],
            telefono=validated_data["telefono"],
            rol=rol,
            is_active=True,
        )
        usuario.set_password(validated_data["password"])
        usuario.save()
        return usuario


class LoginInteresadoSerializer(serializers.Serializer):
    correo = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        correo = attrs["correo"].strip().lower()
        try:
            usuario = Usuario.objects.get(email__iexact=correo)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError("Correo o contrasena incorrectos.")

        usuario = authenticate(username=usuario.username, password=attrs["password"])
        if not usuario:
            raise serializers.ValidationError("Correo o contrasena incorrectos.")
        if not usuario.is_active:
            raise serializers.ValidationError("La cuenta esta inactiva.")

        attrs["usuario"] = usuario
        return attrs


class LoginAdministrativoSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs["username"].strip()
        usuario = authenticate(username=username, password=attrs["password"])
        if not usuario:
            try:
                usuario_por_email = Usuario.objects.get(email__iexact=username)
            except Usuario.DoesNotExist:
                usuario_por_email = None
            if usuario_por_email:
                usuario = authenticate(username=usuario_por_email.username, password=attrs["password"])

        if not usuario:
            raise serializers.ValidationError("Usuario o contrasena incorrectos.")
        if not usuario.is_active:
            raise serializers.ValidationError("La cuenta esta inactiva.")
        if not (usuario.is_superuser or usuario.es_admin or usuario.es_encargado):
            raise serializers.ValidationError("Esta cuenta no tiene acceso administrativo.")

        attrs["usuario"] = usuario
        return attrs
