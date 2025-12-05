# 🚀 Guía Completa de Configuración - Sistema de Ventas Fullstack

Esta guía te llevará paso a paso para levantar todo el proyecto: base de datos PostgreSQL en Docker, backend Node.js y frontend.

---

## 📋 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Docker Desktop** (para Windows/Mac) o **Docker Engine** (para Linux)
  - Descarga: https://www.docker.com/products/docker-desktop
  - Verifica instalación: `docker --version`

- **Node.js** (v16 o superior)
  - Descarga: https://nodejs.org/
  - Verifica instalación: `node --version` y `npm --version`

- **Git** (opcional, si clonas desde repositorio)

---

## 🗄️ PASO 1: Levantar PostgreSQL con Docker

### Opción A: Usando docker-compose (Recomendado)

1. **Abre una terminal PowerShell** (Windows) o Terminal (Mac/Linux)

2. **Navega a la carpeta del proyecto:**
   ```powershell
   cd "V:\Universidad\Semestre 7\BD\LabBasesesss\proyecto-lab-db"
   ```

3. **Levanta el contenedor de PostgreSQL:**
   ```powershell
   docker-compose up -d
   ```

   Esto creará y ejecutará el contenedor en segundo plano.

4. **Verifica que esté corriendo:**
   ```powershell
      docker ps
   ```
   
   Deberías ver `tienda-postgres` en la lista.

5. **Verifica los logs (opcional):**
   ```powershell
   docker logs tienda-postgres
   ```

### Opción B: Usando comando docker directamente

Si prefieres no usar docker-compose:

```powershell
docker run -d --name tienda-postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=tienda_productos `
  -p 5432:5432 `
  -v tienda_pg_data:/var/lib/postgresql/data `
  postgres:16
```

### Verificar conexión a PostgreSQL

Puedes probar la conexión con:

```powershell
docker exec -it tienda-postgres psql -U postgres -d tienda_productos -c "SELECT version();"
```

---

## 🔧 PASO 2: Configurar el Backend

1. **Navega a la carpeta backend:**
   ```powershell
   cd backend
   ```

2. **Instala las dependencias:**
   ```powershell
   npm install
   ```

   Esto instalará todas las dependencias listadas en `package.json`.

3. **Configurar variables de entorno (OPCIONAL):**
   
   ⚠️ **IMPORTANTE:** Si usas `docker-compose.yml` con la configuración por defecto, **NO necesitas crear el archivo `.env`** para la conexión a la base de datos. El código tiene valores por defecto que coinciden con Docker.
   
   **Sin embargo, es RECOMENDABLE crear el `.env` para:**
   - Configurar un `JWT_SECRET` seguro (aunque hay un valor por defecto para desarrollo)
   - Cambiar el puerto del servidor si es necesario
   - Configurar CORS si tu frontend está en otra URL
   - Configurar AWS S3 si vas a subir imágenes
   
   **Opción A: Usar el script automático**
   ```powershell
   npm run create-env
   ```
   
   **Opción B: Crear manualmente**
   
   Crea un archivo llamado `.env` en la carpeta `backend/` con este contenido:
   
   ```env
   # Configuración del servidor
   PORT=3000
   NODE_ENV=development
   
   # Base de datos PostgreSQL (valores por defecto coinciden con docker-compose.yml)
   # Si usas docker-compose, estos valores ya están configurados por defecto
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=tienda_productos
   DB_USER=postgres
   DB_PASSWORD=postgres
   
   # JWT Secret (RECOMENDADO cambiar en producción)
   # Si no lo defines, se usará un valor por defecto (solo para desarrollo)
   JWT_SECRET=mi_secret_key_super_segura_cambiar_en_produccion_123456789
   JWT_EXPIRES_IN=7d
   
   # AWS S3 Configuration (opcional - dejar vacío si no se usa)
   AWS_ACCESS_KEY_ID=
   AWS_SECRET_ACCESS_KEY=
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=
   
   # CORS - URL del frontend
   CORS_ORIGIN=http://localhost:5500
   ```

   ⚠️ **Nota:** Si cambias el puerto de PostgreSQL en `docker-compose.yml`, entonces SÍ necesitas ajustar `DB_PORT` en el `.env`.

4. **Ejecuta las migraciones de la base de datos:**
   ```powershell
   npm run migrate
   ```
   
   Esto creará todas las tablas, triggers, funciones y stored procedures en PostgreSQL.
   
   Si hay algún error, puedes ejecutar manualmente:
   ```powershell
   docker exec -i tienda-postgres psql -U postgres -d tienda_productos < ..\database\schema-postgresql.sql
   ```

5. **Inicia el servidor backend:**
   ```powershell
   npm run dev
   ```
   
   Deberías ver:
   ```
   🚀 Servidor corriendo en http://localhost:3000
   📊 Ambiente: development
   ```

6. **Verifica que el backend esté funcionando:**
   
   Abre otra terminal y ejecuta:
   ```powershell
   curl http://localhost:3000/api/health
   ```
   
   O abre en el navegador: `http://localhost:3000/api/health`
   
   Deberías recibir una respuesta JSON con `"status": "ok"` y `"database": "connected"`.

---

## 🌐 PASO 3: Configurar y Levantar el Frontend

1. **Abre una nueva terminal** (deja el backend corriendo)

2. **Navega a la raíz del proyecto:**
   ```powershell
   cd "V:\Universidad\Semestre 7\BD\LabBasesesss\proyecto-lab-db"
   ```

3. **Servir el frontend:**
   
   **Opción A: Usando npx http-server (recomendado)**
   ```powershell
   npx http-server . -p 5500 -c-1
   ```
   
   El flag `-c-1` desactiva el cache para desarrollo.
   
   **Opción B: Usando Python (si está instalado)**
   ```powershell
   python -m http.server 5500
   ```
   
   **Opción C: Usando Live Server en VS Code**
   - Instala la extensión "Live Server" en VS Code
   - Haz clic derecho en `index.html` → "Open with Live Server"
   - Asegúrate de que la URL sea `http://localhost:5500` (o ajusta `CORS_ORIGIN` en `.env`)

4. **Abre el navegador:**
   
   Ve a: `http://localhost:5500`
   
   Deberías ver la página de la tienda.

---

## ✅ PASO 4: Probar el Sistema Completo

### 4.1. Registrar un Usuario

1. En la página web, haz clic en **"Registrarse"** en el header.

2. Completa el formulario:
   - **Nombre de usuario:** Test User
   - **Correo:** test@test.com
   - **Contraseña:** 123456
   - **Rol:** Cliente (o Vendedor si quieres probar el panel)

3. Haz clic en **"Registrarse"**.

4. Deberías ver un mensaje de éxito y quedar autenticado.

### 4.2. Agregar Productos al Carrito

1. En la vista cliente, verás el catálogo de productos.

2. Haz clic en **"Agregar"** en cualquier producto.

3. El producto debería aparecer en el carrito a la derecha.

### 4.3. Realizar una Compra

1. Agrega algunos productos al carrito.

2. Completa el formulario **"Tus datos"**:
   - Nombre: Tu nombre
   - Dirección: Tu dirección
   - Teléfono: Tu teléfono
   - Correo: Tu correo

3. Haz clic en **"Confirmar compra"**.

4. Deberías ver un mensaje de éxito con el ID de venta.

### 4.4. Ver Panel de Vendedor

1. Si te registraste como **vendedor**, haz clic en **"Vista vendedor"** en el header.

2. Verás:
   - **Resumen:** Estadísticas generales
   - **Productos:** Lista de productos
   - **Clientes:** Lista de clientes registrados
   - **Ventas:** Historial de ventas

---

## 🛠️ Comandos Útiles

### Docker

```powershell
# Ver contenedores corriendo
docker ps

# Ver logs del contenedor
docker logs tienda-postgres

# Detener el contenedor
docker stop tienda-postgres

# Iniciar el contenedor (si está detenido)
docker start tienda-postgres

# Eliminar el contenedor (¡CUIDADO! Esto borra los datos)
docker rm -f tienda-postgres

# Eliminar el contenedor y el volumen (¡CUIDADO! Esto borra TODO)
docker-compose down -v
```

### Backend

```powershell
# Iniciar en modo desarrollo (con auto-reload)
npm run dev

# Iniciar en modo producción
npm start

# Ejecutar migraciones
npm run migrate

# Crear archivo .env
npm run create-env
```

### Base de Datos

```powershell
# Conectar a PostgreSQL desde Docker
docker exec -it tienda-postgres psql -U postgres -d tienda_productos

# Ver todas las tablas
\dt

# Ver estructura de una tabla
\d nombre_tabla

# Salir de psql
\q
```

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to database"

**Causa:** PostgreSQL no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verifica que el contenedor esté corriendo: `docker ps`
2. Si no está, inícialo: `docker-compose up -d`
3. Verifica las credenciales en `backend/.env`

### Error: "Port 5432 is already in use"

**Causa:** Ya hay una instancia de PostgreSQL corriendo en el puerto 5432.

**Solución:**
1. Detén el PostgreSQL local si lo tienes instalado
2. O cambia el puerto en `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Usa 5433 en lugar de 5432
   ```
3. Actualiza `DB_PORT=5433` en `backend/.env`

### Error: "CORS policy"

**Causa:** El frontend está en una URL diferente a la configurada en `CORS_ORIGIN`.

**Solución:**
1. Verifica la URL del frontend (debería ser `http://localhost:5500`)
2. Actualiza `CORS_ORIGIN` en `backend/.env` con la URL correcta
3. Reinicia el backend

### Error: "JWT_SECRET is not defined"

**Causa:** Falta la variable `JWT_SECRET` en el `.env` (aunque ahora hay un valor por defecto).

**Solución:**
1. El código ahora tiene un valor por defecto, así que debería funcionar sin `.env`
2. Si quieres usar tu propio secret, crea el archivo `.env` con `JWT_SECRET=tu_clave_secreta`
3. Reinicia el backend

### Error: "Cannot find module"

**Causa:** Las dependencias no están instaladas.

**Solución:**
```powershell
cd backend
npm install
```

### El frontend no carga productos

**Causa:** El backend no está corriendo o hay un error de conexión.

**Solución:**
1. Verifica que el backend esté corriendo: `http://localhost:3000/api/health`
2. Abre la consola del navegador (F12) y revisa los errores
3. Verifica que `API_BASE_URL` en `js/api.js` sea `http://localhost:3000/api`

---

## 📊 Estructura del Proyecto

```
proyecto-lab-db/
├── backend/                 # Backend Node.js + Express
│   ├── config/              # Configuración (DB, AWS)
│   ├── controllers/         # Controladores de la API
│   ├── middleware/          # Middleware (auth, validation, upload)
│   ├── routes/              # Rutas de la API
│   ├── scripts/             # Scripts de migración
│   ├── server.js            # Servidor principal
│   ├── package.json         # Dependencias
│   └── .env                 # Variables de entorno (crear)
├── database/                # Scripts SQL
│   └── schema-postgresql.sql # Esquema completo
├── js/                      # Frontend JavaScript
│   ├── api.js               # Cliente API
│   ├── auth.js              # Manejo de autenticación
│   └── app.js               # Lógica principal
├── css/                     # Estilos
│   └── styles.css
├── index.html               # Página principal
├── docker-compose.yml       # Configuración Docker
└── SETUP-GUIDE.md          # Esta guía
```

---

## 🎯 Resumen de URLs

- **Frontend:** http://localhost:5500
- **Backend API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/api/health
- **PostgreSQL:** localhost:5432

---

## 📝 Notas Finales

- **Datos persistentes:** Los datos de PostgreSQL se guardan en un volumen de Docker llamado `postgres_data`. Si eliminas el contenedor sin eliminar el volumen, los datos se conservan.

- **Desarrollo vs Producción:** Esta configuración es para desarrollo. En producción, usa:
  - Variables de entorno del servidor en lugar de `.env`
  - HTTPS en lugar de HTTP
  - Un `JWT_SECRET` más seguro
  - Configuración de CORS más restrictiva

- **Backup de base de datos:**
  ```powershell
  docker exec tienda-postgres pg_dump -U postgres tienda_productos > backup.sql
  ```

- **Restaurar backup:**
  ```powershell
  docker exec -i tienda-postgres psql -U postgres tienda_productos < backup.sql
  ```

---

## 🎉 ¡Listo!

Si llegaste hasta aquí, deberías tener todo funcionando. Si encuentras algún problema, revisa la sección de "Solución de Problemas" o los logs del backend y Docker.

¡Buena suerte con tu proyecto! 🚀

