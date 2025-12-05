// js/app.js

let carrito = [];
let carritoCargado = false;

function formatearPrecio(valor) {
  // Convertir a número y manejar valores nulos/undefined
  const num = parseFloat(valor);
  if (isNaN(num)) {
    return '$0.00';
  }
  return `$${num.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// CLIENTE: productos + carrito
// ---------------------------------------------------------------------------

async function renderProductos() {
  const contenedor = document.getElementById("lista-productos");
  if (!contenedor) return;
  
  try {
    mostrarLoading(contenedor, true);
    contenedor.innerHTML = '<p>Cargando productos...</p>';
    
    const productos = await obtenerProductos();

    if (productos.length === 0) {
      contenedor.innerHTML = '<p class="sin-datos">No hay productos disponibles.</p>';
      mostrarLoading(contenedor, false);
      return;
    }

    contenedor.innerHTML = productos
      .map((p) => {
        // Asegurar que los valores numéricos sean números
        const precio = parseFloat(p.precio) || 0;
        const stock = p.stock !== undefined ? parseInt(p.stock) : undefined;
        
        const stockInfo = stock !== undefined ? `<span class="stock">Stock: ${stock}</span>` : '';
        const imagen = p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre_producto}" class="producto-imagen">` : '';
        return `
        <article class="card-producto">
          ${imagen}
          <h3>${p.nombre_producto || 'Sin nombre'}</h3>
          <p class="tipo">${p.tipo_producto || 'N/A'}</p>
          <p>${p.descripcion || ''}</p>
          ${stockInfo}
          <p class="precio">${formatearPrecio(precio)}</p>
          <div class="card-footer">
            <button class="btn-small" onclick="agregarAlCarritoFrontend(${p.id_producto})" 
                    ${stock !== undefined && stock === 0 ? 'disabled' : ''}>
              ${stock !== undefined && stock === 0 ? 'Sin stock' : 'Agregar'}
            </button>
          </div>
        </article>
      `;
      })
      .join("");
    mostrarLoading(contenedor, false);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    
    // Mensaje más detallado según el tipo de error
    let mensajeError = 'Error al cargar productos.';
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      mensajeError = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:3000';
    } else if (error.message.includes('404')) {
      mensajeError = 'Endpoint no encontrado. Verifica la configuración del backend.';
    } else {
      mensajeError = `Error: ${error.message}`;
    }
    
    contenedor.innerHTML = `<p class="error-mensaje">${mensajeError}</p>`;
    mostrarLoading(contenedor, false);
    mostrarMensaje('Error al cargar productos', 'error');
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

// Función global para usar desde onclick en HTML
async function agregarAlCarritoFrontend(idProducto) {
  // Verificar autenticación
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    mostrarMensaje('Por favor, inicia sesión para agregar productos al carrito', 'warning');
    return;
  }

  try {
    // Usar la función del módulo api.js (importada globalmente)
    await agregarAlCarrito(idProducto, 1);
    
    // Recargar carrito desde API
    await cargarCarritoDesdeAPI();
    mostrarMensaje('Producto agregado al carrito', 'success');
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    mostrarMensaje('Error al agregar al carrito: ' + error.message, 'error');
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
    mostrarMensaje('Producto eliminado del carrito', 'success');
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    mostrarMensaje('Error al eliminar del carrito: ' + error.message, 'error');
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
      console.error('Error al actualizar cantidad:', error);
      mostrarMensaje('Error al actualizar cantidad: ' + error.message, 'error');
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
      mostrarMensaje('Carrito vaciado', 'info');
    } catch (error) {
      console.error('Error al vaciar carrito:', error);
      mostrarMensaje('Error al vaciar carrito: ' + error.message, 'error');
    }
  } else {
    carrito = [];
    renderCarrito();
    mostrarMensaje('Carrito vaciado', 'info');
  }
}

async function manejarFormularioCliente(event) {
  event.preventDefault();

  // Verificar autenticación
  if (!window.estaAutenticado || !window.estaAutenticado()) {
    mostrarMensaje('Por favor, inicia sesión para realizar una compra', 'warning');
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const correo = document.getElementById("correo").value.trim();

  if (carrito.length === 0) {
    mostrarMensaje('Tu carrito está vacío. Agrega productos antes de realizar una compra.', 'info');
    return;
  }

  if (!nombre) {
    mostrarMensaje('Por favor, ingresa tu nombre para completar la compra.', 'warning');
    return;
  }

  const datos = {
    cliente: { nombre, direccion, telefono, correo },
    carrito: carrito
  };

  const btnSubmit = event.target.querySelector('button[type="submit"]');
  const btnOriginalText = btnSubmit.textContent;
  
  try {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Procesando...';
    
    const respuesta = await registrarVenta(datos);
    console.log("Respuesta backend:", respuesta);

    mostrarMensaje(`¡Compra registrada exitosamente! ID de venta: ${respuesta.id_venta || respuesta.venta?.id_venta || 'N/A'}`, 'success');

    await vaciarCarrito();
    document.getElementById("form-cliente").reset();
  } catch (err) {
    console.error(err);
    mostrarMensaje("Ocurrió un error al registrar la compra: " + err.message, 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = btnOriginalText;
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
    const tbody = document.getElementById("tabla-ventas");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
    const ventas = await obtenerVentas();

    if (ventas.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="sin-datos">No hay ventas registradas.</td></tr>';
      return;
    }

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
    const tbody = document.getElementById("tabla-ventas");
    if (tbody) {
      let mensajeError = 'Error al cargar ventas.';
      if (error.message.includes('401') || error.message.includes('autenticado')) {
        mensajeError = 'Debes estar autenticado para ver ventas.';
      } else if (error.message.includes('Failed to fetch')) {
        mensajeError = 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        mensajeError = `Error: ${error.message}`;
      }
      tbody.innerHTML = `<tr><td colspan="5" class="error-mensaje">${mensajeError}</td></tr>`;
    }
    mostrarMensaje('Error al cargar ventas: ' + error.message, 'error');
  }
}

async function renderClientes() {
  try {
    const tbody = document.getElementById("tabla-clientes");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';
    const clientes = await obtenerClientes();

    if (clientes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="sin-datos">No hay clientes registrados.</td></tr>';
      return;
    }

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
    const tbody = document.getElementById("tabla-clientes");
    if (tbody) {
      let mensajeError = 'Error al cargar clientes.';
      if (error.message.includes('permisos') || error.message.includes('403')) {
        mensajeError = 'No tienes permisos para ver clientes. Se requiere rol de vendedor o admin.';
      } else if (error.message.includes('401') || error.message.includes('autenticado')) {
        mensajeError = 'Debes estar autenticado para ver clientes.';
      } else {
        mensajeError = `Error: ${error.message}`;
      }
      tbody.innerHTML = `<tr><td colspan="4" class="error-mensaje">${mensajeError}</td></tr>`;
    }
    mostrarMensaje('Error al cargar clientes: ' + error.message, 'error');
  }
}

async function renderProductosVendedor() {
  try {
    const tbody = document.getElementById("tabla-productos");
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5">Cargando...</td></tr>';
    const productos = await obtenerProductos();

    if (productos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="sin-datos">No hay productos registrados.</td></tr>';
      return;
    }

    // Ordenar productos por ID ascendente
    productos.sort((a, b) => a.id_producto - b.id_producto);
    
    tbody.innerHTML = productos
      .map((p) => {
        const precio = parseFloat(p.precio) || 0;
        const stock = p.stock !== undefined ? parseInt(p.stock) : 'N/A';
        const activo = p.activo !== false ? 'Activo' : 'Inactivo';
        
        return `
        <tr>
          <td>${p.id_producto}</td>
          <td>${p.nombre_producto || 'Sin nombre'}</td>
          <td>${p.tipo_producto || 'N/A'}</td>
          <td>${formatearPrecio(precio)}</td>
          <td>
            <span class="stock">Stock: ${stock}</span>
            <span style="margin-left: 0.5rem; opacity: 0.7;">${activo}</span>
            <button class="btn-small" onclick="abrirModalEditarProducto(${p.id_producto})" style="margin-left: 0.5rem;">Editar</button>
          </td>
        </tr>
      `;
      })
      .join("");
  } catch (error) {
    console.error('Error al cargar productos para vendedor:', error);
    const tbody = document.getElementById("tabla-productos");
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="5" class="error-mensaje">Error al cargar productos.</td></tr>';
    }
    mostrarMensaje('Error al cargar productos', 'error');
  }
}

async function renderResumen() {
  try {
    const resumen = await obtenerResumen();
    const cards = document.querySelectorAll('.card-resumen');
    
    if (cards.length >= 3) {
      const ventasHoy = resumen.ventas_hoy?.ingresos || resumen.ventas_hoy || 0;
      const clientesRegistrados = resumen.clientes_registrados || 0;
      const productosActivos = resumen.productos_activos || 0;
      
      cards[0].querySelector('strong').textContent = formatearPrecio(ventasHoy);
      cards[1].querySelector('strong').textContent = clientesRegistrados;
      cards[2].querySelector('strong').textContent = productosActivos;
    }
  } catch (error) {
    console.error('Error al cargar resumen:', error);
    mostrarMensaje('Error al cargar resumen', 'error');
  }
}

async function verDetalleVenta(id) {
  try {
    const venta = await obtenerVenta(id);
    mostrarModalDetalleVenta(venta);
  } catch (error) {
    console.error('Error al obtener detalle de venta:', error);
    mostrarMensaje('Error al obtener detalle de venta: ' + error.message, 'error');
  }
}

function mostrarModalDetalleVenta(venta) {
  const modal = document.getElementById('modal-detalle-venta');
  if (!modal) return;

  // Llenar información básica
  document.getElementById('venta-id-numero').textContent = venta.id_venta || 'N/A';
  document.getElementById('venta-cliente').textContent = venta.nombre_cliente || 'N/A';
  
  // Formatear fecha
  const fecha = venta.fecha_venta ? new Date(venta.fecha_venta) : new Date();
  document.getElementById('venta-fecha').textContent = fecha.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  document.getElementById('venta-metodo-pago').textContent = venta.metodo_pago || 'No especificado';
  
  // Mostrar estado con estilo
  const estadoEl = document.getElementById('venta-estado');
  const estado = venta.estado || 'completada';
  estadoEl.textContent = estado.charAt(0).toUpperCase() + estado.slice(1);
  estadoEl.className = 'venta-value venta-estado-badge';
  if (estado === 'completada') {
    estadoEl.classList.add('estado-completada');
  } else if (estado === 'pendiente') {
    estadoEl.classList.add('estado-pendiente');
  } else if (estado === 'cancelada') {
    estadoEl.classList.add('estado-cancelada');
  }
  document.getElementById('venta-total').textContent = formatearPrecio(venta.total || 0);

  // Llenar productos
  const productosList = document.getElementById('venta-productos-list');
  if (venta.detalles && venta.detalles.length > 0) {
    productosList.innerHTML = venta.detalles.map(detalle => `
      <div class="venta-producto-item">
        <div class="venta-producto-info">
          <div class="venta-producto-nombre">${detalle.nombre_producto || 'Producto'}</div>
          <div class="venta-producto-detalle">
            ${detalle.cantidad || 0} x ${formatearPrecio(detalle.precio_unitario || 0)}
          </div>
        </div>
        <div class="venta-producto-subtotal">
          ${formatearPrecio((detalle.cantidad || 0) * (detalle.precio_unitario || 0))}
        </div>
      </div>
    `).join('');
  } else {
    productosList.innerHTML = '<div class="sin-productos">No hay detalles de productos disponibles</div>';
  }

  // Mostrar modal
  modal.classList.remove('hidden');
}

function cerrarModalDetalleVenta() {
  const modal = document.getElementById('modal-detalle-venta');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// Cerrar modal al hacer clic fuera de él
document.addEventListener('click', (e) => {
  const modal = document.getElementById('modal-detalle-venta');
  if (modal && !modal.classList.contains('hidden')) {
    if (e.target === modal) {
      cerrarModalDetalleVenta();
    }
  }
});

// Cerrar modal con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-detalle-venta');
    if (modal && !modal.classList.contains('hidden')) {
      cerrarModalDetalleVenta();
    }
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  // Verificar y cargar usuario al iniciar
  if (window.cargarUsuario) {
    window.cargarUsuario();
  }
  
  // Asegurar que el botón de vista vendedor esté oculto si el usuario es cliente
  const usuario = window.getUsuarioActual ? window.getUsuarioActual() : null;
  const btnVistaVendedor = document.getElementById('btn-vista-vendedor');
  if (btnVistaVendedor) {
    if (usuario && (usuario.rol === 'vendedor' || usuario.rol === 'admin')) {
      btnVistaVendedor.classList.remove('hidden');
    } else {
      btnVistaVendedor.classList.add('hidden');
    }
  }
  
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
    
    // Mantener el texto "Administrar" en el botón
    btnVendedor.textContent = "Administrar";

    vistaCliente.classList.remove("hidden");
    datosCliente.classList.remove("hidden");
    vistaVendedor.classList.add("hidden");
  }

  function mostrarVendedor() {
    // Verificar permisos antes de mostrar vista vendedor
    const usuario = window.getUsuarioActual ? window.getUsuarioActual() : null;
    if (!usuario) {
      mostrarMensaje('Debes estar autenticado para acceder al panel de administración', 'warning');
      return;
    }
    
    if (usuario.rol !== 'vendedor' && usuario.rol !== 'admin') {
      mostrarMensaje('No tienes permisos para acceder al panel de administración. Se requiere rol de vendedor o admin.', 'error');
      // Volver a vista cliente
      mostrarCliente();
      return;
    }

    btnCliente.classList.remove("active");
    btnVendedor.classList.add("active");
    
    // Actualizar texto del botón cuando se activa la vista de administración
    btnVendedor.textContent = "Administrar";

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
            // Verificar permisos antes de cargar clientes
            const usuario = window.getUsuarioActual ? window.getUsuarioActual() : null;
            if (usuario && (usuario.rol === 'vendedor' || usuario.rol === 'admin')) {
              renderClientes();
            } else {
              const tbody = document.getElementById("tabla-clientes");
              if (tbody) {
                tbody.innerHTML = '<tr><td colspan="4" class="error-mensaje">No tienes permisos para ver clientes. Se requiere rol de vendedor o admin.</td></tr>';
              }
            }
          } else if (id === 'sec-resumen') {
            renderResumen();
          } else if (id === 'sec-productos') {
            renderProductosVendedor();
          }
        } else {
          sec.classList.add("hidden");
        }
      });
    });
  });

  // Cargar resumen inicial si estamos en vista vendedor
  if (vistaVendedor && !vistaVendedor.classList.contains("hidden")) {
    await renderResumen();
    await renderVentas();
    await renderClientes();
  }
});

// Función para mostrar mensajes al usuario
function mostrarMensaje(mensaje, tipo = 'info') {
  // Crear elemento de mensaje si no existe
  let mensajeEl = document.getElementById('mensaje-global');
  if (!mensajeEl) {
    mensajeEl = document.createElement('div');
    mensajeEl.id = 'mensaje-global';
    mensajeEl.className = 'mensaje-global';
    document.body.appendChild(mensajeEl);
  }

  // Agregar icono según el tipo
  let icono = '';
  switch(tipo) {
    case 'success':
      icono = '✓';
      break;
    case 'error':
      icono = '✕';
      break;
    case 'warning':
      icono = '⚠';
      break;
    default:
      icono = 'ℹ';
  }

  mensajeEl.innerHTML = `<span class="mensaje-icono">${icono}</span><span class="mensaje-texto">${mensaje}</span>`;
  mensajeEl.className = `mensaje-global mensaje-${tipo} mostrar`;
  
  // Auto-cerrar después de 4 segundos (más tiempo para mensajes importantes)
  const tiempoCierre = tipo === 'error' ? 5000 : 4000;
  setTimeout(() => {
    mensajeEl.classList.remove('mostrar');
    // Limpiar contenido después de la animación
    setTimeout(() => {
      mensajeEl.innerHTML = '';
    }, 400);
  }, tiempoCierre);
}

// Función para mostrar loading
function mostrarLoading(elemento, mostrar = true) {
  if (mostrar) {
    elemento.classList.add('loading');
  } else {
    elemento.classList.remove('loading');
  }
}

// Función para abrir modal de editar producto
async function abrirModalEditarProducto(idProducto) {
  try {
    const producto = await obtenerProducto(idProducto);
    
    // Crear o mostrar modal de edición
    let modal = document.getElementById('modal-editar-producto');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-editar-producto';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
          <span class="modal-close" onclick="cerrarModalEditarProducto()">&times;</span>
          <h2>Editar Producto</h2>
          <form id="form-editar-producto" class="auth-form">
            <div class="field">
              <label for="edit-nombre">Nombre</label>
              <input type="text" id="edit-nombre" required>
            </div>
            <div class="field">
              <label for="edit-tipo">Tipo</label>
              <input type="text" id="edit-tipo" required>
            </div>
            <div class="field">
              <label for="edit-descripcion">Descripción</label>
              <textarea id="edit-descripcion" rows="3"></textarea>
            </div>
            <div class="field">
              <label for="edit-precio">Precio</label>
              <input type="number" id="edit-precio" step="0.01" min="0" required>
            </div>
            <div class="field">
              <label for="edit-stock">Stock</label>
              <input type="number" id="edit-stock" min="0" required>
            </div>
            <div class="field">
              <label for="edit-activo">Estado</label>
              <select id="edit-activo">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            <button type="submit" class="btn-primary">Guardar Cambios</button>
            <button type="button" class="btn-secondary" onclick="cerrarModalEditarProducto()" style="margin-left: 0.5rem;">Cancelar</button>
          </form>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Cerrar modal al hacer click fuera
      modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarModalEditarProducto();
      });
      
      // Manejar submit del formulario
      document.getElementById('form-editar-producto').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarProductoEditado(idProducto);
      });
    }
    
    // Llenar formulario con datos del producto
    document.getElementById('edit-nombre').value = producto.nombre_producto || '';
    document.getElementById('edit-tipo').value = producto.tipo_producto || '';
    document.getElementById('edit-descripcion').value = producto.descripcion || '';
    document.getElementById('edit-precio').value = producto.precio || 0;
    document.getElementById('edit-stock').value = producto.stock || 0;
    document.getElementById('edit-activo').value = producto.activo !== false ? 'true' : 'false';
    
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error al cargar producto:', error);
    mostrarMensaje('Error al cargar producto: ' + error.message, 'error');
  }
}

function cerrarModalEditarProducto() {
  const modal = document.getElementById('modal-editar-producto');
  if (modal) modal.classList.add('hidden');
}

async function guardarProductoEditado(idProducto) {
  try {
    const nombre = document.getElementById('edit-nombre').value.trim();
    const tipo = document.getElementById('edit-tipo').value.trim();
    const descripcion = document.getElementById('edit-descripcion').value.trim();
    const precio = parseFloat(document.getElementById('edit-precio').value);
    const stock = parseInt(document.getElementById('edit-stock').value);
    const activo = document.getElementById('edit-activo').value === 'true';
    
    if (!nombre || !tipo || precio < 0 || stock < 0) {
      mostrarMensaje('Por favor, completa todos los campos correctamente', 'warning');
      return;
    }
    
    await actualizarProducto(idProducto, {
      nombre_producto: nombre,
      tipo_producto: tipo,
      descripcion: descripcion,
      precio: precio,
      stock: stock,
      activo: activo
    });
    
    mostrarMensaje('Producto actualizado exitosamente', 'success');
    cerrarModalEditarProducto();
    
    // Recargar productos
    await renderProductosVendedor();
    // También recargar en vista cliente si está visible
    await renderProductos();
  } catch (error) {
    console.error('Error al guardar producto:', error);
    mostrarMensaje('Error al guardar producto: ' + error.message, 'error');
  }
}

// Exportar funciones globales
window.verDetalleVenta = verDetalleVenta;
window.cerrarModalDetalleVenta = cerrarModalDetalleVenta;
window.mostrarMensaje = mostrarMensaje;
window.agregarAlCarritoFrontend = agregarAlCarritoFrontend;
window.cambiarCantidad = cambiarCantidad;
window.quitarDelCarrito = quitarDelCarrito;
window.cargarCarritoDesdeAPI = cargarCarritoDesdeAPI;
window.mostrarMensaje = mostrarMensaje;
window.abrirModalEditarProducto = abrirModalEditarProducto;
window.cerrarModalEditarProducto = cerrarModalEditarProducto;
