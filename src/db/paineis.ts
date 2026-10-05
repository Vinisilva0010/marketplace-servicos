import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { db } from "./index";
import {
  solicitacoesServico, categorias, cidades, enderecos, usuarios,
  propostas, prestadores, prestadoresCidades, servicosOferecidos,
  pagamentos, avaliacoes,
} from "./schema";

export async function painelContratante(clienteId: number) {
  const pedidos = await db
    .select({
      id: solicitacoesServico.id,
      titulo: solicitacoesServico.titulo,
      status: solicitacoesServico.status,
      dataCriacao: solicitacoesServico.dataCriacao,
      categoria: categorias.nome,
      totalPropostas: sql<number>`(select count(*) from propostas p where p.solicitacao_id = ${solicitacoesServico.id})`,
      temAvaliacao: sql<number>`(select count(*) from avaliacoes a where a.solicitacao_id = ${solicitacoesServico.id})`,
    })
    .from(solicitacoesServico)
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .where(eq(solicitacoesServico.clienteId, clienteId))
    .orderBy(desc(solicitacoesServico.dataCriacao));

  return {
    aguardandoEscolha: pedidos.filter((p) => p.status === "aberta"),
    emAndamento: pedidos.filter((p) => p.status === "em andamento"),
    aguardandoAvaliacao: pedidos.filter(
      (p) => p.status === "concluida" && Number(p.temAvaliacao) === 0
    ),
    concluidos: pedidos.filter(
      (p) => p.status === "concluida" && Number(p.temAvaliacao) > 0
    ),
    total: pedidos.length,
  };
}

export async function painelPrestador(prestadorId: number) {
  const minhasCategorias = await db
    .select({ categoriaId: servicosOferecidos.categoriaId })
    .from(servicosOferecidos)
    .where(eq(servicosOferecidos.prestadorId, prestadorId));

  const minhasCidades = await db
    .select({ cidadeId: prestadoresCidades.cidadeId })
    .from(prestadoresCidades)
    .where(eq(prestadoresCidades.prestadorId, prestadorId));

  const idsCategorias = minhasCategorias.map((c) => c.categoriaId);
  const idsCidades = minhasCidades.map((c) => c.cidadeId);

  const jaRespondi = await db
    .select({ solicitacaoId: propostas.solicitacaoId })
    .from(propostas)
    .where(eq(propostas.prestadorId, prestadorId));

  const idsRespondidos = jaRespondi.map((p) => p.solicitacaoId);

  let novosPedidos: Array<{
    id: number;
    titulo: string;
    descricao: string;
    categoria: string;
    cidade: string;
    bairro: string | null;
    orcamentoMaximo: string | null;
    dataCriacao: Date;
  }> = [];

  if (idsCategorias.length > 0 && idsCidades.length > 0) {
    novosPedidos = await db
      .select({
        id: solicitacoesServico.id,
        titulo: solicitacoesServico.titulo,
        descricao: solicitacoesServico.descricao,
        categoria: categorias.nome,
        cidade: cidades.nome,
        bairro: enderecos.bairro,
        orcamentoMaximo: solicitacoesServico.orcamentoMaximo,
        dataCriacao: solicitacoesServico.dataCriacao,
      })
      .from(solicitacoesServico)
      .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
      .innerJoin(enderecos, eq(enderecos.id, solicitacoesServico.enderecoId))
      .innerJoin(cidades, eq(cidades.id, enderecos.cidadeId))
      .where(
        and(
          eq(solicitacoesServico.status, "aberta"),
          inArray(solicitacoesServico.categoriaId, idsCategorias),
          inArray(enderecos.cidadeId, idsCidades)
        )
      )
      .orderBy(desc(solicitacoesServico.dataCriacao));
  }

  const pendentes = idsRespondidos.length > 0 ? novosPedidos.filter((p) => !idsRespondidos.includes(p.id)) : novosPedidos;

  const minhasPropostas = await db
    .select({
      id: propostas.id,
      valor: propostas.valor,
      status: propostas.status,
      solicitacaoId: solicitacoesServico.id,
      solicitacaoTitulo: solicitacoesServico.titulo,
      solicitacaoStatus: solicitacoesServico.status,
      contratante: usuarios.nome,
      pagamentoStatus: pagamentos.status,
      pagamentoValor: pagamentos.valor,
    })
    .from(propostas)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, propostas.solicitacaoId))
    .innerJoin(usuarios, eq(usuarios.id, solicitacoesServico.clienteId))
    .leftJoin(pagamentos, eq(pagamentos.propostaId, propostas.id))
    .where(eq(propostas.prestadorId, prestadorId))
    .orderBy(desc(propostas.dataEnvio));

  const aReceber = minhasPropostas
    .filter((p) => p.pagamentoStatus === "retido")
    .reduce((soma, p) => soma + Number(p.pagamentoValor ?? 0), 0);

  const recebido = minhasPropostas
    .filter((p) => p.pagamentoStatus === "liberado")
    .reduce((soma, p) => soma + Number(p.pagamentoValor ?? 0), 0);

  const notas = await db
    .select({
      media: sql<string>`round(avg(${avaliacoes.nota}), 1)`,
      total: sql<number>`count(${avaliacoes.id})`,
    })
    .from(avaliacoes)
    .where(eq(avaliacoes.prestadorId, prestadorId));

  return {
    novosPedidos: pendentes,
    aguardandoResposta: minhasPropostas.filter(
      (p) => p.status === "enviada" && p.solicitacaoStatus === "aberta"
    ),
    emAndamento: minhasPropostas.filter(
      (p) => p.status === "aceita" && p.solicitacaoStatus === "em andamento"
    ),
    concluidos: minhasPropostas.filter(
      (p) => p.status === "aceita" && p.solicitacaoStatus === "concluida"
    ),
    aReceber,
    recebido,
    avaliacao: notas[0],
    semCadastroCompleto: idsCategorias.length === 0 || idsCidades.length === 0,
  };
}
