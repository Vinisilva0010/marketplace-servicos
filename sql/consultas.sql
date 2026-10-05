-- 1. Prestadores com seus dados de usuario e cidades onde atendem
SELECT u.nome, p.anos_experiencia, p.verificado, c.nome AS cidade
FROM prestadores p
JOIN usuarios u ON u.id = p.usuario_id
JOIN prestadores_cidades pc ON pc.prestador_id = p.id
JOIN cidades c ON c.id = pc.cidade_id
ORDER BY u.nome, c.nome;

-- 2. Servicos oferecidos por categoria, do mais barato ao mais caro
SELECT cat.nome AS categoria, s.titulo, s.preco_base, s.unidade_preco, u.nome AS prestador
FROM servicos_oferecidos s
JOIN categorias cat ON cat.id = s.categoria_id
JOIN prestadores p ON p.id = s.prestador_id
JOIN usuarios u ON u.id = p.usuario_id
ORDER BY cat.nome, s.preco_base;

-- 3. Solicitacoes abertas com cidade e quantas propostas ja receberam
SELECT sol.titulo, cat.nome AS categoria, c.nome AS cidade,
       COUNT(pr.id) AS total_propostas
FROM solicitacoes_servico sol
JOIN categorias cat ON cat.id = sol.categoria_id
JOIN enderecos e ON e.id = sol.endereco_id
JOIN cidades c ON c.id = e.cidade_id
LEFT JOIN propostas pr ON pr.solicitacao_id = sol.id
WHERE sol.status = 'aberta'
GROUP BY sol.titulo, cat.nome, c.nome;

-- 4. Media de nota e total de avaliacoes por prestador
SELECT u.nome AS prestador,
       ROUND(AVG(a.nota), 2) AS media_nota,
       COUNT(a.id) AS total_avaliacoes
FROM prestadores p
JOIN usuarios u ON u.id = p.usuario_id
LEFT JOIN avaliacoes a ON a.prestador_id = p.id
GROUP BY u.nome
ORDER BY media_nota DESC NULLS LAST;

-- 5. Historico completo de um servico concluido
SELECT sol.titulo, cliente.nome AS cliente, prestador.nome AS prestador,
       pr.valor AS valor_proposta, pag.status AS status_pagamento,
       a.nota, a.comentario
FROM solicitacoes_servico sol
JOIN usuarios cliente ON cliente.id = sol.cliente_id
JOIN propostas pr ON pr.solicitacao_id = sol.id AND pr.status = 'aceita'
JOIN prestadores p ON p.id = pr.prestador_id
JOIN usuarios prestador ON prestador.id = p.usuario_id
JOIN pagamentos pag ON pag.proposta_id = pr.id
LEFT JOIN avaliacoes a ON a.solicitacao_id = sol.id
WHERE sol.status = 'concluida';

-- 6. Dinheiro retido na plataforma, aguardando confirmacao do cliente
SELECT SUM(valor) AS total_retido, COUNT(*) AS pagamentos_retidos
FROM pagamentos
WHERE status = 'retido';

-- 7. Conversas por solicitacao, com quem falou por ultimo
SELECT sol.titulo, COUNT(m.id) AS total_mensagens,
       MAX(m.data_envio) AS ultima_mensagem
FROM solicitacoes_servico sol
JOIN mensagens m ON m.solicitacao_id = sol.id
GROUP BY sol.titulo
ORDER BY ultima_mensagem DESC;

-- 8. Busca de prestadores por categoria e cidade (a busca principal do site)
SELECT u.nome AS prestador, s.titulo, s.preco_base, p.verificado
FROM servicos_oferecidos s
JOIN prestadores p ON p.id = s.prestador_id
JOIN usuarios u ON u.id = p.usuario_id
JOIN prestadores_cidades pc ON pc.prestador_id = p.id
JOIN categorias cat ON cat.id = s.categoria_id
JOIN cidades c ON c.id = pc.cidade_id
WHERE cat.nome = 'Pedreiro' AND c.nome = 'São Paulo';
