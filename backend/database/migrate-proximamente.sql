-- Vitrina "Próximamente" — interés + likes (ejecutar una vez en crm_ituarte)
USE crm_ituarte;

CREATE TABLE IF NOT EXISTS proximamente_items (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    titulo              VARCHAR(200) NOT NULL,
    subtitulo           VARCHAR(255) NULL,
    descripcion         TEXT NULL,
    imagen              VARCHAR(500) NOT NULL,
    categoria_etiqueta  VARCHAR(120) NULL COMMENT 'Ej. Smart, Pileta, Interior',
    orden               INT NOT NULL DEFAULT 0,
    activo              TINYINT(1) NOT NULL DEFAULT 1,
    publicado           TINYINT(1) NOT NULL DEFAULT 1,
    likes_count         INT NOT NULL DEFAULT 0,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_prox_publicado (publicado, activo, orden)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proximamente_likes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    item_id     INT NOT NULL,
    visitor_key VARCHAR(64) NOT NULL,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_prox_item_visitor (item_id, visitor_key),
    CONSTRAINT fk_prox_like_item FOREIGN KEY (item_id) REFERENCES proximamente_items(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tipos_consulta (nombre, descripcion)
SELECT 'Interés — Próximamente', 'Consulta desde vitrina Próximamente (evaluar traer producto)'
WHERE NOT EXISTS (
  SELECT 1 FROM tipos_consulta WHERE nombre = 'Interés — Próximamente'
);

-- Vincular consultas al ítem (si la columna no existe)
SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'consultas' AND COLUMN_NAME = 'proximamente_item_id'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE consultas ADD COLUMN proximamente_item_id INT NULL AFTER producto_interes,
   ADD INDEX idx_consultas_prox (proximamente_item_id)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
