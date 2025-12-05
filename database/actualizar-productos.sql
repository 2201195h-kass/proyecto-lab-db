-- ============================================================================
-- Script para actualizar productos: eliminar duplicados y agregar variedad
-- ============================================================================

-- Eliminar productos duplicados (mantener solo el primero por nombre)
DELETE FROM productos
WHERE id_producto NOT IN (
  SELECT MIN(id_producto)
  FROM productos
  GROUP BY nombre_producto
);

-- Insertar nuevos productos variados (solo si no existen)
INSERT INTO productos (nombre_producto, tipo_producto, descripcion, precio, stock)
SELECT * FROM (VALUES
-- Jugos y Smoothies
('Smoothie Tropical', 'líquido', 'Combinación de piña, mango y coco. Energía natural y refrescante.', 42.00, 35),
('Jugo de Zanahoria y Naranja', 'líquido', 'Rico en betacarotenos y vitamina C. Refuerza el sistema inmunológico.', 38.00, 40),
('Smoothie Verde Energético', 'líquido', 'Espinaca, plátano y manzana. Perfecto para empezar el día con energía.', 44.00, 28),

-- Suplementos en Polvo
('Proteína en Polvo Chocolate', 'polvo', 'Proteína vegana sabor chocolate. Sin lactosa ni gluten.', 325.00, 18),
('Colágeno Hidrolizado', 'polvo', 'Colágeno tipo I y III para la salud de la piel, cabello y articulaciones.', 280.00, 25),
('Superfood Mix', 'polvo', 'Mezcla de espirulina, chlorella, maca y cacao. Superalimentos en un solo producto.', 350.00, 15),
('Proteína de Cáñamo', 'polvo', 'Proteína vegetal completa con omega-3. Ideal para dietas veganas.', 295.00, 22),

-- Snacks Saludables
('Nueces y Almendras Orgánicas', 'otro', 'Mezcla premium de nueces y almendras orgánicas. Fuente de grasas saludables.', 120.00, 30),
('Barritas de Avena y Miel', 'otro', 'Barritas energéticas naturales con avena, miel y frutos secos.', 35.00, 50),
('Chips de Plátano Verde', 'otro', 'Snack crujiente de plátano verde. Natural y sin conservantes.', 45.00, 38),
('Mix de Semillas', 'otro', 'Chía, linaza, girasol y calabaza. Rico en fibra y omega-3.', 55.00, 42),

-- Tés e Infusiones
('Té Verde Orgánico', 'líquido', 'Té verde premium con propiedades antioxidantes. Envase de 20 bolsitas.', 65.00, 35),
('Té de Manzanilla', 'líquido', 'Infusión relajante de manzanilla. Ideal para antes de dormir.', 50.00, 40),
('Té Matcha Premium', 'polvo', 'Matcha de alta calidad. Rico en antioxidantes y energía natural.', 180.00, 20),
('Infusión Detox', 'líquido', 'Mezcla de hierbas naturales para desintoxicar el organismo.', 58.00, 32),

-- Superfoods y Productos Especiales
('Aceite de Coco Virgen', 'líquido', 'Aceite de coco extra virgen prensado en frío. 500ml.', 95.00, 28),
('Miel de Abeja Pura', 'líquido', 'Miel 100% natural sin procesar. Envase de 500g.', 85.00, 30),
('Polen de Abeja', 'polvo', 'Superalimento rico en proteínas, vitaminas y minerales. 200g.', 120.00, 18),
('Jalea Real', 'líquido', 'Jalea real pura. Refuerza el sistema inmunológico. 30g.', 150.00, 15)
) AS v(nombre_producto, tipo_producto, descripcion, precio, stock)
WHERE NOT EXISTS (
  SELECT 1 FROM productos p WHERE p.nombre_producto = v.nombre_producto
);

-- Actualizar descripciones de productos existentes para que sean más descriptivas
UPDATE productos SET descripcion = 'Mezcla de frutas y verduras ideal para desintoxicar. Rico en antioxidantes y vitaminas.' 
WHERE nombre_producto = 'Jugo Verde Detox' AND descripcion = 'Mezcla de frutas y verduras ideal para desintoxicar.';

UPDATE productos SET descripcion = 'Bebida cremosa a base de fresa y yogurt natural. Fuente de probióticos.' 
WHERE nombre_producto = 'Smoothie de Fresa' AND descripcion = 'Bebida cremosa a base de fresa y yogurt.';

UPDATE productos SET descripcion = 'Suplemento de proteína sabor vainilla, ideal para batidos post-entrenamiento.' 
WHERE nombre_producto = 'Proteína en Polvo Vainilla' AND descripcion = 'Suplemento de proteína sabor vainilla, ideal para batidos.';

UPDATE productos SET descripcion = 'Botana saludable con variedad de frutas deshidratadas. Sin azúcar añadida.' 
WHERE nombre_producto = 'Mix de Frutas Deshidratadas' AND descripcion = 'Botana saludable con variedad de frutas deshidratadas.';

