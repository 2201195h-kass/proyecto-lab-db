import pool from '../config/database.js';

export const obtenerVentas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin, estado, id_cliente } = req.query;
    let query = `
      SELECT v.*, 
             c.nombre_cliente,
             c.correo as correo_cliente,
             u.nombre_usuario as nombre_vendedor
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Si es cliente, solo ver sus propias ventas
    if (req.user.rol === 'cliente') {
      const clienteResult = await pool.query(
        'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
        [req.user.id_usuario]
      );
      if (clienteResult.rows.length > 0) {
        query += ` AND v.id_cliente = $${paramCount}`;
        params.push(clienteResult.rows[0].id_cliente);
        paramCount++;
      } else {
        return res.json([]);
      }
    }

    if (fecha_inicio) {
      query += ` AND DATE(v.fecha_venta) >= $${paramCount}`;
      params.push(fecha_inicio);
      paramCount++;
    }

    if (fecha_fin) {
      query += ` AND DATE(v.fecha_venta) <= $${paramCount}`;
      params.push(fecha_fin);
      paramCount++;
    }

    if (estado) {
      query += ` AND v.estado = $${paramCount}`;
      params.push(estado);
      paramCount++;
    }

    if (id_cliente && req.user.rol !== 'cliente') {
      query += ` AND v.id_cliente = $${paramCount}`;
      params.push(id_cliente);
      paramCount++;
    }

    query += ' ORDER BY v.fecha_venta DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

export const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener venta
    const ventaResult = await pool.query(
      `SELECT v.*, 
              c.nombre_cliente, c.direccion, c.telefono, c.correo as correo_cliente,
              u.nombre_usuario as nombre_vendedor
       FROM ventas v
       LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
       WHERE v.id_venta = $1`,
      [id]
    );

    if (ventaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Verificar permisos (cliente solo puede ver sus propias ventas)
    if (req.user.rol === 'cliente') {
      const clienteResult = await pool.query(
        'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
        [req.user.id_usuario]
      );
      if (clienteResult.rows.length === 0 || 
          ventaResult.rows[0].id_cliente !== clienteResult.rows[0].id_cliente) {
        return res.status(403).json({ error: 'No tienes permisos para ver esta venta' });
      }
    }

    // Obtener detalles de la venta
    const detallesResult = await pool.query(
      `SELECT dv.*, p.nombre_producto, p.tipo_producto
       FROM detalle_venta dv
       JOIN productos p ON dv.id_producto = p.id_producto
       WHERE dv.id_venta = $1`,
      [id]
    );

    res.json({
      ...ventaResult.rows[0],
      detalles: detallesResult.rows
    });
  } catch (error) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
};

export const crearVenta = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id_cliente, metodo_pago, items } = req.body;
    const id_vendedor = req.user.rol !== 'cliente' ? req.user.id_usuario : null;

    // Verificar que el cliente existe
    const clienteCheck = await client.query(
      'SELECT id_cliente FROM clientes WHERE id_cliente = $1',
      [id_cliente]
    );

    if (clienteCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Verificar stock y precios
    for (const item of items) {
      const producto = await client.query(
        'SELECT precio, stock FROM productos WHERE id_producto = $1 AND activo = true',
        [item.id_producto]
      );

      if (producto.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Producto ${item.id_producto} no encontrado o inactivo` });
      }

      if (producto.rows[0].stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Stock insuficiente para el producto ${item.id_producto}` 
        });
      }

      // Usar precio actual del producto si no se especifica
      if (!item.precio_unitario) {
        item.precio_unitario = producto.rows[0].precio;
      }
    }

    // Usar stored procedure para crear venta completa
    const itemsJson = JSON.stringify(items);
    const result = await client.query(
      'SELECT crear_venta_completa($1, $2, $3, $4::jsonb) as id_venta',
      [id_cliente, id_vendedor, metodo_pago, itemsJson]
    );

    const id_venta = result.rows[0].id_venta;

    await client.query('COMMIT');

    // Obtener la venta completa para retornarla
    const ventaResult = await pool.query(
      `SELECT v.*, 
              c.nombre_cliente, c.direccion, c.telefono, c.correo as correo_cliente,
              u.nombre_usuario as nombre_vendedor
       FROM ventas v
       LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
       WHERE v.id_venta = $1`,
      [id_venta]
    );

    const detallesResult = await pool.query(
      `SELECT dv.*, p.nombre_producto, p.tipo_producto
       FROM detalle_venta dv
       JOIN productos p ON dv.id_producto = p.id_producto
       WHERE dv.id_venta = $1`,
      [id_venta]
    );

    res.status(201).json({
      message: 'Venta creada exitosamente',
      id_venta,
      venta: {
        ...ventaResult.rows[0],
        detalles: detallesResult.rows
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: error.message || 'Error al crear venta' });
  } finally {
    client.release();
  }
};

export const cancelarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la venta existe
    const venta = await pool.query(
      'SELECT estado, id_cliente FROM ventas WHERE id_venta = $1',
      [id]
    );

    if (venta.rows.length === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Verificar permisos
    if (req.user.rol === 'cliente') {
      const clienteResult = await pool.query(
        'SELECT id_cliente FROM clientes WHERE id_usuario = $1',
        [req.user.id_usuario]
      );
      if (clienteResult.rows.length === 0 || 
          venta.rows[0].id_cliente !== clienteResult.rows[0].id_cliente) {
        return res.status(403).json({ error: 'No tienes permisos para cancelar esta venta' });
      }
    }

    if (venta.rows[0].estado === 'cancelada') {
      return res.status(400).json({ error: 'La venta ya está cancelada' });
    }

    // Actualizar estado (el trigger restaurará el stock)
    const result = await pool.query(
      'UPDATE ventas SET estado = $1 WHERE id_venta = $2 RETURNING *',
      ['cancelada', id]
    );

    res.json({
      message: 'Venta cancelada exitosamente',
      venta: result.rows[0]
    });
  } catch (error) {
    console.error('Error al cancelar venta:', error);
    res.status(500).json({ error: 'Error al cancelar venta' });
  }
};

