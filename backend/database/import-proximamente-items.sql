-- Solo vitrina Próximamente (6 ítems). NO importa el backup completo.
-- En el SERVIDOR, después de: npm run migrate-proximamente

USE crm_ituarte;

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM proximamente_likes;
DELETE FROM proximamente_items;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO proximamente_items
  (id, titulo, subtitulo, descripcion, imagen, imagen_hover, categoria_etiqueta, orden, activo, publicado, likes_count, creado_en, actualizado_en)
VALUES
  (1, 'APLIQUE LALA', '6W', 'djkjkjcnskclslksmlmxalmlclmlmc', 'img/productos/lala-1792703453520.png', 'img/productos/fotomontlala-1792708053344.png', 'INTERIOR', 1, 1, 1, 0, '2026-10-22 21:11:40', '2026-10-22 22:27:37'),
  (2, 'aplique lele', '7w', 'jdncjklklkxkkkkkkkkkkkkkkkkkkkk', 'img/productos/lele-1792703689741.png', 'img/productos/fotomontlele-1792708062890.png', 'INTERIOR', 2, 1, 1, 0, '2026-10-22 21:15:08', '2026-10-22 22:27:44'),
  (3, 'APLIQUE LILI', '8W', 'JCNKJXNKXNLANLKZLkmllllllllllllllll', 'img/productos/lili-1792703720259.png', 'img/productos/fotomontlili-1792708070286.png', 'EXTERIOR', 3, 1, 1, 0, '2026-10-22 21:15:40', '2026-10-22 22:27:51'),
  (4, 'colgante lolo', '9w', 'mmmmmmmmmmmmmmmmmmmmmmmmmmmmm', 'img/productos/lolo-1792703748945.png', 'img/productos/fotomontlulu-1792708086851.png', 'EXTERIOR', 4, 1, 1, 0, '2026-10-22 21:16:03', '2026-10-22 22:28:08'),
  (5, 'smart lulu', '9kk', 'djckjakxnlsddddddddddddddddddddd', 'img/productos/lulu-1792703774459.png', 'img/productos/fotomontpla-1792708094435.png', 'INTERIOR', 5, 1, 1, 0, '2026-10-22 21:16:37', '2026-10-22 22:47:59'),
  (6, 'aplique pla', '7000k', 'fffffffffffffffffffffffffffffff', 'img/productos/pla-1792703807932.png', 'img/productos/fotomontlolo-1792708078826.png', 'INTERIOR', 4, 1, 1, 0, '2026-10-22 21:17:02', '2026-10-22 22:37:19');

ALTER TABLE proximamente_items AUTO_INCREMENT = 7;
