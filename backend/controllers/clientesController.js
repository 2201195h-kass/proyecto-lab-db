import pool from '../config/database.js';

export const obtenerClientes = async (req, res) => {
  try {
    const { busqueda } = req.query;
    let query = `
      SELECT c.*, u.correo as correo_usuario
      FROM clientes c
      LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (busqueda) {
      query += ` AND (c.nombre_cliente ILIKE $${paramCount} OR c.correo ILIKE $${paramCount} OR u.correo ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    query += ' ORDER BY c.fecha_registro DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT c.*, u.correo as correo_usuario
       FROM clientes c
       LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
       WHERE c.id_cliente = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_cliente, direccion, telefono, correo } = req.body;

    // Verificar si el cliente existe y pertenece al usuario (si es cliente)
    if (req.user.rol === 'cliente') {
      const clienteCheck = await pool.query(
        'SELECT id_cliente FROM clientes WHERE id_cliente = $1 AND id_usuario = $2',
        [id, req.user.id_usuario]
      );

      if (clienteCheck.rows.length === 0) {
        return res.status(403).json({ error: 'No tienes permisos para actualizar este cliente' });
      }
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (nombre_cliente !== undefined) {
      updates.push(`nombre_cliente = $${paramCount++}`);
      params.push(nombre_cliente);
    }
    if (direccion !== undefined) {
      updates.push(`direccion = $${paramCount++}`);
      params.push(direccion);
    }
    if (telefono !== undefined) {
      updates.push(`telefono = $${paramCount++}`);
      params.push(telefono);
    }
    if (correo !== undefined) {
      updates.push(`correo = $${paramCount++}`);
      params.push(correo);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE clientes SET ${updates.join(', ')} WHERE id_cliente = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

