"""
Vistas y endpoints API de Django para Bodega El Pana.
Conecta el frontend (index.html, checkout.html, main.js) con PostgreSQL.
"""

import json
import re
from decimal import Decimal
from django.db import transaction
from django.http import HttpRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_http_methods

from .models import DetallePedido, Pedido, Producto

# Datos semilla que se insertan automáticamente si la tabla productos está vacía
PRODUCTOS_INICIALES = [
    {
        "nombre": "Harina de maíz precocida 1kg",
        "categoria": "Víveres",
        "marca": "La Arepera",
        "precio_bs": Decimal("62.40"),
        "unidad": "und",
        "imagen": "assets/products/harina.jpg",
        "es_nuevo": True,
    },
    {
        "nombre": "Café molido tostado 500g",
        "categoria": "Café",
        "marca": "Montaña Andina",
        "precio_bs": Decimal("289.90"),
        "unidad": "und",
        "imagen": "assets/products/cafe.jpg",
        "es_nuevo": True,
    },
    {
        "nombre": "Queso blanco llanero",
        "categoria": "Charcutería",
        "marca": "Hato Real",
        "precio_bs": Decimal("410.00"),
        "unidad": "kg",
        "imagen": "assets/products/queso.jpg",
        "es_nuevo": False,
    },
    {
        "nombre": "Malta 355ml",
        "categoria": "Bebidas",
        "marca": "Malta del Sol",
        "precio_bs": Decimal("38.75"),
        "unidad": "und",
        "imagen": "assets/products/malta.jpg",
        "es_nuevo": True,
    },
    {
        "nombre": "Leche completa en polvo 400g",
        "categoria": "Lácteos",
        "marca": "Vaquita",
        "precio_bs": Decimal("215.30"),
        "unidad": "und",
        "imagen": "assets/products/leche.jpg",
        "es_nuevo": False,
    },
    {
        "nombre": "Chocolate con leche 130g",
        "categoria": "Chuchería",
        "marca": "Cacao Sur",
        "precio_bs": Decimal("96.50"),
        "unidad": "und",
        "imagen": "assets/products/chocolate.jpg",
        "es_nuevo": True,
    },
    {
        "nombre": "Detergente en polvo 1kg",
        "categoria": "Limpieza",
        "marca": "Blancura",
        "precio_bs": Decimal("154.20"),
        "unidad": "und",
        "imagen": "assets/products/detergente.jpg",
        "es_nuevo": False,
    },
    {
        "nombre": "Jabón de baño x3",
        "categoria": "Aseo personal",
        "marca": "Frescor",
        "precio_bs": Decimal("88.00"),
        "unidad": "und",
        "imagen": "assets/products/jabon.jpg",
        "es_nuevo": False,
    },
]


def asegurar_productos_semilla() -> None:
    """Inserta los 8 productos iniciales en PostgreSQL si la tabla está vacía."""
    if not Producto.objects.exists():
        Producto.objects.bulk_create([Producto(**datos) for datos in PRODUCTOS_INICIALES])


# ==========================================================================
# VISTAS DE PÁGINAS HTML
# ==========================================================================


def index_view(request: HttpRequest):
    """Sirve la página principal del catálogo (index.html)."""
    return render(request, "index.html")


def checkout_view(request: HttpRequest):
    """Sirve la página de pago del pedido (checkout.html)."""
    return render(request, "checkout.html")


# ==========================================================================
# ENDPOINTS API (JSON) CONECTADOS A POSTGRESQL
# ==========================================================================


@require_GET
def api_productos(request: HttpRequest) -> JsonResponse:
    """
    GET /api/productos/
    Devuelve todos los productos activos almacenados en PostgreSQL.
    """
    asegurar_productos_semilla()
    productos = Producto.objects.filter(activo=True).order_by("-creado_en", "id")

    data = [
        {
            "id": str(p.id),
            "name": p.nombre,
            "category": p.categoria,
            "brand": p.marca,
            "price_bs": float(p.precio_bs),
            "unit": p.unidad,
            "image": p.imagen or None,
            "is_new": p.es_nuevo,
            "created_at": p.creado_en.isoformat(),
        }
        for p in productos
    ]
    return JsonResponse({"ok": True, "products": data})


@csrf_exempt
@require_http_methods(["GET", "POST"])
def api_pedidos(request: HttpRequest) -> JsonResponse:
    """
    GET  /api/pedidos/ -> Lista los últimos pedidos registrados en PostgreSQL.
    POST /api/pedidos/ -> Valida y registra un nuevo pedido con sus productos en PostgreSQL.
    """
    if request.method == "GET":
        pedidos = Pedido.objects.prefetch_related("detalles").all()[:50]
        resultados = [
            {
                "id": p.id,
                "code": p.codigo,
                "firstName": p.nombre,
                "lastName": p.apellido,
                "cedula": p.cedula,
                "phone": p.telefono,
                "address": p.direccion,
                "paymentMethod": p.metodo_pago,
                "total_bs": float(p.total_bs),
                "status": p.estado,
                "created_at": p.creado_en.isoformat(),
                "items": [
                    {
                        "name": d.nombre_producto,
                        "quantity": d.cantidad,
                        "unit": d.unidad,
                        "price_bs": float(d.precio_unitario_bs),
                    }
                    for d in p.detalles.all()
                ],
            }
            for p in pedidos
        ]
        return JsonResponse({"ok": True, "orders": resultados})

    # POST: Crear nuevo pedido en PostgreSQL
    try:
        payload = json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({"ok": False, "error": "Formato JSON inválido."}, status=400)

    nombre = str(payload.get("firstName", "")).strip()
    apellido = str(payload.get("lastName", "")).strip()
    cedula = str(payload.get("cedula", "")).strip().upper()
    telefono = re.sub(r"[\s-]", "", str(payload.get("phone", "")).strip())
    direccion = str(payload.get("address", "")).strip()
    items = payload.get("items", [])

    # Validaciones de negocio
    if not (1 <= len(nombre) <= 60):
        return JsonResponse({"ok": False, "error": "Nombre inválido."}, status=400)
    if not (1 <= len(apellido) <= 60):
        return JsonResponse({"ok": False, "error": "Apellido inválido."}, status=400)
    if not re.match(r"^[VEJ]-\d{6,9}$", cedula):
        return JsonResponse({"ok": False, "error": "Cédula inválida (ej: V-12345678)."}, status=400)
    if not re.match(r"^0\d{10}$", telefono):
        return JsonResponse({"ok": False, "error": "Teléfono inválido (ej: 04141234567)."}, status=400)
    if not (5 <= len(direccion) <= 300):
        return JsonResponse({"ok": False, "error": "Dirección inválida."}, status=400)
    if not isinstance(items, list) or len(items) == 0:
        return JsonResponse({"ok": False, "error": "El pedido debe incluir al menos un producto."}, status=400)

    total_calculado = Decimal("0.00")
    renglones_preparados = []

    for item in items:
        cantidad = int(item.get("quantity", 0))
        precio_bs = Decimal(str(item.get("price_bs", "0")))
        nombre_prod = str(item.get("name", "")).strip()
        unidad_prod = str(item.get("unit", "und")).strip() or "und"
        prod_id = item.get("id")

        if cantidad <= 0 or precio_bs < 0 or not nombre_prod:
            return JsonResponse({"ok": False, "error": "Datos de producto inválidos."}, status=400)

        producto_obj = None
        if prod_id and str(prod_id).isdigit():
            producto_obj = Producto.objects.filter(pk=int(prod_id)).first()

        total_calculado += precio_bs * cantidad
        renglones_preparados.append(
            {
                "producto": producto_obj,
                "nombre_producto": nombre_prod,
                "cantidad": cantidad,
                "unidad": unidad_prod,
                "precio_unitario_bs": precio_bs,
            }
        )

    with transaction.atomic():
        pedido = Pedido.objects.create(
            nombre=nombre,
            apellido=apellido,
            cedula=cedula,
            telefono=telefono,
            direccion=direccion,
            metodo_pago="pago_movil",
            total_bs=total_calculado.quantize(Decimal("0.01")),
            estado="pendiente",
        )
        DetallePedido.objects.bulk_create(
            [DetallePedido(pedido=pedido, **renglon) for renglon in renglones_preparados]
        )

    return JsonResponse(
        {
            "ok": True,
            "id": pedido.id,
            "code": pedido.codigo,
            "total_bs": float(pedido.total_bs),
        },
        status=201,
    )
