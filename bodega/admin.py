from django.contrib import admin
from .models import DetallePedido, Pedido, Producto


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ("id", "nombre", "categoria", "marca", "precio_bs", "unidad", "es_nuevo", "activo")
    list_editable = ("precio_bs", "es_nuevo", "activo")
    list_filter = ("categoria", "activo", "es_nuevo")
    search_fields = ("nombre", "marca", "categoria")


class DetallePedidoInline(admin.TabularInline):
    model = DetallePedido
    extra = 0
    readonly_fields = ("producto", "nombre_producto", "cantidad", "unidad", "precio_unitario_bs")


@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ("codigo", "nombre", "apellido", "cedula", "telefono", "total_bs", "estado", "creado_en")
    list_editable = ("estado",)
    list_filter = ("estado", "metodo_pago", "creado_en")
    search_fields = ("codigo", "nombre", "apellido", "cedula", "telefono")
    inlines = [DetallePedidoInline]

