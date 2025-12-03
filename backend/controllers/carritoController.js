import pool from '../config/database.js';

export const obtenerCarrito = async (req, res) => {
  try {
    // Obtener id_cliente del usuario autenticado
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
      [req.user.id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    const result = await pool.query(
      `SELECT c.*, 
              p.nombre_producto, p.tipo_producto, p.precio as precio_actual, 
              p.stock, p.imagen_url, p.activo,
              (c.cantidad * p.precio) as subtotal
       FROM carrito c
       JOIN productos p ON c.id_producto = p.id_producto
       WHERE c.id_cliente = $1
       ORDER BY c.fecha_agregado DESC`,
      [id_cliente]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener carrito:', error);
    res.status(500).json({ error: 'Error al obtener carrito' });
  }
};

export const agregarAlCarrito = async (req, res) => {
  try {
    const { id_producto, cantidad } = req.body;

    // Obtener id_cliente del usuario autenticado
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
      [req.user.id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    // Verificar que el producto existe y está activo
    const producto = await pool.query(
      'SELECT id_producto, precio, stock, activo FROM productos WHERE id_producto = $1',
      [id_producto]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (!producto.rows[0].activo) {
      return res.status(400).json({ error: 'El producto no está disponible' });
    }

    // Verificar stock disponible
    const cantidadSolicitada = cantidad || 1;
    const stockDisponible = producto.rows[0].stock;

    // Verificar si ya existe en el carrito
    const itemExistente = await pool.query(
      'SELECT cantidad FROM carrito WHERE id_cliente = $1 AND id_producto = $2',
      [id_cliente, id_producto]
    );

    let nuevaCantidad = cantidadSolicitada;
    if (itemExistente.rows.length > 0) {
      nuevaCantidad = itemExistente.rows[0].cantidad + cantidadSolicitada;
    }

    if (nuevaCantidad > stockDisponible) {
      return res.status(400).json({ 
        error: `Stock insuficiente. Disponible: ${stockDisponible}` 
      });
    }

    // Insertar o actualizar carrito
    const result = await pool.query(
      `INSERT INTO carrito (id_cliente, id_producto, cantidad)
       VALUES ($1, $2, $3)
       ON CONFLICT (id_cliente, id_producto)
       DO UPDATE SET cantidad = $3, fecha_agregado = CURRENT_TIMESTAMP
       RETURNING *`,
      [id_cliente, id_producto, nuevaCantidad]
    );

    res.status(201).json({
      message: 'Producto agregado al carrito',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error al agregar al carrito' });
  }
};

export const actualizarCantidad = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    // Obtener id_cliente del usuario autenticado
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
      [req.user.id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    // Verificar stock disponible
    const producto = await pool.query(
      'SELECT stock FROM productos WHERE id_producto = $1',
      [id_producto]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (cantidad > producto.rows[0].stock) {
      return res.status(400).json({ 
        error: `Stock insuficiente. Disponible: ${producto.rows[0].stock}` 
      });
    }

    // Actualizar cantidad
    const result = await pool.query(
      `UPDATE carrito 
       SET cantidad = $1, fecha_agregado = CURRENT_TIMESTAMP
       WHERE id_cliente = $2 AND id_producto = $3
       RETURNING *`,
      [cantidad, id_cliente, id_producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }

    res.json({
      message: 'Cantidad actualizada',
      item: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
    res.status(500).json({ error: 'Error al actualizar cantidad' });
  }
};

export const eliminarDelCarrito = async (req, res) => {
  try {
    const { id_producto } = req.params;

    // Obtener id_cliente del usuario autenticado
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
      [req.user.id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    const result = await pool.query(
      'DELETE FROM carrito WHERE id_cliente = $1 AND id_producto = $2 RETURNING *',
      [id_cliente, id_producto]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item no encontrado en el carrito' });
    }

    res.json({ message: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar del carrito' });
  }
};

export const vaciarCarrito = async (req, res) => {
  try {
    // Obtener id_cliente del usuario autenticado
    const clienteResult = await pool.query(
      'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
      [req.user.id_usuario]
    );

    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const id_cliente = clienteResult.rows[0].id_cliente;

    await pool.query(
      'DELETE FROM carrito WHERE id_cliente = $1',
      [id_cliente]
    );

    res.json({ message: 'Carrito vaciado exitosamente' });
  } catch (error) {
    console.error('Error al vaciar carrito:', error);
    res.status(500).json({ error: 'Error al vaciar carrito' });
  }
};

