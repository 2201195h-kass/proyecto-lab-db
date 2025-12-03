import express from 'express';
import {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} from '../controllers/productosController.js';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth.js';
import { validateProducto } from '../middleware/validation.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', optionalAuth, obtenerProductos);
router.get('/:id', optionalAuth, obtenerProducto);

// Rutas protegidas (solo vendedores y admin)
router.post('/', authenticateToken, authorizeRoles('vendedor', 'admin'), uploadSingle, validateProducto, crearProducto);
router.put('/:id', authenticateToken, authorizeRoles('vendedor', 'admin'), uploadSingle, actualizarProducto);
router.delete('/:id', authenticateToken, authorizeRoles('vendedor', 'admin'), eliminarProducto);

export default router;

