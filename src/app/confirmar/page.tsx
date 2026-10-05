import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import { buscarSolicitacao, aceitarProposta } from "@/db/propostas";
import { buscarPropostaAceita, concluirServico } from "@/db/acompanhamento";
import { cancelarPedido } from "@/db/cancelamentos";
import { removerServico } from "@/db/perfil";

export const dynamic = "force-dynamic";

const textos: Record<string, { titulo: string; aviso: string; botao: string }> = {
  aceitar: {
    titulo: "Aceitar esta proposta",
    aviso:
      "Ao aceitar, as outras propostas deste pedido serão recusadas, o valor combinado ficará retido na plataforma e o serviço passa para em andamento. Esta ação não pode ser desfeita.",
    botao: "Sim, aceitar esta proposta",
  },
  concluir: {
    titulo: "Confirmar conclusão do serviço",
    aviso:
      "Ao confirmar, o valor retido será repassado ao profissional e o pedido será marcado como concluído. Só confirme se o serviço realmente foi feito, porque esta ação não pode ser desfeita.",
    botao: "Sim, o serviço foi concluído",
  },
  cancelar: {
    titulo: "Cancelar este pedido",
    aviso:
      "O pedido sai do ar e as propostas recebidas são canceladas. Se já houver pagamento retido, o valor será devolvido a você. Esta ação não pode ser desfeita.",
    botao: "Sim, cancelar o pedido",
  },
  removerServico: {
    titulo: "Remover este serviço",
    aviso:
      "O serviço deixa de aparecer na busca e você não receberá mais pedidos desta categoria. O histórico de serviços já realizados não é afetado.",
    botao: "Sim, remover o serviço",
  },
};

export default async function PaginaConfirmar({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string; extra?: string; volta?: string }>;
}) {
  const parametros = await searchParams;
  const logado = await usuarioLogado();

  if (!logado) redirect("/entrar");

  const acao = parametros.acao ?? "";
  const alvo = Number(parametros.id);
  const extra = parametros.extra ? Number(parametros.extra) : null;
  const volta = parametros.volta ?? "/";

  const texto = textos[acao];

  if (!texto) {
    redirect("/");
  }

  async function executar() {
    "use server";

    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");

    if (acao === "aceitar" && extra) {
      const pedido = await buscarSolicitacao(extra);
      if (pedido && pedido.clienteId === atual.id && pedido.status === "aberta") {
        await aceitarProposta(alvo, extra);
      }
      redirect(`/solicitacoes/${extra}`);
    }

    if (acao === "concluir") {
      const pedido = await buscarSolicitacao(alvo);
      if (pedido && pedido.clienteId === atual.id && pedido.status === "em andamento") {
        const aceita = await buscarPropostaAceita(alvo);
        if (aceita) await concluirServico(alvo, aceita.id);
      }
      redirect(`/solicitacoes/${alvo}`);
    }

    if (acao === "cancelar") {
      await cancelarPedido(alvo, atual.id);
      redirect(`/solicitacoes/${alvo}`);
    }

    if (acao === "removerServico") {
      const meu = await buscarPrestadorPorUsuario(atual.id);
      if (meu) await removerServico(alvo, meu.id);
      redirect("/perfil");
    }

    redirect("/");
  }

  return (
    <div>
      <h2>{texto.titulo}</h2>
      <p className="aviso">{texto.aviso}</p>

      <form action={executar}>
        <p><input type="submit" value={texto.botao} /></p>
      </form>

      <p><a href={volta}>Não, voltar sem fazer nada</a></p>
    </div>
  );
}
