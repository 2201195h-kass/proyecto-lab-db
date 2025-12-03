import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  try {
    console.log('🔄 Iniciando migración de base de datos...');
    
    // Leer archivo SQL
    const sqlPath = path.join(__dirname, '../../database/schema-postgresql.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Ejecutar SQL
    await pool.query(sql);
    
    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrate();

