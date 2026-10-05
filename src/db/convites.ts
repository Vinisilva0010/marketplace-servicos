import { eq, and, desc } from "drizzle-orm";
import { db } from "./index";
import {
  convites, solicitacoesServico, categorias, prestadores,
  usuarios, enderecos, cidades,
} from "./schema";

export async function pedidosAbertosDoContratante(clienteId: number) {
  return db
    .select({
      id: solicitacoesServico.id,
      titulo: solicitacoesServico.titulo,
      categoria: categorias.nome,
    })
    .from(solicitacoesServico)
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .where(
      and(
        eq(solicitacoesServico.clienteId, clienteId),
        eq(solicitacoesServico.status, "aberta")
      )
    )
    .orderBy(desc(solicitacoesServico.dataCriacao));
}

export async function conviteJaEnviado(solicitacaoId: number, prestadorId: number) {
  const achados = await db
    .select({ id: convites.id })
    .from(convites)
    .where(and(eq(convites.solicitacaoId, solicitacaoId), eq(convites.prestadorId, prestadorId)));

  return achados.length > 0;
}

export async function enviarConvite(solicitacaoId: number, prestadorId: number) {
  const existe = await conviteJaEnviado(solicitacaoId, prestadorId);
  if (existe) return;
  await db.insert(convites).values({ solicitacaoId, prestadorId });
}

export async function convitesDoPrestador(prestadorId: number) {
  return db
    .select({
      id: convites.id,
      dataEnvio: convites.dataEnvio,
      solicitacaoId: solicitacoesServico.id,
      titulo: solicitacoesServico.titulo,
      descricao: solicitacoesServico.descricao,
      status: solicitacoesServico.status,
      orcamentoMaximo: solicitacoesServico.orcamentoMaximo,
      categoria: categorias.nome,
      contratante: usuarios.nome,
      cidade: cidades.nome,
      bairro: enderecos.bairro,
    })
    .from(convites)
    .innerJoin(solicitacoesServico, eq(solicitacoesServico.id, convites.solicitacaoId))
    .innerJoin(categorias, eq(categorias.id, solicitacoesServico.categoriaId))
    .innerJoin(usuarios, eq(usuarios.id, solicitacoesServico.clienteId))
    .innerJoin(enderecos, eq(enderecos.id, solicitacoesServico.enderecoId))
    .innerJoin(cidades, eq(cidades.id, enderecos.cidadeId))
    .where(eq(convites.prestadorId, prestadorId))
    .orderBy(desc(convites.dataEnvio));
}

export async function prestadorPorId(prestadorId: number) {
  const achados = await db
    .select({
      id: prestadores.id,
      nome: usuarios.nome,
    })
    .from(prestadores)
    .innerJoin(usuarios, eq(usuarios.id, prestadores.usuarioId))
    .where(eq(prestadores.id, prestadorId));

  return achados[0] ?? null;
}
