# Frontend del Proyecto Final

Este repositorio contiene la **parte Frontend** del proyecto de venta de productos saludables para el laboratorio de bases de datos.  
Incluye:

- Vista de **cliente** (compra, carrito, formulario).
- Vista de **vendedor** (panel administrativo).
- Sistema de **API simulada (mock)** para facilitar la integración.
- Preparación para integrarlo con **PHP + MySQL** (backend del compañero).
- Listo para montarse sobre **Apache2** o en un **contenedor Docker**.

---

## Funcionamiento General

El frontend está diseñado para funcionar **SIN backend real** gracias a una capa de API simulada (`js/api.js`).  
De esta forma, el equipo puede trabajar en paralelo:

- Kass → Frontend  
- Compañero → Backend en PHP/MySQL  

Cuando esté listo el backend, solo será necesario cambiar:

```js
const USE_MOCK = false;
