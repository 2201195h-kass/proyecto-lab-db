// js/auth.js
// Manejo de autenticación en el frontend

let usuarioActual = null;

// Cargar usuario del localStorage al iniciar
function cargarUsuario() {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    usuarioActual = JSON.parse(userStr);
    actualizarUIUsuario();
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
  
  if (authSection && userSection) {
    if (usuarioActual) {
      authSection.style.display = 'none';
      userSection.style.display = 'block';
      document.getElementById('user-name').textContent = usuarioActual.nombre_usuario || usuarioActual.correo;
      document.getElementById('user-role').textContent = usuarioActual.rol || 'cliente';
    } else {
      authSection.style.display = 'block';
      userSection.style.display = 'none';
    }
  }
}

async function manejarRegistro(event) {
  event.preventDefault();
  
  const nombre = document.getElementById('reg-nombre').value.trim();
  const correo = document.getElementById('reg-correo').value.trim();
  const password = document.getElementById('reg-password').value;
  const rol = document.getElementById('reg-rol')?.value || 'cliente';

  try {
    const respuesta = await registrarUsuario({
      nombre_usuario: nombre,
      correo,
      password,
      rol
    });

    guardarUsuario(respuesta.user, respuesta.token);
    alert('Registro exitoso. Bienvenido!');
    
    // Cerrar modal si existe
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
    
    // Recargar carrito si es cliente
    if (respuesta.user.rol === 'cliente') {
      await cargarCarritoDesdeAPI();
    }
  } catch (error) {
    alert('Error al registrar: ' + error.message);
  }
}

async function manejarLogin(event) {
  event.preventDefault();
  
  const correo = document.getElementById('login-correo').value.trim();
  const password = document.getElementById('login-password').value;

  try {
    const respuesta = await iniciarSesion(correo, password);
    guardarUsuario(respuesta.user, respuesta.token);
    alert('Login exitoso. Bienvenido!');
    
    // Cerrar modal si existe
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
    
    // Recargar carrito si es cliente
    if (respuesta.user.rol === 'cliente') {
      await cargarCarritoDesdeAPI();
    }
    
    // Recargar página para actualizar vistas
    window.location.reload();
  } catch (error) {
    alert('Error al iniciar sesión: ' + error.message);
  }
}

function manejarLogout() {
  eliminarUsuario();
  cerrarSesion();
  alert('Sesión cerrada');
  window.location.reload();
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  cargarUsuario();
  
  // Event listeners para formularios
  const formRegistro = document.getElementById('form-registro');
  const formLogin = document.getElementById('form-login');
  const btnLogout = document.getElementById('btn-logout');
  
  if (formRegistro) {
    formRegistro.addEventListener('submit', manejarRegistro);
  }
  
  if (formLogin) {
    formLogin.addEventListener('submit', manejarLogin);
  }
  
  if (btnLogout) {
    btnLogout.addEventListener('click', manejarLogout);
  }
});

// Exportar funciones para uso global
window.manejarRegistro = manejarRegistro;
window.manejarLogin = manejarLogin;
window.manejarLogout = manejarLogout;
window.getUsuarioActual = () => usuarioActual;
window.estaAutenticado = () => usuarioActual !== null;

