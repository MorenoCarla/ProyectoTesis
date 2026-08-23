-- ============================================================
-- Módulo Marketing / Promociones segmentadas
-- Ejecutar en MySQL Workbench (NO borra datos)
-- ============================================================
USE crm_ituarte;

-- Perfil comercial ampliado del cliente
ALTER TABLE clientes
  ADD COLUMN tipo_cliente ENUM('particular','profesional','empresa','municipalidad') DEFAULT 'particular' AFTER ciudad,
  ADD COLUMN rubro VARCHAR(80) NULL COMMENT 'arquitecto, electricista, ingeniero, etc.' AFTER tipo_cliente,
  ADD COLUMN empresa VARCHAR(150) NULL AFTER rubro,
  ADD COLUMN fecha_nacimiento DATE NULL AFTER empresa,
  ADD COLUMN cuenta_corriente TINYINT(1) NOT NULL DEFAULT 0 AFTER fecha_nacimiento,
  ADD COLUMN notas_comerciales TEXT NULL AFTER cuenta_corriente;

-- Días especiales del calendario comercial (automatización por reglas)
CREATE TABLE IF NOT EXISTS dias_especiales (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    mes             TINYINT      NOT NULL,
    dia             TINYINT      NOT NULL,
    rubro_objetivo  VARCHAR(80)  NULL COMMENT 'NULL = todos los clientes',
    plantilla       TEXT         NOT NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Historial de contactos/promos sugeridos o enviados
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

-- Calendario comercial Ituarte (fechas profesionales Argentina)
INSERT INTO dias_especiales (nombre, mes, dia, rubro_objetivo, plantilla) VALUES
('Día del Arquitecto', 6, 1, 'arquitecto',
 'Hola {{nombre}}, desde Electricidad Ituarte te saludamos en tu día. Tenemos novedades en luminaria de diseño y asesoramiento para proyectos. ¡Consultanos con descuento especial!'),
('Día del Ingeniero', 6, 16, 'ingeniero',
 'Hola {{nombre}}, feliz Día del Ingeniero. En Ituarte tenemos soluciones en iluminación industrial y técnica para tus obras. Te esperamos en sucursal.'),
('Día del Electricista', 8, 24, 'electricista',
 'Hola {{nombre}}, ¡feliz Día del Electricista! Tenemos promos en herramientas, materiales e iluminación. Como cliente Ituarte accedés a beneficios exclusivos.'),
('Día del Diseñador de Interiores', 9, 29, 'diseñador_interiores',
 'Hola {{nombre}}, celebramos tu día con novedades en luminaria de diseño. Coordiná una visita a nuestro showroom con tu asesor Ituarte.');

-- Datos de ejemplo en clientes existentes
UPDATE clientes SET tipo_cliente='profesional', rubro='electricista', cuenta_corriente=1,
  fecha_nacimiento='1990-03-15', empresa='Instalaciones Sur' WHERE id=1;
UPDATE clientes SET tipo_cliente='profesional', rubro='arquitecto', cuenta_corriente=0,
  fecha_nacimiento='1985-07-22', empresa='Estudio López' WHERE id=2;

SELECT 'Marketing module OK' AS resultado;
