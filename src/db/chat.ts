import { eq, and, asc, desc, sql } from "drizzle-orm";
import { db } from "./index";
import {
  mensagens, usuarios, propostas, solicitacoesServico,
  prestadores, categorias,
} from "./schema";

export async function listarConversa(propostaId: number) {
  return db
    .select({
      id: mensagens.id,
      conteudo: mensagens.conteudo,
      dataEnvio: mensagens.dataEnvio,
      remetenteId: mensagens.remetenteId,
      remetente: usuarios.nome,
    })
    .from(mensagens)
    .innerJoin(usuarios, eq(usuarios.id, mensagens.remetenteId))
    .where(eq(mensagens.propostaId, propostaId))
    .orderBy(asc(mensagens.dataEnvio));
}

export async function enviarMensagemProposta(dados: {
  solicitacaoId: number;
  propostaId: number;
  remetenteId: number;
  conteudo: string;
}) {
  await db.insert(mensagens).values(dados);
}

export async function dadosDaProposta(propostaId: number) {
  const achados = await db
    .select({
      propostaId: propostas.id,
      valor: propostas.valor,
      prazoDias: propostas.prazoDias,
      statusProposta: propostas.status,
      prestadorId: prestadores.id,
      prestadorUsuarioId: prestadores.usuarioId,
      prestadorNome: usuarios.nome,
      solicitacaoId: solicitacoesServico.id,
      solicitacaoTitulo: solicitacoesServico.titulo,
      solicitacaoStatus: solicitacoesServico.status,
      clienteId: solicitacoesServico.clienteId,
      categoria: categorias.nome,
    })
    .from(propostas)
    .innerJoin(prestadores, eq(prestadores.id, propostas.prestadorId))
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .where(eq(propostas.id, propostaId));

  return achados[0] ?? null;
}

export async function conversasDoContratante(clienteId: number) {
  return db
    .select({
      propostaId: propostas.id,
      valor: propostas.valor,
      statusProposta: propostas.status,
      outraPessoa: usuarios.nome,
      solicitacaoId: solicitacoesServico.id,
      solicitacaoTitulo: solicitacoesServico.titulo,
      totalMensagens: sql<number>`(select count(*) from mensagens m where m.proposta_id = ${propostas.id})`,
      ultimaMensagem: sql<Date>`(select max(m.data_envio) from mensagens m where m.proposta_id = ${propostas.id})`,
    })
    .from(propostas)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .innerJoin(prestadores, eq(prestadores.id, propostas.prestadorId))
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .where(eq(solicitacoesServico.clienteId, clienteId))
    .orderBy(desc(propostas.dataEnvio));
}

export async function conversasDoPrestador(prestadorId: number) {
  return db
    .select({
      propostaId: propostas.id,
      valor: propostas.valor,
      statusProposta: propostas.status,
      outraPessoa: usuarios.nome,
      solicitacaoId: solicitacoesServico.id,
      solicitacaoTitulo: solicitacoesServico.titulo,
      totalMensagens: sql<number>`(select count(*) from mensagens m where m.proposta_id = ${propostas.id})`,
      ultimaMensagem: sql<Date>`(select max(m.data_envio) from mensagens m where m.proposta_id = ${propostas.id})`,
    })
    .from(propostas)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .innerJoin(usuarios, eq(usuarios.id, solicitacoesServico.clienteId))
    .where(eq(propostas.prestadorId, prestadorId))
    .orderBy(desc(propostas.dataEnvio));
}

export async function marcarComoLidas(propostaId: number, leitorId: number) {
  await db
    .update(mensagens)
    .set({ lida: true })
    .where(and(eq(mensagens.propostaId, propostaId), sql`${mensagens.remetenteId} <> ${leitorId}`));
}
