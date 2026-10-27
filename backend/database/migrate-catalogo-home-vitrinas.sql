-- Vitrinas curadas en Home (Novedades / Ideas / Productos nuevos)
-- Ejecutar en crm_ituarte (MySQL 8+)

ALTER TABLE productos_catalogo
  ADD COLUMN home_novedades TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Carrusel Novedades en index' AFTER publicado;

ALTER TABLE productos_catalogo
  ADD COLUMN home_novedades_orden INT NOT NULL DEFAULT 0 AFTER home_novedades;

ALTER TABLE productos_catalogo
  ADD COLUMN home_novedades_lead VARCHAR(255) NULL COMMENT 'Texto opcional del slide' AFTER home_novedades_orden;

ALTER TABLE productos_catalogo
  ADD COLUMN home_ideas TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Grilla Ideas en index' AFTER home_novedades_lead;

ALTER TABLE productos_catalogo
  ADD COLUMN home_ideas_orden INT NOT NULL DEFAULT 0 AFTER home_ideas;

ALTER TABLE productos_catalogo
  ADD COLUMN home_nuevos TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Fila Productos nuevos en index' AFTER home_ideas_orden;

ALTER TABLE productos_catalogo
  ADD COLUMN home_nuevos_orden INT NOT NULL DEFAULT 0 AFTER home_nuevos;

ALTER TABLE productos_catalogo
  ADD COLUMN home_novedades_banner VARCHAR(500) NULL COMMENT 'Banner Canva para carrusel Novedades' AFTER home_novedades_lead;
