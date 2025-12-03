import pool from '../config/database.js';
import { uploadToS3, deleteFromS3 } from '../config/aws.js';

export const obtenerProductos = async (req, res) => {
  try {
    const { tipo, activo, busqueda } = req.query;
    let query = 'SELECT * FROM productos WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (tipo) {
      query += ` AND tipo_producto = $${paramCount}`;
      params.push(tipo);
      paramCount++;
    }

    if (activo !== undefined) {
      query += ` AND activo = $${paramCount}`;
      params.push(activo === 'true');
      paramCount++;
    } else {
      query += ` AND activo = true`; // Por defecto solo activos
    }

    if (busqueda) {
      query += ` AND (nombre_producto ILIKE $${paramCount} OR descripcion ILIKE $${paramCount})`;
      params.push(`%${busqueda}%`);
      paramCount++;
    }

    query += ' ORDER BY fecha_creacion DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM productos WHERE id_producto = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

export const crearProducto = async (req, res) => {
  try {
    const { nombre_producto, tipo_producto, descripcion, precio, stock } = req.body;
    let imagen_url = null;

    // Subir imagen si existe
    if (req.file) {
      imagen_url = await uploadToS3(req.file, 'productos');
    }

    const result = await pool.query(
      `INSERT INTO productos (nombre_producto, tipo_producto, descripcion, precio, stock, imagen_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nombre_producto, tipo_producto, descripcion, precio, stock || 0, imagen_url]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_producto, tipo_producto, descripcion, precio, stock, activo } = req.body;

    // Obtener producto actual para eliminar imagen anterior si se cambia
    const productoActual = await pool.query(
      'SELECT imagen_url FROM productos WHERE id_producto = $1',
      [id]
    );

    let imagen_url = productoActual.rows[0]?.imagen_url;

    // Si se sube nueva imagen
    if (req.file) {
      // Eliminar imagen anterior de S3
      if (imagen_url) {
        await deleteFromS3(imagen_url);
      }
      imagen_url = await uploadToS3(req.file, 'productos');
    }

    const updates = [];
    const params = [];
    let paramCount = 1;

    if (nombre_producto !== undefined) {
      updates.push(`nombre_producto = $${paramCount++}`);
      params.push(nombre_producto);
    }
    if (tipo_producto !== undefined) {
      updates.push(`tipo_producto = $${paramCount++}`);
      params.push(tipo_producto);
    }
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramCount++}`);
      params.push(descripcion);
    }
    if (precio !== undefined) {
      updates.push(`precio = $${paramCount++}`);
      params.push(precio);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${paramCount++}`);
      params.push(stock);
    }
    if (activo !== undefined) {
      updates.push(`activo = $${paramCount++}`);
      params.push(activo);
    }
    if (imagen_url !== undefined) {
      updates.push(`imagen_url = $${paramCount++}`);
      params.push(imagen_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(id);
    const result = await pool.query(
      `UPDATE productos SET ${updates.join(', ')} WHERE id_producto = $${paramCount} RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener imagen para eliminarla de S3
    const producto = await pool.query(
      'SELECT imagen_url FROM productos WHERE id_producto = $1',
      [id]
    );

    if (producto.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imagen de S3 si existe
    if (producto.rows[0].imagen_url) {
      await deleteFromS3(producto.rows[0].imagen_url);
    }

    // Eliminar producto (soft delete - marcar como inactivo)
    const result = await pool.query(
      'UPDATE productos SET activo = false WHERE id_producto = $1 RETURNING *',
      [id]
    );

    res.json({ message: 'Producto eliminado exitosamente', producto: result.rows[0] });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

