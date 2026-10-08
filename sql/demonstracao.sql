

-- 1.1 Listar todas as tabelas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 1.2 Ver as colunas de uma tabela, com tipo e se aceita nulo
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY ordinal_position;

-- 1.3 Listar todas as chaves estrangeiras do banco
SELECT
    tc.table_name AS tabela,
    kcu.column_name AS coluna,
    ccu.table_name AS referencia_tabela,
    ccu.column_name AS referencia_coluna
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 1.4 Listar as restricoes de unicidade
SELECT tc.table_name AS tabela, kcu.column_name AS coluna, tc.constraint_type AS tipo
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON kcu.constraint_name = tc.constraint_name
WHERE tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY') AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 1.5 Quantos registros tem em cada tabela
SELECT 'usuarios' AS tabela, COUNT(*) FROM usuarios
UNION ALL SELECT 'cidades', COUNT(*) FROM cidades
UNION ALL SELECT 'enderecos', COUNT(*) FROM enderecos
UNION ALL SELECT 'categorias', COUNT(*) FROM categorias
UNION ALL SELECT 'prestadores', COUNT(*) FROM prestadores
UNION ALL SELECT 'servicos_oferecidos', COUNT(*) FROM servicos_oferecidos
UNION ALL SELECT 'prestadores_cidades', COUNT(*) FROM prestadores_cidades
UNION ALL SELECT 'solicitacoes_servico', COUNT(*) FROM solicitacoes_servico
UNION ALL SELECT 'convites', COUNT(*) FROM convites
UNION ALL SELECT 'propostas', COUNT(*) FROM propostas
UNION ALL SELECT 'mensagens', COUNT(*) FROM mensagens
UNION ALL SELECT 'pagamentos', COUNT(*) FROM pagamentos
UNION ALL SELECT 'avaliacoes', COUNT(*) FROM avaliacoes;


-- =========================================================
-- 2. CADASTRAR PELO BANCO
--  "cria um usuario direto pelo banco"
-- =========================================================

-- 2.1 Criar um contratante com endereco
INSERT INTO usuarios (nome, email, senha_hash, telefone, cpf, data_nascimento, tipo)
VALUES ('Teste Contratante', 'teste.contratante@email.com', '$2b$10$hashdeexemploparademonstracao',
        '11900000001', '111.222.333-44', '1990-05-20', 'cliente');

INSERT INTO enderecos (usuario_id, cidade_id, logradouro, numero, bairro, cep)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'teste.contratante@email.com'),
    (SELECT id FROM cidades WHERE nome = 'São Paulo'),
    'Rua de Teste', '100', 'Centro', '01000-000'
);

-- 2.2 Criar um prestador completo: usuario, endereco, perfil, servico e cidade de atuacao
INSERT INTO usuarios (nome, email, senha_hash, telefone, cpf, data_nascimento, tipo)
VALUES ('Teste Prestador', 'teste.prestador@email.com', '$2b$10$hashdeexemploparademonstracao',
        '11900000002', '555.666.777-88', '1985-03-10', 'prestador');

INSERT INTO enderecos (usuario_id, cidade_id, logradouro, numero, bairro, cep)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'teste.prestador@email.com'),
    (SELECT id FROM cidades WHERE nome = 'São Paulo'),
    'Rua do Prestador', '200', 'Centro', '01000-001'
);

INSERT INTO prestadores (usuario_id, tipo_pessoa, apresentacao, anos_experiencia, documento, verificado)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'teste.prestador@email.com'),
    'fisica', 'Prestador criado durante a demonstracao do banco.', 10, '555.666.777-88', false
);

INSERT INTO servicos_oferecidos (prestador_id, categoria_id, titulo, descricao, preco_base, unidade_preco)
VALUES (
    (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com'),
    (SELECT id FROM categorias WHERE nome = 'Pedreiro'),
    'Servico de demonstracao', 'Servico cadastrado por comando SQL.', 500.00, 'serviço'
);

INSERT INTO prestadores_cidades (prestador_id, cidade_id)
VALUES (
    (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com'),
    (SELECT id FROM cidades WHERE nome = 'São Paulo')
);

-- 2.3 Conferir o que foi criado
SELECT u.id, u.nome, u.email, u.cpf, u.tipo, c.nome AS cidade
FROM usuarios u
LEFT JOIN enderecos e ON e.usuario_id = u.id
LEFT JOIN cidades c ON c.id = e.cidade_id
WHERE u.email LIKE 'teste.%'
ORDER BY u.id;


-- =========================================================
-- 3. FLUXO COMPLETO PELO BANCO
--  "faz todo o processo so por SQL"
-- =========================================================

-- 3.1 O contratante publica um pedido
INSERT INTO solicitacoes_servico
    (cliente_id, categoria_id, endereco_id, titulo, descricao, data_desejada, orcamento_maximo)
VALUES (
    (SELECT id FROM usuarios WHERE email = 'teste.contratante@email.com'),
    (SELECT id FROM categorias WHERE nome = 'Pedreiro'),
    (SELECT e.id FROM enderecos e JOIN usuarios u ON u.id = e.usuario_id WHERE u.email = 'teste.contratante@email.com'),
    'Pedido de demonstracao',
    'Pedido criado por comando SQL durante a apresentacao.',
    '2026-11-20 09:00:00',
    800.00
);

-- 3.2 O prestador envia uma proposta
INSERT INTO propostas (solicitacao_id, prestador_id, valor, prazo_dias, mensagem)
VALUES (
    (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao'),
    (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com'),
    750.00, 3, 'Proposta enviada por comando SQL.'
);

-- 3.3 O contratante aceita a proposta
-- Quatro mudancas que precisam acontecer juntas, por isso vao numa transacao.
-- Rodar este bloco inteiro de uma vez.
BEGIN;

UPDATE propostas SET status = 'aceita'
WHERE solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao')
  AND prestador_id = (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com');

UPDATE propostas SET status = 'recusada'
WHERE solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao')
  AND status = 'enviada';

UPDATE solicitacoes_servico SET status = 'em andamento'
WHERE titulo = 'Pedido de demonstracao';

INSERT INTO pagamentos (proposta_id, valor, forma_pagamento, status, data_retencao)
SELECT p.id, p.valor, 'pix', 'retido', NOW()
FROM propostas p
WHERE p.solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao')
  AND p.status = 'aceita';

COMMIT;

-- 3.4 Trocar mensagens dentro da proposta
INSERT INTO mensagens (solicitacao_id, proposta_id, remetente_id, conteudo)
VALUES (
    (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao'),
    (SELECT id FROM propostas WHERE solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao') AND status = 'aceita'),
    (SELECT id FROM usuarios WHERE email = 'teste.contratante@email.com'),
    'Mensagem enviada por comando SQL.'
);

-- 3.5 O contratante confirma a conclusao e o pagamento e liberado
BEGIN;

UPDATE solicitacoes_servico SET status = 'concluida'
WHERE titulo = 'Pedido de demonstracao';

UPDATE pagamentos SET status = 'liberado', data_liberacao = NOW()
WHERE proposta_id = (SELECT id FROM propostas WHERE solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao') AND status = 'aceita');

COMMIT;

-- 3.6 O contratante avalia
INSERT INTO avaliacoes (solicitacao_id, autor_id, prestador_id, nota, comentario)
VALUES (
    (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao'),
    (SELECT id FROM usuarios WHERE email = 'teste.contratante@email.com'),
    (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com'),
    5, 'Avaliacao registrada por comando SQL.'
);

-- 3.7 Ver o fluxo inteiro numa consulta so
SELECT s.titulo, s.status AS status_pedido,
       cliente.nome AS contratante, prestador.nome AS prestador,
       pr.valor, pr.status AS status_proposta,
       pag.status AS status_pagamento,
       a.nota, a.comentario
FROM solicitacoes_servico s
JOIN usuarios cliente ON cliente.id = s.cliente_id
LEFT JOIN propostas pr ON pr.solicitacao_id = s.id AND pr.status = 'aceita'
LEFT JOIN prestadores p ON p.id = pr.prestador_id
LEFT JOIN usuarios prestador ON prestador.id = p.usuario_id
LEFT JOIN pagamentos pag ON pag.proposta_id = pr.id
LEFT JOIN avaliacoes a ON a.solicitacao_id = s.id
WHERE s.titulo = 'Pedido de demonstracao';


-- =========================================================
-- 4. O BANCO SE PROTEGENDO
--  "e se alguem gravar dado errado"
-- Estes comandos DEVEM dar erro. O erro e a resposta.
-- =========================================================

-- 4.1 Email repetido: recusado pela restricao de unicidade
INSERT INTO usuarios (nome, email, senha_hash, tipo)
VALUES ('Outro', 'teste.contratante@email.com', 'hash', 'cliente');

-- 4.2 CPF repetido: recusado pela restricao de unicidade
INSERT INTO usuarios (nome, email, senha_hash, cpf, tipo)
VALUES ('Outro', 'outro@email.com', 'hash', '111.222.333-44', 'cliente');

-- 4.3 Endereco apontando para usuario que nao existe: recusado pela chave estrangeira
INSERT INTO enderecos (usuario_id, cidade_id, logradouro)
VALUES (999999, 1, 'Rua Inexistente');

-- 4.4 Segunda avaliacao no mesmo pedido: recusado, so pode haver uma
INSERT INTO avaliacoes (solicitacao_id, autor_id, prestador_id, nota)
VALUES (
    (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao'),
    (SELECT id FROM usuarios WHERE email = 'teste.contratante@email.com'),
    (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com'),
    1
);

-- 4.5 Apagar uma cidade que tem endereco ligado: recusado pela chave estrangeira
DELETE FROM cidades WHERE nome = 'São Paulo';


-- =========================================================
-- 5. CONSULTAS DE RELATORIO
-- Se ele pedir "me faz uma consulta que cruze tabelas"
-- =========================================================

-- 5.1 Ranking de prestadores por nota, com total de servicos concluidos
SELECT u.nome AS prestador,
       ROUND(AVG(a.nota), 2) AS media_nota,
       COUNT(DISTINCT a.id) AS total_avaliacoes,
       COUNT(DISTINCT s.id) AS servicos_concluidos
FROM prestadores p
JOIN usuarios u ON u.id = p.usuario_id
LEFT JOIN avaliacoes a ON a.prestador_id = p.id
LEFT JOIN propostas pr ON pr.prestador_id = p.id AND pr.status = 'aceita'
LEFT JOIN solicitacoes_servico s ON s.id = pr.solicitacao_id AND s.status = 'concluida'
GROUP BY u.nome
ORDER BY media_nota DESC NULLS LAST;

-- 5.2 Pedidos por situacao
SELECT status, COUNT(*) AS total
FROM solicitacoes_servico
GROUP BY status
ORDER BY total DESC;

-- 5.3 Dinheiro na plataforma por situacao do pagamento
SELECT status, COUNT(*) AS quantidade, SUM(valor) AS total
FROM pagamentos
GROUP BY status;

-- 5.4 Categorias com mais pedidos (so as que tem mais de um)
SELECT c.nome AS categoria, COUNT(s.id) AS total_pedidos
FROM categorias c
JOIN solicitacoes_servico s ON s.categoria_id = c.id
GROUP BY c.nome
HAVING COUNT(s.id) > 1
ORDER BY total_pedidos DESC;

-- 5.5 Prestadores que atendem em mais de uma cidade
SELECT u.nome, COUNT(pc.cidade_id) AS cidades_atendidas
FROM prestadores p
JOIN usuarios u ON u.id = p.usuario_id
JOIN prestadores_cidades pc ON pc.prestador_id = p.id
GROUP BY u.nome
HAVING COUNT(pc.cidade_id) > 1;

-- 5.6 Media de propostas recebidas por pedido
SELECT ROUND(AVG(quantidade), 2) AS media_propostas_por_pedido
FROM (
    SELECT s.id, COUNT(p.id) AS quantidade
    FROM solicitacoes_servico s
    LEFT JOIN propostas p ON p.solicitacao_id = s.id
    GROUP BY s.id
) AS contagem;

-- 5.7 Pedidos que nao receberam nenhuma proposta
SELECT s.titulo, c.nome AS categoria, s.data_criacao
FROM solicitacoes_servico s
JOIN categorias c ON c.id = s.categoria_id
WHERE NOT EXISTS (SELECT 1 FROM propostas p WHERE p.solicitacao_id = s.id);

-- 5.8 Busca que o site usa: prestadores de uma categoria numa cidade
SELECT u.nome AS prestador, so.titulo, so.preco_base, so.unidade_preco
FROM servicos_oferecidos so
JOIN prestadores p ON p.id = so.prestador_id
JOIN usuarios u ON u.id = p.usuario_id
JOIN categorias cat ON cat.id = so.categoria_id
JOIN prestadores_cidades pc ON pc.prestador_id = p.id
JOIN cidades cid ON cid.id = pc.cidade_id
WHERE cat.nome = 'Pedreiro' AND cid.nome = 'São Paulo';


-- =========================================================
-- 6. ALTERAR E APAGAR
-- Se ele pedir "muda um dado" ou "apaga um registro"
-- =========================================================

-- 6.1 Alterar o preco de um servico
UPDATE servicos_oferecidos
SET preco_base = 650.00
WHERE titulo = 'Servico de demonstracao';

-- 6.2 Desativar um usuario sem apagar (preserva o historico ligado a ele)
UPDATE usuarios SET ativo = false WHERE email = 'teste.prestador@email.com';
UPDATE usuarios SET ativo = true WHERE email = 'teste.prestador@email.com';

-- 6.3 Marcar mensagens como lidas
UPDATE mensagens SET lida = true
WHERE solicitacao_id = (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao');


-- =========================================================
-- 7. LIMPAR O QUE FOI CRIADO NA DEMONSTRACAO
-- Rodar nesta ordem: primeiro quem aponta, depois quem e apontado
-- =========================================================

DELETE FROM avaliacoes WHERE solicitacao_id IN (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao');
DELETE FROM mensagens WHERE solicitacao_id IN (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao');
DELETE FROM pagamentos WHERE proposta_id IN (SELECT id FROM propostas WHERE solicitacao_id IN (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao'));
DELETE FROM propostas WHERE solicitacao_id IN (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao');
DELETE FROM convites WHERE solicitacao_id IN (SELECT id FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao');
DELETE FROM solicitacoes_servico WHERE titulo = 'Pedido de demonstracao';
DELETE FROM prestadores_cidades WHERE prestador_id IN (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com');
DELETE FROM servicos_oferecidos WHERE prestador_id IN (SELECT p.id FROM prestadores p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'teste.prestador@email.com');
DELETE FROM prestadores WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = 'teste.prestador@email.com');
DELETE FROM enderecos WHERE usuario_id IN (SELECT id FROM usuarios WHERE email LIKE 'teste.%');
DELETE FROM usuarios WHERE email LIKE 'teste.%';
