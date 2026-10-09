-- ============================================================
-- Marketing CRM — producción (seguro ejecutar más de una vez)
-- Crea tablas faltantes + columnas en clientes + datos iniciales
-- ============================================================
USE crm_ituarte;

-- ── Columnas en clientes (solo si faltan) ──
SET @db = DATABASE();

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'tipo_cliente') = 0,
  "ALTER TABLE clientes ADD COLUMN tipo_cliente ENUM('particular','profesional','empresa','municipalidad') DEFAULT 'particular' AFTER ciudad",
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'rubro') = 0,
  'ALTER TABLE clientes ADD COLUMN rubro VARCHAR(80) NULL AFTER tipo_cliente',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'empresa') = 0,
  'ALTER TABLE clientes ADD COLUMN empresa VARCHAR(150) NULL AFTER rubro',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'fecha_nacimiento') = 0,
  'ALTER TABLE clientes ADD COLUMN fecha_nacimiento DATE NULL AFTER empresa',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'cuenta_corriente') = 0,
  'ALTER TABLE clientes ADD COLUMN cuenta_corriente TINYINT(1) NOT NULL DEFAULT 0 AFTER fecha_nacimiento',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'clientes' AND COLUMN_NAME = 'notas_comerciales') = 0,
  'ALTER TABLE clientes ADD COLUMN notas_comerciales TEXT NULL AFTER cuenta_corriente',
  'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- ── Tablas marketing ──
CREATE TABLE IF NOT EXISTS campanas_marketing (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(150) NOT NULL,
    mensaje_plantilla TEXT       NOT NULL,
    rubro_objetivo  VARCHAR(80)  NULL,
    fecha_inicio    DATE         NULL,
    fecha_fin       DATE         NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plantillas_mensajes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    plantilla   TEXT         NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

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

CREATE TABLE IF NOT EXISTS envios_marketing (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id      INT          NOT NULL,
    tipo_campana    VARCHAR(80)  NOT NULL,
    mensaje         TEXT         NOT NULL,
    estado          ENUM('sugerido','enviado','descartado') NOT NULL DEFAULT 'sugerido',
    fecha_programada DATE        NULL,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_envios_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS campana_archivos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    campana_id      INT          NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    ruta            VARCHAR(255) NOT NULL,
    tipo            VARCHAR(50)  NOT NULL,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_archivos_campana FOREIGN KEY (campana_id)
        REFERENCES campanas_marketing(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO plantillas_mensajes (codigo, nombre, plantilla) VALUES
('cumpleanos_hoy', 'Cumpleaños del día',
 '¡Feliz cumpleaños {{nombre}}! Desde Electricidad Ituarte Sur te regalamos un 15% de descuento en luminaria de interior válido por 7 días. ¡Te esperamos en sucursal!'),
('cumpleanos_proximo', 'Cumpleaños próximo',
 'Hola {{nombre}}, desde Ituarte Sur te adelantamos nuestras felicitaciones por tu cumpleaños. Tenemos promociones en iluminación pensadas para vos. ¡Consultanos!'),
('cuenta_corriente', 'Cliente con cuenta corriente',
 'Hola {{nombre}}, desde Electricidad Ituarte Sur queremos contarte las novedades del mes en iluminación. Como cliente con cuenta corriente tenés condiciones especiales. ¿Coordinamos una visita?')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

INSERT INTO dias_especiales (nombre, mes, dia, rubro_objetivo, plantilla)
SELECT * FROM (
  SELECT 'Día del Arquitecto' AS nombre, 6 AS mes, 1 AS dia, 'arquitecto' AS rubro_objetivo,
    'Hola {{nombre}}, desde Electricidad Ituarte Sur te saludamos en tu día. Tenemos novedades en luminaria de diseño. ¡Consultanos!' AS plantilla
  UNION ALL SELECT 'Día del Ingeniero', 6, 16, 'ingeniero',
    'Hola {{nombre}}, feliz Día del Ingeniero. En Ituarte Sur tenemos soluciones en iluminación industrial y técnica.'
  UNION ALL SELECT 'Día del Electricista', 8, 24, 'electricista',
    'Hola {{nombre}}, ¡feliz Día del Electricista! Promos en herramientas, materiales e iluminación en Ituarte Sur.'
  UNION ALL SELECT 'Día del Diseñador de Interiores', 9, 29, 'diseñador_interiores',
    'Hola {{nombre}}, celebramos tu día con novedades en luminaria de diseño en Ituarte Sur.'
) AS nuevos
WHERE NOT EXISTS (SELECT 1 FROM dias_especiales LIMIT 1);

SELECT 'Marketing producción OK' AS resultado;
SELECT COUNT(*) AS dias_especiales FROM dias_especiales;
SELECT COUNT(*) AS plantillas FROM plantillas_mensajes;
