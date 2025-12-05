// js/auth.js
// Manejo de autenticación en el frontend

let usuarioActual = null;

// Cargar usuario del localStorage al iniciar
function cargarUsuario() {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('authToken');
  
  if (userStr && token) {
    try {
      usuarioActual = JSON.parse(userStr);
      actualizarUIUsuario();
      console.log('Usuario cargado:', usuarioActual);
      console.log('Token disponible:', token ? 'Sí' : 'No');
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      eliminarUsuario();
    }
  } else {
    console.log('No hay usuario o token guardado');
    eliminarUsuario();
  }
}

function guardarUsuario(user, token) {
  usuarioActual = user;
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('authToken', token);
  actualizarUIUsuario();
}

function eliminarUsuario() {
  usuarioActual = null;
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  actualizarUIUsuario();
}

function actualizarUIUsuario() {
  const authSection = document.getElementById('auth-section');
  const userSection = document.getElementById('user-section');
  const btnVistaVendedor = document.getElementById('btn-vista-vendedor');
  
  if (authSection && userSection) {
    if (usuarioActual) {
      authSection.classList.add('hidden');
      userSection.classList.remove('hidden');
      const userNameEl = document.getElementById('user-name');
      const userRoleEl = document.getElementById('user-role');
      if (userNameEl) userNameEl.textContent = usuarioActual.nombre_usuario || usuarioActual.correo;
      if (userRoleEl) userRoleEl.textContent = usuarioActual.rol || 'cliente';
      
      // Ocultar botón "Vista vendedor" si el usuario es cliente
      if (btnVistaVendedor) {
        if (usuarioActual.rol === 'vendedor' || usuarioActual.rol === 'admin') {
          btnVistaVendedor.classList.remove('hidden');
        } else {
          btnVistaVendedor.classList.add('hidden');
          // Asegurarse de que si es cliente, esté en vista cliente
          const vistaVendedor = document.getElementById('vista-vendedor');
          const vistaCliente = document.getElementById('vista-cliente');
          const datosCliente = document.getElementById('cliente-datos');
          const btnVistaCliente = document.getElementById('btn-vista-cliente');
          if (vistaVendedor && vistaCliente && datosCliente && btnVistaCliente) {
            vistaVendedor.classList.add('hidden');
            vistaCliente.classList.remove('hidden');
            datosCliente.classList.remove('hidden');
            btnVistaCliente.classList.add('active');
            btnVistaVendedor.classList.remove('active');
          }
        }
      }
    } else {
      authSection.classList.remove('hidden');
      userSection.classList.add('hidden');
      // Ocultar botón cuando no hay usuario autenticado
      if (btnVistaVendedor) {
        btnVistaVendedor.classList.add('hidden');
      }
    }
  }
}

function abrirModal(tab = 'login') {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  
  modal.classList.remove('hidden');
  
  // Activar el tab correspondiente
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  
  tabs.forEach(t => t.classList.remove('active'));
  forms.forEach(f => f.classList.add('hidden'));
  
  if (tab === 'login') {
    document.querySelector('.auth-tab[data-tab="login"]')?.classList.add('active');
    document.getElementById('form-login')?.classList.remove('hidden');
  } else {
    document.querySelector('.auth-tab[data-tab="registro"]')?.classList.add('active');
    document.getElementById('form-registro')?.classList.remove('hidden');
  }
}

function cerrarModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

async function manejarRegistro(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('reg-nombre').value.trim();
  const correo = document.getElementById('reg-correo').value.trim();
  const password = document.getElementById('reg-password').value;
  const codigoVendedor = document.getElementById('reg-codigo-vendedor')?.value.trim() || '';

  try {
    // Si se proporciona un código de vendedor, se enviará al backend para validación
    const datosRegistro = {
      nombre_usuario: nombre,
      correo,
      password
    };

    // Solo enviar código si fue proporcionado
    if (codigoVendedor) {
      datosRegistro.codigo_vendedor = codigoVendedor;
    }

    const respuesta = await registrarUsuario(datosRegistro);

    guardarUsuario(respuesta.user, respuesta.token);
    
    // Mostrar mensaje de éxito
    if (window.mostrarMensaje) {
      window.mostrarMensaje('Registro exitoso. ¡Bienvenido!', 'success');
    }
    
    cerrarModal();
    
    // Recargar carrito si es cliente
    if (respuesta.user.rol === 'cliente' && window.cargarCarritoDesdeAPI) {
      await window.cargarCarritoDesdeAPI();
    }
    
    // Recargar página para actualizar vistas
    window.location.reload();
  } catch (error) {
    console.error('Error al registrar:', error);
    if (window.mostrarMensaje) {
      window.mostrarMensaje('Error al registrar: ' + error.message, 'error');
    } else {
      alert('Error al registrar: ' + error.message);
    }
  }
}

async function manejarLogin(event) {
  event.preventDefault();
  
  const correo = document.getElementById('login-correo').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const respuesta = await iniciarSesion(correo, password);
    guardarUsuario(respuesta.user, respuesta.token);
    
    // Mostrar mensaje de éxito
    if (window.mostrarMensaje) {
      window.mostrarMensaje('Login exitoso. ¡Bienvenido!', 'success');
    }
    
    cerrarModal();
    
    // Recargar carrito si es cliente
    if (respuesta.user.rol === 'cliente' && window.cargarCarritoDesdeAPI) {
      await window.cargarCarritoDesdeAPI();
    }
    
    // Recargar página para actualizar vistas
    window.location.reload();
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    if (window.mostrarMensaje) {
      window.mostrarMensaje('Error al iniciar sesión: ' + error.message, 'error');
    } else {
      alert('Error al iniciar sesión: ' + error.message);
    }
  }
}

function manejarLogout() {
  eliminarUsuario();
  cerrarSesion();
  
  if (window.mostrarMensaje) {
    window.mostrarMensaje('Sesión cerrada', 'info');
  }
  
  window.location.reload();
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarUsuario();
  
  // Event listeners para formularios
  const formRegistro = document.getElementById('form-registro');
  const formLogin = document.getElementById('form-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnLoginModal = document.getElementById('btn-login-modal');
  const btnRegistroModal = document.getElementById('btn-registro-modal');
  const modalClose = document.querySelector('.modal-close');
  const authTabs = document.querySelectorAll('.auth-tab');
  
  if (formRegistro) {
    formRegistro.addEventListener('submit', manejarRegistro);
  }
  
  if (formLogin) {
    formLogin.addEventListener('submit', manejarLogin);
  }
  
  if (btnLogout) {
    btnLogout.addEventListener('click', manejarLogout);
  }
  
  // Abrir modal de login
  if (btnLoginModal) {
    btnLoginModal.addEventListener('click', () => abrirModal('login'));
  }
  
  // Abrir modal de registro
  if (btnRegistroModal) {
    btnRegistroModal.addEventListener('click', () => abrirModal('registro'));
  }
  
  // Cerrar modal
  if (modalClose) {
    modalClose.addEventListener('click', cerrarModal);
  }
  
  // Cerrar modal al hacer click fuera
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) cerrarModal();
    });
  }
  
  // Cambiar entre tabs
  authTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      abrirModal(tabName);
    });
  });
});

// Exportar funciones para uso global
window.manejarRegistro = manejarRegistro;
window.manejarLogin = manejarLogin;
window.manejarLogout = manejarLogout;
window.getUsuarioActual = () => usuarioActual;
window.estaAutenticado = () => usuarioActual !== null;
window.cargarUsuario = cargarUsuario;
window.eliminarUsuario = eliminarUsuario;

