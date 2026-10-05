import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario, historicoDoContratante } from "@/db/perfil";
import {
  buscarSolicitacao, listarPropostas, propostaDoPrestador,
  enviarProposta, aceitarProposta,
} from "@/db/propostas";
import { cancelarPedido } from "@/db/cancelamentos";
import {
  listarMensagens, enviarMensagem, buscarPropostaAceita,
  buscarPagamento, concluirServico, buscarAvaliacao,
  criarAvaliacao, responderAvaliacao,
} from "@/db/acompanhamento";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitacao({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const solicitacaoId = Number(id);

  const logado = await usuarioLogado();
  const solicitacao = await buscarSolicitacao(solicitacaoId);

  if (!solicitacao) {
    return (
      <div>
        <h2>Pedido não encontrado</h2>
        <p className="aviso">Este pedido não existe ou foi removido.</p>
        <p><a href="/solicitacoes">Voltar</a></p>
      </div>
    );
  }

  const souDono = logado?.id === solicitacao.clienteId;
  const meuPrestador = logado?.tipo === "prestador" ? await buscarPrestadorPorUsuario(logado.id) : null;
  const minhaProposta = meuPrestador ? await propostaDoPrestador(solicitacaoId, meuPrestador.id) : null;
  const propostasRecebidas = souDono ? await listarPropostas(solicitacaoId) : [];
  const historico = !souDono && meuPrestador ? await historicoDoContratante(solicitacao.clienteId) : null;

  const aceita = await buscarPropostaAceita(solicitacaoId);
  const souPrestadorAceito = Boolean(meuPrestador && aceita && aceita.prestadorId === meuPrestador.id);
  const participo = souDono || souPrestadorAceito;

  const pagamento = aceita ? await buscarPagamento(aceita.id) : null;
  const conversa = participo ? await listarMensagens(solicitacaoId) : [];
  const avaliacao = await buscarAvaliacao(solicitacaoId);

  async function mandarProposta(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual || atual.tipo !== "prestador") redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    const jaEnviou = await propostaDoPrestador(solicitacaoId, meu.id);
    if (jaEnviou) redirect(`/solicitacoes/${solicitacaoId}`);
    await enviarProposta({
      solicitacaoId: solicitacaoId,
      prestadorId: meu.id,
      valor: String(formulario.get("valor")),
      prazoDias: Number(formulario.get("prazoDias")),
      mensagem: String(formulario.get("mensagem")).trim(),
    });
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function escolherProposta(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    const pedido = await buscarSolicitacao(solicitacaoId);
    if (!atual || !pedido || pedido.clienteId !== atual.id) redirect(`/solicitacoes/${solicitacaoId}`);
    if (pedido.status !== "aberta") redirect(`/solicitacoes/${solicitacaoId}`);
    await aceitarProposta(Number(formulario.get("propostaId")), solicitacaoId);
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function mandarMensagem(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");

    const pedido = await buscarSolicitacao(solicitacaoId);
    const propostaDoPedido = await buscarPropostaAceita(solicitacaoId);
    const meu = atual.tipo === "prestador" ? await buscarPrestadorPorUsuario(atual.id) : null;

    const podeFalar =
      pedido?.clienteId === atual.id ||
      Boolean(meu && propostaDoPedido && propostaDoPedido.prestadorId === meu.id);

    if (!podeFalar) redirect(`/solicitacoes/${solicitacaoId}`);

    await enviarMensagem({
      solicitacaoId: solicitacaoId,
      remetenteId: atual.id,
      conteudo: String(formulario.get("conteudo")).trim(),
    });

    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function confirmarConclusao() {
    "use server";
    const atual = await usuarioLogado();
    const pedido = await buscarSolicitacao(solicitacaoId);
    if (!atual || !pedido || pedido.clienteId !== atual.id) redirect(`/solicitacoes/${solicitacaoId}`);
    if (pedido.status !== "em andamento") redirect(`/solicitacoes/${solicitacaoId}`);

    const propostaDoPedido = await buscarPropostaAceita(solicitacaoId);
    if (!propostaDoPedido) redirect(`/solicitacoes/${solicitacaoId}`);

    await concluirServico(solicitacaoId, propostaDoPedido.id);
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function salvarAvaliacao(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    const pedido = await buscarSolicitacao(solicitacaoId);
    if (!atual || !pedido || pedido.clienteId !== atual.id) redirect(`/solicitacoes/${solicitacaoId}`);
    if (pedido.status !== "concluida") redirect(`/solicitacoes/${solicitacaoId}`);

    const jaAvaliou = await buscarAvaliacao(solicitacaoId);
    if (jaAvaliou) redirect(`/solicitacoes/${solicitacaoId}`);

    const propostaDoPedido = await buscarPropostaAceita(solicitacaoId);
    if (!propostaDoPedido) redirect(`/solicitacoes/${solicitacaoId}`);

    await criarAvaliacao({
      solicitacaoId: solicitacaoId,
      autorId: atual.id,
      prestadorId: propostaDoPedido.prestadorId,
      nota: Number(formulario.get("nota")),
      comentario: String(formulario.get("comentario")).trim(),
    });

    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function cancelar() {
    "use server";
    const atual = await usuarioLogado();
    if (!atual) redirect("/entrar");
    await cancelarPedido(solicitacaoId, atual.id);
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  async function salvarResposta(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual || atual.tipo !== "prestador") redirect("/entrar");

    const meu = await buscarPrestadorPorUsuario(atual.id);
    const existente = await buscarAvaliacao(solicitacaoId);

    if (!meu || !existente || existente.prestadorId !== meu.id) {
      redirect(`/solicitacoes/${solicitacaoId}`);
    }

    await responderAvaliacao(existente.id, String(formulario.get("resposta")).trim());
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  return (
    <div>
      <h2>{solicitacao.titulo}</h2>

      <p><label>Situação</label>{solicitacao.status}</p>
      <p><label>Categoria</label>{solicitacao.categoria}</p>
      <p><label>Publicado por</label>{solicitacao.cliente}</p>
      <p>
        <label>Local do serviço</label>
        {solicitacao.bairro} - {solicitacao.cidade} - {solicitacao.estado}
        {participo ? ` (${solicitacao.logradouro}, ${solicitacao.numero})` : ""}
      </p>
      <p>
        <label>Data desejada</label>
        {solicitacao.dataDesejada
          ? new Date(solicitacao.dataDesejada).toLocaleDateString("pt-BR")
          : "Não informada"}
      </p>
      <p>
        <label>Orçamento máximo</label>
        {solicitacao.orcamentoMaximo ? `R$ ${solicitacao.orcamentoMaximo}` : "Não informado"}
      </p>

      <h3>Descrição</h3>
      <p>{solicitacao.descricao}</p>

      {historico && (
        <>
          <h3>Sobre quem publicou</h3>
          <p>
            <label>Na plataforma desde</label>
            {historico.dataCadastro
              ? new Date(historico.dataCadastro).toLocaleDateString("pt-BR")
              : "-"}
          </p>
          <p>
            <label>Pedidos publicados</label>
            {historico.pedidos.total}
          </p>
          <p>
            <label>Serviços concluídos</label>
            {historico.pedidos.concluidos}
          </p>
          <p>
            <label>Pedidos cancelados</label>
            {historico.pedidos.cancelados}
          </p>
          <p>
            <label>Notas que costuma dar</label>
            {Number(historico.notasDadas.total) > 0
              ? `${historico.notasDadas.media} de 5, em ${historico.notasDadas.total} avaliação(ões)`
              : "Ainda não avaliou ninguém"}
          </p>
        </>
      )}

      {pagamento && participo && (
        <>
          <h3>Pagamento</h3>
          <p><label>Valor</label>R$ {pagamento.valor}</p>
          <p><label>Situação</label>{pagamento.status}</p>
          {pagamento.status === "retido" && (
            <p className="aviso">
              O valor está retido pela plataforma e será repassado ao prestador
              quando o contratante confirmar que o serviço foi concluído.
            </p>
          )}
        </>
      )}

      {souDono && solicitacao.status === "em andamento" && (
        <p>
          <a href={`/confirmar?acao=concluir&id=${solicitacaoId}&volta=/solicitacoes/${solicitacaoId}`}>
            Confirmar que o serviço foi concluído
          </a>
        </p>
      )}

      {souDono && (
        <>
          <h3>Propostas recebidas ({propostasRecebidas.length})</h3>
          {propostasRecebidas.length === 0 ? (
            <p className="aviso">Nenhuma proposta recebida ainda.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Prestador</th>
                  <th>Valor</th>
                  <th>Prazo</th>
                  <th>Mensagem</th>
                  <th>Situação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {propostasRecebidas.map((proposta) => (
                  <tr key={proposta.id}>
                    <td>
                      <a href={`/prestadores/${proposta.prestadorId}`}>{proposta.prestadorNome}</a>
                      {proposta.verificado ? " (verificado)" : ""}
                      <br />
                      {proposta.anosExperiencia} anos de experiência
                    </td>
                    <td>R$ {proposta.valor}</td>
                    <td>{proposta.prazoDias} dia(s)</td>
                    <td>
                      {proposta.mensagem}
                      <br />
                      <a href={`/conversas/${proposta.id}`}>Conversar</a>
                    </td>
                    <td>{proposta.status}</td>
                    <td>
                      {solicitacao.status === "aberta" && proposta.status === "enviada" ? (
                        <a href={`/confirmar?acao=aceitar&id=${proposta.id}&extra=${solicitacaoId}&volta=/solicitacoes/${solicitacaoId}`}>
                          Aceitar
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {meuPrestador && !souDono && (
        <>
          <h3>Enviar proposta</h3>
          {minhaProposta ? (
            <p className="aviso">
              Você já enviou uma proposta de R$ {minhaProposta.valor} com prazo de{" "}
              {minhaProposta.prazoDias} dia(s). Situação: {minhaProposta.status}.{" "}
              <a href={`/conversas/${minhaProposta.id}`}>Abrir conversa</a>
            </p>
          ) : solicitacao.status !== "aberta" ? (
            <p className="aviso">Este pedido não está mais aberto para propostas.</p>
          ) : (
            <form action={mandarProposta}>
              <p>
                <label htmlFor="valor">Valor do serviço</label>
                <input type="number" id="valor" name="valor" step="0.01" min="0" required />
              </p>
              <p>
                <label htmlFor="prazoDias">Prazo em dias</label>
                <input type="number" id="prazoDias" name="prazoDias" min="1" required />
              </p>
              <p>
                <label htmlFor="mensagem">Mensagem para o contratante</label>
                <textarea id="mensagem" name="mensagem" required></textarea>
              </p>
              <p>
                <input type="submit" value="Enviar proposta" />
              </p>
            </form>
          )}
        </>
      )}

      {participo && aceita && (
        <>
          <h3>Mensagens</h3>
          {conversa.length === 0 ? (
            <p className="aviso">Nenhuma mensagem ainda.</p>
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
                    <td>{mensagem.remetente}</td>
                    <td>{mensagem.conteudo}</td>
                    <td>{new Date(mensagem.dataEnvio).toLocaleString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <form action={mandarMensagem}>
            <p>
              <label htmlFor="conteudo">Escrever mensagem</label>
              <textarea id="conteudo" name="conteudo" required></textarea>
            </p>
            <p>
              <input type="submit" value="Enviar mensagem" />
            </p>
          </form>
        </>
      )}

      {solicitacao.status === "concluida" && (
        <>
          <h3>Avaliação</h3>
          {avaliacao ? (
            <>
              <p><label>Nota</label>{avaliacao.nota} de 5</p>
              <p><label>Comentário</label>{avaliacao.comentario}</p>
              {avaliacao.respostaPrestador ? (
                <p><label>Resposta do prestador</label>{avaliacao.respostaPrestador}</p>
              ) : (
                souPrestadorAceito && (
                  <form action={salvarResposta}>
                    <p>
                      <label htmlFor="resposta">Responder esta avaliação</label>
                      <textarea id="resposta" name="resposta" required></textarea>
                    </p>
                    <p>
                      <input type="submit" value="Enviar resposta" />
                    </p>
                  </form>
                )
              )}
            </>
          ) : souDono ? (
            <form action={salvarAvaliacao}>
              <p>
                <label htmlFor="nota">Nota</label>
                <select id="nota" name="nota" required>
                  <option value="5">5 - Muito bom</option>
                  <option value="4">4 - Bom</option>
                  <option value="3">3 - Regular</option>
                  <option value="2">2 - Ruim</option>
                  <option value="1">1 - Muito ruim</option>
                </select>
              </p>
              <p>
                <label htmlFor="comentario">Comentário</label>
                <textarea id="comentario" name="comentario" required></textarea>
              </p>
              <p>
                <input type="submit" value="Enviar avaliação" />
              </p>
            </form>
          ) : (
            <p className="aviso">Este serviço ainda não foi avaliado.</p>
          )}
        </>
      )}

      {souDono && (solicitacao.status === "aberta" || solicitacao.status === "em andamento") && (
        <>
          <h3>Cancelar pedido</h3>
          <p>
            {solicitacao.status === "aberta"
              ? "As propostas recebidas serão canceladas e o pedido sai do ar."
              : "O serviço será cancelado e o valor retido será devolvido a você."}
          </p>
          <p>
            <a href={`/confirmar?acao=cancelar&id=${solicitacaoId}&volta=/solicitacoes/${solicitacaoId}`}>
              Cancelar este pedido
            </a>
          </p>
        </>
      )}

      {solicitacao.status === "cancelada" && (
        <p className="aviso">Este pedido foi cancelado pelo contratante.</p>
      )}

      <p><a href="/solicitacoes">Voltar para a lista</a></p>
    </div>
  );
}
