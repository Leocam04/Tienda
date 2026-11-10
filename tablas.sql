-- ==========================================================================
-- BODEGA EL PANA — ESQUEMA SQL PARA POSTGRESQL (Base de datos: tienda_db)
-- ==========================================================================

CREATE TABLE IF NOT EXISTS productos (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    categoria VARCHAR(80) NOT NULL,
    marca VARCHAR(80) NOT NULL DEFAULT 'N/A',
    precio_bs NUMERIC(12, 2) NOT NULL CHECK (precio_bs >= 0),
    unidad VARCHAR(20) NOT NULL DEFAULT 'und',
    imagen VARCHAR(255) NOT NULL DEFAULT '',
    es_nuevo BOOLEAN NOT NULL DEFAULT FALSE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(16) NOT NULL UNIQUE,
    nombre VARCHAR(60) NOT NULL,
    apellido VARCHAR(60) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    telefono VARCHAR(20) NOT NULL,
    direccion TEXT NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'pago_movil',
    total_bs NUMERIC(12, 2) NOT NULL CHECK (total_bs >= 0),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    creado_en TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id BIGINT REFERENCES productos(id) ON DELETE SET NULL,
    nombre_producto VARCHAR(150) NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    unidad VARCHAR(20) NOT NULL DEFAULT 'und',
    precio_unitario_bs NUMERIC(12, 2) NOT NULL CHECK (precio_unitario_bs >= 0)
);

-- Carga inicial de productos de la bodega
INSERT INTO productos (nombre, categoria, marca, precio_bs, unidad, imagen, es_nuevo, activo) VALUES
('Harina de maíz precocida 1kg', 'Víveres', 'La Arepera', 62.40, 'und', 'assets/products/harina.jpg', TRUE, TRUE),
('Café molido tostado 500g', 'Café', 'Montaña Andina', 289.90, 'und', 'assets/products/cafe.jpg', TRUE, TRUE),
('Queso blanco llanero', 'Charcutería', 'Hato Real', 410.00, 'kg', 'assets/products/queso.jpg', FALSE, TRUE),
('Malta 355ml', 'Bebidas', 'Malta del Sol', 38.75, 'und', 'assets/products/malta.jpg', TRUE, TRUE),
('Leche completa en polvo 400g', 'Lácteos', 'Vaquita', 215.30, 'und', 'assets/products/leche.jpg', FALSE, TRUE),
('Chocolate con leche 130g', 'Chuchería', 'Cacao Sur', 96.50, 'und', 'assets/products/chocolate.jpg', TRUE, TRUE),
('Detergente en polvo 1kg', 'Limpieza', 'Blancura', 154.20, 'und', 'assets/products/detergente.jpg', FALSE, TRUE),
('Jabón de baño x3', 'Aseo personal', 'Frescor', 88.00, 'und', 'assets/products/jabon.jpg', FALSE, TRUE);

