# 🔧 Configuración Inicial

## Crear archivo .env

El archivo `.env` contiene las variables de entorno necesarias para el proyecto. Para crearlo:

### Opción 1: Usar el script automático (recomendado)

```bash
cd backend
npm run create-env
```

### Opción 2: Crear manualmente

Crea un archivo llamado `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Base de datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tienda_productos
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
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

### Opción 3: Copiar desde ejemplo

```bash
cd backend
cp .env.example .env
# Luego edita .env con tus valores
```

## ⚙️ Configuración de Variables

### Variables Requeridas

- **DB_PASSWORD**: Contraseña de tu usuario de PostgreSQL
- **JWT_SECRET**: Clave secreta para firmar los tokens JWT (cambiar en producción)

### Variables Opcionales

- **AWS_*****: Solo si vas a usar AWS S3 para almacenar imágenes
- **CORS_ORIGIN**: URL donde está corriendo tu frontend (por defecto: `http://localhost:5500`)

## 📝 Notas

- El archivo `.env` está en `.gitignore` y no se subirá al repositorio
- Nunca compartas tu archivo `.env` públicamente
- En producción, usa variables de entorno del servidor en lugar de archivo `.env`

