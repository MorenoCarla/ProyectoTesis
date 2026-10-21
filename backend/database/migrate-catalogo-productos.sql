-- Catálogo web administrable (NO borra datos del CRM existente)
-- Ejecutar en MySQL Workbench sobre la base crm_ituarte (una sola vez)

USE crm_ituarte;

CREATE TABLE IF NOT EXISTS categorias_catalogo (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    slug            VARCHAR(120) NOT NULL UNIQUE,
    pagina_listado  VARCHAR(120) NULL COMMENT 'Ej: colgantes.html',
    pdf_catalogo    VARCHAR(255) NULL COMMENT 'Ej: catalogo/catalogo-colgantes.pdf',
    activo          TINYINT(1) NOT NULL DEFAULT 1,
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos_catalogo (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    categoria_id        INT NOT NULL,
    nombre              VARCHAR(200) NOT NULL,
    slug                VARCHAR(120) NOT NULL UNIQUE COMMENT 'Nombre de archivo sin .html',
    pagina_html         VARCHAR(120) NOT NULL UNIQUE COMMENT 'Ej: zeth.html',
    subtitulo           VARCHAR(200) NULL,
    caracteristicas     TEXT NULL,
    descripcion_html    TEXT NULL,
    descripcion_texto   TEXT NULL,
    codigos_json        JSON NULL COMMENT 'Array de códigos de artículo',
    imagenes_json       JSON NULL COMMENT 'Array rutas img/...',
    pagina_categoria    VARCHAR(120) NULL COMMENT 'Link volver: colgantes.html',
    publicado           TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = visible en web',
    activo              TINYINT(1) NOT NULL DEFAULT 1 COMMENT '0 = baja lógica',
    orden               INT NOT NULL DEFAULT 0,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (categoria_id) REFERENCES categorias_catalogo(id),
    INDEX idx_producto_categoria (categoria_id),
    INDEX idx_producto_publicado (publicado, activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
