# 🚀 Backend - Sistema de Ventas Fullstack

Backend completo desarrollado con Node.js, Express y PostgreSQL para el sistema de ventas de productos saludables.

## 📋 Características

- ✅ **APIs RESTful** completas
- ✅ **Autenticación JWT** con roles (cliente/vendedor/admin)
- ✅ **Base de datos PostgreSQL** con triggers, funciones y stored procedures
- ✅ **Validación de datos** con express-validator
- ✅ **Manejo de archivos** con Multer
- ✅ **Integración AWS S3** para almacenamiento de imágenes
- ✅ **Carrito de compras persistente** en base de datos
- ✅ **Sistema de ventas** completo con detalles
- ✅ **Estadísticas y reportes** para vendedores

## 🛠️ Tecnologías

- **Node.js** + **Express**
- **PostgreSQL** con triggers y stored procedures
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **Multer** para manejo de archivos
- **AWS SDK** para S3
- **express-validator** para validación

## 📦 Instalación

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `backend` basándote en `.env.example`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tienda_productos
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_secret_key_super_segura
JWT_EXPIRES_IN=7d

AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=tu-bucket-name

CORS_ORIGIN=http://localhost:5500
```

### 3. Crear base de datos PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE tienda_productos;

# Salir
\q
```

### 4. Ejecutar migraciones

```bash
npm run migrate
```

O manualmente:

```bash
psql -U postgres -d tienda_productos -f ../database/schema-postgresql.sql
```

### 5. Iniciar servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

El servidor estará disponible en `http://localhost:3000`

## 📚 Estructura del Proyecto

```
backend/
├── config/
│   ├── database.js      # Configuración de PostgreSQL
│   └── aws.js           # Configuración de AWS S3
├── controllers/
│   ├── authController.js
│   ├── productosController.js
│   ├── clientesController.js
│   ├── ventasController.js
│   ├── carritoController.js
│   └── estadisticasController.js
├── middleware/
│   ├── auth.js          # Middleware de autenticación JWT
│   ├── validation.js     # Validación de datos
│   └── upload.js        # Manejo de archivos
├── routes/
│   ├── auth.js
│   ├── productos.js
│   ├── clientes.js
│   ├── ventas.js
│   ├── carrito.js
│   └── estadisticas.js
├── scripts/
│   └── migrate.js       # Script de migración
├── server.js            # Servidor principal
└── package.json
```

## 🔌 Endpoints de la API

### Autenticación

- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (requiere auth)

### Productos

- `GET /api/productos` - Listar productos (público)
- `GET /api/productos/:id` - Obtener producto (público)
- `POST /api/productos` - Crear producto (vendedor/admin)
- `PUT /api/productos/:id` - Actualizar producto (vendedor/admin)
- `DELETE /api/productos/:id` - Eliminar producto (vendedor/admin)

### Carrito

- `GET /api/carrito` - Obtener carrito (cliente)
- `POST /api/carrito` - Agregar al carrito (cliente)
- `PUT /api/carrito/:id_producto` - Actualizar cantidad (cliente)
- `DELETE /api/carrito/:id_producto` - Eliminar del carrito (cliente)
- `DELETE /api/carrito` - Vaciar carrito (cliente)

### Ventas

- `GET /api/ventas` - Listar ventas
- `GET /api/ventas/:id` - Obtener venta con detalles
- `POST /api/ventas` - Crear venta
- `PUT /api/ventas/:id/cancelar` - Cancelar venta

### Clientes

- `GET /api/clientes` - Listar clientes (vendedor/admin)
- `GET /api/clientes/:id` - Obtener cliente
- `PUT /api/clientes/:id` - Actualizar cliente

### Estadísticas

- `GET /api/estadisticas` - Estadísticas completas (vendedor/admin)
- `GET /api/estadisticas/resumen` - Resumen general (vendedor/admin)

## 🔐 Autenticación

Todas las rutas protegidas requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

Los tokens se obtienen al hacer login o registro.

## 🗄️ Base de Datos

### Tablas principales

- `usuarios` - Usuarios del sistema
- `clientes` - Información de clientes
- `productos` - Catálogo de productos
- `carrito` - Carrito de compras persistente
- `ventas` - Registro de ventas
- `detalle_venta` - Detalles de cada venta

### Triggers y Funciones

- **Triggers automáticos** para actualizar fechas
- **Cálculo automático** del total de ventas
- **Actualización de stock** al realizar ventas
- **Restauración de stock** al cancelar ventas

### Stored Procedures

- `crear_venta_completa()` - Crea una venta con todos sus detalles
- `obtener_estadisticas_ventas()` - Obtiene estadísticas de ventas

## 🧪 Testing

Para probar los endpoints, puedes usar:

- **Postman**
- **Thunder Client** (VS Code)
- **curl**
- **Frontend** integrado

## 📝 Notas

- Las contraseñas se hashean con bcrypt antes de guardarse
- Los productos eliminados se marcan como inactivos (soft delete)
- El carrito se limpia automáticamente al completar una venta
- Las imágenes se pueden subir a AWS S3 o guardarse localmente

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

Verifica que PostgreSQL esté corriendo y las credenciales en `.env` sean correctas.

### Error de CORS

Asegúrate de que `CORS_ORIGIN` en `.env` coincida con la URL del frontend.

### Error de JWT

Verifica que `JWT_SECRET` esté configurado en `.env`.

## 📄 Licencia

Este proyecto es parte de un laboratorio académico.

