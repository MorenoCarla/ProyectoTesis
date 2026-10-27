-- Ideas home: destacado arriba (autoplay) vs carrusel abajo (independientes)

ALTER TABLE productos_catalogo
  ADD COLUMN home_ideas_hero TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Fotomontaje grande Ideas (autoplay)' AFTER home_ideas_orden;

ALTER TABLE productos_catalogo
  ADD COLUMN home_ideas_hero_orden INT NOT NULL DEFAULT 0 AFTER home_ideas_hero;

ALTER TABLE productos_catalogo
  ADD COLUMN home_ideas_lead VARCHAR(255) NULL COMMENT 'Ej. Apto para cocina, living…' AFTER home_ideas_hero_orden;
