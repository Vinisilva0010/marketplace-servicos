import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import { listarPropostasDoPrestador } from "@/db/propostas";
import { retirarProposta } from "@/db/cancelamentos";

export const dynamic = "force-dynamic";

export default async function PaginaMinhasPropostas() {
  const logado = await usuarioLogado();

  if (!logado) {
    redirect("/entrar");
  }

  if (logado.tipo !== "prestador") {
    redirect("/");
  }

  const prestador = await buscarPrestadorPorUsuario(logado.id);

  if (!prestador) {
    redirect("/perfil");
  }

  const minhasPropostas = await listarPropostasDoPrestador(prestador.id);

  async function retirar(formulario: FormData) {
    "use server";
    const atual = await usuarioLogado();
    if (!atual || atual.tipo !== "prestador") redirect("/entrar");
    const meu = await buscarPrestadorPorUsuario(atual.id);
    if (!meu) redirect("/perfil");
    await retirarProposta(Number(formulario.get("propostaId")), meu.id);
    redirect("/propostas");
  }

  return (
    <div>
      <h2>Minhas propostas</h2>

      {minhasPropostas.length === 0 ? (
        <p className="aviso">
          Você ainda não enviou propostas. Veja os pedidos abertos em{" "}
          <a href="/solicitacoes">Buscar pedidos</a>.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
              <th>Contratante</th>
              <th>Cidade</th>
              <th>Meu valor</th>
              <th>Prazo</th>
              <th>Minha proposta</th>
              <th>Situação do pedido</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {minhasPropostas.map((proposta) => (
              <tr key={proposta.id}>
                <td>
                  <a href={`/solicitacoes/${proposta.solicitacaoId}`}>
                    {proposta.solicitacaoTitulo}
                  </a>
                </td>
                <td>{proposta.categoria}</td>
                <td>{proposta.contratante}</td>
                <td>{proposta.cidade}</td>
                <td>R$ {proposta.valor}</td>
                <td>{proposta.prazoDias} dia(s)</td>
                <td>{proposta.status}</td>
                <td>{proposta.solicitacaoStatus}</td>
                <td>
                  {proposta.status === "enviada" && proposta.solicitacaoStatus === "aberta" ? (
                    <form action={retirar}>
                      <input type="hidden" name="propostaId" value={proposta.id} />
                      <input type="submit" value="Retirar" />
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
    </div>
  );
}
