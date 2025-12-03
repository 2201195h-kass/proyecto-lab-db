import express from 'express';
import {
  obtenerEstadisticas,
  obtenerResumen
} from '../controllers/estadisticasController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

router.get('/', authorizeRoles('vendedor', 'admin'), obtenerEstadisticas);
router.get('/resumen', authorizeRoles('vendedor', 'admin'), obtenerResumen);

export default router;

