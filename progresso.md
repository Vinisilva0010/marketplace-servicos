Modelagem e criação do banco

Banco PostgreSQL no Neon. A estrutura das tabelas é escrita em src/db/schema.ts, e o Drizzle gera e aplica o SQL a partir dela. As tabelas foram criadas em blocos, sempre as que não dependem de ninguém primeiro — não dá pra criar uma tabela que aponta pra outra que ainda não existe.

Por que algumas tabelas estão separadas

prestadores separado de usuarios — só parte dos usuários é prestador, e tem campos que só fazem sentido pra quem presta serviço (apresentação, anos de experiência, documento, verificado). Juntar deixaria metade das colunas vazias na maioria das linhas.

prestadores_cidades — um prestador atende várias cidades, e uma cidade tem vários prestadores. Quando os dois lados têm "vários", a informação não cabe em nenhuma das duas tabelas e precisa de uma terceira no meio, só com as duas chaves. Mesmo caso de servicos_oferecidos, que liga prestador e categoria.

propostas separada de solicitacoes_servico — é o que faz o sistema ser marketplace. O cliente publica o pedido aberto, vários prestadores mandam orçamento com valor e prazo, e o cliente escolhe um. Se o cliente já escolhesse o prestador na hora de pedir, não haveria disputa e a tabela não existiria.

As restrições unique e o motivo de cada uma
usuarios.email — duas contas não podem ter o mesmo email
prestadores.usuario_id — um usuário só pode ter um perfil de prestador
pagamentos.proposta_id — uma proposta não pode gerar dois pagamentos
avaliacoes.solicitacao_id — um serviço só pode ser avaliado uma vez, senão dá pra inflar ou destruir reputação repetindo avaliação
Dinheiro usa numeric

Valores são numeric(10,2), não decimal comum. Decimal comum arredonda errado em conta, e com dinheiro isso vira diferença de centavo acumulada.

Os três status trabalham juntos

solicitacoes_servico, propostas e pagamentos têm cada um o seu status, e eles mudam em conjunto:

Cliente aceita uma proposta → aquela proposta vira "aceita", as outras daquele pedido viram "recusadas", a solicitação sai de "aberta" e vai pra "em andamento", o pagamento entra como "retido".

Cliente confirma que o serviço foi feito → a solicitação vira "concluída" e o pagamento vira "liberado".

Só depois disso a avaliação pode ser criada.