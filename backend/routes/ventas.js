import express from 'express';
import {
  obtenerVentas,
  obtenerVenta,
  crearVenta,
  cancelarVenta
} from '../controllers/ventasController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateVenta } from '../middleware/validation.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', obtenerVentas);
router.get('/:id', obtenerVenta);
router.post('/', validateVenta, crearVenta);
router.put('/:id/cancelar', cancelarVenta);

export default router;

