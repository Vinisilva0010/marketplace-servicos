import { eq, and } from "drizzle-orm";
import { db } from "./index";
import { solicitacoesServico, propostas, convites, pagamentos } from "./schema";

export async function cancelarPedido(solicitacaoId: number, clienteId: number) {
  await db.transaction(async (tx) => {
    const achados = await tx
      .select({ status: solicitacoesServico.status })
      .from(solicitacoesServico)
      .where(
        and(
          eq(solicitacoesServico.id, solicitacaoId),
          eq(solicitacoesServico.clienteId, clienteId)
        )
      );

    const pedido = achados[0];
    if (!pedido) return;
    if (pedido.status !== "aberta" && pedido.status !== "em andamento") return;

    if (pedido.status === "em andamento") {
      const aceitas = await tx
        .select({ id: propostas.id })
        .from(propostas)
        .where(
          and(eq(propostas.solicitacaoId, solicitacaoId), eq(propostas.status, "aceita"))
        );

      if (aceitas[0]) {
        await tx
          .update(pagamentos)
          .set({ status: "devolvido" })
          .where(eq(pagamentos.propostaId, aceitas[0].id));
      }
    }

    await tx
      .update(propostas)
      .set({ status: "cancelada" })
      .where(
        and(eq(propostas.solicitacaoId, solicitacaoId), eq(propostas.status, "enviada"))
      );

    await tx
      .update(solicitacoesServico)
      .set({ status: "cancelada" })
      .where(eq(solicitacoesServico.id, solicitacaoId));
  });
}

export async function retirarProposta(propostaId: number, prestadorId: number) {
  const achados = await db
    .select({ status: propostas.status })
    .from(propostas)
    .where(and(eq(propostas.id, propostaId), eq(propostas.prestadorId, prestadorId)));

  const proposta = achados[0];
  if (!proposta || proposta.status !== "enviada") return;

  await db
    .update(propostas)
    .set({ status: "retirada" })
    .where(eq(propostas.id, propostaId));
}

export async function recusarConvite(conviteId: number, prestadorId: number) {
  await db
    .update(convites)
    .set({ status: "recusado" })
    .where(and(eq(convites.id, conviteId), eq(convites.prestadorId, prestadorId)));
}
