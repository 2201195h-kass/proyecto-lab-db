import pool from '../config/database.js';

export const obtenerEstadisticas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    // Solo vendedores y admin pueden ver estadísticas
    if (req.user.rol === 'cliente') {
      return res.status(403).json({ error: 'No tienes permisos para ver estadísticas' });
    }

    // Usar stored procedure
    const statsResult = await pool.query(
      'SELECT * FROM obtener_estadisticas_ventas($1, $2)',
      [fecha_inicio || null, fecha_fin || null]
    );

    const stats = statsResult.rows[0];

    // Obtener productos más vendidos
    const productosVendidos = await pool.query(
      `SELECT p.id_producto, p.nombre_producto, 
              SUM(dv.cantidad) as total_vendido,
              SUM(dv.subtotal) as ingresos_totales
       FROM detalle_venta dv
       JOIN productos p ON dv.id_producto = p.id_producto
       JOIN ventas v ON dv.id_venta = v.id_venta
       WHERE v.estado = 'completada'
       AND ($1::date IS NULL OR DATE(v.fecha_venta) >= $1)
       AND ($2::date IS NULL OR DATE(v.fecha_venta) <= $2)
       GROUP BY p.id_producto, p.nombre_producto
       ORDER BY total_vendido DESC
       LIMIT 10`,
      [fecha_inicio || null, fecha_fin || null]
    );

    // Obtener clientes más frecuentes
    const clientesFrecuentes = await pool.query(
      `SELECT c.id_cliente, c.nombre_cliente,
              COUNT(v.id_venta) as total_compras,
              SUM(v.total) as total_gastado
       FROM clientes c
       JOIN ventas v ON c.id_cliente = v.id_cliente
       WHERE v.estado = 'completada'
       AND ($1::date IS NULL OR DATE(v.fecha_venta) >= $1)
       AND ($2::date IS NULL OR DATE(v.fecha_venta) <= $2)
       GROUP BY c.id_cliente, c.nombre_cliente
       ORDER BY total_compras DESC
       LIMIT 10`,
      [fecha_inicio || null, fecha_fin || null]
    );

    res.json({
      estadisticas: stats,
      productos_mas_vendidos: productosVendidos.rows,
      clientes_frecuentes: clientesFrecuentes.rows
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

export const obtenerResumen = async (req, res) => {
  try {
    // Solo vendedores y admin pueden ver resumen
    if (req.user.rol === 'cliente') {
      return res.status(403).json({ error: 'No tienes permisos para ver el resumen' });
    }

    // Ventas de hoy
    const ventasHoy = await pool.query(
      `SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as ingresos
       FROM ventas
       WHERE estado = 'completada' AND DATE(fecha_venta) = CURRENT_DATE`
    );

    // Clientes registrados
    const clientesRegistrados = await pool.query(
      'SELECT COUNT(*) as total FROM clientes'
    );

    // Productos activos
    const productosActivos = await pool.query(
      'SELECT COUNT(*) as total FROM productos WHERE activo = true'
    );

    res.json({
      ventas_hoy: {
        cantidad: parseInt(ventasHoy.rows[0].total),
        ingresos: parseFloat(ventasHoy.rows[0].ingresos)
      },
      clientes_registrados: parseInt(clientesRegistrados.rows[0].total),
      productos_activos: parseInt(productosActivos.rows[0].total)
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({ error: 'Error al obtener resumen' });
  }
};

