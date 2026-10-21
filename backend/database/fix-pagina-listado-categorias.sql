-- Pagina de grilla por categoría (nombres como en data-categoria / categorias_catalogo)
USE crm_ituarte;

UPDATE categorias_catalogo SET pagina_listado = 'apliques.html' WHERE id > 0 AND nombre = 'Apliques';
UPDATE categorias_catalogo SET pagina_listado = 'colgantes.html' WHERE id > 0 AND nombre = 'Colgantes';
UPDATE categorias_catalogo SET pagina_listado = 'veladores.html' WHERE id > 0 AND nombre = 'Veladores';
UPDATE categorias_catalogo SET pagina_listado = 'plafones.html' WHERE id > 0 AND nombre = 'Plafones';
UPDATE categorias_catalogo SET pagina_listado = 'bifocales.html' WHERE id > 0 AND nombre = 'Bifocales';
UPDATE categorias_catalogo SET pagina_listado = 'unifocales.html' WHERE id > 0 AND nombre = 'Unifocales';
UPDATE categorias_catalogo SET pagina_listado = 'farolas.html' WHERE id > 0 AND nombre = 'Farolas';
UPDATE categorias_catalogo SET pagina_listado = 'estacas.html' WHERE id > 0 AND nombre = 'Estacas';
UPDATE categorias_catalogo SET pagina_listado = 'tortugas.html' WHERE id > 0 AND nombre = 'Tortugas';
UPDATE categorias_catalogo SET pagina_listado = 'reflectores.html' WHERE id > 0 AND nombre = 'Reflectores';
UPDATE categorias_catalogo SET pagina_listado = 'pileta.html' WHERE id > 0 AND nombre = 'Luminaria de Pileta';
UPDATE categorias_catalogo SET pagina_listado = 'solares.html' WHERE id > 0 AND nombre = 'Solares';
UPDATE categorias_catalogo SET pagina_listado = 'paneles.html' WHERE id > 0 AND nombre = 'Paneles';
UPDATE categorias_catalogo SET pagina_listado = 'smart.html' WHERE id > 0 AND nombre = 'Smart';
UPDATE categorias_catalogo SET pagina_listado = 'alumbradopublico.html' WHERE id > 0 AND nombre = 'Alumbrado público';
UPDATE categorias_catalogo SET pagina_listado = 'ventiladores.html' WHERE id > 0 AND nombre = 'Ventiladores';
UPDATE categorias_catalogo SET pagina_listado = 'camaras.html' WHERE id > 0 AND nombre = 'Cámaras';
UPDATE categorias_catalogo SET pagina_listado = 'espejos.html' WHERE id > 0 AND nombre = 'Espejos';
UPDATE categorias_catalogo SET pagina_listado = 'lamparasdepie.html' WHERE id > 0 AND nombre = 'Lámparas de Pie';

SELECT id, nombre, pagina_listado FROM categorias_catalogo ORDER BY nombre;
