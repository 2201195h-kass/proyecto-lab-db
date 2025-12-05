// js/app.js

let carrito = [];
let carritoCargado = false;

function formatearPrecio(valor) {
  return `$${valor.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// CLIENTE: productos + carrito
// ---------------------------------------------------------------------------

async function renderProductos() {
  const contenedor = document.getElementById("lista-productos");
  try {
    const productos = await obtenerProductos();

    contenedor.innerHTML = productos
      .map((p) => {
        const stockInfo = p.stock !== undefined ? `<span class="stock">Stock: ${p.stock}</span>` : '';
        const imagen = p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre_producto}" class="producto-imagen">` : '';
        return `
        <article class="card-producto">
          ${imagen}
          <h3>${p.nombre_producto}</h3>
          <p class="tipo">${p.tipo_producto}</p>
          <p>${p.descripcion}</p>
          ${stockInfo}
          <p class="precio">${formatearPrecio(p.precio)}</p>
          <div class="card-footer">
            <button class="btn-small" onclick="agregarAlCarritoFrontend(${p.id_producto})" 
                    ${p.stock !== undefined && p.stock === 0 ? 'disabled' : ''}>
              ${p.stock !== undefined && p.stock === 0 ? 'Sin stock' : 'Agregar'}
            </button>
          </div>
        </article>
      `;
      })
      .join("");
  } catch (error) {
    console.error('Error al cargar productos:', error);
    contenedor.innerHTML = '<p>Error al cargar productos. Por favor, recarga la página.</p>';
  }
}

async function cargarCarritoDesdeAPI() {
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    return;
  }

  try {
    const items = await obtenerCarrito();
    carrito = items.map(item => ({
      id_producto: item.id_producto,
      nombre: item.nombre_producto,
      precio: parseFloat(item.precio_actual || item.precio),
      cantidad: item.cantidad
    }));
    carritoCargado = true;
    renderCarrito();
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    carritoCargado = true; // Marcar como cargado para evitar loops
  }
}

async function agregarAlCarrito(idProducto) {
  // Verificar autenticación
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    alert('Por favor, inicia sesión para agregar productos al carrito');
    return;
  }

  try {
    // Usar la función del módulo api.js
    await agregarAlCarrito(idProducto, 1);
    
    // Recargar carrito desde API
    await cargarCarritoDesdeAPI();
  } catch (error) {
    alert('Error al agregar al carrito: ' + error.message);
  }
}

async function quitarDelCarrito(idProducto) {
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    carrito = carrito.filter((item) => item.id_producto !== idProducto);
    renderCarrito();
    return;
  }

  try {
    await eliminarDelCarrito(idProducto);
    await cargarCarritoDesdeAPI();
  } catch (error) {
    alert('Error al eliminar del carrito: ' + error.message);
  }
}

async function cambiarCantidad(idProducto, delta) {
  const item = carrito.find((i) => i.id_producto === idProducto);
  if (!item) return;

  const nuevaCantidad = item.cantidad + delta;
  
  if (nuevaCantidad <= 0) {
    await quitarDelCarrito(idProducto);
    return;
  }

  if (window.estaAutenticado && window.estaAutenticado()) {
    try {
      await actualizarCantidadCarrito(idProducto, nuevaCantidad);
      await cargarCarritoDesdeAPI();
    } catch (error) {
      alert('Error al actualizar cantidad: ' + error.message);
    }
  } else {
    item.cantidad = nuevaCantidad;
    renderCarrito();
  }
}

function renderCarrito() {
  const contenedor = document.getElementById("lista-carrito");
  const totalSpan = document.getElementById("total-carrito");

  if (carrito.length === 0) {
    contenedor.innerHTML = `<p class="carrito-vacio">Tu carrito está vacío.</p>`;
    totalSpan.textContent = "$0.00";
    return;
  }

  let total = 0;

  contenedor.innerHTML = carrito
    .map((item) => {
      const subtotal = item.precio * item.cantidad;
      total += subtotal;

      return `
      <div class="carrito-item">
        <div>
          <span><strong>${item.nombre}</strong></span>
          <span>x${item.cantidad}</span>
          <span>${formatearPrecio(subtotal)}</span>
        </div>
        <div>
          <button class="btn-small" onclick="cambiarCantidad(${item.id_producto}, -1)">-</button>
          <button class="btn-small" onclick="cambiarCantidad(${item.id_producto}, 1)">+</button>
          <button class="btn-small" onclick="quitarDelCarrito(${item.id_producto})">X</button>
        </div>
      </div>
    `;
    })
    .join("");

  totalSpan.textContent = formatearPrecio(total);
}

async function vaciarCarrito() {
  if (window.estaAutenticado && window.estaAutenticado()) {
    try {
      await vaciarCarritoAPI();
      carrito = [];
      renderCarrito();
    } catch (error) {
      alert('Error al vaciar carrito: ' + error.message);
    }
  } else {
    carrito = [];
    renderCarrito();
  }
}

async function manejarFormularioCliente(event) {
  event.preventDefault();

  // Verificar autenticación
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    alert('Por favor, inicia sesión para realizar una compra');
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();

  if (carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }

  if (!nombre) {
    alert("Por favor, ingresa tu nombre.");
    return;
  }

  const datos = {
    cliente: { nombre, direccion, telefono, correo },
    carrito: carrito
  };

  try {
    const respuesta = await registrarVenta(datos);
    console.log("Respuesta backend:", respuesta);

    alert(`¡Compra registrada exitosamente! ID de venta: ${respuesta.id_venta || respuesta.venta?.id_venta || 'N/A'}`);

    await vaciarCarrito();
    document.getElementById("form-cliente").reset();
    
    // Recargar ventas si estamos en vista vendedor
    if (document.getElementById("vista-vendedor") && !document.getElementById("vista-vendedor").classList.contains("hidden")) {
      await renderVentas();
    }
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al registrar la compra: " + err.message);
  }
}

// ---------------------------------------------------------------------------
// INICIALIZACIÓN: un solo DOMContentLoaded
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// VENDEDOR: renderizado de datos
// ---------------------------------------------------------------------------

async function renderVentas() {
  try {
    const ventas = await obtenerVentas();
    const tbody = document.getElementById("tabla-ventas");
    if (!tbody) return;

    tbody.innerHTML = ventas
      .map((v) => {
        const fecha = new Date(v.fecha_venta).toLocaleDateString();
        return `
        <tr>
          <td>${v.id_venta}</td>
          <td>${fecha}</td>
          <td>${v.nombre_cliente || 'N/A'}</td>
          <td>${formatearPrecio(parseFloat(v.total))}</td>
          <td><button class="btn-small" onclick="verDetalleVenta(${v.id_venta})">Ver</button></td>
        </tr>
      `;
      })
      .join("");
  } catch (error) {
    console.error('Error al cargar ventas:', error);
  }
}

async function renderClientes() {
  try {
    const clientes = await obtenerClientes();
    const tbody = document.getElementById("tabla-clientes");
    if (!tbody) return;

    tbody.innerHTML = clientes
      .map((c) => {
        return `
        <tr>
          <td>${c.id_cliente}</td>
          <td>${c.nombre_cliente}</td>
          <td>${c.telefono || 'N/A'}</td>
          <td>${c.correo || c.correo_usuario || 'N/A'}</td>
        </tr>
      `;
      })
      .join("");
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
}

async function renderResumen() {
  try {
    const resumen = await obtenerResumen();
    const cards = document.querySelectorAll('.card-resumen');
    
    if (cards.length >= 3) {
      cards[0].querySelector('strong').textContent = formatearPrecio(resumen.ventas_hoy.ingresos);
      cards[1].querySelector('strong').textContent = resumen.clientes_registrados;
      cards[2].querySelector('strong').textContent = resumen.productos_activos;
    }
  } catch (error) {
    console.error('Error al cargar resumen:', error);
  }
}

async function verDetalleVenta(id) {
  try {
    const venta = await obtenerVenta(id);
    alert(`Venta #${venta.id_venta}\nCliente: ${venta.nombre_cliente}\nTotal: ${formatearPrecio(venta.total)}\nFecha: ${new Date(venta.fecha_venta).toLocaleString()}`);
  } catch (error) {
    alert('Error al obtener detalle de venta: ' + error.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // CLIENTE
  await renderProductos();
  
  // Cargar carrito si está autenticado
  if (window.estaAutenticado && window.estaAutenticado()) {
    await cargarCarritoDesdeAPI();
  } else {
    renderCarrito();
  }

  document
    .getElementById("btn-vaciar")
    .addEventListener("click", vaciarCarrito);
  document
    .getElementById("form-cliente")
    .addEventListener("submit", manejarFormularioCliente);

  // SWITCH ENTRE VISTA CLIENTE / VENDEDOR
  const btnCliente = document.getElementById("btn-vista-cliente");
  const btnVendedor = document.getElementById("btn-vista-vendedor");

  const vistaCliente = document.getElementById("vista-cliente");
  const datosCliente = document.getElementById("cliente-datos");
  const vistaVendedor = document.getElementById("vista-vendedor");

  function mostrarCliente() {
    btnCliente.classList.add("active");
    btnVendedor.classList.remove("active");

    vistaCliente.classList.remove("hidden");
    datosCliente.classList.remove("hidden");
    vistaVendedor.classList.add("hidden");
  }

  function mostrarVendedor() {
    btnCliente.classList.remove("active");
    btnVendedor.classList.add("active");

    vistaCliente.classList.add("hidden");
    datosCliente.classList.add("hidden");
    vistaVendedor.classList.remove("hidden");
  }

  btnCliente.addEventListener("click", mostrarCliente);
  btnVendedor.addEventListener("click", mostrarVendedor);

  // MENÚ LATERAL DEL PANEL VENDEDOR
  const menuItems = document.querySelectorAll(".menu-item");
  const sections = document.querySelectorAll(".panel-section");

  menuItems.forEach((item) => {
    item.addEventListener("click", async () => {
      const id = item.getAttribute("data-section");

      menuItems.forEach((m) => m.classList.remove("activo"));
      item.classList.add("activo");

      sections.forEach((sec) => {
        if (sec.id === id) {
          sec.classList.remove("hidden");
          // Cargar datos cuando se muestra la sección
          if (id === 'sec-ventas') {
            renderVentas();
          } else if (id === 'sec-clientes') {
            renderClientes();
          } else if (id === 'sec-resumen') {
            renderResumen();
          } else if (id === 'sec-productos') {
            renderProductos();
          }
        } else {
          sec.classList.add("hidden");
        }
      });
    });
  });

  // Cargar resumen inicial si estamos en vista vendedor
  if (document.getElementById("vista-vendedor") && 
      !document.getElementById("vista-vendedor").classList.contains("hidden")) {
    await renderResumen();
    await renderVentas();
    await renderClientes();
  }
});

// Exportar funciones globales
window.verDetalleVenta = verDetalleVenta;
window.agregarAlCarritoFrontend = agregarAlCarritoFrontend;
