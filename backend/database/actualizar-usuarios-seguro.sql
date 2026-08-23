-- Versión con emails de demo (sin teléfonos reales). Ejecutar en MySQL si migrás una base antigua.
USE crm_ituarte;

UPDATE usuarios SET email = 'temp1@example.com' WHERE id = 1;
UPDATE usuarios SET email = 'temp2@example.com' WHERE id = 2;

UPDATE usuarios SET
  nombre   = 'Carla',
  apellido = 'Ituarte',
  email    = 'gerente.demo@example.com',
  telefono = NULL
WHERE id = 1;

UPDATE usuarios SET
  nombre   = 'María',
  apellido = 'González',
  email    = 'empleado.demo@example.com',
  telefono = NULL
WHERE id = 2;

UPDATE empleados SET cargo = 'Gerente comercial', sucursal = 'Concepción' WHERE usuario_id = 1;
UPDATE empleados SET cargo = 'Asesora comercial',  sucursal = 'Alberdi'    WHERE usuario_id = 2;
