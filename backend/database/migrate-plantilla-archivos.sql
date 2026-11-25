-- Placas / imágenes para plantillas automáticas y días del calendario
USE crm_ituarte;

CREATE TABLE IF NOT EXISTS plantilla_archivos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    tipo_entidad    ENUM('plantilla', 'dia_especial') NOT NULL,
    ref_codigo      VARCHAR(50)  NULL COMMENT 'codigo en plantillas_mensajes',
    ref_id          INT          NULL COMMENT 'id en dias_especiales',
    nombre_original VARCHAR(255) NOT NULL,
    ruta            VARCHAR(255) NOT NULL,
    tipo            VARCHAR(20)  NOT NULL DEFAULT 'imagen',
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pa_plantilla (tipo_entidad, ref_codigo),
    INDEX idx_pa_dia (tipo_entidad, ref_id)
) ENGINE=InnoDB;

SELECT 'plantilla_archivos OK' AS resultado;