-- ============================================================
-- Archivos adjuntos de campañas (placas, videos, etc.)
-- Ejecutar en MySQL Workbench (NO borra datos)
-- ============================================================
USE crm_ituarte;

CREATE TABLE IF NOT EXISTS campana_archivos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    campana_id      INT          NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    ruta            VARCHAR(255) NOT NULL,
    tipo            VARCHAR(50)  NOT NULL COMMENT 'imagen, video, documento',
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_archivos_campana FOREIGN KEY (campana_id)
        REFERENCES campanas_marketing(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SELECT 'Tabla campana_archivos OK' AS resultado;
