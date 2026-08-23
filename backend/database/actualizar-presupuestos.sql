-- ============================================================
-- Módulo Presupuestos (PDF por cliente)
-- Ejecutar en MySQL Workbench (NO borra datos existentes)
-- ============================================================
USE crm_ituarte;

CREATE TABLE IF NOT EXISTS presupuestos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id      INT          NOT NULL,
    empleado_id     INT          NULL COMMENT 'Empleado que elaboró el presupuesto',
    titulo          VARCHAR(200) NOT NULL DEFAULT 'Presupuesto',
    numero          VARCHAR(80)  NULL COMMENT 'N° de presupuesto interno (opcional)',
    notas           TEXT         NULL,
    nombre_archivo  VARCHAR(255) NOT NULL COMMENT 'Nombre original del PDF',
    ruta_archivo    VARCHAR(255) NOT NULL COMMENT 'Nombre guardado en disco',
    tamano_bytes    INT          NULL,
    activo          TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_presupuestos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    CONSTRAINT fk_presupuestos_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id)
) ENGINE=InnoDB;

CREATE INDEX idx_presupuestos_cliente ON presupuestos(cliente_id);
CREATE INDEX idx_presupuestos_creado ON presupuestos(creado_en);
