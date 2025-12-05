-- Script para actualizar solo la función crear_venta_completa
-- Ejecutar con: docker exec -i tienda-postgres psql -U postgres -d tienda_productos < backend/scripts/update-function.sql

CREATE OR REPLACE FUNCTION crear_venta_completa(
  p_id_cliente INTEGER,
  p_items JSONB,
  p_id_vendedor INTEGER DEFAULT NULL,
  p_metodo_pago VARCHAR(50) DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  v_id_venta INTEGER;
  v_item JSONB;
  v_total DECIMAL(10,2) := 0;
BEGIN
  -- Calcular el total antes de insertar la venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL);
  END LOOP;
  
  -- Crear la venta con el total calculado
  INSERT INTO ventas (id_cliente, id_vendedor, metodo_pago, estado, total)
  VALUES (p_id_cliente, p_id_vendedor, p_metodo_pago, 'pendiente', v_total)
  RETURNING id_venta INTO v_id_venta;
  
  -- Insertar detalles de venta
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
    VALUES (
      v_id_venta,
      (v_item->>'id_producto')::INTEGER,
      (v_item->>'cantidad')::INTEGER,
      (v_item->>'precio_unitario')::DECIMAL
    );
  END LOOP;
  
  -- Completar la venta
  UPDATE ventas SET estado = 'completada' WHERE id_venta = v_id_venta;
  
  -- Limpiar carrito del cliente
  DELETE FROM carrito WHERE id_cliente = p_id_cliente;
  
  RETURN v_id_venta;
END;
$$ LANGUAGE plpgsql;

