from django.core.management.base import BaseCommand
from bodega.models import Producto
from bodega.views import PRODUCTOS_INICIALES


class Command(BaseCommand):
    help = "Carga o actualiza el catálogo inicial de productos en PostgreSQL."

    def handle(self, *args, **options):
        creados = 0
        for datos in PRODUCTOS_INICIALES:
            _, created = Producto.objects.update_or_create(
                nombre=datos["nombre"],
                defaults=datos,
            )
            if created:
                creados += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Catálogo listo en PostgreSQL: {Producto.objects.count()} productos activos ({creados} nuevos)."
            )
        )

