# Proyecto Tesis — CRM Ituarte

Trabajo Final Integrador (UTN): sitio web institucional y **CRM comercial** para Electricidad Ituarte (Concepción, Tucumán).

## Qué incluye

- **Sitio web:** catálogo por categorías, fichas de producto, contacto, diseño responsive.
- **CRM:** login con roles (gerente / empleado / cliente), consultas, clientes, seguimientos, marketing, presupuestos PDF, reportes Excel.
- **Backend:** Node.js, Express, MySQL.
- **Documentación:** manual y carpeta TFI (carpeta `documentacion/` en tu PC; no está en el repo público).

## Requisitos

- [Node.js](https://nodejs.org/) 18+
- [MySQL](https://dev.mysql.com/) 8+ (Workbench o línea de comandos)

## Instalación rápida

```bash
# 1. Clonar
git clone https://github.com/MorenoCarla/ProyectoTesis.git
cd ProyectoTesis

# 2. Base de datos
# Importar en MySQL: backend/database/schema.sql

# 3. Backend
cd backend
copy .env.example .env    # Windows — en Mac/Linux: cp .env.example .env
# Editar .env con tu usuario/contraseña de MySQL y un JWT_SECRET propio
npm install
npm run passwords         # deja usuarios demo con contraseña Admin123!

# 4. Arrancar
npm start
```

Abrí **http://localhost:3000/login.html**

### Usuarios de demostración (después de `npm run passwords`)

| Email | Rol | Contraseña |
|-------|-----|------------|
| `gerente.demo@example.com` | Gerente (admin) | `Admin123!` |
| `empleado.demo@example.com` | Empleada comercial | `Admin123!` |
| `cliente@ejemplo.com` | Cliente | `Admin123!` |

## Seguridad del repositorio

- **No se suben** contraseñas reales ni archivos `.env` (ver `.gitignore`).
- Los PDFs y adjuntos de usuarios viven en `backend/uploads/` (ignorados por Git).
- Configurá `JWT_SECRET` y `DB_PASSWORD` solo en tu `.env` local.

## Estructura

```
ProyectoTesis/
├── index.html, catalogo.html, crm-admin.html …   # Frontend
├── css/, js/, img/
├── backend/
│   ├── server.js
│   ├── routes/
│   ├── database/schema.sql
│   └── uploads/          # no versionado (solo .gitkeep)
```

## Demo en vivo

GitHub **no ejecuta** el CRM solo con mirar el repo. Para ver la app hay que clonar, importar la base y levantar el backend (pasos de arriba). Para un portfolio, podés agregar capturas en este README o un enlace a video.

## Autora

Carla Moreno — Proyecto de tesis UTN.

## Licencia

Proyecto académico. Consultar antes de uso comercial.
