import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import productosRoutes from './routes/productos.js';
import clientesRoutes from './routes/clientes.js';
import ventasRoutes from './routes/ventas.js';
import carritoRoutes from './routes/carrito.js';
import estadisticasRoutes from './routes/estadisticas.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware CORS - Configurado para producción y desarrollo
app.use(cors({
  origin: function (origin, callback) {
    // Permitir sin origen (peticiones desde Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:5500'];
    
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:5500', 'http://localhost:8080');
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test de conexión a la base de datos
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].now
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message
    });
  }
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/carrito', carritoRoutes);
app.use('/api/estadisticas', estadisticasRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Escuchar en todas las interfaces para producción, localhost para desarrollo
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Servidor en modo producción`);
  }
});

