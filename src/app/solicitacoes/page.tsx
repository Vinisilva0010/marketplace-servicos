import { usuarioLogado } from "@/lib/sessao";
import { listarCategorias } from "@/db/queries";
import { listarSolicitacoes } from "@/db/solicitacoes";

export const dynamic = "force-dynamic";

export default async function PaginaSolicitacoes({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string; status?: string }>;
}) {
  const parametros = await searchParams;
  const logado = await usuarioLogado();
  const verMeus = parametros.ver === "meus" && logado;

  const pedidos = verMeus
    ? await listarSolicitacoes({ clienteId: logado.id })
    : await listarSolicitacoes(
        parametros.status ? { status: parametros.status } : { status: "aberta" }
      );

  await listarCategorias();

  return (
    <div>
      <h2>{verMeus ? "Meus pedidos" : "Pedidos abertos"}</h2>

      <p>
        <a href="/solicitacoes">Pedidos abertos</a>
        {" | "}
        <a href="/solicitacoes?status=em andamento">Em andamento</a>
        {" | "}
        <a href="/solicitacoes?status=concluida">Concluídos</a>
        {" | "}
        <a href="/solicitacoes?status=cancelada">Cancelados</a>
        {logado && (
          <>
            {" | "}
            <a href="/solicitacoes?ver=meus">Meus pedidos</a>
          </>
        )}
      </p>

      {pedidos.length === 0 ? (
        <p className="aviso">Nenhum pedido encontrado.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Categoria</th>
              <th>Local</th>
              <th>Data desejada</th>
              <th>Orçamento</th>
              <th>Propostas</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id}>
                <td>
                  <a href={`/solicitacoes/${pedido.id}`}>{pedido.titulo}</a>
                  <br />
                  por {pedido.cliente}
                </td>
                <td>{pedido.categoria}</td>
                <td>{pedido.bairro} - {pedido.cidade}</td>
                <td>
                  {pedido.dataDesejada
                    ? new Date(pedido.dataDesejada).toLocaleDateString("pt-BR")
                    : "-"}
                </td>
                <td>{pedido.orcamentoMaximo ? `R$ ${pedido.orcamentoMaximo}` : "-"}</td>
                <td>{pedido.totalPropostas}</td>
                <td>{pedido.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
