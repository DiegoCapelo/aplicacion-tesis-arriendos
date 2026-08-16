from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("solicitudes", "0003_solicitudarrendamiento_estado_pago_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="solicitudarrendamiento",
            name="comprobante_pago",
            field=models.FileField(blank=True, null=True, upload_to="comprobantes_pago/"),
        ),
    ]
