-- ============================================================================
-- Esquema de Base de Datos PostgreSQL - Sistema de Ventas
-- Proyecto: Tienda de Productos Saludables
-- ============================================================================

-- Crear base de datos (ejecutar como superusuario)
-- CREATE DATABASE tienda_productos;
-- \c tienda_productos;

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLA: usuarios
-- Almacena información de usuarios del sistema (cliente/vendedor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(100) NOT NULL,
  correo VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'vendedor', 'admin')),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_usuarios_correo ON usuarios(correo);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- ============================================================================
-- TABLA: clientes
-- Almacena información adicional de clientes
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente SERIAL PRIMARY KEY,
  id_usuario INTEGER UNIQUE REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  nombre_cliente VARCHAR(100) NOT NULL,
  direccion VARCHAR(150),
  telefono VARCHAR(20),
  correo VARCHAR(100),
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clientes_id_usuario ON clientes(id_usuario);
CREATE INDEX IF NOT EXISTS idx_clientes_correo ON clientes(correo);

-- ============================================================================
-- TABLA: productos
-- Almacena información de los productos disponibles en la tienda
-- ============================================================================

CREATE TABLE IF NOT EXISTS productos (
  id_producto SERIAL PRIMARY KEY,
  nombre_producto VARCHAR(100) NOT NULL,
  tipo_producto VARCHAR(50) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  imagen_url VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_productos_tipo ON productos(tipo_producto);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_nombre ON productos(nombre_producto);

-- ============================================================================
-- TABLA: carrito
-- Almacena los productos en el carrito de cada cliente
-- ============================================================================

CREATE TABLE IF NOT EXISTS carrito (
  id_carrito SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_cliente, id_producto)
);

CREATE INDEX IF NOT EXISTS idx_carrito_cliente ON carrito(id_cliente);
CREATE INDEX IF NOT EXISTS idx_carrito_producto ON carrito(id_producto);

-- ============================================================================
-- TABLA: ventas
-- Almacena información de las ventas realizadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS ventas (
  id_venta SERIAL PRIMARY KEY,
  id_cliente INTEGER NOT NULL REFERENCES clientes(id_cliente) ON DELETE RESTRICT,
  id_vendedor INTEGER REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
  metodo_pago VARCHAR(50),
  notas TEXT
);

CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_ventas_estado ON ventas(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_vendedor ON ventas(id_vendedor);

-- ============================================================================
-- TABLA: detalle_venta
-- Almacena el detalle de cada producto vendido en una venta
-- ============================================================================

CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle SERIAL PRIMARY KEY,
  id_venta INTEGER NOT NULL REFERENCES ventas(id_venta) ON DELETE CASCADE,
  id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_venta(id_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_producto ON detalle_venta(id_producto);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para productos
DROP TRIGGER IF EXISTS trigger_actualizar_producto ON productos;
CREATE TRIGGER trigger_actualizar_producto
  BEFORE UPDATE ON productos
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Trigger para usuarios
DROP TRIGGER IF EXISTS trigger_actualizar_usuario ON usuarios;
CREATE TRIGGER trigger_actualizar_usuario
  BEFORE UPDATE ON usuarios
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_fecha_actualizacion();

-- Función para calcular total de venta automáticamente
CREATE OR REPLACE FUNCTION calcular_total_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ventas
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM detalle_venta
    WHERE id_venta = NEW.id_venta
  )
  WHERE id_venta = NEW.id_venta;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar total cuando se inserta/actualiza detalle_venta
DROP TRIGGER IF EXISTS trigger_calcular_total_insert ON detalle_venta;
CREATE TRIGGER trigger_calcular_total_insert
  AFTER INSERT ON detalle_venta
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_venta();

DROP TRIGGER IF EXISTS trigger_calcular_total_update ON detalle_venta;
CREATE TRIGGER trigger_calcular_total_update
  AFTER UPDATE ON detalle_venta
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_venta();

DROP TRIGGER IF EXISTS trigger_calcular_total_delete ON detalle_venta;
CREATE TRIGGER trigger_calcular_total_delete
  AFTER DELETE ON detalle_venta
  FOR EACH ROW
  EXECUTE FUNCTION calcular_total_venta();

-- Función para actualizar stock al realizar venta
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE productos
  SET stock = stock - NEW.cantidad
  WHERE id_producto = NEW.id_producto;
  
  IF (SELECT stock FROM productos WHERE id_producto = NEW.id_producto) < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente para el producto %', NEW.id_producto;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar stock
DROP TRIGGER IF EXISTS trigger_actualizar_stock ON detalle_venta;
CREATE TRIGGER trigger_actualizar_stock
  AFTER INSERT ON detalle_venta
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_stock_venta();

-- Función para restaurar stock si se cancela venta
CREATE OR REPLACE FUNCTION restaurar_stock_cancelacion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'cancelada' AND OLD.estado != 'cancelada' THEN
    UPDATE productos p
    SET stock = p.stock + dv.cantidad
    FROM detalle_venta dv
    WHERE p.id_producto = dv.id_producto
    AND dv.id_venta = NEW.id_venta;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restaurar_stock ON ventas;
CREATE TRIGGER trigger_restaurar_stock
  AFTER UPDATE ON ventas
  FOR EACH ROW
  WHEN (NEW.estado = 'cancelada' AND OLD.estado != 'cancelada')
  EXECUTE FUNCTION restaurar_stock_cancelacion();

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Procedimiento para crear una venta completa
CREATE OR REPLACE FUNCTION crear_venta_completa(
  p_id_cliente INTEGER,
  p_items JSONB,
  p_id_vendedor INTEGER DEFAULT NULL,
  p_metodo_pago VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_id_venta INTEGER;
  v_item JSONB;
  v_total DECIMAL(10,2) := 0;
BEGIN
  -- Calcular el total antes de insertar la venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL);
  END LOOP;
  
  -- Crear la venta con el total calculado
  INSERT INTO ventas (id_cliente, id_vendedor, metodo_pago, estado, total)
  VALUES (p_id_cliente, p_id_vendedor, p_metodo_pago, 'pendiente', v_total)
  RETURNING id_venta INTO v_id_venta;
  
  -- Insertar detalles de venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
    VALUES (
      v_id_venta,
      (v_item->>'id_producto')::INTEGER,
      (v_item->>'cantidad')::INTEGER,
      (v_item->>'precio_unitario')::DECIMAL
    );
  END LOOP;
  
  -- Completar la venta (el trigger actualizará el total si es necesario)
  UPDATE ventas SET estado = 'completada' WHERE id_venta = v_id_venta;
  
  -- Limpiar carrito del cliente
  DELETE FROM carrito WHERE id_cliente = p_id_cliente;
  
  RETURN v_id_venta;
END;
$$ LANGUAGE plpgsql;

-- Procedimiento para obtener estadísticas de ventas
CREATE OR REPLACE FUNCTION obtener_estadisticas_ventas(
  p_fecha_inicio DATE DEFAULT NULL,
  p_fecha_fin DATE DEFAULT NULL
)
RETURNS TABLE (
  total_ventas BIGINT,
  total_ingresos DECIMAL,
  promedio_venta DECIMAL,
  ventas_hoy BIGINT,
  ingresos_hoy DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_ventas,
    COALESCE(SUM(total), 0)::DECIMAL as total_ingresos,
    COALESCE(AVG(total), 0)::DECIMAL as promedio_venta,
    COUNT(*) FILTER (WHERE DATE(fecha_venta) = CURRENT_DATE)::BIGINT as ventas_hoy,
    COALESCE(SUM(total) FILTER (WHERE DATE(fecha_venta) = CURRENT_DATE), 0)::DECIMAL as ingresos_hoy
  FROM ventas
  WHERE estado = 'completada'
  AND (p_fecha_inicio IS NULL OR DATE(fecha_venta) >= p_fecha_inicio)
  AND (p_fecha_fin IS NULL OR DATE(fecha_venta) <= p_fecha_fin);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DATOS DE EJEMPLO
-- ============================================================================

-- Insertar usuarios de ejemplo (password: password123 - debe ser hasheado)
-- Las contraseñas deben ser hasheadas con bcrypt antes de insertar
INSERT INTO usuarios (nombre_usuario, correo, password, rol) VALUES
('Admin', 'admin@tienda.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'admin'),
('Vendedor 1', 'vendedor@tienda.com', '$2a$10$rOzJqJqJqJqJqJqJqJqJqOqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJq', 'vendedor')
ON CONFLICT (correo) DO NOTHING;

-- Insertar productos de ejemplo (variedad de productos saludables y naturales)
INSERT INTO productos (nombre_producto, tipo_producto, descripcion, precio, stock) VALUES
-- Jugos y Smoothies
('Jugo Verde Detox', 'líquido', 'Mezcla de frutas y verduras ideal para desintoxicar. Rico en antioxidantes y vitaminas.', 45.00, 50),
('Smoothie de Fresa', 'líquido', 'Bebida cremosa a base de fresa y yogurt natural. Fuente de probióticos.', 40.00, 30),
('Smoothie Tropical', 'líquido', 'Combinación de piña, mango y coco. Energía natural y refrescante.', 42.00, 35),
('Jugo de Zanahoria y Naranja', 'líquido', 'Rico en betacarotenos y vitamina C. Refuerza el sistema inmunológico.', 38.00, 40),
('Smoothie Verde Energético', 'líquido', 'Espinaca, plátano y manzana. Perfecto para empezar el día con energía.', 44.00, 28),

-- Suplementos en Polvo
('Proteína en Polvo Vainilla', 'polvo', 'Suplemento de proteína sabor vainilla, ideal para batidos post-entrenamiento.', 320.00, 20),
('Proteína en Polvo Chocolate', 'polvo', 'Proteína vegana sabor chocolate. Sin lactosa ni gluten.', 325.00, 18),
('Colágeno Hidrolizado', 'polvo', 'Colágeno tipo I y III para la salud de la piel, cabello y articulaciones.', 280.00, 25),
('Superfood Mix', 'polvo', 'Mezcla de espirulina, chlorella, maca y cacao. Superalimentos en un solo producto.', 350.00, 15),
('Proteína de Cáñamo', 'polvo', 'Proteína vegetal completa con omega-3. Ideal para dietas veganas.', 295.00, 22),

-- Snacks Saludables
('Mix de Frutas Deshidratadas', 'otro', 'Botana saludable con variedad de frutas deshidratadas. Sin azúcar añadida.', 80.00, 40),
('Nueces y Almendras Orgánicas', 'otro', 'Mezcla premium de nueces y almendras orgánicas. Fuente de grasas saludables.', 120.00, 30),
('Barritas de Avena y Miel', 'otro', 'Barritas energéticas naturales con avena, miel y frutos secos.', 35.00, 50),
('Chips de Plátano Verde', 'otro', 'Snack crujiente de plátano verde. Natural y sin conservantes.', 45.00, 38),
('Mix de Semillas', 'otro', 'Chía, linaza, girasol y calabaza. Rico en fibra y omega-3.', 55.00, 42),

-- Tés e Infusiones
('Té Verde Orgánico', 'líquido', 'Té verde premium con propiedades antioxidantes. Envase de 20 bolsitas.', 65.00, 35),
('Té de Manzanilla', 'líquido', 'Infusión relajante de manzanilla. Ideal para antes de dormir.', 50.00, 40),
('Té Matcha Premium', 'polvo', 'Matcha de alta calidad. Rico en antioxidantes y energía natural.', 180.00, 20),
('Infusión Detox', 'líquido', 'Mezcla de hierbas naturales para desintoxicar el organismo.', 58.00, 32),

-- Superfoods y Productos Especiales
('Aceite de Coco Virgen', 'líquido', 'Aceite de coco extra virgen prensado en frío. 500ml.', 95.00, 28),
('Miel de Abeja Pura', 'líquido', 'Miel 100% natural sin procesar. Envase de 500g.', 85.00, 30),
('Polen de Abeja', 'polvo', 'Superalimento rico en proteínas, vitaminas y minerales. 200g.', 120.00, 18),
('Jalea Real', 'líquido', 'Jalea real pura. Refuerza el sistema inmunológico. 30g.', 150.00, 15)
ON CONFLICT DO NOTHING;

