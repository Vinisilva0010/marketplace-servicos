import { eq, desc } from "drizzle-orm";
import { db } from "./index";
import { solicitacoesServico, categorias, cidades, enderecos, usuarios, propostas } from "./schema";
import { sql } from "drizzle-orm";

export async function criarSolicitacao(dados: {
  clienteId: number;
  categoriaId: number;
  enderecoId: number;
  titulo: string;
  descricao: string;
  dataDesejada: string;
  orcamentoMaximo: string;
}) {
  const [solicitacao] = await db
    .insert(solicitacoesServico)
    .values({
      clienteId: dados.clienteId,
      categoriaId: dados.categoriaId,
      enderecoId: dados.enderecoId,
      titulo: dados.titulo,
      descricao: dados.descricao,
      dataDesejada: dados.dataDesejada ? new Date(dados.dataDesejada) : null,
      orcamentoMaximo: dados.orcamentoMaximo || null,
    })
    .returning();

  return solicitacao;
}

export async function listarSolicitacoes(filtro?: { clienteId?: number; status?: string }) {
  const consulta = db
    .select({
      id: solicitacoesServico.id,
      titulo: solicitacoesServico.titulo,
      descricao: solicitacoesServico.descricao,
      status: solicitacoesServico.status,
      dataDesejada: solicitacoesServico.dataDesejada,
      orcamentoMaximo: solicitacoesServico.orcamentoMaximo,
      dataCriacao: solicitacoesServico.dataCriacao,
      categoria: categorias.nome,
      cidade: cidades.nome,
      estado: cidades.estado,
      bairro: enderecos.bairro,
      cliente: usuarios.nome,
      totalPropostas: sql<number>`(select count(*) from propostas p where p.solicitacao_id = ${solicitacoesServico.id})`,
    })
    .from(solicitacoesServico)
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .innerJoin(enderecos, eq(enderecos.id, solicitacoesServico.enderecoId))
    .innerJoin(cidades, eq(cidades.id, enderecos.cidadeId))
    .innerJoin(usuarios, eq(usuarios.id, solicitacoesServico.clienteId))
    .orderBy(desc(solicitacoesServico.dataCriacao));

  if (filtro?.clienteId) {
    return consulta.where(eq(solicitacoesServico.clienteId, filtro.clienteId));
  }

  if (filtro?.status) {
    return consulta.where(eq(solicitacoesServico.status, filtro.status));
  }

  return consulta;
}
