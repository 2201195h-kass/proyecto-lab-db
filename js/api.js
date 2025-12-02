// js/api.js
// Capa de API para hablar con el backend.
// Por ahora usamos MOCK (datos de prueba). Luego tu amigo solo cambia USE_MOCK a false
// y rellena las partes de fetch().

const USE_MOCK = true;

// ---------------------------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------------------------

function obtenerProductosMock() {
  // Simula la tabla "productos"
  return [
    {
      id_producto: 1,
      nombre_producto: "Jugo Verde Detox",
      tipo_producto: "líquido",
      descripcion: "Mezcla de frutas y verduras ideal para desintoxicar.",
      precio: 45.0
    },
    {
      id_producto: 2,
      nombre_producto: "Smoothie de Fresa",
      tipo_producto: "líquido",
      descripcion: "Bebida cremosa a base de fresa y yogurt.",
      precio: 40.0
    },
    {
      id_producto: 3,
      nombre_producto: "Proteína en Polvo Vainilla",
      tipo_producto: "polvo",
      descripcion: "Suplemento de proteína sabor vainilla, ideal para batidos.",
      precio: 320.0
    },
    {
      id_producto: 4,
      nombre_producto: "Mix de Frutas Deshidratadas",
      tipo_producto: "otro",
      descripcion: "Botana saludable con variedad de frutas deshidratadas.",
      precio: 80.0
    }
  ];
}

// Esta es la FUNCIÓN que usará el frontend SIEMPRE.
async function obtenerProductos() {
  if (USE_MOCK) {
    return obtenerProductosMock();
  }

  // Versión real (tu amigo la usará con PHP)
  const res = await fetch("/api/productos.php");
  if (!res.ok) {
    throw new Error("Error al obtener productos");
  }
  return await res.json(); // debe regresar un arreglo como el mock
}

// ---------------------------------------------------------------------------
// VENTAS
// ---------------------------------------------------------------------------

// Esta función será llamada al confirmar compra.
// datosVenta tendrá esta forma:
// {
//   cliente: { nombre, direccion, telefono, correo },
//   carrito: [ { id_producto, nombre, precio, cantidad } ]
// }
async function registrarVenta(datosVenta) {
  if (USE_MOCK) {
    console.log("Simulando envío de venta al backend:", datosVenta);
    // Simulamos que se creó la venta con id 123
    return { ok: true, id_venta: 123 };
  }

  // Versión real con backend
  const res = await fetch("/api/ventas.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(datosVenta)
  });

  if (!res.ok) {
    throw new Error("Error al registrar venta");
  }

  // Esperamos algo como { ok: true, id_venta: 5 }
  return await res.json();
}

// ---------------------------------------------------------------------------
// CLIENTES y VENTAS (para el panel vendedor) - preparados para el futuro
// ---------------------------------------------------------------------------

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

  const res = await fetch("/api/clientes.php");
  if (!res.ok) throw new Error("Error al obtener clientes");
  return await res.json();
}

async function obtenerVentas() {
  if (USE_MOCK) {
    return [
      {
        id_venta: 1,
        fecha_venta: "2025-12-01",
        cliente: "Ana López",
        total: 85.0
      },
      {
        id_venta: 2,
        fecha_venta: "2025-12-01",
        cliente: "Luis Pérez",
        total: 320.0
      }
    ];
  }

  const res = await fetch("/api/ventas.php");
  if (!res.ok) throw new Error("Error al obtener ventas");
  return await res.json();
}