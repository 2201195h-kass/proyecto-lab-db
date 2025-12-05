-- ============================================================================
-- Definición de Tablas - Sistema de Ventas
-- Proyecto: Tienda de Productos Saludables
-- ============================================================================
-- Este archivo contiene únicamente las definiciones de las tablas
-- Para datos de ejemplo, ver schema.sql
-- ============================================================================

-- TABLA: productos
CREATE TABLE productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  nombre_producto VARCHAR(100) NOT NULL,
  tipo_producto VARCHAR(50) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10,2) NOT NULL
);

-- TABLA: clientes
CREATE TABLE clientes (
  id_cliente INT AUTO_INCREMENT PRIMARY KEY,
  nombre_cliente VARCHAR(100) NOT NULL,
  direccion VARCHAR(150),
  telefono VARCHAR(20),
  correo VARCHAR(100)
);

-- TABLA: usuarios
CREATE TABLE usuarios (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre_usuario VARCHAR(100),
  correo VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  rol ENUM('admin','vendedor') DEFAULT 'vendedor'
);

-- TABLA: ventas
CREATE TABLE ventas (
  id_venta INT AUTO_INCREMENT PRIMARY KEY,
  id_cliente INT NOT NULL,
  fecha_venta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

-- TABLA: detalle_venta
CREATE TABLE detalle_venta (
  id_detalle INT AUTO_INCREMENT PRIMARY KEY,
  id_venta INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
  FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
);

