import express from 'express';
import {
  obtenerCarrito,
  agregarAlCarrito,
  actualizarCantidad,
  eliminarDelCarrito,
  vaciarCarrito
} from '../controllers/carritoController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y ser cliente
router.use(authenticateToken);
router.use(authorizeRoles('cliente'));

router.get('/', obtenerCarrito);
router.post('/', agregarAlCarrito);
router.put('/:id_producto', actualizarCantidad);
router.delete('/:id_producto', eliminarDelCarrito);
router.delete('/', vaciarCarrito);

export default router;

