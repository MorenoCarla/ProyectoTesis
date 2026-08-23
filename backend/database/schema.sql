-- ============================================================
-- CRM ITUARTE - Base de datos normalizada (3FN)
-- Proyecto de Tesis - Electricidad Ituarte
-- ============================================================
-- Ejecutar en MySQL Workbench o: mysql -u root -p < schema.sql
-- ============================================================

DROP DATABASE IF EXISTS crm_ituarte;
CREATE DATABASE crm_ituarte CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crm_ituarte;

-- ------------------------------------------------------------
-- 1. ROLES (tabla de referencia - evita repetir "admin" en texto)
-- ------------------------------------------------------------
CREATE TABLE roles (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(50)  NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO roles (nombre, descripcion) VALUES
('admin',   'Administrador del sistema - acceso total al CRM'),
('empleado','Empleado de Ituarte - gestiona consultas y clientes'),
('cliente', 'Cliente registrado - ve sus consultas y puede crear nuevas');

-- ------------------------------------------------------------
-- 2. USUARIOS (login, contraseñas, recuperación)
-- Relacionado con: roles (N:1)
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    rol_id              INT          NOT NULL,
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100) NOT NULL DEFAULT '',
    email               VARCHAR(150) NOT NULL UNIQUE,
    password_hash       VARCHAR(255) NOT NULL,
    telefono            VARCHAR(30),
    token_recuperacion  VARCHAR(255) NULL,
    token_expiracion    DATETIME     NULL,
    activo              TINYINT(1)   NOT NULL DEFAULT 1,
    eliminado_en        DATETIME     NULL,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_rol FOREIGN KEY (rol_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- Usuarios de demostración (contraseña inicial: Admin123!)
INSERT INTO usuarios (rol_id, nombre, apellido, email, password_hash, telefono) VALUES
(1, 'Carla', 'Ituarte', 'gerente.demo@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL),
(2, 'María', 'González', 'empleado.demo@example.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL),
(3, 'Juan', 'Pérez', 'cliente@ejemplo.com',
 '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NULL);

-- ------------------------------------------------------------
-- 3. EMPLEADOS (extiende usuarios con datos laborales)
-- Relacionado con: usuarios (1:1)
-- ------------------------------------------------------------
CREATE TABLE empleados (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT          NOT NULL UNIQUE,
    cargo       VARCHAR(100) NOT NULL DEFAULT 'Vendedor',
    sucursal    VARCHAR(100) NOT NULL DEFAULT 'Concepción',
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_empleados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO empleados (usuario_id, cargo, sucursal) VALUES
(1, 'Gerente comercial', 'Concepción'),
(2, 'Asesora comercial', 'Alberdi');

-- ------------------------------------------------------------
-- 4. CLIENTES (personas que contactan o compran)
-- Relacionado con: usuarios (1:1 opcional - si se registran)
-- SOFT DELETE: activo=0, no se borra físicamente
-- ------------------------------------------------------------
CREATE TABLE clientes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id  INT          NULL UNIQUE,
    nombre      VARCHAR(100) NOT NULL,
    apellido    VARCHAR(100) NOT NULL DEFAULT '',
    email       VARCHAR(150) NOT NULL,
    telefono    VARCHAR(30),
    ciudad      VARCHAR(100),
    activo      TINYINT(1)   NOT NULL DEFAULT 1,
    eliminado_en DATETIME    NULL,
    creado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_clientes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

INSERT INTO clientes (usuario_id, nombre, apellido, email, telefono, ciudad) VALUES
(3, 'Juan', 'Pérez', 'cliente@ejemplo.com', '2222222222', 'Concepción'),
(NULL, 'Ana', 'López', 'ana.lopez@mail.com', '3333333333', 'Alberdi');

-- ------------------------------------------------------------
-- 5. TIPOS DE CONSULTA (normalización - no repetir strings)
-- ------------------------------------------------------------
CREATE TABLE tipos_consulta (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

INSERT INTO tipos_consulta (nombre, descripcion) VALUES
('Consulta técnica',      'Dudas sobre instalación, productos, normativas'),
('Consulta comercial',    'Precios, presupuestos, disponibilidad'),
('Asesoramiento lumínico','Proyectos de iluminación personalizados'),
('Queja o reclamo',       'Problemas con productos o servicio'),
('Solicitud de producto', 'Interés en un producto del catálogo web');

-- ------------------------------------------------------------
-- 6. CONSULTAS (cada contacto, queja o pedido del cliente)
-- Relacionado con: clientes, empleados, tipos_consulta
-- CRUD principal #1 de la tesis
-- ------------------------------------------------------------
CREATE TABLE consultas (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id          INT          NOT NULL,
    empleado_id         INT          NULL,
    tipo_consulta_id    INT          NOT NULL,
    producto_interes    VARCHAR(200),
    mensaje             TEXT         NOT NULL,
    estado              ENUM('pendiente','en_proceso','finalizado','cancelado') NOT NULL DEFAULT 'pendiente',
    prioridad           ENUM('baja','media','alta') NOT NULL DEFAULT 'media',
    fecha_seguimiento   DATETIME     NULL,
    activo              TINYINT(1)   NOT NULL DEFAULT 1,
    eliminado_en        DATETIME     NULL,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_consultas_cliente  FOREIGN KEY (cliente_id)       REFERENCES clientes(id),
    CONSTRAINT fk_consultas_empleado FOREIGN KEY (empleado_id)     REFERENCES empleados(id),
    CONSTRAINT fk_consultas_tipo   FOREIGN KEY (tipo_consulta_id) REFERENCES tipos_consulta(id)
) ENGINE=InnoDB;

INSERT INTO consultas (cliente_id, empleado_id, tipo_consulta_id, producto_interes, mensaje, estado, prioridad) VALUES
(1, 2, 1, 'Reflectores LED', 'Necesito asesoramiento para iluminar un galpón de 200m2', 'en_proceso', 'alta'),
(2, NULL, 2, 'Catálogo general', 'Quiero cotización para iluminación de local comercial', 'pendiente', 'media');

-- ------------------------------------------------------------
-- 7. SEGUIMIENTOS (notas de cada contacto con el cliente)
-- Relacionado con: consultas, empleados
-- CRUD principal #2 de la tesis
-- ------------------------------------------------------------
CREATE TABLE seguimientos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id         INT          NOT NULL,
    empleado_id         INT          NOT NULL,
    nota                TEXT         NOT NULL,
    proximo_contacto    DATETIME     NULL,
    creado_en           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seguimientos_consulta  FOREIGN KEY (consulta_id)  REFERENCES consultas(id),
    CONSTRAINT fk_seguimientos_empleado  FOREIGN KEY (empleado_id)  REFERENCES empleados(id)
) ENGINE=InnoDB;

INSERT INTO seguimientos (consulta_id, empleado_id, nota, proximo_contacto) VALUES
(1, 2, 'Cliente contactado por teléfono. Enviar presupuesto de reflectores 100W.', DATE_ADD(NOW(), INTERVAL 3 DAY));

-- ------------------------------------------------------------
-- 8. HISTORIAL DE ESTADOS (auditoría - quién cambió qué y cuándo)
-- Relacionado con: consultas, empleados
-- ------------------------------------------------------------
CREATE TABLE historial_estados (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    consulta_id     INT          NOT NULL,
    empleado_id     INT          NULL,
    estado_anterior VARCHAR(30)  NOT NULL,
    estado_nuevo    VARCHAR(30)  NOT NULL,
    observacion     VARCHAR(500),
    creado_en       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_consulta  FOREIGN KEY (consulta_id) REFERENCES consultas(id),
    CONSTRAINT fk_historial_empleado FOREIGN KEY (empleado_id) REFERENCES empleados(id)
) ENGINE=InnoDB;

INSERT INTO historial_estados (consulta_id, empleado_id, estado_anterior, estado_nuevo, observacion) VALUES
(1, 2, 'pendiente', 'en_proceso', 'Consulta asignada a María González');

-- ------------------------------------------------------------
-- ÍNDICES para rendimiento
-- ------------------------------------------------------------
CREATE INDEX idx_clientes_email    ON clientes(email);
CREATE INDEX idx_clientes_activo   ON clientes(activo);
CREATE INDEX idx_consultas_estado  ON consultas(estado);
CREATE INDEX idx_consultas_cliente ON consultas(cliente_id);
CREATE INDEX idx_usuarios_email    ON usuarios(email);
