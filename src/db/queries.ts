import { eq, and, sql } from "drizzle-orm";
import { db } from "./index";
import {
  usuarios, categorias, cidades, prestadores,
  servicosOferecidos, prestadoresCidades,
  solicitacoesServico, propostas,
} from "./schema";

export async function listarCategorias() {
  return db.select().from(categorias).orderBy(categorias.nome);
}

export async function listarCidades() {
  return db.select().from(cidades).orderBy(cidades.nome);
}

export async function listarPrestadores() {
  return db
    .select({
      id: prestadores.id,
      nome: usuarios.nome,
      apresentacao: prestadores.apresentacao,
      anosExperiencia: prestadores.anosExperiencia,
      verificado: prestadores.verificado,
    })
    .from(prestadores)
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .orderBy(usuarios.nome);
}

export async function contarPorCategoria() {
  return db
    .select({
      id: categorias.id,
      nome: categorias.nome,
      descricao: categorias.descricao,
      totalServicos: sql<number>`count(${servicosOferecidos.id})`,
    })
    .from(categorias)
    .leftJoin(servicosOferecidos, eq(servicosOferecidos.categoriaId, categorias.id))
    .groupBy(categorias.id, categorias.nome, categorias.descricao)
    .orderBy(categorias.nome);
}

export async function buscarServicos(filtro: {
  categoriaId?: number;
  cidadeId?: number;
  ordem?: string;
}) {
  const condicoes = [];

  if (filtro.categoriaId) {
    condicoes.push(eq(servicosOferecidos.categoriaId, filtro.categoriaId));
  }

  if (filtro.cidadeId) {
    condicoes.push(
      sql`EXISTS (SELECT 1 FROM prestadores_cidades pc WHERE pc.prestador_id = ${prestadores.id} AND pc.cidade_id = ${filtro.cidadeId})`
    );
  }

  const consulta = db
    .select({
      servicoId: servicosOferecidos.id,
      titulo: servicosOferecidos.titulo,
      descricao: servicosOferecidos.descricao,
      precoBase: servicosOferecidos.precoBase,
      unidadePreco: servicosOferecidos.unidadePreco,
      prestadorId: prestadores.id,
      prestadorNome: usuarios.nome,
      anosExperiencia: prestadores.anosExperiencia,
      verificado: prestadores.verificado,
      categoriaNome: categorias.nome,
      notaMedia: sql<string>`(select round(avg(a.nota), 1) from avaliacoes a where a.prestador_id = ${prestadores.id})`,
      totalAvaliacoes: sql<number>`(select count(*) from avaliacoes a where a.prestador_id = ${prestadores.id})`,
      servicosFeitos: sql<number>`(select count(*) from propostas p inner join solicitacoes_servico s on s.id = p.solicitacao_id where p.prestador_id = ${prestadores.id} and p.status = 'aceita' and s.status = 'concluida')`,
    })
    .from(servicosOferecidos)
    .innerJoin(prestadores, eq(prestadores.id, servicosOferecidos.prestadorId))
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .innerJoin(categorias, eq(categorias.id, servicosOferecidos.categoriaId));

  const comFiltro = condicoes.length > 0 ? consulta.where(and(...condicoes)) : consulta;

  if (filtro.ordem === "preco") {
    return comFiltro.orderBy(sql`${servicosOferecidos.precoBase} asc nulls last`);
  }

  if (filtro.ordem === "experiencia") {
    return comFiltro.orderBy(sql`${prestadores.anosExperiencia} desc nulls last`);
  }

  return comFiltro.orderBy(
    sql`(select avg(a.nota) from avaliacoes a where a.prestador_id = ${prestadores.id}) desc nulls last`,
    sql`${prestadores.verificado} desc`
  );
}
