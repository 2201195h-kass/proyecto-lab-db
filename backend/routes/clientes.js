import express from 'express';
import {
  obtenerClientes,
  obtenerCliente,
  actualizarCliente
} from '../controllers/clientesController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { validateCliente } from '../middleware/validation.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', authorizeRoles('vendedor', 'admin'), obtenerClientes);
router.get('/:id', obtenerCliente);
router.put('/:id', validateCliente, actualizarCliente);

export default router;

