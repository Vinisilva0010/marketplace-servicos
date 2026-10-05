import { eq, and, ne } from "drizzle-orm";
import { db } from "./index";
import {
  propostas, solicitacoesServico, pagamentos,
  prestadores, usuarios, categorias, cidades, enderecos,
} from "./schema";

export async function buscarSolicitacao(solicitacaoId: number) {
  const achados = await db
    .select({
      id: solicitacoesServico.id,
      clienteId: solicitacoesServico.clienteId,
      titulo: solicitacoesServico.titulo,
      descricao: solicitacoesServico.descricao,
      status: solicitacoesServico.status,
      dataDesejada: solicitacoesServico.dataDesejada,
      orcamentoMaximo: solicitacoesServico.orcamentoMaximo,
      dataCriacao: solicitacoesServico.dataCriacao,
      categoria: categorias.nome,
      cliente: usuarios.nome,
      logradouro: enderecos.logradouro,
      numero: enderecos.numero,
      bairro: enderecos.bairro,
      cidade: cidades.nome,
      estado: cidades.estado,
    })
    .from(solicitacoesServico)
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .innerJoin(usuarios, eq(usuarios.id, solicitacoesServico.clienteId))
    .innerJoin(enderecos, eq(enderecos.id, solicitacoesServico.enderecoId))
    .innerJoin(cidades, eq(cidades.id, enderecos.cidadeId))
    .where(eq(solicitacoesServico.id, solicitacaoId));

  return achados[0] ?? null;
}

export async function listarPropostas(solicitacaoId: number) {
  return db
    .select({
      id: propostas.id,
      valor: propostas.valor,
      prazoDias: propostas.prazoDias,
      mensagem: propostas.mensagem,
      status: propostas.status,
      dataEnvio: propostas.dataEnvio,
      prestadorId: prestadores.id,
      prestadorNome: usuarios.nome,
      anosExperiencia: prestadores.anosExperiencia,
      verificado: prestadores.verificado,
    })
    .from(propostas)
    .innerJoin(prestadores, eq(prestadores.id, propostas.prestadorId))
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .where(eq(propostas.solicitacaoId, solicitacaoId));
}

export async function propostaDoPrestador(solicitacaoId: number, prestadorId: number) {
  const achados = await db
    .select()
    .from(propostas)
    .where(and(eq(propostas.solicitacaoId, solicitacaoId), eq(propostas.prestadorId, prestadorId)));

  return achados[0] ?? null;
}

export async function enviarProposta(dados: {
  solicitacaoId: number;
  prestadorId: number;
  valor: string;
  prazoDias: number;
  mensagem: string;
}) {
  await db.insert(propostas).values(dados);
}

export async function aceitarProposta(propostaId: number, solicitacaoId: number) {
  await db.transaction(async (tx) => {
    const achados = await tx
      .select({ id: propostas.id, valor: propostas.valor })
      .from(propostas)
      .where(and(eq(propostas.id, propostaId), eq(propostas.solicitacaoId, solicitacaoId)));

    const proposta = achados[0];
    if (!proposta) return;

    await tx
      .update(propostas)
      .set({ status: "aceita" })
      .where(eq(propostas.id, proposta.id));

    await tx
      .update(propostas)
      .set({ status: "recusada" })
      .where(and(eq(propostas.solicitacaoId, solicitacaoId), ne(propostas.id, proposta.id)));

    await tx
      .update(solicitacoesServico)
      .set({ status: "em andamento" })
      .where(eq(solicitacoesServico.id, solicitacaoId));

    await tx.insert(pagamentos).values({
      propostaId: proposta.id,
      valor: proposta.valor,
      status: "retido",
      dataRetencao: new Date(),
    });
  });
}
