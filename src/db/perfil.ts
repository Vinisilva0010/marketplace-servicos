import { eq, and, sql } from "drizzle-orm";
import { db } from "./index";
import {
  usuarios, enderecos, cidades, categorias, prestadores,
  servicosOferecidos, prestadoresCidades, avaliacoes,
  solicitacoesServico,
} from "./schema";

export async function buscarUsuario(usuarioId: number) {
  const achados = await db.select().from(usuarios).where(eq(usuarios.id, usuarioId));
  return achados[0] ?? null;
}

export async function buscarEnderecos(usuarioId: number) {
  return db
    .select({
      id: enderecos.id,
      logradouro: enderecos.logradouro,
      numero: enderecos.numero,
      complemento: enderecos.complemento,
      bairro: enderecos.bairro,
      cep: enderecos.cep,
      cidade: cidades.nome,
      estado: cidades.estado,
    })
    .from(enderecos)
    .innerJoin(cidades, eq(cidades.id, enderecos.cidadeId))
    .where(eq(enderecos.usuarioId, usuarioId));
}

export async function buscarPrestadorPorUsuario(usuarioId: number) {
  const achados = await db.select().from(prestadores).where(eq(prestadores.usuarioId, usuarioId));
  return achados[0] ?? null;
}

export async function buscarServicosDoPrestador(prestadorId: number) {
  return db
    .select({
      id: servicosOferecidos.id,
      titulo: servicosOferecidos.titulo,
      descricao: servicosOferecidos.descricao,
      precoBase: servicosOferecidos.precoBase,
      unidadePreco: servicosOferecidos.unidadePreco,
      categoria: categorias.nome,
    })
    .from(servicosOferecidos)
    .innerJoin(categorias, eq(categorias.id, servicosOferecidos.categoriaId))
    .where(eq(servicosOferecidos.prestadorId, prestadorId));
}

export async function buscarCidadesDoPrestador(prestadorId: number) {
  return db
    .select({
      vinculoId: prestadoresCidades.id,
      cidadeId: cidades.id,
      nome: cidades.nome,
      estado: cidades.estado,
    })
    .from(prestadoresCidades)
    .innerJoin(cidades, eq(cidades.id, prestadoresCidades.cidadeId))
    .where(eq(prestadoresCidades.prestadorId, prestadorId));
}

export async function buscarAvaliacoesDoPrestador(prestadorId: number) {
  return db
    .select({
      id: avaliacoes.id,
      nota: avaliacoes.nota,
      comentario: avaliacoes.comentario,
      respostaPrestador: avaliacoes.respostaPrestador,
      data: avaliacoes.dataAvaliacao,
      autor: usuarios.nome,
      servico: solicitacoesServico.titulo,
    })
    .from(avaliacoes)
    .innerJoin(usuarios, eq(usuarios.id, avaliacoes.autorId))
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, avaliacoes.solicitacaoId))
    .where(eq(avaliacoes.prestadorId, prestadorId));
}

export async function mediaDoPrestador(prestadorId: number) {
  const resultado = await db
    .select({
      media: sql<string>`round(avg(${avaliacoes.nota}), 1)`,
      total: sql<number>`count(${avaliacoes.id})`,
    })
    .from(avaliacoes)
    .where(eq(avaliacoes.prestadorId, prestadorId));

  return resultado[0];
}

export async function atualizarDadosPessoais(usuarioId: number, dados: {
  nome: string;
  telefone: string;
}) {
  await db.update(usuarios).set(dados).where(eq(usuarios.id, usuarioId));
}

export async function atualizarDadosProfissionais(prestadorId: number, dados: {
  apresentacao: string;
  anosExperiencia: number;
}) {
  await db.update(prestadores).set(dados).where(eq(prestadores.id, prestadorId));
}

export async function adicionarServico(dados: {
  prestadorId: number;
  categoriaId: number;
  titulo: string;
  descricao: string;
  precoBase: string;
  unidadePreco: string;
}) {
  await db.insert(servicosOferecidos).values(dados);
}

export async function atualizarServico(servicoId: number, prestadorId: number, dados: {
  titulo: string;
  descricao: string;
  precoBase: string;
  unidadePreco: string;
}) {
  await db
    .update(servicosOferecidos)
    .set(dados)
    .where(and(eq(servicosOferecidos.id, servicoId), eq(servicosOferecidos.prestadorId, prestadorId)));
}

export async function removerServico(servicoId: number, prestadorId: number) {
  await db
    .delete(servicosOferecidos)
    .where(and(eq(servicosOferecidos.id, servicoId), eq(servicosOferecidos.prestadorId, prestadorId)));
}

export async function adicionarCidadeAtuacao(prestadorId: number, cidadeId: number) {
  const existe = await db
    .select({ id: prestadoresCidades.id })
    .from(prestadoresCidades)
    .where(and(eq(prestadoresCidades.prestadorId, prestadorId), eq(prestadoresCidades.cidadeId, cidadeId)));

  if (existe.length === 0) {
    await db.insert(prestadoresCidades).values({ prestadorId, cidadeId });
  }
}

export async function removerCidadeAtuacao(vinculoId: number, prestadorId: number) {
  await db
    .delete(prestadoresCidades)
    .where(and(eq(prestadoresCidades.id, vinculoId), eq(prestadoresCidades.prestadorId, prestadorId)));
}

export async function adicionarEndereco(dados: {
  usuarioId: number;
  cidadeId: number;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
}) {
  await db.insert(enderecos).values(dados);
}

export async function historicoDoContratante(clienteId: number) {
  const resultado = await db
    .select({
      total: sql<number>`count(*)`,
      concluidos: sql<number>`count(*) filter (where ${solicitacoesServico.status} = 'concluida')`,
      cancelados: sql<number>`count(*) filter (where ${solicitacoesServico.status} = 'cancelada')`,
      desde: sql<Date>`min(${solicitacoesServico.dataCriacao})`,
    })
    .from(solicitacoesServico)
    .where(eq(solicitacoesServico.clienteId, clienteId));

  const notasDadas = await db
    .select({
      media: sql<string>`round(avg(${avaliacoes.nota}), 1)`,
      total: sql<number>`count(*)`,
    })
    .from(avaliacoes)
    .where(eq(avaliacoes.autorId, clienteId));

  const cadastro = await db
    .select({ dataCadastro: usuarios.dataCadastro })
    .from(usuarios)
    .where(eq(usuarios.id, clienteId));

  return {
    pedidos: resultado[0],
    notasDadas: notasDadas[0],
    dataCadastro: cadastro[0]?.dataCadastro ?? null,
  };
}
