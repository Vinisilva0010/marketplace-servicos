-- =========================================================
-- 
-- 
-- =========================================================

-- Ver tudo de uma tabela
SELECT * FROM usuarios;
SELECT * FROM categorias;
SELECT * FROM prestadores;

-- Escolher so algumas colunas
SELECT nome, email, tipo FROM usuarios;

-- Filtrar com WHERE
SELECT nome, email FROM usuarios WHERE tipo = 'prestador';
SELECT * FROM categorias WHERE nome = 'Pedreiro';
SELECT * FROM servicos_oferecidos WHERE preco_base > 300;
SELECT * FROM solicitacoes_servico WHERE status = 'aberta';

-- Filtrar por parte do texto
SELECT nome, email FROM usuarios WHERE nome LIKE '%Silva%';
SELECT nome FROM categorias WHERE nome LIKE 'Tecnico%';

-- Mais de uma condicao
SELECT * FROM servicos_oferecidos WHERE preco_base > 100 AND preco_base < 500;
SELECT nome, tipo FROM usuarios WHERE tipo = 'cliente' OR tipo = 'prestador';

-- Ordenar
SELECT titulo, preco_base FROM servicos_oferecidos ORDER BY preco_base DESC;
SELECT nome FROM usuarios ORDER BY nome ASC;

-- Limitar a quantidade de linhas
SELECT * FROM usuarios LIMIT 3;
SELECT titulo, preco_base FROM servicos_oferecidos ORDER BY preco_base DESC LIMIT 5;

-- Contar
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM usuarios WHERE tipo = 'prestador';

-- Valores sem repeticao
SELECT DISTINCT tipo FROM usuarios;
SELECT DISTINCT status FROM solicitacoes_servico;

-- Maior, menor, soma e media
SELECT MAX(preco_base) AS mais_caro FROM servicos_oferecidos;
SELECT MIN(preco_base) AS mais_barato FROM servicos_oferecidos;
SELECT AVG(preco_base) AS media FROM servicos_oferecidos;
SELECT SUM(valor) AS total FROM pagamentos;

-- Agrupar
SELECT tipo, COUNT(*) AS total FROM usuarios GROUP BY tipo;
SELECT status, COUNT(*) AS total FROM propostas GROUP BY status;

-- Campos vazios e preenchidos
SELECT nome, telefone FROM usuarios WHERE telefone IS NULL;
SELECT nome, cpf FROM usuarios WHERE cpf IS NOT NULL;

-- Juntar duas tabelas: o prestador e o nome da pessoa
SELECT u.nome, p.anos_experiencia, p.verificado
FROM prestadores p
JOIN usuarios u ON u.id = p.usuario_id;

-- Juntar tres tabelas: servico, prestador e categoria
SELECT u.nome AS prestador, s.titulo AS servico, c.nome AS categoria, s.preco_base
FROM servicos_oferecidos s
JOIN prestadores p ON p.id = s.prestador_id
JOIN usuarios u ON u.id = p.usuario_id
JOIN categorias c ON c.id = s.categoria_id;

-- LEFT JOIN: traz todos, mesmo os que nao tem correspondencia
-- Aqui aparecem todas as categorias, inclusive as que nao tem servico nenhum
SELECT c.nome AS categoria, COUNT(s.id) AS total_servicos
FROM categorias c
LEFT JOIN servicos_oferecidos s ON s.categoria_id = c.id
GROUP BY c.nome
ORDER BY total_servicos DESC;
