import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import {
  buscarSolicitacao, listarPropostas, propostaDoPrestador,
  enviarProposta, aceitarProposta,
} from "@/db/propostas";

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

    if (!atual || !pedido || pedido.clienteId !== atual.id) {
      redirect(`/solicitacoes/${solicitacaoId}`);
    }

    if (pedido.status !== "aberta") {
      redirect(`/solicitacoes/${solicitacaoId}`);
    }

    await aceitarProposta(Number(formulario.get("propostaId")), solicitacaoId);
    redirect(`/solicitacoes/${solicitacaoId}`);
  }

  return (
    <div>
      <h2>{solicitacao.titulo}</h2>

      <p>
        <label>Situação</label>
        {solicitacao.status}
      </p>
      <p>
        <label>Categoria</label>
        {solicitacao.categoria}
      </p>
      <p>
        <label>Publicado por</label>
        {solicitacao.cliente}
      </p>
      <p>
        <label>Local do serviço</label>
        {solicitacao.bairro} - {solicitacao.cidade} - {solicitacao.estado}
        {souDono ? ` (${solicitacao.logradouro}, ${solicitacao.numero})` : ""}
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
                    <td>{proposta.mensagem}</td>
                    <td>{proposta.status}</td>
                    <td>
                      {solicitacao.status === "aberta" && proposta.status === "enviada" ? (
                        <form action={escolherProposta}>
                          <input type="hidden" name="propostaId" value={proposta.id} />
                          <input type="submit" value="Aceitar" />
                        </form>
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
              {minhaProposta.prazoDias} dia(s). Situação: {minhaProposta.status}.
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
                <textarea
                  id="mensagem"
                  name="mensagem"
                  placeholder="Explique o que está incluso no valor e como você pretende fazer o serviço."
                  required
                ></textarea>
              </p>
              <p>
                <input type="submit" value="Enviar proposta" />
              </p>
            </form>
          )}
        </>
      )}

      <p><a href="/solicitacoes">Voltar para a lista</a></p>
    </div>
  );
}
