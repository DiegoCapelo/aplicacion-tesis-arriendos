from calendar import monthrange
from datetime import date

from django.db.models import Q
from django.utils import timezone

from .models import Arriendo, Pago


MESES_ES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
]


def periodo_actual(hoy=None):
    hoy = hoy or timezone.localdate()
    return f"{MESES_ES[hoy.month - 1]} de {hoy.year}"


def fecha_limite_periodo(hoy=None, dia_pago=None):
    hoy = hoy or timezone.localdate()
    dia_base = int(dia_pago or hoy.day)
    ultimo_dia = monthrange(hoy.year, hoy.month)[1]
    return date(hoy.year, hoy.month, min(dia_base, ultimo_dia))


def ensure_monthly_payments(arriendos=None, hoy=None):
    hoy = hoy or timezone.localdate()
    periodo = periodo_actual(hoy)
    periodo_legacy = periodo.replace(" de ", " ")
    queryset = arriendos if arriendos is not None else Arriendo.objects.filter(estado=Arriendo.ACTIVO)

    for arriendo in queryset:
        fecha_limite = fecha_limite_periodo(hoy, arriendo.fecha_inicio.day)
        pago_periodo = Pago.objects.filter(
            arriendo=arriendo,
            periodo__in=[periodo, periodo_legacy],
        ).first()
        if pago_periodo:
            if pago_periodo.estado != Pago.PAGADO and pago_periodo.fecha_vencimiento != fecha_limite:
                pago_periodo.fecha_vencimiento = fecha_limite
                pago_periodo.save(update_fields=["fecha_vencimiento"])
        else:
            Pago.objects.create(
                arriendo=arriendo,
                periodo=periodo,
                fecha_vencimiento=fecha_limite,
                monto=arriendo.valor_mensual,
                estado=Pago.PENDIENTE,
                observaciones="Cobro mensual generado automáticamente.",
            )

    Pago.objects.filter(
        Q(arriendo__in=queryset) if arriendos is not None else Q(arriendo__estado=Arriendo.ACTIVO),
        estado=Pago.PENDIENTE,
        fecha_vencimiento__lt=hoy,
    ).update(estado=Pago.ATRASADO)
