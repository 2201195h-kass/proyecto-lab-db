import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Configuración del servidor
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
`;

const envPath = path.join(__dirname, '../.env');

try {
  // Verificar si el archivo ya existe
  if (fs.existsSync(envPath)) {
    console.log('⚠️  El archivo .env ya existe. No se sobrescribirá.');
    console.log('   Si deseas recrearlo, elimínalo primero.');
  } else {
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ Archivo .env creado exitosamente en backend/.env');
    console.log('');
    console.log('📝 IMPORTANTE: Revisa y actualiza los siguientes valores:');
    console.log('   - DB_PASSWORD: Tu contraseña de PostgreSQL');
    console.log('   - JWT_SECRET: Cambia por una clave segura en producción');
    console.log('   - CORS_ORIGIN: Ajusta según la URL de tu frontend');
  }
} catch (error) {
  console.error('❌ Error al crear archivo .env:', error.message);
  process.exit(1);
}

