from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.arrendatarios.views import ArrendatarioViewSet
from apps.arriendos.views import ArriendoViewSet, GarantiaViewSet, PagoViewSet
from apps.habitaciones.views import HabitacionDisponibleViewSet, HabitacionViewSet
from apps.inventario.views import InventarioHabitacionViewSet
from apps.solicitudes.views import SolicitudArrendamientoViewSet, SolicitudPublicaViewSet
from apps.usuarios.views import (
    LoginAdministrativoView,
    LoginInteresadoView,
    PerfilInteresadoView,
    RegistroInteresadoView,
    RolViewSet,
    UsuarioViewSet,
)


router = DefaultRouter()
router.register("roles", RolViewSet)
router.register("usuarios", UsuarioViewSet)
router.register("habitaciones", HabitacionViewSet)
router.register("arrendatarios", ArrendatarioViewSet)
router.register("arriendos", ArriendoViewSet)
router.register("pagos", PagoViewSet)
router.register("garantias", GarantiaViewSet)
router.register("inventario-habitaciones", InventarioHabitacionViewSet)
router.register("solicitudes-arrendamiento", SolicitudArrendamientoViewSet)

public_router = DefaultRouter()
public_router.register("habitaciones-disponibles", HabitacionDisponibleViewSet, basename="habitaciones-disponibles")
public_router.register("solicitudes", SolicitudPublicaViewSet, basename="solicitudes-publicas")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/login/", LoginAdministrativoView.as_view()),
    path("api/", include(router.urls)),
    path("api/public/", include(public_router.urls)),
    path("api/public/registro/", RegistroInteresadoView.as_view()),
    path("api/public/login/", LoginInteresadoView.as_view()),
    path("api/public/perfil/", PerfilInteresadoView.as_view()),
    path("api/auth/", include("rest_framework.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
