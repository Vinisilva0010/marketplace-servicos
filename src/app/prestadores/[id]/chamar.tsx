import { redirect } from "next/navigation";
import { usuarioLogado } from "@/lib/sessao";
import { pedidosAbertosDoContratante, enviarConvite, conviteJaEnviado } from "@/db/convites";

export default async function ChamarProfissional({
  prestadorId,
  prestadorNome,
}: {
  prestadorId: number;
  prestadorNome: string;
}) {
  const logado = await usuarioLogado();

  if (!logado) {
    return (
      <>
        <h3>Chamar este profissional</h3>
        <p>
          <a href="/entrar">Entre</a> ou{" "}
          <a href="/cadastro?tipo=cliente">crie seu cadastro</a> para chamar{" "}
          {prestadorNome} em um pedido.
        </p>
      </>
    );
  }

  if (logado.tipo !== "cliente") {
    return null;
  }

  const meusPedidos = await pedidosAbertosDoContratante(logado.id);

  async function chamar(formulario: FormData) {
    "use server";

    const atual = await usuarioLogado();
    if (!atual || atual.tipo !== "cliente") redirect("/entrar");

    const solicitacaoId = Number(formulario.get("solicitacaoId"));
    const pedidos = await pedidosAbertosDoContratante(atual.id);
    const meu = pedidos.find((pedido) => pedido.id === solicitacaoId);

    if (!meu) redirect(`/prestadores/${prestadorId}`);

    await enviarConvite(solicitacaoId, prestadorId);
    redirect(`/prestadores/${prestadorId}?convite=1`);
  }

  return (
    <>
      <h3>Chamar este profissional</h3>
      {meusPedidos.length === 0 ? (
        <p>
          Você não tem nenhum pedido aberto no momento.{" "}
          <a href="/solicitacoes/nova">Publicar um pedido</a> para poder chamar{" "}
          {prestadorNome}.
        </p>
      ) : (
        <form action={chamar}>
          <p>
            <label htmlFor="solicitacaoId">Escolha um dos seus pedidos abertos</label>
            <select id="solicitacaoId" name="solicitacaoId" required>
              {meusPedidos.map((pedido) => (
                <option key={pedido.id} value={pedido.id}>
                  {pedido.titulo} ({pedido.categoria})
                </option>
              ))}
            </select>
          </p>
          <p>
            <input type="submit" value={`Chamar ${prestadorNome} neste pedido`} />
          </p>
          <p>
            O pedido continua aberto para outros profissionais. Chamar alguém só
            faz o pedido aparecer em destaque para essa pessoa.
          </p>
        </form>
      )}
    </>
  );
}
