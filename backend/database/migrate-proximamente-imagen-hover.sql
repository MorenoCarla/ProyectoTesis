-- Fotomontaje al pasar el mouse (opcional por producto)
USE crm_ituarte;

SET @col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'proximamente_items' AND COLUMN_NAME = 'imagen_hover'
);
SET @sql := IF(@col = 0,
  'ALTER TABLE proximamente_items ADD COLUMN imagen_hover VARCHAR(500) NULL AFTER imagen',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
