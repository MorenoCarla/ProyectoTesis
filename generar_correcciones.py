# -*- coding: utf-8 -*-
"""Genera documento Word (.docx) con resumen de correcciones del CRM Ituarte."""
import zipfile
import os
from xml.sax.saxutils import escape

OUTPUT = os.path.join(os.path.dirname(__file__), "Correcciones_CRM_Ituarte.docx")

def p(text, bold=False, size=22):
    t = escape(text)
    if bold:
        return f'<w:p><w:r><w:rPr><w:b/><w:sz w:val="{size}"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r></w:p>'
    return f'<w:p><w:r><w:rPr><w:sz w:val="{size}"/></w:rPr><w:t xml:space="preserve">{t}</w:t></w:r></w:p>'

def h1(text):
    return p(text, bold=True, size=32)

def h2(text):
    return p(text, bold=True, size=26)

def blank():
    return '<w:p/>'

sections = []

sections.append(h1("Correcciones realizadas — CRM Electricidad Ituarte"))
sections.append(p("Proyecto de Tesis — Carla Guadalupe Moreno"))
sections.append(p("Tecnicatura Universitaria en Programación — UTN Concepción, Tucumán"))
sections.append(p("Documento preparado para la clase de consulta — Agosto 2026"))
sections.append(blank())

sections.append(h2("1. Resumen ejecutivo"))
sections.append(p("Este documento resume todas las correcciones implementadas en el CRM de Electricidad Ituarte, organizadas en dos bloques: (A) lo pedido por la profesora/ingeniera en la consulta del 31 de julio de 2026 y (B) mejoras adicionales realizadas antes o durante el desarrollo del proyecto, que también suman valor al sistema."))
sections.append(p("La profesora indicó que el proyecto avanzó mucho y que está completamente distinto a la presentación anterior. Las correcciones posteriores fueron principalmente de pulido y profesionalización."))
sections.append(blank())

sections.append(h2("2. Correcciones pedidas por la profesora (consulta 31/07/2026)"))
sections.append(blank())

sections.append(p("Corrección 1 — Consultas: mostrar solo lo relevante", bold=True))
sections.append(p("• Problema: la pantalla traía todas las consultas de la base de datos, aunque hubiera paginación en pantalla."))
sections.append(p("• Solución: el backend ahora filtra en MySQL antes de enviar datos. Por defecto solo se muestran consultas activas (pendientes + en proceso) de los últimos 30 días."))
sections.append(p("• Vista agrupada por estado (más nuevas primero), no una tabla infinita."))
sections.append(p("• Filtros: Activas, Pendientes, En proceso, Finalizadas, Canceladas, Todas."))
sections.append(p("• Buscador que filtra en el servidor. Historial completo solo bajo demanda."))
sections.append(p("• Archivos: backend/routes/consultas.routes.js, js/crm-admin.js, crm-admin.html"))
sections.append(blank())

sections.append(p("Corrección 2 — Clientes: mismo criterio + capitalización", bold=True))
sections.append(p("• Problema: se listaban todos los clientes y los nombres/ciudades se guardaban mal si el usuario escribía en minúsculas."))
sections.append(p("• Solución: paginación y filtros en el backend (no trae toda la base). Vista por defecto: clientes activos recientes."))
sections.append(p("• Capitalización automática de nombre, apellido, ciudad y empresa al guardar (ej: 'juan' → 'Juan', 'concepción' → 'Concepción')."))
sections.append(p("• Archivos: backend/routes/clientes.routes.js, backend/utils/texto.js, js/crm-admin.js"))
sections.append(blank())

sections.append(p("Corrección 3 — Marketing: organizar en pestañas internas", bold=True))
sections.append(p("• Problema: la sección Marketing era una página muy larga con scroll infinito."))
sections.append(p("• Solución: pestañas internas dentro de Marketing: Calendario comercial, Campañas, Oportunidades de contacto, Plantillas automáticas."))
sections.append(p("• Cada pestaña carga sus datos al abrirla."))
sections.append(p("• Archivos: crm-admin.html, js/crm-admin.js, css/crm.css"))
sections.append(blank())

sections.append(p("Corrección 4 — Marketing: historial liviano y sin duplicados", bold=True))
sections.append(p("• Problema: si marcaba 'enviado' muchas veces o había miles de clientes, el historial se acumulaba y la base traía demasiada información."))
sections.append(p("• Solución: se eliminó la pestaña Historial. Al marcar enviado, la tarjeta se pone verde y desaparece de pendientes."))
sections.append(p("• No permite registrar el mismo contacto dos veces en 7 días."))
sections.append(p("• El backend ya no carga todos los clientes de golpe: consultas SQL específicas por cumpleaños, campañas, rubro, etc."))
sections.append(p("• Resumen con chip 'X enviados (7 días)' en lugar de lista histórica infinita."))
sections.append(p("• Archivos: backend/routes/marketing.routes.js, js/crm-admin.js"))
sections.append(blank())

sections.append(p("Corrección 5 — Reportes profesionales y separados por área", bold=True))
sections.append(p("• Problema: un solo reporte genérico, poco profesional, sin identidad de la empresa."))
sections.append(p("• Solución: sección Reportes con descargas separadas en PDF y Excel:"))
sections.append(p("  - Resumen gerencial (KPIs del dashboard)"))
sections.append(p("  - Consultas"))
sections.append(p("  - Clientes"))
sections.append(p("  - Seguimientos"))
sections.append(p("  - Marketing (envíos y campañas)"))
sections.append(p("• Diseño con logo Ituarte, encabezado, colores corporativos (rojo #c62828), pie de página."))
sections.append(p("• PDF en formato A4 vertical, columnas proporcionales para que no se corten datos."))
sections.append(p("• Excel con una hoja, columnas auto-ajustadas y encabezado formateado."))
sections.append(p("• Solo accesible para el rol gerente (admin)."))
sections.append(p("• Archivos: backend/utils/reportes.js, backend/routes/export.routes.js, crm-admin.html"))
sections.append(blank())

sections.append(p("Corrección 6 — Interfaz distinta para gerente y empleado", bold=True))
sections.append(p("• Problema: gerente y empleado veían exactamente lo mismo."))
sections.append(p("• Solución gerente (Panel gerencial — borde rojo en menú):"))
sections.append(p("  - Dashboard global con KPIs de toda la empresa"))
sections.append(p("  - Consultas completas con historial y asignación"))
sections.append(p("  - Reportes, empleados, campañas, plantillas, calendario editable"))
sections.append(p("• Solución empleado (Panel operativo — borde azul):"))
sections.append(p("  - 'Mi día' con sus consultas, seguimientos y tareas"))
sections.append(p("  - Filtros: Mis consultas, Sin asignar, Finalizadas propias"))
sections.append(p("  - Botón 'Tomar consulta' en consultas sin asignar"))
sections.append(p("  - Marketing limitado: calendario + oportunidades (sin campañas ni plantillas)"))
sections.append(p("  - Sin acceso a Reportes ni gestión de empleados"))
sections.append(p("• Archivos: backend/routes/dashboard.routes.js, backend/routes/consultas.routes.js, js/crm-admin.js, crm-admin.html, css/crm.css"))
sections.append(blank())

sections.append(p("Corrección 7 — Dashboard del gerente rediseñado", bold=True))
sections.append(p("• Problema: colores genéricos (amarillo/azul/verde) que no representaban Ituarte; gráfico poco profesional; pocos datos."))
sections.append(p("• Solución: nuevo 'Resumen gerencial' con identidad visual Ituarte:"))
sections.append(p("  - Encabezado con logo y bienvenida personalizada"))
sections.append(p("  - 8 KPIs: clientes activos, consultas activas, pendientes, sin asignar, consultas hoy, últimos 7 días, contactos marketing (30d), cuentas corrientes"))
sections.append(p("  - Gráfico donut (estados) + barras horizontales rojas (tipos de consulta)"))
sections.append(p("  - Paneles: clientes por rubro, próximos seguimientos, consultas recientes clickeables"))
sections.append(p("  - Paleta rojo Ituarte (#c62828) + grises"))
sections.append(p("• El dashboard del empleado ('Mi día') ya estaba diferenciado y no requirió cambios."))
sections.append(p("• Archivos: crm-admin.html, js/crm-admin.js, css/crm.css, backend/routes/dashboard.routes.js"))
sections.append(blank())

sections.append(h2("3. Correcciones anteriores (requisitos iniciales de la profesora)"))
sections.append(p("Estas correcciones se implementaron en etapas previas, cuando la profesora indicó que el proyecto estaba 'en cero' y faltaban elementos fundamentales:"))
sections.append(blank())

items_previos = [
    ("Base de datos normalizada (3FN)", "De una sola tabla de clientes a 8+ tablas relacionadas: roles, usuarios, empleados, clientes, tipos_consulta, consultas, seguimientos, historial_estados. Con IDs, claves foráneas y soft delete.", "backend/database/schema.sql"),
    ("CRUD en múltiples entidades", "Alta, baja (soft delete), modificación y consulta en clientes, consultas, seguimientos, empleados y campañas.", "backend/routes/*.routes.js"),
    ("Roles de usuario", "Tres roles: admin (gerente), empleado y cliente. Login con JWT y permisos por rol.", "backend/middleware/auth.js"),
    ("Recuperar contraseña", "Flujo completo con token en base de datos y pantalla restablecer.html.", "backend/routes/auth.routes.js, recuperar.html"),
    ("Panel CRM con menú lateral", "Dashboard, consultas, clientes, seguimientos, marketing, reportes, empleados.", "crm-admin.html"),
    ("Seguimientos", "Programar seguimientos por consulta con fecha, prioridad y estado.", "backend/routes/seguimientos.routes.js"),
    ("Portal del cliente", "El cliente puede registrarse, ver sus consultas y crear nuevas.", "portal-cliente.html, js/crm-cliente.js"),
    ("Formularios profesionales del sitio", "4 pestañas en contacto: Técnica, Comercial, Asesoramiento y Quejas/Reclamos. Campos ampliados.", "contacto.html, js/scriptcontacto.js"),
    ("Usuarios con nombres reales", "Ya no 'admin' genérico: Carla (gerente), María (empleada), clientes con nombre.", "backend/database/schema.sql"),
    ("Gestión de empleados", "La gerente puede dar de alta empleados nuevos desde el CRM.", "backend/routes/empleados.routes.js"),
    ("Módulo de marketing", "Cumpleaños, días especiales por rubro, campañas, cuenta corriente (1° de cada mes), plantillas editables.", "backend/routes/marketing.routes.js"),
    ("Calendario comercial anual", "Calendario con colores por rubro, notificación de días especiales, agregar fechas desde el CRM.", "js/crm-admin.js, crm-admin.html"),
    ("Perfil comercial del cliente", "Rubro, tipo de cliente, cuenta corriente, fecha de nacimiento, empresa, notas comerciales.", "backend/database/actualizar-marketing.sql"),
]

for title, desc, files in items_previos:
    sections.append(p(f"• {title}", bold=True))
    sections.append(p(desc))
    sections.append(p(f"  Archivos: {files}"))
    sections.append(blank())

sections.append(h2("4. Mejoras adicionales (fuera de correcciones de la profesora)"))
sections.append(blank())

items_extra = [
    ("Paginación en Clientes y Consultas", "Botones Anterior/Siguiente, 20 registros por página (pedido por Carla para cuando haya muchos datos)."),
    ("Buscador y filtros en Marketing", "Oportunidades agrupadas por cliente, pestañas por categoría (urgente, semana, campañas), filtro por rubro, paginación."),
    ("Cuenta corriente el 1° de cada mes", "Recordatorios automáticos solo el primer día del mes, no todos los días."),
    ("Fecha en el header del CRM", "Fecha actual visible para gerente y empleados."),
    ("Ojitos en cambio de contraseña", "Mostrar/ocultar contraseña en los 3 campos del formulario."),
    ("Sitio web integrado al CRM", "Formularios de contacto y productos conectados al backend; consultas entran automáticamente al CRM."),
    ("Páginas de productos (catálogo)", "Plantilla reutilizable; apliques cargados, colgantes en proceso."),
    ("Exportación con límite de filas", "Máximo 500 registros por reporte para evitar archivos enormes."),
    ("Mensajes de error claros", "Si el backend no responde JSON, mensajes explicativos en lugar de errores crípticos."),
]

for title, desc in items_extra:
    sections.append(p(f"• {title}", bold=True))
    sections.append(p(desc))
    sections.append(blank())

sections.append(h2("5. Cómo demostrar las correcciones en la consulta"))
sections.append(blank())

demo = [
    "1. Iniciar el backend: cd ProyectoTesis/backend → node server.js",
    "2. Abrir http://localhost:3000/login.html",
    "3. Entrar como gerente: gerente.demo@example.com / Admin123!",
    "4. Mostrar Dashboard gerencial (KPIs, gráficos Ituarte, paneles de actividad)",
    "5. Ir a Consultas → mostrar vista agrupada por defecto (solo activas recientes)",
    "6. Ir a Clientes → paginación + nombres capitalizados",
    "7. Ir a Marketing → pestañas internas + marcar enviado (tarjeta verde, desaparece)",
    "8. Ir a Reportes → descargar PDF de Consultas y mostrar logo + formato profesional",
    "9. Cerrar sesión e ingresar como empleado: empleado.demo@example.com / Admin123!",
    "10. Mostrar 'Mi día' operativo (distinto al gerente) y que no ve Reportes",
    "11. (Opcional) Abrir MySQL Workbench y mostrar las tablas relacionadas",
]

for line in demo:
    sections.append(p(line))

sections.append(blank())
sections.append(h2("6. Usuarios de prueba"))
sections.append(p("Gerente: gerente.demo@example.com — Contraseña: Admin123!"))
sections.append(p("Empleada: empleado.demo@example.com — Contraseña: Admin123!"))
sections.append(p("Cliente: cliente@ejemplo.com — Contraseña: Admin123!"))
sections.append(blank())
sections.append(p("— Fin del documento —"))

body = "".join(sections)

document_xml = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {body}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>'''

content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>'''

rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

with zipfile.ZipFile(OUTPUT, "w", zipfile.ZIP_DEFLATED) as z:
    z.writestr("[Content_Types].xml", content_types)
    z.writestr("_rels/.rels", rels)
    z.writestr("word/document.xml", document_xml.encode("utf-8"))

print("OK:", OUTPUT)
