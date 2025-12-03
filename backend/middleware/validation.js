import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validaciones para registro de usuario
export const validateRegister = [
  body('nombre_usuario')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Correo electrónico inválido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('rol')
    .optional()
    .isIn(['cliente', 'vendedor', 'admin'])
    .withMessage('Rol inválido'),
  handleValidationErrors,
];

// Validaciones para login
export const validateLogin = [
  body('correo')
    .isEmail()
    .normalizeEmail()
    .withMessage('Correo electrónico inválido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
  handleValidationErrors,
];

// Validaciones para productos
export const validateProducto = [
  body('nombre_producto')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del producto es requerido (máx 100 caracteres)'),
  body('tipo_producto')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('El tipo de producto es requerido'),
  body('precio')
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un número positivo'),
  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un número entero positivo'),
  handleValidationErrors,
];

// Validaciones para cliente
export const validateCliente = [
  body('nombre_cliente')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del cliente es requerido'),
  body('correo')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Correo electrónico inválido'),
  body('telefono')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Teléfono inválido'),
  handleValidationErrors,
];

// Validaciones para venta
export const validateVenta = [
  body('id_cliente')
    .isInt({ min: 1 })
    .withMessage('ID de cliente inválido'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('Debe incluir al menos un producto'),
  body('items.*.id_producto')
    .isInt({ min: 1 })
    .withMessage('ID de producto inválido'),
  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser mayor a 0'),
  body('items.*.precio_unitario')
    .isFloat({ min: 0 })
    .withMessage('El precio unitario debe ser positivo'),
  handleValidationErrors,
];

