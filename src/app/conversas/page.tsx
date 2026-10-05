import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { buscarPrestadorPorUsuario } from "@/db/perfil";
import { conversasDoContratante, conversasDoPrestador } from "@/db/chat";

export const dynamic = "force-dynamic";

export default async function PaginaConversas() {
  const logado = await usuarioLogado();
  if (!logado) redirect("/entrar");

  let conversas: Awaited<ReturnType<typeof conversasDoContratante>> = [];

  if (logado.tipo === "prestador") {
    const prestador = await buscarPrestadorPorUsuario(logado.id);
    if (prestador) {
      conversas = await conversasDoPrestador(prestador.id);
    }
  } else {
    conversas = await conversasDoContratante(logado.id);
  }

  return (
    <div>
      <h2>Minhas conversas</h2>
      <p>Cada proposta tem a sua conversa, para você combinar detalhes antes de fechar.</p>

      {conversas.length === 0 ? (
        <p className="aviso">
          Você ainda não tem conversas. Elas aparecem quando uma proposta é
          enviada em um pedido.
        </p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Com quem</th>
              <th>Valor da proposta</th>
              <th>Situação</th>
              <th>Mensagens</th>
              <th>Última mensagem</th>
            </tr>
          </thead>
          <tbody>
            {conversas.map((conversa) => (
              <tr key={conversa.propostaId}>
                <td>
                  <a href={`/conversas/${conversa.propostaId}`}>
                    {conversa.solicitacaoTitulo}
                  </a>
                </td>
                <td>{conversa.outraPessoa}</td>
                <td>R$ {conversa.valor}</td>
                <td>{conversa.statusProposta}</td>
                <td>{conversa.totalMensagens}</td>
                <td>
                  {conversa.ultimaMensagem
                    ? new Date(conversa.ultimaMensagem).toLocaleString("pt-BR")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
