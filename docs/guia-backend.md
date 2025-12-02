# 🧑‍💻 Guía Backend — Proyecto Tienda de Kass

Este documento explica **qué hace el frontend** y **qué te toca hacer a ti en el backend (PHP + MySQL)**.

---

## 1. Qué ya está hecho en el frontend

El frontend (hecho por Kass) incluye:

- Vista **cliente**: catálogo, carrito, formulario de datos.
- Vista **vendedor**: panel con secciones de resumen, productos, clientes y ventas.
- Una capa de **API simulada (`js/api.js`)** que actualmente usa datos *mock*.

El frontend **NUNCA habla directo con la BD**.  
Solo usa funciones de `api.js`:

- `obtenerProductos()`
- `registrarVenta(datosVenta)`
- `obtenerClientes()`
- `obtenerVentas()`

Tu trabajo es hacer que esas funciones usen **PHP + MySQL** en lugar de mock.

---

## 2. Archivo clave: `js/api.js`

En `api.js` verás esto:

```js
const USE_MOCK = true;
