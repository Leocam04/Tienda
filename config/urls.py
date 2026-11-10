"""
Rutas principales del proyecto Bodega El Pana.
Sirve las páginas HTML, los archivos CSS/JS/assets de la raíz y la API REST.
"""

from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from django.views.static import serve

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("bodega.urls")),
    # Sirve styles.css, main.js y la carpeta assets/ manteniendo las rutas limpias del HTML
    path(
        "styles.css",
        serve,
        {"document_root": settings.BASE_DIR, "path": "styles.css"},
    ),
    path(
        "main.js",
        serve,
        {"document_root": settings.BASE_DIR, "path": "main.js"},
    ),
    path(
        "assets/<path:path>",
        serve,
        {"document_root": settings.BASE_DIR / "assets"},
    ),
]

