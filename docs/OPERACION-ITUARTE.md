# Operación diaria — Electricidad Ituarte (sitio + CRM)

Guía para uso en producción (local o servidor de la empresa).

## Arrancar el sistema

```bash
cd backend
npm install          # solo la primera vez o tras actualizar
npm start            # http://localhost:3000
```

Variables en `backend/.env`: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`.

- **Sitio público:** `http://localhost:3000` (o el dominio del servidor).
- **CRM gerente:** `http://localhost:3000/login.html` → usuario admin.
- **CRM empleada:** mismo login con rol empleado (consultas/clientes; catálogo según permisos).

Reiniciar Node después de cambios en `backend/`.

## Consultas desde la web

| Origen | Endpoint | Dónde se ven en CRM |
|--------|----------|---------------------|
| Ficha producto (`/p/slug`) | `POST /public/consulta` | Consultas → tipo **Solicitud de producto** |
| Contacto | mismo endpoint | Consultas → **Consulta comercial** / reclamos |

El formulario de ficha incluye producto, categoría y enlace `/p/slug` en el mensaje.

**Prueba rápida:** enviar consulta de prueba desde una ficha y buscarla en CRM en estado **pendiente**.

## Catálogo web (CRM → sitio)

1. Producto **publicado** + **activo** → aparece en grilla (API) y ficha `/p/{slug}`.
2. Editar nombre, fotos (1ª cruda, 2ª fotomontaje), descripción, **nombre en grilla**.
3. **Ver ficha** en el CRM abre `/p/{slug}` (no el HTML viejo).
4. **Republicar grillas:** en categorías **dinámicas** no reescribe HTML; la grilla se actualiza al guardar/publicar en BD. El botón solo regenera HTML en categorías aún estáticas.

## Backup MySQL (recomendado: diario)

Desde la carpeta `backend` (usa `.env`; no hace falta `mysqldump` en Windows):

```bash
cd backend
npm run backup-db
```

Genera `backend/backups/ituarte-AAAA-MM-DD.sql`. Si existe `mysqldump` en el PATH lo usa; si no, vuelca la base con Node (mysql2). Copiar esa carpeta a disco externo o nube.

Restaurar (solo si sabés lo que hacés):

```bash
mysql -u USUARIO -p NOMBRE_BD < backend/backups/archivo.sql
```

## Auditoría de catálogo

Revisa productos **publicados**: descripción, imágenes, PDF, portada grilla, placeholders, etc.

```bash
cd backend
npm run auditar-catalogo
```

Modo estricto (falla también por advertencias, útil antes de un deploy):

```bash
node scripts/auditar-catalogo-publico.js --strict
```

- **[CRÍTICO]**: conviene corregir ya (sin slug, sin fotos, grilla sin listado, archivos rotos).
- **[aviso]**: calidad comercial (texto corto, una sola imagen, sin subtítulo, PDF faltante).

Corregir en CRM → Catálogo, guardar, y volver a ejecutar.

## Producción (servidor real)

- Node en segundo plano: **PM2**, servicio Windows o tarea programada.
- **HTTPS** delante (nginx, Caddy o hosting).
- No commitear `.env`. Contraseñas solo en el servidor.
- Tras deploy: `npm start`, probar login CRM + una ficha + una consulta de prueba.

## Contacto técnico

Anotar quién mantiene el servidor, usuario MySQL y dónde están los backups.
