import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import {
  dadosDaProposta, listarConversa, enviarMensagemProposta, marcarComoLidas,
} from "@/db/chat";

export const dynamic = "force-dynamic";

export default async function PaginaConversa({
  params,
}: {
  params: Promise<{ propostaId: string }>;
}) {
  const { propostaId: parametro } = await params;
  const propostaId = Number(parametro);

  const logado = await usuarioLogado();
  if (!logado) redirect("/entrar");

  const proposta = await dadosDaProposta(propostaId);
  if (!proposta) {
    return (
      <div>
        <h2>Conversa não encontrada</h2>
        <p className="aviso">Esta conversa não existe.</p>
      </div>
    );
  }

  const souContratante = logado.id === proposta.clienteId;
  const souPrestador = logado.id === proposta.prestadorUsuarioId;

  if (!souContratante && !souPrestador) {
    return (
      <div>
        <h2>Conversa</h2>
        <p className="aviso">Você não participa desta conversa.</p>
      </div>
    );
  }

  await marcarComoLidas(propostaId, logado.id);
  const conversa = await listarConversa(propostaId);

  async function mandar(formulario: FormData) {
    "use server";

    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");

    const dados = await dadosDaProposta(propostaId);
    if (!dados) redirect("/conversas");

    const meu = atual.tipo === "prestador" ? await buscarPrestadorPorUsuario(atual.id) : null;
    const podeFalar =
      dados.clienteId === atual.id || (meu !== null && meu.id === dados.prestadorId);

    if (!podeFalar) redirect("/conversas");

    await enviarMensagemProposta({
      solicitacaoId: dados.solicitacaoId,
      propostaId: propostaId,
      remetenteId: atual.id,
      conteudo: String(formulario.get("conteudo")).trim(),
    });

    redirect(`/conversas/${propostaId}`);
  }

  return (
    <div>
      <h2>Conversa com {souContratante ? proposta.prestadorNome : "o contratante"}</h2>

      <p><label>Pedido</label>
        <a href={`/solicitacoes/${proposta.solicitacaoId}`}>{proposta.solicitacaoTitulo}</a>
      </p>
      <p><label>Categoria</label>{proposta.categoria}</p>
      <p><label>Proposta</label>R$ {proposta.valor} em {proposta.prazoDias} dia(s)</p>
      <p><label>Situação da proposta</label>{proposta.statusProposta}</p>
      <p><label>Situação do pedido</label>{proposta.solicitacaoStatus}</p>

      <h3>Mensagens</h3>
      {conversa.length === 0 ? (
        <p className="aviso">
          Nenhuma mensagem ainda. Use este espaço para combinar detalhes antes
          de fechar o serviço.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Quem</th>
              <th>Mensagem</th>
              <th>Quando</th>
            </tr>
          </thead>
          <tbody>
            {conversa.map((mensagem) => (
              <tr key={mensagem.id}>
                <td>{mensagem.remetenteId === logado.id ? "Você" : mensagem.remetente}</td>
                <td>{mensagem.conteudo}</td>
                <td>{new Date(mensagem.dataEnvio).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={mandar}>
        <p>
          <label htmlFor="conteudo">Escrever mensagem</label>
          <textarea id="conteudo" name="conteudo" required></textarea>
        </p>
        <p><input type="submit" value="Enviar" /></p>
      </form>

      <p className="aviso">
        Combine tudo por aqui. As mensagens ficam registradas na plataforma e
        servem de comprovação para as duas partes em caso de desacordo.
      </p>

      <p><a href="/conversas">Voltar para minhas conversas</a></p>
    </div>
  );
}
