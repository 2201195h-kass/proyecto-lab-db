# Base de Datos - Sistema de Ventas

Este directorio contiene los archivos SQL para crear y configurar la base de datos del proyecto.

## Archivos

- **`schema.sql`**: Esquema completo con todas las tablas, índices y datos de ejemplo
- **`tablas.sql`**: Solo las definiciones de tablas (sin datos de ejemplo)

## Estructura de Tablas

### 1. `productos`
Almacena información de los productos disponibles en la tienda.
- `id_producto`: Identificador único (PK)
- `nombre_producto`: Nombre del producto
- `tipo_producto`: Tipo/categoría del producto
- `descripcion`: Descripción detallada
- `precio`: Precio del producto

### 2. `clientes`
Almacena información de los clientes.
- `id_cliente`: Identificador único (PK)
- `nombre_cliente`: Nombre completo del cliente
- `direccion`: Dirección del cliente
- `telefono`: Teléfono de contacto
- `correo`: Correo electrónico

### 3. `usuarios`
Almacena información de usuarios del sistema (admin y vendedores).
- `id_usuario`: Identificador único (PK)
- `nombre_usuario`: Nombre del usuario
- `correo`: Correo electrónico (único)
- `password`: Contraseña (debe estar hasheada)
- `rol`: Rol del usuario ('admin' o 'vendedor')

### 4. `ventas`
Almacena información de las ventas realizadas.
- `id_venta`: Identificador único (PK)
- `id_cliente`: Referencia al cliente (FK)
- `fecha_venta`: Fecha y hora de la venta
- `total`: Total de la venta

### 5. `detalle_venta`
Almacena el detalle de cada producto vendido en una venta.
- `id_detalle`: Identificador único (PK)
- `id_venta`: Referencia a la venta (FK)
- `id_producto`: Referencia al producto (FK)
- `cantidad`: Cantidad vendida
- `precio_unitario`: Precio unitario al momento de la venta

## Instalación

### Opción 1: Usando MySQL Command Line

```bash
mysql -u root -p < database/schema.sql
```

### Opción 2: Usando phpMyAdmin

1. Abre phpMyAdmin
2. Selecciona o crea la base de datos
3. Ve a la pestaña "Importar"
4. Selecciona el archivo `schema.sql`
5. Haz clic en "Continuar"

### Opción 3: Usando MySQL Workbench

1. Abre MySQL Workbench
2. Conéctate a tu servidor MySQL
3. Abre el archivo `schema.sql`
4. Ejecuta el script completo

## Notas Importantes

- Las contraseñas en los datos de ejemplo están hasheadas usando bcrypt
- En producción, siempre usa `password_hash()` de PHP para almacenar contraseñas
- Los datos de ejemplo en `schema.sql` son solo para desarrollo/pruebas
- Las claves foráneas están configuradas con restricciones apropiadas

## Relaciones

```
clientes (1) ──< (N) ventas
ventas (1) ──< (N) detalle_venta
productos (1) ──< (N) detalle_venta
```

