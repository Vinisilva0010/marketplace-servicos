import { eq, and, sql } from "drizzle-orm";
import { db } from "./index";
import {
  mensagens, propostas, solicitacoesServico, convites, avaliacoes,
} from "./schema";

export async function avisosContratante(clienteId: number) {
  const naoLidas = await db
    .select({ total: sql<number>`count(*)` })
    .from(mensagens)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, mensagens.solicitacaoId))
    .where(
      and(
        eq(solicitacoesServico.clienteId, clienteId),
        eq(mensagens.lida, false),
        sql`${mensagens.remetenteId} <> ${clienteId}`
      )
    );

  const propostasNovas = await db
    .select({ total: sql<number>`count(*)` })
    .from(propostas)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .where(
      and(
        eq(solicitacoesServico.clienteId, clienteId),
        eq(solicitacoesServico.status, "aberta"),
        eq(propostas.status, "enviada")
      )
    );

  const aConfirmar = await db
    .select({ total: sql<number>`count(*)` })
    .from(solicitacoesServico)
    .where(
      and(
        eq(solicitacoesServico.clienteId, clienteId),
        eq(solicitacoesServico.status, "em andamento")
      )
    );

  const aAvaliar = await db
    .select({ total: sql<number>`count(*)` })
    .from(solicitacoesServico)
    .where(
      and(
        eq(solicitacoesServico.clienteId, clienteId),
        eq(solicitacoesServico.status, "concluida"),
        sql`not exists (select 1 from avaliacoes a where a.solicitacao_id = ${solicitacoesServico.id})`
      )
    );

  return {
    mensagens: Number(naoLidas[0]?.total ?? 0),
    propostas: Number(propostasNovas[0]?.total ?? 0),
    aConfirmar: Number(aConfirmar[0]?.total ?? 0),
    aAvaliar: Number(aAvaliar[0]?.total ?? 0),
  };
}

export async function avisosPrestador(prestadorId: number, usuarioId: number) {
  const naoLidas = await db
    .select({ total: sql<number>`count(*)` })
    .from(mensagens)
    .innerJoin(propostas, eq(propostas.id, mensagens.propostaId))
    .where(
      and(
        eq(propostas.prestadorId, prestadorId),
        eq(mensagens.lida, false),
        sql`${mensagens.remetenteId} <> ${usuarioId}`
      )
    );

  const convitesAbertos = await db
    .select({ total: sql<number>`count(*)` })
    .from(convites)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, convites.solicitacaoId))
    .where(
      and(
        eq(convites.prestadorId, prestadorId),
        eq(solicitacoesServico.status, "aberta"),
        sql`not exists (select 1 from propostas p where p.solicitacao_id = ${solicitacoesServico.id} and p.prestador_id = ${prestadorId})`
      )
    );

  const servicosAtivos = await db
    .select({ total: sql<number>`count(*)` })
    .from(propostas)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .where(
      and(
        eq(propostas.prestadorId, prestadorId),
        eq(propostas.status, "aceita"),
        eq(solicitacoesServico.status, "em andamento")
      )
    );

  const avaliacoesSemResposta = await db
    .select({ total: sql<number>`count(*)` })
    .from(avaliacoes)
    .where(
      and(
        eq(avaliacoes.prestadorId, prestadorId),
        sql`${avaliacoes.respostaPrestador} is null`
      )
    );

  return {
    mensagens: Number(naoLidas[0]?.total ?? 0),
    convites: Number(convitesAbertos[0]?.total ?? 0),
    emAndamento: Number(servicosAtivos[0]?.total ?? 0),
    avaliacoes: Number(avaliacoesSemResposta[0]?.total ?? 0),
  };
}
