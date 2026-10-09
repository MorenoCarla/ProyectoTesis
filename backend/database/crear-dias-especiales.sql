-- Solo crea la tabla que falta en producción (Marketing → días especiales).
-- Ejecutar UNA vez. No borra datos.
USE crm_ituarte;

CREATE TABLE IF NOT EXISTS dias_especiales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    mes             TINYINT      NOT NULL,
    dia             TINYINT      NOT NULL,
    rubro_objetivo  VARCHAR(80)  NULL,
    plantilla       TEXT         NOT NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO dias_especiales (nombre, mes, dia, rubro_objetivo, plantilla)
SELECT * FROM (
  SELECT 'Día del Arquitecto' AS nombre, 6 AS mes, 1 AS dia, 'arquitecto' AS rubro_objetivo,
    'Hola {{nombre}}, desde Electricidad Ituarte te saludamos en tu día. Tenemos novedades en luminaria de diseño y asesoramiento para proyectos. ¡Consultanos con descuento especial!' AS plantilla
  UNION ALL
  SELECT 'Día del Ingeniero', 6, 16, 'ingeniero',
    'Hola {{nombre}}, feliz Día del Ingeniero. En Ituarte tenemos soluciones en iluminación industrial y técnica para tus obras. Te esperamos en sucursal.'
  UNION ALL
  SELECT 'Día del Electricista', 8, 24, 'electricista',
    'Hola {{nombre}}, ¡feliz Día del Electricista! Tenemos promos en herramientas, materiales e iluminación. Como cliente Ituarte accedés a beneficios exclusivos.'
  UNION ALL
  SELECT 'Día del Diseñador de Interiores', 9, 29, 'diseñador_interiores',
    'Hola {{nombre}}, celebramos tu día con novedades en luminaria de diseño. Coordiná una visita a nuestro showroom con tu asesor Ituarte.'
) AS nuevos
WHERE NOT EXISTS (SELECT 1 FROM dias_especiales LIMIT 1);

SELECT COUNT(*) AS filas_dias_especiales FROM dias_especiales;
