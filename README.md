# Bodega El Pana — Tienda en Línea (HTML + CSS + JS + Django & PostgreSQL)

Sistema de comercio electrónico para **Bodega El Pana**, con frontend separado en **HTML, CSS y JavaScript puros** y backend en **Python (Django)** conectado a una base de datos **PostgreSQL (`tienda_db`)**.

---

## 📂 Estructura del Proyecto

```text
tienda/
├── index.html                  # Página principal (Banner mosaico, buscador, filtros y catálogo)
├── checkout.html               # Página de pago (Formulario, datos de Pago Móvil y resumen)
├── styles.css                  # Hoja de estilos principal separada por secciones
├── main.js                     # Lógica de frontend (carrito, filtros, WhatsApp y conexión API)
├── assets/                     # Imágenes del banner, favicon.svg y fotos de productos
│   └── products/               # Fotografías de los productos (harina, café, queso, etc.)
├── manage.py                   # Punto de entrada de línea de comandos de Django
├── requirements.txt            # Dependencias de Python (Django y psycopg2-binary)
├── tablas.sql                  # Script SQL de referencia para PostgreSQL
├── config/                     # Configuración principal de Django y conexión a PostgreSQL
│   ├── settings.py             # Credenciales de PostgreSQL (tienda_db, postgres / 1234)
│   ├── urls.py                 # Enrutador general (sirve el HTML/CSS/JS, API y /admin)
│   └── wsgi.py / asgi.py
└── bodega/                     # Aplicación principal de Django
    ├── models.py               # Modelos ORM: Producto, Pedido y DetallePedido
    ├── views.py                # Vistas HTML y API REST (/api/productos/ y /api/pedidos/)
    ├── urls.py                 # Rutas de la tienda y endpoints JSON
    ├── admin.py                # Panel de administración de productos y pedidos
    ├── migrations/             # Migración inicial con carga automática de los 8 productos
    └── management/commands/
        └── cargar_productos.py # Comando: python manage.py cargar_productos
```

---

## ⚙️ Cómo ejecutar con Django y PostgreSQL

### 1. Crear la base de datos en PostgreSQL
Abre **pgAdmin** o `psql` y crea la base de datos `tienda_db`:
```sql
CREATE DATABASE tienda_db;
```
*(La conexión en `config/settings.py` está configurada por defecto con usuario `postgres`, contraseña `1234`, host `localhost` y puerto `5432`).*

### 2. Instalar dependencias de Python
```bash
pip install -r requirements.txt
```

### 3. Aplicar migraciones (crea las tablas y carga los 8 productos iniciales)
```bash
python manage.py migrate
```

### 4. Iniciar el servidor
```bash
python manage.py runserver
```

- **Tienda en línea:** `http://127.0.0.1:8000/`
- **Página de Checkout:** `http://127.0.0.1:8000/checkout.html`
- **API de Productos (JSON):** `http://127.0.0.1:8000/api/productos/`
- **API de Pedidos (JSON):** `http://127.0.0.1:8000/api/pedidos/`
- **Panel de Administración:** `http://127.0.0.1:8000/admin/` *(puedes crear tu usuario admin con `python manage.py createsuperuser`)*
