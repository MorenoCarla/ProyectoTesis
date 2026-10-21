-- Catálogo v3: características en JSON, colores con código+imagen/hex, flag sin colores
-- Ejecutar en crm_ituarte (MySQL 8+)

ALTER TABLE productos_catalogo
  ADD COLUMN caracteristicas_json JSON NULL COMMENT 'Array de strings, ej. ["50w","6000k"]' AFTER caracteristicas;

ALTER TABLE productos_catalogo
  ADD COLUMN colores_json JSON NULL COMMENT 'Array {codigo, imagen?, hex?, etiqueta?}' AFTER codigos_json;

ALTER TABLE productos_catalogo
  ADD COLUMN sin_colores TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = ficha sin bloque código/colores' AFTER colores_json;
