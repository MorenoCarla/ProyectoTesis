-- ============================================================
-- Campañas personalizadas + plantillas editables
-- Ejecutar en MySQL Workbench (NO borra datos)
-- ============================================================
USE crm_ituarte;

-- Campañas que crea la dueña (ej: "Semana del LED")
CREATE TABLE IF NOT EXISTS campanas_marketing (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    titulo          VARCHAR(150) NOT NULL,
    mensaje_plantilla TEXT       NOT NULL,
    rubro_objetivo  VARCHAR(80)  NULL COMMENT 'NULL = todos los clientes',
    fecha_inicio    DATE         NULL,
    fecha_fin       DATE         NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Plantillas de mensajes automáticos (cumpleaños, cuenta corriente, etc.)
CREATE TABLE IF NOT EXISTS plantillas_mensajes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    codigo      VARCHAR(50)  NOT NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    plantilla   TEXT         NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO plantillas_mensajes (codigo, nombre, plantilla) VALUES
('cumpleanos_hoy', 'Cumpleaños del día',
 '¡Feliz cumpleaños {{nombre}}! Desde Electricidad Ituarte te regalamos un 15% de descuento en luminaria de interior válido por 7 días. ¡Te esperamos en sucursal!'),
('cumpleanos_proximo', 'Cumpleaños próximo',
 'Hola {{nombre}}, desde Ituarte te adelantamos nuestras felicitaciones por tu cumpleaños. Tenemos promociones en iluminación pensadas para vos. ¡Consultanos!'),
('cuenta_corriente', 'Cliente con cuenta corriente',
 'Hola {{nombre}}, desde Electricidad Ituarte queremos contarte las novedades del mes en {{rubro}} e iluminación. Como cliente con cuenta corriente tenés condiciones especiales. ¿Coordinamos una visita?')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

SELECT 'Plantillas y campañas OK' AS resultado;
