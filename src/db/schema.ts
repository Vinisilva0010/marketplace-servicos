import { pgTable, serial, varchar, text, integer, numeric, boolean, timestamp, date } from "drizzle-orm/pg-core";

export const cidades = pgTable("cidades", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  estado: varchar("estado", { length: 2 }).notNull(),
});

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).notNull().unique(),
  senhaHash: varchar("senha_hash", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  cpf: varchar("cpf", { length: 14 }),
  dataNascimento: date("data_nascimento"),
  tipo: varchar("tipo", { length: 20 }).notNull(),
  ativo: boolean("ativo").notNull().default(true),
  dataCadastro: timestamp("data_cadastro").notNull().defaultNow(),
});

export const enderecos = pgTable("enderecos", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
  cidadeId: integer("cidade_id").notNull().references(() => cidades.id),
  logradouro: varchar("logradouro", { length: 150 }).notNull(),
  numero: varchar("numero", { length: 20 }),
  complemento: varchar("complemento", { length: 100 }),
  bairro: varchar("bairro", { length: 100 }),
  cep: varchar("cep", { length: 9 }),
});

export const categorias = pgTable("categorias", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 50 }).notNull(),
  descricao: text("descricao"),
});

export const prestadores = pgTable("prestadores", {
  id: serial("id").primaryKey(),
  usuarioId: integer("usuario_id").notNull().unique().references(() => usuarios.id),
  tipoPessoa: varchar("tipo_pessoa", { length: 10 }).notNull().default("fisica"),
  razaoSocial: varchar("razao_social", { length: 150 }),
  apresentacao: text("apresentacao"),
  anosExperiencia: integer("anos_experiencia"),
  documento: varchar("documento", { length: 20 }),
  verificado: boolean("verificado").notNull().default(false),
});

export const servicosOferecidos = pgTable("servicos_oferecidos", {
  id: serial("id").primaryKey(),
  prestadorId: integer("prestador_id").notNull().references(() => prestadores.id),
  categoriaId: integer("categoria_id").notNull().references(() => categorias.id),
  titulo: varchar("titulo", { length: 120 }).notNull(),
  descricao: text("descricao"),
  precoBase: numeric("preco_base", { precision: 10, scale: 2 }),
  unidadePreco: varchar("unidade_preco", { length: 20 }),
});

export const prestadoresCidades = pgTable("prestadores_cidades", {
  id: serial("id").primaryKey(),
  prestadorId: integer("prestador_id").notNull().references(() => prestadores.id),
  cidadeId: integer("cidade_id").notNull().references(() => cidades.id),
});

export const solicitacoesServico = pgTable("solicitacoes_servico", {
  id: serial("id").primaryKey(),
  clienteId: integer("cliente_id").notNull().references(() => usuarios.id),
  categoriaId: integer("categoria_id").notNull().references(() => categorias.id),
  enderecoId: integer("endereco_id").notNull().references(() => enderecos.id),
  titulo: varchar("titulo", { length: 120 }).notNull(),
  descricao: text("descricao").notNull(),
  dataDesejada: timestamp("data_desejada"),
  orcamentoMaximo: numeric("orcamento_maximo", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }).notNull().default("aberta"),
  dataCriacao: timestamp("data_criacao").notNull().defaultNow(),
});

export const propostas = pgTable("propostas", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoesServico.id),
  prestadorId: integer("prestador_id").notNull().references(() => prestadores.id),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  prazoDias: integer("prazo_dias"),
  mensagem: text("mensagem"),
  status: varchar("status", { length: 20 }).notNull().default("enviada"),
  dataEnvio: timestamp("data_envio").notNull().defaultNow(),
});

export const mensagens = pgTable("mensagens", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoesServico.id),
  propostaId: integer("proposta_id").references(() => propostas.id),
  remetenteId: integer("remetente_id").notNull().references(() => usuarios.id),
  conteudo: text("conteudo").notNull(),
  lida: boolean("lida").notNull().default(false),
  dataEnvio: timestamp("data_envio").notNull().defaultNow(),
});

export const pagamentos = pgTable("pagamentos", {
  id: serial("id").primaryKey(),
  propostaId: integer("proposta_id").notNull().unique().references(() => propostas.id),
  valor: numeric("valor", { precision: 10, scale: 2 }).notNull(),
  formaPagamento: varchar("forma_pagamento", { length: 30 }),
  status: varchar("status", { length: 20 }).notNull().default("pendente"),
  dataRetencao: timestamp("data_retencao"),
  dataLiberacao: timestamp("data_liberacao"),
});

export const avaliacoes = pgTable("avaliacoes", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id").notNull().unique().references(() => solicitacoesServico.id),
  autorId: integer("autor_id").notNull().references(() => usuarios.id),
  prestadorId: integer("prestador_id").notNull().references(() => prestadores.id),
  nota: integer("nota").notNull(),
  comentario: text("comentario"),
  respostaPrestador: text("resposta_prestador"),
  dataAvaliacao: timestamp("data_avaliacao").notNull().defaultNow(),
});

export const convites = pgTable("convites", {
  id: serial("id").primaryKey(),
  solicitacaoId: integer("solicitacao_id").notNull().references(() => solicitacoesServico.id),
  prestadorId: integer("prestador_id").notNull().references(() => prestadores.id),
  dataEnvio: timestamp("data_envio").notNull().defaultNow(),
});
