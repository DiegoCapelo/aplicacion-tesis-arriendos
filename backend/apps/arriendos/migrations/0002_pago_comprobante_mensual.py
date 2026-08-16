from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("arriendos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="pago",
            name="referencia_pago",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="pago",
            name="comprobante_pago",
            field=models.FileField(blank=True, null=True, upload_to="comprobantes_pago_mensual/"),
        ),
        migrations.AddField(
            model_name="pago",
            name="observaciones_cliente",
            field=models.TextField(blank=True),
        ),
    ]
