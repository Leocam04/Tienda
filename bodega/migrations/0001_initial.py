# Migración inicial para Bodega El Pana (PostgreSQL)

import bodega.models
import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


def cargar_productos_iniciales(apps, schema_editor):
    Producto = apps.get_model("bodega", "Producto")
    if Producto.objects.exists():
        return

    productos = [
        Producto(
            nombre="Harina de maíz precocida 1kg",
            categoria="Víveres",
            marca="La Arepera",
            precio_bs=Decimal("62.40"),
            unidad="und",
            imagen="assets/products/harina.jpg",
            es_nuevo=True,
            activo=True,
        ),
        Producto(
            nombre="Café molido tostado 500g",
            categoria="Café",
            marca="Montaña Andina",
            precio_bs=Decimal("289.90"),
            unidad="und",
            imagen="assets/products/cafe.jpg",
            es_nuevo=True,
            activo=True,
        ),
        Producto(
            nombre="Queso blanco llanero",
            categoria="Charcutería",
            marca="Hato Real",
            precio_bs=Decimal("410.00"),
            unidad="kg",
            imagen="assets/products/queso.jpg",
            es_nuevo=False,
            activo=True,
        ),
        Producto(
            nombre="Malta 355ml",
            categoria="Bebidas",
            marca="Malta del Sol",
            precio_bs=Decimal("38.75"),
            unidad="und",
            imagen="assets/products/malta.jpg",
            es_nuevo=True,
            activo=True,
        ),
        Producto(
            nombre="Leche completa en polvo 400g",
            categoria="Lácteos",
            marca="Vaquita",
            precio_bs=Decimal("215.30"),
            unidad="und",
            imagen="assets/products/leche.jpg",
            es_nuevo=False,
            activo=True,
        ),
        Producto(
            nombre="Chocolate con leche 130g",
            categoria="Chuchería",
            marca="Cacao Sur",
            precio_bs=Decimal("96.50"),
            unidad="und",
            imagen="assets/products/chocolate.jpg",
            es_nuevo=True,
            activo=True,
        ),
        Producto(
            nombre="Detergente en polvo 1kg",
            categoria="Limpieza",
            marca="Blancura",
            precio_bs=Decimal("154.20"),
            unidad="und",
            imagen="assets/products/detergente.jpg",
            es_nuevo=False,
            activo=True,
        ),
        Producto(
            nombre="Jabón de baño x3",
            categoria="Aseo personal",
            marca="Frescor",
            precio_bs=Decimal("88.00"),
            unidad="und",
            imagen="assets/products/jabon.jpg",
            es_nuevo=False,
            activo=True,
        ),
    ]
    Producto.objects.bulk_create(productos)


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Producto",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("nombre", models.CharField(max_length=150, verbose_name="Nombre")),
                ("categoria", models.CharField(max_length=80, verbose_name="Categoría")),
                (
                    "marca",
                    models.CharField(default="N/A", max_length=80, verbose_name="Marca"),
                ),
                (
                    "precio_bs",
                    models.DecimalField(
                        decimal_places=2, max_digits=12, verbose_name="Precio (Bs)"
                    ),
                ),
                (
                    "unidad",
                    models.CharField(default="und", max_length=20, verbose_name="Unidad"),
                ),
                (
                    "imagen",
                    models.CharField(
                        blank=True,
                        help_text="Ejemplo: assets/products/harina.jpg",
                        max_length=255,
                        verbose_name="Ruta de imagen",
                    ),
                ),
                (
                    "es_nuevo",
                    models.BooleanField(default=False, verbose_name="¿Es nuevo?"),
                ),
                ("activo", models.BooleanField(default=True, verbose_name="Activo")),
                (
                    "creado_en",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Fecha de creación"
                    ),
                ),
            ],
            options={
                "verbose_name": "Producto",
                "verbose_name_plural": "Productos",
                "db_table": "productos",
                "ordering": ["-creado_en", "id"],
            },
        ),
        migrations.CreateModel(
            name="Pedido",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "codigo",
                    models.CharField(
                        default=bodega.models.generar_codigo_pedido,
                        max_length=16,
                        unique=True,
                        verbose_name="Código de pedido",
                    ),
                ),
                ("nombre", models.CharField(max_length=60, verbose_name="Nombre")),
                ("apellido", models.CharField(max_length=60, verbose_name="Apellido")),
                (
                    "cedula",
                    models.CharField(max_length=20, verbose_name="Cédula / RIF"),
                ),
                ("telefono", models.CharField(max_length=20, verbose_name="Teléfono")),
                (
                    "direccion",
                    models.TextField(max_length=300, verbose_name="Dirección de entrega"),
                ),
                (
                    "metodo_pago",
                    models.CharField(
                        default="pago_movil",
                        max_length=30,
                        verbose_name="Método de pago",
                    ),
                ),
                (
                    "total_bs",
                    models.DecimalField(
                        decimal_places=2, max_digits=12, verbose_name="Total (Bs)"
                    ),
                ),
                (
                    "estado",
                    models.CharField(
                        choices=[
                            ("pendiente", "Pendiente"),
                            ("confirmado", "Confirmado"),
                            ("enviado", "En camino"),
                            ("entregado", "Entregado"),
                            ("cancelado", "Cancelado"),
                        ],
                        default="pendiente",
                        max_length=20,
                        verbose_name="Estado",
                    ),
                ),
                (
                    "creado_en",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Fecha del pedido"
                    ),
                ),
            ],
            options={
                "verbose_name": "Pedido",
                "verbose_name_plural": "Pedidos",
                "db_table": "pedidos",
                "ordering": ["-creado_en"],
            },
        ),
        migrations.CreateModel(
            name="DetallePedido",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "nombre_producto",
                    models.CharField(max_length=150, verbose_name="Producto"),
                ),
                (
                    "cantidad",
                    models.PositiveIntegerField(default=1, verbose_name="Cantidad"),
                ),
                (
                    "unidad",
                    models.CharField(default="und", max_length=20, verbose_name="Unidad"),
                ),
                (
                    "precio_unitario_bs",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=12,
                        verbose_name="Precio unitario (Bs)",
                    ),
                ),
                (
                    "pedido",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="detalles",
                        to="bodega.pedido",
                        verbose_name="Pedido",
                    ),
                ),
                (
                    "producto",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="bodega.producto",
                        verbose_name="Producto",
                    ),
                ),
            ],
            options={
                "verbose_name": "Detalle de pedido",
                "verbose_name_plural": "Detalles de pedido",
                "db_table": "detalle_pedidos",
            },
        ),
        migrations.RunPython(cargar_productos_iniciales, migrations.RunPython.noop),
    ]

