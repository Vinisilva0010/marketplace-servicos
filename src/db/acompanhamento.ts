import { eq, asc } from "drizzle-orm";
import { db } from "./index";
import {
  mensagens, usuarios, solicitacoesServico, propostas,
  pagamentos, avaliacoes,
} from "./schema";

export async function listarMensagens(solicitacaoId: number) {
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
    .where(eq(mensagens.solicitacaoId, solicitacaoId))
    .orderBy(asc(mensagens.dataEnvio));
}

export async function enviarMensagem(dados: {
  solicitacaoId: number;
  remetenteId: number;
  conteudo: string;
}) {
  await db.insert(mensagens).values(dados);
}

export async function propostaAceita(solicitacaoId: number) {
  const achados = await db
    .select({
      id: propostas.id,
      prestadorId: propostas.prestadorId,
      valor: propostas.valor,
    })
    .from(propostas)
    .where(eq(propostas.solicitacaoId, solicitacaoId));

  return achados.find((proposta) => proposta.id !== undefined && proposta) ?? null;
}

export async function buscarPropostaAceita(solicitacaoId: number) {
  const achados = await db
    .select({
      id: propostas.id,
      prestadorId: propostas.prestadorId,
      valor: propostas.valor,
      status: propostas.status,
    })
    .from(propostas)
    .where(eq(propostas.solicitacaoId, solicitacaoId));

  return achados.find((proposta) => proposta.status === "aceita") ?? null;
}

export async function buscarPagamento(propostaId: number) {
  const achados = await db.select().from(pagamentos).where(eq(pagamentos.propostaId, propostaId));
  return achados[0] ?? null;
}

export async function concluirServico(solicitacaoId: number, propostaId: number) {
  await db.transaction(async (tx) => {
    await tx
      .update(solicitacoesServico)
      .set({ status: "concluida" })
      .where(eq(solicitacoesServico.id, solicitacaoId));

    await tx
      .update(pagamentos)
      .set({ status: "liberado", dataLiberacao: new Date() })
      .where(eq(pagamentos.propostaId, propostaId));
  });
}

export async function buscarAvaliacao(solicitacaoId: number) {
  const achados = await db.select().from(avaliacoes).where(eq(avaliacoes.solicitacaoId, solicitacaoId));
  return achados[0] ?? null;
}

export async function criarAvaliacao(dados: {
  solicitacaoId: number;
  autorId: number;
  prestadorId: number;
  nota: number;
  comentario: string;
}) {
  await db.insert(avaliacoes).values(dados);
}

export async function responderAvaliacao(avaliacaoId: number, resposta: string) {
  await db
    .update(avaliacoes)
    .set({ respostaPrestador: resposta })
    .where(eq(avaliacoes.id, avaliacaoId));
}
