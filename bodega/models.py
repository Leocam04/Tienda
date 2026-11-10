"""
Modelos de base de datos (PostgreSQL) para Bodega El Pana.
Incluye: Producto, Pedido y DetallePedido.
"""

import uuid
from django.db import models


def generar_codigo_pedido() -> str:
    """Genera un código único de 8 caracteres para identificar el pedido."""
    return uuid.uuid4().hex[:8].upper()


class Producto(models.Model):
    """Catálogo de productos disponibles en la tienda."""

    nombre = models.CharField("Nombre", max_length=150)
    categoria = models.CharField("Categoría", max_length=80)
    marca = models.CharField("Marca", max_length=80, default="N/A")
    precio_bs = models.DecimalField("Precio (Bs)", max_digits=12, decimal_places=2)
    unidad = models.CharField("Unidad", max_length=20, default="und")
    imagen = models.CharField(
        "Ruta de imagen",
        max_length=255,
        blank=True,
        help_text="Ejemplo: assets/products/harina.jpg",
    )
    es_nuevo = models.BooleanField("¿Es nuevo?", default=False)
    activo = models.BooleanField("Activo", default=True)
    creado_en = models.DateTimeField("Fecha de creación", auto_now_add=True)

    class Meta:
        db_table = "productos"
        ordering = ["-creado_en", "id"]
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

    def __str__(self) -> str:
        return f"{self.nombre} ({self.precio_bs} Bs)"


class Pedido(models.Model):
    """Pedidos realizados por los clientes con Pago Móvil."""

    ESTADOS = [
        ("pendiente", "Pendiente"),
        ("confirmado", "Confirmado"),
        ("enviado", "En camino"),
        ("entregado", "Entregado"),
        ("cancelado", "Cancelado"),
    ]

    codigo = models.CharField(
        "Código de pedido",
        max_length=16,
        unique=True,
        default=generar_codigo_pedido,
    )
    nombre = models.CharField("Nombre", max_length=60)
    apellido = models.CharField("Apellido", max_length=60)
    cedula = models.CharField("Cédula / RIF", max_length=20)
    telefono = models.CharField("Teléfono", max_length=20)
    direccion = models.TextField("Dirección de entrega", max_length=300)
    metodo_pago = models.CharField("Método de pago", max_length=30, default="pago_movil")
    total_bs = models.DecimalField("Total (Bs)", max_digits=12, decimal_places=2)
    estado = models.CharField("Estado", max_length=20, choices=ESTADOS, default="pendiente")
    creado_en = models.DateTimeField("Fecha del pedido", auto_now_add=True)

    class Meta:
        db_table = "pedidos"
        ordering = ["-creado_en"]
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def __str__(self) -> str:
        return f"Pedido #{self.codigo} - {self.nombre} {self.apellido} ({self.total_bs} Bs)"


class DetallePedido(models.Model):
    """Renglones de productos incluidos dentro de cada pedido."""

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name="detalles",
        verbose_name="Pedido",
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Producto",
    )
    nombre_producto = models.CharField("Producto", max_length=150)
    cantidad = models.PositiveIntegerField("Cantidad", default=1)
    unidad = models.CharField("Unidad", max_length=20, default="und")
    precio_unitario_bs = models.DecimalField(
        "Precio unitario (Bs)", max_digits=12, decimal_places=2
    )

    class Meta:
        db_table = "detalle_pedidos"
        verbose_name = "Detalle de pedido"
        verbose_name_plural = "Detalles de pedido"

    @property
    def subtotal_bs(self):
        return self.cantidad * self.precio_unitario_bs

    def __str__(self) -> str:
        return f"{self.cantidad} x {self.nombre_producto}"

