-- Campos para grilla web (ejecutar una vez en crm_ituarte)
-- Si alguna columna ya existe, ignorá el error de "Duplicate column".

USE crm_ituarte;

-- Si "Duplicate column", las columnas ya existen: saltá los ALTER.
ALTER TABLE productos_catalogo
  ADD COLUMN nombre_grilla VARCHAR(120) NULL AFTER nombre;

ALTER TABLE productos_catalogo
  ADD COLUMN imagen_portada VARCHAR(255) NULL AFTER imagenes_json;

-- Workbench en "safe updates" exige WHERE con clave (id)
UPDATE productos_catalogo
SET nombre_grilla = TRIM(SUBSTRING_INDEX(nombre, ' ', -1))
WHERE id > 0 AND (nombre_grilla IS NULL OR nombre_grilla = '');

UPDATE productos_catalogo
SET imagen_portada = JSON_UNQUOTE(JSON_EXTRACT(imagenes_json, '$[0]'))
WHERE id > 0
  AND (imagen_portada IS NULL OR imagen_portada = '')
  AND imagenes_json IS NOT NULL
  AND JSON_LENGTH(imagenes_json) > 0;
