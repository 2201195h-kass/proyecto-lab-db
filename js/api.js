// js/api.js
// Capa de API para hablar con el backend Node.js + Express

const API_BASE_URL = 'http://localhost:3000/api';
const USE_MOCK = false; // Cambiar a false para usar backend real

// ============================================================================
// UTILIDADES
// ============================================================================

function getAuthToken() {
  return localStorage.getItem('authToken');
}

function getAuthHeaders() {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
}

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
    // Verificar que el token esté disponible antes de hacer la petición
    const token = getAuthToken();
    if (!token && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      console.warn('No hay token disponible para:', endpoint);
    }
    
    const response = await fetch(url, config);
    
    // Si no está autorizado, limpiar token y redirigir
    if (response.status === 401) {
      console.error('Error 401: Token inválido o expirado');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      if (window.eliminarUsuario) window.eliminarUsuario();
      throw new Error('Token de acceso requerido. Por favor, inicia sesión nuevamente.');
    }
    
    if (response.status === 403) {
      console.error('Error 403: Sin permisos');
      const error = await response.json().catch(() => ({ error: 'No tienes permisos para esta acción' }));
      throw new Error(error.error || 'No tienes permisos para esta acción');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error desconocido' }));
      throw new Error(error.error || `Error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    console.error('URL intentada:', url);
    
    // Mejorar mensajes de error
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error(`No se puede conectar con el backend en ${API_BASE_URL}. Verifica que el servidor esté corriendo.`);
    }
    
    throw error;
  }
}

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

async function registrarUsuario(datos) {
  if (USE_MOCK) {
    console.log('Simulando registro:', datos);
    return { token: 'mock_token', user: { ...datos, id_usuario: 1 } };
  }

  return await fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

async function iniciarSesion(correo, password) {
  if (USE_MOCK) {
    console.log('Simulando login:', correo);
    return { 
      token: 'mock_token', 
      user: { id_usuario: 1, correo, rol: 'cliente' } 
    };
  }

  return await fetchAPI('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ correo, password })
  });
}

async function obtenerPerfil() {
  if (USE_MOCK) {
    return { id_usuario: 1, nombre_usuario: 'Usuario Mock', rol: 'cliente' };
  }

  return await fetchAPI('/auth/profile');
}

function cerrarSesion() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.reload();
}

// ============================================================================
// PRODUCTOS
// ============================================================================

function obtenerProductosMock() {
  return [
    {
      id_producto: 1,
      nombre_producto: "Jugo Verde Detox",
      tipo_producto: "líquido",
      descripcion: "Mezcla de frutas y verduras ideal para desintoxicar. Rico en antioxidantes y vitaminas.",
      precio: 45.0,
      stock: 50
    },
    {
      id_producto: 2,
      nombre_producto: "Smoothie de Fresa",
      tipo_producto: "líquido",
      descripcion: "Bebida cremosa a base de fresa y yogurt natural. Fuente de probióticos.",
      precio: 40.0,
      stock: 30
    },
    {
      id_producto: 3,
      nombre_producto: "Smoothie Tropical",
      tipo_producto: "líquido",
      descripcion: "Combinación de piña, mango y coco. Energía natural y refrescante.",
      precio: 42.0,
      stock: 35
    },
    {
      id_producto: 4,
      nombre_producto: "Proteína en Polvo Vainilla",
      tipo_producto: "polvo",
      descripcion: "Suplemento de proteína sabor vainilla, ideal para batidos post-entrenamiento.",
      precio: 320.0,
      stock: 20
    },
    {
      id_producto: 5,
      nombre_producto: "Proteína en Polvo Chocolate",
      tipo_producto: "polvo",
      descripcion: "Proteína vegana sabor chocolate. Sin lactosa ni gluten.",
      precio: 325.0,
      stock: 18
    },
    {
      id_producto: 6,
      nombre_producto: "Mix de Frutas Deshidratadas",
      tipo_producto: "otro",
      descripcion: "Botana saludable con variedad de frutas deshidratadas. Sin azúcar añadida.",
      precio: 80.0,
      stock: 40
    },
    {
      id_producto: 7,
      nombre_producto: "Nueces y Almendras Orgánicas",
      tipo_producto: "otro",
      descripcion: "Mezcla premium de nueces y almendras orgánicas. Fuente de grasas saludables.",
      precio: 120.0,
      stock: 30
    },
    {
      id_producto: 8,
      nombre_producto: "Té Verde Orgánico",
      tipo_producto: "líquido",
      descripcion: "Té verde premium con propiedades antioxidantes. Envase de 20 bolsitas.",
      precio: 65.0,
      stock: 35
    },
    {
      id_producto: 9,
      nombre_producto: "Aceite de Coco Virgen",
      tipo_producto: "líquido",
      descripcion: "Aceite de coco extra virgen prensado en frío. 500ml.",
      precio: 95.0,
      stock: 28
    },
    {
      id_producto: 10,
      nombre_producto: "Miel de Abeja Pura",
      tipo_producto: "líquido",
      descripcion: "Miel 100% natural sin procesar. Envase de 500g.",
      precio: 85.0,
      stock: 30
    }
  ];
}

async function obtenerProductos() {
  if (USE_MOCK) {
    return obtenerProductosMock();
  }

  return await fetchAPI('/productos');
}

async function obtenerProducto(id) {
  if (USE_MOCK) {
    const productos = obtenerProductosMock();
    return productos.find(p => p.id_producto === id);
  }

  return await fetchAPI(`/productos/${id}`);
}

async function actualizarProducto(id, datos) {
  if (USE_MOCK) {
    console.log('Simulando actualizar producto:', id, datos);
    return { message: 'Producto actualizado' };
  }

  return await fetchAPI(`/productos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  });
}

// ============================================================================
// CARRITO
// ============================================================================

async function obtenerCarrito() {
  if (USE_MOCK) {
    return [];
  }

  return await fetchAPI('/carrito');
}

async function agregarAlCarrito(id_producto, cantidad = 1) {
  if (USE_MOCK) {
    console.log('Simulando agregar al carrito:', id_producto, cantidad);
    return { message: 'Producto agregado al carrito' };
  }

  return await fetchAPI('/carrito', {
    method: 'POST',
    body: JSON.stringify({ id_producto, cantidad })
  });
}

async function actualizarCantidadCarrito(id_producto, cantidad) {
  if (USE_MOCK) {
    console.log('Simulando actualizar cantidad:', id_producto, cantidad);
    return { message: 'Cantidad actualizada' };
  }

  return await fetchAPI(`/carrito/${id_producto}`, {
    method: 'PUT',
    body: JSON.stringify({ cantidad })
  });
}

async function eliminarDelCarrito(id_producto) {
  if (USE_MOCK) {
    console.log('Simulando eliminar del carrito:', id_producto);
    return { message: 'Producto eliminado del carrito' };
  }

  return await fetchAPI(`/carrito/${id_producto}`, {
    method: 'DELETE'
  });
}

async function vaciarCarritoAPI() {
  if (USE_MOCK) {
    console.log('Simulando vaciar carrito');
    return { message: 'Carrito vaciado' };
  }

  return await fetchAPI('/carrito', {
    method: 'DELETE'
  });
}

// ============================================================================
// VENTAS
// ============================================================================

async function registrarVenta(datosVenta) {
  if (USE_MOCK) {
    console.log("Simulando envío de venta al backend:", datosVenta);
    return { ok: true, id_venta: 123 };
  }

  // Preparar items para la venta
  const items = datosVenta.carrito.map(item => ({
    id_producto: item.id_producto,
    cantidad: item.cantidad,
    precio_unitario: item.precio
  }));

  // El backend manejará automáticamente la obtención/creación del cliente
  // para usuarios con rol 'cliente'
  const ventaData = {
    metodo_pago: datosVenta.metodo_pago || 'efectivo',
    items,
    // Incluir datos del cliente para que el backend pueda crear/actualizar el registro
    cliente: datosVenta.cliente
  };

  return await fetchAPI('/ventas', {
    method: 'POST',
    body: JSON.stringify(ventaData)
  });
}

async function obtenerVentas() {
  if (USE_MOCK) {
    return [
      {
        id_venta: 1,
        fecha_venta: "2025-12-01",
        nombre_cliente: "Ana López",
        total: 85.0
      },
      {
        id_venta: 2,
        fecha_venta: "2025-12-01",
        nombre_cliente: "Luis Pérez",
        total: 320.0
      }
    ];
  }

  // Verificar autenticación
  const usuario = window.getUsuarioActual ? window.getUsuarioActual() : null;
  if (!usuario) {
    throw new Error('Debes estar autenticado para ver ventas.');
  }

  return await fetchAPI('/ventas');
}

async function obtenerVenta(id) {
  if (USE_MOCK) {
    return {
      id_venta: id,
      fecha_venta: "2025-12-01",
      nombre_cliente: "Ana López",
      total: 85.0,
      detalles: []
    };
  }

  return await fetchAPI(`/ventas/${id}`);
}

// ============================================================================
// CLIENTES
// ============================================================================

async function obtenerClientes() {
  if (USE_MOCK) {
    return [
      {
        id_cliente: 1,
        nombre_cliente: "Ana López",
        telefono: "555-123-4567",
        correo: "ana@example.com"
      },
      {
        id_cliente: 2,
        nombre_cliente: "Luis Pérez",
        telefono: "555-987-6543",
        correo: "luis@example.com"
      }
    ];
  }

  // Verificar que el usuario tenga permisos de vendedor
  const usuario = window.getUsuarioActual ? window.getUsuarioActual() : null;
  if (!usuario || (usuario.rol !== 'vendedor' && usuario.rol !== 'admin')) {
    throw new Error('No tienes permisos para ver clientes. Se requiere rol de vendedor o admin.');
  }

  return await fetchAPI('/clientes');
}

// ============================================================================
// ESTADÍSTICAS (solo vendedores/admin)
// ============================================================================

async function obtenerEstadisticas() {
  if (USE_MOCK) {
    return {
      estadisticas: {
        total_ventas: 10,
        total_ingresos: 1250.00,
        promedio_venta: 125.00,
        ventas_hoy: 3,
        ingresos_hoy: 450.00
      }
    };
  }

  return await fetchAPI('/estadisticas');
}

async function obtenerResumen() {
  if (USE_MOCK) {
    return {
      ventas_hoy: { cantidad: 3, ingresos: 450.00 },
      clientes_registrados: 24,
      productos_activos: 8
    };
  }

  return await fetchAPI('/estadisticas/resumen');
}
