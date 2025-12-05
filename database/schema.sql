-- ============================================================================
-- Esquema de Base de Datos - Sistema de Ventas
-- Proyecto: Tienda de Productos Saludables
-- ============================================================================

-- Crear base de datos (opcional, descomentar si es necesario)
-- CREATE DATABASE IF NOT EXISTS tienda_productos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE tienda_productos;

-- ============================================================================
-- TABLA: productos
-- Almacena información de los productos disponibles en la tienda
-- ============================================================================

CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre_producto VARCHAR(100) NOT NULL,
  tipo_producto VARCHAR(50) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL,
  INDEX idx_tipo_producto (tipo_producto),
  INDEX idx_nombre_producto (nombre_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: clientes
-- Almacena información de los clientes que realizan compras
-- ============================================================================

CREATE TABLE IF NOT EXISTS clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre_cliente VARCHAR(100) NOT NULL,
  direccion VARCHAR(150),
  telefono VARCHAR(20),
  correo VARCHAR(100),
  INDEX idx_correo (correo),
  INDEX idx_nombre_cliente (nombre_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: usuarios
-- Almacena información de usuarios del sistema (admin y vendedores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(100),
  correo VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol ENUM('admin','vendedor') DEFAULT 'vendedor',
  INDEX idx_correo_usuario (correo),
  INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: ventas
-- Almacena información de las ventas realizadas
-- ============================================================================

CREATE TABLE IF NOT EXISTS ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_fecha_venta (fecha_venta),
  INDEX idx_id_cliente (id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- TABLA: detalle_venta
-- Almacena el detalle de cada producto vendido en una venta
-- ============================================================================

CREATE TABLE IF NOT EXISTS detalle_venta (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_id_venta (id_venta),
  INDEX idx_id_producto (id_producto)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Datos de ejemplo (opcional)
-- ============================================================================

-- Insertar algunos productos de ejemplo
INSERT INTO productos (nombre_producto, tipo_producto, descripcion, precio) VALUES
('Jugo Verde Detox', 'líquido', 'Mezcla de frutas y verduras ideal para desintoxicar.', 45.00),
('Smoothie de Fresa', 'líquido', 'Bebida cremosa a base de fresa y yogurt.', 40.00),
('Proteína en Polvo Vainilla', 'polvo', 'Suplemento de proteína sabor vainilla, ideal para batidos.', 320.00),
('Mix de Frutas Deshidratadas', 'otro', 'Botana saludable con variedad de frutas deshidratadas.', 80.00);

-- Insertar algunos clientes de ejemplo
INSERT INTO clientes (nombre_cliente, direccion, telefono, correo) VALUES
('Ana López', 'Calle Principal 123', '555-123-4567', 'ana@example.com'),
('Luis Pérez', 'Avenida Central 456', '555-987-6543', 'luis@example.com');

-- Insertar usuario administrador de ejemplo (password: admin123 - debería ser hasheado en producción)
-- NOTA: En producción, siempre usar password_hash() de PHP para almacenar contraseñas
INSERT INTO usuarios (nombre_usuario, correo, password, rol) VALUES
('Administrador', 'admin@tienda.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Vendedor 1', 'vendedor@tienda.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'vendedor');

