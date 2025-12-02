// js/app.js

let carrito = [];

function formatearPrecio(valor) {
  return `$${valor.toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// CLIENTE: productos + carrito
// ---------------------------------------------------------------------------

async function renderProductos() {
  const contenedor = document.getElementById("lista-productos");
  const productos = await obtenerProductos(); // 👈 IMPORTANTE: ESTA

  contenedor.innerHTML = productos
    .map((p) => {
      return `
      <article class="card-producto">
        <h3>${p.nombre_producto}</h3>
        <p class="tipo">${p.tipo_producto}</p>
        <p>${p.descripcion}</p>
        <p class="precio">${formatearPrecio(p.precio)}</p>
        <div class="card-footer">
          <button class="btn-small" onclick="agregarAlCarrito(${p.id_producto})">
            Agregar
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}
async function agregarAlCarrito(idProducto) {
  const productos = await obtenerProductos();
  const producto = productos.find((p) => p.id_producto === idProducto);
  if (!producto) return;

  const existente = carrito.find((item) => item.id_producto === idProducto);

  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      id_producto: producto.id_producto,
      nombre: producto.nombre_producto,
      precio: producto.precio,
      cantidad: 1
    });
  }

  renderCarrito();
}

function quitarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id_producto !== idProducto);
  renderCarrito();
}

function cambiarCantidad(idProducto, delta) {
  const item = carrito.find((i) => i.id_producto === idProducto);
  if (!item) return;

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    carrito = carrito.filter((i) => i.id_producto !== idProducto);
  }

  renderCarrito();
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

function vaciarCarrito() {
  carrito = [];
  renderCarrito();
}

async function manejarFormularioCliente(event) {
  event.preventDefault();

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
    console.log("Respuesta backend / mock:", respuesta);

    alert("Compra registrada (simulada). Más adelante esto se guardará en la BD.");

    vaciarCarrito();
    document.getElementById("form-cliente").reset();
  } catch (err) {
    console.error(err);
    alert("Ocurrió un error al registrar la compra.");
  }
}

// ---------------------------------------------------------------------------
// INICIALIZACIÓN: un solo DOMContentLoaded
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // CLIENTE
  renderProductos();
  renderCarrito();

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
    item.addEventListener("click", () => {
      const id = item.getAttribute("data-section");

      menuItems.forEach((m) => m.classList.remove("activo"));
      item.classList.add("activo");

      sections.forEach((sec) => {
        if (sec.id === id) sec.classList.remove("hidden");
        else sec.classList.add("hidden");
      });
    });
  });
});
