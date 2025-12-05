# 🛍️ Sistema de Ventas Fullstack - Tienda de Productos Saludables

Aplicación web completa Fullstack desarrollada con Node.js, Express, PostgreSQL y JavaScript vanilla.

## 📋 Características Principales

### Backend
- ✅ **APIs RESTful** completas con Node.js y Express
- ✅ **Autenticación JWT** con roles (cliente/vendedor/admin)
- ✅ **Base de datos PostgreSQL** con:
  - Triggers automáticos
  - Funciones almacenadas (stored procedures)
  - Constraints y validaciones
  - Índices optimizados
- ✅ **Validación de datos** con express-validator
- ✅ **Manejo de archivos** con Multer
- ✅ **Integración AWS S3** para almacenamiento de imágenes
- ✅ **Carrito de compras persistente** en base de datos
- ✅ **Sistema de ventas** completo con transacciones
- ✅ **Estadísticas y reportes** para vendedores

### Frontend
- ✅ **Diseño responsive** y moderno
- ✅ **Manejo de estados complejos** con JavaScript vanilla
- ✅ **Autenticación** integrada
- ✅ **Carrito de compras** persistente
- ✅ **Vista cliente** para compras
- ✅ **Vista vendedor** para administración

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

### 1. Clonar e instalar dependencias

```bash
cd proyecto-lab-db/backend
npm install
```

### 2. Configurar base de datos

```bash
# Crear base de datos PostgreSQL
createdb tienda_productos

# O usando psql
psql -U postgres
CREATE DATABASE tienda_productos;
\q
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en `backend/`:

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tienda_productos
DB_USER=postgres
DB_PASSWORD=tu_password

JWT_SECRET=tu_secret_key_super_segura_cambiar_en_produccion
JWT_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:5500
```

### 4. Ejecutar migraciones

```bash
cd backend
npm run migrate
```

O manualmente:

```bash
psql -U postgres -d tienda_productos -f ../database/schema-postgresql.sql
```

### 5. Iniciar servidor backend

```bash
cd backend
npm run dev
```

El servidor estará en `http://localhost:3000`

### 6. Abrir frontend

Abre `index.html` en un servidor local (Live Server, Python http.server, etc.) o directamente en el navegador.

**Nota:** Si usas Live Server en VS Code, asegúrate de que `CORS_ORIGIN` en `.env` coincida con la URL del servidor (normalmente `http://127.0.0.1:5500`).

## 📁 Estructura del Proyecto

```
proyecto-lab-db/
├── backend/                 # Backend Node.js + Express
│   ├── config/             # Configuración (DB, AWS)
│   ├── controllers/        # Controladores de la API
│   ├── middleware/         # Middleware (auth, validation, upload)
│   ├── routes/             # Rutas de la API
│   ├── scripts/            # Scripts de migración
│   └── server.js           # Servidor principal
├── database/               # Scripts SQL
│   ├── schema-postgresql.sql  # Esquema completo PostgreSQL
│   └── tablas.sql          # Solo definiciones de tablas
├── js/                     # Frontend JavaScript
│   ├── api.js              # Cliente API
│   ├── auth.js             # Manejo de autenticación
│   └── app.js              # Lógica principal
├── css/                    # Estilos
├── index.html              # Página principal
└── README.md               # Este archivo
```

## 🔌 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil

### Productos
- `GET /api/productos` - Listar productos
- `GET /api/productos/:id` - Obtener producto
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

El sistema usa JWT (JSON Web Tokens) para autenticación. Los tokens se envían en el header:

```
Authorization: Bearer <token>
```

### Roles
- **cliente**: Puede comprar productos y ver sus propias ventas
- **vendedor**: Puede gestionar productos y ver todas las ventas
- **admin**: Acceso completo al sistema

## 🗄️ Base de Datos

### Tablas principales

1. **usuarios** - Usuarios del sistema
2. **clientes** - Información de clientes
3. **productos** - Catálogo de productos
4. **carrito** - Carrito de compras persistente
5. **ventas** - Registro de ventas
6. **detalle_venta** - Detalles de cada venta

### Características avanzadas

- **Triggers automáticos** para actualizar fechas y calcular totales
- **Stored procedures** para operaciones complejas
- **Validaciones** a nivel de base de datos
- **Índices** para optimizar consultas

## 🧪 Testing

### Probar endpoints con curl

```bash
# Health check
curl http://localhost:3000/api/health

# Registrar usuario
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre_usuario":"Test","correo":"test@test.com","password":"123456"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"test@test.com","password":"123456"}'

# Obtener productos (requiere token)
curl http://localhost:3000/api/productos \
  -H "Authorization: Bearer <token>"
```

## 📝 Notas Importantes

1. **Contraseñas**: Se hashean con bcrypt antes de guardarse
2. **Productos**: Los eliminados se marcan como inactivos (soft delete)
3. **Carrito**: Se limpia automáticamente al completar una venta
4. **Stock**: Se actualiza automáticamente al realizar ventas
5. **CORS**: Configurado para desarrollo local

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en `.env`

### Error de CORS
- Asegúrate de que `CORS_ORIGIN` coincida con la URL del frontend
- Verifica que el frontend esté en un servidor (no `file://`)

### Error 401/403
- Verifica que el token JWT sea válido
- Asegúrate de estar autenticado para rutas protegidas

### Error al crear venta
- Verifica que el carrito no esté vacío
- Asegúrate de que haya stock suficiente
- Revisa que el cliente exista

## 📄 Licencia

Este proyecto es parte de un laboratorio académico.

## 👥 Autores

Desarrollado como proyecto Fullstack para laboratorio de bases de datos.
