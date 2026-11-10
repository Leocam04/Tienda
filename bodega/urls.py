from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    # Páginas HTML
    path("", views.index_view, name="index"),
    path("index.html", views.index_view, name="index_html"),
    path("checkout.html", views.checkout_view, name="checkout_html"),
    path("checkout/", RedirectView.as_view(url="/checkout.html", permanent=False), name="checkout_redirect"),
    # Endpoints API REST (PostgreSQL)
    path("api/productos/", views.api_productos, name="api_productos"),
    path("api/pedidos/", views.api_pedidos, name="api_pedidos"),
]

